import { Injectable, inject, signal, computed } from '@angular/core';
import { LocalApiService } from './local-api.service';
import { InvestService } from './invest.service';
import { StorageService } from './storage.service';
import { ErrorHandlerService } from './error-handler.service';
import { ConnectivityService } from './connectivity.service';
import type { Player } from '../../models/player.model';

export type { Player };

/** Cache structure stored in localStorage. */
interface PlayersCache {
  players: Player[];
  timestamp: number;
}

const CACHE_KEY = 'nequi_players_api_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * ============================================================
 * DATA FLOW — PlayersService
 * ============================================================
 *
 * 1. Constructor: seeds signals from LocalApiService (instant UI)
 * 2. Constructor: triggers refreshPlayers() in background
 * 3. refreshPlayers():
 *    a. If offline → loadCache() or fallbackToLocal(), show info toast
 *    b. If online → InvestService.getPlayers() (API with retry)
 *       - Success → update signals + saveCache()
 *       - Failure → loadCache() → if no cache → fallbackToLocal()
 * 4. buyPlayer():
 *    a. If offline → LocalApiService.purchasePlayer() only
 *    b. If online → InvestService.buyPlayer() first
 *       - Success → sync local + refreshPlayers()
 *       - Failure → LocalApiService.purchasePlayer() fallback
 *
 * Fallback chain: API → localStorage cache → LocalApiService defaults
 * Retry strategy: 3 attempts, exponential backoff + jitter (see retry.util.ts)
 *
 * ============================================================
 * ROLLBACK PLAN
 * ============================================================
 *
 * If the API integration causes issues, rollback by:
 * 1. Remove `refreshPlayers()` call from constructor (line ~74)
 * 2. Change `loadFromLocal()` to be the only data source
 * 3. LocalApiService.initialize() is still called in app.config.ts
 *    and provides full functionality independently.
 *
 * The app will work identically to pre-API state — LocalApiService
 * handles all player data, purchases, and earnings on its own.
 * No data loss risk — API data is additive, local data is never deleted.
 * ============================================================
 */

/**
 * Manages player data with an API-first strategy.
 *
 * DEPENDENCY NOTE: LocalApiService is NOT deprecated.
 * It serves two critical roles:
 *   1. Provides instant UI data on construction (before API responds)
 *   2. Acts as last-resort fallback when API AND cache both fail
 *   3. Owns all mutation logic (purchasePlayer, ownedPlayers state)
 *
 * LocalApiService is also used by 14+ other components/services for
 * profile, energy, boosts, transactions, and game state — it's a
 * core service, not just a fallback.
 */
@Injectable({
  providedIn: 'root',
})
export class PlayersService {
  private localApi = inject(LocalApiService);
  private investService = inject(InvestService);
  private storage = inject(StorageService);
  private errorHandler = inject(ErrorHandlerService);
  private connectivity = inject(ConnectivityService);

  // ---------- Loading & error signals ----------
  private _isLoadingApi = signal(false);
  private _apiError = signal<string | null>(null);
  private _usingCache = signal(false);
  /** Prevents duplicate refreshPlayers calls (Task 3.3). */
  private _refreshInProgress = signal(false);

  /** True while API data is being fetched. */
  readonly isLoadingApi = this._isLoadingApi.asReadonly();
  /** Last API error message, null if successful. */
  readonly apiError = this._apiError.asReadonly();
  /** True when displaying cached data because API failed. */
  readonly usingCache = this._usingCache.asReadonly();
  /** True when a refresh is in progress (prevents duplicate calls). */
  readonly refreshInProgress = this._refreshInProgress.asReadonly();

  // ---------- Data signals (API-first, local fallback) ----------
  private _availablePlayers = signal<Player[]>([]);
  private _vipPlayers = signal<Player[]>([]);
  private _ownedPlayers = signal<Player[]>([]);

  /** Players available for purchase (market). */
  readonly availablePlayers = this._availablePlayers.asReadonly();
  /** VIP players available for purchase. */
  readonly vipPlayers = this._vipPlayers.asReadonly();
  /** Players the user has purchased. */
  readonly ownedPlayers = this._ownedPlayers.asReadonly();

