import { Injectable, inject, computed, signal, effect } from '@angular/core';
import { UserStatusService } from './user-status.service';
import { UserInfoService } from './user-info.service';

export interface EnergyData {
  currentEnergy: number;
  maxEnergy: number;
}

@Injectable({
  providedIn: 'root'
})
export class EnergyService {
  private userStatusService = inject(UserStatusService);
  private userInfo = inject(UserInfoService);

  // Signals conectados directamente a UserStatusService
  readonly energy = computed(() => this.userStatusService.wallet()?.energy ?? 0);
  
  // MaxEnergy cargada desde el backend (skillId: 2 = max_energy)
  private _maxEnergy = signal<number>(500);
  readonly maxEnergy = computed(() => this._maxEnergy());

  // Flag para evitar llamadas concurrentes
  private _isLoadingMaxEnergy = false;
  // Trackear el último nivel cargado para evitar recargas innecesarias
  private _lastLoadedLevel = 0;

  // La energía viene del UserStatusService (API)

  readonly error = computed(() => null);

  constructor() {
    // Effect: cuando cambia maxEnergyLVL específicamente, recargar maxEnergy automáticamente
    // Usa track() explícito para evitar disparos innecesarios cuando cambian otros skills
    effect(() => {
      const skills = this.userStatusService.skillsLevelReport();
      const level = skills?.maxEnergyLVL ?? 0;
      
      // Solo ejecutar si: hay datos, el nivel es válido (>0), y es UN NIVEL NUEVO
      if (level > 0 && level !== this._lastLoadedLevel) {
        this.loadMaxEnergy();
      }
    }, { allowSignalWrites: true });
  }

  // Cargar maxEnergy desde el backend
  async loadMaxEnergy(): Promise<void> {
    // Evitar llamadas concurrentes
    if (this._isLoadingMaxEnergy) return;
    
    const skills = this.userStatusService.skillsLevelReport();
    const currentLevel = skills?.maxEnergyLVL ?? 1;
    
    if (currentLevel <= 0 || currentLevel === this._lastLoadedLevel) {
      return;
    }

    this._isLoadingMaxEnergy = true;
    
    try {
      const result = await this.userInfo.getSkillInfo(2); // skillId 2 = max_energy
      if (result.success && result.data) {
        const levelData = result.data[currentLevel.toString()];
        if (levelData?.maxEnergy) {
          this._maxEnergy.set(levelData.maxEnergy);
          this._lastLoadedLevel = currentLevel; // Actualizar el nivel cargado
        }
      }
    } catch (error) {
      console.error('EnergyService: Failed to load maxEnergy', error);
      this._maxEnergy.set(500);
    } finally {
      this._isLoadingMaxEnergy = false;
    }
  }

  loadEnergy() {
    // Recargar el estado del usuario desde la API
    this.userStatusService.loadUserStatus();
  }

  getCurrentEnergy(): number {
    return this.userStatusService.wallet()?.energy ?? 0;
  }

  getMaxEnergy(): number {
    return this._maxEnergy();
  }

  async purchaseBoost(boostId: number): Promise<{ success: boolean; message: string }> {
    const userId = this.userStatusService.userStatus()?.id;
    if (!userId || userId <= 0) {
      console.error('EnergyService: User not logged in for purchaseBoost');
      return { success: false, message: 'Usuario no válido' };
    }
    try {
      const result = await this.userInfo.purchaseSkill(boostId, userId);
      return { 
        success: result.success, 
        message: result.message ?? (result.success ? 'Boost aplicado con éxito' : 'Error al aplicar boost') 
      };
    } catch (error) {
      console.error('EnergyService: purchaseBoost failed with an exception', error);
      return { success: false, message: 'Error de conexión al procesar la compra' };
    }
  }
}
