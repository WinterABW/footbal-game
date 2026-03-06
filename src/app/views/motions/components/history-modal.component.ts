import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';

interface Mission {
  id: string; title: string; description: string; reward: number; currency: string; icon: string; completed: boolean;
}

@Component({
  selector: 'app-history-modal',
  standalone: true,
  imports: [NgOptimizedImage, CommonModule],
  template: `
    @if (isOpen()) {
      <div class="lg-modal-backdrop px-5" (click)="onClose()">
        <div class="lg-card-panel w-full max-w-[360px] animate-fade-in p-6 flex flex-col gap-6 relative max-h-[85vh] overflow-hidden" (click)="$event.stopPropagation()">
          <!-- Tempered Glass Reflection Layer -->
          <div class="absolute inset-0 pointer-events-none glass-glare opacity-20 z-0 rounded-[2.5rem]"></div>
          
          <!-- Header Section -->
          <header class="flex items-center justify-between z-10 relative">
            <div class="flex flex-col">
              <h2 class="text-xl font-black text-white tracking-tight uppercase">Historial</h2>
            </div>
            <button (click)="onClose()" class="lg-icon-btn w-10 h-10 active:scale-90 transition-transform">
              <svg class="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </header>

          <!-- Tabs: Minimalist selector with sliding indicator -->
          <nav class="relative flex lg-tab-bar p-1.5 z-10 border-white/5 bg-white/[0.02] backdrop-blur-3xl">
            <!-- Glass Sliding Indicator -->
            <div class="absolute inset-1.5 z-0 pointer-events-none w-[calc(50%-6px)] h-[calc(100%-12px)]">
              <div class="h-full bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-500 cubic-bezier(0.2, 1, 0.3, 1)"
                [style.transform]="'translateX(' + (historyModalTab() === 'Failed' ? '106%' : '0%') + ')'">
                <div class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 rounded-xl"></div>
              </div>
            </div>

            <button (click)="setHistoryTab('Completed')"
              class="flex-1 py-2 text-[10px] uppercase font-bold tracking-[0.15em] transition-all rounded-xl relative z-10"
              [class.text-white]="historyModalTab() === 'Completed'"
              [class.text-white/40]="historyModalTab() !== 'Completed'">
              Éxitos
            </button>
            <button (click)="setHistoryTab('Failed')"
              class="flex-1 py-2 text-[10px] uppercase font-bold tracking-[0.15em] transition-all rounded-xl relative z-10"
              [class.text-white]="historyModalTab() === 'Failed'"
              [class.text-white/40]="historyModalTab() !== 'Failed'">
              Fallidos
            </button>
          </nav>

          <!-- Content List -->
          <div class="flex-1 overflow-y-auto no-scrollbar space-y-3 z-10 relative py-1 min-h-[300px]">
            @if (historyModalTab() === 'Completed') {
                @if (completedMissions().length > 0) {
                  @for (mission of completedMissions(); track mission.id) {
                    <div class="lg-module-card p-3.5 border-white/5 flex items-center justify-between bg-white/[0.015]">
                      <div class="flex items-center gap-3">
                        <div class="w-11 h-11 lg-bubble flex items-center justify-center p-2.5 backdrop-blur-3xl bg-white/[0.03]">
                          <img [ngSrc]="mission.icon" [alt]="mission.title" width="24" height="24" class="object-contain drop-shadow-md">
                        </div>
                        <div class="flex flex-col">
                          <h4 class="text-[11px] font-black text-white uppercase tracking-tight">{{ mission.title }}</h4>
                          <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest mt-0.5">+{{ mission.reward | number }} COP</span>
                        </div>
                      </div>
                      <div class="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-black border border-emerald-500/20">✓</div>
                    </div>
                  }
                } @else {
                  <div class="flex flex-col items-center justify-center py-20 opacity-20">
                    <p class="text-[10px] font-black text-white uppercase tracking-[0.2em]">Sin misiones completadas</p>
                  </div>
                }
            } @else {
                @if (failedMissions().length > 0) {
                  @for (mission of failedMissions(); track mission.id) {
                    <div class="lg-module-card p-3.5 border-white/5 flex items-center justify-between bg-white/[0.015]">
                      <div class="flex items-center gap-3">
                        <div class="w-11 h-11 lg-bubble flex items-center justify-center p-2.5 backdrop-blur-3xl bg-white/[0.03] grayscale opacity-50">
                          <img [ngSrc]="mission.icon" [alt]="mission.title" width="24" height="24" class="object-contain">
                        </div>
                        <div class="flex flex-col">
                          <h4 class="text-[11px] font-black text-white/50 uppercase tracking-tight line-through">{{ mission.title }}</h4>
                          <span class="text-[9px] font-black text-rose-500/60 uppercase tracking-widest mt-0.5">Expirado</span>
                        </div>
                      </div>
                      <div class="w-7 h-7 rounded-full bg-rose-500/10 text-rose-400/40 flex items-center justify-center text-[10px] font-black border border-rose-500/10">✗</div>
                    </div>
                  }
                } @else {
                   <div class="flex flex-col items-center justify-center py-20 opacity-20">
                    <p class="text-[10px] font-black text-white uppercase tracking-[0.2em]">Sin misiones fallidas</p>
                  </div>
                }
            }
          </div>

          <!-- Footer Button -->
          <footer class="z-10 relative pt-2">
            <button (click)="onClose()" class="lg-btn-primary w-full py-3.5 text-[11px] font-bold tracking-[0.25em] uppercase active:scale-[0.98] transition-all border-white/5">
              Cerrar Registro
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .text-glow-emerald { text-shadow: 0 0 15px rgba(52, 211, 153, 0.4); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HistoryModalComponent {
  isOpen = input(false);
  completedMissions = input<Mission[]>([]);
  failedMissions = input<Mission[]>([]);
  close = output<void>();

  historyModalTab = signal<'Completed' | 'Failed'>('Completed');

  onClose() { this.close.emit(); }
  setHistoryTab(tab: 'Completed' | 'Failed') { this.historyModalTab.set(tab); }
}
