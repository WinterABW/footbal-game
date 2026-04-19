# Exploration Report: Synchronization Logic in footbal-game

## Executive Summary

The footbal-game has **7 critical race conditions** and **3 transactional gaps** causing recurring UI desynchronization (balance, energy, level out of sync with backend). The root cause is a **lack of coordinated state management** between:

1. **TapService** (manages pending taps and batch flushing)
2. **EnergyService** (computes energy by subtracting pending taps)
3. **UserStatusService** (loads server state, gated by `isLoading` flag)
4. **NavigationSyncService** (triggers sync on route changes)

---

## 1. DATA FLOW MAP

### Flow A: User Tap → Backend Flush → UI Update

```
┌─────────────────────────────────────────────────────────────────┐
│ USER INTERACTION (tap-area.component.ts:120-165)                │
│                                                                   │
│ 1. tap() method called on pointer event                          │
│ 2. Check: energySvc.energy() > 0? (line 122-126)               │
│ 3. Call: tapSvc.addTap(1) — increments pendingTaps signal      │
│ 4. Update: floatingNumbers UI (immediate, optimistic)           │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │ TapService (line 72-81)  │
                    │                          │
                    │ addTap(count):           │
                    │ - pendingTaps += count   │
                    │ - If >= BATCH_SIZE (100) │
                    │   → flushPendingTaps()   │
                    └───────────┬──────────────┘
                                │
                    ┌───────────▼──────────────────┐
                    │ flushPendingTaps (line 84+)  │
                    │                              │
                    │ Guard 1: if isFlushing → ret │
                    │ Guard 2: if < 2s throttle →  │
                    │          return              │
                    │                              │
                    │ HTTP 1: POST /Game/addTooks  │
                    │ (line 117-120)               │
                    │ ───────────────────────      │
                    │ HTTP 2: POST /Game/         │
                    │ updateEnergyState            │
                    │ (line 126-129)               │
                    │ ───────────────────────      │
                    │ AWAIT: loadUserStatus()      │
                    │ (line 142)                   │
                    │ – NO PARAMS PASSED!          │
                    └───────────┬──────────────────┘
                                │
                    ┌───────────▼────────────────────┐
                    │ UserStatusService (line 110+)  │
                    │                                │
                    │ loadUserStatus(pendingTaps?):  │
                    │ Guard: if isLoading() → return │
                    │ (DROPS concurrent calls!)      │
                    │                                │
                    │ HTTP: GET /UserInfo/          │
                    │       getUserStatus?[params]  │
                    │ – NEVER passes pendingTaps!    │
                    │                                │
                    │ Update signals:                │
                    │ - wallet.set(data.wallet)     │
                    │ - totalTooks = wallet.tooks   │
                    │ - level (computed)             │
                    └───────────┬────────────────────┘
                                │
                    ┌───────────▼────────────────────┐
                    │ Component UI Update (computed) │
                    │                                │
                    │ TapService.coins computed:    │
                    │  = wallet.balance +           │
                    │    pendingTaps()               │
                    │                                │
                    │ EnergyService.energy computed: │
                    │  = wallet.energy -             │
                    │    pendingTaps()               │
                    │                                │
                    │ UserStatusService.level:       │
                    │  = threshold(wallet.tooks)     │
                    └────────────────────────────────┘
```

### Flow B: Route Change → Navigation Sync

```
┌──────────────────────────────────────┐
│ Router.NavigationEnd event           │
│ (navigation-sync.service.ts:32-36)   │
└──────────────┬───────────────────────┘
               │
    ┌──────────▼──────────────┐
    │ shouldSyncOnRoute?       │
    │ URL in SYNC_ROUTES?      │
    │ (/main, /social, etc)    │
    └──────────┬───────────────┘
               │ YES
    ┌──────────▼──────────────────┐
    │ syncPendingTaps()            │
    │ (line 47-80)                 │
    │                              │
    │ Guard 1: isAuthenticated()? │
    │ Guard 2: 5s COOLDOWN check   │
    │          if < 5s → return    │
    │                              │
    │ pendingCount =               │
    │   tapSvc.pendingTapsCount()  │
    │                              │
    │ If pendingCount > 0:         │
    │   await tapSvc.              │
    │    flushPendingTaps()         │
    └──────────────────────────────┘
```

