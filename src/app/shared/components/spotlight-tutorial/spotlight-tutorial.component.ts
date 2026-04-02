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

@Component({
  selector: 'app-spotlight-tutorial',
  template: `
    @if (isActive()) {
      <!-- 4 overlay panels that SURROUND the spotlight — where there's no panel, there's no blur -->
      @if (spotlightRect(); as rect) {
        <!-- Top panel -->
        <div class="tutorial-panel"
          [style.top.px]="0"
          [style.left.px]="0"
          [style.width.vw]="100"
          [style.height.px]="rect.top - PANEL_GAP">
        </div>
        <!-- Bottom panel -->
        <div class="tutorial-panel"
          [style.top.px]="rect.top + rect.height + PANEL_GAP"
          [style.left.px]="0"
          [style.width.vw]="100"
          [style.height.vh]="100">
        </div>
        <!-- Left panel -->
        <div class="tutorial-panel"
          [style.top.px]="rect.top - PANEL_GAP"
          [style.left.px]="0"
          [style.width.px]="rect.left - PANEL_GAP"
          [style.height.px]="rect.height + PANEL_GAP * 2">
        </div>
        <!-- Right panel -->
        <div class="tutorial-panel"
          [style.top.px]="rect.top - PANEL_GAP"
          [style.left.px]="rect.left + rect.width + PANEL_GAP"
          [style.width.vw]="100"
          [style.height.px]="rect.height + PANEL_GAP * 2">
        </div>
      } @else {
        <!-- No target (intro/closing) — full overlay -->
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
        [class.pose-standing]="currentStepData().characterPose === 'standing'"
        [class.pose-pointing]="currentStepData().characterPose === 'pointing'"
        [style]="characterStyle()"
        draggable="false" />

      <!-- Speech Bubble -->
      <div class="speech-bubble" [style]="bubbleStyle()">
        <!-- Step indicators -->
        <div class="flex items-center justify-center gap-1.5 mb-3">
          @for (step of steps; track step.id; let i = $index) {
            <div class="step-dot"
              [class.active]="i === currentStep()"
              [class.completed]="i < currentStep()">
            </div>
          }
        </div>

        <!-- Title -->
        <h3 class="text-lg font-black text-white tracking-tight mb-1 text-center">
          {{ currentStepData().icon }} {{ currentStepData().title }}
        </h3>

        <!-- Description -->
        <p class="text-sm text-white/70 leading-relaxed text-center mb-4">
          {{ currentStepData().description }}
        </p>

        <!-- Navigation -->
        <div class="flex items-center gap-2">
          @if (!isFirstStep()) {
            <button (click)="previousStep()"
              class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white/60 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all">
              Anterior
            </button>
          }

          @if (isLastStep()) {
            <button (click)="finishTutorial()"
              class="flex-[2] py-2.5 rounded-xl text-sm font-black text-white bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/20">
              ¡A jugar!
            </button>
          } @else {
            <button (click)="nextStep()"
              class="flex-[2] py-2.5 rounded-xl text-sm font-black text-white bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/20">
              {{ isFirstStep() ? 'Empezar' : 'Siguiente' }}
            </button>
          }
        </div>

        <!-- Skip link -->
        @if (!isLastStep()) {
          <button (click)="skipTutorial()"
            class="w-full mt-2 py-1.5 text-xs text-white/30 hover:text-white/60 transition-colors font-medium">
            Saltar tutorial
          </button>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }

    /* Panel that covers one area with blur + dim */
    .tutorial-panel {
      position: fixed;
      z-index: 9998;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      pointer-events: none;
      animation: panel-fade-in 300ms ease-out forwards;
    }

    /* Full overlay for intro/closing (no spotlight target) */
    .tutorial-panel-full {
      position: fixed;
      inset: 0;
      z-index: 9998;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
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
      border-radius: 16px;
      border: 2px solid rgba(0, 212, 255, 0.6);
      box-shadow:
        0 0 20px rgba(0, 212, 255, 0.3),
        0 0 60px rgba(0, 212, 255, 0.1),
        inset 0 0 20px rgba(0, 212, 255, 0.1);
      pointer-events: none;
      transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1);
      animation: ring-pulse 2s ease-in-out infinite;
    }

    @keyframes ring-pulse {
      0%, 100% { border-color: rgba(0, 212, 255, 0.6); box-shadow: 0 0 20px rgba(0, 212, 255, 0.3), 0 0 60px rgba(0, 212, 255, 0.1); }
      50% { border-color: rgba(0, 212, 255, 0.9); box-shadow: 0 0 30px rgba(0, 212, 255, 0.5), 0 0 80px rgba(0, 212, 255, 0.2); }
    }

    .referee-character {
      position: fixed;
      z-index: 10000;
      pointer-events: none;
      transition: all 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
      filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5));
    }

    .referee-character.pose-standing {
      width: 120px;
      height: auto;
    }

    .referee-character.pose-pointing {
      width: 140px;
      height: auto;
    }

    .speech-bubble {
      position: fixed;
      z-index: 10001;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(48px) saturate(180%);
      -webkit-backdrop-filter: blur(48px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 24px;
      padding: 20px;
      max-width: 320px;
      width: calc(100vw - 100px);
      box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.5),
        inset 0 1px 1px rgba(255, 255, 255, 0.1);
      transition: all 350ms cubic-bezier(0.25, 1, 0.5, 1);
      animation: bubble-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes bubble-pop {
      from { opacity: 0; transform: scale(0.9) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .step-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      transition: all 250ms ease-out;
    }

    .step-dot.active {
      width: 20px;
      border-radius: 10px;
      background: rgba(0, 212, 255, 0.9);
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    }

    .step-dot.completed {
      background: rgba(0, 212, 255, 0.4);
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
  readonly steps = ONBOARDING_STEPS;

  // Gap between spotlight ring and overlay panels
  readonly PANEL_GAP = 4;

  spotlightRect = signal<SpotlightRect | null>(null);
  private resizeTimeout: any = null;

  private readonly onResizeHandler = () => {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      if (this.isActive()) this.updateSpotlight();
    }, 100);
  };

  private readonly standingPose = 'tuto/BackgroundEraser_20260325_024134450.webp';
  private readonly pointingPose = 'tuto/BackgroundEraser_20260402_081920861.webp';

  characterSrc = computed(() =>
    this.currentStepData().characterPose === 'standing' ? this.standingPose : this.pointingPose
  );

  characterStyle = computed(() => {
    const rect = this.spotlightRect();
    const isStanding = this.currentStepData().characterPose === 'standing';

    if (isStanding || !rect) {
      return { bottom: '20px', left: '20px', right: 'auto', top: 'auto' };
    }

    const midY = window.innerHeight * 0.5;
    const targetIsAbove = rect.top + rect.height / 2 < midY;

    if (targetIsAbove) {
      return { bottom: '20px', left: '16px', right: 'auto', top: 'auto' };
    } else {
      return { top: '100px', left: '16px', right: 'auto', bottom: 'auto' };
    }
  });

  bubbleStyle = computed(() => {
    const rect = this.spotlightRect();
    const isStanding = this.currentStepData().characterPose === 'standing';

    if (isStanding || !rect) {
      return { bottom: '150px', left: '16px', right: 'auto', top: 'auto' };
    }

    const midY = window.innerHeight * 0.5;
    const targetIsAbove = rect.top + rect.height / 2 < midY;

    if (targetIsAbove) {
      return { bottom: '160px', left: '16px', right: 'auto', top: 'auto' };
    } else {
      return { top: '100px', left: '160px', right: 'auto', bottom: 'auto' };
    }
  });

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
      setTimeout(() => this.updateSpotlight(), 50);
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

  ngOnDestroy(): void {
    // Cleanup handled by destroyRef
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

  private lockScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    document.body.style.overflow = '';
  }

  nextStep(): void {
    this.onboarding.nextStep();
  }

  previousStep(): void {
    this.onboarding.previousStep();
  }

  skipTutorial(): void {
    this.onboarding.skipOnboarding();
  }

  finishTutorial(): void {
    this.onboarding.completeOnboarding();
  }
}
