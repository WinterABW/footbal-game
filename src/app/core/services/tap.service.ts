import { Injectable, inject, computed, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { EncryptionService } from './encryption.service';
import { UserStatusService } from '../../core/services/user-status.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TapService {
  private userStatusService = inject(UserStatusService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private encryptionService = inject(EncryptionService);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly secretKey = environment.tapSecretKey;
  private readonly PENDING_TAPS_KEY = 'pendingTaps';
  private readonly BATCH_SIZE = 100;
  private isFlushing = false;
  
  // Signal to track pending taps waiting to be sent to API
  private pendingTaps = signal<number>(0);

  constructor() {
    // Initialize pending taps from localStorage
    const storedPending = localStorage.getItem(this.PENDING_TAPS_KEY);
    if (storedPending) {
      const pendingCount = parseInt(storedPending, 10);
      if (!isNaN(pendingCount)) {
        this.pendingTaps.set(pendingCount);
      }
    }
  }

  // Signals conectados a UserStatusService
  readonly coins = computed(() => {
    const serverBalance = this.userStatusService.wallet()?.principalBalance ?? 0;
    return serverBalance + this.pendingTaps();
  });
  readonly totalTaps = computed(() => this.userStatusService.totalTooks());

  // Computed para determinar el nivel basado en el perfil
  readonly level = this.userStatusService.level;

  // Valor por tap calculado desde UserStatusService
  readonly tapValue = this.userStatusService.tapValue;

  setCoins(coins: number) {
    // Balance is now managed by API, this method is deprecated
  }

  getCoins(): number {
    return this.coins();
  }

  addCoins(amount: number) {
    // Balance is now managed by API, this method is deprecated
  }

  removeCoins(amount: number) {
    // Balance is now managed by API, this method is deprecated
  }

  async addTap(count: number = 1) {
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

  // Method to manually flush pending taps (called from NavigationSyncService)
  async flushPendingTaps(): Promise<void> {
    if (this.isFlushing) return;

    const user = this.authService.user();
    const userId = user ? (user.id || user.Id) : null;
    if (!userId) {
      console.error('User not logged in', user);
      return;
    }

    const pendingCount = this.pendingTaps();
    if (pendingCount === 0) return;

    // Reset pending taps immediately to prevent race condition
    this.isFlushing = true;
    localStorage.setItem(this.PENDING_TAPS_KEY, '0');
    this.pendingTaps.set(0);

    const timestamp = Math.floor(Date.now() / 1000);
    const payload = `${userId}:${timestamp}:${this.secretKey}`;
    
    try {
      const token = await this.encryptionService.sha256(payload);

      const url = `${this.baseUrl}Game/addTooks`;
      this.http.post(url, { amount: pendingCount, token, timestamp }).subscribe({
        next: async () => {
          console.log(`Sent ${pendingCount} taps to API`);
          
          // Refresh user status to update wallet
          await this.userStatusService.loadUserStatus();
          this.isFlushing = false;
        },
        error: (error: unknown) => {
          // Restore pending taps on failure so they can be retried
          this.pendingTaps.update(current => current + pendingCount);
          localStorage.setItem(this.PENDING_TAPS_KEY, this.pendingTaps().toString());
          this.isFlushing = false;
          
          const httpError = error as HttpErrorResponse;
          if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
            console.error('AddTooks failed:', (httpError.error as { message: string }).message);
          } else {
            console.error('AddTooks failed:', error);
          }
        }
      });
    } catch (error) {
      // Restore pending taps on failure
      this.pendingTaps.update(current => current + pendingCount);
      localStorage.setItem(this.PENDING_TAPS_KEY, this.pendingTaps().toString());
      this.isFlushing = false;
      console.error('Failed to generate token:', error);
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
}
