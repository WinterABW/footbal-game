# Level-Up Functionality: Implementation Overview & Recommendations

## Quick Summary

✅ **Level-up animation already exists and works correctly**  
⚠️ **It uses custom CSS not aligned with iOS 26 Liquid Glass design system**  
💡 **Recommendation: Refactor to use existing GlassModalComponent + LG utilities**

---

## Current Implementation Status

### What's Already Working ✅

```
┌─────────────────────────────────────────────────────────────┐
│  User taps → totalTooks increases                           │
│  ↓                                                           │
│  UserStatusService.level computes from LEVEL_THRESHOLDS    │
│  ↓                                                           │
│  Level change detected → levelUp signal emitted             │
│  ↓                                                           │
│  GameLayoutComponent renders LevelUpAnimationComponent      │
│  ↓                                                           │
│  Beautiful overlay with confetti + star burst + animation   │
│  ↓                                                           │
│  User clicks "Continuar" → animationFinished emitted        │
│  ↓                                                           │
│  Component cleaned up, game continues                       │
└─────────────────────────────────────────────────────────────┘
```

**Level Thresholds (in `UserStatusService`)**:
- Level 1: 0 tooks
- Level 2: 120 tooks
- Level 3: 300 tooks
- Level 4: 1,100 tooks
- Level 5: 1,600 tooks
- Level 6: 2,100 tooks
- Level 7: 3,200 tooks
- Level 8: 4,100 tooks (max)

### Current Animation Details 🎬

**Template** (`level-up-animation.component.html`):
- Full-screen overlay: `bg-black/60 backdrop-blur-md`
- Modal card: `liquid-glass-card` (exists but custom styling)
- Title: "¡NIVEL ALCANZADO!" (golden glow text)
- Level display: `oldLevel → newLevel` with arrows
- Badge: rotating image (`ball-lv{level}.webp`)
- Message: "¡Has ascendido al nivel X!"
- Button: "Continuar" (gold gradient, not LG-aligned)
- Confetti: 15 pieces falling with rotation
- Star burst: 8 rays shooting outward

**Animations** (from `.scss`):
1. **fadeIn** (300ms) – overlay appears
2. **popIn** (500ms, 200ms delay) – card bounces in with cubic-bezier(0.34, 1.56, 0.64, 1)
3. **textGlow** (1.5s infinite) – title glows
4. **fadeAndScaleOut** (1s, 500ms delay) – old level shrinks
5. **arrowFlyIn** (800ms, 1.2s delay) – arrow slides in
6. **scaleAndGlowIn** (1s, 1.5s delay) – new level scales up with glow
7. **badgePulse** (2s infinite) – badge breathes
8. **badgeIconSpin** (10s infinite) – badge rotates continuously
9. **fall** (3s) – confetti pieces fall
10. **shootOut** (1.2s, 500ms delay) – stars shoot outward

**Timing Example**:
```
0ms     → Overlay fades in
200ms   → Card pops in
500ms   → Old level starts shrinking
1200ms  → Arrow flies in
1500ms  → New level scales up (glowing)
2500ms  → Message and button fade in
3500ms  → User can click "Continuar"
→ All animations complete, fade-out triggers
```

---

## iOS 26 Liquid Glass Design System (Already Defined)

### Color Tokens
```scss
--lg-cobalt: #0d1b6e             // Deep primary
--lg-magenta: #b8186e            // Hot magenta accent
--lg-accent: #e0259e             // Primary accent
--lg-accent-cyan: #00d4ff        // Electric cyan (secondary)
--lg-accent-gold: #ffd060        // Solar gold (tertiary)
```

### Glass Fill & Blur
```scss
--lg-glass-fill: rgba(255, 255, 255, 0.08)
--lg-glass-fill-hover: rgba(255, 255, 255, 0.12)
backdrop-filter: blur(24px) saturate(180%);
```

### Shadow System
```scss
--lg-glass-shadow: rgba(0, 0, 0, 0.45)
--lg-glass-inner-hi: rgba(255, 255, 255, 0.10)  // Top highlight
--lg-glass-inner-lo: rgba(0, 0, 0, 0.08)        // Bottom shadow
```

### Timing Tokens
```scss
--lg-duration-fast: 150ms      // Micro-interactions
--lg-duration-base: 250ms      // State changes
--lg-duration-slow: 400ms      // Page/modal moves
```

### Easing
```scss
/* Bouncy micro-interactions */
cubic-bezier(0.34, 1.56, 0.64, 1)

/* Smooth larger movements */
ease-out
```

### Utility Classes
```scss
.lg-bubble          // Circular buttons (nav icons)
.lg-panel           // Large glass sections
.lg-module-card     // Feature tiles
.lg-status-badge    // Small status indicators
.lg-pill            // Rounded container (bottom nav)
.lg-modal-backdrop  // Full-screen overlay fade
.lg-modal-panel     // Centered modal pop-in
```

---

## Proposed Refactor (Approach 1: Recommended)

### Visual Goal
Keep the "wow factor" of the current animation but apply iOS 26 Liquid Glass aesthetic throughout.

### Architecture

