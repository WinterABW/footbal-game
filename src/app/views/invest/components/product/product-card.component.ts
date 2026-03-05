import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [NgOptimizedImage, CommonModule],
  template: `
    @if (product(); as player) {
      <article class="lg-module-card p-3 flex flex-col gap-2 border border-white/10 hover:border-teal-500/30 active:scale-[0.98] transition-all duration-300 cursor-pointer bg-white/5 backdrop-blur-2xl rounded-2xl">
        
        <!-- Imagen del jugador -->
        <div class="relative w-full aspect-square rounded-xl overflow-hidden bg-white/5">
          <img [ngSrc]="player.imageUrl" [alt]="player.name"
               class="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-110"
               width="120" height="120">
        </div>

        <!-- Info del jugador -->
        <div class="flex flex-col gap-1">
          <span class="text-[7px] font-bold text-teal-400/60 uppercase tracking-widest">Candidato</span>
          <h3 class="text-[10px] font-black text-white tracking-tight truncate">{{ player.name }}</h3>
          
          <!-- Earnings -->
          <div class="flex items-center gap-1 mt-0.5">
            <div class="w-3.5 h-3.5 rounded-full bg-amber-500/20 flex items-center justify-center">
              <img ngSrc="balance-coin/coin.png" alt="coin" width="8" height="8" class="object-contain">
            </div>
            <span class="text-[8px] font-bold text-white/80">+{{ player.earning || 0 }}</span>
            <span class="text-[6px] text-white/40 font-medium">/hora</span>
          </div>
        </div>

        <!-- Botón -->
        <button (click)="onBuy($event)" 
                class="w-full py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-[8px] font-black text-teal-400 uppercase tracking-wider active:scale-95 transition-all">
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