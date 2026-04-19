import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { UserInfoService, UserStatusResponse, SettingsInfo } from './user-info.service';

export type { UserStatusResponse } from './user-info.service';

// Tap configuration (default values)
const TAP_CONFIG = {
    baseValue: 1,
    currentMultiplier: 1,
    maxMultiplier: 10,
    levelBonus: [
        { level: 1, multiplier: 1.0 },
        { level: 2, multiplier: 1.2 },
        { level: 3, multiplier: 1.5 },
        { level: 4, multiplier: 2.0 },
        { level: 5, multiplier: 2.5 },
        { level: 6, multiplier: 3.0 },
        { level: 7, multiplier: 3.5 },
        { level: 8, multiplier: 4.0 },
        { level: 9, multiplier: 4.5 },
        { level: 10, multiplier: 5.0 },
    ],
};

// Level thresholds based on totalTooks
const LEVEL_THRESHOLDS = [
  { level: 1, tooksRequired: 0 },
  { level: 2, tooksRequired: 120 },
  { level: 3, tooksRequired: 300 },
  { level: 4, tooksRequired: 1100 },
  { level: 5, tooksRequired: 1600 },
  { level: 6, tooksRequired: 2100 },
  { level: 7, tooksRequired: 3200 },
  { level: 8, tooksRequired: 4100 },
];

@Injectable({
  providedIn: 'root',
})
export class UserStatusService {
  private userInfoService = inject(UserInfoService);

  // Core state signals
  readonly userStatus = signal<UserStatusResponse | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Individual data signals for granular reactivity
  // FIX: Corrected typo from referrealId to referralId (and add alias for backward compat)
  readonly referralId = signal<string | null>(null);
  // Alias for backward compatibility with existing code
  readonly referrealId = this.referralId;
  readonly wallet = signal<UserStatusResponse['wallet'] | null>(null);
  readonly settings = signal<UserStatusResponse['settings'] | null>(null);
  readonly actualInversion = signal<UserStatusResponse['actualInversion'] | null>(null);
  readonly skillsLevelReport = signal<UserStatusResponse['skillsLevelReport'] | null>(null);
  readonly earnPerHour = signal<number>(0);
  readonly totalTooks = computed(() => this.wallet()?.totalTooks ?? 0);

  // Computed signals
  readonly hasReferralId = computed(() => this.referralId() !== null && this.referralId() !== '');
  readonly isAuthenticated = computed(() => this.userStatus() !== null);
  
  // Level computed from totalTooks
  readonly level = computed(() => {
    const tooks = this.totalTooks();
    let currentLevel = 1;
    for (const threshold of LEVEL_THRESHOLDS) {
      if (tooks >= threshold.tooksRequired) {
        currentLevel = threshold.level;
      }
    }
    return currentLevel;
  });
  
  // Tap value computed from level
  readonly tapValue = computed(() => {
    const level = this.level();
    const levelMultiplier = TAP_CONFIG.levelBonus.find(b => b.level === level)?.multiplier ?? 1;
    return Math.floor(TAP_CONFIG.baseValue * TAP_CONFIG.currentMultiplier * levelMultiplier);
  });
  
  // Level info computed
  readonly levelInfo = computed(() => {
    const tooks = this.totalTooks();
    const currentLevel = this.level();
    const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
    const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
    
    return {
      level: currentLevel,
      currentTooks: tooks,
      tooksForNextLevel: nextThreshold?.tooksRequired ?? currentThreshold?.tooksRequired ?? 0,
      tooksToNextLevel: nextThreshold ? nextThreshold.tooksRequired - tooks : 0,
      isMaxLevel: currentLevel >= 8,
    };
  });
  
  // Level-up signal for UI animations
  readonly levelUp = signal<{ oldLevel: number; newLevel: number } | null>(null);
  private _previousLevel = signal(0);

  // Effect to detect level changes and notify UI
  constructor() {
    effect(() => {
      const current = this.level();
      const previous = this._previousLevel();
      if (previous > 0 && current !== previous) {
        this.levelUp.set({ oldLevel: previous, newLevel: current });
      }
      this._previousLevel.set(current);
    }, { allowSignalWrites: true });
  }

  // ============================================
  // COALESCING LOGIC (Cycle 1 fix)
  // ============================================
  private _loadPromise: Promise<void> | null = null;
  private _lastRefreshReason: 'periodic' | 'manual' | 'auth-restore' | null = null;

  async loadUserStatus(pendingTaps?: number, refreshReason?: 'periodic' | 'manual' | 'auth-restore'): Promise<void> {
    // COALESCING: Si ya hay una carga en progreso, esperar a que termine y luego ejecutar la nueva
    if (this.isLoading()) {
      console.log('[SYNC] loadUserStatus coalescing: esperando carga activa...');
      if (this._loadPromise) {
        await this._loadPromise;
      }
      // Después de esperar, ejecutar una nueva carga
      return this.loadUserStatus(pendingTaps, refreshReason);
    }

    // Track refresh reason for observability
    if (refreshReason) {
      this._lastRefreshReason = refreshReason;
      console.log(`[SYNC] loadUserStatus iniciando por: ${refreshReason}`);
    }

    this.isLoading.set(true);
    this.error.set(null);

    // Crear promise para coalescing
    this._loadPromise = this._executeLoad(pendingTaps);

    try {
      await this._loadPromise;
    } finally {
      this._loadPromise = null;
    }
  }

  private async _executeLoad(pendingTaps?: number): Promise<void> {
    const result = await this.userInfoService.getUserStatus(pendingTaps);

    if (result.success && result.data) {
      const data = result.data;

      // SEGURIDAD: Validar datos recibidos del backend
      if (!data || typeof data.wallet?.principalBalance !== 'number' || data.wallet.principalBalance < 0) {
        console.error('[SECURITY] Backend devolvió datos corruptos en wallet:', data?.wallet);
        this.error.set('Datos del servidor corrupto');
        this.isLoading.set(false);
        return;
      }
      if (typeof data.wallet?.totalTooks !== 'number' || data.wallet.totalTooks < 0) {
        console.error('[SECURITY] Backend devolvió datos corruptos en totalTooks:', data?.wallet);
        this.error.set('Datos del servidor corrupto');
        this.isLoading.set(false);
        return;
      }

      this.userStatus.set(data);
      // Map backend field name to corrected frontend name
      this.referralId.set(data.referrealId ?? null);
      this.wallet.set(data.wallet);
      this.settings.set(data.settings);
      this.actualInversion.set(data.actualInversion);
      this.skillsLevelReport.set(data.skillsLevelReport);
      this.earnPerHour.set(data.earnPerHour);
      // Sync previousLevel to current level so initial load doesn't trigger levelUp animation
      this._previousLevel.set(this.level());
    } else {
      console.error('UserStatusService: Failed to load user status:', result.error);
      this.error.set(result.error ?? 'Failed to load user status');
    }

    this.isLoading.set(false);
  }

  // Getter para observabilidad (para tests)
  get lastRefreshReason(): 'periodic' | 'manual' | 'auth-restore' | null {
    return this._lastRefreshReason;
  }

  setSettings(newSettings: Partial<SettingsInfo>): void {
    this.settings.update(current => current ? { ...current, ...newSettings } : null);
  }

  clearUserStatus(): void {
    this.userStatus.set(null);
    this.referralId.set(null);
    this.wallet.set(null);
    this.settings.set(null);
    this.actualInversion.set(null);
    this.skillsLevelReport.set(null);
    this.earnPerHour.set(0);
    this.error.set(null);
    this.isLoading.set(false);
  }
}
