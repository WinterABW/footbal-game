import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { UserStatusService } from '../../../core/services/user-status.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { GameService } from '../../../core/services/game.service';
import { TicketHeaderComponent } from '../ticket-header/ticket-header.component';

interface Ticket {
  id: number;
  value: string;
  colorClass: string;
  icon: string;
  iconPath: string;
  weight: number;
}

@Component({
  selector: 'app-ticket-roulette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, TicketHeaderComponent],
  template: `
    <div class="game-wrapper hide-nav">
      <app-ticket-header
        [accentColor]="'cyan'"
        (backClick)="goBack()"
      />

      <div class="glass-board shadow-glow">
        <div class="selector-arrow left"></div>
        <div class="selector-arrow right"></div>

        <div class="reel-window">
          <div class="reel" [style.transform]="'translateY(' + currentOffset() + 'px)'" [style.transition-duration]="transitionDuration() + 'ms'">
            @for (ticket of reelTickets(); track $index) {
              <div class="ticket-wrapper">
                <div class="ticket effect-3d" [class.ticket-teal]="ticket.colorClass === 'ticket-teal'" [class.ticket-blue]="ticket.colorClass === 'ticket-blue'" [class.ticket-pink]="ticket.colorClass === 'ticket-pink'" [class.ticket-gold]="ticket.colorClass === 'ticket-gold'">
                  <div class="ticket-inner">
                    <img [ngSrc]="ticket.iconPath" [alt]="ticket.value" class="ticket-icon" width="32" height="32">
                    <span class="value">{{ ticket.value }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <button class="spin-btn action-glow" [class.disabled]="isSpinning()" [disabled]="isSpinning()" (click)="spin()">
        GIRAR
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }

    .glass {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.3);
      border-radius: 24px;
    }

    .header {
      padding: 1rem 2rem;
      margin-bottom: 1rem;
      border-radius: 40px;
    }
    .header h1 { margin: 0; font-size: 1.5rem; letter-spacing: 1.5px; font-weight: 400; }
    .header span { color: #22d3ee; font-weight: 700; }

    .game-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: transparent;
      overflow: hidden;
      padding: 20px;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .glass-board {
      position: relative;
      width: 100%;
      max-width: 380px;
      height: 500px;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 30px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.08);
      margin-bottom: 40px;
    }

    .glass-board.shadow-glow {
      box-shadow: 0 0 40px rgba(0, 210, 255, 0.2), 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.08);
    }

    .reel-window {
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
      mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
      -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
    }

    .reel {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      transition-timing-function: cubic-bezier(0.15, 0.95, 0.25, 1);
      transition-property: transform;
    }

    .ticket-wrapper {
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }

    .ticket {
      width: 70%;
      height: 80px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      mask-image: radial-gradient(circle at 0 50%, transparent 8px, black 9px), radial-gradient(circle at 100% 50%, transparent 8px, black 9px);
      mask-size: 51% 100%;
      mask-repeat: no-repeat;
      mask-position: left, right;
      -webkit-mask-image: radial-gradient(circle at 0 50%, transparent 10px, black 11px), radial-gradient(circle at 100% 50%, transparent 10px, black 11px);
      -webkit-mask-size: 51% 100%;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-position: left, right;
    }

    .ticket.effect-3d {
      box-shadow: inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -4px 0 rgba(0,0,0,0.2), 0 8px 15px rgba(0,0,0,0.4);
    }

    .ticket-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: white;
      font-weight: bold;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .ticket-inner .icon { font-size: 1.2rem; margin-bottom: 2px; }
    .ticket-inner .ticket-icon { width: 28px; height: 28px; object-fit: contain; margin-bottom: 2px; }
    .ticket-inner .value { font-size: 1.8rem; letter-spacing: 1px; }

    .ticket-teal { background: linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%); }
    .ticket-blue { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
    .ticket-pink { background: linear-gradient(135deg, #f43f5e 0%, #be123c 100%); }
    .ticket-gold { background: linear-gradient(135deg, #facc15 0%, #ca8a04 100%); }

    .selector-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 0; height: 0;
      border-top: 15px solid transparent;
      border-bottom: 15px solid transparent;
      z-index: 10;
      filter: drop-shadow(0 0 8px rgba(0, 210, 255, 0.8));
    }
    .selector-arrow.left { left: -5px; border-left: 20px solid #00d2ff; }
    .selector-arrow.right { right: -5px; border-right: 20px solid #00d2ff; }

    .spin-btn {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50px;
      padding: 16px 50px;
      font-size: 1.35rem;
      font-weight: 800;
      color: white;
      letter-spacing: 2px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 10px 40px rgba(0, 210, 255, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2);
      position: relative;
      overflow: hidden;
      animation: neonPulse 1.5s ease-in-out infinite;
    }

    .spin-btn.action-glow { animation: neonPulse 1.5s ease-in-out infinite; }

    .spin-btn:not([disabled]):hover {
      transform: translateY(-3px) scale(1.05);
      box-shadow: 0 15px 50px rgba(0, 210, 255, 0.5), 0 0 30px rgba(0, 210, 255, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.2);
      background: rgba(255, 255, 255, 0.15);
    }

    .spin-btn:not([disabled]):active {
      transform: translateY(1px) scale(0.98);
      box-shadow: 0 5px 20px rgba(0, 210, 255, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3);
    }

    .spin-btn.disabled {
      filter: grayscale(100%) brightness(0.6);
      cursor: not-allowed;
      animation: none;
      transform: none;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    @keyframes neonPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(0, 210, 255, 0.4), 0 0 40px rgba(0, 210, 255, 0.2), 0 10px 40px rgba(0, 210, 255, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3); }
      50% { box-shadow: 0 0 30px rgba(0, 210, 255, 0.6), 0 0 60px rgba(0, 210, 255, 0.3), 0 10px 50px rgba(0, 210, 255, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.4); }
    }

    .hide-nav ::ng-deep bottom-navigation,
    .hide-nav ::ng-deep nav,
    .hide-nav ::ng-deep .bottom-nav {
      display: none !important;
    }
  `]
})
export class TicketRouletteComponent {
  private userStatusService = inject(UserStatusService);
  private errorHandler = inject(ErrorHandlerService);
  private gameService = inject(GameService);

