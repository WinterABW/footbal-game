import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiMessageResponse } from '../../models/user.model';
import { InvestApiPlayer } from '../../models/invest.model';
import { Player, PLAYER_API_DEFAULTS } from '../../models/player.model';
import { withRetry } from '../utils/retry.util';

/**
 * HTTP client for the Invest API endpoints.
 *
 * Responsibilities:
 * - Fetch player lists from the API (GET /Invest/getPlayers)
 * - Purchase players (POST /Invest/buyPlayer)
 * - Add investments (POST /Invest/addInvestment)
 *
 * Features:
 * - Request deduplication: prevents duplicate getPlayers calls while one is in flight
 * - Retry with exponential backoff: 3 attempts, 500ms base delay + jitter
 * - Maps API response format to canonical Player interface
 *
 * NOTE: This service does NOT handle offline detection or caching.
 * That's PlayersService's responsibility.
 */
@Injectable({
  providedIn: 'root',
})
export class InvestService {
  private http = inject(HttpClient);

  /**
   * Pending getPlayers promise for request deduplication.
   * If non-null, a request is in flight and callers get the same promise.
   */
  private pendingGetPlayers: Promise<{ success: boolean; error?: string; players?: Player[] }> | null = null;

  private getBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  /**
   * Adds an investment via the API.
   *
   * @param articleId - The article/investment ID.
   * @param uid - The user ID.
   * @returns `{ success, error?, message? }`.
   */
  async addInvestment(articleId: number, uid: number): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const url = `${this.getBaseUrl()}Invest/addInvestment`;
      const response = await withRetry(
        () => this.http.post<ApiMessageResponse>(url, { articleId, uid }).toPromise(),
        { maxAttempts: 3, baseDelayMs: 500 }
      );

      if (response) {
        return { success: true, message: response.message };
      }

      return { success: false, error: 'Failed to add investment' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 400) {
        return { success: false, error: 'Bad request' };
      }
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      if (httpError?.status === 404) {
        return { success: false, error: 'Not found' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      return { success: false, error: 'Failed to add investment' };
    }
  }

  /**
   * Maps an API player response to the canonical Player interface.
   *
   * Field mapping:
   *   days → contract_days, interest → earning, isVIP → exclusive
   *   Missing fields get defaults from PLAYER_API_DEFAULTS.
   */
  static mapApiPlayerToPlayer(api: InvestApiPlayer): Player {
    return {
      id: api.id,
      name: api.name,
      price: api.price,
      description: api.description,
      imageUrl: PLAYER_API_DEFAULTS.imageUrl,
      earning: api.interest ?? PLAYER_API_DEFAULTS.earning,
      level: PLAYER_API_DEFAULTS.level,
      exclusive: api.isVIP ?? false,
      contract_days: api.days ?? PLAYER_API_DEFAULTS.contract_days,
      age: PLAYER_API_DEFAULTS.age,
      injuries: PLAYER_API_DEFAULTS.injuries,
      height: PLAYER_API_DEFAULTS.height,
    };
  }

  /**
   * Fetches players from the API with retry logic and request dedup.
   * If a request is already in flight, returns the same promise.
   */
  async getPlayers(): Promise<{ success: boolean; error?: string; players?: Player[] }> {
    // Dedup: return existing promise if a request is already in flight
    if (this.pendingGetPlayers) {
      return this.pendingGetPlayers;
    }

    const url = `${this.getBaseUrl()}Invest/getPlayers`;

    this.pendingGetPlayers = withRetry(
      () => this.http.get<InvestApiPlayer[]>(url).toPromise(),
      { maxAttempts: 3, baseDelayMs: 500 }
    ).then(response => {
      if (!response) {
        return { success: false, error: 'Empty response from server' };
      }
      const players = response.map(api => InvestService.mapApiPlayerToPlayer(api));
      return { success: true, players };
    }).catch((error: unknown) => {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      return { success: false, error: 'Failed to get players' };
    }).finally(() => {
      // Clear the pending request so future calls can make new requests
      this.pendingGetPlayers = null;
    });

    return this.pendingGetPlayers;
  }

  /**
   * Buys a player via the API.
   * @param playerId - The ID of the player to purchase.
   * @param uid - Optional user ID; if not provided, the backend uses the authenticated user.
   */
  async buyPlayer(playerId: number, uid?: number): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const url = `${this.getBaseUrl()}Invest/buyPlayer`;
      const body: Record<string, number> = { playerId };
      if (uid !== undefined) {
        body['uid'] = uid;
      }
      const response = await withRetry(
        () => this.http.post<ApiMessageResponse>(url, body).toPromise(),
        { maxAttempts: 3, baseDelayMs: 500 }
      );

      if (response) {
        return { success: true, message: response.message };
      }

      return { success: false, error: 'Failed to buy player' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 400) {
        return { success: false, error: 'Bad request — invalid player or insufficient balance' };
      }
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      if (httpError?.status === 404) {
        return { success: false, error: 'Player not found' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      return { success: false, error: 'Failed to buy player' };
    }
  }
}
