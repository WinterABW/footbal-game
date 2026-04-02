import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-action-buttons',
  imports: [RouterLink, NgOptimizedImage],
  template: `
    <nav class="flex justify-between items-center gap-3 px-1 py-1 z-20 relative">
      <div data-tutorial-id="action-openball" routerLink="/main/box"
        class="flex-1 liquid-glass-card py-1.5 px-1 flex flex-col items-center justify-center gap-0 cursor-pointer group active:scale-95 transition-all duration-300 bg-gradient-to-br from-white/[0.05] to-transparent hover:from-white/[0.08] hover:to-white/[0.02] border-fuchsia-500/30 hover:border-fuchsia-400/50 rounded-xl relative overflow-visible accent-fuchsia-double">
        
        <!-- Neon Glow Halo (blurred layer behind the line) -->
        <div class="absolute left-[-4px] top-1/2 -translate-y-1/2 w-[15px] h-[50%] bg-fuchsia-500/30 rounded-full blur-sm group-hover:h-[75%] group-hover:w-[14px] group-hover:bg-fuchsia-400/50 group-hover:blur-md transition-all duration-300 z-[9] pointer-events-none"></div>
        <!-- Neon Line (crisp layer on top) -->
        <div class="absolute left-[-0.7px] top-1/2 -translate-y-1/2 w-[2px] h-[60%] bg-fuchsia-500 rounded-r-md group-hover:h-[85%] group-hover:w-[3px] group-hover:bg-fuchsia-400 transition-all duration-300 overflow-visible z-10 pointer-events-none"></div>

        <img ngSrc="mini-games/openball.webp" alt="Open Ball" class="w-12 h-12 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_0_10px_rgba(217,70,239,0.6)] transition-all duration-300" width="48" height="48">
        <span class="text-[10px] font-black text-white/50 group-hover:text-fuchsia-400 uppercase tracking-widest transition-colors duration-300 mb-0.5 mt-0.5 text-glow-fuchsia">Open Ball</span>
      </div>

      <div data-tutorial-id="action-roulette" routerLink="/main/ruleta"
        class="flex-1 liquid-glass-card py-1.5 px-1 flex flex-col items-center justify-center gap-0 cursor-pointer group active:scale-95 transition-all duration-300 bg-gradient-to-br from-white/[0.05] to-transparent hover:from-white/[0.08] hover:to-white/[0.02] border-yellow-500/30 hover:border-yellow-400/50 rounded-xl relative overflow-visible accent-amber-double">
        
        <!-- Neon Glow Halo (blurred layer behind the line) -->
        <div class="absolute left-[-4px] top-1/2 -translate-y-1/2 w-[15px] h-[50%] bg-yellow-400/30 rounded-full blur-sm group-hover:h-[75%] group-hover:w-[14px] group-hover:bg-yellow-400/50 group-hover:blur-md transition-all duration-300 z-[9] pointer-events-none"></div>
        <!-- Neon Line (crisp layer on top) -->
        <div class="absolute left-[-0.7px] top-1/2 -translate-y-1/2 w-[2px] h-[60%] bg-yellow-400 rounded-r-md group-hover:h-[85%] group-hover:w-[3px] group-hover:bg-yellow-300 transition-all duration-300 overflow-visible z-10 pointer-events-none"></div>

        <img ngSrc="mini-games/roulette.webp" alt="Roulette" class="w-12 h-12 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_0_10px_rgba(250,204,21,0.6)] transition-all duration-300" width="48" height="48">
        <span class="text-[10px] font-black text-white/50 group-hover:text-yellow-400 uppercase tracking-widest transition-colors duration-300 mb-0.5 mt-0.5 text-glow-yellow">Roulette</span>
      </div>

      <div data-tutorial-id="action-copspin" routerLink="/main/ticket"
        class="flex-1 liquid-glass-card py-1.5 px-1 flex flex-col items-center justify-center gap-0 cursor-pointer group active:scale-95 transition-all duration-300 bg-gradient-to-br from-white/[0.05] to-transparent hover:from-white/[0.08] hover:to-white/[0.02] border-cyan-500/30 hover:border-cyan-400/50 rounded-xl relative overflow-visible accent-cyan-double">
        
        <!-- Neon Glow Halo (blurred layer behind the line) -->
        <div class="absolute left-[-4px] top-1/2 -translate-y-1/2 w-[15px] h-[50%] bg-cyan-400/30 rounded-full blur-sm group-hover:h-[75%] group-hover:w-[14px] group-hover:bg-cyan-400/50 group-hover:blur-md transition-all duration-300 z-[9] pointer-events-none"></div>
        <!-- Neon Line (crisp layer on top) -->
        <div class="absolute left-[-0.7px] top-1/2 -translate-y-1/2 w-[2px] h-[60%] bg-cyan-400 rounded-r-md group-hover:h-[85%] group-hover:w-[3px] group-hover:bg-cyan-300 transition-all duration-300 overflow-visible z-10 pointer-events-none"></div>

        <img ngSrc="mini-games/copspin.webp" alt="COP Spin" class="w-12 h-12 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] transition-all duration-300" width="48" height="48">
        <span class="text-[10px] font-black text-white/50 group-hover:text-cyan-400 uppercase tracking-widest transition-colors duration-300 mb-0.5 mt-0.5 text-glow-cyan">COP Spin</span>
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
