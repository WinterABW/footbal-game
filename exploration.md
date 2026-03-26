## Exploration: integrar-api-invest

### Current State
The current implementation uses a local storage-based approach for player data management:
- **PlayersService** depends on **LocalApiService** which stores/retrieves data from localStorage
- **LocalApiService** contains hardcoded DEFAULT_PLAYERS data with rich player attributes
- PlayersService exposes signals: `regularPlayers`, `vipPlayers`, `myPlayers` (alias for ownedPlayers), and `isLoading`
- **InvestLayoutComponent** consumes these signals directly in templates to display players in Mercado, VIP, and Equipo tabs
- An **InvestService** already exists with HttpClient and implements a `getPlayers()` method that calls the `/Invest/getPlayers` endpoint
- The invest.model.ts Player interface matches the API response format

### Affected Areas
- `src/app/core/services/players.service.ts` — Main service needing modification to use API instead of localStorage
- `src/app/core/services/local-api.service.ts` — Currently provides player data; will need refactoring
- `src/app/core/services/invest.service.ts` — Already has API call implementation; may need adaptation
- `src/app/models/player.model.ts` — Current Player model differs from API response; mapping needed
- `src/app/models/invest.model.ts` — API response model; may need to align with player.model
- `src/app/features/invest/invest-layout.component.ts` — Consumes player signals; needs verification of compatibility
- `src/app/features/invest/components/product/product-card.component.ts` — Uses player data in UI
- `src/app/features/invest/components/product-vertical/product-card-vertical.component.ts` — Uses player data in UI

### API Response Format Analysis
The `/Invest/getPlayers` endpoint returns an array of players with these fields:
- `id`: number
- `name`: string
- `isVIP`: boolean
- `description`: string
- `price`: number
- `days`: number (contract duration)
- `interest`: number (hourly earnings)

### Mapping Strategy from API → Signals
**Direct Mappings:**
- `id` → `id`
- `name` → `name`
- `isVIP` → `exclusive` (boolean mapping)
- `description` → `description`
- `price` → `price`
- `days` → `contract_days`
- `interest` → `earning`

**Fields Requiring Defaults/Enrichment:**
The API response lacks fields present in the current Player model:
- `level`: Set default value (1) or derive from price/interest
- `boughtAt`: Set to null for available players, actual timestamp when purchased
- `age`: Set default value or null (not critical for display)
- `injuries`: Set default value (0)
- `height`: Set default value or null (not critical for display)

**Approach Options:**

1. **Direct Mapping with Defaults**
   - Map API fields directly to player.model fields
   - Assign sensible defaults for missing fields
   - Pros: Simple, immediate implementation
   - Cons: Loss of some player variety (all players same level, age, etc.)

2. **Enrichment Lookup Table**
   - Map core API fields
   - Use a lookup table to add missing attributes based on player ID/name
   - Pros: Preserves existing player characteristics
   - Cons: Requires maintaining lookup table, duplication of data

3. **Backend Enhancement**
   - Modify API to return all required fields
   - Pros: Cleanest separation, single source of truth
   - Cons: Requires backend changes, may not be feasible

4. **Hybrid Approach**
   - Fetch basic player data from API
   - Enrich with additional data from localStorage/defaults for purchased players
   - Pros: Preserves existing functionality for purchased players
   - Cons: More complex implementation

### Recommendation
**Approach 1 (Direct Mapping with Defaults)** is recommended for initial implementation because:
1. It provides the quickest path to API integration
2. The missing fields (age, injuries, height) are not currently displayed in the UI
3. Level and boughtAt can be reasonably defaulted
4. It maintains the existing signal-based architecture that components depend on
5. It can be iteratively improved later with enrichment if needed

For level: Derive from price tiers or set default to 1
For boughtAt: Null for available players, set upon purchase
For age/injuries/height: Set to sensible defaults or null (UI doesn't display these)

### Risks
- **Field Mapping Errors**: Incorrect mapping could break player display/purchasing
- **Missing Field Impact**: Some game mechanics might rely on level/age/injuries/height
- **UI Display Issues**: If any missing fields are actually used in templates
- **Backward Compatibility**: Need to ensure purchased players retain their properties
- **Performance**: API calls vs instant localStorage access
- **Error Handling**: Need to implement proper loading/error states for API calls

### Ready for Proposal
Yes — The exploration has identified the current architecture, analyzed the API response format, mapped the required data transformations, and evaluated implementation approaches. The team is ready to proceed with a proposal for integrating the API investment endpoint.