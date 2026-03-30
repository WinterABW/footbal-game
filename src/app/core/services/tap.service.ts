import { Injectable, inject, computed, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LocalApiService } from './local-api.service';
import { AuthService } from '../../core/services/auth.service';
import { EncryptionService } from './encryption.service';
import { UserStatusService } from '../../core/services/user-status.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TapService {
  private localApi = inject(LocalApiService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private encryptionService = inject(EncryptionService);
  private userStatusService = inject(UserStatusService);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly secretKey = 'MiClaveSecreta123!';
  private readonly PENDING_TAPS_KEY = 'pendingTaps';
  private readonly BATCH_SIZE = 100;
  
  // Signal to track pending taps waiting to be sent to API
  private pendingTaps = signal<number>(0);

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

    // Load pending taps from localStorage
    const storedPending = localStorage.getItem(this.PENDING_TAPS_KEY);
    let pendingCount = storedPending ? parseInt(storedPending, 10) : 0;
    pendingCount += count;
    localStorage.setItem(this.PENDING_TAPS_KEY, pendingCount.toString());
    this.pendingTaps.set(pendingCount);

    // If we have enough taps, send to API
    if (pendingCount >= this.BATCH_SIZE) {
      this.flushPendingTaps();
    }
  }

  private async flushPendingTaps() {
    const user = this.authService.user();
    const userId = user ? (user.id || user.Id) : null;
    if (!userId) {
      console.error('User not logged in', user);
      return;
    }

    const pendingCount = this.pendingTaps();
    if (pendingCount === 0) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const payload = `${userId}:${timestamp}:${this.secretKey}`;
    
    try {
      const token = await this.encryptionService.sha256(payload);

      const url = `${this.baseUrl}Game/addTooks`;
      this.http.post(url, { amount: pendingCount, token, timestamp }).subscribe({
        next: async () => {
          // On success, reset pending taps
          localStorage.setItem(this.PENDING_TAPS_KEY, '0');
          this.pendingTaps.set(0);
          console.log(`Sent ${pendingCount} taps to API`);
          
          // Refresh user status to update wallet
          await this.userStatusService.loadUserStatus();
        },
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

  // Method to manually flush pending taps (useful when user is about to logout)
  async flushPendingTapsIfAny() {
    const storedPending = localStorage.getItem(this.PENDING_TAPS_KEY);
    if (storedPending && parseInt(storedPending, 10) > 0) {
      await this.flushPendingTaps();
    }
  }

  getTotalTaps(): number {
    return this.totalTaps();
  }
}
