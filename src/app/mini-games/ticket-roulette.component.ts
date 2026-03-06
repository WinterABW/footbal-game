import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Ticket {
  id: number;
  value: number;
  colorClass: string;
}

@Component({
  selector: 'app-ticket-roulette',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-wrapper">
      <div class="glass-board shadow-glow">
        
        <div class="selector-arrow left"></div>
        <div class="selector-arrow right"></div>

        <div class="reel-window">
          <div 
            class="reel" 
            #reel
            [style.transform]="'translateY(' + currentOffset() + 'px)'"
            [style.transition-duration]="transitionDuration() + 'ms'"
          >
            @for (ticket of reelTickets(); track $index) {
              <div class="ticket-wrapper">
                <div class="ticket effect-3d" [ngClass]="ticket.colorClass">
                  <div class="ticket-inner">
                    <span class="icon">💎</span>
                    <span class="value">{{ ticket.value }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <button 
        class="spin-btn action-glow" 
        [class.disabled]="isSpinning()"
        (click)="spin()">
        GIRAR
      </button>
    </div>
  `,
  styles: [`
    .game-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%);
      overflow: hidden;
      padding: 20px;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .glass-board {
      position: relative;
      width: 100%;
      max-width: 380px;
      height: 500px; /* 5 tickets visibles de 100px */
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 30px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.05);
      margin-bottom: 40px;
    }

    .glass-board.shadow-glow {
      box-shadow: 0 0 30px rgba(0, 210, 255, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.05);
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

    .ticket-inner .icon {
      font-size: 1.2rem;
      margin-bottom: 2px;
    }

    .ticket-inner .value {
      font-size: 1.8rem;
      letter-spacing: 1px;
    }

    .ticket-teal { background: linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%); }
    .ticket-blue { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
    .ticket-pink { background: linear-gradient(135deg, #f43f5e 0%, #be123c 100%); }
    .ticket-gold { background: linear-gradient(135deg, #facc15 0%, #ca8a04 100%); }

    .selector-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 0; 
      height: 0; 
      border-top: 15px solid transparent;
      border-bottom: 15px solid transparent;
      z-index: 10;
      filter: drop-shadow(0 0 8px rgba(0, 210, 255, 0.8));
    }

    .selector-arrow.left {
      left: -5px;
      border-left: 20px solid #00d2ff;
    }

    .selector-arrow.right {
      right: -5px;
      border-right: 20px solid #00d2ff;
    }

    .spin-btn {
      background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
      border: none;
      border-radius: 50px;
      padding: 18px 60px;
      font-size: 1.5rem;
      font-weight: 800;
      color: white;
      letter-spacing: 2px;
      cursor: pointer;
      transition: transform 0.1s, filter 0.3s;
      box-shadow: 0 10px 20px rgba(0, 210, 255, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.4);
    }

    .spin-btn.action-glow {
      animation: pulse-glow 2s infinite alternate;
    }

    .spin-btn:active:not(.disabled) {
      transform: scale(0.95) translateY(4px);
      box-shadow: 0 5px 10px rgba(0, 210, 255, 0.3);
    }

    .spin-btn.disabled {
      filter: grayscale(100%);
      cursor: not-allowed;
      animation: none;
      opacity: 0.7;
    }

    @keyframes pulse-glow {
      0% { box-shadow: 0 0 15px rgba(0, 210, 255, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.4); }
      100% { box-shadow: 0 0 35px rgba(0, 210, 255, 0.8), inset 0 2px 0 rgba(255, 255, 255, 0.4); }
    }
  `]
})
export class TicketRouletteComponent {
  // Estado del juego con Signals
  isSpinning = signal(false);
  currentOffset = signal(0);
  transitionDuration = signal(0);
  
  // Configuración de la ruleta
  ticketHeight = 100; // 80px alto + 20px gap
  visibleTickets = 5;
  
  baseTickets: Ticket[] = [
    { id: 1, value: 0.15, colorClass: 'ticket-teal' },
    { id: 2, value: 2, colorClass: 'ticket-blue' },
    { id: 3, value: 4, colorClass: 'ticket-blue' },
    { id: 4, value: 50, colorClass: 'ticket-pink' },
    { id: 5, value: 100, colorClass: 'ticket-gold' },
    { id: 6, value: 25, colorClass: 'ticket-pink' },
    { id: 7, value: 0.05, colorClass: 'ticket-teal' },
  ];

  reelTickets = signal<Ticket[]>([]);

  // Audios de prueba (Reemplaza con tus propios sonidos MP3 profesionales en tu carpeta /assets/)
  audioClick = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  audioTick = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  audioWin = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');

  constructor() {
    this.audioTick.volume = 0.3; // Volumen suave para el tick
    this.generateReel();
  }

  generateReel() {
    let tempReel: Ticket[] = [];
    for (let i = 0; i < 15; i++) {
      tempReel = [...tempReel, ...this.baseTickets];
    }
    this.reelTickets.set(tempReel);
    this.currentOffset.set(this.calculateOffset(2));
  }

  calculateOffset(targetIndex: number): number {
    return -(targetIndex - Math.floor(this.visibleTickets / 2)) * this.ticketHeight;
  }

  spin() {
    if (this.isSpinning()) return;

    this.audioClick.play();
    this.isSpinning.set(true);

    const minSpins = 70;
    const maxSpins = 90;
    const winningIndex = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;

    const targetOffset = this.calculateOffset(winningIndex);
    const durationMs = 5000; 
    
    this.transitionDuration.set(durationMs);
    
    setTimeout(() => {
      this.currentOffset.set(targetOffset);
      this.trackTicks(winningIndex, durationMs);
    }, 50);

    setTimeout(() => {
      this.finishSpin(winningIndex);
    }, durationMs + 100);
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
        this.audioTick.play().catch(e => console.log('Esperando interacción para audio...'));
      }

      if (progress < 1) {
        requestAnimationFrame(checkTick);
      }
    };

    requestAnimationFrame(checkTick);
  }

  finishSpin(winningIndex: number) {
    this.isSpinning.set(false);
    this.audioWin.play();
    
    const wonTicket = this.reelTickets()[winningIndex];
    console.log(`¡Ganaste ${wonTicket.value}!`);

  }

  
}
