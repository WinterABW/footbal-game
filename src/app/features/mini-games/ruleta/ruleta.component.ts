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
import { UserStatusService } from '../../../core/services/user-status.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { GameService } from '../../../core/services/game.service';
import { TicketHeaderComponent } from '../ticket-header/ticket-header.component';

interface Prize {
  id: number;
  amount: string;
  colorClass: string;
  icon: string;
  iconPath: string;
  weight: number;
  neverAward?: boolean;
}

@Component({
  selector: 'app-ruleta',
  imports: [NgOptimizedImage, TicketHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="game-wrapper hide-nav" aria-label="Juego de ruleta aleatoria">
      <app-ticket-header
        [accentColor]="'yellow'"
        (backClick)="goBack()"
      />

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
              <div class="prize-content">
                <img
                   [ngSrc]="prize.iconPath"
                   [alt]="prize.amount"
                   width="48"
                   height="48"
                   class="prize-icon"
                 />
                <span class="prize-text">{{ prize.amount }}</span>
              </div>
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

      <section class="w-full max-w-md px-4 pb-2 pt-8">
        <button
          type="button"
          class="w-full lg-btn-primary py-3.5 text-sm uppercase font-black tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
          [disabled]="isSpinning() || ticketsCount() <= 0"
          (click)="spin()"
          [attr.aria-busy]="isSpinning()"
        >
          {{ isSpinning() ? 'GIRANDO...' : (ticketsCount() <= 0 ? 'SIN TICKETS' : 'GIRAR RULETA') }}
        </button>
        <p class="mt-3 text-center text-white/60 text-sm font-medium tracking-wide">
          Prueba tu suerte, gira la ruleta y gana.
        </p>
      </section>

      <p class="sr-only" aria-live="polite">{{ liveMessage() }}</p>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      color: #fff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
    }

    .game-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 0.75rem 1rem 1rem;
      position: relative;
    }

    .glass {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 
        inset 0 0 20px rgba(255, 255, 255, 0.05),
        0 8px 32px rgba(0, 0, 0, 0.3);
      border-radius: 24px;
    }

    .header {
      padding: 1rem 2rem;
      margin-bottom: 1rem;
      border-radius: 40px;
    }
    .header h1 {
      margin: 0;
      font-size: 1.5rem;
      letter-spacing: 1.5px;
      font-weight: 400;
      color: white;
    }
    .header span {
      color: #facc15;
      font-weight: 700;
    }

    .roulette-shell {
      position: relative;
      width: min(88vw, 380px);
      height: min(88vw, 380px);
      border-radius: 50%;
      display: grid;
      place-items: center;
      padding: 1rem;
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
        inset 0 -4px 0 rgba(0, 0, 0, 0.3),
        0 0 0 2px rgba(255, 215, 0, 0.4),
        inset 0 0 0 2px rgba(255, 215, 0, 0.3),
        0 4px 8px rgba(0, 0, 0, 0.4);
      background: radial-gradient(circle at center, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
      border: 12px solid #b8860b;
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
      padding-top: 42px;
      pointer-events: none;
      transform-origin: center center;
    }

    .prize-content {
      display: flex;
      flex-direction: row-reverse;
      align-items: center;
      gap: 2.5px;
      transform: rotate(-92deg);
      transform-origin: center center;
    }

    .prize-icon {
      width: 36px;
      height: 36px;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
      z-index: 2;
    }

    .prize-text {
      font-size: 11px;
      line-height: 1;
      white-space: nowrap;
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
  private userStatusService = inject(UserStatusService);
  private errorHandler = inject(ErrorHandlerService);
  private gameService = inject(GameService);
  
  readonly ticketsCount = computed(() => this.userStatusService.wallet()?.ticketBalance ?? 0);
  
  private readonly spinStartAudio = this.createAudio('/sounds/button-click-off-click.mp3', 0.55);
  private readonly spinEndAudio = this.createAudio('/sounds/010707105_prev.mp3', 0.6);

  readonly prizes: Prize[] = [
    { id: 1, amount: '10,000 COP', colorClass: 'ticket-blue', icon: '🪙', iconPath: 'mini-games/tickets/coin-fromt.webp', weight: 0, neverAward: true },
    { id: 2, amount: '100 COP', colorClass: 'ticket-blue', icon: '🪙', iconPath: 'mini-games/tickets/coin-fromt.webp', weight: 2, neverAward: false },
    { id: 3, amount: '30 COP', colorClass: 'ticket-blue', icon: '🪙', iconPath: 'mini-games/tickets/coin-fromt.webp', weight: 5, neverAward: false },
    { id: 4, amount: '5,000 COP', colorClass: 'ticket-pink', icon: '🪙', iconPath: 'mini-games/tickets/coin-fromt.webp', weight: 0, neverAward: true },
    { id: 5, amount: '50 Energía', colorClass: 'ticket-teal', icon: '⚡', iconPath: 'game/energy/thunder.webp', weight: 15, neverAward: false },
    { id: 6, amount: '150 COP', colorClass: 'ticket-gold', icon: '🪙', iconPath: 'mini-games/tickets/coin-fromt.webp', weight: 8, neverAward: false },
    { id: 7, amount: '6,000 COP', colorClass: 'ticket-pink', icon: '🪙', iconPath: 'mini-games/tickets/coin-fromt.webp', weight: 0, neverAward: true },
    { id: 8, amount: '30 Toques', colorClass: 'ticket-teal', icon: '✋', iconPath: 'game/energy/touch.webp', weight: 10, neverAward: false }
  ];
  readonly lights = Array.from({ length: 24 }, (_, index) => index);
  readonly isSpinning = signal(false);
  readonly rotation = signal(0);
  readonly currentPrizeIndex = signal(0);

  readonly currentPrize = computed(() => this.prizes[this.currentPrizeIndex()].amount);
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

  prizeCounterRotate(index: number): string {
    const segmentAngle = 360 / this.prizes.length;
    const angle = index * segmentAngle + segmentAngle / 2;
    return `rotate(${-angle}deg)`;
  }

  spin(): void {
    if (this.isSpinning()) {
      return;
    }
    if (this.ticketsCount() <= 0) {
      this.errorHandler.showErrorToast('No tienes tickets disponibles');
      return;
    }

    // Deduct ticket proactively before spinning
    this.gameService.deductTicket().then(result => {
      if (!result.success) {
        this.errorHandler.showErrorToast(result.error || 'No se pudo usar el ticket');
        return;
      }

      this.playAudio(this.spinStartAudio);
      this.isSpinning.set(true);
      
      const currentRotationNormalized = this.rotation() % 360;
      let winningIndex = Math.floor(Math.random() * this.prizes.length);
      // Evitar premios que nunca se otorgan
      if (this.prizes[winningIndex].neverAward) {
        let attempts = 0;
        while (this.prizes[winningIndex].neverAward && attempts < 100) {
          winningIndex = Math.floor(Math.random() * this.prizes.length);
          attempts++;
        }
        if (this.prizes[winningIndex].neverAward) {
          this.isSpinning.set(false);
          return;
        }
      }
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
        
        
        // Llamar al backend para registrar la ganancia (ticket ya fue deducido)
        const prizeValue = this.parsePrizeValue(this.prizes[winningIndex].amount);
        this.gameService.casinoPlay(prizeValue, 1).then(result => {
          if (result.success) {
            // userStatusService.loadUserStatus() ya se llama en casinoPlay
            this.errorHandler.showSuccessToast(`¡Ganaste ${this.prizes[winningIndex].amount}!`);
          } else {
            this.errorHandler.showErrorToast(result.error || 'Error al registrar premio');
          }
        });
      }, 4900);
    });
  }

  private parsePrizeValue(value: string): number {
    // Extraer número del string (ej: "10,000 COP" -> 10000, "50 Energía" -> 50)
    const cleaned = value.replace(/,/g, '');
    const match = cleaned.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
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
