import { Injectable, inject, computed, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { EncryptionService } from './encryption.service';
import { UserStatusService } from '../../core/services/user-status.service';
import { TransactionJournalService } from './transaction-journal.service';
import { SyncCoordinatorService } from './sync-coordinator.service';
import { ErrorHandlerService } from './error-handler.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TapService {
  private userStatusService = inject(UserStatusService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private encryptionService = inject(EncryptionService);
  private journalService = inject(TransactionJournalService);
  private syncCoordinator = inject(SyncCoordinatorService, { optional: true });
  private errorHandler = inject(ErrorHandlerService, { optional: true });
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly PENDING_TAPS_KEY = 'pendingTaps';

  // ============================================
  // UNIFIED SCHEDULER CONFIG (Cycle 2)
  // ============================================
  private readonly QUANTITY_THRESHOLD = 20;  // Flush when this many taps accumulate
  private readonly TIME_THRESHOLD_MS = 3000;  // Flush after 3s of inactivity

  // Lock to ensure only ONE flush is in-flight at a time
  private isFlushing = false;

  // Time threshold timer
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTapTime = 0;

  // Signal to track pending taps waiting to be sent to API
  private pendingTaps = signal<number>(0);

  constructor() {
    // Restaurar taps pendientes desde localStorage al iniciar la app
    this.restorePendingTaps();

    // Recovery: restore pending journal entries on startup
    this.journalService.recoverPendingEntries();

    // Usar 'pagehide' que es más fiable para guardar el estado antes de salir
    window.addEventListener('pagehide', () => {
      this.persistPendingTaps();
    });
  }

  // Persistir taps pendientes a localStorage
  private persistPendingTaps() {
    const count = this.pendingTaps();
    localStorage.setItem(this.PENDING_TAPS_KEY, count.toString());
    console.log(`[TapService] Persisted ${count} taps to localStorage on pagehide.`);
  }

  // Restaurar taps desde localStorage
  private restorePendingTaps() {
    const stored = localStorage.getItem(this.PENDING_TAPS_KEY);
    if (stored) {
      const count = parseInt(stored, 10);
      if (!isNaN(count) && count > 0) {
        this.pendingTaps.set(count);
      }
    }
  }

  // Signals conectados a UserStatusService
  readonly coins = computed(() => {
    const serverBalance = this.userStatusService.wallet()?.principalBalance ?? 0;
    const tapValue = this.userStatusService.tapValue() ?? 1;
    return serverBalance + (this.pendingTaps() * tapValue);
  });
  readonly totalTaps = computed(() => this.userStatusService.totalTooks());

  // Computed para determinar el nivel basado en el perfil
  readonly level = this.userStatusService.level;

  // Valor por tap calculado desde UserStatusService
  readonly tapValue = this.userStatusService.tapValue;

  // ============================================
  // ADD TAP - Hybrid Scheduler Logic
  // ============================================
  addTap(count: number = 1) {
    // Update the pending taps counter
    this.pendingTaps.update(t => t + count);
    this.lastTapTime = Date.now();

    // CHECK QUANTITY THRESHOLD - flush when reaching 20 taps
    // Clear timer to prevent double-flush when quantity triggers
    if (this.pendingTaps() >= this.QUANTITY_THRESHOLD) {
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }
      this.triggerFlush();
    } else {
      // Only schedule time threshold if quantity threshold not reached
      this.scheduleTimeFlush();
    }
  }

  // ============================================
  // TIME THRESHOLD SCHEDULER
  // ============================================
  private scheduleTimeFlush(): void {
    // Clear any existing timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Schedule a flush after 3 seconds of inactivity
    this.flushTimer = setTimeout(() => {
      // Always clear timer reference when callback runs
      this.flushTimer = null;

      // Double-check: if quantity threshold was reached while waiting, skip
      if (this.pendingTaps() >= this.QUANTITY_THRESHOLD) {
        console.log('[TapService] Quantity threshold reached before time threshold, skipping time flush.');
        return;
      }

      const pendingCount = this.pendingTaps();
      if (pendingCount > 0) {
        console.log('[TapService] Time threshold reached, flushing pending taps.');
        this.triggerFlush();
      }
    }, this.TIME_THRESHOLD_MS);
  }

  // ============================================
  // TRIGGER FLUSH (internal helper)
  // ============================================
  private triggerFlush(): Promise<void> {
    // Use flushPendingTaps for actual HTTP logic
    // This is async but we don't await here to keep addTap fast
    // Return the promise so callers can await if needed
    return this.flushPendingTaps().catch(err => {
      console.error('[TapService] Background flush failed:', err);
    });
  }

  // ============================================
  // FORCE FLUSH - Immediate sync
  // Called by NavigationSyncService on navigation
  // ============================================
  async forceFlush(): Promise<void> {
    // Clear any scheduled time flush before force-flushing
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    return this.flushPendingTaps();
  }

// ============================================
// CORE FLUSH LOGIC (with single-lock guarantee + Journal)
// ============================================
async flushPendingTaps(): Promise<void> {
    // LOCK: Prevent concurrent flushes
    if (this.isFlushing) {
      console.log('[TapService] Flush already in progress, skipping.');
      return;
    }

    const pendingCount = this.pendingTaps();
    if (pendingCount === 0) {
      console.log('[TapService] No pending taps to flush.');
      return;
    }

    const user = this.authService.user();
    const userId = user ? (user.id || user.Id) : null;
    if (!userId) {
      console.error('[TapService] User not logged in', user);
      return;
    }

    // ACQUIRE LOCK
    this.isFlushing = true;

    // Notify sync coordinator that flush is starting
    if (this.syncCoordinator) {
      this.syncCoordinator.markFlushStarted();
    }

    // Clear any scheduled time flush (we're flushing now)
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Get tap value for optimistic projection
    const tapValue = this.userStatusService.tapValue() ?? 1;

    // FIX: Get baseline server totalTooks for robust deduplication
    const baselineServerTotalTooks = this.userStatusService.totalTooks() ?? 0;

    // Create journal entry BEFORE HTTP call (persists to localStorage)
    // Pass baseline for deduplication check
    let journalEntry = this.journalService.appendEntry({
      op: 'tap-batch',
      amount: pendingCount,
      tapValueAtCreation: tapValue,
    }, baselineServerTotalTooks);

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      // SECURITY FIX: Remove secret key from client. Use userId+timestamp only.
      // Server should validate via session/token, not client-held secrets.
      const payload = `${userId}:${timestamp}`;

      console.log(`[AUDIT] addTooks:`, { userId, amount: pendingCount, timestamp, journalId: journalEntry.id });

      const currentEnergy = this.userStatusService.wallet()?.energy ?? 0;
      const currentBalance = this.userStatusService.wallet()?.principalBalance ?? 0;
      const energyAfterTaps = currentEnergy - pendingCount;
      const balanceAfterTaps = currentBalance + (pendingCount * tapValue);

      // Mark as flushing (updates status in journal)
      this.journalService.markFlushing(journalEntry.id);

      // ATOMICIDAD: Solo procesar si hay suficiente energía. O ambas o ninguna.
      if (energyAfterTaps >= 0) {
        // 1. Enviar Taps (token optional for server-side validation)
        const tooksToken = await this.encryptionService.sha256(payload);
        const tooksUrl = `${this.baseUrl}Game/addTooks`;
        const tooksResponse = await firstValueFrom(
          this.http.post<{ ok?: boolean; balance?: number; totalTooks?: number }>(tooksUrl, { amount: pendingCount, token: tooksToken, timestamp, correlationId: journalEntry.id })
        );
        console.log(`Sent ${pendingCount} taps to API, response:`, tooksResponse);

        // 2. Enviar actualización de Energía
        const energyPayload = `${userId}:${timestamp + 1}`;
        const energyToken = await this.encryptionService.sha256(energyPayload);
        const energyUrl = `${this.baseUrl}Game/updateEnergyState`;
        const energyResponse = await firstValueFrom(
          this.http.post<{ ok?: boolean; energy?: number }>(energyUrl, { energy: energyAfterTaps, token: energyToken, timestamp: timestamp + 1, correlationId: journalEntry.id })
        );
        console.log(`Sent final energy state ${energyAfterTaps} to API, response:`, energyResponse);

        // 3. Mark journal entry as applied (removes from active)
        // Prefer server-provided canonical values, fallback to local calculation
        // Server may return updated balance/totalTooks in response
        const serverBalance = tooksResponse?.balance ?? balanceAfterTaps;
        const serverTotalTooks = tooksResponse?.totalTooks ?? ((this.userStatusService.totalTooks() ?? 0) + pendingCount);
        const serverEnergy = energyResponse?.energy ?? energyAfterTaps;

        this.journalService.markApplied(journalEntry.id, {
          serverBalance: serverBalance,
          serverEnergy: serverEnergy,
          serverTotalTooks: serverTotalTooks,
        });

        // 4. Subtract ONLY the taps that were flushed - preserve any new taps added during flush
        this.pendingTaps.update(current => Math.max(0, current - pendingCount));
        localStorage.setItem(this.PENDING_TAPS_KEY, this.pendingTaps().toString());

      } else {
        // FIX: Preserve pending taps and keep journal entry retryable on insufficient energy
        // DO NOT subtract pendingCount - preserve the pending taps for retry
        // DO NOT call markCancelled - that removes from active and prevents retry
        // Instead, mark as failed so entry remains in retryable state
        this.journalService.markFailed(journalEntry.id, {
          message: `Insufficient energy: have ${currentEnergy}, need ${pendingCount}`,
          code: 'INSUFFICIENT_ENERGY',
        });
        console.warn(`Not enough energy for ${pendingCount} taps. Energy: ${currentEnergy}. Taps preserved for retry.`);
        // NOT necessary to update localStorage here since we didn't change pendingTaps
      }

      // Always reload user status to keep sync
      await this.userStatusService.loadUserStatus();

    } catch (error: any) {
      // Mark journal entry as failed (keeps in journal for retry)
      const httpError = error as HttpErrorResponse;
      const errorMessage = httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error
        ? (httpError.error as { message: string }).message
        : 'Unknown error';

      this.journalService.markFailed(journalEntry.id, {
        message: errorMessage,
        code: httpError?.status?.toString() ?? 'UNKNOWN',
      });

      console.error('Taps/Energy flush failed:', errorMessage);

      // Still try to refresh user status to not stay desynced
      await this.userStatusService.loadUserStatus();
    } finally {
      // RELEASE LOCK - allow next flush
      this.isFlushing = false;

      // Notify sync coordinator that flush ended
      if (this.syncCoordinator) {
        this.syncCoordinator.markFlushEnded();
      }
    }
  }

  // Legacy method for backward compatibility
  async flushPendingTapsIfAny(): Promise<void> {
    const storedPending = localStorage.getItem(this.PENDING_TAPS_KEY);
    if (storedPending && parseInt(storedPending, 10) > 0) {
      await this.flushPendingTaps();
    }
  }

  getTotalTaps(): number {
    return this.totalTaps();
  }

  // Getter público para pending taps (usado por NavigationSyncService)
  pendingTapsCount(): number {
    return this.pendingTaps();
  }
}
