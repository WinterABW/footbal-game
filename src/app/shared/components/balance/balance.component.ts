import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage, DecimalPipe } from '@angular/common';
import { TapService } from '../../../core/services/tap.service';

@Component({
  selector: 'app-balance',
  imports: [NgOptimizedImage, DecimalPipe],
  template: `
    <section class="flex flex-row justify-center items-center z-20 relative px-6 py-3 liquid-glass-card bg-amber-500/[0.03] border-amber-500/10 rounded-full shadow-[0_20px_60px_rgba(251,191,36,0.1)] mx-auto w-fit active:scale-95 transition-all cursor-pointer">
      <div class="relative w-10 h-10 mr-3 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]">
         <img ngSrc="shared/balance/coin.webp" alt="coin" class="w-full h-full object-contain animate-float" width="48" height="48">
      </div>
      <p class="text-4xl font-black text-white tracking-tighter text-glow-amber">
        {{ coins() | number }}
      </p>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .text-glow-amber { text-shadow: 0 0 30px rgba(251, 191, 36, 0.6); }
    .animate-float { animation: float 4s ease-in-out infinite; }
    @keyframes float { 0%, 100% { transform: translateY(0) scale(1.05); } 50% { transform: translateY(-8px) scale(1); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BalanceComponent {
  private tapSvc = inject(TapService);
  protected readonly coins = this.tapSvc.coins;
}
