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
        [class.pose-standing]="currentStepData().characterPose === 'standing'"
        [class.pose-pointing]="currentStepData().characterPose === 'pointing'"
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
    :host { display: contents; }

    .tutorial-panel {
      position: fixed;
      z-index: 9998;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      pointer-events: none;
      animation: panel-fade-in 300ms ease-out forwards;
    }

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
      0%, 100% { border-color: rgba(0, 212, 255, 0.6); }
      50% { border-color: rgba(0, 212, 255, 0.9); }
    }

    .referee-character {
      position: fixed;
      z-index: 10000;
      pointer-events: none;
      transition: all 350ms cubic-bezier(0.34, 1.56, 0.64, 1);
      filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5));
    }

    .referee-character.pose-standing { width: 90px; height: auto; }
    .referee-character.pose-pointing { width: 140px; height: auto; }

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
      width: calc(100vw - 32px);
      box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.5),
        inset 0 1px 1px rgba(255, 255, 255, 0.1);
      transition: top 350ms ease, bottom 350ms ease, left 350ms ease;
      animation: bubble-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes bubble-pop {
      from { opacity: 0; transform: scale(0.9) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .step-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      transition: all 250ms ease-out;
    }
    .step-dot.active {
      width: 20px; border-radius: 10px;
      background: rgba(0, 212, 255, 0.9);
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    }
    .step-dot.completed { background: rgba(0, 212, 255, 0.4); }
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

  characterSrc = computed(() =>
    this.currentStepData().characterPose === 'standing' ? this.standingPose : this.pointingPose
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
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isStanding = step.characterPose === 'standing';

    if (isStanding || !rect) {
      // Intro/closing: character small bottom-left, dialog above-right
      this.characterPos.set({ bottom: '20px', left: '16px', right: 'auto', top: 'auto' });
      this.bubblePos.set({ bottom: '140px', left: '80px', right: 'auto', top: 'auto' });
      return;
    }

    const midY = vh * 0.5;
    const targetCenter = rect.top + rect.height / 2;
    const targetIsAbove = targetCenter < midY;

    if (targetIsAbove) {
      // Target is in upper half → character + bubble at the BOTTOM (far from target)
      this.characterPos.set({ bottom: '20px', left: '16px', right: 'auto', top: 'auto' });
      this.bubblePos.set({ bottom: '30px', left: '140px', right: 'auto', top: 'auto' });
    } else {
      // Target is in lower half → character + bubble at the TOP (far from target)
      this.characterPos.set({ top: '80px', left: '16px', right: 'auto', bottom: 'auto' });
      this.bubblePos.set({ top: '90px', left: '140px', right: 'auto', bottom: 'auto' });
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
