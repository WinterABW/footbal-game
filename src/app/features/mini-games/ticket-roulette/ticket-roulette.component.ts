import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';

interface Ticket {
  id: number;
  value: any;
  colorClass: string;
}

@Component({
  selector: 'app-ticket-roulette',
  standalone: true,
  imports: [CommonModule,NgOptimizedImage],
  template: `
     <div class="game-wrapper hide-nav">
       <!-- Botón Atrás -->
       <button class="back-btn absolute top-3 left-3 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 backdrop-blur border border-white/10 z-50 transition-transform hover:-translate-x-0.5" (click)="goBack()" aria-label="Volver">
         <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-6 h-6">
           <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
         </svg>
       </button>

<div class="header glass !py-2 px-4! !mb-4 inline-flex! items-center gap-3">
        <img ngSrc="mini-games/tickets/tickets.webp" alt="Jugadores" class="w-12 h-12 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 drop-shadow-md transition-all" width="48" height="48">
        <h1>Tickets: <span> {{ 5 }}</span></h1>
      </div>

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
     }
    .header span {
      color: #00ffcc;
      font-weight: 700;
      text-shadow: 0 0 15px rgba(0, 255, 204, 0.6);
    }

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
       height: 500px; /* 5 tickets visibles de 100px */
       background: rgba(255, 255, 255, 0.08);
       backdrop-filter: blur(24px);
       -webkit-backdrop-filter: blur(24px);
       border: 1px solid rgba(255, 255, 255, 0.15);
       border-radius: 30px;
       box-shadow: 
         0 20px 60px rgba(0, 0, 0, 0.6),
         inset 0 0 30px rgba(255, 255, 255, 0.08);
       margin-bottom: 40px;
     }

     .glass-board.shadow-glow {
       box-shadow: 
         0 0 40px rgba(0, 210, 255, 0.2),
         0 20px 60px rgba(0, 0, 0, 0.6),
         inset 0 0 30px rgba(255, 255, 255, 0.08);
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
       box-shadow: 
         0 10px 40px rgba(0, 210, 255, 0.3),
         inset 0 2px 0 rgba(255, 255, 255, 0.3),
         inset 0 -2px 0 rgba(0, 0, 0, 0.2);
       position: relative;
       overflow: hidden;
       animation: neonPulse 2s ease-in-out infinite;
     }

     .spin-btn.action-glow {
       animation: neonPulse 1.5s ease-in-out infinite;
     }

     .spin-btn:not([disabled]):hover {
       transform: translateY(-3px) scale(1.05);
       box-shadow: 
         0 15px 50px rgba(0, 210, 255, 0.5),
         0 0 30px rgba(0, 210, 255, 0.4),
         inset 0 2px 0 rgba(255, 255, 255, 0.4),
         inset 0 -2px 0 rgba(0, 0, 0, 0.2);
       background: rgba(255, 255, 255, 0.15);
     }

     .spin-btn:not([disabled]):active {
       transform: translateY(1px) scale(0.98);
       box-shadow: 
         0 5px 20px rgba(0, 210, 255, 0.3),
         inset 0 2px 0 rgba(255, 255, 255, 0.3);
     }

     .spin-btn.disabled {
       filter: grayscale(100%) brightness(0.6);
       cursor: not-allowed;
       animation: none;
       transform: none;
       box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
     }

     @keyframes neonPulse {
       0%, 100% {
         box-shadow: 
           0 0 20px rgba(0, 210, 255, 0.4),
           0 0 40px rgba(0, 210, 255, 0.2),
           0 10px 40px rgba(0, 210, 255, 0.3),
           inset 0 2px 0 rgba(255, 255, 255, 0.3);
       }
       50% {
         box-shadow: 
           0 0 30px rgba(0, 210, 255, 0.6),
           0 0 60px rgba(0, 210, 255, 0.3),
           0 10px 50px rgba(0, 210, 255, 0.4),
           inset 0 2px 0 rgba(255, 255, 255, 0.4);
       }
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
    { id: 1, value: "500 USD", colorClass: 'ticket-teal' },
    { id: 2, value: "10,000 COP", colorClass: 'ticket-blue' },
    { id: 3, value: "100 COP", colorClass: 'ticket-blue' },
    { id: 4, value: "20 COP", colorClass: 'ticket-pink' },
    { id: 5, value: "10 COP", colorClass: 'ticket-gold' },
    { id: 6, value: "50,000 COP", colorClass: 'ticket-pink' },
    { id: 7, value: "5 Energía  ", colorClass: 'ticket-teal' },
  ];

  reelTickets = signal<Ticket[]>([]);

  // Audios de prueba (Reemplaza con tus propios sonidos MP3 profesionales en tu carpeta /assets/)
  audioClick = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  audioTick = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
  audioWin = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');

  constructor(private router: Router) {
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

  goBack() {
    this.router.navigate(['/main']);
  }


}
