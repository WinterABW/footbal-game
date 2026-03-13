// Re-export all models
export * from './user.model';
export * from './game.model';
export * from './transaction.model';
export * from './player.model';

import { UserProfile, UserStats } from './user.model';
import { EnergyState, Boost, ActiveBoost, TapConfig, EarningSource, GameState } from './game.model';
import { Transaction, DepositMethod, CryptoAddress } from './transaction.model';
import { Player, PlayersData } from './player.model';

export interface LocalApiData {
  profile: UserProfile;
  stats: UserStats;
  energy: EnergyState;
  boosts: Boost[];
  activeBoosts: ActiveBoost[];
  tapConfig: TapConfig;
  perHourEarnings: EarningSource[];
  transactions: Transaction[];
  depositMethods: DepositMethod[];
  gameState: GameState;
  players: PlayersData;
}
