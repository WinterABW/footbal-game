import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { UserStatusService } from '../../../core/services/user-status.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { GameService } from '../../../core/services/game.service';
import { TicketHeaderComponent } from '../ticket-header/ticket-header.component';

interface BallBox {
  id: number;
  hasPrize: boolean;
  prizeValue: number;
  opened: boolean;
}

@Component({
  selector: 'app-box',
  imports: [NgOptimizedImage, TicketHeaderComponent],
  template: `
    <div class="game-wrapper hide-nav">
      <app-ticket-header
        [accentColor]="'yellow'"
        (backClick)="goBack()"
      />

      <div class="grid-container !gap-4 !mb-6">
        @for (box of boxes(); track box.id) {
          <div class="box glass !w-24 !h-24"
               [class.active]="gameState === 'playing' && !box.opened"
               [class.opened]="box.opened"
               [class.winner]="box.opened && box.hasPrize"
               [class.loser]="box.opened && !box.hasPrize"
               (click)="openBox(box)">
            <div class="content">
              <img [ngSrc]="boxIcon(box)" [alt]="'Balón ' + (box.opened ? (box.hasPrize ? box.prizeValue + ' COP' : 'vacío') : 'sin abrir')" width="96" height="96" class="icon-img">
            </div>
          </div>
        }
      </div>

       <button class="play-btn glass !px-6 !py-3 !text-base bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 border border-white/20 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                (click)="startGame()" [disabled]="gameState === 'playing' || balance() === 0">
          {{ balance() === 0 ? 'Sin tickets' : (gameState === 'idle' ? 'JUGAR' : '⚽ TOCA UN BALÓN ⚽') }}
        </button>
    </div>
  `,
  styleUrls: ['./box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoxComponent {
  private userStatusService = inject(UserStatusService);
  private errorHandler = inject(ErrorHandlerService);
  private gameService = inject(GameService);
  
  // Balance inicial desde wallet, mutable durante el juego
  balance = signal(0);
  boxes = signal<BallBox[]>([]);
  gameState: 'idle' | 'playing' | 'won' | 'lost' = 'idle';
  prizeWon = signal(0);

  private readonly router = inject(Router);

  constructor() {
    // Sincronizar balance inicial desde wallet
    const walletBalance = this.userStatusService.wallet()?.ticketBalance ?? 0;
    this.balance.set(walletBalance);
    this.initBoxes();
  }

  goBack() {
    this.router.navigate(['/main']);
  }

  boxIcon(box: BallBox): string {
    if (!box.opened) return 'mini-games/box/init.webp';
    if (box.hasPrize) return 'mini-games/box/good.webp';
    return 'mini-games/box/empty.webp';
  }

  initBoxes() {
    this.boxes.set(Array.from({ length: 9 }, (_, i) => ({
      id: i,
      hasPrize: false,
      prizeValue: 0,
      opened: false
    })));
  }

  startGame() {
    if (this.gameState === 'playing') return;
    
    // Verificar que hay tickets disponibles primero
    const currentTickets = this.userStatusService.wallet()?.ticketBalance ?? 0;
    if (currentTickets <= 0) {
      this.errorHandler.showErrorToast('No tienes tickets disponibles');
      return;
    }

    // Deduct ticket proactively before starting
    this.gameService.deductTicket().then(result => {
      if (!result.success) {
        this.errorHandler.showErrorToast(result.error || 'No se pudo usar el ticket');
        return;
      }
      
      // Ticket deducted successfully, now start the game
      this.gameState = 'playing';
      this.prizeWon.set(0);
      this.playAudioSynth('start');

      // 3 premios fijos: 20, 50, 80 COP
      const prizes = [20, 50, 80];
      const shuffled = prizes.sort(() => Math.random() - 0.5);
      const newBoxes = Array.from({ length: 9 }, (_, i) => ({
        id: i,
        hasPrize: false,
        prizeValue: 0,
        opened: false
      }));

      let prizeIndex = 0;
      while (prizeIndex < 3) {
        const randomIndex = Math.floor(Math.random() * 9);
        if (!newBoxes[randomIndex].hasPrize) {
          newBoxes[randomIndex].hasPrize = true;
          newBoxes[randomIndex].prizeValue = shuffled[prizeIndex];
          prizeIndex++;
        }
      }

      this.boxes.set(newBoxes);
    });
  }

  openBox(box: BallBox) {
    if (this.gameState !== 'playing' || box.opened) return;
    this.boxes.update(boxes =>
      boxes.map(b =>
        b.id === box.id ? { ...b, opened: true } : b
      )
    );
    if (box.hasPrize) {
      this.gameState = 'won';
      this.prizeWon.set(box.prizeValue);
      
      // Llamar al backend para registrar la ganancia (ticket ya fue deducido en startGame)
      this.gameService.casinoPlay(box.prizeValue, 1).then(result => {
        if (result.success) {
          // Solo actualizar balance después de confirmación del backend
          this.balance.update(v => v + box.prizeValue);
        } else {
          this.errorHandler.showErrorToast(result.error || 'Error al registrar premio');
        }
      });
      
      this.playAudioSynth('win');
      
      this.errorHandler.showSuccessToast(`¡GANASTE ${box.prizeValue} COP!`);
    } else {
      this.gameState = 'lost';
      this.playAudioSynth('lose');

      // Registrar caja vacía en el backend
      this.gameService.casinoPlay(0, 1).then(result => {
        if (!result.success) {
          this.errorHandler.showErrorToast(result.error || 'Error al registrar jugada');
        }
      });

      this.errorHandler.showToast('¡Balón vacío! Perdiste', 'error');
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

  
}
