import { Injectable, inject, computed } from '@angular/core';
import { LocalApiService } from './local-api.service';
import { UserStatusService } from './user-status.service';
import { UserInfoService } from './user-info.service';
import type { Boost } from '../../models/game.model';

export type { Boost };

export interface EnergyData {
  currentEnergy: number;
  maxEnergy: number;
  boosts: Boost[];
}

@Injectable({
  providedIn: 'root'
})
export class EnergyService {
  private localApi = inject(LocalApiService);
  private userStatusService = inject(UserStatusService);
  private userInfo = inject(UserInfoService);

  // Signals conectados a LocalApiService/UserStatusService
  readonly energy = this.localApi.currentEnergy;
  readonly maxEnergy = this.localApi.maxEnergy;
  readonly boosts = this.localApi.boosts;
  readonly activeBoosts = this.localApi.activeBoosts;

  // La energía viene del UserStatusService (API)
  // No se modifica localmente, viene del servidor

  readonly isLoading = computed(() => !this.localApi.isInitialized());
  readonly error = computed(() => null);

  decrementEnergy(amount: number) {
    // Ya no se modifica localmente - la energía viene de la API
    // El consumo de energía se maneja en el backend
    console.warn('Energy decrement should be handled by API');
  }

  incrementEnergy(amount: number) {
    // Ya no se modifica localmente - la energía viene de la API
    console.warn('Energy increment should be handled by API');
  }

  loadEnergy() {
    // Recargar el estado del usuario desde la API
    this.userStatusService.loadUserStatus();
  }

  getCurrentEnergy(): number {
    return this.userStatusService.wallet()?.energy ?? 0;
  }

  getMaxEnergy(): number {
    const skills = this.userStatusService.skillsLevelReport();
    return 500 + ((skills?.maxEnergyLVL ?? 0) * 100);
  }

  getBoosts(): Boost[] {
    return this.localApi.boosts();
  }

  async applyBoost(boostId: number) {
    const result = await this.userInfo.purchaseSkill(boostId);
    if (result.success) {
      return this.localApi.boosts().find(b => b.id === boostId) ?? null;
    }
    return null;
  }

  async purchaseBoost(boostId: number): Promise<{ success: boolean; message: string }> {
    const result = await this.userInfo.purchaseSkill(boostId);
    return { success: result.success, message: result.message ?? result.error ?? 'Unknown error' };
  }
}
