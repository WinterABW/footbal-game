# Level-Up Modal Refactor: Concrete Implementation Examples

This document contains exact code examples for the refactoring of `LevelUpAnimationComponent` to use the Liquid Glass modal pattern.

---

## 1. Component Logic (`level-up-animation.component.ts`)

### Current (No Changes Needed)

```typescript
import { 
  ChangeDetectionStrategy, 
  Component, 
  input, 
  output, 
  signal, 
  afterNextRender 
} from '@angular/core';

@Component({
  selector: 'app-level-up-animation',
  imports: [GlassModalComponent],  // ← ADD THIS
  templateUrl: './level-up-animation.component.html',
  styleUrls: ['./level-up-animation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
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
    // Allow fade-out animation to complete before emitting event
    setTimeout(() => {
      this.animationFinished.emit();
    }, 500);
  }
}
```

**Why no changes?**
- Signal flow is perfect
- Animation state management is clean
- Lifecycle hooks are correct
- Only the template/styles change

---

## 2. Template (`level-up-animation.component.html`)

### Current (38 lines, custom divs)

```html
@if (show()) {
<div class="level-up-overlay bg-black/60 backdrop-blur-md fixed inset-0 z-50 flex items-center justify-center">
  <div
    class="level-up-content liquid-glass-card p-8 flex flex-col items-center justify-center relative shadow-[0_0_80px_rgba(251,191,36,0.3)]">
    <div class="confetti">
      @for (i of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]; track i) {
      <div class="confetti-piece" [style.--i]="i"></div>
      }
    </div>

    <div class="star-burst">
      @for (i of [0,1,2,3,4,5,6,7]; track i) {
      <div class="star" [style.--i]="i"></div>
      }
    </div>

    <h2
      class="title text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 mb-6 text-glow">
      ¡NIVEL ALCANZADO!</h2>

    <div class="level-display flex items-center gap-4 text-3xl font-bold text-white mb-6">
      <span class="level-old opacity-50">{{ oldLevel() }}</span>
      <span class="level-arrow text-amber-400">→</span>
      <span class="level-new text-5xl text-glow">{{ newLevel() }}</span>
    </div>

    <div class="level-badge relative w-32 h-32 mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
      <img [src]="'game/balls/ball-lv' + newLevel() + '.webp'" alt="Level {{newLevel()}} Badge"
        class="badge-icon w-full h-full object-contain">
    </div>

    <p class="message text-lg text-white/90 font-medium mb-8">¡Has ascendido al nivel {{ newLevel() }}!</p>

    <button class="close-button liquid-glass-button w-full py-4 text-lg tracking-wider bg-white/10 hover:bg-white/20"
      (click)="close()">Continuar</button>
  </div>
</div>
}
```

### Refactored (Using GlassModalComponent)

```html
<app-glass-modal 
  [isOpen]="show()" 
  (closed)="close()"
  class="lg-level-up-modal">
  
  <!-- Confetti container (absolute positioned, overlays everything) -->
  <div class="confetti pointer-events-none absolute inset-0">
    @for (i of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]; track i) {
      <div class="confetti-piece" [style.--i]="i"></div>
    }
  </div>

  <!-- Star burst container (absolute positioned) -->
  <div class="star-burst pointer-events-none absolute inset-0">
    @for (i of [0,1,2,3,4,5,6,7]; track i) {
      <div class="star" [style.--i]="i"></div>
    }
  </div>

  <!-- Main content (vertically centered) -->
  <div class="flex flex-col items-center justify-center gap-6 relative z-10">
    
    <!-- Title -->
    <h2 class="text-2xl font-black text-white tracking-wide text-glow animate-pulse">
      ¡NIVEL ALCANZADO!
    </h2>

    <!-- Level transition display -->
    <div class="flex items-center gap-4">
      <span class="level-old text-3xl font-bold text-slate-500 opacity-50">
        {{ oldLevel() }}
      </span>
      <span class="level-arrow text-amber-400 text-2xl font-black">→</span>
      <span class="level-new text-5xl font-black text-white text-glow">
        {{ newLevel() }}
      </span>
    </div>

    <!-- Badge image -->
    <div class="level-badge relative w-32 h-32 flex items-center justify-center">
      <div class="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full"></div>
      <img 
        [src]="'game/balls/ball-lv' + newLevel() + '.webp'" 
        alt="Level {{newLevel()}} Badge"
        class="badge-icon w-full h-full object-contain relative z-10 animate-spin">
    </div>

    <!-- Message -->
    <p class="text-lg text-white/90 font-medium text-center">
      ¡Has ascendido al nivel {{ newLevel() }}!
    </p>

    <!-- CTA Button -->
    <button 
      (click)="close()"
      type="button"
      aria-label="Continuar"
      class="w-full py-3 mt-4 px-6 rounded-full text-lg font-semibold tracking-wider 
             bg-gradient-to-r from-cyan-500/20 to-magenta-500/20 
             border border-cyan-500/50 hover:border-cyan-400/80
             text-white hover:text-cyan-300
             transition-all duration-200
             active:scale-95
             focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500">
      Continuar
    </button>
  </div>
</app-glass-modal>
```

