# Exploration: Level-Up Functionality with Animated Modal

**Date**: 2026-04-18  
**Status**: Complete Investigation  
**Artifact Type**: Exploration  

---

## Current State

### Existing Level-Up Implementation

The project **already has a functional `LevelUpAnimationComponent`** that:
- ✅ Triggers automatically when player level changes (via `UserStatusService.levelUp` signal)
- ✅ Displays old → new level transition with animations
- ✅ Shows level badge image (`ball-lv{level}.webp`)
- ✅ Includes confetti animations (15 pieces falling)
- ✅ Includes star-burst effect (8 rays shooting out)
- ✅ Smooth fade-in/pop-in animations using cubic-bezier easing
- ✅ Proper animation cleanup with 500ms fade-out delay
- ✅ Already hooked into `GameLayoutComponent` with reactive cleanup

### Level Tracking Architecture

**User Level Calculation** (`UserStatusService`):
- Base formula: `level` computed from `totalTooks` (tap count)
- 8 predefined level thresholds (levels 1-8, with level 8 being max)
- Level change detection via `effect()` that populates `levelUp` signal
- Automatic trigger in `GameLayoutComponent` when `levelUp` signal changes

**Signal Flow**:
```
totalTooks → level (computed) → levelUp (signal) → UI animation trigger
```

### Design System & Glass Aesthetic

