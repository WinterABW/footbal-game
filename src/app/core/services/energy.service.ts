import { Injectable, inject, computed } from '@angular/core';
import { LocalApiService } from './local-api.service';
import type { Boost, EnergyState } from '../../models';

export type { Boost, EnergyState };

export interface EnergyData {
  energy: EnergyState;
  boosts: Boost[];
}

@Injectable({
  providedIn: 'root'
})
export class EnergyService {
  private localApi = inject(LocalApiService);

  // Signals conectados a LocalApiService
  readonly energy = this.localApi.currentEnergy;
  readonly maxEnergy = this.localApi.maxEnergy;
  readonly boosts = this.localApi.boosts;
  readonly activeBoosts = this.localApi.activeBoosts;

  readonly energyData = computed(() => {
    const energy = this.localApi.energy();
    const boosts = this.localApi.boosts();
    if (!energy) return null;
    return { energy, boosts };
  });

  readonly isLoading = computed(() => !this.localApi.isInitialized());
  readonly error = computed(() => null);

  decrementEnergy(amount: number) {
    this.localApi.consumeEnergy(amount);
  }

  incrementEnergy(amount: number) {
    this.localApi.addEnergy(amount);
  }

  loadEnergy() {
    // No necesario, los datos ya están en LocalApiService
    this.localApi.regenerateEnergy();
  }

  getEnergyState(): EnergyState | null {
    return this.localApi.energy();
  }

  getBoosts(): Boost[] {
    return this.localApi.boosts();
  }

  applyBoost(boostId: number) {
    const result = this.localApi.purchaseBoost(boostId);
    if (result.success) {
      return this.localApi.boosts().find(b => b.id === boostId) ?? null;
    }
    return null;
  }

  purchaseBoost(boostId: number): { success: boolean; message: string } {
    return this.localApi.purchaseBoost(boostId);
  }
}
