import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  OnDestroy,
} from '@angular/core';
import { OnboardingService, ONBOARDING_STEPS } from '../../../core/services/onboarding.service';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ElementStyle {
  top: string;
  bottom: string;
  left: string;
  right: string;
}

@Component({
  selector: 'app-spotlight-tutorial',
  template: `
    @if (isActive()) {
      <!-- 4 overlay panels that SURROUND the spotlight -->
      @if (spotlightRect(); as rect) {
        <div class="tutorial-panel"
          style="top: 0; left: 0; width: 100vw;"
          [style.height.px]="rect.top - PANEL_GAP">
        </div>
        <div class="tutorial-panel"
          style="left: 0; width: 100vw;"
          [style.top.px]="rect.top + rect.height + PANEL_GAP"
          [style.height.vh]="100">
        </div>
        <div class="tutorial-panel"
          style="left: 0;"
          [style.top.px]="rect.top - PANEL_GAP"
          [style.width.px]="rect.left - PANEL_GAP"
          [style.height.px]="rect.height + PANEL_GAP * 2">
        </div>
        <div class="tutorial-panel"
          style="right: 0;"
          [style.top.px]="rect.top - PANEL_GAP"
          [style.width.px]="window.innerWidth - rect.left - rect.width - PANEL_GAP"
          [style.height.px]="rect.height + PANEL_GAP * 2">
        </div>
      } @else {
        <div class="tutorial-panel-full"></div>
      }

      <!-- Spotlight glow ring -->
      @if (spotlightRect()) {
        <div class="spotlight-ring"
          [style.top.px]="spotlightRect()!.top - 4"
          [style.left.px]="spotlightRect()!.left - 4"
          [style.width.px]="spotlightRect()!.width + 8"
          [style.height.px]="spotlightRect()!.height + 8">
        </div>
      }

      <!-- Referee Character -->
      <img
        [src]="characterSrc()"
        alt="Árbitro"
        class="referee-character"
        [class.character-above-bubble]="isCharacterAboveBubble()"
        [style.top]="characterPos().top"
        [style.bottom]="characterPos().bottom"
        [style.left]="characterPos().left"
        [style.right]="characterPos().right"
        draggable="false" />

      <!-- Speech Bubble -->
      <div class="speech-bubble"
        [style.top]="bubblePos().top"
        [style.bottom]="bubblePos().bottom"
        [style.left]="bubblePos().left"
        [style.right]="bubblePos().right">
        <!-- Glossy glare layer -->
        <div class="bubble-glare"></div>

        <!-- Step indicators -->
        <div class="flex items-center justify-center gap-2 mb-4">
          @for (step of steps; track step.id; let i = $index) {
            <div class="step-dot"
              [class.active]="i === currentStep()"
              [class.completed]="i < currentStep()">
            </div>
          }
        </div>

        <!-- Title -->
        <h3 class="text-[17px] font-extrabold text-white tracking-tight mb-2 text-center leading-tight">
          {{ currentStepData().title }}
        </h3>

        <!-- Description -->
        <p class="text-[13px] text-white/60 leading-[1.6] text-center mb-5 font-medium">
          {{ currentStepData().description }}
        </p>

        <!-- Navigation -->
        <div class="flex items-center gap-2.5">
          @if (!isFirstStep()) {
            <button (click)="previousStep()"
              class="btn-secondary">
              Anterior
            </button>
          }

          @if (isLastStep()) {
            <button (click)="finishTutorial()"
              class="btn-primary">
              <span class="relative z-10">¡A jugar!</span>
            </button>
          } @else {
            <button (click)="nextStep()"
              class="btn-primary">
              <span class="relative z-10">{{ isFirstStep() ? 'Empezar' : 'Siguiente' }}</span>
            </button>
          }
        </div>

        <!-- Skip link -->
        @if (!isLastStep()) {
          <button (click)="skipTutorial()"
            class="w-full mt-3 py-1 text-[11px] text-white/25 hover:text-white/50 transition-colors font-semibold tracking-wide uppercase">
            Saltar tutorial
          </button>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }

    .tutorial-panel {
      position: fixed;
      z-index: 9998;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(12px) saturate(120%);
      -webkit-backdrop-filter: blur(12px) saturate(120%);
      pointer-events: none;
      animation: panel-fade-in 300ms ease-out forwards;
    }

    .tutorial-panel-full {
      position: fixed;
      inset: 0;
      z-index: 9998;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(12px) saturate(120%);
      -webkit-backdrop-filter: blur(12px) saturate(120%);
      pointer-events: none;
      animation: panel-fade-in 300ms ease-out forwards;
    }

    @keyframes panel-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .spotlight-ring {
      position: fixed;
      z-index: 9999;
      border-radius: 20px;
      border: 1.5px solid rgba(0, 212, 255, 0.5);
      box-shadow:
        0 0 30px rgba(0, 212, 255, 0.15),
        0 0 80px rgba(0, 212, 255, 0.06),
        inset 0 0 30px rgba(0, 212, 255, 0.05);
      pointer-events: none;
      transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1);
      animation: ring-pulse 3s ease-in-out infinite;
    }

    @keyframes ring-pulse {
      0%, 100% { border-color: rgba(0, 212, 255, 0.4); box-shadow: 0 0 30px rgba(0, 212, 255, 0.12); }
      50% { border-color: rgba(0, 212, 255, 0.7); box-shadow: 0 0 40px rgba(0, 212, 255, 0.25); }
    }

    .referee-character {
      position: fixed;
      z-index: 10000;
      pointer-events: none;
      transition: all 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
      filter: drop-shadow(0 8px 32px rgba(0, 0, 0, 0.4));
    }

    .referee-character { width: 140px; height: auto; }
    .referee-character.character-above-bubble { width: 190px; height: auto; }

    /* ═══════════ Liquid Glass Speech Bubble ═══════════ */
    .speech-bubble {
      position: fixed;
      z-index: 10001;
      background: linear-gradient(
        135deg,
        rgba(13, 27, 110, 0.7) 0%,
        rgba(15, 23, 42, 0.8) 50%,
        rgba(30, 10, 60, 0.7) 100%
      );
      backdrop-filter: blur(64px) saturate(200%);
      -webkit-backdrop-filter: blur(64px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 28px;
      padding: 24px 20px 18px;
      width: calc(100vw - 32px);
      left: 16px;
      box-shadow:
        0 32px 80px rgba(0, 0, 0, 0.5),
        0 8px 24px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        inset 0 0 60px rgba(0, 212, 255, 0.02);
      overflow: hidden;
      transition: top 400ms cubic-bezier(0.25, 1, 0.5, 1),
                  bottom 400ms cubic-bezier(0.25, 1, 0.5, 1),
                  left 400ms cubic-bezier(0.25, 1, 0.5, 1);
      animation: bubble-enter 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    /* Specular highlight — top gloss */
    .bubble-glare {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.06) 0%,
        transparent 100%
      );
      border-radius: 28px 28px 0 0;
      pointer-events: none;
    }

    @keyframes bubble-enter {
      from { opacity: 0; transform: scale(0.92) translateY(12px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* ═══════════ Buttons ═══════════ */
    .btn-primary {
      flex: 2;
      padding: 12px 20px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 800;
      color: white;
      text-align: center;
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #00d4ff 0%, #6366f1 100%);
      box-shadow:
        0 4px 20px rgba(0, 212, 255, 0.25),
        0 1px 3px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.15);
      transition: all 200ms cubic-bezier(0.25, 1, 0.5, 1);
      -webkit-tap-highlight-color: transparent;
    }

    .btn-primary:active {
      transform: scale(0.96);
      box-shadow: 0 2px 10px rgba(0, 212, 255, 0.2);
    }

    .btn-secondary {
      flex: 1;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.5);
      text-align: center;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      transition: all 200ms ease;
      -webkit-tap-highlight-color: transparent;
    }

    .btn-secondary:active {
      transform: scale(0.96);
      background: rgba(255, 255, 255, 0.08);
    }

    /* ═══════════ Step Dots ═══════════ */
    .step-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.12);
      transition: all 300ms cubic-bezier(0.25, 1, 0.5, 1);
    }

    .step-dot.active {
      width: 18px;
      border-radius: 10px;
      background: linear-gradient(90deg, rgba(0, 212, 255, 0.9), rgba(99, 102, 241, 0.9));
      box-shadow: 0 0 12px rgba(0, 212, 255, 0.4);
    }

    .step-dot.completed {
      background: rgba(0, 212, 255, 0.3);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpotlightTutorialComponent implements OnDestroy {
  private onboarding = inject(OnboardingService);
  private destroyRef = inject(DestroyRef);

  readonly isActive = this.onboarding.isActive;
  readonly currentStep = this.onboarding.currentStep;
  readonly currentStepData = this.onboarding.currentStepData;
  readonly isFirstStep = this.onboarding.isFirstStep;
  readonly isLastStep = this.onboarding.isLastStep;
  readonly isCharacterAboveBubble = computed(() => {
    const step = this.currentStep();
    // welcome (0), closing (last), and steps 9-14 (index 9+) have character above bubble
    return step === 0 || step >= 9 || step === ONBOARDING_STEPS.length - 1;
  });
  readonly steps = ONBOARDING_STEPS;
  readonly PANEL_GAP = 4;

  // Expose window for template
  readonly window = typeof window !== 'undefined' ? window : { innerWidth: 375, innerHeight: 812 } as any;

  spotlightRect = signal<SpotlightRect | null>(null);

  // Positioning signals — set imperatively by updatePositions()
  characterPos = signal<ElementStyle>({ bottom: '20px', left: '16px', right: 'auto', top: 'auto' });
  bubblePos = signal<ElementStyle>({ bottom: '150px', left: '16px', right: 'auto', top: 'auto' });

  private resizeTimeout: any = null;

  private readonly onResizeHandler = () => {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      if (this.isActive()) this.updateAll();
    }, 100);
  };

  private readonly standingPose = 'tuto/BackgroundEraser_20260325_024134450.webp';
  private readonly pointingPose = 'tuto/BackgroundEraser_20260402_081920861.webp';

  readonly isBallStep = computed(() => this.currentStepData().id === 'tap');

  characterSrc = computed(() =>
    this.isBallStep() ? this.pointingPose : this.standingPose
  );

  constructor() {
    effect(() => {
      const active = this.isActive();
      const step = this.currentStep();

      if (!active) {
        this.spotlightRect.set(null);
        this.unlockScroll();
        return;
      }

      this.lockScroll();
      setTimeout(() => this.updateAll(), 50);
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResizeHandler);
    }

    this.destroyRef.onDestroy(() => {
      this.unlockScroll();
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this.onResizeHandler);
      }
    });
  }

  ngOnDestroy(): void {}

  private updateAll(): void {
    this.updateSpotlight();
    this.updatePositions();
  }

  private updateSpotlight(): void {
    const step = this.currentStepData();
    if (!step.targetId) {
      this.spotlightRect.set(null);
      return;
    }

    const el = document.querySelector(`[data-tutorial-id="${step.targetId}"]`);
    if (!el) {
      console.warn(`[Tutorial] Target not found: ${step.targetId}`);
      this.spotlightRect.set(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    this.spotlightRect.set({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }

  private updatePositions(): void {
    const rect = this.spotlightRect();
    const step = this.currentStepData();

    // Per-step explicit positioning — user-verified
    const positions: Record<string, { char: ElementStyle; bubble: ElementStyle }> = {
      // Intro: character centered above dialog
      'welcome': {
        char: { bottom: '440px', left: 'calc(50vw - 95px)', right: 'auto', top: 'auto' },
        bubble: { bottom: '165px', left: '16px', right: 'auto', top: 'auto' },
      },
      // Steps 2-7: dialog abajo del spotlight, character abajo del diálogo y centrado
      'profile': {
        bubble: { top: `${(rect?.top ?? 0) + (rect?.height ?? 0) + 16}px`, left: '16px', right: 'auto', bottom: 'auto' },
        char: { top: `${(rect?.top ?? 0) + (rect?.height ?? 0) + 280}px`, left: 'calc(50vw - 95px)', right: 'auto', bottom: 'auto' },
      },
      'settings': {
        bubble: { top: `${(rect?.top ?? 0) + (rect?.height ?? 0) + 16}px`, left: '16px', right: 'auto', bottom: 'auto' },
        char: { top: `${(rect?.top ?? 0) + (rect?.height ?? 0) + 280}px`, left: 'calc(50vw - 95px)', right: 'auto', bottom: 'auto' },
      },
      'balance': {
        bubble: { top: `${(rect?.top ?? 0) + (rect?.height ?? 0) + 16}px`, left: '16px', right: 'auto', bottom: 'auto' },
        char: { top: `${(rect?.top ?? 0) + (rect?.height ?? 0) + 280}px`, left: 'calc(50vw - 95px)', right: 'auto', bottom: 'auto' },
      },
      'openball': {
        bubble: { top: `${(rect?.top ?? 0) + (rect?.height ?? 0) + 16}px`, left: '16px', right: 'auto', bottom: 'auto' },
        char: { top: `${(rect?.top ?? 0) + (rect?.height ?? 0) + 280}px`, left: 'calc(50vw - 95px)', right: 'auto', bottom: 'auto' },
      },
      'roulette': {
        bubble: { top: `${(rect?.top ?? 0) + (rect?.height ?? 0) + 16}px`, left: '16px', right: 'auto', bottom: 'auto' },
        char: { top: `${(rect?.top ?? 0) + (rect?.height ?? 0) + 280}px`, left: 'calc(50vw - 95px)', right: 'auto', bottom: 'auto' },
      },
      'copspin': {
        bubble: { top: `${(rect?.top ?? 0) + (rect?.height ?? 0) + 16}px`, left: '16px', right: 'auto', bottom: 'auto' },
        char: { top: `${(rect?.top ?? 0) + (rect?.height ?? 0) + 280}px`, left: 'calc(50vw - 95px)', right: 'auto', bottom: 'auto' },
      },
      // Step 8: character bajo la pelota, diálogo más a la izquierda
      'tap': {
        char: { top: `${(rect?.top ?? 0) + (rect?.height ?? 0) + 16}px`, left: '16px', right: 'auto', bottom: 'auto' },
        bubble: { top: '70px', left: '16px', right: 'auto', bottom: 'auto' },
      },
      // Steps 9-10: character arriba del diálogo y centrado
      'energy': {
        char: { top: '40px', left: 'calc(50vw - 95px)', right: 'auto', bottom: 'auto' },
        bubble: { top: '170px', left: '16px', right: 'auto', bottom: 'auto' },
      },
      'boost': {
        char: { top: '40px', left: 'calc(50vw - 95px)', right: 'auto', bottom: 'auto' },
        bubble: { top: '170px', left: '16px', right: 'auto', bottom: 'auto' },
      },
      // Steps 11-14: character arriba del diálogo y centrado
      'nav-social': {
        char: { top: '110px', left: 'calc(50vw - 95px)', right: 'auto', bottom: 'auto' },
        bubble: { top: '240px', left: '16px', right: 'auto', bottom: 'auto' },
      },
      'nav-retos': {
        char: { top: '110px', left: 'calc(50vw - 95px)', right: 'auto', bottom: 'auto' },
        bubble: { top: '240px', left: '16px', right: 'auto', bottom: 'auto' },
      },
      'nav-fichajes': {
        char: { top: '110px', left: 'calc(50vw - 95px)', right: 'auto', bottom: 'auto' },
        bubble: { top: '240px', left: '16px', right: 'auto', bottom: 'auto' },
      },
      'nav-banco': {
        char: { top: '110px', left: 'calc(50vw - 95px)', right: 'auto', bottom: 'auto' },
        bubble: { top: '240px', left: '16px', right: 'auto', bottom: 'auto' },
      },
      // Closing: character centered above dialog
      'closing': {
        char: { bottom: '380px', left: 'calc(50vw - 95px)', right: 'auto', top: 'auto' },
        bubble: { bottom: '165px', left: '16px', right: 'auto', top: 'auto' },
      },
    };

    const pos = positions[step.id];
    if (pos) {
      this.characterPos.set(pos.char);
      this.bubblePos.set(pos.bubble);
    } else {
      // Fallback
      this.characterPos.set({ bottom: '20px', left: '16px', right: 'auto', top: 'auto' });
      this.bubblePos.set({ bottom: '140px', left: '16px', right: 'auto', top: 'auto' });
    }
  }

  private lockScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    document.body.style.overflow = '';
  }

  nextStep(): void { this.onboarding.nextStep(); }
  previousStep(): void { this.onboarding.previousStep(); }
  skipTutorial(): void { this.onboarding.skipOnboarding(); }
  finishTutorial(): void { this.onboarding.completeOnboarding(); }
}