**Existing Liquid Glass Tokens** (already in `src/styles.scss`):
- Primary colors: Cobalt (#0d1b6e), Magenta (#b8186e), Accent Cyan (#00d4ff), Gold (#ffd060)
- Glass fill: `rgba(255, 255, 255, 0.08)` with `blur(24px) saturate(180%)`
- Animations: `--lg-duration-fast: 150ms`, `--lg-duration-base: 250ms`, `--lg-duration-slow: 400ms`
- Easing: Bouncy cubic-bezier(0.34, 1.56, 0.64, 1) already in use
- Utilities: `.lg-bubble`, `.lg-panel`, `.lg-module-card`, `.lg-status-badge`

**Current LevelUpAnimation**:
- Uses custom gradient text (yellow → amber) for title
- Uses `liquid-glass-card` base class
- Custom shadow: `shadow-[0_0_80px_rgba(251,191,36,0.3)]` (amber glow)
- Custom button with gradient background (not aligned with LG system)
- Inline keyframes for pop-in, glow, confetti animations

### Modal UI Patterns

**GlassModalComponent** (lightweight wrapper):
- Uses `.lg-modal-backdrop` + `.lg-modal-panel` classes
- Supports title, compact mode, close button
- Backdrop click and ESC key handling
- Used in: LevelMenuComponent, SettingsComponent, MotionsComponent

**Modal Classes** (from styles.scss, lines 350+):
```scss
.lg-modal-backdrop { /* full-screen overlay with fade-in */ }
.lg-modal-panel { /* centered panel with scale-up animation */ }
.lg-modal-button { /* blue accents */ }
```

---

## Affected Areas

| File | Role | Current State |
|------|------|---------------|
| `src/app/shared/components/level-up-animation/level-up-animation.component.ts` | Core animation logic | ✅ Functional, can be refined |
| `src/app/shared/components/level-up-animation/level-up-animation.component.html` | Overlay template | ✅ Working, uses confetti/stars |
| `src/app/shared/components/level-up-animation/level-up-animation.component.scss` | Animations & styles | ⚠️ Custom styles, not aligned with LG system |
| `src/app/features/game/game-layout.component.ts` | Level-up trigger & cleanup | ✅ Already wired correctly |
| `src/app/core/services/user-status.service.ts` | Level detection logic | ✅ Mature, well-designed |
| `src/styles.scss` | Design tokens | ✅ LG system available, not fully used in modal |
| `src/app/shared/ui/glass-modal/glass-modal.component.ts` | Reusable modal wrapper | ✅ Available but not used for level-up |

---

## Approaches

### **Approach 1: Refactor Level-Up as Liquid Glass Modal** (RECOMMENDED)

**Description**: Convert `LevelUpAnimationComponent` to use the `GlassModalComponent` base with full iOS 26 Liquid Glass aesthetic alignment.

**Pros**:
- ✅ Consistent with entire design system
- ✅ Reduces custom CSS/animations (maintainability)
- ✅ Leverages existing `.lg-*` utilities
- ✅ Proper accessibility from GlassModalComponent
- ✅ Uses established modal patterns (backdrop, panel, escape handling)
- ✅ Easy to extend with other modals later
- ✅ Smaller bundle (less custom animation code)

**Cons**:
- Requires refactoring existing animations (effort: medium)
- Must preserve the "wow factor" with thoughtful LG glass styling
- Confetti/star effects need to integrate with glass backdrop

**Effort**: Medium (2-3 hours)

**Key Implementation Details**:
- Wrap content in `GlassModalComponent` instead of custom overlay div
- Use `.lg-panel` or new `.lg-modal-centered` for the card
- Keep confetti/stars, integrate with glass surface (subtle shimmer effect)
- Replace custom button with `lg-btn-primary` (cyan accent + glass styling)
- Use existing animation tokens (`--lg-duration-slow: 400ms`)
- Typography: `text-white` headline, `text-slate-500` secondary
- Spacing: Tailwind scale (p-6, gap-4, mb-6) instead of custom px/rem

---

### **Approach 2: Enhance Current Implementation**

**Description**: Keep the standalone `LevelUpAnimationComponent` but align its styling with LG tokens incrementally.

**Pros**:
- ✅ Minimal refactoring (drop-in improvement)
- ✅ No risk to existing logic
- ✅ Faster implementation (1 hour)
- ✅ Can be done incrementally

**Cons**:
- ❌ Doesn't leverage GlassModalComponent pattern
- ❌ Maintains duplicate modal/overlay code
- ❌ Harder to standardize future modals
- ❌ Still has custom color/shadow values (maintenance debt)
- ❌ Less consistent with design system intent

**Effort**: Low (1 hour)

---

### **Approach 3: Create New Dedicated Level-Up Modal Service**

**Description**: Build a reusable `LevelUpModalService` that manages the modal state and integrates with `UserStatusService`.

**Pros**:
- ✅ Decouples presentation from logic
- ✅ Could support multiple modal "types" (level-up, achievement, milestone)
- ✅ Centralized animation state management

**Cons**:
- ❌ Over-engineered for current scope
- ❌ Adds service layer when `UserStatusService` already handles this
- ❌ Complexity without clear benefit

**Effort**: High (3-4 hours)

---

## Recommendation

**Use Approach 1 (Refactor as Liquid Glass Modal)** because:

1. **Design Consistency**: The entire app uses LG glass utilities; the level-up modal should too
2. **Maintainability**: Fewer custom classes, more reusable patterns
3. **Scalability**: Once you have a "modal modal" pattern, adding achievements, milestones, etc. is trivial
4. **User Experience**: Liquid Glass aesthetic is the brand voice; level-up is a key moment—deserve the full treatment
5. **Technical Debt**: Eliminates custom overlay code that could drift from design intent

### Implementation Path:

1. **Keep the signal flow intact**: `UserStatusService.levelUp` remains the trigger
2. **Refactor template**: Wrap in `GlassModalComponent`, use `lg-panel` for card
3. **Refactor styles**: Replace custom animations with LG utilities + Tailwind spacing
4. **Enhance confetti**: Keep it, but add subtle glass shimmer or glow rings
5. **Test**: Verify animation performance and accessibility

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Breaking existing animation trigger | Keep `animationFinished` output, test in game-layout.component |
| Performance regression (confetti + glass blur) | Test on mid-range device, use `will-change: transform` on confetti pieces |
| Accessibility (modal semantics) | GlassModalComponent already has `role="dialog"` + `aria-modal` |
| Visual polish loss | Carefully design LG version to match or exceed current wow-factor |
| Touch target sizes (mobile) | Ensure "Continuar" button stays ≥44px tall (current: 56px = good) |

---

## Ready for Proposal

**Yes** ✅

### What the Orchestrator Should Tell the User:

> "We found that your level-up animation is already well-implemented and triggering correctly. However, it's using custom CSS that doesn't align with your iOS 26 Liquid Glass design system. **We recommend refactoring it to use the Liquid Glass Modal pattern**—this will:
>
> 1. Make it 100% consistent with your visual language
> 2. Reduce custom code and maintenance burden
> 3. Give you a reusable modal pattern for future features (achievements, milestones, etc.)
> 4. Keep the same great animation experience (confetti, star burst, all preserved)
>
> **Effort**: ~2-3 hours. The core logic (UserStatusService, signal flow) doesn't change—only the presentation and styling."

---

## Technical Details for Implementation

### File Structure (Post-Refactor):

```
src/app/shared/components/level-up-animation/
├── level-up-animation.component.ts     (TypeScript logic)
├── level-up-animation.component.html   (Template with GlassModal)
└── level-up-animation.component.scss   (Only animation keyframes, no custom colors)
```

### New CSS Patterns to Use:

```scss
// Instead of custom glass fill:
background: var(--lg-glass-fill);
backdrop-filter: blur(24px) saturate(180%);

// Instead of custom button gradient:
@extend .liquid-glass-button;
// or
class="lg-btn-primary"  (if we create one)

// Instead of custom shadow:
box-shadow: 0 32px 80px rgba(0, 0, 0, 0.50),
            inset 0 1px 0 rgba(255, 255, 255, 0.10);

// Spacing (Tailwind):
class="p-8 gap-6 mb-6"  // instead of custom px/margin

// Typography:
class="text-white font-900 text-2xl tracking-wide"
```

### Key Signal to Preserve:

```typescript
// GameLayoutComponent watches this:
@if (userStatusService.levelUp(); as levelUpInfo) {
  <app-level-up-animation 
    [newLevel]="levelUpInfo.newLevel" 
    [oldLevel]="levelUpInfo.oldLevel"
    (animationFinished)="onLevelUpAnimationFinished()" />
}
```

---

## Next Steps (If Proposal Accepted)

1. Create a delta spec (`sdd/level-up-modal-refactor/specs.md`) with exact requirements
2. Design technical approach in `sdd/level-up-modal-refactor/design.md`
3. Break down into tasks (template, styles, animations, testing)
4. Implement and verify on device
5. Update any shared component library docs
