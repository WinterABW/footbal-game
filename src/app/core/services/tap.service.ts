import { Injectable, inject, computed, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
  
  // Race condition protection
  private lastTapTime = 0;
  private lastFlushTime = 0;
  private readonly TAP_THROTTLE_MS = 500;
  
  // Signal to track pending taps waiting to be sent to API
  private pendingTaps = signal<number>(0);

  constructor() {
    // Initialize pending taps from localStorage SOLO al iniciar (no en cada tap)
    const storedPending = localStorage.getItem(this.PENDING_TAPS_KEY);
    if (storedPending) {
      const pendingCount = parseInt(storedPending, 10);
      if (!isNaN(pendingCount)) {
        this.pendingTaps.set(pendingCount);
      }
    }

    // Persistir a localStorage solo cuando el usuario sale de la app
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.persistPendingTaps();
      } else {
        this.restorePendingTaps(); // Restaurar al volver
      }
    });
  }

  // Persistir taps pendientes a localStorage (solo cuando se necesita)
  private persistPendingTaps() {
    const count = this.pendingTaps();
    if (count > 0) {
      localStorage.setItem(this.PENDING_TAPS_KEY, count.toString());
    }
  }

  // Restaurar taps desde localStorage (para cuando vuelve a la app)
  private restorePendingTaps() {
    const stored = localStorage.getItem(this.PENDING_TAPS_KEY);
    if (stored) {
      const count = parseInt(stored, 10);
      if (!isNaN(count) && count > 0) {
        this.pendingTaps.set(count);
        localStorage.setItem(this.PENDING_TAPS_KEY, '0'); // Limpiar después de restore
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

  addTap(count: number = 1) {
    // ULTRA-RÁPIDO: Solo actualiza el signal en memoria, sin localStorage
    // El batch se envía cuando llegue a BATCH_SIZE
    this.pendingTaps.update(t => t + count);
    
    // Si reaches BATCH_SIZE, enviar al backend
    if (this.pendingTaps() >= this.BATCH_SIZE) {
      this.flushPendingTaps();
    }
  }

  // Method to manually flush pending taps (called from NavigationSyncService)
  async flushPendingTaps(): Promise<void> {
    // Proteger contra carrera: si ya está flusheando o pasaron menos de 2s, salir
    if (this.isFlushing && Date.now() - this.lastFlushTime < 2000) return;
    this.isFlushing = true;
    this.lastFlushTime = Date.now();

    const user = this.authService.user();
    const userId = user ? (user.id || user.Id) : null;
    if (!userId) {
      console.error('User not logged in', user);
      this.isFlushing = false;
      return;
    }

    const pendingCount = this.pendingTaps();
    if (pendingCount === 0) {
      this.isFlushing = false;
      return;
    }

    // Reset pending taps immediately to prevent race condition
    localStorage.setItem(this.PENDING_TAPS_KEY, '0');
    this.pendingTaps.set(0);

    const timestamp = Math.floor(Date.now() / 1000);
    const payload = `${userId}:${timestamp}:${this.secretKey}`;
    
    // AUDITORÍA: Registrar acción financiera antes del call HTTP
    console.log(`[AUDIT] addTooks:`, { userId, amount: pendingCount, timestamp });
    localStorage.setItem(`audit_log_${Date.now()}`, JSON.stringify({ action: 'addTooks', params: { userId, amount: pendingCount, timestamp }, time: Date.now() }));
    
    try {
      const token = await this.encryptionService.sha256(payload);

      const url = `${this.baseUrl}Game/addTooks`;
      await firstValueFrom(
        this.http.post(url, { amount: pendingCount, token, timestamp })
      );
      console.log(`Sent ${pendingCount} taps to API`);

      // Refresh user status to update wallet
      await this.userStatusService.loadUserStatus();
      this.isFlushing = false;
    } catch (error) {
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
