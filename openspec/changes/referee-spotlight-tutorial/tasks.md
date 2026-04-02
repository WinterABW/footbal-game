# Tasks: Referee Spotlight Tutorial System

## Phase 1: Data Attributes (Foundation)

- [x] 1.1 Add `data-tutorial-id="header-profile"` to the user avatar article in `header.component.ts`
- [x] 1.2 Add `data-tutorial-id="header-settings"` to the settings button in `header.component.ts`
- [x] 1.3 Add `data-tutorial-id="action-openball"`, `action-roulette`, `action-copspin` to action buttons in `action-buttons.component.ts`
- [x] 1.4 Add `data-tutorial-id="balance"` to the balance section in `balance.component.ts`
- [x] 1.5 Add `data-tutorial-id="tap-area"` to the tap area container in `tap-area.component.ts`
- [x] 1.6 Add `data-tutorial-id="energy-bar"` to the energy article and `data-tutorial-id="boost-btn"` to the boost button in `energy-boost.component.ts`
- [x] 1.7 Add `data-tutorial-id="bottom-nav"` to the nav element in `bottom-nav.component.ts`

## Phase 2: OnboardingService Update

- [x] 2.1 Rewrite `ONBOARDING_STEPS` array with all tutorial steps (intro + 10 element steps + closing)
- [x] 2.2 Export step data as a constant that the tutorial component can import
- [x] 2.3 Add `targetId` field to `OnboardingStep` interface

## Phase 3: SpotlightTutorialComponent

- [x] 3.1 Create component file at `src/app/shared/components/spotlight-tutorial/spotlight-tutorial.component.ts`
- [x] 3.2 Implement overlay with `backdrop-filter: blur()` and dynamic `clip-path`
- [x] 3.3 Implement referee character with dynamic pose and position
- [x] 3.4 Implement speech bubble with glass card styling, title, description
- [x] 3.5 Implement navigation buttons (Anterior/Siguiente/Saltar/¡A jugar!)
- [x] 3.6 Implement step indicator dots
- [x] 3.7 Add smooth transitions for spotlight position, character, and bubble
- [x] 3.8 Handle body scroll lock (overflow: hidden) while active
- [x] 3.9 Handle window resize — recalculate spotlight position
- [x] 3.10 Handle edge cases: target not found, target near screen edges

## Phase 4: Integration

- [x] 4.1 Replace `WelcomeTutorialComponent` with `SpotlightTutorialComponent` in `game-layout.component.ts`
- [x] 4.2 Wire `(bonusClaimed)` output (if needed, or remove if no bonus in new flow)
- [x] 4.3 Verify Settings → Tutorial still works (already connected)

## Phase 5: Cleanup

- [ ] 5.1 Remove `welcome-tutorial.component.ts` (or keep as backup, delete after QA)
- [ ] 5.2 Run `ng build` to verify no compilation errors
- [ ] 5.3 Manual QA on mobile viewport (320px, 375px, 412px, 428px)

---

Estimated total: ~3h (split into small tasks)
