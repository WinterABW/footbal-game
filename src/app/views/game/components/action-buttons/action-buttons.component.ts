import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-action-buttons',
  imports: [RouterLink, NgOptimizedImage, CommonModule],
  template: `
    <nav class="flex justify-between items-center gap-3 px-1 py-1 z-20 relative">
      <div routerLink="/mociones"
        class="flex-1 liquid-glass-card py-1 px-1 flex flex-col items-center justify-center gap-0 cursor-pointer group active:scale-95 transition-all bg-white/[0.03] border-white/5 h-auto">
        <img ngSrc="mociones/mociones.png" alt="Misiones" class="w-12 h-12 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 drop-shadow-md transition-all" width="48" height="48">
        <span class="text-[10px] font-black text-white/60 group-hover:text-white uppercase tracking-widest transition-colors mb-0.5">Misiones</span>
      </div>

      <div routerLink="/mining"
        class="flex-1 liquid-glass-card py-1 px-1 flex flex-col items-center justify-center gap-0 cursor-pointer group active:scale-95 transition-all bg-white/[0.03] border-white/5 h-auto">
        <img ngSrc="social/social.png" alt="Jugadores" class="w-12 h-12 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 drop-shadow-md transition-all" width="48" height="48">
        <span class="text-[10px] font-black text-white/60 group-hover:text-white uppercase tracking-widest transition-colors mb-0.5">Jugadores</span>
      </div>

      <div routerLink="/lucky-wheel"
        class="flex-1 liquid-glass-card py-1 px-1 flex flex-col items-center justify-center gap-0 cursor-pointer group active:scale-95 transition-all bg-white/[0.03] border-white/5 h-auto">
        <img ngSrc="icons/lucky.png" alt="Billetera" class="w-12 h-12 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 drop-shadow-md transition-all" width="48" height="48">
        <span class="text-[10px] font-black text-white/60 group-hover:text-white uppercase tracking-widest transition-colors mb-0.5">Lucky Spin</span>
      </div>
    </nav>
  `,
  styles: [`
    :host { display: block; width: 100%; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionButtonsComponent {
}
