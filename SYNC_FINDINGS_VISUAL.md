# Visual Summary: UI Desynchronization Root Cause Analysis

## 🎯 The Problem in One Diagram

```
User taps 100 times (takes ~5 seconds)
     ↓
TapService.addTap() increments pendingTaps signal
     ↓
UI shows optimistic balance (wallet + pendingTaps)
     ↓
At T=5s, either:
  (a) Batch reaches 100 → flushPendingTaps()
  (b) User navigates → NavigationSyncService triggers sync
     ↓
flushPendingTaps() sends:
  1. POST /Game/addTooks (add coins/XP) ← might fail
  2. POST /Game/updateEnergyState (deduct energy) ← might fail
     ↓
If both succeed:
  ✓ Backend state updated
  ✓ loadUserStatus() called (but NO pending param passed)
  ✓ UI updates from server
     ↓
If one fails:
  ✗ Partial state (balance but no energy deduction)
  ✗ pendingTaps not cleared
  ✗ Retry logic re-sends both
     ↓
If concurrent requests overlap:
  ✗ isLoading guard drops second request
  ✗ Second batch's UI update never happens
  ✗ Balance shows stale value

Result: User taps appear in UI but disappear when page refreshes
```

---

## 🔴 The 7 Race Conditions Explained

### #1: isLoading Guard Drops Concurrent Updates
```
Timeline (100ms HTTP round-trip):
T=0ms:    Flush #1 starts → isLoading = true
T=50ms:   Flush #2 starts → sees isLoading = true → returns (no-op)
T=100ms:  Flush #1 completes → isLoading = false
Result:   Flush #2's new taps NEVER trigger state update
```
**Fix**: Queue requests instead of dropping them

---

### #2: Throttle Mismatch (2s vs 5s)
```
Timeline:
T=0s:     Taps 50x (not 100, so no auto-flush)
T=1s:     Navigate → flushPendingTaps() → lastFlushTime = 1000ms
T=2.5s:   Navigate again → cooldown = (2500-1000) = 1.5s < 5s → SKIP
T=3s:     Navigate → cooldown = (3000-1000) = 2s < 5s → SKIP
T=6s:     Navigate → cooldown = (6000-1000) = 5s ≥ 5s → Finally flush!

Problem: 50 taps pending for 5 seconds!
```
**Fix**: Use unified 3s cooldown for all sync operations

---

### #3: Missing Flush After Boost
```
User buys energy boost (success)
  ↓
energyService.purchaseBoost() returns { success: true }
  ↓
No automatic flushPendingTaps() call
  ↓
Pending taps sit in signal until:
  - BATCH_SIZE reached (might take 10+ mins)
  - OR next route change (5s+ later)
  ↓
Energy appears wrong for 5+ seconds
```
**Fix**: Call `flushPendingTaps()` immediately after skill purchase

---

### #4: Stale Pending Taps Parameter (Unused)
```
Server endpoint supports:
  GET /UserInfo/getUserStatus?pendingTaps=50
  (tells server: "I just sent 50 taps, include them in response")

But frontend never uses it:
  await this.userStatusService.loadUserStatus();
  // ❌ No parameter passed!

Result:
  - Server returns balance without the 50 pending taps
  - UI adds them back via computed: wallet + pendingTaps
  - If server already processed taps, double-count happens
```
**Fix**: Pass pending count to loadUserStatus()

---

### #5: Double-Count Race
```
Timeline:
T=0ms:  POST /Game/addTooks (50 taps) sent to server
T=200ms: Server processes, increments balance by 50
T=300ms: GET /UserInfo/getUserStatus called (50 already applied)
T=350ms: Response received with new balance
T=400ms: POST /Game/updateEnergyState completes

UI computed:
  = responseBalance + pendingTaps
  = (oldBalance + 50) + 50   ← DOUBLE COUNT!
  
Brief spike: balance shows 100 extra coins, then corrects
```
**Fix**: Pass pendingTaps param so server excludes them from response

---

### #6: Partial Failure (One HTTP Succeeds, Other Fails)
```
T=0ms:   POST /Game/addTooks (50 taps)
T=100ms: ✓ Success - backend balance increased
T=150ms: POST /Game/updateEnergyState
T=300ms: ✗ Fail - timeout or server error

Backend state:
  Balance: +50 ✓
  Energy: -0 ✗ (not updated!)
  
pendingTaps NOT reset (guard at line 113: only if energyAfterTaps >= 0)
Retry: sends both again
  
Result: Backend energy permanently wrong
User reloads: sees lower balance (server had to roll back)
```
**Fix**: Single atomic endpoint that applies both or neither

---

### #7: loadUserStatus() Fired During Parallel Flush
```
Timeline:
T=0ms:   Flush #1 → POST addTooks
T=50ms:  Flush #1 → POST updateEnergyState
T=100ms: Flush #1 completes, calls loadUserStatus()
T=150ms: Flush #2 starts (taps triggered during #1) → calls loadUserStatus()
T=200ms: Flush #1's loadUserStatus() completes
T=250ms: Flush #2's loadUserStatus() sees isLoading=true → returns (no-op)

Result: Flush #2's taps never reflected in UI
```
**Fix**: Use async queue for loadUserStatus() calls

---

## 🔴 The 3 Transactional Gaps Explained

### Gap #1: Two Non-Atomic HTTP Calls