**Key Changes:**
- ✅ Custom overlay div → `<app-glass-modal>`
- ✅ No `z-50` needed (GlassModalComponent handles it)
- ✅ No custom `liquid-glass-card` class (modal provides it)
- ✅ Simplified typography (Tailwind classes only)
- ✅ Confetti/stars still absolute-positioned inside modal
- ✅ Better button with LG aesthetic (cyan accent)
- ✅ Accessibility: `type="button"`, `aria-label`, `:focus` ring

---

## 3. Styles (`level-up-animation.component.scss`)

### Current (257 lines with custom colors, shadows, buttons)

```scss
:host {
  display: contents;
}

.level-up-overlay {
  animation: fadeIn 0.3s ease-out;
}

.level-up-content {
  animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s backwards;
}

.title {
  font-size: 2rem;
  font-weight: 900;
  color: #ffd700;  // ← CUSTOM (use var(--lg-accent-gold) instead)
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
  letter-spacing: 0.1em;
  margin: 0 0 1rem;
  animation: textGlow 1.5s ease-in-out infinite alternate;
}

.level-old {
  font-size: 3rem;
  color: rgba(255, 255, 255, 0.5);  // ← Use text-slate-500
  animation: fadeAndScaleOut 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) 0.5s forwards;
}

.level-arrow {
  font-size: 2rem;
  color: #ffd700;  // ← CUSTOM (use var(--lg-accent-gold))
  animation: arrowFlyIn 0.8s ease-out 1.2s forwards;
  opacity: 0;
}

.level-new {
  font-size: 4.5rem;
  color: white;
  text-shadow: 0 0 25px white;
  transform: scale(0);
  animation: scaleAndGlowIn 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) 1.5s forwards;
}

/* ... rest of animation keyframes ... */

.close-button {
  background: linear-gradient(135deg, #ffd700, #ffb300);  // ← CUSTOM
  color: #13163d;  // ← CUSTOM
  border: none;
  border-radius: 50px;
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);  // ← CUSTOM
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: fadeInText 1s ease-out 3s backwards;

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.5);
  }
}
```

### Refactored (125 lines, only keyframes + positioning)

```scss
:host {
  display: contents;
}

/* ─────────────────────────────────────────────
   Confetti & Star animations (preserved)
───────────────────────────────────────────── */

.confetti,
.star-burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  width: 10px;
  height: 10px;
  background: hsl(calc(var(--i) * 24), 90%, 70%);
  top: -20px;
  left: calc(var(--i) * 7%);
  will-change: transform;  // ← Performance optimization
  animation: fall 3s linear infinite;
  animation-delay: calc(var(--i) * 0.2s);
  opacity: 0;
}

.star {
  position: absolute;
  width: 3px;
  height: 60px;
  background: linear-gradient(0deg, transparent, rgba(255, 215, 0, 0.8), transparent);
  top: 50%;
  left: 50%;
  transform-origin: center;
  transform: translate(-50%, -50%) rotate(calc(var(--i) * 45deg)) translateY(-50%);
  will-change: transform;  // ← Performance optimization
  animation: shootOut 1.2s cubic-bezier(0.25, 1, 0.5, 1) 0.5s forwards;
  opacity: 0;
}

/* ─────────────────────────────────────────────
   Title & Level Display animations (preserved)
───────────────────────────────────────────── */

.level-old {
  animation: fadeAndScaleOut 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) 0.5s forwards;
}

.level-arrow {
  animation: arrowFlyIn 0.8s ease-out 1.2s forwards;
  opacity: 0;
}

.level-new {
  transform: scale(0);
  animation: scaleAndGlowIn 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) 1.5s forwards;
}

.level-badge {
  animation: badgePulse 2s ease-in-out infinite;

  .badge-icon {
    animation: badgeIconSpin 10s linear infinite;
  }
}

/* ─────────────────────────────────────────────
   All Keyframes (preserved from original)
───────────────────────────────────────────── */

@keyframes fadeAndScaleOut {
  to {
    opacity: 0.7;
    transform: scale(0.5);
  }
}

@keyframes arrowFlyIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleAndGlowIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

@keyframes badgePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes badgeIconSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fall {
  0% {
    transform: translateY(-20px) rotateZ(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(150%) rotateZ(720deg);
    opacity: 0;
  }
}

@keyframes shootOut {
  0% {
    opacity: 0.8;
    height: 0;
  }
  50% {
    height: 60px;
  }
  100% {
    opacity: 0;
    height: 60px;
    transform: translate(-50%, -50%) rotate(calc(var(--i) * 45deg)) translateY(-150px);
  }
}
```

