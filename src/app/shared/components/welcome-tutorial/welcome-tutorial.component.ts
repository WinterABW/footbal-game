import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { OnboardingService } from '../../../core/services/onboarding.service';

@Component({
  selector: 'app-welcome-tutorial',
  template: `
    @if (onboarding.isActive()) {
      <div class="fixed inset-0 z-[200] flex items-center justify-center p-4"
           (click)="onBackdropClick($event)">

        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

        <!-- Modal Card -->
        <div class="relative w-full max-w-sm animate-fade-in-up">

          <!-- Step Content -->
          <div class="liquid-glass-card rounded-3xl p-6 md:p-8 text-center">
            <!-- Progress Dots -->
            <div class="flex items-center justify-center gap-2 mb-6">
              @for (step of onboarding.steps; track step.id; let i = $index) {
                <div
                  class="w-2 h-2 rounded-full transition-all duration-300"
                  [class.bg-cyan-400]="i === onboarding.currentStep()"
                  [class.w-6]="i === onboarding.currentStep()"
                  [class.bg-white/20]="i !== onboarding.currentStep()"
                ></div>
              }
            </div>

            <!-- Icon -->
            <div class="text-5xl md:text-6xl mb-4 animate-float">
              {{ onboarding.currentStepData().icon }}
            </div>

            <!-- Title -->
            <h2 class="text-xl md:text-2xl font-black text-white mb-3 tracking-tight">
              {{ onboarding.currentStepData().title }}
            </h2>

            <!-- Description -->
            <p class="text-sm text-slate-300 leading-relaxed mb-6">
              {{ onboarding.currentStepData().description }}
            </p>

             <!-- Bonus Step: Extra visual flair -->
             @if (onboarding.isLastStep()) {
               <div class="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/20">
                 <div class="text-4xl font-black text-amber-400 tracking-wider">
                   +500 🪙
                 </div>
                 <p class="text-[10px] text-amber-300/70 mt-1 uppercase tracking-wider">
                   Monedas de bienvenida
                 </p>
               </div>
             }

            <!-- Action Buttons -->
            <div class="flex flex-col gap-3">
              @if (onboarding.isLastStep()) {
                <!-- Bonus Claim Button -->
                <button
                  (click)="claimBonus()"
                  class="w-full py-3 rounded-2xl font-bold text-sm uppercase tracking-wider
                         bg-gradient-to-r from-amber-500 to-yellow-500 text-black
                         active:scale-95 transition-all duration-200
                         hover:shadow-lg hover:shadow-amber-500/20"
                >
                  ¡Reclamar bono! 🎉
                </button>
              } @else {
                <!-- Next Button -->
                <button
                  (click)="nextStep()"
                  class="w-full py-3 lg-btn-primary text-sm uppercase tracking-wider active:scale-95"
                >
                  {{ onboarding.isFirstStep() ? 'Empezar' : 'Siguiente' }}
                </button>
              }

              <!-- Skip Button -->
              @if (!onboarding.isLastStep()) {
                <button
                  (click)="skip()"
                  class="text-[11px] text-white/30 hover:text-white/60 transition-colors py-1"
                >
                  Saltar tutorial
                </button>
              }
            </div>
          </div>

          <!-- Back Button (not on first step) -->
          @if (!onboarding.isFirstStep() && !onboarding.isLastStep()) {
            <button
              (click)="previousStep()"
              class="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8
                     flex items-center justify-center rounded-full
                     bg-white/10 text-white/60 hover:text-white hover:bg-white/20
                     transition-all duration-200"
              aria-label="Paso anterior"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeTutorialComponent {
  onboarding = inject(OnboardingService);

  bonusClaimed = output<void>();

  nextStep(): void {
    this.onboarding.nextStep();
  }

  previousStep(): void {
    this.onboarding.previousStep();
  }

  claimBonus(): void {
    this.onboarding.claimBonusAndClose();
    this.bonusClaimed.emit();
  }

  skip(): void {
    this.onboarding.skipOnboarding();
  }

  onBackdropClick(event: MouseEvent): void {
    // Prevent accidental close — only allow skip button
    event.stopPropagation();
  }
}
