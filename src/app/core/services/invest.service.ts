import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
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
  private async loadPlayers(): Promise<void> {
    const result = await this.getPlayers();
    if (result.success && result.players) {
      this._players.set(result.players);
    }
  }

  // ============== API Methods ==============
  private pendingGetPlayers: Promise<{ success: boolean; error?: string; players?: InvestApiPlayer[] }> | null = null;

  private getBaseUrl(): string {
    return environment.apiBaseUrl;
  }

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

  // TODO: Implement when API is ready
  async buyPlayer(playerId: number): Promise<{ success: boolean; error?: string; message?: string }> {
    return { success: false, error: 'Not implemented yet' };
  }
}
