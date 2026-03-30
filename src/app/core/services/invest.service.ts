import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiMessageResponse } from '../../models/user.model';
import { InvestApiPlayer } from '../../models/invest.model';
import { withRetry } from '../utils/retry.util';

@Injectable({
  providedIn: 'root',
})
export class InvestService {
  private http = inject(HttpClient);

  // ============== Players State ==============
  private _players = signal<InvestApiPlayer[]>([]);

  readonly availablePlayers = computed(() => this._players().filter(p => !p.isVIP));
  readonly vipPlayers = computed(() => this._players().filter(p => p.isVIP));

  constructor() {
    this.loadPlayers();
  }

  // ============== Players Methods ==============
  async loadPlayers(): Promise<void> {
    const result = await this.getPlayers();
    if (result.success && result.players) {
      this._players.set(result.players);
    }
  }

  // ============== Private ==============
  private pendingGetPlayers: Promise<{ success: boolean; error?: string; players?: InvestApiPlayer[] }> | null = null;

  private getBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  // ============== API Methods ==============
  async getPlayers(): Promise<{ success: boolean; error?: string; players?: InvestApiPlayer[] }> {
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
      return { success: true, players: response };
    }).catch((error: unknown) => {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      return { success: false, error: 'Failed to get players' };
    }).finally(() => {
      this.pendingGetPlayers = null;
    });

    return this.pendingGetPlayers;
  }

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
}