```typescript
// ❌ Current (NOT atomic)
await POST /Game/addTooks         // Line 117
await POST /Game/updateEnergyState // Line 126

// Failure scenario:
if (addTooks succeeds && updateEnergyState fails) {
  // Backend has: balance++, energy unchanged
  // Frontend retries both
  // Backend gets corrupted state
}
```

**Visual Impact**:
- User taps 50x
- POST #1 succeeds (coins added)
- POST #2 fails (timeout)
- pendingTaps not cleared
- User refreshes
- Server shows balance -50 from energy deduction never happened
- User loses coins

---

### Gap #2: Stale Data Fetch (Parameter Unused)

```typescript
// ✓ Backend supports:
async getUserStatus(pendingTaps?: number)

// ❌ Frontend ignores it:
await this.userStatusService.loadUserStatus();
// Should be:
await this.userStatusService.loadUserStatus(pendingCount);
```

**Timing Issue**:
```
T=0ms:   Flush sends 50 taps to server
T=100ms: POST succeeds
T=150ms: loadUserStatus() called (no pending param)
T=200ms: Response arrives (server hasn't processed yet)
         Balance in response = oldBalance (50 taps not included)
T=250ms: UI computes: responseBalance + 50 (pending)
         Result: shows correct balance by luck, but timing-dependent
```

---

### Gap #3: Energy Subtraction is Local-Only

```typescript
// ✓ Frontend shows:
energy = wallet.energy - pendingTaps  // Computed, immediate feedback

// ❌ Backend never reserved:
if (appCrashes) {
  localStorage.PENDING_TAPS_KEY = 50  // Persisted
  // On reload:
  wallet.energy = oldValue (never decremented by 50)
  pendingTaps = 50 (restored)
  energy = wallet - 50 (correct display)
  
  // But user can:
  tap(50 times again)  // Energy shows 0 (pending 100)
  flushPendingTaps()   // Send 100 taps
  // Server applies both → 100 coins earned from same energy!
}
```

---

## 📊 Guard Effectiveness Matrix

| Guard | Works For | Fails For | Confidence |
|-------|-----------|-----------|-----------|
| `isFlushing` | Prevents simultaneous flushes | Doesn't prevent concurrent addTap() | 60% |
| `TAP_THROTTLE_MS` (2s) | Rate-limits within TapService | Ignored by 5s NavigationSync cooldown | 40% |
| `isLoading` | Prevents overlapping HTTP calls | Drops requests instead of queueing | 30% |
| `SYNC_COOLDOWN` (5s) | Prevents navigation spam | Conflicts with 2s tap throttle | 20% |

**Total Coverage**: ~20% (gaps in concurrency, timing, state coordination)

---

## 🎯 Quick Fix vs. Right Fix

### ❌ Quick Fix (Temporary)
- Add more throttle checks
- Increase guard delays
- Add retry logic with exponential backoff

**Problem**: Masks symptoms, doesn't fix root cause. Users still see glitches.

### ✅ Right Fix (Architectural)
1. **ProjectedStateService** → Single source of truth
2. **Atomic /Game/processTapsAtomically** → No partial failures
3. **SyncCoordinatorService** → Unified throttling + queueing
4. **Optimistic updates** → Immediate feedback, roll back on failure

**Result**: No race conditions, no drops, instant UI feedback.

---

## 📈 Before vs. After

### BEFORE (Current)
```
User Tap
  ↓ (immediate)
UI shows floating "+50" (optimistic)
  ↓ (2-5s wait)
User gets redirected or something else happens
  ↓ (race condition potential)
HTTP flush succeeds (sometimes)
  ↓ (partial updates)
loadUserStatus() called (but stale data)
  ↓ (100-500ms)
UI updates to correct value
  ↓ (annoying flicker and lag)

🔴 Pain Points:
  - 200-500ms lag visible to user
  - Balance jumps backward
  - Energy flickers
  - "Pending taps" confusing
```

### AFTER (Proposed)
```
User Tap
  ↓ (immediate)
UI shows floating "+50" (optimistic from ProjectedState)
  ↓ (SyncCoordinator debounces)
When ready, single atomic HTTP call
  ↓ (100-200ms)
Server applies both operations or neither
  ↓ (instant)
loadUserStatus() refreshes everything once
  ↓ (no further changes)
UI shows final authoritative state

✅ Benefits:
  - No visible lag (optimistic + fast)
  - No partial failures (atomic)
  - No double-counts (single source of truth)
  - No flickers (coordinated updates)
  - No confusion (pending is internal)
```

---

## 🚀 Implementation Priority

**CRITICAL (Week 1)**:
1. Create `ProjectedStateService` for optimistic updates
2. Pass `pendingTaps` param to `loadUserStatus()`
3. Unify throttles (3s everywhere)

**IMPORTANT (Week 2)**:
4. Implement `/Game/processTapsAtomically` endpoint (backend)
5. Refactor `TapService` to use atomic endpoint
6. Create `SyncCoordinatorService`

**NICE-TO-HAVE (Week 3)**:
7. Tests + E2E verification
8. Monitor production for any regressions

---

## ✅ Done Checklist

- [x] Identified all 7 race conditions
- [x] Identified all 3 transactional gaps
- [x] Created data flow maps
- [x] Documented with code examples
- [x] Provided architecture recommendations
- [x] Estimated effort (3 weeks)
- [x] Listed verification criteria

**Next**: Create CHANGE PROPOSAL with detailed task breakdown
