/**
 * Unified Player interface for the entire application.
 *
 * This model serves as the canonical representation of a player across all layers
 * (local storage, API responses, components). API responses are mapped to this shape
 * via InvestService.mapApiPlayerToPlayer().
 *
 * API field mapping:
 *   API `days`       → `contract_days`
 *   API `interest`   → `earning`
 *   API `isVIP`      → `exclusive`
 *   API `imageUrl`   → `imageUrl` (with default fallback)
 *   API (missing)    → `level`, `age`, `injuries`, `height` get defaults
 */
export interface Player {
  id: number;
  name: string;
  price: number;
  /** Player image URL. Defaults to placeholder if not provided by API. */
  imageUrl: string;
  description: string;
  /** Hourly earnings in coins. Mapped from API `interest` field. */
  earning: number;
  /** Player tier level (1-6). Defaults to 1 if not provided by API. */
  level: number;
  /** Whether this player is VIP/exclusive. Mapped from API `isVIP` field. */
  exclusive?: boolean;
  /** ISO timestamp of when the player was purchased. Set locally on purchase. */
  boughtAt?: string;
  /** Contract duration in days. Mapped from API `days` field. */
  contract_days: number;
  /** Player age in years. Defaults to 25 if not provided by API. */
  age?: number;
  /** Number of injuries. Defaults to 0 if not provided by API. */
  injuries?: number;
  /** Player height in cm. Defaults to 180 if not provided by API. */
  height?: number;
}

export interface PlayersData {
  availablePlayers: Player[];
  vipPlayers: Player[];
  ownedPlayers: Player[];
}

/** Default values for fields missing from API responses. */
export const PLAYER_API_DEFAULTS = {
  imageUrl: 'invest/players/image-removebg-preview.webp',
  earning: 15,
  level: 1,
  age: 25,
  injuries: 0,
  height: 180,
  contract_days: 19,
} as const;
