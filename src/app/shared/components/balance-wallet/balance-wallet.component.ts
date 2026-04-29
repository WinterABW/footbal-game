import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ProjectedStateService } from '../../../core/services/projected-state.service';

@Component({
  selector: 'app-balance-wallet',
  imports: [NgOptimizedImage],
  template: `
    <section class="flex flex-col gap-2 absolute top-6 left-6 z-10 animate-fade-in">
      
      <!-- COP Balance -->
      <div class="flex items-center gap-2.5 py-1 px-1.5 pr-4 rounded-full liquid-glass-card border-amber-500/30 shadow-lg accent-amber">
          <img ngSrc="shared/balance/coin.webp" alt="COP" width="32" height="32" class="object-contain" />
        <span class="text-[11px] font-black text-white tracking-wide text-glow-amber">{{ formattedCop() }}</span>
      </div>

      <!-- PEN Balance -->
      <div class="flex items-center gap-2.5 py-1 px-1.5 pr-4 rounded-full liquid-glass-card border-emerald-500/30 shadow-lg accent-emerald">
        <img ngSrc="wallet/balnce-wallet.webp" alt="PEN" width="32" height="32" class="object-contain" />
        <span class="text-[11px] font-black text-white tracking-wide text-glow-emerald">{{ formattedPen() }}</span>
      </div>

    </section>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    .text-glow-amber { 
      text-shadow: 0 0 8px rgba(251, 191, 36, 0.4), 0 0 16px rgba(251, 191, 36, 0.2), 0 2px 4px rgba(0,0,0,0.3); 
    }
    .text-glow-cyan { 
      text-shadow: 0 0 8px rgba(6, 182, 212, 0.4), 0 0 16px rgba(6, 182, 212, 0.2), 0 2px 4px rgba(0,0,0,0.3); 
    }
    .text-glow-emerald { 
      text-shadow: 0 0 8px rgba(52, 211, 153, 0.4), 0 0 16px rgba(52, 211, 153, 0.2), 0 2px 4px rgba(0,0,0,0.3); 
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BalanceWalletComponent {
  private projectedState = inject(ProjectedStateService);

  // Same optimistic balance as balance/ component
  protected readonly copBalance = this.projectedState.projectedBalance;
  protected readonly penBalance = computed(() => Math.floor(this.copBalance() / 1030));

  protected readonly formattedCop = computed(() => this.copBalance().toLocaleString('es-CO'));
  protected readonly formattedPen = computed(() => this.penBalance().toLocaleString('es-CO'));
}
