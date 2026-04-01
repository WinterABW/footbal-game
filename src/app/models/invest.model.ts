/**
 * API response from GET /Invest/getPlayers
 */
export interface InvestApiPlayer {
  id: number;
  name: string;
  isVIP: boolean;
  price: number;
  days: number;
  interest: number;
  age: number;
  lesions: number;
  goals: number;
  /** Populated from separate image endpoint */
  imagen?: string;
}