**Before** (Current):
```
LevelUpAnimationComponent
├── Custom full-screen overlay div
├── Custom liquid-glass-card styles
├── Custom button with gradient
├── Custom colors (gold, amber)
└── Custom shadows & glows
```

**After** (Refactored):
```
LevelUpAnimationComponent
├── GlassModalComponent wrapper (reusable pattern)
│   ├── lg-modal-backdrop (existing class)
│   └── lg-modal-panel (existing class, enhanced)
├── Content using LG utilities:
│   ├── lg-panel for card base
│   ├── text-white + text-slate-500 for typography
│   ├── p-8 gap-6 mb-6 for spacing
│   ├── lg-btn-primary for button (if created)
│   └── Confetti with glass shimmer overlay
└── Animations: Mix of LG easing + custom keyframes
```

### File Changes

#### 1. `level-up-animation.component.ts`

**Current**:
```typescript
export class LevelUpAnimationComponent {
  readonly newLevel = input.required<number>();
  readonly oldLevel = input.required<number>();
  readonly animationFinished = output<void>();

  show = signal(false);

  constructor() {
    afterNextRender(() => {
      setTimeout(() => {
        this.show.set(true);
      }, 100);
    });
  }

  close(): void {
    this.show.set(false);
    setTimeout(() => {
      this.animationFinished.emit();
    }, 500);
  }
}
```

**Proposed** (no logic changes):
```typescript
// Same structure, just add imports for GlassModalComponent
import { GlassModalComponent } from '../../ui';

// Rest stays the same
```

#### 2. `level-up-animation.component.html`

**Current** (~38 lines with custom divs):
```html
@if (show()) {
  <div class="level-up-overlay bg-black/60 backdrop-blur-md fixed inset-0 z-50 ...">
    <div class="level-up-content liquid-glass-card p-8 ...">
      <!-- confetti -->
      <!-- star-burst -->
      <!-- title, level, badge, message, button -->
    </div>
  </div>
}
```

**Proposed** (cleaner, uses GlassModalComponent):
```html
<app-glass-modal 
  [isOpen]="show()" 
  (closed)="close()">
  
  <div class="flex flex-col items-center justify-center gap-6">
    <!-- confetti container (absolute positioned) -->
    <!-- star-burst container (absolute positioned) -->
    
    <h2 class="text-2xl font-black text-white tracking-wide animate-pulse">
      ¡NIVEL ALCANZADO!
    </h2>
    
    <div class="flex items-center gap-4 text-white">
      <span class="opacity-50 text-3xl">{{ oldLevel() }}</span>
      <span class="text-amber-400 text-2xl">→</span>
      <span class="text-5xl font-black text-glow">{{ newLevel() }}</span>
    </div>
    
    <div class="w-32 h-32 relative">
      <img [src]="'game/balls/ball-lv' + newLevel() + '.webp'" 
           alt="Level {{newLevel()}} Badge"
           class="w-full h-full object-contain animate-spin">
    </div>
    
    <p class="text-lg text-white/90 font-medium">
      ¡Has ascendido al nivel {{ newLevel() }}!
    </p>
    
    <button 
      (click)="close()"
      class="lg-btn-primary w-full py-3 mt-4 text-lg tracking-wider">
      Continuar
    </button>
  </div>
</app-glass-modal>
```

#### 3. `level-up-animation.component.scss`

**Simplified** (only animation keyframes, no colors/shadows):
```scss
:host {
  display: contents;
}

/* Keyframes stay the same */
@keyframes popIn { ... }
@keyframes textGlow { ... }
@keyframes fadeAndScaleOut { ... }
@keyframes arrowFlyIn { ... }
@keyframes scaleAndGlowIn { ... }
@keyframes badgePulse { ... }
@keyframes badgeIconSpin { ... }
@keyframes fall { ... }
@keyframes shootOut { ... }

/* Component-specific animations */
.confetti-piece {
  animation: fall 3s linear infinite;
  animation-delay: calc(var(--i) * 0.2s);
}

.star {
  animation: shootOut 1.2s cubic-bezier(0.25, 1, 0.5, 1) 0.5s forwards;
}
```

### Styling Strategy

| Element | Current | Proposed | Tailwind |
|---------|---------|----------|----------|
| Overlay | Custom div + `bg-black/60 backdrop-blur-md` | GlassModalComponent (reuses `.lg-modal-backdrop`) | ✅ Same |
| Card | Custom `.liquid-glass-card` with gold shadow | `.lg-panel` or enhanced `.lg-modal-panel` | `bg-white/8 backdrop-blur-[24px] border border-white/6` |
| Title | Custom gold gradient text + shadow | `text-white font-900 text-2xl tracking-wide` | ✅ Matches LG |
| Old Level | Custom text with opacity | `text-slate-500 text-3xl` | ✅ LG secondary |
| Arrow | Custom amber color | `text-yellow-400` | ✅ Accent gold |
| New Level | Custom white + glow shadow | `text-white font-black text-5xl` | ✅ LG primary |
| Badge | Custom backdrop + rotate | No changes, uses existing `.animate-spin` | ✅ Tailwind native |
| Message | Custom white/90 | `text-white/90 text-lg` | ✅ LG body |
| Button | **Gold gradient** (custom) | **New `.lg-btn-primary` with cyan/magenta** | 🔧 Creates standard |
| Confetti | Colorful pieces | Same (colorful OK in LG system) | ✅ No change |
| Stars | Gold rays | Same (gold rays match accent) | ✅ No change |

