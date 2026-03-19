import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import confetti from 'canvas-confetti';

interface Prize {
  amount: string;
  icon: string;
}

@Component({
  selector: 'app-ruleta',
  imports: [NgOptimizedImage],
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

       <header class="w-full max-w-md px-4 pt-6 pb-3 text-center">
         <h1 class="mt-2 text-white text-4xl font-black tracking-[0.08em] leading-tight">SUPER LUCKY SPIN</h1>
         <p class="mt-1.5 text-sm text-white/75">Gira la ruleta y gana una recompensa aleatoria</p>
       </header>

      <div class="roulette-shell lg-panel lg-shimmer lg-accent-ring" role="group" aria-label="Ruleta de premios">
        <div class="pointer" aria-hidden="true"></div>

        <div
          class="wheel lg-cyan-ring"
          [style.transform]="wheelTransform()"
          [attr.aria-label]="isSpinning() ? 'Ruleta girando' : 'Ruleta detenida'"
          role="img"
        >
          <div class="wheel-face" aria-hidden="true"></div>
          
          @for (prize of prizes; track prize.amount; let i = $index) {
            <div 
              class="prize-segment"
              [style.transform]="prizeTransform(i)"
            >
              <img 
                [ngSrc]="prize.icon" 
                [alt]="prize.amount" 
                width="40" 
                height="40"
                class="prize-icon"
              />
              <span class="prize-text">{{ prize.amount }}</span>
            </div>
          }
          
          <div class="wheel-gloss" aria-hidden="true"></div>
          <div class="wheel-center" aria-hidden="true"></div>
          <div class="wheel-inner-ring" aria-hidden="true"></div>
        </div>

        <div class="lights" aria-hidden="true">
          @for (light of lights; track light) {
            <span class="light" [style.transform]="lightTransform(light)"></span>
          }
        </div>
      </div>

      <section class="w-full max-w-md px-4 pb-6 pt-2">
        <button
          type="button"
          class="w-full lg-btn-primary py-3.5 text-sm uppercase font-black tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
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
       justify-content: flex-start;
       min-height: 100vh;
       padding: 1rem 0 0.5rem;
       position: relative;
       overflow: hidden;
       gap: 0.5rem;
     }

    .roulette-shell {
      position: relative;
      width: min(84vw, 360px);
      height: min(84vw, 360px);
      border-radius: 50%;
      display: grid;
      place-items: center;
      padding: 0.95rem;
      border: 1px solid var(--lg-glass-border-hi);
      box-shadow:
        0 24px 48px rgba(0, 0, 0, 0.36),
        inset 0 2px 0 rgba(255, 255, 255, 0.2);
    }

    .wheel {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      position: relative;
      transition: transform 4.8s cubic-bezier(0.12, 0.96, 0.3, 1);
      box-shadow:
        0 18px 46px rgba(0, 0, 0, 0.5),
        inset 0 2px 0 rgba(255, 255, 255, 0.28),
        inset 0 -4px 0 rgba(0, 0, 0, 0.3);
      background: radial-gradient(circle at center, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
      border: 9px solid color-mix(in srgb, var(--lg-accent-gold) 72%, var(--lg-violet-mid));
    }

    .wheel-face {
      position: absolute;
      inset: 9px;
      border-radius: 50%;
      background:
        conic-gradient(
          from -90deg,
          color-mix(in srgb, white 92%, var(--lg-accent-cyan)) 0deg 45deg,
          color-mix(in srgb, var(--lg-accent-gold) 72%, white) 45deg 90deg,
          color-mix(in srgb, white 92%, var(--lg-accent-cyan)) 90deg 135deg,
          color-mix(in srgb, var(--lg-accent-gold) 72%, white) 135deg 180deg,
          color-mix(in srgb, white 92%, var(--lg-accent-cyan)) 180deg 225deg,
          color-mix(in srgb, var(--lg-accent-gold) 72%, white) 225deg 270deg,
          color-mix(in srgb, white 92%, var(--lg-accent-cyan)) 270deg 315deg,
          color-mix(in srgb, var(--lg-accent-gold) 72%, white) 315deg 360deg
        );
      box-shadow:
        inset 0 0 0 2px rgba(255, 255, 255, 0.22),
        inset 0 -10px 18px rgba(0, 0, 0, 0.1);
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

    .wheel-gloss {
      position: absolute;
      inset: 12px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.35), transparent 52%);
      pointer-events: none;
    }

    .wheel-inner-ring {
      position: absolute;
      inset: 34px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.32);
      background: radial-gradient(circle, rgba(255, 255, 255, 0.12), transparent 70%);
    }

    .prize-segment {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding-top: 28px;
      gap: 2px;
      transform-origin: center center;
      pointer-events: none;
    }

    .prize-icon {
      width: 32px;
      height: 32px;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
      z-index: 2;
    }

    .prize-text {
      font-size: 11px;
      font-weight: 900;
      color: rgba(0, 0, 0, 0.85);
      text-shadow: 
        0 1px 0 rgba(255, 255, 255, 0.8),
        0 1px 3px rgba(255, 255, 255, 0.5);
      letter-spacing: 0.03em;
      z-index: 2;
    }

    .wheel-center {
      position: absolute;
      width: 50px;
      height: 50px;
      border-radius: 999px;
      background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.5), var(--lg-accent) 40%, var(--lg-violet-mid));
      box-shadow:
        0 8px 20px rgba(0, 0, 0, 0.35),
        inset 0 2px 0 rgba(255, 255, 255, 0.32);
      z-index: 2;
    }

    .pointer {
      position: absolute;
      top: -9px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 13px solid transparent;
      border-right: 13px solid transparent;
      border-top: 24px solid var(--lg-accent-gold);
      filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.45));
      z-index: 6;
    }

    .pointer::before {
      content: '';
      position: absolute;
      top: -27px;
      left: -9px;
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: radial-gradient(circle at 35% 28%, #fff, color-mix(in srgb, var(--lg-accent-gold) 78%, var(--lg-accent)) 68%);
      box-shadow: 0 2px 9px rgba(0, 0, 0, 0.34);
    }

    .lights {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      pointer-events: none;
      animation: pulseLights 2.2s ease-in-out infinite;
    }

    .light {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 8px;
      height: 8px;
      margin-left: -4px;
      margin-top: -4px;
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
export class RuletaComponent implements OnDestroy {
  private router = inject(Router);
  private readonly spinStartAudio = this.createAudio('/sounds/button-click-off-click.mp3', 0.55);
  private readonly spinEndAudio = this.createAudio('/sounds/010707105_prev.mp3', 0.6);

  readonly prizes: Prize[] = [
    { amount: '200', icon: 'game/balls/ball-lv1.webp' },
    { amount: '500', icon: 'game/balls/ball-lv2.webp' },
    { amount: '800', icon: 'game/balls/ball-lv3.webp' },
    { amount: '1000', icon: 'game/balls/ball-lv4.webp' },
    { amount: '1500', icon: 'game/balls/ball-lv5.webp' },
    { amount: '2000', icon: 'game/balls/ball-lv6.webp' },
    { amount: '5000', icon: 'game/balls/ball-lv7.webp' },
    { amount: '10000', icon: 'game/balls/ball-lv8.webp' }
  ];
  readonly lights = Array.from({ length: 24 }, (_, index) => index);
  readonly isSpinning = signal(false);
  readonly rotation = signal(0);
  readonly currentPrizeIndex = signal(0);

  readonly currentPrize = computed(() => `${this.prizes[this.currentPrizeIndex()].amount} COP`);
  readonly liveMessage = computed(() =>
    this.isSpinning() ? 'La ruleta está girando.' : `Resultado: ${this.currentPrize()}.`
  );
  readonly wheelTransform = computed(() => `rotate(${this.rotation()}deg)`);

  ngOnDestroy(): void {
    this.spinStartAudio.pause();
    this.spinEndAudio.pause();
  }

  goBack(): void {
    this.router.navigate(['/main']);
  }

  lightTransform(index: number): string {
    const angle = (360 / this.lights.length) * index;
    return `rotate(${angle}deg) translateY(-171px)`;
  }

  prizeTransform(index: number): string {
    const segmentAngle = 360 / this.prizes.length;
    const angle = index * segmentAngle + segmentAngle / 2;
    return `rotate(${angle}deg)`;
  }

  spin(): void {
    if (this.isSpinning()) {
      return;
    }

    this.playAudio(this.spinStartAudio);
    this.isSpinning.set(true);
    
    const currentRotationNormalized = this.rotation() % 360;
    const winningIndex = Math.floor(Math.random() * this.prizes.length);
    const segmentAngle = 360 / this.prizes.length;
    const segmentCenter = winningIndex * segmentAngle + segmentAngle / 2;
    const landingAngle = 360 - segmentCenter;
    const extraTurns = 15 + Math.floor(Math.random() * 8);
    const targetRotation = currentRotationNormalized + extraTurns * 360 + landingAngle;

    this.rotation.set(targetRotation);

    window.setTimeout(() => {
      this.currentPrizeIndex.set(winningIndex);
      this.isSpinning.set(false);
      this.playAudio(this.spinEndAudio);
      this.triggerConfetti();
    }, 4900);
  }

  private triggerConfetti(): void {
    const colors = ['#ffd060', '#00d4ff', '#22c55e'];
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.5 },
      colors
    });

    window.setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors
      });
    }, 250);
  }

  private createAudio(src: string, volume: number): HTMLAudioElement {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = volume;
    return audio;
  }

  private playAudio(audio: HTMLAudioElement): void {
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }
}
