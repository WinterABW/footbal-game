import { Injectable, inject, computed, signal } from '@angular/core';
import { TapService } from './tap.service';
import { TransactionJournalService } from './transaction-journal.service';

// ============================================
// SYNC STATUS TYPES
// ============================================

export type SyncStatus =
  | 'SYNC_IDLE'        // Everything is up to date
  | 'SYNC_PENDING'    // There are pending taps in the Transaction Journal
  | 'SYNC_IN_PROGRESS' // A flush operation is currently in flight
  | 'SYNC_ERROR';     // A flush operation failed and is pending retry

export interface SyncGuardResult {
  blocked: boolean;
  reason?: SyncStatus;
  message?: string;
  canRetry?: boolean;
}

// ============================================
// INTERFACE FOR TESTING/MOCKING
// ============================================

export interface TapServiceMock {
  isFlushing?: boolean;
  pendingTapsCount?: () => number;
}

export interface JournalServiceMock {
  getActiveEntries?: () => any[];
  getPendingEntries?: () => any[];
}

// ============================================
// SYNC COORDINATOR SERVICE
// Centralizes sync state visibility and provides operation guards
// ============================================

@Injectable({
  providedIn: 'root',
})
export class SyncCoordinatorService {
  // Lazy getters for injected services - only resolve when accessed
  // This allows both DI instantiation and manual testing with setMocks()
  private _tapServiceResolver: () => TapService | null;
  private _journalServiceResolver: () => TransactionJournalService | null;

  // Internal signals for mock injection
  private _tapServiceMock?: TapServiceMock;
  private _journalServiceMock?: JournalServiceMock;

  // Track if flush is in progress
  private _isFlushing = signal(false);

  constructor() {
    // Store the inject functions to call later when we have an injection context
    // This defers the inject() call until the methods are called (which happens after DI is ready)
    this._tapServiceResolver = () => {
      try {
        return inject(TapService, { optional: true });
      } catch {
        return null;
      }
    };
    this._journalServiceResolver = () => {
      try {
        return inject(TransactionJournalService, { optional: true });
      } catch {
        return null;
      }
    };
  }

  // Getter for tap service - returns mock if set, otherwise resolves from DI
  private get tapService(): TapService | null {
    if (this._tapServiceMock) {
      return this._tapServiceMock as unknown as TapService;
    }
    return this._tapServiceResolver();
  }

  // Getter for journal service - returns mock if set, otherwise resolves from DI
  private get journalService(): TransactionJournalService | null {
    if (this._journalServiceMock) {
      return this._journalServiceMock as unknown as TransactionJournalService;
    }
    return this._journalServiceResolver();
  }

  // Method to inject mocks for testing
  setMocks(tapMock?: TapServiceMock, journalMock?: JournalServiceMock): void {
    this._tapServiceMock = tapMock;
    this._journalServiceMock = journalMock;
  }

  // ============================================
  // MARK FLUSH START/END (called by TapService)
  // ============================================

  markFlushStarted(): void {
    this._isFlushing.set(true);
  }

  markFlushEnded(): void {
    this._isFlushing.set(false);
  }

  // ============================================
  // COMPUTED SYNC STATUS
  // Priority: IN_PROGRESS > PENDING > ERROR > IDLE
  // ============================================

  readonly syncStatus = computed<SyncStatus>(() => {
    // Priority 1: Flush in progress (highest priority)
    if (this.isFlushInProgress()) {
      return 'SYNC_IN_PROGRESS';
    }

    // Priority 2: Failed entries pending retry
    if (this.hasFailedEntries()) {
      return 'SYNC_ERROR';
    }

    // Priority 3: Pending entries in journal
    if (this.hasPendingEntries()) {
      return 'SYNC_PENDING';
    }

    // Priority 4: Idle - everything synced
    return 'SYNC_IDLE';
  });

  // ============================================
  // COMPUTED PENDING COUNT
  // Total pending operations for display
  // ============================================

  readonly pendingCount = computed(() => {
    // First, check the journal. If it has active entries, it's the most authoritative source.
    const journalService = this._journalServiceMock ?? this.journalService;
    if (journalService?.getActiveEntries) {
      const activeEntries = journalService.getActiveEntries();
      const journalPending = activeEntries.reduce((sum, entry) => sum + entry.amount, 0);
      if (journalPending > 0) {
        return journalPending;
      }
    }

    // If journal is empty, fall back to the tap service's transient count.
    const tapService = this._tapServiceMock ?? this.tapService;
    if (tapService?.pendingTapsCount) {
      return tapService.pendingTapsCount();
    }

    return 0;
  });

  // ============================================
  // GUARD: Can proceed with operations
  // Blocks if sync is in progress or has errors
  // PENDING is OK for taps but NOT for critical operations
  // ============================================

  canProceed(): boolean {
    const status = this.syncStatus();
    // Only block during IN_PROGRESS or ERROR
    // Allow IDLE and PENDING (user can tap while syncing)
    return status === 'SYNC_IDLE' || status === 'SYNC_PENDING';
  }

  // ============================================
  // STRICT GUARD: For critical operations (wallet, skills)
  // Blocks if NOT idle (includes blocking on PENDING)
  // ============================================

  canProceedStrict(): boolean {
    const status = this.syncStatus();
    // Only allow when completely idle
    return status === 'SYNC_IDLE';
  }