  /** Alias for compatibility. */
  readonly myPlayers = this.ownedPlayers;
  /** Alias for compatibility. */
  readonly regularPlayers = this.availablePlayers;

  /**
   * Overall loading state.
   * True while LocalApiService hasn't initialized OR API fetch is in progress.
   */
  readonly isLoading = computed(
    () => !this.localApi.isInitialized() || this._isLoadingApi()
  );

  /** True when the device is offline (no network connectivity). */
  readonly isOffline = computed(() => !this.connectivity.isOnline());

  constructor() {
    // Auto-initialize with local data, then try API in background
    this.loadFromLocal();
    this.refreshPlayers();
  }

  /**
   * Seeds signals from LocalApiService so the UI has data immediately.
   */
  private loadFromLocal(): void {
    this._availablePlayers.set(this.localApi.availablePlayers());
    this._vipPlayers.set(this.localApi.vipPlayers());
    this._ownedPlayers.set(this.localApi.ownedPlayers());
  }

  // ---------- Initialization ----------

  /**
   * Fetches players from the API and updates signals.
   * Falls back to cached data on failure, then to local defaults.
   *
   * Race condition protection (Task 3.3):
   * - Prevents duplicate calls while one is in flight
   * - Uses InvestService dedup as additional safety
   *
   * Offline handling (Task 3.4):
   * - If offline, shows cached data immediately
   * - Skips API call entirely when offline
   */
  async refreshPlayers(): Promise<void> {
    // Task 3.3: Prevent duplicate calls
    if (this._refreshInProgress()) {
      return;
    }
    this._refreshInProgress.set(true);
    this._isLoadingApi.set(true);
    this._apiError.set(null);
    this._usingCache.set(false);

    try {
      // Task 3.4: Offline detection — skip API, use cache
      if (this.connectivity.offline) {
        this.handleOfflineFallback();
        return;
      }

      const result = await this.investService.getPlayers();

      if (result.success && result.players) {
        // API success — split into regular and VIP
        const regular = result.players.filter(p => !p.exclusive);
        const vip = result.players.filter(p => p.exclusive);

        this._availablePlayers.set(regular);
        this._vipPlayers.set(vip);
        // owned players stay local (not from API)
        this._ownedPlayers.set(this.localApi.ownedPlayers());

        // Update cache
        this.saveCache(result.players);
      } else {
        // API failed — try cache
        this._apiError.set(result.error ?? 'Failed to load players');

        // Task 3.2: Show user-friendly error toast
        this.errorHandler.showErrorToast(
          { status: 0, error: { message: result.error } },
          'players_load'
        );

        const cached = this.loadCache();
        if (cached) {
          this._usingCache.set(true);
          const regular = cached.filter(p => !p.exclusive);
          const vip = cached.filter(p => p.exclusive);
          this._availablePlayers.set(regular);
          this._vipPlayers.set(vip);
          this._ownedPlayers.set(this.localApi.ownedPlayers());
        } else {
          // No cache — fall back to local defaults
          this._usingCache.set(true);
          this.fallbackToLocal();
        }
      }
    } finally {
      this._isLoadingApi.set(false);
      this._refreshInProgress.set(false);
    }
  }

  /**
   * Handles offline fallback: loads cached data or local defaults.
   * Shows an info toast to inform the user.
   */
  private handleOfflineFallback(): void {
    const cached = this.loadCache();
    if (cached) {
      this._usingCache.set(true);
      const regular = cached.filter(p => !p.exclusive);
      const vip = cached.filter(p => p.exclusive);
      this._availablePlayers.set(regular);
      this._vipPlayers.set(vip);
      this._ownedPlayers.set(this.localApi.ownedPlayers());

      this.errorHandler.showToast(
        'Sin conexión. Mostrando datos guardados.',
        'info',
        4000
      );
    } else {
      this._usingCache.set(true);
      this.fallbackToLocal();
      this.errorHandler.showToast(
        'Sin conexión. Mostrando datos locales.',
        'info',
        4000
      );
    }
    this._isLoadingApi.set(false);
    this._refreshInProgress.set(false);
  }

  // ---------- Cache (Task 2.3) ----------

