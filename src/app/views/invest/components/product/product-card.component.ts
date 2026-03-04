import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [NgOptimizedImage, CommonModule],
  template: `
    @if (product(); as player) {
      <article
          class="liquid-glass-card group relative flex flex-col overflow-hidden active:scale-[0.98] transition-all duration-300 border border-white/10 hover:border-teal-500/30">
          
          <div class="relative w-full aspect-[4/3] flex items-center justify-center p-4">
              <img ngSrc="{{player.imageUrl}}" alt="{{player.name}}"
                  class="w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-500"
                  width="140" height="140">
          </div>

          <div class="px-4 pb-4 flex flex-col gap-2">
              <div class="flex flex-col">
                  <span class="text-[8px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Candidato</span>
                  <h3 class="text-[13px] font-black text-white tracking-tight truncate">
                      {{player.name}}
                  </h3>
              </div>

              <div class="flex items-center justify-between">
                  <div class="flex flex-col">
                      <span class="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Earnings</span>
                      <span class="flex items-center gap-1.5">
                          <img ngSrc="balance-coin/coin.png" alt="coin" width="12" height="12" class="opacity-60">
                          <p class="text-[10px] font-black text-white tracking-wide">
                            +{{player.earning || 0}}<span class="text-[8px] text-white/40 font-black ml-0.5">/H</span>
                          </p>
                      </span>
                  </div>

                  <button (click)="onBuy(); $event.stopPropagation()" type="button"
                      class="liquid-glass-button !rounded-xl px-4 py-2 text-[8px] font-black text-white uppercase tracking-[0.2em] active:scale-90">
                      Fichar
                  </button>
              </div>
          </div>
      </article>
    }
  `,
  styles: [`
    :host { display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  modalOpened = output<any>();
  buy = output<any>();
  product = input<any>();

  openModal() {
    this.modalOpened.emit(this.product());
  }

  onBuy() {
    this.buy.emit(this.product());
  }
}
