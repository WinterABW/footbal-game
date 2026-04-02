# Design: Referee Spotlight Tutorial System

## Technical Approach

A single standalone Angular component (`SpotlightTutorialComponent`) that renders a full-screen overlay with:
1. **Backdrop blur overlay** with a clip-path cutout (spotlight)
2. **Referee character** image (switches between two poses)
3. **Speech bubble** (glass card with title, description, nav buttons)
4. **Step engine** driven by a typed array of `TutorialStep` definitions

The component reads target element positions via `document.querySelector('[data-tutorial-id="..."]')` + `getBoundingClientRect()` and dynamically positions the spotlight, character, and bubble.

## Architecture Decisions

### Decision 1: Spotlight via clip-path (not SVG mask)
- **Choice**: CSS `clip-path: polygon()` on a full-screen div
- **Alternative**: SVG `<mask>` with a `<rect>` hole — more flexible but heavier
- **Rationale**: clip-path is GPU-accelerated, simple to compute (4 points around the target), and works on all mobile browsers

**Implementation**:
```typescript
// Compute the clip-path polygon with a rectangular hole
const pad = 8; // padding around target
const t = target.getBoundingClientRect();
const clipPath = `polygon(
  0% 0%, 0% 100%,
  ${t.left - pad}px 100%, ${t.left - pad}px ${t.top - pad}px,
  ${t.right + pad}px ${t.top - pad}px, ${t.right + pad}px ${t.bottom + pad}px,
  ${t.left - pad}px ${t.bottom + pad}px, ${t.left - pad}px 100%,
  100% 100%, 100% 0%
)`;
```

### Decision 2: Character positioning logic
- **Choice**: Adaptive — if target is in the top 50% of screen, character goes bottom-right; if bottom 50%, character goes top-right
- **Rationale**: Prevents character from overlapping the spotlight target

**Implementation**:
```typescript
characterPosition = computed(() => {
  const target = this.currentTargetRect();
  if (!target) return { bottom: '20px', left: '20px' };
  const midY = window.innerHeight / 2;
  return target.top < midY
    ? { bottom: '20px', left: '16px' }   // target is high → character low
    : { top: '80px', left: '16px' };     // target is low → character high
});
```

### Decision 3: Step data structure
```typescript
interface TutorialStep {
  id: string;
  targetId: string;          // data-tutorial-id value (null for intro/closing)
  title: string;
  description: string;
  characterPose: 'standing' | 'pointing';
  bubblePosition: 'top' | 'bottom' | 'center';
}
```

### Decision 4: Reuse OnboardingService
- **Choice**: Keep `OnboardingService` as the state manager, modify its steps array
- **Alternative**: Create a separate `TutorialService` — rejected, adds complexity for no benefit
- **Rationale**: The service already has `isActive`, `currentStep`, `resetOnboarding`, `startOnboarding`, localStorage persistence

## Component Structure

```
SpotlightTutorialComponent
├── Overlay (full-screen, backdrop-filter: blur, clip-path spotlight)
├── Referee Character (<img> with dynamic src based on pose)
├── Speech Bubble (glass card)
│   ├── Step indicator (dots)
│   ├── Title
│   ├── Description
│   └── Navigation (Anterior / Siguiente / Saltar / ¡A jugar!)
└── Highlight ring (border around spotlight target, optional glow)
```

## File Changes Table

| File | Action | Description |
|------|--------|-------------|
| `src/app/shared/components/spotlight-tutorial/spotlight-tutorial.component.ts` | **Create** | Main tutorial component |
| `src/app/shared/components/welcome-tutorial/welcome-tutorial.component.ts` | **Delete** | Replaced by spotlight version |
| `src/app/features/game/game-layout.component.ts` | **Modify** | Import + use `SpotlightTutorialComponent` |
| `src/app/core/services/onboarding.service.ts` | **Modify** | Update step data, expose step definitions |
| `src/app/features/game/components/header/header.component.ts` | **Modify** | Add `data-tutorial-id="header-profile"` and `data-tutorial-id="header-settings"` |
| `src/app/features/game/components/action-buttons/action-buttons.component.ts` | **Modify** | Add `data-tutorial-id="action-openball"`, `"action-roulette"`, `"action-copspin"` |
| `src/app/shared/components/balance/balance.component.ts` | **Modify** | Add `data-tutorial-id="balance"` |
| `src/app/features/game/components/tap-area/tap-area.component.ts` | **Modify** | Add `data-tutorial-id="tap-area"` |
| `src/app/features/game/components/energy-boost/energy-boost.component.ts` | **Modify** | Add `data-tutorial-id="energy-bar"` and `data-tutorial-id="boost-btn"` |
| `src/app/shared/components/bottom-nav/bottom-nav.component.ts` | **Modify** | Add `data-tutorial-id="bottom-nav"` |

## Interactions

1. `OnboardingService.startOnboarding()` → `_isActive = true`, `_currentStep = 0`
2. `SpotlightTutorialComponent` reacts to `isActive()` → reads first step's `targetId`
3. `querySelector('[data-tutorial-id="..."]')` → `getBoundingClientRect()` → computes clip-path + positions
4. User taps "Siguiente" → `onboarding.nextStep()` → signal updates → re-compute positions
5. User taps "Saltar" or "¡A jugar!" → `onboarding.completeOnboarding()` → overlay fades out
6. On step change, CSS transition animates the clip-path and character position

## Animation Tokens

- Overlay fade in/out: `300ms ease-out`
- Spotlight transition between steps: `400ms cubic-bezier(0.25, 1, 0.5, 1)`
- Character slide: `350ms cubic-bezier(0.34, 1.56, 0.64, 1)` (bouncy)
- Bubble fade: `250ms ease-out`

## Risks

- **clip-path computation**: Must handle edge cases where target is near screen edges (clamp to viewport)
- **Timing**: `getBoundingClientRect()` needs the DOM to be settled — use `afterNextRender` or `setTimeout(0)`
- **Scroll position**: The overlay is `position: fixed`, so scroll doesn't affect it, but if the target scrolls out of view, the spotlight will point to nothing. Mitigation: disable scroll on body while tutorial is active (`overflow: hidden`)