  private saveCache(players: Player[]): void {
    if (!this.storage.isBrowser) return;
    const cache: PlayersCache = {
      players,
      timestamp: Date.now(),
    };
    this.storage.set(CACHE_KEY, cache);
  }

  private loadCache(): Player[] | null {
    if (!this.storage.isBrowser) return null;
    const cache = this.storage.get<PlayersCache>(CACHE_KEY);
    if (!cache) return null;

    const age = Date.now() - cache.timestamp;
    if (age > CACHE_TTL_MS) {
      // Cache expired — clear it
      this.storage.remove(CACHE_KEY);
      return null;
    }

    return cache.players;
  }

  private clearCache(): void {
    this.storage.remove(CACHE_KEY);
  }

  private fallbackToLocal(): void {
    this._availablePlayers.set(this.localApi.availablePlayers());
    this._vipPlayers.set(this.localApi.vipPlayers());
    this._ownedPlayers.set(this.localApi.ownedPlayers());
  }

  // ---------- Public API ----------

  /**
   * Returns players available for purchase (not yet owned).
   * Combines regular + VIP players, excluding already-owned ones.
   *
   * @returns Array of unowned players from both regular and VIP lists.
   */
  getAvailableForPurchase(): Player[] {
    const ownedIds = new Set(this._ownedPlayers().map(p => p.id));
    return [
      ...this._availablePlayers().filter(p => !ownedIds.has(p.id)),
      ...this._vipPlayers().filter(p => !ownedIds.has(p.id)),
    ];
  }

  /**
   * Purchase a player. API-first with local fallback.
   *
   * Flow:
   * 1. Offline → local purchase only (with info toast)
   * 2. Online → InvestService.buyPlayer()
   *    - Success → sync local state + refresh from API
   *    - Failure → fallback to LocalApiService.purchasePlayer()
   *
   * @param player - The player to purchase.
   * @returns `{ success, message }` — message is user-facing (Spanish).
   */
  async buyPlayer(player: Player): Promise<{ success: boolean; message: string }> {
    if (!player || !player.id) {
      return { success: false, message: 'Jugador inválido' };
    }

    // Task 3.4: Offline check
    if (this.connectivity.offline) {
      // Offline — use local purchase only
      const localResult = this.localApi.purchasePlayer(player.id);
      if (localResult.success) {
        this._ownedPlayers.set(this.localApi.ownedPlayers());
        this.errorHandler.showSuccessToast(`¡${player.name} comprado! (sin conexión)`);
      } else {
        this.errorHandler.showErrorToast({ status: 0 }, 'buy');
      }
      return localResult;
    }

    // Try API first
    const apiResult = await this.investService.buyPlayer(player.id);

    if (apiResult.success) {
      // Update local state to reflect purchase
      this.localApi.purchasePlayer(player.id);
      this._ownedPlayers.set(this.localApi.ownedPlayers());

      // Task 3.2: Success toast
      this.errorHandler.showSuccessToast(apiResult.message ?? `¡${player.name} comprado!`);

      // Refresh from API to stay in sync
      this.refreshPlayers();

      return { success: true, message: apiResult.message ?? `¡${player.name} comprado!` };
    }

    // API failed — fall back to local purchase
    const localResult = this.localApi.purchasePlayer(player.id);

    if (localResult.success) {
      this._ownedPlayers.set(this.localApi.ownedPlayers());
      this.errorHandler.showSuccessToast(`¡${player.name} comprado!`);
    } else {
      // Task 3.2: Error toast
      this.errorHandler.showErrorToast({ status: 0, error: { message: apiResult.error } }, 'buy');
    }

    return localResult;
  }

  /**
   * Returns the user's owned (purchased) players.
   * This data is always local — owned players are not from the API.
   */
  getMyPlayers(): Player[] {
    return this._ownedPlayers();
  }

  /**
   * Returns regular (non-VIP) players from the API or cache.
   */
  getRegularPlayers(): Player[] {
    return this._availablePlayers();
  }

  /**
   * Returns VIP players from the API or cache.
   */
  getVipPlayers(): Player[] {
    return this._vipPlayers();
  }
}
