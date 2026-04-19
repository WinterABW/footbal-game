import { describe, it, expect, beforeEach } from 'vitest';

// Lightweight mocks used for standalone verification tests
class MockUserStatus {
  private _wallet = { principalBalance: 1000, energy: 500, totalTooks: 300 };
  private _tapValue = 2;
  wallet() { return { ...this._wallet }; }
  totalTooks() { return this._wallet.totalTooks; }
  tapValue() { return this._tapValue; }
  updateWallet(data: Partial<any>) { this._wallet = { ...this._wallet, ...data }; }
}

class MockTapService {
  private _pending = 0;
  pendingTapsCount = () => this._pending;
  addTap = (count = 1) => { this._pending += count; };
  clearPending = () => { this._pending = 0; };
}

// Reuse the projected-state factory from the real service (imported dynamically)
import { createProjectedStateService } from './projected-state.service';

describe('Sync Hardening - Verification (stress & invariants)', () => {
  let userSvc: any;
  let tapSvc: any;
  let projected: any;

  beforeEach(() => {
    userSvc = new MockUserStatus();
    tapSvc = new MockTapService();
    projected = createProjectedStateService(userSvc as any, tapSvc as any);
    // Clear localStorage keys used by journal/pending logic if present
    try { localStorage.removeItem('pendingTaps'); localStorage.removeItem('transactionJournal'); } catch (e) {}
  });

  it('high-frequency tapping simulation keeps invariants (600 taps)', () => {
    // Simulate 600 taps (equivalent to 20 taps/sec for 30s)
    for (let i = 0; i < 600; i++) {
      projected.applyPendingTap(1);
    }

    const pending = projected.pendingTapsCount();
    expect(pending).toBe(600);

    const projectedEnergy = projected.projectedEnergy();
    // Energy must never go negative
    expect(projectedEnergy).toBeGreaterThanOrEqual(0);

    const projectedBalance = projected.projectedBalance();
    // Balance increases by pending * tapValue (tapValue in mock = 2)
    expect(projectedBalance).toBe(1000 + (600 * 2));
  });

  it('simulated navigation + flush sequence (no double-count)', async () => {
    // Simulate user taps
    for (let i = 0; i < 50; i++) projected.applyPendingTap();

    // Simulate server reconciliation: server processes the 50 taps
    const preBalance = projected.projectedBalance();
    const preEnergy = projected.projectedEnergy();

    // Server now returns updated wallet including the 50 taps
    userSvc.updateWallet({ principalBalance: preBalance, energy: preEnergy, totalTooks: 300 + 50 });

    // Commit pending taps (equivalent to flush success)
    projected.clearPendingTaps();

    // After commit, projected should match server exactly (no double-count)
    expect(projected.projectedBalance()).toBe(preBalance);
    expect(projected.projectedEnergy()).toBe(preEnergy);
    expect(projected.projectedTotalTooks()).toBe(350);
  });

  it('offline → online transition preserves pending taps (restart recovery simulation)', () => {
    // Add pending taps and persist to localStorage as TapService would
    for (let i = 0; i < 42; i++) projected.applyPendingTap();
    const pendingBefore = projected.pendingTapsCount();
    expect(pendingBefore).toBe(42);

    // Simulate app crash / reload by constructing a fresh projected state
    const tapSvc2 = new MockTapService();
    // Simulate TapService persisted pending taps in localStorage
    try { localStorage.setItem('pendingTaps', String(pendingBefore)); } catch (e) {}

    // New projected instance should start with zero, then we simulate restore
    const projected2 = createProjectedStateService(userSvc as any, tapSvc2 as any);
    // Manual restore emulation: read from localStorage like TapService would
    const stored = parseInt(localStorage.getItem('pendingTaps') || '0', 10);
    if (!isNaN(stored) && stored > 0) {
      for (let i = 0; i < stored; i++) projected2.applyPendingTap();
    }

    expect(projected2.pendingTapsCount()).toBe(42);
    // Energy projection still non-negative
    expect(projected2.projectedEnergy()).toBeGreaterThanOrEqual(0);
  });
});
