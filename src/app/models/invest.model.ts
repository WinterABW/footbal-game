/**
 * API response from GET /Invest/getPlayers
 */
export interface InvestApiPlayer {
  id: number;
  name: string;
  isVIP: boolean;
  description: string;
  price: number;
  days: number;
  interest: number;
  imagen: string;
}
