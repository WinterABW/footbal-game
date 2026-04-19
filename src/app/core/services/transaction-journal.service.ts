import { Injectable, signal } from '@angular/core';

// ============================================
// JOURNAL TYPES
// ============================================

export type JournalStatus =
  | 'queued'
  | 'flushing'
  | 'applied'
  | 'failed'
  | 'failed-partial'
  | 'compensating'
  | 'cancelled';

export interface JournalEntry {
  id: string;
  op: 'tap-batch';
  amount: number;
  tapValueAtCreation: number;
  createdAt: number;
  updatedAt: number;
  status: JournalStatus;
  retryCount: number;
  correlationId: string;
  // FIX: Store baseline serverTotalTooks at entry creation for robust deduplication
  // This enables detecting duplicates when server already processed our batch
  baselineServerTotalTooks: number;
  request: {
    addTooks: { timestamp: number; token: string };
    updateEnergy: { timestamp: number; token: string };
  };
  response?: {
    addTooksOk?: boolean;
    updateEnergyOk?: boolean;
    serverBalance?: number;
    serverEnergy?: number;
    serverTotalTooks?: number;
    errorCode?: string;
    message?: string;
  };
}

export interface JournalEntryInput {
  op: 'tap-batch';
  amount: number;
  tapValueAtCreation: number;
  baselineServerTotalTooks?: number;
}

export interface BatchEntry {
  serverBalance: number;
  serverEnergy: number;
  serverTotalTooks: number;
}

export interface FailureResponse {
  message: string;
  code: string;
}

// ============================================
// JOURNAL CONSTANTS
// ============================================

const JOURNAL_STORAGE_KEY = 'transactionJournal';
const MAX_RETRY_COUNT = 3;
const MAX_ARCHIVED_ENTRIES = 50; // Cap archived entries to prevent unbounded growth
// FIX: Consistent status definitions for retry behavior
// - queued: waiting to be sent
// - flushing: currently being sent to server
// - failed-partial: partially applied, needs retry or reconciliation
// - compensating: rolling back a previous operation
const ACTIVE_STATUSES: JournalStatus[] = ['queued', 'flushing', 'failed-partial', 'compensating'];
const FAILED_STATUSES: JournalStatus[] = ['failed', 'failed-partial'];
// PENDING statuses that can be retried
const PENDING_RETRY_STATUSES: JournalStatus[] = ['queued', 'failed', 'failed-partial'];

// ============================================
// SERVICE
// ============================================

@Injectable({
  providedIn: 'root',
})
export class TransactionJournalService {
  private readonly journalKey = JOURNAL_STORAGE_KEY;

  // Signal for reactive updates
  private entries = signal<JournalEntry[]>([]);

  constructor() {
    // Recover entries on initialization
    this.recoverFromStorage();
  }

  // ============================================
  // APPEND - Create new journal entry
  // ============================================

  appendEntry(input: JournalEntryInput, baselineServerTotalTooks: number = 0): JournalEntry {
    const now = Date.now();
    const entry: JournalEntry = {
      id: this.generateId(),
      op: input.op,
      amount: input.amount,
      tapValueAtCreation: input.tapValueAtCreation,
      createdAt: now,
      updatedAt: now,
      status: 'queued',
      retryCount: 0,
      correlationId: `corr-${now}`,
      // FIX: Store baseline for robust deduplication
      // This captures server state at entry creation time
      baselineServerTotalTooks: baselineServerTotalTooks,
      request: {
        addTooks: { timestamp: now, token: '' },
        updateEnergy: { timestamp: now + 1, token: '' },
      },
    };

    const currentEntries = this.entries();
    this.entries.set([...currentEntries, entry]);
    this.persistToStorage();

    return entry;
  }

  // ============================================
  // STATUS TRANSITIONS
  // ============================================

  markFlushing(entryId: string): void {
    this.updateEntryStatus(entryId, 'flushing');
  }

  markApplied(entryId: string, response: BatchEntry): void {
    const entry = this.getEntry(entryId);
    if (!entry) return;

    const updatedEntry: JournalEntry = {
      ...entry,
      status: 'applied',
      updatedAt: Date.now(),
      response: {
        addTooksOk: true,
        updateEnergyOk: true,
        serverBalance: response.serverBalance,
        serverEnergy: response.serverEnergy,
        serverTotalTooks: response.serverTotalTooks,
      },
    };

    this.updateEntry(updatedEntry);
    this.removeFromActive(updatedEntry);
  }

  markFailed(entryId: string, failure: FailureResponse): void {
    const entry = this.getEntry(entryId);
    if (!entry) return;

    const newRetryCount = entry.retryCount + 1;
    const status: JournalStatus = newRetryCount >= MAX_RETRY_COUNT ? 'cancelled' : 'failed';

    const updatedEntry: JournalEntry = {
      ...entry,
      status,
      retryCount: newRetryCount,
      updatedAt: Date.now(),
      response: {
        errorCode: failure.code,
        message: failure.message,
      },
    };

    this.updateEntry(updatedEntry);

    // If cancelled, remove from active
    if (status === 'cancelled') {
      this.removeFromActive(updatedEntry);
    }
  }

  markCancelled(entryId: string): void {
    const entry = this.getEntry(entryId);
    if (!entry) return;

    const updatedEntry: JournalEntry = {
      ...entry,
      status: 'cancelled',
      updatedAt: Date.now(),
    };

    this.updateEntry(updatedEntry);
    this.removeFromActive(updatedEntry);
  }

