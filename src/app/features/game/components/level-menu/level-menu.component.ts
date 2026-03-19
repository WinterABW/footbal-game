import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GlassModalComponent } from '../../../../shared/ui';

@Component({
  selector: 'app-level-menu',
  imports: [RouterLink, DecimalPipe, GlassModalComponent],
  template: `
    <app-glass-modal [isOpen]="isOpen()" [compact]="true" (closed)="onClose()">
      <div class="flex flex-col gap-4">
        <!-- Compact Header -->
        <div class="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
           <div class="flex items-center gap-2">
               <div class="relative">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center relative z-10 shadow-2xl border border-amber-500/30 accent-amber">
                  <span class="text-xl font-black text-white text-glow-amber">{{ levelInfo().level }}</span>
                </div>
                <div class="absolute -inset-2 bg-amber-500/20 rounded-3xl blur-xl animate-pulse"></div>
               </div>
              <div class="flex flex-col">
                <span class="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em] mb-0.5">Rango Actual</span>
                <h3 class="text-lg font-black text-white uppercase tracking-tight">Nivel {{ levelInfo().level }}</h3>
              </div>
           </div>
           <button
             class="lg-icon-btn w-7 h-7 text-white/40 hover:text-white transition-colors"
             (click)="onClose()"
             type="button"
             aria-label="Cerrar">
             <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
           </button>
        </div>

        <main class="space-y-3">
          <!-- Stats Grid -->
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="liquid-glass-card p-3.5 bg-white/[0.03] border-white/5">
              <span class="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">Total Taps</span>
              <span class="text-lg font-black text-white tracking-tight">{{ levelInfo().currentTaps | number }}</span>
            </div>
            <div class="liquid-glass-card p-3.5 bg-white/[0.03] border-white/5">
              <span class="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">Meta Siguiente</span>
              <span class="text-lg font-black text-white tracking-tight">{{ levelInfo().tapsForNextLevel | number }}</span>
            </div>
          </div>

          <!-- Progress Card -->
          @if (!levelInfo().isMaxLevel) {
            <div class="liquid-glass-card p-4 bg-white/[0.02] border-indigo-500/30 flex flex-col gap-3 accent-violet">
               <div class="flex justify-between items-center">
                  <span class="text-[10px] font-black text-white/40 uppercase tracking-widest">Progreso de Carrera</span>
                  <span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-glow-violet">{{ ((levelInfo().currentTaps / levelInfo().tapsForNextLevel) * 100) | number:'1.0-0' }}%</span>
               </div>
               <div class="relative h-2 bg-white/5 rounded-full overflow-hidden">
                  <div class="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000" [style.width.%]="(levelInfo().currentTaps / levelInfo().tapsForNextLevel) * 100"></div>
               </div>
               <p class="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] text-center italic">Faltan {{ (levelInfo().tapsForNextLevel - levelInfo().currentTaps) | number }} toques para ascender</p>
            </div>
          } @else {
            <div class="liquid-glass-card p-8 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 text-center flex flex-col items-center gap-3">
               <div class="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 animate-bounce">
                  <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
               </div>
               <h4 class="text-lg font-black text-white uppercase tracking-tight">Rango Máximo Alcanzado</h4>
               <p class="text-[9px] font-black text-amber-500 uppercase tracking-widest">Eres Leyenda</p>
            </div>
          }
        </main>

        @if (!isAuthenticated()) {
          <footer class="mt-3 pt-3 border-t border-white/5 w-full flex flex-col gap-4">
            <div class="p-4 liquid-glass-card bg-amber-500/5 border-amber-500/10 text-center">
               <p class="text-[9px] font-black text-amber-500 uppercase tracking-widest">Sesión de Invitado: Progreso Local No Sincronizado</p>
            </div>
            <a routerLink="/welcome" (click)="onClose()" class="liquid-glass-button w-full py-2.5 text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3">
               <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
               Sincronizar Rango
            </a>
          </footer>
        }
      </div>
    </app-glass-modal>
  `,
  styles: [`:host { display: contents; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelMenuComponent {
  isOpen = input.required<boolean>();
  levelInfo = input.required<any>();
  isAuthenticated = input.required<boolean>();
  username = input.required<string>();

  close = output<void>();

  onClose() { this.close.emit(); }
}
