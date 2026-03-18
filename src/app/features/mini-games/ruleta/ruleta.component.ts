import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ruleta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="game-wrapper hide-nav" aria-label="Juego de ruleta aleatoria">
      <button
        class="back-btn lg-icon-btn absolute top-3 left-3 w-11 h-11 z-50 text-white hover:-translate-x-0.5"
        (click)="goBack()"
        aria-label="Volver"
      >
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <header class="w-full max-w-md px-4 pt-14 pb-3 text-center">
        <h1 class="mt-3 text-white text-3xl font-black tracking-wider">SUPER LUCKY SPIN</h1>
        <p class="mt-1 text-sm text-white/70">Gira la ruleta y gana una recompensa aleatoria</p>
      </header>

      <div class="roulette-shell lg-panel lg-shimmer lg-accent-ring">
        <div class="pointer" aria-hidden="true"></div>

        <div
          class="wheel lg-cyan-ring"
          [style.transform]="wheelTransform()"
          [attr.aria-label]="isSpinning() ? 'Ruleta girando' : 'Ruleta detenida'"
          role="img"
        >
          <div class="wheel-face" aria-hidden="true"></div>
          <div class="wheel-center" aria-hidden="true"></div>
          <div class="wheel-inner-ring" aria-hidden="true"></div>
        </div>

        <div class="lights" aria-hidden="true">
          @for (light of lights; track light) {
            <span class="light" [style.transform]="lightTransform(light)"></span>
          }
        </div>
      </div>

      <section class="w-full max-w-md px-4 pb-5 pt-4">
        <div class="lg-card-module p-4 text-center border border-white/10">
          <p class="text-xs uppercase tracking-[0.18em] text-white/60">Premio actual</p>
          <p class="mt-1 text-3xl font-black tracking-wider text-amber-200">{{ currentPrize() }}</p>
        </div>

        <button
          type="button"
          class="mt-4 w-full lg-btn-primary py-3.5 text-sm uppercase font-black tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
          [disabled]="isSpinning()"
          (click)="spin()"
          [attr.aria-busy]="isSpinning()"
        >
          {{ isSpinning() ? 'GIRANDO...' : 'GIRAR RULETA' }}
        </button>
      </section>

      <p class="sr-only" aria-live="polite">{{ liveMessage() }}</p>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--color-dark-background);
      color: #fff;
    }

    .game-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      min-height: 100vh;
      padding: 0.75rem 0 1rem;
      position: relative;
      overflow: hidden;
    }

    .roulette-shell {
      position: relative;
      width: min(86vw, 370px);
      height: min(86vw, 370px);
      border-radius: 50%;
      display: grid;
      place-items: center;
      padding: 1.05rem;
      border: 1px solid var(--lg-glass-border-hi);
    }

    .wheel {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      position: relative;
      transition: transform 5s cubic-bezier(0.12, 0.96, 0.3, 1);
      box-shadow:
        0 18px 46px rgba(0, 0, 0, 0.5),
        inset 0 3px 0 rgba(255, 255, 255, 0.24),
        inset 0 -4px 0 rgba(0, 0, 0, 0.3);
      background: radial-gradient(circle at center, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
      border: 10px solid var(--lg-accent-gold);
    }

    .wheel-face {
      position: absolute;
      inset: 10px;
      border-radius: 50%;
      background:
        conic-gradient(
          from -90deg,
          rgba(255, 255, 255, 0.95) 0deg 45deg,
          color-mix(in srgb, var(--lg-accent-gold) 85%, white) 45deg 90deg,
          rgba(255, 255, 255, 0.95) 90deg 135deg,
          color-mix(in srgb, var(--lg-accent-gold) 85%, white) 135deg 180deg,
          rgba(255, 255, 255, 0.95) 180deg 225deg,
          color-mix(in srgb, var(--lg-accent-gold) 85%, white) 225deg 270deg,
          rgba(255, 255, 255, 0.95) 270deg 315deg,
          color-mix(in srgb, var(--lg-accent-gold) 85%, white) 315deg 360deg
        );
      box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.2);
    }

    .wheel-face::before {
      content: '';
      position: absolute;
      inset: 14px;
      border-radius: 50%;
      background:
        repeating-conic-gradient(
          from -90deg,
          rgba(0, 0, 0, 0.35) 0deg 1.2deg,
          transparent 1.2deg 45deg
        );
      opacity: 0.4;
    }

    .wheel-inner-ring {
      position: absolute;
      inset: 36px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.32);
      background: radial-gradient(circle, rgba(255, 255, 255, 0.12), transparent 70%);
    }

    .wheel-center {
      position: absolute;
      width: 54px;
      height: 54px;
      border-radius: 999px;
      background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.5), var(--lg-accent) 40%, var(--lg-violet-mid));
      box-shadow:
        0 8px 20px rgba(0, 0, 0, 0.35),
        inset 0 2px 0 rgba(255, 255, 255, 0.32);
      z-index: 2;
    }

    .pointer {
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 16px solid transparent;
      border-right: 16px solid transparent;
      border-top: 30px solid var(--lg-accent-gold);
      filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.45));
      z-index: 6;
    }

    .lights {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      pointer-events: none;
      animation: pulseLights 1.8s ease-in-out infinite;
    }

    .light {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 10px;
      height: 10px;
      margin-left: -5px;
      margin-top: -5px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 0 10px color-mix(in srgb, var(--lg-accent-gold) 75%, white);
    }

    @keyframes pulseLights {
      0%,
      100% {
        filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.45));
      }
      50% {
        filter: drop-shadow(0 0 10px rgba(255, 208, 96, 0.7));
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .wheel {
        transition-duration: 100ms;
      }

      .lights {
        animation: none;
      }
    }

    .hide-nav ::ng-deep bottom-navigation,
    .hide-nav ::ng-deep nav,
    .hide-nav ::ng-deep .bottom-nav {
      display: none !important;
    }
  `]
})
export class RuletaComponent {
  private router = inject(Router);

  readonly prizes = ['200', '500', '800', '1000', '1500', '2000', '5000', '10000'];
  readonly lights = Array.from({ length: 24 }, (_, index) => index);
  readonly isSpinning = signal(false);
  readonly rotation = signal(0);
  readonly currentPrizeIndex = signal(0);

  readonly currentPrize = computed(() => `${this.prizes[this.currentPrizeIndex()]} COP`);
  readonly liveMessage = computed(() =>
    this.isSpinning() ? 'La ruleta está girando.' : `Resultado: ${this.currentPrize()}.`
  );
  readonly wheelTransform = computed(() => `rotate(${this.rotation()}deg)`);

  goBack(): void {
    this.router.navigate(['/main']);
  }

  lightTransform(index: number): string {
    const angle = (360 / this.lights.length) * index;
    return `rotate(${angle}deg) translateY(-180px)`;
  }

  spin(): void {
    if (this.isSpinning()) {
      return;
    }

    this.isSpinning.set(true);
    const winningIndex = Math.floor(Math.random() * this.prizes.length);
    const segmentAngle = 360 / this.prizes.length;
    const segmentCenter = winningIndex * segmentAngle + segmentAngle / 2;
    const landingAngle = 360 - segmentCenter;
    const extraTurns = 6 + Math.floor(Math.random() * 3);
    const targetRotation = this.rotation() + extraTurns * 360 + landingAngle;

    this.rotation.set(targetRotation);

    window.setTimeout(() => {
      this.currentPrizeIndex.set(winningIndex);
      this.isSpinning.set(false);
      this.rotation.update((value) => value % 360);
    }, 5100);
  }
}