  // ============================================
  // QUERIES
  // ============================================

  getEntry(entryId: string): JournalEntry | undefined {
    return this.entries().find(e => e.id === entryId);
  }

  getAllEntries(): JournalEntry[] {
    return this.entries();
  }

  getActiveEntries(): JournalEntry[] {
    return this.entries().filter(e => ACTIVE_STATUSES.includes(e.status));
  }

  getPendingEntries(): JournalEntry[] {
    // FIX: Consistent with ACTIVE_STATUSES - include failed-partial for retry
    // Entries that can be retried: queued OR (failed/failed-partial with retries left)
    return this.entries().filter(
      e => PENDING_RETRY_STATUSES.includes(e.status) && e.retryCount < MAX_RETRY_COUNT
    );
  }

  // ============================================
  // DEDUPLICATION
  // ============================================

  checkDuplicate(entryId: string, serverTotalTooks: number, batchTapsAmount: number): boolean {
    const entry = this.getEntry(entryId);
    if (!entry) return false;

    // FIX: Robust deduplication algorithm from hardening cycle
    // Primary check: If entry is already applied, this is a duplicate request
    if (entry.status === 'applied') {
      console.log(`[DEDUP] Entry ${entryId} already applied, duplicate detected`);
      return true;
    }

    // Secondary check: Robust comparison using baseline + entry.amount
    // If serverTotalTooks >= baselineServerTotalTooks + entry.amount,
    // the server already processed our batch - this is a duplicate
    const baselineTotalTooks = entry.baselineServerTotalTooks ?? 0;
    const expectedAfterBatch = baselineTotalTooks + entry.amount;

    if (serverTotalTooks >= expectedAfterBatch && baselineTotalTooks > 0) {
      console.log(`[DEDUP] Entry ${entryId}: serverTotalTooks ${serverTotalTooks} >= baseline ${baselineTotalTooks} + amount ${entry.amount} = ${expectedAfterBatch}, duplicate detected`);
      return true;
    }

    return false;
  }

  // ============================================
  // RECOVERY
  // ============================================

  async recoverPendingEntries(): Promise<void> {
    // This is called on app startup to re-queue pending entries
    this.recoverFromStorage();

    const pendingEntries = this.getPendingEntries();
    // Reset queued entries for retry
    pendingEntries.forEach(entry => {
      if (entry.status === 'failed') {
        this.updateEntryStatus(entry.id, 'queued');
      }
    });

    this.persistToStorage();
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private generateId(): string {
    return `journal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private updateEntryStatus(entryId: string, status: JournalStatus): void {
    const entry = this.getEntry(entryId);
    if (!entry) return;

    const updatedEntry: JournalEntry = {
      ...entry,
      status,
      updatedAt: Date.now(),
    };

    this.updateEntry(updatedEntry);
  }

  private updateEntry(updatedEntry: JournalEntry): void {
    const currentEntries = this.entries();
    const index = currentEntries.findIndex(e => e.id === updatedEntry.id);

    if (index >= 0) {
      const newEntries = [...currentEntries];
      newEntries[index] = updatedEntry;
      this.entries.set(newEntries);
    }

    this.persistToStorage();
  }

  private removeFromActive(entry: JournalEntry): void {
    // FIX: Implement retention policy - compact old applied/cancelled entries
    // Keep recent entries for audit, remove old ones to prevent unbounded growth
    
    // The entry is already in memory and updated, just persist
    this.persistToStorage();
    
    // Compact if we have too many entries
    this.compactOldEntriesIfNeeded();
  }
  
  private compactOldEntriesIfNeeded(): void {
    const allEntries = this.entries();
    
    // Count entries that are no longer active (applied/cancelled)
    const archivedEntries = allEntries.filter(
      e => e.status === 'applied' || e.status === 'cancelled'
    );
    
    // If we exceed the cap, remove oldest applied/cancelled entries
    if (archivedEntries.length > MAX_ARCHIVED_ENTRIES) {
      // Sort by updatedAt and keep only recent ones
      const sortedArchived = [...archivedEntries].sort((a, b) => b.updatedAt - a.updatedAt);
      const toRemove = sortedArchived.slice(MAX_ARCHIVED_ENTRIES);
      
      if (toRemove.length > 0) {
        const removeIds = new Set(toRemove.map(e => e.id));
        const remainingEntries = allEntries.filter(e => !removeIds.has(e.id));
        
        console.log(`[Journal] Compacting ${toRemove.length} old archived entries`);
        this.entries.set(remainingEntries);
        this.persistToStorage();
      }
    }
  }

  private persistToStorage(): void {
    try {
      localStorage.setItem(this.journalKey, JSON.stringify(this.entries()));
    } catch (error) {
      console.error('[TransactionJournal] Failed to persist:', error);
    }
  }

  private recoverFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.journalKey);
      if (stored) {
        const entries: JournalEntry[] = JSON.parse(stored);
        this.entries.set(entries);
      }
    } catch (error) {
      console.error('[TransactionJournal] Failed to recover:', error);
      this.entries.set([]);
    }
  }

  // ============================================
  // CLEAR (for testing/debug)
  // ============================================

  clear(): void {
    this.entries.set([]);
    this.persistToStorage();
  }
}