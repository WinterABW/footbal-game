/**
 * Raw API response shape from Invest/getPlayers endpoint.
 *
 * This type represents what the backend returns. Use InvestService.mapApiPlayerToPlayer()
 * to convert to the canonical Player interface (from player.model.ts).
 *
 * Field differences from Player:
 * - `days` → maps to `contract_days`
 * - `interest` → maps to `earning`
 * - `isVIP` → maps to `exclusive`
 */
export interface InvestApiPlayer {
  id: number;
  name: string;
  isVIP: boolean;
  description: string;
  price: number;
  days: number;
  interest: number;
}
