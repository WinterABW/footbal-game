# Spec: Referee Spotlight Tutorial

## Requirements

### R1: Full-screen overlay with spotlight
- **MUST** render a full-screen overlay when `onboarding.isActive()` is `true`
- **MUST** blur the background using `backdrop-filter: blur(8px)`
- **MUST** create a clear rectangular spotlight cutout around the target element
- **MUST** have a subtle border/glow around the spotlight area (cyan accent, `box-shadow`)
- **MUST** disable body scroll while active (`overflow: hidden` on `<body>`)
- **MUST** restore scroll on close

### R2: Referee character
- **MUST** display a referee character image from `public/tuto/`
- **MUST** use `BackgroundEraser_20260402_081920861.webp` (pointing pose) during explanation steps
- **MUST** use `BackgroundEraser_20260325_024134450.webp` (standing pose) for intro and closing steps
- **MUST** position the character so it does NOT overlap the spotlight target
- **MUST** animate smoothly between positions (CSS transition)

### R3: Speech bubble
- **MUST** display a glass-style card (`liquid-glass-card`) with:
  - Step title (bold, white)
  - Step description (secondary text)
  - Navigation buttons
- **MUST** be positioned near the character
- **MUST** have a small arrow/pointer toward the spotlight target or character

### R4: Navigation
- **MUST** show "Empezar" on the first step (intro)
- **MUST** show "Siguiente" / "Anterior" on middle steps
- **MUST** show "¡A jugar!" on the last step (closing)
- **MUST** show "Saltar tutorial" link on all steps except the last
- **MUST** advance/retreat steps via `onboarding.nextStep()` / `onboarding.previousStep()`
- **MUST** close tutorial on "Saltar" or "¡A jugar!" via `onboarding.completeOnboarding()`

### R5: Step indicators
- **MUST** show dot indicators for all steps
- **MUST** highlight the current step dot (cyan, enlarged)
- **MUST** be visually consistent with the existing Liquid Glass design system

### R6: Data attributes
- **MUST** add `data-tutorial-id` to all target elements
- **MUST** use the following IDs:
  - `header-profile` — user avatar + name in header
  - `header-settings` — settings gear button
  - `action-openball` — Open Ball button
  - `action-roulette` — Roulette button
  - `action-copspin` — COP Spin button
  - `balance` — coin balance display
  - `tap-area` — main ball tap area
  - `energy-bar` — energy display
  - `boost-btn` — boost button
  - `bottom-nav` — bottom navigation bar

### R7: Persistence
- **MUST** use existing `OnboardingService` localStorage key (`onboarding_completed`)
- **MUST** only auto-show on first visit (reuses `startOnboardingIfNeeded()`)
- **MUST** allow re-launch from Settings (reuses `startOnboarding()`)

## Scenarios

### S1: First-time user opens the app
1. User installs and opens the app
2. `GameLayoutComponent` calls `onboarding.startOnboardingIfNeeded()`
3. `isFirstTimeUser()` returns `true`
4. Tutorial overlay appears with intro step (referee standing pose)
5. User taps "Empezar" → spotlight moves to first element

### S2: User navigates through tutorial
1. User is on step 3 (Open Ball explanation)
2. User taps "Siguiente"
3. `onboarding.nextStep()` advances to step 4
4. Spotlight smoothly transitions to Roulette button
5. Character switches to pointing pose
6. Speech bubble updates with new title/description

### S3: User skips tutorial
1. User is on any step except the last
2. User taps "Saltar tutorial"
3. `onboarding.skipOnboarding()` fires
4. Overlay fades out, body scroll restored
5. Tutorial won't show again (localStorage set)

### S4: User replays tutorial from Settings
1. User opens Settings modal
2. User taps "Tutorial"
3. Settings closes, `resetOnboarding()` + `startOnboarding()` fires
4. Tutorial overlay appears from step 0

### S5: User completes tutorial
1. User reaches last step (closing)
2. Speech bubble shows "¡A jugar!"
3. User taps "¡A jugar!"
4. `onboarding.completeOnboarding()` fires
5. Overlay fades out with a subtle celebration effect
