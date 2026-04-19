import { Injectable, inject, computed, signal, effect, ChangeDetectorRef } from '@angular/core';
import { UserStatusService } from './user-status.service';
import { TransactionJournalService } from './transaction-journal.service';
import { TapService } from './tap.service';

// ============================================
// LEVEL THRESHOLDS (from UserStatusService)
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

// ============================================
// PROJECTED STATE INTERFACE
// ============================================

export interface ProjectedLevelInfo {
  level: number;
  currentTooks: number;
  tooksForNextLevel: number;
  tooksToNextLevel: number;
  isMaxLevel: boolean;
}

// ============================================
// PURE FUNCTIONS (testable without Angular DI)
// ============================================

export function calculateLevel(totalTooks: number): number {
  let currentLevel = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalTooks >= threshold.tooksRequired) {
      currentLevel = threshold.level;
    }
  }
  return currentLevel;
}

export function calculateLevelInfo(totalTooks: number): ProjectedLevelInfo {
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

// Factory interface for test environment
export interface ProjectedStateServiceInterface {
  readonly projectedBalance: () => number;
  readonly projectedEnergy: () => number;
  readonly projectedTotalTooks: () => number;
  readonly projectedLevel: () => number;
  readonly projectedLevelInfo: () => ProjectedLevelInfo;
  applyPendingTap: (count?: number) => void;
  commitPendingTaps: (serverBalance: number, serverEnergy: number, serverTotalTooks: number) => void;
  clearPendingTaps: () => void;
  pendingTapsCount: () => number;
}

// ============================================
// SERVICE FACTORY (for testing OR production use)
// Creates service without requiring injection context
// ============================================

export function createProjectedStateService(
  userStatusService: UserStatusService,
  tapService: TapService,
  journalService?: TransactionJournalService
): ProjectedStateServiceInterface {
  // Internal state for pending taps
  const pendingTaps = signal<number>(0);

  // Computed projected signals use the same formulas as the service below
  const projectedBalance = computed(() => {
    const serverBalance = userStatusService?.wallet()?.principalBalance ?? 0;
    const pending = pendingTaps();
    const tapPower = userStatusService?.tapValue() ?? 1;
    return serverBalance + (pending * tapPower);
  });

  const projectedEnergy = computed(() => {
    const serverEnergy = userStatusService?.wallet()?.energy ?? 0;
    const pending = pendingTaps();
    return Math.max(0, serverEnergy - pending);
  });

  const projectedTotalTooks = computed(() => {
    const serverTotalTooks = userStatusService?.totalTooks() ?? 0;
    const pending = pendingTaps();
    return serverTotalTooks + pending;
  });

  const projectedLevel = computed(() => {
    return calculateLevel(projectedTotalTooks());
  });

  const projectedLevelInfo = computed(() => {
    return calculateLevelInfo(projectedTotalTooks());
  });

  // Return interface with all computed signals
  return {
    projectedBalance,
    projectedEnergy,
    projectedTotalTooks,
    projectedLevel,
    projectedLevelInfo,

    applyPendingTap: (count: number = 1) => {
      pendingTaps.update(t => t + count);
      if (tapService) {
        tapService.addTap(count);
      }
    },

    commitPendingTaps: () => {
      pendingTaps.set(0);
    },

    clearPendingTaps: () => {
      pendingTaps.set(0);
    },

    pendingTapsCount: () => {
      return pendingTaps();
    },
  };
}

// ============================================
// SERVICE (production - uses Angular DI)
// ============================================

@Injectable({
  providedIn: 'root',
})
export class ProjectedStateService implements ProjectedStateServiceInterface {
  // Injected dependencies
  private userStatusService = inject(UserStatusService);
  private tapService = inject(TapService);
  private journalService = inject(TransactionJournalService, { optional: true });
  private cdr = inject(ChangeDetectorRef, { optional: true });

  // ============================================
  // INTERNAL STATE - Pending Taps from journal
  // ============================================

  pendingTaps = signal<number>(0);

  constructor() {
    // Recovery: sync pending taps from TapService on startup
    this.syncFromTapService();

    // Start effect to keep pendingTaps in sync with TapService
    effect(() => {
      const tapServicePending = this.tapService.pendingTapsCount();
      if (tapServicePending !== this.pendingTaps()) {
        this.pendingTaps.set(tapServicePending);
      }
    }, { allowSignalWrites: true });
  }

  // ============================================
  // COMPUTED: Pending Taps from Journal
  // Reads pending amount from active journal entries
  // ============================================

  private getPendingTapsFromJournal(): number {
    if (!this.journalService) return this.pendingTaps();
    const activeEntries = this.journalService.getActiveEntries();
    return activeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }

  // ============================================
  // COMPUTED: Projected Balance
  // Formula: serverBalance + (pendingTaps * tapPower)
  // FIX: Dedupe - only count journal entries OR tapService, not both
  // Journal entries represent the authoritative pending taps state
  // ============================================

  readonly projectedBalance = computed(() => {
    const serverBalance = this.userStatusService.wallet()?.principalBalance ?? 0;
    const tapServicePending = this.tapService.pendingTapsCount();
    const journalPending = this.getPendingTapsFromJournal();
    // FIX: If journal has entries, they represent the authoritative pending taps
    // Only count taps NOT yet in journal (tapService - journal would give pending remaining)
    // For simplicity: prefer journal entries, ignore tapService when journal has pending
    const hasJournalPending = journalPending > 0;
    const pending = hasJournalPending ? journalPending : tapServicePending;
    const tapPower = this.userStatusService.tapValue() ?? 1;
    return serverBalance + (pending * tapPower);
  });

  // ============================================
  // COMPUTED: Projected Energy
  // FIX: Dedupe - only count journal entries OR tapService, not both
  // ============================================

  readonly projectedEnergy = computed(() => {
    const serverEnergy = this.userStatusService.wallet()?.energy ?? 0;
    const tapServicePending = this.tapService.pendingTapsCount();
    const journalPending = this.getPendingTapsFromJournal();
    // FIX: Prefer journal entries, they are the authoritative state
    const hasJournalPending = journalPending > 0;
    const pending = hasJournalPending ? journalPending : tapServicePending;
    return Math.max(0, serverEnergy - pending);
  });

  // ============================================
  // COMPUTED: Projected Total Tooks
  // FIX: Dedupe - only count journal entries OR tapService, not both
  // ============================================

  readonly projectedTotalTooks = computed(() => {
    const serverTotalTooks = this.userStatusService.totalTooks() ?? 0;
    const tapServicePending = this.tapService.pendingTapsCount();
    const journalPending = this.getPendingTapsFromJournal();
    // FIX: Prefer journal entries, they are the authoritative state
    const hasJournalPending = journalPending > 0;
    const pending = hasJournalPending ? journalPending : tapServicePending;
    return serverTotalTooks + pending;
  });

  // ============================================
  // COMPUTED: Projected Level
  // Formula: calculated from (serverTotalTooks + pendingTaps)
  // ============================================

  readonly projectedLevel = computed(() => {
    return calculateLevel(this.projectedTotalTooks());
  });

  // ============================================
  // COMPUTED: Projected Level Info
  // Full level info with pending taps included
  // ============================================

  readonly projectedLevelInfo = computed(() => {
    return calculateLevelInfo(this.projectedTotalTooks());
  });

  // ============================================
  // ACTION: Apply Pending Tap
  // FIX: Only delegate to TapService - avoid double-update
  // The effect will sync the internal pendingTaps signal from TapService
  // ============================================

  applyPendingTap(count: number = 1): void {
    // Only call tapService - let effect handle internal signal update
    this.tapService.addTap(count);
  }

  // ============================================
  // ACTION: Commit Pending Taps
  // Called after successful server sync
  // ============================================

  commitPendingTaps(_serverBalance: number, _serverEnergy: number, _serverTotalTooks: number): void {
    // Clear internal pending (server state includes them)
    this.pendingTaps.set(0);
  }

  // ============================================
  // ACTION: Clear Pending Taps
  // Reset to server state (for reconciliation)
  // ============================================

  clearPendingTaps(): void {
    this.pendingTaps.set(0);
  }

  // ============================================
  // GETTER: Pending Taps Count
  // FIX: Dedupe - returns journal OR tapService, not both
  // ============================================

  pendingTapsCount(): number {
    const tapServicePending = this.tapService.pendingTapsCount();
    const journalPending = this.getPendingTapsFromJournal();
    // Prefer journal (authoritative) if available
    return journalPending > 0 ? journalPending : tapServicePending;
  }

  // ============================================
  // GETTER: Sync from TapService
  // Called to sync internal state with TapService
  // ============================================

  syncFromTapService(): void {
    const count = this.tapService.pendingTapsCount();
    this.pendingTaps.set(count);
  }
}