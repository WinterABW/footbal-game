import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Box {
  id: number;
  hasPrize: boolean;
  opened: boolean;
}

@Component({
  selector: 'app-game1',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-wrapper">
      <div class="header glass">
        <h1>SALDO: <span>$ {{ balance }}</span></h1>
      </div>

      <div class="grid-container">
        @for (box of boxes; track box.id) {
          <div class="box glass" 
               [class.active]="gameState === 'playing' && !box.opened"
               [class.opened]="box.opened"
               [class.winner]="box.opened && box.hasPrize"
               [class.loser]="box.opened && !box.hasPrize"
               (click)="openBox(box)">
            <div class="content">
              @if (!box.opened) {
                <span class="icon">🎁</span>
              } @else {
                <span class="icon">{{ box.hasPrize ? '💎' : '💨' }}</span>
              }
            </div>
          </div>
        }
      </div>

      <button class="play-btn glass" (click)="startGame()" [disabled]="gameState === 'playing'">
        {{ gameState === 'idle' ? 'JUGAR (Costo: $10)' : 'SELECCIONA UNA CAJA' }}
      </button>

      @if (gameState === 'won' || gameState === 'lost') {
        <div class="banner glass" [class.banner-win]="gameState === 'won'">
          <h2>{{ gameState === 'won' ? '¡GANASTE EL PREMIO!' : '¡CAJA VACÍA! PERDISTE' }}</h2>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Diseño general y Fondo completamente negro */
    :host {
      display: block;
      min-height: 100vh;
      background-color: #000000;
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
      padding: 2rem;
      position: relative;
    }

    /* Efecto Liquidy Glass 3D */
    .glass {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 
        inset 0 0 20px rgba(255, 255, 255, 0.05),
        inset 0 4px 5px rgba(255, 255, 255, 0.2),
        0 10px 30px rgba(0, 0, 0, 0.8);
      border-radius: 24px;
    }

    /* Header de Saldo */
    .header {
      padding: 1rem 3rem;
      margin-bottom: 3rem;
      border-radius: 50px;
    }
    .header h1 {
      margin: 0;
      font-size: 1.5rem;
      letter-spacing: 2px;
      font-weight: 400;
    }
    .header span {
      color: #00ffcc;
      font-weight: 700;
      text-shadow: 0 0 15px rgba(0, 255, 204, 0.6);
    }

    /* Grid de Cajas */
    .grid-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 3rem;
      position: relative;
      z-index: 10;
    }

    /* Cajas Individuales */
    .box {
      width: 100px;
      height: 100px;
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
      transform: translateY(-5px) scale(1.05);
      box-shadow: 
        inset 0 0 20px rgba(255, 255, 255, 0.1),
        0 15px 35px rgba(0, 255, 204, 0.3);
      border-color: rgba(0, 255, 204, 0.4);
    }

    .icon {
      font-size: 3rem;
      filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
    }

    /* Estados de la caja al abrir */
    .box.opened {
      transform: scale(0.95);
      pointer-events: none;
    }
    .box.winner {
      background: rgba(0, 255, 128, 0.15);
      border-color: #00ff80;
      box-shadow: 0 0 30px rgba(0, 255, 128, 0.5), inset 0 0 20px rgba(0, 255, 128, 0.3);
    }
    .box.loser {
      background: rgba(255, 50, 50, 0.1);
      border-color: #ff3232;
      box-shadow: 0 0 30px rgba(255, 50, 50, 0.3);
      opacity: 0.7;
    }

    /* Botón Jugar */
    .play-btn {
      padding: 1rem 4rem;
      font-size: 1.2rem;
      font-weight: bold;
      color: #fff;
      cursor: pointer;
      transition: 0.3s;
      letter-spacing: 2px;
      z-index: 10;
    }
    .play-btn:not([disabled]):hover {
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 0 0 25px rgba(255, 255, 255, 0.4);
    }
    .play-btn[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Cartel de Victoria / Derrota */
    .banner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 2rem 4rem;
      text-align: center;
      z-index: 100;
      animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      background: rgba(20, 20, 20, 0.8);
      border-color: #ff3232;
    }
    .banner.banner-win {
      border-color: #00ffcc;
      box-shadow: 0 0 50px rgba(0, 255, 204, 0.4);
    }
    .banner h2 { margin: 0; font-size: 2rem; }

    @keyframes popIn {
      0% { opacity: 0; transform: translate(-50%, -40%) scale(0.8); }
      100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

    /* Confeti */
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
  `]
})
export class Game1Component {
  balance = 100;
  boxes: Box[] = [];
  gameState: 'idle' | 'playing' | 'won' | 'lost' = 'idle';

  constructor() {
    this.initBoxes();
  }

  initBoxes() {
    this.boxes = Array.from({ length: 9 }, (_, i) => ({
      id: i,
      hasPrize: false,
      opened: false
    }));
  }

  startGame() {
    if (this.balance < 10) return; // Validación simple de saldo
    
    this.balance -= 10;
    this.gameState = 'playing';
    this.initBoxes();
    this.playAudioSynth('start');

    // Seleccionar 3 cajas aleatorias para que tengan premio
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
      this.balance += 50; // Premio
      this.playAudioSynth('win');
      this.triggerConfetti();
    } else {
      this.gameState = 'lost';
      this.playAudioSynth('lose');
    }
  }

  /* * SINTETIZADOR DE AUDIO NATIVO
   * Genera sonidos profesionales directamente con código (sin archivos externos)
   */
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
      // Sonido de "Carga/Inicio" (Digital, rápido)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);

    } else if (type === 'win') {
      // Arpegio de Victoria (Acorde mayor rápido y brillante)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
      osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
      osc.frequency.setValueAtTime(880, now + 0.3); // A5

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      
      osc.start(now);
      osc.stop(now + 0.8);

    } else if (type === 'lose') {
      // Sonido de "Error/Derrota" (Grave y descendente)
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

  /* Generador de Confeti 3D básico en DOM */
  triggerConfetti() {
    const colors = ['#00ffcc', '#ff00ff', '#00ff80', '#ffffff'];
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.classList.add('confetti-particle');
      
      // Propiedades aleatorias
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100 + 'vw';
      const duration = Math.random() * 1.5 + 1 + 's';
      
      particle.style.backgroundColor = color;
      particle.style.left = left;
      particle.style.top = '-10px';
      particle.style.animationDuration = duration;
      
      document.body.appendChild(particle);

      // Limpiar el DOM después de la animación
      setTimeout(() => particle.remove(), 3000);
    }
  }
}
