import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [NgOptimizedImage, CommonModule],
  template: `
    @if (product(); as player) {
      <article class="group liquid-glass-card rounded-3xl p-3 flex flex-col gap-3 border border-white/10 hover:border-teal-500/30 active:scale-[0.98] transition-all duration-300 cursor-pointer">
        
        <!-- Imagen del jugador -->
        <div class="relative w-full aspect-square rounded-2xl overflow-hidden bg-white/5">
          <img [ngSrc]="player.imageUrl" [alt]="player.name"
               class="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
               width="120" height="120">
        </div>

        <!-- Info del jugador -->
        <div class="flex flex-col gap-1">
          <span class="text-[7px] font-bold text-teal-400/60 uppercase tracking-widest">Candidato</span>
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
                class="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-[9px] font-black text-white uppercase tracking-wider active:scale-95 transition-all">
          Fichar
        </button>
      </article>
    }
  `,
  styles: [`
    :host { display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  buy = output<any>();
  product = input<any>();

  onBuy(event: Event) {
    event.stopPropagation();
    this.buy.emit(this.product());
  }
}
