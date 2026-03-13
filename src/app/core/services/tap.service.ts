import { Injectable, inject, computed } from '@angular/core';
import { LocalApiService } from './local-api.service';

@Injectable({
  providedIn: 'root',
})
export class TapService {
  private localApi = inject(LocalApiService);

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

  addTap(count: number = 1) {
    this.localApi.incrementTaps(count);
  }

  getTotalTaps(): number {
    return this.totalTaps();
  }
}