### Flow C: Energy/Level Skills Loading

```
┌────────────────────────────────┐
│ GameLayoutComponent (line 66+) │
│ effect(() => {                 │
│  if (userStatus())             │
│    energySvc.loadAllSkills()   │
│ })                             │
└────────────┬───────────────────┘
             │
  ┌──────────▼────────────────────┐
  │ EnergyService.loadMaxEnergy()  │
  │ (line 72-103)                  │
  │                                │
  │ effect() watches:              │
  │ skillsLevelReport.maxEnergyLVL │
  │                                │
  │ Guard: if already loading → ret│
  │ Guard: if level unchanged →    │
  │        return                  │
  │                                │
  │ HTTP: POST /Game/getSkillInfo  │
  │       skillId: 2               │
  │                                │
  │ _maxEnergy.set(result[lvl])   │
  └────────────────────────────────┘
```

---

## 2. INCONSISTENCY MATRIX

| Race Condition | File:Line | Symptom | Root Cause | Impact |
|---|---|---|---|---|
| **#1: Concurrent loadUserStatus()** | `user-status.service.ts:110-112` | Balance/Energy disappears or shows stale values | `isLoading()` guard drops concurrent calls without waiting. Second tap triggers `loadUserStatus()` while first is still fetching. Caller thinks update succeeded but signal wasn't set. | Balance can jump backward; Energy bar flickers |
| **#2: Throttle Mismatch** | `tap.service.ts:87` (2s) vs `navigation-sync.service.ts:58` (5s) | Taps don't flush when navigating within 5s window | TapService's 2s throttle is insufficient. NavigationSyncService enforces 5s cooldown. If user taps > 2s after first sync but < 5s from first route change, flush is skipped. | Pending taps lost if user switches routes quickly |
| **#3: Missing Flush After Energy Boost** | `energy.service.ts:163-179` | New skill level loaded but balance still waiting to sync | `purchaseBoost()` succeeds but doesn't trigger `flushPendingTaps()`. Pending taps remain in signal until next BATCH_SIZE or route change. | User sees pending taps for 5+ seconds after skill purchase |
| **#4: Stale pendingTaps in loadUserStatus()** | `tap.service.ts:142` | Backend sees taps but UI doesn't credit them | `loadUserStatus()` is called AFTER flush, but NO pendingTaps parameter passed (line 137 in UserInfoService allows it but never used). Server doesn't know about in-flight taps. | Balance updates late; can appear as "stall" in UI |
| **#5: Double-Count Race** | `tap.service.ts:62` (coins computed) | Balance jumps forward by pendingTaps when server catches up | TapService.coins = wallet.balance + pendingTaps. If `addTooks` succeeds and server increments balance BEFORE `updateEnergyState` completes, reading `loadUserStatus()` result adds pendingTaps again. | Brief balance spike |
| **#6: Partial Failure on Energy Update** | `tap.service.ts:126-129` | Energy shows wrong value; balance correct | `addTooks` succeeds (POST 1) but `updateEnergyState` fails (POST 2). `pendingTaps` not reset (guard on line 113). On retry, both calls sent again. Server has taps but wrong energy state. | Energy bar shows old value; potential XP loss |
| **#7: loadUserStatus() Fired During Flush** | `tap.service.ts:142` | Two concurrent HTTP calls to getUserStatus() | `flushPendingTaps()` awaits both POST calls, then immediately calls `loadUserStatus()`. If second tap triggers `addTap()` → `flushPendingTaps()` in parallel, second `loadUserStatus()` call is dropped by `isLoading()` guard. | Latest taps not reflected in UI |

---

## 3. TRANSACTIONAL GAPS

### Gap #1: Two Separate HTTP Calls for One Atomic Action

**File**: `tap.service.ts:117-129`

```typescript
// ❌ NOT ATOMIC – TWO separate calls:
// 1. addTooks (increment balance/XP)
const tooksUrl = `${this.baseUrl}Game/addTooks`;
await firstValueFrom(
  this.http.post(tooksUrl, { amount: pendingCount, ... })
);

// 2. updateEnergyState (decrement energy)
const energyUrl = `${this.baseUrl}Game/updateEnergyState`;
await firstValueFrom(
  this.http.post(energyUrl, { energy: energyAfterTaps, ... })
);
```

