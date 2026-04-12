import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { InvestApiPlayer } from '../../models/invest.model';
import { withRetry } from '../utils/retry.util';

interface ApiMessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class InvestService {
  private http = inject(HttpClient);

  // ============== Players State ==============
  private _availablePlayers = signal<InvestApiPlayer[]>([]);
  private _vipPlayers = signal<InvestApiPlayer[]>([]);
  private _boughtPlayers = signal<InvestApiPlayer[]>([]);

  readonly availablePlayers = computed(() => this._availablePlayers());
  readonly vipPlayers = computed(() => this._vipPlayers());
  readonly boughtPlayers = computed(() => this._boughtPlayers());

  constructor() {
    this.loadAvailablePlayers();
    this.loadVipPlayers();
    this.loadBoughtPlayers();
  }

  // ============== Players Methods ==============
  private addImageUrl(players: InvestApiPlayer[]): InvestApiPlayer[] {
    return players.map(p => ({
      ...p,
      imagen: `${this.getBaseUrl()}images/players/${p.id}.webp`,
    }));
  }

  async loadAvailablePlayers(): Promise<void> {
    const result = await this.getPlayers({ isBuyed: false, isVIP: false });
    if (result.success && result.players) {
      this._availablePlayers.set(this.addImageUrl(result.players));
    }
  }

  async loadVipPlayers(): Promise<void> {
    const result = await this.getPlayers({ isBuyed: false, isVIP: true });
    if (result.success && result.players) {
      this._vipPlayers.set(this.addImageUrl(result.players));
    }
  }

  async loadBoughtPlayers(): Promise<void> {
    const result = await this.getPlayers({ isBuyed: true });
    if (result.success && result.players) {
      this._boughtPlayers.set(this.addImageUrl(result.players));
    }
  }

  // Legacy method for backward compatibility
  async loadPlayers(): Promise<void> {
    await this.loadAvailablePlayers();
    await this.loadVipPlayers();
  }

  // ============== API Methods ==============
  private pendingGetPlayers: Map<string, Promise<{ success: boolean; error?: string; players?: InvestApiPlayer[] }>> = new Map();

  private getBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  /**
   * Get players with optional query filters
   * @param filters - Optional filter parameters
   */
  async getPlayers(filters: {
    id?: number;
    name?: string;
    isVIP?: boolean;
    isBuyed?: boolean;
  } = {}): Promise<{ success: boolean; error?: string; players?: InvestApiPlayer[] }> {
    // Build cache key from filters
    const cacheKey = JSON.stringify(filters);
    
    if (this.pendingGetPlayers.has(cacheKey)) {
      return this.pendingGetPlayers.get(cacheKey)!;
    }

    // Build query string
    const params = new URLSearchParams();
    if (filters.id !== undefined) params.set('id', filters.id.toString());
    if (filters.name) params.set('name', filters.name);
    if (filters.isVIP !== undefined) params.set('isVIP', filters.isVIP.toString());
    if (filters.isBuyed !== undefined) params.set('isBuyed', filters.isBuyed.toString());

    const queryString = params.toString();
    const url = `${this.getBaseUrl()}Invest/getPlayers${queryString ? '?' + queryString : ''}`;

    const promise = withRetry(
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
      this.pendingGetPlayers.delete(cacheKey);
    });

    this.pendingGetPlayers.set(cacheKey, promise);
    return promise;
  }

  async buyPlayer(articleId: number, timestamp: number, token: string, uid: number): Promise<{ success: boolean; error?: string; message?: string }> {
    // AUDITORÍA: Registrar acción financiera antes del call HTTP
    console.log(`[AUDIT] buyPlayer:`, { articleId, uid, timestamp });
    localStorage.setItem(`audit_log_${Date.now()}`, JSON.stringify({ action: 'buyPlayer', params: { articleId, uid, timestamp }, time: Date.now() }));

    try {
      const url = `${this.getBaseUrl()}Invest/addInvestment`;
      const response = await withRetry(
        () => this.http.post<ApiMessageResponse>(url, { articleId, timestamp, token, uid }).toPromise(),
        { maxAttempts: 3, baseDelayMs: 500 }
      );

      // SEGURIDAD: Validar respuesta del backend
      if (!response || typeof response.message !== 'string') {
        console.error('[SECURITY] Backend devolvió datos corruptos en buyPlayer:', response);
        return { success: false, error: 'Respuesta inválida del servidor' };
      }

      if (response) {
        return { success: true, message: response.message };
      }

      return { success: false, error: 'No se recibió respuesta del servidor' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;

      const serverMessage = httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error
        ? (httpError.error as ApiMessageResponse).message
        : null;

      // Mostrar error al usuario
      console.error('[ERROR] buyPlayer failed:', serverMessage ?? error);

      if (httpError?.status === 400) {
        return { success: false, error: serverMessage ?? 'Solicitud no válida' };
      }
      if (httpError?.status === 401) {
        return { success: false, error: 'Sesión expirada. Inicia sesión nuevamente.' };
      }
      if (httpError?.status === 404) {
        return { success: false, error: 'Jugador no disponible' };
      }
      return { success: false, error: serverMessage ?? 'No se pudo completar la compra. Intenta de nuevo.' };
    }
  }
}
