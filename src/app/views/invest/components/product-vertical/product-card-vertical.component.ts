import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-card-vertical',
  standalone: true,
  imports: [NgOptimizedImage, CommonModule],
  template: `
    @if (product(); as player) {
      <article class="group liquid-glass-card rounded-3xl p-3 flex flex-col gap-3 border border-white/10 hover:border-amber-500/40 active:scale-[0.98] transition-all duration-300 cursor-pointer">
        
        <!-- Badge VIP -->
        <div class="absolute top-3 right-3 z-10">
          <span class="px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-[7px] font-bold text-amber-400 uppercase tracking-wider">
            VIP
          </span>
        </div>

        <!-- Imagen del jugador -->
        <div class="relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-amber-500/10 to-transparent">
          <img [ngSrc]="player.imageUrl" [alt]="player.name"
               class="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
               width="120" height="120">
        </div>

        <!-- Info del jugador -->
        <div class="flex flex-col gap-1">
          <span class="text-[7px] font-bold text-amber-400/60 uppercase tracking-widest">Élite</span>
          <h3 class="text-[12px] font-black text-white tracking-tight truncate">{{ player.name }}</h3>
          
          <!-- Earnings -->
          <div class="flex items-center gap-1.5 mt-1">
            <div class="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
              <img ngSrc="balance-coin/coin.png" alt="coin" width="10" height="10" class="object-contain">
            </div>
            <span class="text-[10px] font-bold text-white/80">+{{ player.earning || 0 }}</span>
            <span class="text-[8px] text-white/40 font-medium">/hora</span>
          </div>
        </div>

        <!-- Botón -->
        <button (click)="onBuy($event)" 
                class="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-[9px] font-bold text-amber-400 uppercase tracking-wider active:scale-95 transition-all">
          Fichar VIP
        </button>
      </article>
    }
  `,
  styles: [`
    :host { display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardVerticalComponent {
  buy = output<any>();
  product = input<any>();

  onBuy(event: Event) {
    event.stopPropagation();
    this.buy.emit(this.product());
  }
}