**Problem**: If first succeeds and second fails:
- Backend: balance increased, energy NOT decreased
- Frontend: `pendingTaps` not reset, retries both calls
- Result: Backend energy is **wrong**, but UI thinks it's correct until next sync

**Symptom**: User taps, balance goes up, then on refresh balance is lower (server didn't apply energy deduction)

---

### Gap #2: Stale Data Fetch After Flush

**File**: `tap.service.ts:142`

```typescript
// After both HTTP calls, fetch latest state
await this.userStatusService.loadUserStatus();
// ❌ PROBLEM: No parameter passed!
// Backend doesn't know about pendingCount just sent
// Could return stale data if server hasn't persisted yet
```

**Expected Fix** (not yet used):
```typescript
await this.userStatusService.loadUserStatus(pendingCount);
// Tells backend: "I just sent N taps, please include in response"
```

**Symptom**: Balance doesn't update for 1-2 seconds after flush

---

### Gap #3: Energy Subtraction is Local-Only

**File**: `energy.service.ts:19-23`

```typescript
readonly energy = computed(() => {
  const walletEnergy = this.userStatusService.wallet()?.energy ?? 0;
  const pendingTaps = this.tapService.pendingTapsCount();
  return Math.max(0, walletEnergy - pendingTaps);
});
```

**Problem**: This is a **frontend-only calculation**. If app crashes between `addTap()` and `flushPendingTaps()`:
1. `localStorage.PENDING_TAPS_KEY` persists the count
2. On reload, `restorePendingTaps()` reconstructs the signal
3. **BUT** backend never deducted energy, so it's "recovered"
4. User can spend the same energy twice

**Symptom**: After crash/reload, energy appears fully refilled despite "spent" taps

---

## 4. THROTTLING & TIMING CONFLICTS

### TapService Throttle: 2000ms
- **Purpose**: Prevent rapid successive flush calls
- **Code**: `if (Date.now() - this.lastFlushTime < 2000) return;` (line 87)
- **When Triggered**: Called from `addTap()` when batch reaches 100, or manually

### NavigationSyncService Cooldown: 5000ms
- **Purpose**: Prevent route-change spam from triggering too many syncs
- **Code**: `if (now - this.lastSyncTime < this.SYNC_COOLDOWN) return;` (line 58)
- **When Triggered**: On every NavigationEnd event for SYNC_ROUTES

### Conflict Scenario:
```
T=0s:    User taps 50 times → addTap() doesn't trigger flush (< BATCH_SIZE)
T=1s:    User navigates to /wallet → NavigationSyncService.syncPendingTaps()
         → calls flushPendingTaps()
         → sets lastFlushTime = T=1000ms
         
T=2.5s:  User navigates to /social → NavigationSyncService checks cooldown
         → (2.5s - 1s) = 1.5s < 5s cooldown
         → ❌ SKIPS FLUSH despite having pending taps!
         
T=3s:    User navigates again, but now (3s - 1s) = 2s < 5s
         → ❌ STILL SKIPPED
         
T=6s:    Now cooldown elapsed. Finally flushes.
         → But 1+ minutes of taps could be pending
```

**Result**: User's taps are invisible to backend for several seconds

---

## 5. ISLOADING GUARD BEHAVIOR

**File**: `user-status.service.ts:110-115`

```typescript
async loadUserStatus(pendingTaps?: number): Promise<void> {
  // ❌ SILENTLY DROP concurrent calls
  if (this.isLoading()) return;  // Returns void, no await
  
  this.isLoading.set(true);
  // ... HTTP call
}
```

**Scenario**:
```
T=0ms:    Tap #1 triggers flushPendingTaps()
          → calls loadUserStatus() [starts HTTP call]
          → sets isLoading = true
          
T=50ms:   Tap #2 triggers flushPendingTaps() (concurrent!)
          → calls loadUserStatus()
          → ❌ Guard: isLoading() is true
          → return (no-op, no await)
          → Caller thinks update succeeded but signal unchanged
          
T=500ms:  First HTTP call completes
          → sets isLoading = false
          → signals updated
          
Result:   Second taps NEVER trigger a state update
```

**Impact**: If two flushes happen within the same HTTP round-trip time (200-500ms), second one is silently dropped.

---

## 6. KEY ARCHITECTURAL ISSUES

### Issue #1: No Optimistic Updates
- UI waits for backend response before updating
- Creates perceptible 200-500ms lag between tap and balance update
- Computes energy/balance from signals tied to backend response

### Issue #2: No Transaction Coordinator
- `addTooks` and `updateEnergyState` are independent HTTP calls
- No rollback mechanism if one fails
- Partial state is never detected or corrected

### Issue #3: No Request Queue
- Concurrent `loadUserStatus()` calls are dropped, not queued
- No centralized sync point
- Each caller manages its own retry logic

### Issue #4: Pending Taps Exposed to Multiple Consumers
- `TapService.coins` computed uses `pendingTaps()` signal
- `EnergyService.energy` computed uses `pendingTaps()` signal
- `NavigationSyncService` reads `pendingTapsCount()`
- No single source of truth for "current projected balance"

### Issue #5: No Deduplication
- Same taps can be flushed twice if `flushPendingTaps()` called multiple times
- Relies on `isFlushing` flag + throttle (fragile)

---

## 7. CURRENT GUARDS (NOT SUFFICIENT)

| Guard | Location | What it Does | What it Misses |
|---|---|---|---|
| `isFlushing` flag | tap.service.ts:100 | Prevents overlapping flush calls | Doesn't protect against concurrent `addTap()` calls |
| `TAP_THROTTLE_MS` (2s) | tap.service.ts:87 | Rate-limits flush attempts | Misaligned with 5s navigation cooldown |
| `isLoading` flag | user-status.service.ts:112 | Prevents overlapping HTTP calls | Drops new requests instead of queueing them |
| `SYNC_COOLDOWN` (5s) | navigation-sync.service.ts:58 | Rate-limits route-change syncs | Conflicts with 2s tap throttle |

---

## 8. REFACTORING RECOMMENDATIONS

### Phase 1: Single Source of Truth (Optimistic Projection)

```typescript
// NEW: ProjectedStateService
@Injectable({ providedIn: 'root' })
export class ProjectedStateService {
  private backend = inject(UserStatusService);
  private auth = inject(AuthService);

  // Server state (read-only)
  readonly serverBalance = computed(() => this.backend.wallet()?.principalBalance ?? 0);
  readonly serverEnergy = computed(() => this.backend.wallet()?.energy ?? 0);
  readonly serverTotalTooks = computed(() => this.backend.wallet()?.totalTooks ?? 0);

  // Pending operations (optimistic)
  readonly pendingTapBatches = signal<{ taps: number; timestamp: number }[]>([]);
  
  // Projected values (what UI should show)
  readonly projectedBalance = computed(() => 
    this.serverBalance() + 
    this.pendingTapBatches().reduce((sum, b) => sum + b.taps, 0)
  );
  
  readonly projectedEnergy = computed(() => 
    this.serverEnergy() - 
    this.pendingTapBatches().reduce((sum, b) => sum + b.taps, 0)
  );
  
  readonly projectedTotalTooks = computed(() =>
    this.serverTotalTooks() +
    this.pendingTapBatches().reduce((sum, b) => sum + b.taps, 0)
  );

  addPendingTaps(count: number): void {
    this.pendingTapBatches.update(batches => [
      ...batches,
      { taps: count, timestamp: Date.now() }
    ]);
  }

  clearPendingTaps(): void {
    this.pendingTapBatches.set([]);
  }
}
```

**Benefits**:
- UI always has a consistent, projected value
- Optimistic updates feel instant
- Easy to rollback if flush fails
- Single compute path for balance/energy

---

### Phase 2: Atomic Flush with Transactional Guarantee

```typescript
// TapService refactor
async flushPendingTaps(): Promise<void> {
  if (this.isFlushing) return;
  if (!this.shouldFlush()) return; // Unified throttle check
  
  const pendingCount = this.projectedState.pendingTapBatches().length > 0 
    ? this.projectedState.pendingTapBatches()
    : [];

  this.isFlushing = true;
  
  try {
    // ATOMIC: Send one payload with both operations
    const payload = {
      taps: pendingCount.reduce((sum, b) => sum + b.taps, 0),
      expectedEnergyAfter: this.projectedState.projectedEnergy(),
      timestamp: Math.floor(Date.now() / 1000),
    };
    
    // Server applies BOTH or NEITHER
    await firstValueFrom(
      this.http.post(`${this.baseUrl}Game/processTapsAtomically`, payload)
    );

    // On success, clear optimistic state
    this.projectedState.clearPendingTaps();
    
    // Fetch fresh state (including server-calculated level)
    await this.userStatusService.loadUserStatus();
    
  } catch (error) {
    // On failure, optimistic state remains (will retry)
    console.error('Flush failed:', error);
    // Retry logic handled by next trigger
  } finally {
    this.isFlushing = false;
    this.lastFlushTime = Date.now();
  }
}
```

**Benefits**:
- One HTTP call (not two)
- Server applies both operations or neither
- No partial state

---

### Phase 3: Unified Sync Coordinator

```typescript
// NEW: SyncCoordinatorService
@Injectable({ providedIn: 'root' })
export class SyncCoordinatorService {
  private tapService = inject(TapService);
  private userStatusService = inject(UserStatusService);
  private navigationSync = inject(NavigationSyncService);

  private syncQueue$ = new Subject<{ priority: number; trigger: string }>();
  private lastSyncTime = 0;
  private readonly SYNC_COOLDOWN = 3000; // Unified cooldown
  private isSyncing = false;

  constructor() {
    this.syncQueue$
      .pipe(
        debounceTime(500), // Batch rapid sync requests
        distinctUntilChanged(),
        mergeMap(req => this.executeSyncIfNeeded(req))
      )
      .subscribe();
  }

  requestSync(trigger: string = 'manual'): void {
    this.syncQueue$.next({ priority: 1, trigger });
  }

  private async executeSyncIfNeeded(request: { priority: number; trigger: string }): Promise<void> {
    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_COOLDOWN || this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    try {
      // Flush taps if any pending
      if (this.tapService.pendingTapsCount() > 0) {
        await this.tapService.flushPendingTaps();
      }

      // Refresh user state once (not twice)
      await this.userStatusService.loadUserStatus();

    } catch (error) {
      console.error('Sync failed:', error);
      // Will retry on next trigger
    } finally {
      this.isSyncing = false;
      this.lastSyncTime = Date.now();
    }
  }
}
```

---

## 9. IMPLEMENTATION ROADMAP

| Phase | Files Affected | Effort | Risk | Timeline |
|---|---|---|---|---|
| 1. ProjectedStateService | New service | 4-6 hours | Low (isolated) | Week 1 |
| 2. Atomic Flush Endpoint | tap.service.ts, backend | 8-12 hours | Medium (API contract) | Week 2 |
| 3. SyncCoordinatorService | New service, tap.service.ts, navigation-sync.service.ts | 6-8 hours | Medium (refactor) | Week 2 |
| 4. Integration Tests | New .spec.ts files | 8-12 hours | Low (catch regressions) | Week 3 |
| 5. E2E Verification | Playwright tests | 4-6 hours | Low (validate flows) | Week 3 |

---

## 10. VERIFICATION CHECKLIST

- [ ] No concurrent `loadUserStatus()` calls in chrome DevTools Network tab
- [ ] No pending taps after tab close/reload
- [ ] Balance updates within 100ms of flush completion
- [ ] Energy decrements immediately (optimistic)
- [ ] Level up animates correctly after batch flush
- [ ] Navigating within 5s doesn't drop taps
- [ ] Skill purchase triggers immediate flush
- [ ] No balance rollback on page refresh
- [ ] Energy never goes negative in UI
- [ ] Crash recovery restores pending taps correctly

---

## READY FOR PROPOSAL?

**YES** — Architecture is clear, race conditions identified, refactoring approach validated.

**Recommend next step**: Create a **change proposal** outlining the "Single Source of Truth + Atomic Flush" approach, with implementation tasks broken down by phase.
