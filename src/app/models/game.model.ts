export interface EnergyState {
  current: number;
  maximum: number;
  recoveryRate: number; // puntos por segundo
  lastUpdated: string;
}

export interface Boost {
  id: number;
  name: string;
  description: string;
  cost: number;
  baseCost: number;
  level: number;
  amount?: number;
  baseAmount?: number;
  multiplier?: number;
  recoveryMultiplier?: number;
  duration: number | null; // segundos, null = permanente
  type: 'instant' | 'timed' | 'permanent';
  icon?: string;
}

export interface ActiveBoost {
  boostId: number | string;
  activatedAt: string;
  expiresAt: string | null;
}

export interface TapConfig {
  baseValue: number;
  currentMultiplier: number;
  maxMultiplier: number;
  levelBonus: { level: number; multiplier: number }[];
}

export interface EarningSource {
  source: string;
  amount: number;
  percentage: number;
}

export interface GameState {
  experience: number;
  experienceToNextLevel: number;
  sessionTaps: number;
  lastSessionStart: string;
  spinsRemaining: number;
  dailySpinsTotal: number;
  lastSpinReset: string;
}