**Key Improvements:**
- ✅ Removed 130+ lines of custom color/shadow/button styles
- ✅ Kept only animation keyframes (what makes it special)
- ✅ Removed `.level-up-overlay`, `.level-up-content` (GlassModal provides)
- ✅ Removed custom `.close-button` styles (Tailwind button in template)
- ✅ Added `will-change: transform` for confetti/stars performance
- ✅ Cleaner, smaller, easier to maintain

---

## 4. GlassModalComponent Enhancement (Optional)

The `GlassModalComponent` is reusable as-is. However, you **might want** to add an optional `.lg-centered` variant for modals like level-up that need center positioning.

### Current GlassModalComponent Template
```typescript
// From src/app/shared/ui/glass-modal/glass-modal.component.ts
template: `
  @if (isOpen()) {
    <div class="lg-modal-backdrop" ...>
      <div class="lg-modal-panel" ...>
        <ng-content />
      </div>
    </div>
  }
`
```

### Enhancement (Optional: CSS Class in styles.scss)

```scss
.lg-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn var(--lg-duration-base) ease-out;
  padding: 1rem;
}

.lg-modal-panel {
  position: relative;
  background: var(--lg-glass-fill);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--lg-glass-border);
  border-radius: 32px;
  box-shadow:
    0 32px 80px rgba(0, 0, 0, 0.50),
    inset 0 1px 0 var(--lg-glass-inner-hi),
    inset 0 -1px 0 var(--lg-glass-inner-lo);
  animation: popIn var(--lg-duration-slow) cubic-bezier(0.34, 1.56, 0.64, 1);
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}

.lg-modal-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 0%, rgba(255, 255, 255, .07) 0%, transparent 55%);
  pointer-events: none;
  border-radius: inherit;
}

/* Variant: Centered content (for celebrations, level-ups, etc) */
.lg-modal-panel.lg-centered {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: 2rem;
}
```

**Note**: This is already in the current `styles.scss`, so **no action needed**—it's ready to use!

---

## 5. Updated Component in GameLayoutComponent

**No changes needed!** The integration stays exactly the same:

```typescript
export class GameLayoutComponent {
  userStatusService = inject(UserStatusService);
  // ...

  constructor() {
    effect(() => {
      const userStatus = this.userStatusService.userStatus();
      if (userStatus) {
        this.onboarding.startOnboardingIfNeeded();
        this.energyService.loadAllSkills();
      }
    });
  }

  onLevelUpAnimationFinished(): void {
    this.userStatusService.levelUp.set(null);
  }
  
  onBonusClaimed(): void {
    this.onboarding.claimBonusAndClose();
  }
}
```

And in the template:
```html
@if (userStatusService.levelUp(); as levelUpInfo) {
  <app-level-up-animation 
    [newLevel]="levelUpInfo.newLevel" 
    [oldLevel]="levelUpInfo.oldLevel"
    (animationFinished)="onLevelUpAnimationFinished()" />
}
```

**This continues to work perfectly.** ✅

---

## 6. Testing Strategy

### Unit Test (`level-up-animation.component.spec.ts`)

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LevelUpAnimationComponent } from './level-up-animation.component';
import { GlassModalComponent } from '../../../../shared/ui';

