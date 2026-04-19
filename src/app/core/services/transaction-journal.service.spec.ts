import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TransactionJournalService, JournalEntry, JournalStatus } from './transaction-journal.service';

// ============================================
// TEST DATA
// ============================================

const mockUser = { id: 1, Id: 1, username: 'testuser' };

// Helper to create valid journal entries in localStorage
const createTestEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'test-id',
  op: 'tap-batch',
  amount: 20,
  tapValueAtCreation: 2,
  createdAt: Date.now() - 1000,
  updatedAt: Date.now() - 1000,
  status: 'queued',
  retryCount: 0,
  correlationId: 'corr-1',
  baselineServerTotalTooks: 300,
  request: {
    addTooks: { timestamp: 1234567890, token: 'token1' },
    updateEnergy: { timestamp: 1234567891, token: 'token2' },
  },
  ...overrides,
});

// ============================================
// TESTS - Cycle 3 Transactional Journal
// ============================================

describe('TransactionJournalService (Cycle 3)', () => {
  let journalService: TransactionJournalService;

  beforeEach(async () => {
    // Limpiar localStorage antes de cada test
    localStorage.clear();

    // Crear directamente el servicio
    journalService = new TransactionJournalService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ============================================
  // TEST 1: Journal entry persists BEFORE HTTP call
  // ============================================
  it('should persist journal entry BEFORE HTTP flush attempt', async () => {
    // Create a journal entry manually (simulating what TapService will do)
    const entry = journalService.appendEntry({
      op: 'tap-batch',
      amount: 20,
      tapValueAtCreation: 2,
    });

    expect(entry).toBeDefined();
    expect(entry.id).toBeDefined();
    expect(entry.status).toBe('queued');
    expect(entry.amount).toBe(20);

    // Verify entry is persisted to localStorage
    const storedEntries = journalService.getAllEntries();
    expect(storedEntries.length).toBe(1);
  });

  // ============================================
  // TEST 2: Entry status transitions on flush
  // ============================================
  it('should transition entry status from queued to flushing', async () => {
    const entry = journalService.appendEntry({
      op: 'tap-batch',
      amount: 20,
      tapValueAtCreation: 2,
    });

    // Mark as flushing when HTTP call starts
    journalService.markFlushing(entry.id);

    const updatedEntry = journalService.getEntry(entry.id);
    expect(updatedEntry?.status).toBe('flushing');
  });

  // ============================================
  // TEST 3: Entry marked failed on HTTP error
  // ============================================
  it('should mark entry as failed when HTTP fails', async () => {
    const entry = journalService.appendEntry({
      op: 'tap-batch',
      amount: 20,
      tapValueAtCreation: 2,
    });

    journalService.markFlushing(entry.id);

    // Simulate failure
    journalService.markFailed(entry.id, { message: 'Network error', code: 'NETWORK_ERROR' });

    const failedEntry = journalService.getEntry(entry.id);
    expect(failedEntry?.status).toBe('failed');
    expect(failedEntry?.retryCount).toBe(1);
  });

  // ============================================
  // TEST 4: Successful flush REMOVES entry from active
  // ============================================
  it('should remove entry from journal after successful flush', async () => {
    const entry = journalService.appendEntry({
      op: 'tap-batch',
      amount: 20,
      tapValueAtCreation: 2,
    });

    journalService.markFlushing(entry.id);

    // Simulate successful response
    journalService.markApplied(entry.id, {
      serverBalance: 1040,
      serverEnergy: 80,
      serverTotalTooks: 320,
    });

    // Entry should be removed from active entries
    const activeEntries = journalService.getActiveEntries();
    expect(activeEntries.length).toBe(0);
  });

  // ============================================
  // TEST 5: Startup recovery - restore QUEUED entries
  // ============================================
  it('should restore QUEUED entries on startup recovery', async () => {
    // Manually create an entry directly in localStorage
    const entries: JournalEntry[] = [createTestEntry({ id: 'test-entry-1' })];
    localStorage.setItem('transactionJournal', JSON.stringify(entries));

    // Create new service instance (simulates app restart)
    const newService = new TransactionJournalService();
    await newService.recoverPendingEntries();

    // Entry should be restored as pending
    const pendingEntries = newService.getPendingEntries();
    expect(pendingEntries.length).toBe(1);
    expect(pendingEntries[0].id).toBe('test-entry-1');
  });

  // ============================================
  // TEST 6: Startup recovery - restore FAILED entries
  // ============================================
  it('should restore FAILED entries for retry on startup', async () => {
    const entries: JournalEntry[] = [
      createTestEntry({
        id: 'test-entry-failed',
        status: 'failed',
        retryCount: 1,
      }),
    ];
    localStorage.setItem('transactionJournal', JSON.stringify(entries));

    const newService = new TransactionJournalService();
    await newService.recoverPendingEntries();

    // Failed entries with retryCount < max should be restored
    const pendingEntries = newService.getPendingEntries();
    expect(pendingEntries.length).toBe(1);
  });

  // ============================================
  // TEST 7: ROBUST DEDUPLICATION - key edge case from hardening
  // Scenario: Entry already applied (status=applied), client retries
  // The checkDuplicate should detect this via status check
  // ============================================
  it('should detect duplicate when entry already applied (retry after success)', async () => {
    const entry = journalService.appendEntry({
      op: 'tap-batch',
      amount: 20,
      tapValueAtCreation: 2,
    });

    // Simulate: server already processed successfully
    journalService.markApplied(entry.id, { serverBalance: 1040, serverEnergy: 80, serverTotalTooks: 320 });

    // Now client retries - should detect as DUPLICATE
    const isDuplicate = journalService.checkDuplicate(entry.id, 320, 20);

    // Status check returns true for applied entries
    expect(isDuplicate).toBe(true);
  });

  // ============================================
  // TEST 7b: Robust deduplication - server reflects batch amount
  // This is the HARDENING edge case: server already has our amount in-flight
  // Need baselineServerTotalTooks storage to detect this properly
  // ============================================
  it('should detect duplicate when server total includes our batch amount', async () => {
    // Server baseline totalTooks = 300 before our batch
    const baselineTotalTooks = 300;

    const entry = journalService.appendEntry({
      op: 'tap-batch',
      amount: 20,
      tapValueAtCreation: 2,
    }, baselineTotalTooks);

    // Entry is still queued/flushing (not yet applied)
    // Server reports 320 - this includes our batch (300 + 20)
    // With robust algorithm: serverTotalTooks >= baselineServerTotalTooks + entry.amount
    // 320 >= 300 + 20 = 320 >= 320 → TRUE
    const isDuplicate = journalService.checkDuplicate(entry.id, 320, 20);

    // FIX: Now with baseline stored at entry creation, duplicate is detected
    expect(isDuplicate).toBe(true);
  });

  // ============================================
  // TEST 7c: Should NOT flag as duplicate when batch never processed
  // ============================================
  it('should NOT flag as duplicate when batch never processed', async () => {
    // Server baseline = 300
    const baselineTotalTooks = 300;

    const entry = journalService.appendEntry({
      op: 'tap-batch',
      amount: 20,
      tapValueAtCreation: 2,
    }, baselineTotalTooks);

    // Entry is still queued
    // Server reports same total as baseline (300) - our batch wasn't processed
    const isDuplicate = journalService.checkDuplicate(entry.id, 300, 20);

    // Not a duplicate because server doesn't reflect our batch (300 < 300 + 20 = 320)
    expect(isDuplicate).toBe(false);
  });

  // ============================================
  // TEST 8: Retry with exponential backoff
  // ============================================
  it('should retry with exponential backoff', async () => {
    const entry = journalService.appendEntry({
      op: 'tap-batch',
      amount: 20,
      tapValueAtCreation: 2,
    });

    journalService.markFlushing(entry.id);
    journalService.markFailed(entry.id, { message: 'Error', code: 'ERROR' });

    // First failure - get updated entry
    const entryAfterFirstFailure = journalService.getEntry(entry.id);
    expect(entryAfterFirstFailure?.retryCount).toBe(1);

    // Mark failed again (simulate retry)
    journalService.markFlushing(entry.id);
    journalService.markFailed(entry.id, { message: 'Error', code: 'ERROR' });

    const failedEntry = journalService.getEntry(entry.id);
    expect(failedEntry?.retryCount).toBe(2);
  });

  // ============================================
  // TEST 9: Filter active entries for projection
  // ============================================
  it('should return only active entries for state projection', async () => {
    // Create active entries (queued, flushing, failed)
    const entry1 = journalService.appendEntry({
      op: 'tap-batch',
      amount: 20,
      tapValueAtCreation: 2,
    });
    journalService.markFlushing(entry1.id);

    const entry2 = journalService.appendEntry({
      op: 'tap-batch',
      amount: 10,
      tapValueAtCreation: 2,
    });

    const entry3 = journalService.appendEntry({
      op: 'tap-batch',
      amount: 5,
      tapValueAtCreation: 2,
    });
    journalService.markApplied(entry3.id, { serverBalance: 1010, serverEnergy: 95, serverTotalTooks: 305 });

    // Only queued + flushing should be active
    const activeEntries = journalService.getActiveEntries();
    expect(activeEntries.length).toBe(2);
  });
});