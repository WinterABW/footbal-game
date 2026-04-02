import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { UserStatusService } from './user-status.service';
import type { UserStats } from '../../models/user.model';
import type { Boost, ActiveBoost, TapConfig } from '../../models/game.model';

// ============== STORAGE KEYS ==============

const STORAGE_KEYS = {
    STATS: 'nequi_stats',
} as const;



// ============== DEFAULT DATA ==============



// Configuración de niveles basados en toques
const LEVEL_THRESHOLDS = [
    { level: 1, tapsRequired: 0 },
    { level: 2, tapsRequired: 120 },
    { level: 3, tapsRequired: 300 },
    { level: 4, tapsRequired: 1100 },
    { level: 5, tapsRequired: 1600 },
    { level: 6, tapsRequired: 2100 },
    { level: 7, tapsRequired: 3200 },
    { level: 8, tapsRequired: 4100 },
];

const DEFAULT_TAP_CONFIG: TapConfig = {
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



// ============== SERVICE ==============

@Injectable({
    providedIn: 'root'
})
export class LocalApiService {
    private storage = inject(StorageService);
    private userStatusService = inject(UserStatusService);

    // Signals reactivos
    private _stats = signal<UserStats | null>(null);
    private _boosts = signal<Boost[]>([]);
    private _activeBoosts = signal<ActiveBoost[]>([]);
    private _tapConfig = signal<TapConfig | null>(null);


    private _isLoading = signal(false);
    private _isInitialized = signal(false);
    private _levelUp = signal<{ newLevel: number; oldLevel: number } | null>(null);

    // Signals de solo lectura
    readonly stats = this._stats.asReadonly();
    readonly boosts = this._boosts.asReadonly();
    readonly activeBoosts = this._activeBoosts.asReadonly();
    readonly tapConfig = this._tapConfig.asReadonly();


    readonly isLoading = this._isLoading.asReadonly();
    readonly isInitialized = this._isInitialized.asReadonly();
    readonly levelUp = this._levelUp.asReadonly();

    // Computed values - energía viene del UserStatusService (API)
    readonly currentEnergy = computed(() => this.userStatusService.wallet()?.energy ?? 0);
    readonly maxEnergy = computed(() => {
        const skills = this.userStatusService.skillsLevelReport();
        // Base 500 + 100 por cada nivel de maxEnergyLVL
        return 500 + ((skills?.maxEnergyLVL ?? 0) * 100);
    });
    readonly hourlyEarning = computed(() => this._stats()?.hourlyEarning ?? 20);

    readonly tapValue = computed(() => {
        const config = this._tapConfig();
        if (!config) return 10;

        const level = this.userStatusService.level();
        const levelMultiplier = config.levelBonus.find(b => b.level === level)?.multiplier ?? 1;
        return Math.floor(config.baseValue * config.currentMultiplier * levelMultiplier);
    });

    readonly activeMultiplier = computed(() => {
        const activeBoosts = this._activeBoosts();
        const boosts = this._boosts();
        const now = Date.now();

        let multiplier = 1;
        for (const active of activeBoosts) {
            if (active.expiresAt && new Date(active.expiresAt).getTime() < now) continue;
            const boost = boosts.find(b => b.id === active.boostId);
            if (boost?.multiplier) {
                multiplier *= boost.multiplier;
            }
        }
        return multiplier;
    });

    // ============== INITIALIZATION ==============

    private hourlyEarningsInterval: ReturnType<typeof setInterval> | null = null;

    /**
     * Inicializa la API local, cargando datos existentes o creando defaults
     */
    initialize(): void {
        if (!this.storage.isBrowser) return;

        this._isLoading.set(true);

        // Eliminada verificación de INITIALIZED key, forzamos inicialización de defaults siempre:
        this.initializeDefaults();
        this.loadAllData();
        this._isInitialized.set(true);
        this._isLoading.set(false);

        // Iniciar el sistema de ganancias por hora
        this.startHourlyEarningsSystem();
    }

    /**
     * Inicia el sistema que agrega monedas cada hora según la ganancia por hora
     */
    private startHourlyEarningsSystem(): void {
        // Limpiar intervalo anterior si existe
        if (this.hourlyEarningsInterval) {
            clearInterval(this.hourlyEarningsInterval);
        }



        // Iniciar intervalo cada hora (3600000 ms = 1 hora)
        // Para testing puedes cambiar a 60000 (1 minuto) o 10000 (10 segundos)
        const HOUR_IN_MS = 3600000;
        this.hourlyEarningsInterval = setInterval(() => {
            this.applyHourlyEarnings();
        }, HOUR_IN_MS);
    }



    /**
     * Aplica las ganancias por hora actuales
     */
    private applyHourlyEarnings(): void {
        const hourlyEarning = this.hourlyEarning();

        if (hourlyEarning > 0) {
            // TODO: Implement API call to add earnings
            // this.updateBalance(hourlyEarning);
        }


    }

    private initializeDefaults(): void {
        this.storage.set(STORAGE_KEYS.STATS, {
            totalTaps: 0,
            hourlyEarning: 0,
            referrals: 0,
            investments: 0,
            achievements: 0,
        });
        // Boosts, Active Boosts y Tap Config están conectados a la API - no se persisten en localStorage
        // ENERGY viene del UserStatusService (API)
    }

    private loadAllData(): void {
        this._stats.set(this.storage.get<UserStats>(STORAGE_KEYS.STATS));
        // Boosts, Active Boosts y Tap Config se inicializan con defaults (conectados a API)
        this._boosts.set([]);
        this._activeBoosts.set([]);
        this._tapConfig.set(DEFAULT_TAP_CONFIG);

        // Limpiar boosts expirados
        this.cleanExpiredBoosts();
    }



    // ============== PROFILE ==============



    // ============== ENERGY ==============
    // La energía ahora viene directamente del UserStatusService (API)
    // No se persiste en localStorage
    // currentEnergy y maxEnergy son computed desde UserStatusService

    // ============== BOOSTS ==============

    private addActiveBoost(boost: ActiveBoost): void {
        const current = this._activeBoosts();
        const updated = [...current, boost];
        // Active boosts están conectados a la API - solo actualizamos el signal
        this._activeBoosts.set(updated);
    }

    private cleanExpiredBoosts(): void {
        const now = Date.now();
        const active = this._activeBoosts().filter(b => {
            if (!b.expiresAt) return true;
            return new Date(b.expiresAt).getTime() > now;
        });

        // Active boosts están conectados a la API - solo actualizamos el signal
        this._activeBoosts.set(active);
    }

    // ============== TRANSACTIONS ==============






    // ============== DEPOSITS & WITHDRAWALS ==============



    // ============== ENERGY RECOVERY ==============
    // Ya no necesario - la energía viene de la API

    // ============== PLAYERS ==============



    clearLevelUp(): void {
        this._levelUp.set(null);
    }
}
