export interface Player {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  earning: number;
  level: number;
  exclusive?: boolean;
  boughtAt?: string;
  contract_days: number;
  age?: number;
  injuries?: number;
  height?: number;
}

export interface PlayersData {
  availablePlayers: Player[];
  vipPlayers: Player[];
  ownedPlayers: Player[];
}
