import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SyncCoordinatorService, TapServiceMock, JournalServiceMock } from '../../../core/services/sync-coordinator.service';

describe('SyncIndicatorComponent', () => {
  const createMocks = () => ({
    tap: { isFlushing: false, pendingTapsCount: () => 0 } as TapServiceMock,
    journal: { getActiveEntries: () => [], getPendingEntries: () => [] } as JournalServiceMock,
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have idle state when no pending operations', () => {
    const mocks = createMocks();
    const syncCoordinator = new SyncCoordinatorService();
    syncCoordinator.setMocks(mocks.tap, mocks.journal);
    expect(syncCoordinator.getStatus()).toBe('SYNC_IDLE');
  });

  it('should show pending count when there are pending operations', () => {
    const mocks = {
      tap: { isFlushing: false, pendingTapsCount: () => 0 } as TapServiceMock,
      journal: { getActiveEntries: () => [{ id: 'e1', status: 'queued', amount: 20 }], getPendingEntries: () => [] } as JournalServiceMock,
    };
    const syncCoordinator = new SyncCoordinatorService();
    syncCoordinator.setMocks(mocks.tap, mocks.journal);
    expect(syncCoordinator.getStatus()).toBe('SYNC_PENDING');
    expect(syncCoordinator.getPendingOpsCount()).toBe(20);
  });

  it('should show error state when entries failed', () => {
    const mocks = {
      tap: { isFlushing: false, pendingTapsCount: () => 0 } as TapServiceMock,
      journal: { getActiveEntries: () => [], getPendingEntries: () => [{ id: 'e1', status: 'failed', amount: 10, retryCount: 1 }] } as JournalServiceMock,
    };
    const syncCoordinator = new SyncCoordinatorService();
    syncCoordinator.setMocks(mocks.tap, mocks.journal);
    expect(syncCoordinator.getStatus()).toBe('SYNC_ERROR');
    expect(syncCoordinator.getStatusIcon()).toBe('alert');
  });

  it('should show in-progress state when flushing', () => {
    const mocks = createMocks();
    const syncCoordinator = new SyncCoordinatorService();
    syncCoordinator.setMocks(mocks.tap, mocks.journal);
    syncCoordinator.markFlushStarted();
    expect(syncCoordinator.getStatus()).toBe('SYNC_IN_PROGRESS');
    expect(syncCoordinator.getStatusIcon()).toBe('loader');
  });

  it('should provide correct color for each status', () => {
    const mocks = createMocks();
    const syncCoordinator = new SyncCoordinatorService();
    syncCoordinator.setMocks(mocks.tap, mocks.journal);
    
    expect(syncCoordinator.getStatusColor()).toBe('success');

    // Manually set failed entries
    const mocksWithError = {
      tap: { isFlushing: false, pendingTapsCount: () => 0 } as TapServiceMock,
      journal: { getActiveEntries: () => [], getPendingEntries: () => [{ id: 'e1', status: 'failed', amount: 10, retryCount: 1 }] } as JournalServiceMock,
    };
    const errorSync = new SyncCoordinatorService();
    errorSync.setMocks(mocksWithError.tap, mocksWithError.journal);
    expect(errorSync.getStatusColor()).toBe('error');
  });

  it('should provide status label correctly', () => {
    const mocks = createMocks();
    const syncCoordinator = new SyncCoordinatorService();
    syncCoordinator.setMocks(mocks.tap, mocks.journal);
    
    expect(syncCoordinator.getStatusLabel()).toBe('Listo');
    expect(syncCoordinator.getStatusText()).toBe('Sincronizado');
  });
});