  // ============================================
  // GUARD: Ensure synchronized before critical operation
  // Blocks if sync is not idle
  // ============================================

  async ensureSynchronized<T>(
    action: () => Promise<T>,
    options?: { strict?: boolean }
  ): Promise<T | SyncGuardResult> {
    const status = this.syncStatus();
    const isStrict = options?.strict ?? false;

    // Check can proceed based on strict mode
    const canProceedFn = isStrict ? this.canProceedStrict() : this.canProceed();

    // If synchronized, execute the action
    if (canProceedFn) {
      return action();
    }

    // Blocked - return SyncGuardResult
    const result: SyncGuardResult = {
      blocked: true,
      reason: status,
      canRetry: status !== 'SYNC_ERROR',
    };

    if (status === 'SYNC_IN_PROGRESS') {
      result.message = 'Sincronización en progreso. Espera un momento...';
    } else if (status === 'SYNC_PENDING') {
      result.message = 'Hay operaciones pendientes. Espera a que completen...';
    } else if (status === 'SYNC_ERROR') {
      result.message = 'Error de sincronización. Intenta de nuevo.';
    }

    return result;
  }

  // ============================================
  // STATUS HELPERS
  // ============================================

  private isFlushInProgress(): boolean {
    // Check signal first (most reliable)
    if (this._isFlushing()) {
      return true;
    }

    // Check mock if available
    if (this._tapServiceMock?.isFlushing) {
      return true;
    }

    // Check journal for flushing entries
    try {
      if (this._journalServiceMock?.getActiveEntries) {
        const activeEntries = this._journalServiceMock.getActiveEntries();
        const hasFlushing = activeEntries.some(e => e.status === 'flushing');
        if (hasFlushing) {
          return true;
        }
      } else if (this.journalService) {
        const activeEntries = this.journalService.getActiveEntries();
        const hasFlushing = activeEntries.some(e => e.status === 'flushing');
        if (hasFlushing) {
          return true;
        }
      }
    } catch {
      // Ignore errors
    }

    return false;
  }

  private hasPendingEntries(): boolean {
    try {
      if (this._journalServiceMock?.getActiveEntries) {
        const entries = this._journalServiceMock.getActiveEntries();
        return entries.length > 0;
      } else if (this.journalService) {
        const activeEntries = this.journalService.getActiveEntries();
        return activeEntries.length > 0;
      }
      return false;
    } catch {
      return false;
    }
  }

  private hasFailedEntries(): boolean {
    try {
      if (this._journalServiceMock?.getPendingEntries) {
        const entries = this._journalServiceMock.getPendingEntries();
        const hasFailed = entries.some(e => e.status === 'failed' || e.status === 'failed-partial');
        return hasFailed;
      } else if (this.journalService) {
        const pendingEntries = this.journalService.getPendingEntries();
        const hasFailed = pendingEntries.some(e => e.status === 'failed' || e.status === 'failed-partial');
        return hasFailed;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ============================================
  // GETTERS FOR UI
  // ============================================

  getStatus(): SyncStatus {
    return this.syncStatus();
  }

  getPendingOpsCount(): number {
    return this.pendingCount();
  }

  // ============================================
  // USER-FRIENDLY STATUS TEXT
  // ============================================

  getStatusText(): string {
    const status = this.syncStatus();
    const count = this.pendingCount();

    switch (status) {
      case 'SYNC_IDLE':
        return 'Sincronizado';
      case 'SYNC_PENDING':
        return count > 0 ? `Sincronizando ${count} taps...` : 'Sincronizando...';
      case 'SYNC_IN_PROGRESS':
        return 'Enviando al servidor...';
      case 'SYNC_ERROR':
        return 'Error de sincronización';
      default:
        return 'Verificando...';
    }
  }

  // ============================================
  // STATUS LABEL FOR DISPLAY
  // ============================================

  getStatusLabel(): string {
    const status = this.syncStatus();
    const count = this.pendingCount();

    switch (status) {
      case 'SYNC_IDLE':
        return 'Listo';
      case 'SYNC_PENDING':
        return count > 0 ? `${count}pend` : 'Pendiente';
      case 'SYNC_IN_PROGRESS':
        return 'Enviando';
      case 'SYNC_ERROR':
        return 'Error';
      default:
        return '...';
    }
  }

  // ============================================
  // UI STATUS ICONS
  // ============================================

  getStatusIcon(): 'check' | 'sync' | 'loader' | 'alert' {
    const status = this.syncStatus();

    switch (status) {
      case 'SYNC_IDLE':
        return 'check';
      case 'SYNC_PENDING':
        return 'sync';
      case 'SYNC_IN_PROGRESS':
        return 'loader';
      case 'SYNC_ERROR':
        return 'alert';
      default:
        return 'sync';
    }
  }

  // ============================================
  // UI STATUS COLORS
  // ============================================

  getStatusColor(): 'success' | 'warning' | 'info' | 'error' {
    const status = this.syncStatus();

    switch (status) {
      case 'SYNC_IDLE':
        return 'success';
      case 'SYNC_PENDING':
        return 'warning';
      case 'SYNC_IN_PROGRESS':
        return 'info';
      case 'SYNC_ERROR':
        return 'error';
      default:
return 'info';
    }
  }
} // End of SyncCoordinatorService class