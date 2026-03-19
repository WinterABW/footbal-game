import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';

interface Box {
  id: number;
  hasPrize: boolean;
  opened: boolean;
}

@Component({
  selector: 'app-game1',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <div class="game-wrapper hide-nav">
      <!-- Botón Atrás -->
       <button class="back-btn absolute top-3 left-3 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 backdrop-blur border border-white/10 z-50 transition-transform hover:-translate-x-0.5" (click)="goBack()" aria-label="Volver">
         <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-6 h-6">
           <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
         </svg>
       </button>

      <div class="header glass !p-2 !mb-4 inline-flex items-center gap-3 border-yellow-500/30 shadow-lg accent-amber">
        <img ngSrc="mini-games/tickets/tickets.webp" alt="Jugadores" class="w-12 h-12 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 drop-shadow-md transition-all" width="48" height="48">
        <h1>Tickets: <span class="text-glow-yellow"> {{ balance }}</span></h1>
      </div>

      <div class="grid-container !gap-4 !mb-6">
        @for (box of boxes; track box.id) {
          <div class="box glass !w-24 !h-24"
               [class.active]="gameState === 'playing' && !box.opened"
               [class.opened]="box.opened"
               [class.winner]="box.opened && box.hasPrize"
               [class.loser]="box.opened && !box.hasPrize"
               (click)="openBox(box)">
            <div class="content">
              <img [ngSrc]="boxIcon(box)" [alt]="'Caja ' + (box.opened ? (box.hasPrize ? 'con premio' : 'vacía') : 'sin abrir')" width="96" height="96" class="icon-img">
            </div>
          </div>
        }
      </div>

       <button class="play-btn glass !px-6 !py-3 !text-base bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 border border-white/20 hover:shadow-blue-500/50 hover:scale-105 active:scale-95"
               (click)="startGame()" [disabled]="gameState === 'playing'">
         {{ gameState === 'idle' ? 'JUGAR (Costo: $10)' : '🎯 SELECCIONA UNA CAJA 🎯' }}
       </button>

      @if (gameState === 'won' || gameState === 'lost') {
        <div class="banner glass !p-4 !text-xl" [class.banner-win]="gameState === 'won'">
          <h2>{{ gameState === 'won' ? '¡GANASTE EL PREMIO!' : '¡CAJA VACÍA! PERDISTE' }}</h2>
        </div>
      }
    </div>
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
     }
     .header span {
      color: #facc15;
      font-weight: 700;
    }

     .grid-container {
       display: grid;
       grid-template-columns: repeat(3, 1fr);
       gap: 16px;
       margin-bottom: 1rem;
       position: relative;
       z-index: 10;
     }

     .box {
       width: 96px;
       height: 96px;
       display: flex;
       justify-content: center;
       align-items: center;
       cursor: not-allowed;
       transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
       position: relative;
       overflow: hidden;
     }

     .box.active {
       cursor: pointer;
     }
     .box.active:hover {
       transform: translateY(-4px) scale(1.05);
       box-shadow: 
         inset 0 0 20px rgba(255, 255, 255, 0.1),
         0 12px 28px rgba(0, 255, 204, 0.3);
       border-color: rgba(0, 255, 204, 0.4);
     }

     .icon-img {
       width: 80px;
       height: 80px;
       object-fit: contain;
       filter: drop-shadow(0 0 8px rgba(255,255,255,0.25));
     }

    .box.opened {
      transform: scale(0.92);
      pointer-events: none;
    }
    .box.winner {
      background: rgba(0, 255, 128, 0.15);
      border-color: #00ff80;
      box-shadow: 0 0 25px rgba(0, 255, 128, 0.5), inset 0 0 15px rgba(0, 255, 128, 0.25);
    }
    .box.loser {
      background: rgba(255, 50, 50, 0.1);
      border-color: #ff3232;
      box-shadow: 0 0 25px rgba(255, 50, 50, 0.3);
      opacity: 0.7;
    }

     .play-btn {
       padding: 0.875rem 2.5rem;
       font-size: 1.125rem;
       font-weight: 700;
       color: #fff;
       cursor: pointer;
       transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
       letter-spacing: 0.05em;
       z-index: 10;
       border: 1px solid rgba(255, 255, 255, 0.2);
       position: relative;
       overflow: hidden;
       animation: pulseGlow 2s ease-in-out infinite;
     }

     .play-btn:not([disabled]):hover {
       transform: translateY(-2px);
       box-shadow: 
         0 10px 40px rgba(59, 130, 246, 0.4),
         0 0 20px rgba(147, 51, 234, 0.3),
         inset 0 0 20px rgba(255, 255, 255, 0.1);
     }

     .play-btn:not([disabled]):active {
       transform: translateY(0) scale(0.98);
     }

     .play-btn[disabled] {
       opacity: 0.5;
       cursor: not-allowed;
       transform: none;
       animation: none;
     }

     @keyframes pulseGlow {
       0%, 100% {
         box-shadow: 
           0 0 20px rgba(59, 130, 246, 0.3),
           0 0 40px rgba(147, 51, 234, 0.2),
           inset 0 0 10px rgba(255, 255, 255, 0.05);
       }
       50% {
         box-shadow: 
           0 0 30px rgba(59, 130, 246, 0.5),
           0 0 60px rgba(147, 51, 234, 0.3),
           inset 0 0 15px rgba(255, 255, 255, 0.1);
       }
     }

    .banner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 1.5rem 3rem;
      text-align: center;
      z-index: 100;
      animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .banner.banner-win {
      border-color: #00ffcc;
      box-shadow: 0 0 50px rgba(0, 255, 204, 0.4), 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    .banner h2 { margin: 0; font-size: 1.5rem; }

    @keyframes popIn {
      0% { opacity: 0; transform: translate(-50%, -40%) scale(0.8); }
      100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

    ::ng-deep .confetti-particle {
      position: absolute;
      width: 10px;
      height: 10px;
      pointer-events: none;
      z-index: 999;
      animation: fall 2s linear forwards;
    }
    @keyframes fall {
      to { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }

    .hide-nav ::ng-deep bottom-navigation,
    .hide-nav ::ng-deep nav,
    .hide-nav ::ng-deep .bottom-nav {
      display: none !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoxComponent {
  balance = 100;
  boxes: Box[] = [];
  gameState: 'idle' | 'playing' | 'won' | 'lost' = 'idle';

  constructor(private router: Router) {
    this.initBoxes();
  }

  goBack() {
    this.router.navigate(['/main']);
  }

  boxIcon(box: Box): string {
    if (!box.opened) return 'mini-games/box/init.webp';
    if (box.hasPrize) return 'mini-games/box/good.webp';
    return 'mini-games/box/empty.webp';
  }

  initBoxes() {
    this.boxes = Array.from({ length: 9 }, (_, i) => ({
      id: i,
      hasPrize: false,
      opened: false
    }));
  }

  startGame() {
    if (this.balance < 10) return;
    this.balance -= 10;
    this.gameState = 'playing';
    this.initBoxes();
    this.playAudioSynth('start');

    let prizesAssigned = 0;
    while (prizesAssigned < 3) {
      const randomIndex = Math.floor(Math.random() * 9);
      if (!this.boxes[randomIndex].hasPrize) {
        this.boxes[randomIndex].hasPrize = true;
        prizesAssigned++;
      }
    }
  }

  openBox(box: Box) {
    if (this.gameState !== 'playing' || box.opened) return;
    box.opened = true;
    if (box.hasPrize) {
      this.gameState = 'won';
      this.balance += 50;
      this.playAudioSynth('win');
      this.triggerConfetti();
    } else {
      this.gameState = 'lost';
      this.playAudioSynth('lose');
    }
  }

  playAudioSynth(type: 'start' | 'win' | 'lose') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === 'start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'win') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    } else if (type === 'lose') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  }

  triggerConfetti() {
    const colors = ['#00ffcc', '#ff00ff', '#00ff80', '#ffffff'];
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.classList.add('confetti-particle');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100 + 'vw';
      const duration = Math.random() * 1.5 + 1 + 's';
      particle.style.backgroundColor = color;
      particle.style.left = left;
      particle.style.top = '-10px';
      particle.style.animationDuration = duration;
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 3000);
    }
  }
}
