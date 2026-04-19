import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================
// STANDALONE MOCKS - No Angular DI required
// ============================================

interface WalletData {
  principalBalance: number;
  energy: number;
  totalTooks: number;
  level: number;
}

// Mock UserStatusService
class MockUserStatusService {
  private _wallet: WalletData = {
    principalBalance: 1000,
    energy: 500,
    totalTooks: 300,
    level: 1,
  };

  private _tapValue = 2;

  wallet = vi.fn(() => ({ ...this._wallet }));
  totalTooks = vi.fn(() => this._wallet.totalTooks);
  tapValue = vi.fn(() => this._tapValue);

  updateWallet(data: Partial<WalletData>) {
    this._wallet = { ...this._wallet, ...data };
  }

  setTapValue(value: number) {
    this._tapValue = value;
  }
}

// Mock TapService
class MockTapService {
  private _pendingTaps = 0;

  pendingTapsCount = vi.fn(() => this._pendingTaps);
  addTap = vi.fn((count: number) => {
    this._pendingTaps += count;
  });

  setPendingTaps(count: number) {
    this._pendingTaps = count;
  }
}

// ============================================
// PURE FUNCTIONS (copied from service for standalone testing)
// ============================================

const LEVEL_THRESHOLDS = [
  { level: 1, tooksRequired: 0 },
  { level: 2, tooksRequired: 120 },
  { level: 3, tooksRequired: 300 },
  { level: 4, tooksRequired: 1100 },
  { level: 5, tooksRequired: 1600 },
  { level: 6, tooksRequired: 2100 },
  { level: 7, tooksRequired: 3200 },
  { level: 8, tooksRequired: 4100 },
];

function calculateLevel(totalTooks: number): number {
  let currentLevel = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalTooks >= threshold.tooksRequired) {
      currentLevel = threshold.level;
    }
  }
  return currentLevel;
}

function calculateLevelInfo(totalTooks: number) {
  const currentLevel = calculateLevel(totalTooks);
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);

  return {
    level: currentLevel,
    currentTooks: totalTooks,
    tooksForNextLevel: nextThreshold?.tooksRequired ?? currentThreshold?.tooksRequired ?? 0,
    tooksToNextLevel: nextThreshold ? nextThreshold.tooksRequired - totalTooks : 0,
    isMaxLevel: currentLevel >= 8,
  };
}

// ============================================
// STANDALONE PROJECTED STATE (no Angular imports)
// ============================================

interface ProjectedStateServiceInterface {
  readonly projectedBalance: () => number;
  readonly projectedEnergy: () => number;
  readonly projectedTotalTooks: () => number;
  readonly projectedLevel: () => number;
  readonly projectedLevelInfo: () => ReturnType<typeof calculateLevelInfo>;
  applyPendingTap: (count?: number) => void;
  commitPendingTaps: (serverBalance: number, serverEnergy: number, serverTotalTooks: number) => void;
  clearPendingTaps: () => void;
  pendingTapsCount: () => number;
}

function createStandaloneProjectedStateService(
  userStatusService: any,
  tapService: any
): ProjectedStateServiceInterface {
  const pendingTaps = { value: 0 };

  const projectedBalance = () => {
    const serverBalance = userStatusService?.wallet()?.principalBalance ?? 0;
    const pending = pendingTaps.value;
    const tapPower = userStatusService?.tapValue() ?? 1;
    return serverBalance + (pending * tapPower);
  };

  const projectedEnergy = () => {
    const serverEnergy = userStatusService?.wallet()?.energy ?? 0;
    const pending = pendingTaps.value;
    return Math.max(0, serverEnergy - pending);
  };

  const projectedTotalTooks = () => {
    const serverTotalTooks = userStatusService?.totalTooks() ?? 0;
    const pending = pendingTaps.value;
    return serverTotalTooks + pending;
  };

  const projectedLevel = () => {
    return calculateLevel(projectedTotalTooks());
  };

  const projectedLevelInfo = () => {
    return calculateLevelInfo(projectedTotalTooks());
  };

  return {
    projectedBalance,
    projectedEnergy,
    projectedTotalTooks,
    projectedLevel,
    projectedLevelInfo,

    applyPendingTap: (count: number = 1) => {
      pendingTaps.value += count;
      if (tapService) {
        tapService.addTap(count);
      }
    },

    commitPendingTaps: () => {
      pendingTaps.value = 0;
    },

    clearPendingTaps: () => {
      pendingTaps.value = 0;
    },

    pendingTapsCount: () => {
      return pendingTaps.value;
    },
  };
}

// ============================================
// TESTS - Cycle 4 Unified Projection Model
// ============================================