### New Button Class (Optional but Recommended)

**If we want a standard LG button for level-up moments**:

```scss
.lg-btn-primary {
  @extend .liquid-glass-button;
  
  background: var(--lg-glass-fill);
  border-color: var(--lg-accent-cyan);
  color: var(--lg-accent-cyan);
  
  &:hover {
    background: var(--lg-glass-fill-hover);
    border-color: var(--lg-accent);
    color: var(--lg-accent);
    box-shadow: 0 0 12px rgba(224, 37, 158, 0.3);
  }
}
```

Or just use inline Tailwind:
```html
<button class="
  lg-btn-primary
  border-cyan-500 text-cyan-400
  hover:border-magenta-500 hover:text-magenta-400
  transition-all duration-200">
  Continuar
</button>
```

---

## Implementation Checklist

### Phase 1: Setup (30 min)
- [ ] Create feature branch: `feat/level-up-liquid-glass`
- [ ] Copy current component files to backup
- [ ] Update imports to include `GlassModalComponent`

### Phase 2: Template Refactor (60 min)
- [ ] Replace custom div with `<app-glass-modal>`
- [ ] Move confetti/stars to absolute positioning inside modal content
- [ ] Update typography classes (text-white, text-slate-500, font-black, etc.)
- [ ] Replace custom button styling
- [ ] Test structure (no animations, just layout)

### Phase 3: Styles Cleanup (45 min)
- [ ] Remove custom colors from SCSS (keep keyframes)
- [ ] Remove custom shadow definitions
- [ ] Update spacing to Tailwind scale (p-6, gap-4, mb-6)
- [ ] Verify no unintended side effects

### Phase 4: Testing & Polish (30 min)
- [ ] Test animation sequence on device
- [ ] Verify accessibility (ARIA, keyboard, focus)
- [ ] Check reduced-motion preference (already in confetti.service)
- [ ] Performance check on mid-range device
- [ ] Visual polish: adjust confetti colors if needed

### Phase 5: Documentation (15 min)
- [ ] Add component comments
- [ ] Document reusable modal pattern
- [ ] Update AGENTS.md if needed

---

## Performance Considerations

### Current Performance
- Confetti: 15 pieces with `canvas-confetti` library (async loaded)
- Stars: 8 DOM elements with pure CSS animations
- Backdrop blur: GPU-accelerated on most devices
- No known performance issues

### After Refactor
- **No regression expected**
- GlassModalComponent is lightweight
- Animation complexity unchanged
- Confetti loading (async) unchanged
- Could add `will-change: transform` to confetti pieces for optimization

```scss
.confetti-piece {
  will-change: transform;
  animation: fall 3s linear infinite;
}
```

---

## Accessibility Checklist

- [ ] Modal has `role="dialog"` (GlassModalComponent provides)
- [ ] Modal has `aria-modal="true"` (GlassModalComponent provides)
- [ ] Backdrop click closes modal (GlassModalComponent provides)
- [ ] ESC key closes modal (GlassModalComponent provides)
- [ ] Focus management (auto-focuses close button)
- [ ] Button is ≥44px tall for mobile (current: 56px = ✅)
- [ ] Color contrast: white on glass meets WCAG AA
- [ ] Reduced motion: confetti respects `prefers-reduced-motion`
- [ ] Keyboard navigation: Tab to button, Enter to close

---

## Next Steps

If this exploration is accepted:

1. **Create Delta Spec** (`sdd/level-up-modal-refactor/specs.md`)
   - Exact requirements
   - Visual mockup (if needed)
   - Accessibility requirements

2. **Create Design Document** (`sdd/level-up-modal-refactor/design.md`)
   - Technical approach
   - File changes summary
   - Testing strategy

3. **Create Task Breakdown** (`sdd/level-up-modal-refactor/tasks.md`)
   - 5 tasks (phases 1-5 above)
   - Estimated effort per task
   - Testing checkpoints

4. **Implement** (sdd-apply)
   - Follow the plan
   - Git commit per task
   - Running tests

5. **Verify** (sdd-verify)
   - Review against spec
   - Check design compliance
   - Visual + functional testing

---

## Summary

| Aspect | Status |
|--------|--------|
| **Logic** | ✅ Already perfect (UserStatusService) |
| **Animation** | ✅ Working, preservable |
| **Design Alignment** | ⚠️ Needs refactor (custom CSS) |
| **Pattern Reusability** | ⚠️ Not using GlassModalComponent |
| **Effort to Refactor** | Medium (2-3 hours) |
| **Risk Level** | Low (no logic changes) |
| **User Impact** | None (same experience or better) |
| **Team Impact** | Positive (establishes modal pattern) |

**Recommendation: Proceed with Approach 1** ✅