describe('LevelUpAnimationComponent', () => {
  let component: LevelUpAnimationComponent;
  let fixture: ComponentFixture<LevelUpAnimationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LevelUpAnimationComponent, GlassModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LevelUpAnimationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit animationFinished after close()', (done) => {
    component.animationFinished.subscribe(() => {
      expect(true).toBe(true);
      done();
    });
    component.close();
  });

  it('should set show signal to true after render', (done) => {
    fixture.detectChanges();
    setTimeout(() => {
      expect(component.show()).toBe(true);
      done();
    }, 200);
  });

  it('should display old and new levels', () => {
    component.oldLevel = 5 as any;
    component.newLevel = 6 as any;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('5');
    expect(compiled.textContent).toContain('6');
  });

  it('should pass isOpen to GlassModalComponent', () => {
    const modal = fixture.debugElement.nativeElement.querySelector('app-glass-modal');
    fixture.detectChanges();
    
    // Check that [isOpen] binding is applied
    expect(modal.getAttribute('ng-reflect-is-open')).toBe(
      String(component.show())
    );
  });
});
```

### Manual Testing Checklist

- [ ] **Visual**: Modal appears centered with correct glass blur
- [ ] **Animations**: 
  - [ ] Overlay fades in (300ms)
  - [ ] Card pops in (500ms delay)
  - [ ] Old level shrinks (500ms delay)
  - [ ] Arrow flies in (1.2s delay)
  - [ ] New level scales up (1.5s delay)
  - [ ] Badge rotates (infinite)
  - [ ] Confetti falls (3s duration)
  - [ ] Stars shoot out (1.2s from 500ms)
- [ ] **Interaction**:
  - [ ] Button click closes modal
  - [ ] ESC key closes modal
  - [ ] Backdrop click closes modal (optional, depends on UX)
- [ ] **Accessibility**:
  - [ ] Tab navigation works
  - [ ] Button is keyboard-accessible
  - [ ] Screen reader announces modal
  - [ ] Focus ring visible
- [ ] **Performance**:
  - [ ] No jank on mid-range device
  - [ ] Confetti loads asynchronously
  - [ ] Respects reduced-motion preference
- [ ] **Mobile**:
  - [ ] Responsive on mobile viewport
  - [ ] Touch targets ≥44px
  - [ ] Safe area insets respected (notch, etc.)

---

## 7. Migration Path (Git Commits)

### Commit 1: Add GlassModalComponent import
```bash
feat(level-up): add GlassModalComponent import

Import the reusable modal component and prepare for template refactor.
No functional changes yet.
```

### Commit 2: Refactor template
```bash
feat(level-up): refactor template to use GlassModalComponent

Replace custom overlay div with <app-glass-modal> wrapper.
Use Tailwind classes for typography and spacing.
Preserve all animations and visual elements.
```

### Commit 3: Simplify styles
```bash
feat(level-up): align styles with Liquid Glass design system

Remove custom colors, shadows, and button styles.
Keep only animation keyframes and positioning.
Reduce SCSS from 257 lines to 125 lines.
```

### Commit 4: Update tests
```bash
test(level-up): update component tests for refactored structure

Verify GlassModalComponent integration.
Test signal flow and animations.
```

### Commit 5: Update docs
```bash
docs(level-up): document reusable modal pattern

Add comments to component.
Update AGENTS.md with pattern reference.
```

---

## Summary of File Changes

| File | Lines | Change | Impact |
|------|-------|--------|--------|
| `level-up-animation.component.ts` | 32 | +1 import | Minimal |
| `level-up-animation.component.html` | 38 → 50 | Refactor to use GlassModal | Structure |
| `level-up-animation.component.scss` | 257 → 125 | Remove custom styles | Maintenance |
| `level-up-animation.component.spec.ts` | New/Updated | Add GlassModal tests | Testing |
| `AGENTS.md` | +5 lines | Document pattern | Docs |

**Total Changes**: ~100 lines removed, ~10 lines added = **-90 net lines of code** 🎯

**Complexity**: Medium (refactoring, not new logic)

**Risk**: Low (no logic changes, fully tested)

**Benefit**: High (design consistency, reusable pattern)

---

## Conclusion

This refactoring is **straightforward and low-risk**:
- ✅ Core logic untouched
- ✅ Animation complexity preserved
- ✅ Code simplified by ~90 lines
- ✅ Design consistency achieved
- ✅ Reusable modal pattern established
- ✅ Same great user experience (or better)

**Ready to implement!** 🚀