  // Tickets leídos del estado del jugador
  ticketsCount = computed(() => this.userStatusService.wallet()?.ticketBalance ?? 0);

  // Estado del juego con Signals
  isSpinning = signal(false);
  currentOffset = signal(0);
  transitionDuration = signal(0);
  reelTickets = signal<Ticket[]>([]);
  currentVisibleIndex = signal(2);

  // Configuración de la ruleta
  ticketHeight = 100;
  visibleTickets = 5;

  baseTickets: Ticket[] = [
    { id: 1, value: "500 USD", colorClass: 'ticket-teal', icon: '💵', iconPath: 'mini-games/tickets/usdIcon.webp', weight: 0 },    // Nunca sale
    { id: 2, value: "10,000 COP", colorClass: 'ticket-blue', icon: '🪙', iconPath: 'mini-games/tickets/coin-fromt.webp', weight: 0 }, // Nunca sale
    { id: 3, value: "100 COP", colorClass: 'ticket-blue', icon: '🪙', iconPath: 'mini-games/tickets/coin-fromt.webp', weight: 2 },
    { id: 4, value: "20 COP", colorClass: 'ticket-pink', icon: '🪙', iconPath: 'mini-games/tickets/coin-fromt.webp', weight: 20 },
    { id: 5, value: "10 COP", colorClass: 'ticket-gold', icon: '🪙', iconPath: 'mini-games/tickets/coin-fromt.webp', weight: 30 },
    { id: 6, value: "50,000 COP", colorClass: 'ticket-pink', icon: '🪙', iconPath: 'mini-games/tickets/coin-fromt.webp', weight: 0 }, // Nunca sale
    { id: 7, value: "5 Energía  ", colorClass: 'ticket-teal', icon: '⚡', iconPath: 'game/energy/thunder.webp', weight: 30 },
  ];

  audioClick = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  audioTick = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  audioWin = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');

  private router = inject(Router);

  constructor() {
    this.audioTick.volume = 0.3;
    this.generateReel();
  }

  generateReel() {
    let tempReel: Ticket[] = [];
    for (let i = 0; i < 200; i++) { // 200 repeticiones = 1400+ items
      tempReel = [...tempReel, ...this.baseTickets];
    }
    this.reelTickets.set(tempReel);
    this.currentOffset.set(this.calculateOffset(2));
    this.currentVisibleIndex.set(2);
  }

