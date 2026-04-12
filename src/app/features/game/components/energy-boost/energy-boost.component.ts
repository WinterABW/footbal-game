import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { EnergyService } from '../../../../core/services/energy.service';

@Component({
  selector: 'app-energy-boost',
  imports: [NgOptimizedImage, DecimalPipe],
  template: `
    <section class="flex flex-row items-center justify-between w-full z-20 relative p-1 mt-2 px-2">

      <!-- Energy bar -->
      <article data-tutorial-id="energy-bar" class="frost-glass-pill flex items-center justify-center gap-2 p-1 pr-3 min-h-[56px] min-w-[130px] border-emerald-500/30 accent-emerald">
        <div class="glow-bubble shrink-0">
          <!-- inner specular highlight -->
          <div class="inner-hi glow pointer-events-none"></div>
          <img ngSrc="game/energy/thunder.webp" alt="Energía" fill class="w-[60px] h-[60px] object-contain relative z-10 brightness-110 drop-shadow-md" />
        </div>
        <div class="flex flex-col min-w-0 pb-0.5">
          <span class="text-[9px] font-bold text-white/50 capitalize tracking-wide leading-none mb-1">Energía</span>
          <p class="text-[14px] font-black text-white tracking-wide leading-none text-glow-emerald">
            {{ energy() | number:'1.0-0' }}<span class="text-[10px] text-white/40 font-semibold ml-0.5">/ {{ maxEnergy() | number:'1.0-0' }}</span>
          </p>
        </div>
      </article>

      <!-- Boost button -->
      <button data-tutorial-id="boost-btn" type="button" (click)="goToBoost()"
        class="frost-glass-pill boost-btn shrink-0 flex items-center justify-center gap-2 p-1 pr-3 outline-none min-h-[56px] min-w-[130px] border-yellow-500/30 accent-amber"
        aria-label="Ir a impulsos">
        <div class="glow-bubble">
          <!-- inner specular highlight -->
          <div class="inner-hi glow pointer-events-none"></div>
          <img ngSrc="game/energy/rocket.png" alt="" class="w-[34px] h-[34px] object-contain relative z-10 brightness-110 drop-shadow-md" width="64" height="64" />
        </div>
        <span class="text-[14px] font-black text-white tracking-wide leading-none pt-1 text-glow-yellow">Boost</span>
      </button>

    </section>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    /* ── Outer pill container (Transparent frosted glass) ── */
    .frost-glass-pill {
      background: rgba(255, 255, 255, 0.08); /* Fondo casi transparente */
      backdrop-filter: blur(48px) saturate(180%);
      -webkit-backdrop-filter: blur(48px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.15); /* Borde sutil blanquecino */
      border-radius: 100px;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.25), /* Sombra exterior suave */
        inset 0 1px 1px rgba(255, 255, 255, 0.2); /* Brillo especular superior */
      transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    }

    /* ── Inner Active Indicator / Glow Bubble ────────────── */
    .glow-bubble {
      position: relative;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      overflow: hidden;
      
      /* Degradado vibrante para hacer que el icono resalte (similar al botón "Focus") */
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.05) 100%);
      border: 1px solid rgba(255, 255, 255, 0.3);
      
      box-shadow: 
        0 4px 16px rgba(255, 255, 255, 0.15),
        inset 0 1px 1px rgba(255, 255, 255, 0.4);
    }
    
    .small-bubble {
      width: 38px;
      height: 38px;
    }

    .inner-hi.glow {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.3) 0%,
        transparent 50%
      );
      border-radius: inherit;
    }

    /* ── Boost button interactions ───────────────────────── */
    .boost-btn {
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    
    .boost-btn:active {
      transform: scale(0.95);
      background: rgba(255, 255, 255, 0.15); /* Más opaco al presionar */
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnergyBoostComponent {
  private energySvc = inject(EnergyService);
  private router = inject(Router);
  energy = this.energySvc.energy;
  maxEnergy = this.energySvc.maxEnergy;

  goToBoost() { this.router.navigate(['/main/boost']); }
}
