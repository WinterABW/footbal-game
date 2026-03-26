## Exploration: API Services, Signals, Boost Components, and Global State

### Current State
The Football application follows a modern Angular architecture with standalone components and signals for state management. Key findings:

1. **API Services**: Located in `src/app/core/services/`, with `UserInfoService` handling `/UserInfo` endpoints
2. **Signals**: Extensively used throughout the application for state management
3. **Boost Components**: Found in `src/app/features/game/components/energy-boost/boost/`
4. **Global State**: Managed by `UserStatusService` which provides granular signals for different user data aspects

### Affected Areas
- `src/app/core/services/user-info.service.ts` — Handles UserInfo API endpoints
- `src/app/core/services/user-status.service.ts` — Centralized user state management
- `src/app/features/game/components/energy-boost/boost/boost.component.ts` — Boost component implementation
- `src/app/core/services/local-api.service.ts` — Provides boost data and other game state

### Approaches

1. **Extend Existing Patterns** — Follow current signal-based architecture
   - Pros: Consistency with existing codebase, leverages proven patterns
   - Cons: May perpetuate any existing suboptimal patterns
   - Effort: Low

2. **Introduce New State Management** — Consider alternatives like NgRx or Akita
   - Pros: Potentially better scalability for complex state
   - Cons: Significant learning curve, overkill for current app size, breaks consistency
   - Effort: High

3. **Hybrid Approach** — Keep signals for local component state, consider service-based state for cross-component sharing
   - Pros: Balances simplicity with scalability needs
   - Cons: Requires careful consideration of what state should be where
   - Effort: Medium

### Recommendation
Continue using the existing signal-based architecture as it's already well-established throughout the codebase. The UserStatusService provides an excellent model for centralized state management with granular signals, and the BoostComponent demonstrates effective usage of these signals.

### Risks
- Inconsistent signal usage patterns if new developers don't follow established conventions
- Potential for signal overuse leading to complex dependency chains
- Memory leaks if signals with subscriptions aren't properly cleaned up (though Angular signals handle this better than Observables)

### Ready for Proposal
Yes — the exploration has provided sufficient understanding of the current architecture to proceed with proposing changes that follow existing patterns.