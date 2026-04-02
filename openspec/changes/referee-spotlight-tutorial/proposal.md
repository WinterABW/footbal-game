# Proposal: Referee Spotlight Tutorial System

## Intent

Replace the current simple step-based `WelcomeTutorialComponent` with an immersive **spotlight walkthrough** guided by a referee character. The referee explains every interactive element on the `/main` route and the bottom navigation bar, with a full-screen overlay that dims everything except the element being explained and the character's speech bubble.

## Scope

### In Scope
- **Spotlight overlay**: Full-screen `backdrop-filter: blur()` with a CSS `clip-path` hole over the current element
- **Referee character**: Two poses (`standing` for intro/closing, `pointing` for explanations), positioned dynamically
- **Speech bubble**: Glass-style dialog box with title, description, and navigation (Anterior/Siguiente/Saltar)
- **Step system**: ~15 steps covering all `/main` elements + bottom nav tabs
- **`data-tutorial-id` attributes**: Added to target elements for reliable CSS selector targeting
- **Integration with `OnboardingService`**: Reuses existing state management (`localStorage`, `isActive`, `resetOnboarding`, `startOnboarding`)
- **Settings re-launch**: Already connected (previous fix)

### Out of Scope
- Tutorial for sub-routes (`/main/box`, `/main/ruleta`, `/main/ticket`, `/main/boost`)
- Audio/sound during tutorial
- Localization of tutorial text (Spanish only for now)
- Analytics/tracking of tutorial completion

## Approach

1. Create `SpotlightTutorialComponent` (standalone) replacing `WelcomeTutorialComponent` in `game-layout.component.ts`
2. Add `data-tutorial-id` to all target elements in their respective components
3. Use `document.querySelector('[data-tutorial-id="..."]')` + `getBoundingClientRect()` to position the spotlight dynamically
4. Overlay uses a single `<div>` with `backdrop-filter: blur(8px)` and a `clip-path: polygon(...)` that cuts a rectangle around the spotlight target
5. Referee image positioned absolutely (bottom-left or bottom-right depending on target position)
6. Speech bubble positioned relative to the referee with arrow pointing to the element
7. Smooth CSS transitions between steps (spotlight moves, character slides)

## Affected Areas

| Area | Action | Description |
|------|--------|-------------|
| `src/app/shared/components/spotlight-tutorial/` | **Create** | New component with overlay, spotlight, character, speech bubble |
| `src/app/shared/components/welcome-tutorial/` | **Remove** | Replaced by spotlight tutorial |
| `src/app/features/game/game-layout.component.ts` | **Modify** | Swap `WelcomeTutorialComponent` → `SpotlightTutorialComponent` |
| `src/app/core/services/onboarding.service.ts` | **Modify** | Update `ONBOARDING_STEPS` to match new step structure |
| `src/app/features/game/components/header/header.component.ts` | **Modify** | Add `data-tutorial-id` attributes |
| `src/app/features/game/components/action-buttons/action-buttons.component.ts` | **Modify** | Add `data-tutorial-id` attributes |
| `src/app/shared/components/balance/balance.component.ts` | **Modify** | Add `data-tutorial-id` |
| `src/app/features/game/components/tap-area/tap-area.component.ts` | **Modify** | Add `data-tutorial-id` |
| `src/app/features/game/components/energy-boost/energy-boost.component.ts` | **Modify** | Add `data-tutorial-id` |
| `src/app/shared/components/bottom-nav/bottom-nav.component.ts` | **Modify** | Add `data-tutorial-id` |

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Spotlight position drifts on different screen sizes | High | Use `getBoundingClientRect()` at render time, recalculate on resize |
| `clip-path` browser compatibility | Low | All modern mobile browsers support it; fallback to semi-transparent overlay |
| Character overlaps with speech bubble on small screens | Medium | Position logic: if target is in bottom half, put character top-right; vice versa |

## Success Criteria

- [ ] Referee character appears with both poses (standing + pointing)
- [ ] Every element on `/main` has a spotlight step
- [ ] Bottom navigation tabs are covered in tutorial
- [ ] Overlay correctly dims everything except the spotlight target
- [ ] Navigation (Siguiente/Anterior/Saltar) works smoothly
- [ ] Tutorial only shows once (localStorage persistence)
- [ ] Settings → Tutorial re-plays the tutorial
- [ ] No visual regressions on mobile (320px - 428px)
