import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Prize {
  id: number;
  year: string;
  name: string;
  color: string; // Color base para el cristal
  icon: string;
}

@Component({
  selector: 'app-ruleta-futbol-elite',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="elite-stadium-container">
      <div class="stadium-floor"></div>
      <div class="stadium-lights"></div>

      <div class="main-stage">
        <div class="pointer-3d" [class.bump]="isBumping">
          <div class="pointer-crystal"></div>
          <div class="pointer-glow"></div>
        </div>

        <div class="reactor-shell">
          <div class="light-ring" [style.animation-duration]="isSpinning ? '0.5s' : '4s'"></div>
          
          <div class="wheel-3d-container" [style.transform]="wheelTransform">
            @for (prize of prizes; track prize.id) {
              <div class="segment-3d" 
                   [style.--i]="$index"
                   [style.--base-color]="prize.color">
                
                <div class="face front">
                  <div class="segment-content">
                    <span class="year-label">{{ prize.year }}</span>
                    <div class="ball-icon">{{ prize.icon }}</div>
                    <span class="ball-name">{{ prize.name }}</span>
                  </div>
                  <div class="liquid-shimmer"></div>
                </div>
                
                <div class="face side-a"></div>
                <div class="face side-b"></div>
                <div class="face top"></div>
              </div>
            }
          </div>
        </div>

        <button (click)="spin()" [disabled]="isSpinning" class="core-btn">
          <div class="core-glass">
            <div class="core-eye"></div>
            <span class="core-text">{{ isSpinning ? '...' : 'GIRAR' }}</span>
          </div>
          <div class="core-pulse"></div>
        </button>
      </div>

      @if (showWinModal) {
        <div class="win-screen-overlay" (click)="closeModal()">
          <canvas #victoryCanvas class="victory-particles"></canvas>
          
          <div class="win-card-elite shadow-glass" (click)="$event.stopPropagation()">
            <div class="win-header">
              <div class="trophy-3d">🏆</div>
              <span class="win-tag">NUEVO BALÓN HISTÓRICO</span>
            </div>
            
            <div class="win-body">
              <h2 class="win-prize-year">{{ selectedPrize?.year }}</h2>
              <p class="win-prize-name">{{ selectedPrize?.name }}</p>
            </div>
            
            <button class="win-close-btn" (click)="closeModal()">
              <span>CONFIRMAR ACEPTO</span>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* =========================================
       Variables de Diseño iOS 26 "Liquid Glass v2"
       ========================================= */
    :host {
      --bg-dark: #000201;
      --glass-ultra: rgba(255, 255, 255, 0.05);
      --glass-border: rgba(255, 255, 255, 0.2);
      --neon-green: #39FF14;
      --gold-elite: #FFD700;
      --deep-blue: #0A192F;
      --text-main: #FFFFFF;
      --segment-width: 130px; /* Ancho de cada 'bloque' de premio */
    }

    /* =========================================
       Entorno Estadio / Fondo
       ========================================= */
    .elite-stadium-container {
      position: relative; width: 100%; height: 100vh;
      background: var(--bg-dark); display: flex; align-items: center;
      justify-content: center; overflow: hidden; font-family: 'SF Pro Display', system-ui, sans-serif;
    }

    .stadium-floor {
      position: absolute; bottom: 0; width: 200%; height: 50%;
      background: 
        radial-gradient(ellipse at center, rgba(10, 25, 47, 0.5) 0%, var(--bg-dark) 70%),
        repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(57, 255, 20, 0.03) 21px);
      transform: rotateX(60deg) translateY(100px);
      filter: blur(2px); opacity: 0.6;
    }

    .stadium-lights {
      position: absolute; width: 150%; height: 150%;
      background: radial-gradient(circle at 50% 10%, rgba(57, 255, 20, 0.1) 0%, transparent 50%);
      pointer-events: none;
    }

    /* =========================================
       Escenario Principal y Reactor 3D
       ========================================= */
    .main-stage {
      position: relative; width: 400px; height: 400px;
      display: flex; align-items: center; justify-content: center;
      perspective: 2000px; /* Profundidad de escena crucial */
    }

    .reactor-shell {
      position: relative; width: 100%; height: 100%;
      border-radius: 50%; padding: 15px;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(30px);
      border: 1px solid var(--glass-border);
      box-shadow: 
        0 50px 100px rgba(0,0,0,0.8),
        inset 0 0 40px rgba(255,255,255,0.02);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }

    .light-ring {
      position: absolute; inset: 0; border-radius: 50%;
      background: conic-gradient(from 0deg, transparent, rgba(57, 255, 20, 0.2), transparent 30%);
      animation: lightRotate 4s linear infinite;
      pointer-events: none; filter: blur(5px);
    }

    @keyframes lightRotate { to { transform: rotate(360deg); } }

    /* =========================================
       EL REACTOR (Ruleta con Profundidad Cuboidal)
       ========================================= */
    .wheel-3d-container {
      position: relative; width: 100%; height: 100%;
      border-radius: 50%;
      transition: transform 5s cubic-bezier(0.1, 0, 0.1, 1);
      transform-style: preserve-3d; /* Activa 3D real para los hijos */
    }

    .segment-3d {
      position: absolute;
      width: var(--segment-width);
      height: 180px; /* Radio de la ruleta */
      left: calc(50% - var(--segment-width) / 2);
      top: 50%;
      transform-origin: center top;
      transform: rotateY(calc(var(--i) * 45deg)) translateZ(10px); /* 3D Real: separación */
      transform-style: preserve-3d;
    }

    .face {
      position: absolute;
      backface-visibility: hidden;
      border: 1px solid rgba(255,255,255,0.1);
    }

    /* Cara Frontal: Cristal Líquido */
    .face.front {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, var(--glass-ultra), rgba(255,255,255,0.01));
      backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      clip-path: polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%); /* Forma trapezoide */
      overflow: hidden;
    }

    /* Caras Laterales para Profundidad (Efecto Bloque) */
    .face.side-a, .face.side-b {
      width: 20px; height: 100%; /* Grosor del segmento */
      background: var(--base-color); opacity: 0.3;
      filter: blur(1px);
    }
    .face.side-a { transform: rotateY(-90deg) translateX(-10px); left: 0; transform-origin: left; }
    .face.side-b { transform: rotateY(90deg) translateX(10px); right: 0; transform-origin: right; }
    
    .face.top {
      width: 100%; height: 20px;
      background: rgba(255,255,255,0.1);
      top: 0; transform: rotateX(-90deg) translateY(-10px); transform-origin: top;
    }

    /* Contenido del Segmento */
    .segment-content {
      color: white; text-align: center;
      display: flex; flex-direction: column; align-items: center;
      transform: translateY(-10px); /* Ajuste visual */
    }

    .year-label { font-weight: 900; font-size: 20px; letter-spacing: -1px; text-shadow: 0 0 10px rgba(255,255,255,0.5); }
    .ball-icon { font-size: 28px; margin: 5px 0; filter: drop-shadow(0 0 15px rgba(255,255,255,0.6)); }
    .ball-name { font-size: 9px; opacity: 0.7; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;}

    .liquid-shimmer {
      position: absolute; inset: 0;
      background: linear-gradient(-45deg, transparent, rgba(255,255,255,0.1), transparent);
      animation: shimmer 3s infinite;
    }
    @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

    /* =========================================
       Botón Central (El Núcleo)
       ========================================= */
    .core-btn {
      position: absolute; width: 110px; height: 110px;
      border-radius: 50%; border: none; background: transparent;
      cursor: pointer; z-index: 60; transition: transform 0.2s;
    }

    .core-glass {
      width: 100%; height: 100%; border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.3) 100%);
      backdrop-filter: blur(25px);
      border: 1.5px solid rgba(255,255,255,0.4);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      box-shadow: 0 15px 40px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.1);
      overflow: hidden;
    }

    .core-eye {
      position: absolute; width: 150%; height: 150%;
      background: radial-gradient(circle, var(--neon-green) 0%, transparent 60%);
      opacity: 0.1; animation: eyePulse 2s infinite;
    }
    @keyframes eyePulse { 0%, 100% { opacity: 0.05; } 50% { opacity: 0.2; } }

    .core-text { color: white; font-weight: 900; font-size: 14px; letter-spacing: 1px; z-index: 2; }

    .core-pulse {
      position: absolute; inset: -5px; border-radius: 50%;
      border: 2px solid var(--neon-green); opacity: 0;
      animation: pulseOut 2s infinite; pointer-events: none;
    }
    @keyframes pulseOut { 0% { transform: scale(0.9); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }

    .core-btn:active { transform: scale(0.95); }
    .core-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* =========================================
       Marcador Superior 3D
       ========================================= */
    .pointer-3d {
      position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
      width: 40px; height: 50px; z-index: 70;
      transition: transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform-style: preserve-3d;
    }

    .pointer-crystal {
      width: 100%; height: 100%;
      background: var(--gold-elite);
      clip-path: polygon(50% 100%, 100% 0, 100% 20%, 50% 80%, 0 20%, 0 0);
      filter: drop-shadow(0 0 10px var(--gold-elite));
      transform: rotateX(20deg); /* Inclinación 3D */
    }

    .pointer-glow {
      position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 20px; height: 20px; background: var(--gold-elite);
      filter: blur(15px); opacity: 0.5;
    }

    .pointer-3d.bump { transform: translateX(-50%) rotate(-20deg) scale(1.1); }

    /* =========================================
       Pantalla de Victoria Elite
       ========================================= */
    .win-screen-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.92);
      backdrop-filter: blur(20px); display: flex; align-items: center;
      justify-content: center; z-index: 100;
    }

    .win-card-elite {
      background: rgba(255,255,255,0.04); border: 1.5px solid var(--glass-border);
      padding: 50px 30px; border-radius: 40px; text-align: center; color: white;
      width: 90%; max-width: 380px; position: relative;
      animation: cardEmerge 0.7s cubic-bezier(0.2, 1, 0.3, 1.2);
      box-shadow: 0 0 100px rgba(57, 255, 20, 0.2);
    }

    @keyframes cardEmerge { from { transform: scale(0.6) translateY(100px); opacity: 0; } }

    .trophy-3d { font-size: 70px; filter: drop-shadow(0 0 20px var(--gold-elite)); margin-bottom: 10px; }
    .win-tag { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: var(--neon-green); opacity: 0.8; }
    
    .win-prize-year { font-size: 50px; font-weight: 900; letter-spacing: -2px; margin: 15px 0 5px 0; }
    .win-prize-name { font-size: 18px; font-weight: 500; opacity: 0.8; margin-bottom: 30px; }

    .win-close-btn {
      background: #FFFFFF; color: #000000; padding: 18px 40px;
      border-radius: 20px; font-weight: 900; border: none; width: 100%;
      font-size: 16px; cursor: pointer; transition: background 0.2s;
    }
    .win-close-btn:active { background: #DDDDDD; }

    .victory-particles {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 105;
    }
  `]
})
export class RuletaFutbolEliteComponent implements OnDestroy {
  @ViewChild('victoryCanvas') victoryCanvas!: ElementRef<HTMLCanvasElement>;

  prizes: Prize[] = [
    { id: 1, year: '1998', name: 'Tricolore', color: '#0051BA', icon: '⚽' },
    { id: 2, year: '2002', name: 'Fevernova', color: '#C9A33B', icon: '⚽' },
    { id: 3, year: '2010', name: 'Jabulani', color: '#FFFFFF', icon: '⚽' },
    { id: 4, year: '2014', name: 'Brazuca', color: '#009B3A', icon: '⚽' },
    { id: 5, year: '2018', name: 'Telstar', color: '#464646', icon: '⚽' },
    { id: 6, year: '2022', name: 'Al Rihla', color: '#E70072', icon: '⚽' },
    { id: 7, year: '2026', name: 'WC 2026', color: '#00FFC8', icon: '🏆' },
    { id: 8, year: 'ORO', name: 'Ballon dOr', color: '#FFD700', icon: '⭐' },
  ];

  isSpinning = false;
  isBumping = false;
  wheelTransform = 'rotate(0deg)';
  private currentRotation = 0;
  showWinModal = false;
  selectedPrize: Prize | null = null;
  
  // Motor de Audio de Alta Fidelidad
  private audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Sistema de Partículas
  private particles: any[] = [];
  private animationId: number | null = null;

  spin() {
    if (this.isSpinning) return;

    // Sonido 1: Clic Mecánico y Seco
    this.playTone(180, 0.08, 'square', 0.2, 0.1); 
    this.isSpinning = true;
    this.showWinModal = false;

    // Calcular giro: Mínimo 7 vueltas + aleatorio
    const spins = 7 + Math.random() * 5;
    const extraDegrees = spins * 360;
    this.currentRotation += extraDegrees;
    this.wheelTransform = `rotate(${this.currentRotation}deg)`;

    // Sonido 2: Motor de Tics con Desaceleración y Fricción
    this.animateTicks();

    // Finalizar Giro
    setTimeout(() => {
      this.isSpinning = false;
      this.calculatePrize();
      this.playWinFanfare(); // Sonido 3
      this.showWinModal = true;
      // Pequeño delay para que el Canvas se renderice si se usa @if
      setTimeout(() => this.initVictoryParticles(), 100);
    }, 5100);
  }

  private calculatePrize() {
    const finalAngle = this.currentRotation % 360;
    // Ajuste para el marcador superior (270 grados)
    const adjusted = (360 - finalAngle + 270) % 360;
    const index = Math.floor(adjusted / 45);
    this.selectedPrize = this.prizes[index];
  }

  // =========================================
  // Motor de Audio Sintetizado (Hi-Fi)
  // =========================================
  private playTone(freq: number, duration: number, type: OscillatorType, vol: number, decay: number = 0.01) {
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    
    // Envolvente de Volumen (Attack rápido, Decay controlado)
    gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(decay, this.audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  private animateTicks() {
    let tickCount = 0;
    const maxTicks = 45; // Número de tics audibles
    
    const playTick = () => {
      if (!this.isSpinning || tickCount > maxTicks) return;
      
      // Sonido de 'Tic' metálico agudo
      this.playTone(800 - (tickCount * 12), 0.03, 'triangle', 0.1);
      
      // Feedback visual en el puntero (Física)
      this.isBumping = true;
      setTimeout(() => this.isBumping = false, 30);

      tickCount++;
      
      // Curva de desaceleración exponencial (simula fricción real)
      const delay = 50 + (Math.pow(tickCount, 1.8) * 8); 
      setTimeout(playTick, delay);
    };
    
    // Iniciar con un pequeño delay tras el clic
    setTimeout(playTick, 50);
  }

  private playWinFanfare() {
    const melody = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.50, d: 0.6 }  // C6 (Gooooool)
    ];
    
    melody.forEach((note, i) => {
      setTimeout(() => this.playTone(note.f, note.d, 'sine', 0.2, 0.05), i * 130);
    });
  }

  // =========================================
  // Motor de Partículas de Victoria (Canvas)
  // =========================================
  private initVictoryParticles() {
    const canvas = this.victoryCanvas?.nativeElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    this.particles = [];
    const colors = ['#39FF14', '#FFD700', '#FFFFFF', '#007AFF'];
    
    for (let i = 0; i < 120; i++) {
      this.particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.8) * 20, // Explosión hacia arriba
        size: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.2,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.01
      });
    }
    
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.renderParticles(ctx, canvas);
  }

  private renderParticles(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    if (!this.showWinModal) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    this.particles.forEach((p, i) => {
      // Física
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      
      // Dibujar
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Eliminar partículas invisibles
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    });
    
    ctx.globalAlpha = 1;
    this.animationId = requestAnimationFrame(() => this.renderParticles(ctx, canvas));
  }

  closeModal() {
    this.showWinModal = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  ngOnDestroy() {
    this.audioCtx.close();
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}
function ChildView(arg0: string): (target: RuletaFutbolEliteComponent, propertyKey: "victoryCanvas") => void {
  throw new Error('Function not implemented.');
}

