import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';

@Component({
    selector: 'app-product-card-vertical',
    standalone: true,
    imports: [NgOptimizedImage, CommonModule],
  template: `
    @if (product(); as player) {
      <div class="liquid-glass-card group relative flex flex-col overflow-hidden active:scale-[0.98] transition-all duration-300 border border-white/10 hover:border-amber-500/30">
          
          <div class="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 backdrop-blur-md border border-amber-400/20">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-pulse"></span>
              <span class="text-[8px] font-black text-amber-400 uppercase tracking-[0.2em]">VIP</span>
          </div>

          <div class="relative w-full aspect-square flex items-center justify-center p-8">
              <img ngSrc="{{player.imageUrl}}" alt="{{player.name}}"
                  class="relative z-10 w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500"
                  width="130" height="130">
          </div>

          <div class="px-5 pb-5 flex flex-col gap-3">
              <div class="flex flex-col">
                  <span class="text-[8px] font-black text-amber-400/60 uppercase tracking-[0.3em] mb-1">Élite</span>
                  <h3 class="text-[15px] font-black text-white tracking-tight truncate">{{player.name}}</h3>
                  <p class="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] truncate mt-2">{{player.description}}</p>
              </div>

              <button (click)="onBuy()"
                  class="liquid-glass-button !rounded-xl w-full py-3 active:scale-95 text-[9px] font-black uppercase tracking-[0.2em] text-amber-400 border border-amber-400/30">
                  Fichar VIP
              </button>
          </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardVerticalComponent {
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
