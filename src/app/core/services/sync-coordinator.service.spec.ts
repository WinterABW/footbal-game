import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SyncCoordinatorService, SyncStatus, TapServiceMock, JournalServiceMock } from './sync-coordinator.service';

// ============================================
// TEST DATA & HELPERS
// ============================================

const createMockTapService = (overrides?: { isFlushing?: boolean; pendingTapsCount?: () => number }): TapServiceMock => ({
  isFlushing: false,
  pendingTapsCount: () => 0,
  ...overrides,
});

const createMockJournalService = (overrides?: { 
  getActiveEntries?: () => any[]; 
  getPendingEntries?: () => any[] 
}): JournalServiceMock => ({
  getActiveEntries: () => [],
  getPendingEntries: () => [],
  ...overrides,
});

// ============================================
// TESTS - Cycle 5 Sync Coordinator
// Strict TDD: Write tests FIRST, then implement
// ============================================

describe('SyncCoordinatorService (Cycle 5)', () => {
  let syncCoordinator: SyncCoordinatorService;

  beforeEach(() => {
    localStorage.clear();
    // Create service with no constructor args - use setMocks() for testing
    syncCoordinator = new SyncCoordinatorService();
    syncCoordinator.setMocks(createMockTapService(), createMockJournalService());
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ============================================
  // SAFETY NET: Verify no pre-existing tests fail
  // ============================================

  it('should have SYNC_IDLE when no pending operations', () => {
    expect(syncCoordinator.syncStatus()).toBe('SYNC_IDLE');
  });

  // ============================================
  // TEST 1: RED - SyncStatus transitions based on flush signal
  // ============================================

  it('should show SYNC_IN_PROGRESS when flush is started', () => {
    // Create service and manually mark flush
    const flushingService = new SyncCoordinatorService();
    flushingService.setMocks(createMockTapService(), createMockJournalService());
    
    // Mark flush as started
    flushingService.markFlushStarted();

    expect(flushingService.syncStatus()).toBe('SYNC_IN_PROGRESS');
  });

  // ============================================
  // TEST 2: RED - SyncStatus transitions based on journal pending entries
  // ============================================

  it('should show SYNC_PENDING when journal has active entries', () => {
    const serviceWithPending = new SyncCoordinatorService();
    serviceWithPending.setMocks(
      createMockTapService(),
      createMockJournalService({
        getActiveEntries: () => [{ id: 'entry-1', status: 'queued', amount: 20 }],
      })
    );

    expect(serviceWithPending.syncStatus()).toBe('SYNC_PENDING');
  });

  // ============================================
  // TEST 3: RED - SyncStatus transitions to SYNC_ERROR on failed entries
  // ============================================

  it('should show SYNC_ERROR when journal has failed entries pending retry', () => {
    const serviceWithFailed = new SyncCoordinatorService();
    serviceWithFailed.setMocks(
      createMockTapService(),
      createMockJournalService({
        getActiveEntries: () => [],
        getPendingEntries: () => [{ id: 'entry-1', status: 'failed', amount: 20, retryCount: 1 }],
      })
    );

    expect(serviceWithFailed.syncStatus()).toBe('SYNC_ERROR');
  });

  // ============================================
  // TEST 4: GREEN - Priority order: IN_PROGRESS > PENDING > ERROR > IDLE
  // ============================================

  it('should prioritize SYNC_IN_PROGRESS over SYNC_PENDING', () => {
    const serviceWithBoth = new SyncCoordinatorService();
    serviceWithBoth.setMocks(
      createMockTapService(),
      createMockJournalService({
        getActiveEntries: () => [{ id: 'entry-1', status: 'queued', amount: 20 }],
      })
    );

    // Mark flush as started - should override PENDING
    serviceWithBoth.markFlushStarted();

    expect(serviceWithBoth.syncStatus()).toBe('SYNC_IN_PROGRESS');
  });

  // ============================================
  // TEST 5: GREEN - Can check if synchronized for guards
  // ============================================

  it('should allow synchronized operations when SYNC_IDLE', () => {
    expect(syncCoordinator.canProceed()).toBe(true);
  });

  // ============================================
  // TEST 6: GREEN - Allow operations when SYNC_PENDING (non-strict)
  // ============================================

  it('should allow operations when SYNC_PENDING (non-strict mode)', () => {
    const pendingService = new SyncCoordinatorService();
    pendingService.setMocks(
      createMockTapService(),
      createMockJournalService({
        getActiveEntries: () => [{ id: 'entry-1', status: 'queued', amount: 20 }],
      })
    );

    // Non-strict should allow PENDING
    expect(pendingService.canProceed()).toBe(true);
  });

  // ============================================
  // TEST 7: GREEN - Block operations when SYNC_ERROR
  // ============================================

  it('should block operations when SYNC_ERROR', () => {
    const errorService = new SyncCoordinatorService();
    errorService.setMocks(
      createMockTapService(),
      createMockJournalService({
        getActiveEntries: () => [],
        getPendingEntries: () => [{ id: 'entry-1', status: 'failed', amount: 20, retryCount: 1 }],
      })
    );

    expect(errorService.canProceed()).toBe(false);
  });

  // ============================================
  // TRIANGULATE - Strict mode blocks PENDING too
  // ============================================

  it('should block operations when SYNC_PENDING in strict mode', () => {
    const pendingService = new SyncCoordinatorService();
    pendingService.setMocks(
      createMockTapService(),
      createMockJournalService({
        getActiveEntries: () => [{ id: 'entry-1', status: 'queued', amount: 20 }],
      })
    );

    // Strict mode should block on PENDING
    expect(pendingService.canProceedStrict()).toBe(false);
  });

  // ============================================
  // TRIANGULATE - Multiple pending entries
  // ============================================

  it('should handle multiple pending entries (queued + flushing -> PENDING)', () => {
    const multiPending = new SyncCoordinatorService();
    multiPending.setMocks(
      createMockTapService(),
      createMockJournalService({
        getActiveEntries: () => [
          { id: 'entry-1', status: 'queued', amount: 20 },
          { id: 'entry-2', status: 'flushing', amount: 10 },
        ],
      })
    );

    // Contains flushing so IN_PROGRESS has priority
    expect(multiPending.syncStatus()).toBe('SYNC_IN_PROGRESS');
  });

  it('should handle multiple queued entries', () => {
    const multiPending = new SyncCoordinatorService();
    multiPending.setMocks(
      createMockTapService(),
      createMockJournalService({
        getActiveEntries: () => [
          { id: 'entry-1', status: 'queued', amount: 20 },
          { id: 'entry-2', status: 'queued', amount: 10 },
        ],
      })
    );

    expect(multiPending.syncStatus()).toBe('SYNC_PENDING');
  });

  // ============================================
  // REFACTOR - Empty states are properly handled
  // ============================================

  it('should return SYNC_IDLE when no activity', () => {
    expect(syncCoordinator.syncStatus()).toBe('SYNC_IDLE');
    expect(syncCoordinator.pendingCount()).toBe(0);
  });

  // ============================================
  // REFACTOR - Status text and labels
  // ============================================

  it('should provide user-friendly status text', () => {
    expect(syncCoordinator.getStatusText()).toBe('Sincronizado');
    expect(syncCoordinator.getStatusLabel()).toBe('Listo');
  });
});

// ============================================
// TESTS - ensureSynchronized Guard Function
// ============================================

describe('ensureSynchronized (guard)', () => {
  let syncCoordinator: SyncCoordinatorService;

  beforeEach(() => {
    localStorage.clear();
    syncCoordinator = new SyncCoordinatorService();
    syncCoordinator.setMocks(createMockTapService(), createMockJournalService());
  });

  // ============================================
  // TEST 10: Guard allows action when synchronized
  // ============================================

  it('should allow action when SYNC_IDLE', async () => {
    const action = vi.fn().mockResolvedValue('success');

    const result = await syncCoordinator.ensureSynchronized(action);

    expect(result).toBe('success');
    expect(action).toHaveBeenCalled();
  });

  // ============================================
  // TEST 11: Guard blocks action when not synchronized (strict)
  // ============================================

  it('should block action when SYNC_PENDING in strict mode', async () => {
    const pendingSync = new SyncCoordinatorService();
    pendingSync.setMocks(
      createMockTapService(),
      createMockJournalService({
        getActiveEntries: () => [{ id: 'entry-1', status: 'queued', amount: 20 }],
      })
    );

    const action = vi.fn().mockResolvedValue('success');

    const result = await pendingSync.ensureSynchronized(action, { strict: true });

    // Should return error indicating sync is pending
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect((result as any).blocked).toBe(true);
    expect((result as any).reason).toBe('SYNC_PENDING');
    expect(action).not.toHaveBeenCalled();
  });

  // ============================================
  // TEST 12: Guard blocks action when SYNC_ERROR
  // ============================================

  it('should block action when SYNC_ERROR', async () => {
    const errorSync = new SyncCoordinatorService();
    errorSync.setMocks(
      createMockTapService(),
      createMockJournalService({
        getActiveEntries: () => [],
        getPendingEntries: () => [{ id: 'entry-1', status: 'failed', amount: 20, retryCount: 1 }],
      })
    );

    const action = vi.fn().mockResolvedValue('success');

    const result = await errorSync.ensureSynchronized(action);

    expect((result as any).blocked).toBe(true);
    expect((result as any).reason).toBe('SYNC_ERROR');
  });
});

// ============================================
// TESTS - Sync Coordinator UI helpers
// ============================================

describe('SyncCoordinator UI helpers', () => {
  it('should provide correct icons for each status', () => {
    const idleService = new SyncCoordinatorService();
    idleService.setMocks(createMockTapService(), createMockJournalService());
    expect(idleService.getStatusIcon()).toBe('check');

    const pendingService = new SyncCoordinatorService();
    pendingService.setMocks(
      createMockTapService(),
      createMockJournalService({ getActiveEntries: () => [{ id: 'e1', status: 'queued', amount: 10 }] })
    );
    expect(pendingService.getStatusIcon()).toBe('sync');

    const errorService = new SyncCoordinatorService();
    errorService.setMocks(
      createMockTapService(),
      createMockJournalService({ getPendingEntries: () => [{ id: 'e1', status: 'failed', amount: 10, retryCount: 1 }] })
    );
    expect(errorService.getStatusIcon()).toBe('alert');
  });

  it('should provide correct colors for each status', () => {
    const idleService = new SyncCoordinatorService();
    idleService.setMocks(createMockTapService(), createMockJournalService());
    expect(idleService.getStatusColor()).toBe('success');

    const errorService = new SyncCoordinatorService();
    errorService.setMocks(
      createMockTapService(),
      createMockJournalService({ getPendingEntries: () => [{ id: 'e1', status: 'failed', amount: 10, retryCount: 1 }] })
    );
    expect(errorService.getStatusColor()).toBe('error');
  });
});

