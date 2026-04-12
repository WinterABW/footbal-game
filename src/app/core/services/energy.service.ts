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

  // Energy actual = wallet.energy - pending consumida (como coins con pendingTaps)
  readonly energy = computed(() => {
    const walletEnergy = this.userStatusService.wallet()?.energy ?? 0;
    const pending = this.pendingEnergyConsumption();
    return Math.max(0, walletEnergy - pending);
  });
  
  // MaxEnergy cargada desde el backend (skillId: 2 = max_energy)
  private _maxEnergy = signal<number>(500);
  readonly maxEnergy = computed(() => this._maxEnergy());

  // TapPower valor por cada desde el backend (skillId: 3 = tap_power)
  private _tapPower = signal<number>(1);
  readonly tapPower = computed(() => this._tapPower());

  // Pending energy consumption (se envía junto con addTooks)
  private pendingEnergyConsumption = signal<number>(0);

  // Flags para evitar llamadas concurrentes
  private _isLoadingMaxEnergy = false;
  private _isLoadingTapPower = false;
  // Trackear el último nivel cargado para evitar recargas innecesarias
  private _lastLoadedMaxEnergyLevel = 0;
  private _lastLoadedTapPowerLevel = 0;

  // La energía viene del UserStatusService (API)

  readonly error = computed(() => null);

  constructor() {
    // Effect: cuando cambia maxEnergyLVL específicamente, recargar maxEnergy automáticamente
    // Usa track() explícito para evitar disparos innecesarios cuando cambian otros skills
    effect(() => {
      const skills = this.userStatusService.skillsLevelReport();
      const level = skills?.maxEnergyLVL ?? 0;
      
      // Solo ejecutar si: hay datos, el nivel es válido (>0), y es UN NIVEL NUEVO
      if (level > 0 && level !== this._lastLoadedMaxEnergyLevel) {
        this.loadMaxEnergy();
      }
    }, { allowSignalWrites: true });

    // Effect para tapPower
    effect(() => {
      const skills = this.userStatusService.skillsLevelReport();
      const level = skills?.tapPowerLVL ?? 0;
      
      if (level > 0 && level !== this._lastLoadedTapPowerLevel) {
        this.loadTapPower();
      }
    }, { allowSignalWrites: true });
  }

  // Cargar maxEnergy desde el backend
  async loadMaxEnergy(): Promise<void> {
    // Evitar llamadas concurrentes
    if (this._isLoadingMaxEnergy) return;
    
    const skills = this.userStatusService.skillsLevelReport();
    const currentLevel = skills?.maxEnergyLVL ?? 1;
    
    if (currentLevel <= 0 || currentLevel === this._lastLoadedMaxEnergyLevel) {
      return;
    }

    this._isLoadingMaxEnergy = true;
    
    try {
      const result = await this.userInfo.getSkillInfo(2); // skillId 2 = max_energy
      if (result.success && result.data) {
        const levelData = result.data[currentLevel.toString()];
        if (levelData?.maxEnergy) {
          this._maxEnergy.set(levelData.maxEnergy);
          this._lastLoadedMaxEnergyLevel = currentLevel; // Actualizar el nivel cargado
        }
      }
    } catch (error) {
      console.error('EnergyService: Failed to load maxEnergy', error);
      // Solo set fallback si es el valor inicial (0)
      if (this._maxEnergy() === 0) {
        this._maxEnergy.set(500);
      }
    } finally {
      this._isLoadingMaxEnergy = false;
    }
  }

  // Cargar tapPower desde el backend
  async loadTapPower(): Promise<void> {
    if (this._isLoadingTapPower) return;
    
    const skills = this.userStatusService.skillsLevelReport();
    const currentLevel = skills?.tapPowerLVL ?? 1;
    
    if (currentLevel <= 0 || currentLevel === this._lastLoadedTapPowerLevel) {
      return;
    }

    this._isLoadingTapPower = true;
    
    try {
      const result = await this.userInfo.getSkillInfo(3); // skillId 3 = tap_power
      if (result.success && result.data) {
        const levelData = result.data[currentLevel.toString()];
        if (levelData?.tooks) {
          this._tapPower.set(levelData.tooks);
          this._lastLoadedTapPowerLevel = currentLevel;
        }
      }
    } catch (error) {
      console.error('EnergyService: Failed to load tapPower', error);
      // Solo set fallback si es el valor inicial (0)
      if (this._tapPower() === 0) {
        this._tapPower.set(1);
      }
    } finally {
      this._isLoadingTapPower = false;
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

  getTapPower(): number {
    return this._tapPower();
  }

  // Cargar todos los skills al inicio (llamado desde game-layout)
  async loadAllSkills(): Promise<void> {
    await Promise.all([
      this.loadMaxEnergy(),
      this.loadTapPower(),
    ]);
  }

  // Consumir energía - acumula pending (se envía junto con addTooks)
  consumeEnergy(amount: number = 1): void {
    this.pendingEnergyConsumption.update(e => e + amount);
  }

  // Getter para energía pendiente
  getPendingEnergyCount(): number {
    return this.pendingEnergyConsumption();
  }

  // Reset pending energy (llamado desde TapService cuando flush tiene éxito)
  resetPendingEnergy(): void {
    this.pendingEnergyConsumption.set(0);
  }

  //Getter para pending energy (para TapService)
  pendingEnergy(): number {
    return this.pendingEnergyConsumption();
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