  calculateOffset(targetIndex: number): number {
    return -(targetIndex - Math.floor(this.visibleTickets / 2)) * this.ticketHeight;
  }

  /** Weighted random selection — picks a ticket based on probability weights */
  private pickWinner(): Ticket {
    const totalWeight = this.baseTickets.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;
    for (const ticket of this.baseTickets) {
      random -= ticket.weight;
      if (random <= 0) return ticket;
    }
    return this.baseTickets[this.baseTickets.length - 1];
  }

  spin() {
    if (this.isSpinning()) return;

    // Verificar que hay tickets disponibles primero
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

      this.audioClick.play().catch(() => {});
      this.isSpinning.set(true);

      // 1. Elegir ganador con probabilidades ponderadas
      const winner = this.pickWinner();

      // 2. RESET: Volver al inicio del reel SIN animación
      this.transitionDuration.set(0);
      this.currentOffset.set(this.calculateOffset(2));
      this.currentVisibleIndex.set(2);

      // 3. Calcular destino: entre 700 y 800 posiciones (siempre dentro del reel de 1400)
      const minSpins = 700;
      const extraSpins = Math.floor(Math.random() * 100);
      const targetIndex = 2 + minSpins + extraSpins; // Empezamos desde 2

      const reel = this.reelTickets();

      // 4. Buscar el primer ticket ganador DESPUÉS de targetIndex
      let actualIndex = -1;
      for (let i = targetIndex; i < reel.length; i++) {
        if (reel[i].id === winner.id) {
          actualIndex = i;
          break;
        }
      }
      if (actualIndex === -1) actualIndex = targetIndex;

      this.currentVisibleIndex.set(actualIndex);
      const targetOffset = this.calculateOffset(actualIndex);
      const durationMs = 5000;

      // 5. Pequeño delay para que el browser aplique el reset, luego animar
      setTimeout(() => {
        this.transitionDuration.set(durationMs);
        this.currentOffset.set(targetOffset);
        this.trackTicks(actualIndex, durationMs);
      }, 50);

      setTimeout(() => {
        this.finishSpin(actualIndex, winner);
      }, durationMs + 150);
    });
  }

  trackTicks(targetIndex: number, durationMs: number) {
    let lastTickIndex = -1;
    const startTime = performance.now();
    const startY = this.currentOffset() || 0;
    const endY = this.calculateOffset(targetIndex);

    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const checkTick = (currentTime: number) => {
      if (!this.isSpinning()) return;

      const elapsed = currentTime - startTime;
      let progress = elapsed / durationMs;
      if (progress > 1) progress = 1;

      const currentY = startY + (endY - startY) * easeOutCubic(progress);
      const currentIndex = Math.floor(2 - (currentY / this.ticketHeight));

      if (currentIndex !== lastTickIndex && currentIndex > 0) {
        lastTickIndex = currentIndex;
        this.audioTick.currentTime = 0;
        this.audioTick.play().catch(() => {});
      }

      if (progress < 1) {
        requestAnimationFrame(checkTick);
      }
    };

    requestAnimationFrame(checkTick);
  }

  finishSpin(winningIndex: number, winner: Ticket) {
    this.isSpinning.set(false);
    this.audioWin.play().catch(() => {});
    
    // Llamar al backend para registrar la ganancia (ticket ya fue deducido en spin)
    // Parsear el valor del premio (ej: "500 USD" -> 500, "5 Energía" -> 5)
    const prizeValue = this.parsePrizeValue(winner.value);
    
    this.gameService.casinoPlay(prizeValue, 0).then(result => {
      if (result.success) {
        // userStatusService.loadUserStatus() ya se llama en casinoPlay
        this.errorHandler.showSuccessToast(`¡Ganaste ${winner.value}!`);
      } else {
        this.errorHandler.showErrorToast(result.error || 'Error al registrar premio');
      }
    });
    
    console.log('Winner:', winner.value, 'at index', winningIndex);
  }

  private parsePrizeValue(value: string): number {
    // Extraer número del string (ej: "500 USD" -> 500, "5 Energía" -> 5, "100 COP" -> 100)
    const match = value.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  goBack() {
    this.router.navigate(['/main']);
  }
}