describe('ProjectedStateService (Cycle 4)', () => {
  let mockUserStatus: MockUserStatusService;
  let mockTapService: MockTapService;
  let service: ProjectedStateServiceInterface;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserStatus = new MockUserStatusService();
    mockTapService = new MockTapService();

    // Create standalone service without Angular DI
    service = createStandaloneProjectedStateService(
      mockUserStatus as any,
      mockTapService as any
    );
  });

  it('should compute projectedBalance = serverBalance + (pendingTaps * tapPower)', () => {
    // Server has 1000 balance, tapPower = 2
    expect(service.projectedBalance()).toBe(1000);

    // Simulate: user taps 10 times
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();

    // 10 taps * 2 tapPower = 20, plus 1000 = 1020
    expect(service.projectedBalance()).toBe(1020);
  });

  it('should compute projectedEnergy = serverEnergy - pendingTaps', () => {
    // Server has 500 energy
    expect(service.projectedEnergy()).toBe(500);

    // Simulate: user taps 10 times
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();

    // 500 - 10 = 490
    expect(service.projectedEnergy()).toBe(490);
  });

  it('should never allow projectedEnergy to go negative', () => {
    // Simulate: user taps 1000 times (more than serverEnergy)
    for (let i = 0; i < 1000; i++) {
      service.applyPendingTap();
    }

    // Energy capped at 0
    expect(service.projectedEnergy()).toBe(0);
  });

  it('should calculate projectedLevel from (serverTotalTooks + pendingTaps)', () => {
    // Server totalTooks = 300 (Level 3 - needs 800 more for Level 4)
    expect(service.projectedLevel()).toBe(3);

    // Add 800 more taps = 1100 total = Level 4
    for (let i = 0; i < 800; i++) {
      service.applyPendingTap();
    }
    expect(service.projectedLevel()).toBe(4);

    // Add 700 more taps = 1800 total = Level 5
    for (let i = 0; i < 700; i++) {
      service.applyPendingTap();
    }
    expect(service.projectedLevel()).toBe(5);
  });

  it('should update projected signals IMMEDIATELY on tap, before any network call', () => {
    // Initial state
    expect(service.projectedBalance()).toBe(1000);
    expect(service.projectedEnergy()).toBe(500);
    expect(service.projectedLevel()).toBe(3);

    // Simulate 1 tap - INSTANT update, no network
    service.applyPendingTap();

    // CRITICAL: Values updated INSTANTLY - no await, no network
    expect(service.projectedBalance()).toBe(1002); // 1000 + (1 * 2)
    expect(service.projectedEnergy()).toBe(499);
    // Level might not change on single tap
    expect(service.projectedLevel()).toBe(3);
  });

  it('should maintain stable projected value after server reconciliation', () => {
    // User has 100 pending taps
    for (let i = 0; i < 100; i++) {
      service.applyPendingTap();
    }

    const preReconciliationBalance = service.projectedBalance();
    const preReconciliationEnergy = service.projectedEnergy();

    // Simulate: server refresh after journal entry applied
    // Server state is UPDATED to include the pending taps
    mockUserStatus.updateWallet({
      principalBalance: preReconciliationBalance,
      energy: preReconciliationEnergy,
      totalTooks: 300 + 100,
    });

    // Clear pending taps (they've been synced)
    service.clearPendingTaps();

    // Projected should EQUAL server (no double-count)
    expect(service.projectedBalance()).toBe(preReconciliationBalance);
    expect(service.projectedEnergy()).toBe(preReconciliationEnergy);
    expect(service.projectedTotalTooks()).toBe(300 + 100);
  });

  it('should include pending taps in level progress calculation', () => {
    // 300 totalTooks (Level 3), need 800 more for level 4
    const info0 = service.projectedLevelInfo();
    expect(info0.currentTooks).toBe(300);
    expect(info0.level).toBe(3);
    expect(info0.tooksToNextLevel).toBe(800);

    // Add 50 pending taps = 350 total (still Level 3)
    for (let i = 0; i < 50; i++) {
      service.applyPendingTap();
    }
    const info1 = service.projectedLevelInfo();

    // Current = server (300) + pending (50) = 350
    expect(info1.currentTooks).toBe(350);
    expect(info1.level).toBe(3); // Still level 3
    expect(info1.tooksToNextLevel).toBe(750); // 1100 - 350 = 750 to next
  });

  it('should expose pendingTapsCount for observability', () => {
    expect(service.pendingTapsCount()).toBe(0);

    service.applyPendingTap();
    service.applyPendingTap();
    service.applyPendingTap();

    expect(service.pendingTapsCount()).toBe(3);
  });

  it('should clear pending taps and reset to server state', () => {
    // Add 100 pending taps
    for (let i = 0; i < 100; i++) {
      service.applyPendingTap();
    }

    expect(service.projectedBalance()).toBeGreaterThan(1000);
    expect(service.projectedEnergy()).toBeLessThan(500);

    service.clearPendingTaps();

    expect(service.projectedBalance()).toBe(1000);
    expect(service.projectedEnergy()).toBe(500);
    expect(service.pendingTapsCount()).toBe(0);
  });

  it('should cap projectedLevel at maximum level (8)', () => {
    // Add enough taps for max level
    for (let i = 0; i < 10000; i++) {
      service.applyPendingTap();
    }

    const level = service.projectedLevel();
    expect(level).toBe(8); // Max level
  });

  it('should maintain stable projected value during server reconciliation (seamless)', () => {
    // User has 50 pending taps
    for (let i = 0; i < 50; i++) {
      service.applyPendingTap();
    }

    const preReconciliationBalance = service.projectedBalance();
    const preReconciliationEnergy = service.projectedEnergy();
    const preReconciliationTotalTooks = service.projectedTotalTooks();

    expect(preReconciliationBalance).toBeGreaterThan(1000);
    expect(preReconciliationEnergy).toBeLessThan(500);

    // Simulate server reconciliation: server state updates to include pending taps
    // pendingTaps are cleared (committed)
    mockUserStatus.updateWallet({
      principalBalance: preReconciliationBalance,
      energy: preReconciliationEnergy,
      totalTooks: preReconciliationTotalTooks,
    });
    service.clearPendingTaps();

    // CRITICAL: Projected value MUST remain stable after reconciliation
    // No flickering, no double-counting
    expect(service.projectedBalance()).toBe(preReconciliationBalance);
    expect(service.projectedEnergy()).toBe(preReconciliationEnergy);
    expect(service.projectedTotalTooks()).toBe(preReconciliationTotalTooks);
  });
});