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
    // Restaurar taps pendientes desde localStorage al iniciar la app
    this.restorePendingTaps();

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
    if (this.isFlushing) return;
    if (Date.now() - this.lastFlushTime < 2000) return;
    
    const pendingCount = this.pendingTaps();
    if (pendingCount === 0) return;

    const user = this.authService.user();
    const userId = user ? (user.id || user.Id) : null;
    if (!userId) {
      console.error('User not logged in', user);
      return;
    }

    // Iniciar flush - marcar como en progreso
    this.isFlushing = true;
    this.lastFlushTime = Date.now();

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const payload = `${userId}:${timestamp}:${this.secretKey}`;
      
      console.log(`[AUDIT] addTooks:`, { userId, amount: pendingCount, timestamp });
      
      const currentEnergy = this.userStatusService.wallet()?.energy ?? 0;
      const energyAfterTaps = currentEnergy - pendingCount;

      // ATOMICIDAD: Solo procesar si hay suficiente energía. O ambas o ninguna.
      if (energyAfterTaps >= 0) {
        // 1. Enviar Taps
        const tooksToken = await this.encryptionService.sha256(payload);
        const tooksUrl = `${this.baseUrl}Game/addTooks`;
        await firstValueFrom(
          this.http.post(tooksUrl, { amount: pendingCount, token: tooksToken, timestamp })
        );
        console.log(`Sent ${pendingCount} taps to API`);

        // 2. Enviar actualización de Energía
        const energyToken = await this.encryptionService.sha256(
          `${userId}:${timestamp + 1}:${this.secretKey}`
        );
        const energyUrl = `${this.baseUrl}Game/updateEnergyState`;
        await firstValueFrom(
          this.http.post(energyUrl, { energy: energyAfterTaps, token: energyToken, timestamp: timestamp + 1 })
        );
        console.log(`Sent final energy state ${energyAfterTaps} to API.`);

        // 3. Solo resetear pendingTaps DESPUÉS de que ambas llamadas son exitosas
        this.pendingTaps.set(0);
        localStorage.setItem(this.PENDING_TAPS_KEY, '0');
      
      } else {
        // No había suficiente energía para los taps pendientes. No se hace nada.
        console.warn(`Not enough energy for pending taps. Taps: ${pendingCount}, Energy: ${currentEnergy}. Flush skipped.`);
      }

      // Siempre recargar el estado del usuario para mantener la sincronización
      await this.userStatusService.loadUserStatus();

    } catch (error: any) {
      // Si cualquiera de las llamadas falla, no se resetean los pendingTaps
      // y se reintentará en el siguiente flush.
      const httpError = error as HttpErrorResponse;
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        console.error('Taps/Energy flush failed:', (httpError.error as { message: string }).message);
      } else {
        console.error('Taps/Energy flush failed:', error);
      }
      // Igualmente intentamos refrescar el estado del usuario para no quedar desincronizados
      await this.userStatusService.loadUserStatus();
    } finally {
      this.isFlushing = false;
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
