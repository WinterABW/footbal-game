import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-particles-background',
  standalone: true,
  template: `
    <div class="pg-root" aria-hidden="true">

      <!-- iOS 26 organic light-wave orbs -->
      <div class="orb orb-cobalt"></div>
      <div class="orb orb-magenta"></div>
      <div class="orb orb-violet"></div>
      <div class="orb orb-cyan"></div>
      <div class="orb orb-magenta-lo"></div>

      <!-- Dot-grid overlay -->
      <div class="dot-grid"></div>

      <!-- Minimalist floating particles -->
      <div class="particles-layer">
        @for (i of particles; track i) {
          <div
            class="particle"
            [style.--x]="getX(i)"
            [style.--y]="getY(i)"
            [style.--size]="getSize(i) + 'px'"
            [style.--duration]="getDuration(i) + 's'"
            [style.--delay]="getDelay(i) + 's'"
          ></div>
        }
      </div>

    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .pg-root {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }

    /* ─── Organic light orbs ─────────────────────────────────────── */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
      will-change: transform, opacity;
    }

    .orb-cobalt {
      width: 75vw; height: 75vw;
      top: -15%; left: -12%;
      background: radial-gradient(circle, rgba(13,27,110,.75) 0%, transparent 70%);
      animation: orb-drift-a 22s ease-in-out infinite;
    }
    .orb-magenta {
      width: 70vw; height: 70vw;
      bottom: -20%; right: -12%;
      background: radial-gradient(circle, rgba(184,24,110,.65) 0%, transparent 70%);
      animation: orb-drift-b 28s ease-in-out infinite;
    }
    .orb-violet {
      width: 55vw; height: 55vw;
      top: 35%; left: 20%;
      background: radial-gradient(circle, rgba(90,15,155,.45) 0%, transparent 70%);
      animation: orb-drift-c 34s ease-in-out infinite;
    }
    .orb-cyan {
      width: 40vw; height: 40vw;
      top: 10%; right: 5%;
      background: radial-gradient(circle, rgba(0,180,230,.22) 0%, transparent 70%);
      filter: blur(70px);
      animation: orb-drift-d 18s ease-in-out infinite;
    }
    .orb-magenta-lo {
      width: 50vw; height: 50vw;
      top: 55%; left: -5%;
      background: radial-gradient(circle, rgba(220,24,154,.30) 0%, transparent 70%);
      animation: orb-drift-e 26s ease-in-out infinite;
    }

    @keyframes orb-drift-a {
      0%,100% { transform: translate(0, 0) scale(1);       opacity:.85; }
      40%     { transform: translate(6vw, 4vh) scale(1.06); opacity:.70; }
      70%     { transform: translate(-3vw, 8vh) scale(.96); opacity:.95; }
    }
    @keyframes orb-drift-b {
      0%,100% { transform: translate(0, 0) scale(1);         opacity:.75; }
      35%     { transform: translate(-8vw, -5vh) scale(1.08); opacity:.60; }
      65%     { transform: translate(4vw, -9vh) scale(.94);   opacity:.88; }
    }
    @keyframes orb-drift-c {
      0%,100% { transform: translate(0, 0) scale(1);        opacity:.60; }
      50%     { transform: translate(5vw, -7vh) scale(1.1);  opacity:.45; }
    }
    @keyframes orb-drift-d {
      0%,100% { transform: translate(0, 0) scale(1);         opacity:.55; }
      30%     { transform: translate(-4vw, 6vh) scale(1.12);  opacity:.40; }
      70%     { transform: translate(8vw, 2vh) scale(.92);    opacity:.65; }
    }
    @keyframes orb-drift-e {
      0%,100% { transform: translate(0, 0) scale(1);         opacity:.50; }
      45%     { transform: translate(7vw, -5vh) scale(1.07);  opacity:.35; }
    }

    /* ─── Dot-grid ───────────────────────────────────────────────── */
    .dot-grid {
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(circle, rgba(255,255,255,.055) 1px, transparent 1px);
      background-size: 22px 22px;
      opacity: .6;
    }

    /* ─── Particles ──────────────────────────────────────────────── */
    .particles-layer {
      position: absolute;
      inset: 0;
    }

    .particle {
      position: absolute;
      width: var(--size);
      height: var(--size);
      left: var(--x);
      top: 100%;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.20);
      animation: floatUp var(--duration) linear infinite;
      animation-delay: var(--delay);
      will-change: transform, opacity;
    }

    @keyframes floatUp {
      0%   { transform: translateY(0);       opacity: 0; }
      10%  { opacity: .8; }
      90%  { opacity: .8; }
      100% { transform: translateY(-110vh);  opacity: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .particle, .orb { animation: none; opacity: .08; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticlesBackgroundComponent {
  particles = Array.from({ length: 30 }, (_, i) => i);

  getX(seed: number): string {
    return ((seed * 23 + 11) % 100) + '%';
  }

  getY(seed: number): string {
    return ((seed * 17 + 5) % 100) + '%';
  }

  getSize(seed: number): number {
    return 2 + (seed % 4); // Smaller particles (2px to 5px)
  }

  getDuration(seed: number): number {
    return 20 + (seed % 15); // Slower animation (20s to 34s)
  }

  getDelay(seed: number): number {
    return (seed % 15) * 0.8; // Wider delay distribution
  }
}
