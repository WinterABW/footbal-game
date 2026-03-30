import { Injectable, inject, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LocalApiService } from './local-api.service';
import { AuthService } from '../../core/services/auth.service';
import { EncryptionService } from './encryption.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TapService {
  private localApi = inject(LocalApiService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private encryptionService = inject(EncryptionService);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly secretKey = 'MiClaveSecreta123!';

  // Signals conectados a LocalApiService
  readonly coins = this.localApi.balance;
  readonly totalTaps = computed(() => this.localApi.stats()?.totalTaps ?? 0);

  // Computed para determinar el nivel basado en el perfil
  readonly level = computed(() => this.localApi.profile()?.level ?? 1);

  // Valor por tap calculado desde LocalApiService
  readonly tapValue = this.localApi.tapValue;

  setCoins(coins: number) {
    this.localApi.setBalance(coins);
  }

  getCoins(): number {
    return this.coins();
  }

  addCoins(amount: number) {
    this.localApi.addEarnings(amount);
  }

  removeCoins(amount: number) {
    this.localApi.updateBalance(-amount);
  }

  async addTap(count: number = 1) {
    // Update local state first
    this.localApi.incrementTaps(count);

    const user = this.authService.user();
    const userId = user ? (user.id || user.Id) : null;
    if (!userId) {
      console.error('User not logged in', user);
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const payload = `${userId}:${timestamp}:${this.secretKey}`;
    try {
      const token = await this.encryptionService.sha256(payload);

      // Sync with server
      const url = `${this.baseUrl}Game/addTooks`;
      this.http.post(url, { amount: count, token, timestamp }).subscribe({
        error: (error: unknown) => {
          const httpError = error as HttpErrorResponse;
          if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
            console.error('AddTooks failed:', (httpError.error as { message: string }).message);
          } else {
            console.error('AddTooks failed:', error);
          }
        }
      });
    } catch (error) {
      console.error('Failed to generate token:', error);
    }
  }

  getTotalTaps(): number {
    return this.totalTaps();
  }
}
