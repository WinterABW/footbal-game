import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage, DecimalPipe } from '@angular/common';
import { TapService } from '../../../core/services/tap.service';

@Component({
  selector: 'app-balance',
  imports: [NgOptimizedImage, DecimalPipe],
  template: `
    <section data-tutorial-id="balance" class="flex flex-row justify-center items-center z-20 relative px-6 py-3 mx-auto w-fit active:scale-95 transition-all cursor-pointer">
      <div class="relative w-12 h-12 mr-1 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
         <img ngSrc="shared/balance/coin.webp" alt="coin" class="w-full h-full object-contain" width="48" height="48">
      </div>
      <p class="text-4xl font-black text-white tracking-tighter text-glow-amber">
        {{ coins() | number:'1.0-0' }}
      </p>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .text-glow-amber { text-shadow: 0 0 30px rgba(251, 191, 36, 0.6); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BalanceComponent {
  private tapSvc = inject(TapService);
  protected readonly coins = this.tapSvc.coins;
}
