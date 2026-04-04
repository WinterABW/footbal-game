import { Injectable, inject, signal, computed } from '@angular/core';
import { UserStatusService } from './user-status.service';
import type { TapConfig } from '../../models/game.model';

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

@Injectable({
    providedIn: 'root'
})
export class LocalApiService {
    private userStatusService = inject(UserStatusService);

    // Signals
    private _tapConfig = signal<TapConfig | null>(null);
    private _isInitialized = signal(false);
    private _levelUp = signal<{ newLevel: number; oldLevel: number } | null>(null);

    // Public readonly signals
    readonly tapConfig = this._tapConfig.asReadonly();
    readonly isInitialized = this._isInitialized.asReadonly();
    readonly levelUp = this._levelUp.asReadonly();

    // Computed values
    readonly currentEnergy = computed(() => this.userStatusService.wallet()?.energy ?? 0);
    readonly maxEnergy = computed(() => {
        const skills = this.userStatusService.skillsLevelReport();
        return 500 + ((skills?.maxEnergyLVL ?? 0) * 100);
    });

    readonly tapValue = computed(() => {
        const config = this._tapConfig();
        if (!config) return 10;

        const level = this.userStatusService.level();
        const levelMultiplier = config.levelBonus.find(b => b.level === level)?.multiplier ?? 1;
        return Math.floor(config.baseValue * config.currentMultiplier * levelMultiplier);
    });

    initialize(): void {
        this._tapConfig.set(DEFAULT_TAP_CONFIG);
        this._isInitialized.set(true);
    }

    clearLevelUp(): void {
        this._levelUp.set(null);
    }
}
