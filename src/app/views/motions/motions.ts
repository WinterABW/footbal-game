import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { NgOptimizedImage, DecimalPipe } from '@angular/common';
import { HistoryModalComponent } from './components';
import { GlassModalComponent } from '../../shared/ui';

interface Mission {
  id: string; title: string; description: string; reward: number; currency: string; icon: string; completed: boolean;
}

@Component({
  selector: 'app-motions',
  imports: [NgOptimizedImage, HistoryModalComponent, DecimalPipe, GlassModalComponent],
  template: `
    <section class="h-dvh flex flex-col relative w-full overflow-hidden bg-transparent">
      
      <div class="flex-1 w-full relative z-10 flex flex-col overflow-y-auto no-scrollbar pt-safe-top pb-32 px-5 gap-2 animate-slide-up">
        
        <!-- Hero Section -->
        <div class="flex flex-col items-center py-0 -mb-1.5">
          <div class="relative w-32 h-32 group">
             <!-- Deep Aura Glow -->
            <div class="absolute inset-[-20px] bg-indigo-500/20 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse"></div>
            <img ngSrc="mociones/mociones.png" alt="Misiones" width="128" height="128" 
                class="relative z-10 w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] lg-float">
          </div>
        </div>

        <nav class="relative bg-white/5 backdrop-blur-3xl rounded-full p-1.5 flex items-center border border-white/5 shadow-2xl">
          <!-- Glass Sliding Indicator Container -->
          <div class="absolute inset-1.5 z-0 pointer-events-none">
            <div class="h-full bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-500 cubic-bezier(0.2, 1, 0.3, 1)"
              [style.width.%]="100 / missionTabKeys.length"
              [style.transform]="'translateX(' + (activeIndex() * 100) + '%)'">
              <div class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 rounded-full"></div>
            </div>
          </div>

          @for (tab of missionTabKeys; track tab) {
            <button (click)="activeTab.set(tab)"
              class="flex-1 h-11 rounded-full flex items-center justify-center group active:scale-95 transition-all duration-300 relative z-10">
              <img [ngSrc]="'social-icons/' + (tab === 'History' ? 'complete.png' : tab === 'Daily' ? 'daily.png' : getTabIcon(tab))" 
                [alt]="tab" width="22" height="22" 
                class="transition-all duration-300 pointer-events-none"
                [class.opacity-30]="activeTab() !== tab"
                [class.opacity-100]="activeTab() === tab"
                [class.scale-110]="activeTab() === tab">
            </button>
          }
        </nav>

        <main class="flex-1">
          <div class="bg-white/5 border border-white/5 rounded-[32px] p-1 overflow-hidden backdrop-blur-sm">
            @switch (activeTab()) {
              @case ('Daily') {
                <div class="flex flex-col gap-4 p-6">
                  <div class="grid grid-cols-4 gap-3">
                    @for (day of [1,2,3,4,5,6,7]; track day) {
                      <div class="bg-white/5 p-4 flex flex-col items-center gap-3 rounded-2xl border border-white/5 active:scale-95 transition-all cursor-pointer">
                        <span class="text-[10px] font-bold text-white/40 uppercase">D{{ day }}</span>
                        <div class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                           <div class="w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
              @case ('Whatsapp') {
                <div class="flex flex-col gap-2 p-2">
                  @for (mission of whatsappMissions(); track mission.id) {
                    <article (click)="openMission(mission)"
                      class="bg-white/5 p-4 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer rounded-2xl border border-transparent hover:border-white/10"
                      [class.opacity-40]="mission.completed">
                      <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
                          <img [ngSrc]="mission.icon" [alt]="mission.title" width="28" height="28" class="object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                        </div>
                        <div class="flex flex-col">
                          <h3 class="text-sm font-bold text-white tracking-tight">{{ mission.title }}</h3>
                          <span class="text-xs font-bold text-emerald-400 mt-1">+{{ mission.reward | number }} <span class="text-[10px] text-emerald-500/60">COP</span></span>
                        </div>
                      </div>
                      <div class="w-8 h-8 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                        @if (mission.completed) {
                          <span class="text-emerald-400">✓</span>
                        } @else {
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M14 5l7 7-7 7" /></svg>
                        }
                      </div>
                    </article>
                  }
                </div>
              }
              @case ('History') {
                <div class="lg-card-panel p-5 flex flex-col gap-4 mx-4 mt-2">
                  <!-- Section Header -->
                  <div class="flex flex-col gap-2 px-1">
                    <div class="lg-status-badge !py-1 !px-3 !text-[8px] w-fit">
                      <span class="lg-dot-active"></span>
                      PANEL
                    </div>
                    <h2 class="text-xl font-black text-white tracking-tight text-glow uppercase">Historial de Misiones</h2>
                    <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">Resumen de tu actividad y resultados.</p>
                  </div>

                  <!-- Statistics Grid -->
                  <div class="grid grid-cols-2 gap-3">
                    <div class="lg-module-card p-3">
                      <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Completadas</span>
                      <span class="block text-lg font-black text-white tracking-tighter text-glow mt-1">{{ completedMissions().length }}</span>
                    </div>
                    <div class="lg-module-card p-3">
                      <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Totales</span>
                      <span class="block text-lg font-black text-emerald-400 tracking-tighter text-glow mt-1">16</span>
                    </div>
                    <div class="lg-module-card p-3">
                      <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Fallidas</span>
                      <span class="block text-lg font-black text-white tracking-tighter text-glow mt-1">{{ failedMissions().length }}</span>
                    </div>
                    <div class="lg-module-card p-3">
                      <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Dinero Perdido</span>
                      <span class="block text-lg font-black text-rose-400 tracking-tighter text-glow mt-1">0</span>
                    </div>
                  </div>

                  <!-- Main Action Area -->
                  <button (click)="openHistoryModal()" class="lg-btn-primary w-full h-12 flex items-center justify-center gap-3 px-4 active:scale-[0.98] transition-all">
                    
                    <span class="text-[12px] font-semibold tracking-wide">Ver historial completo</span>
                  </button>
                </div>
              }
              @default {
                <div class="p-20 flex flex-col items-center justify-center text-center opacity-20">
                  <p class="text-xs font-bold uppercase tracking-[0.2em] text-white">En proceso...</p>
                </div>
              }
            }
          </div>
        </main>
      </div>

      <app-glass-modal
        [isOpen]="!!selectedMission()"
        (closed)="closeModal()"
      >
        @if (selectedMission(); as mission) {
          <div class="relative w-full max-w-[320px] flex flex-col p-2 group">
            <!-- Tempered Glass Reflection Layer -->
            <div class="absolute inset-0 pointer-events-none glass-glare opacity-20 z-0 rounded-[2rem]"></div>
            
            <!-- Horizontal Content Row -->
            <div class="flex items-center gap-4 mb-4 z-10">
              <!-- Icon: Official lg-bubble -->
              <div class="relative flex-shrink-0 w-14 h-14">
                 <div class="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"></div>
                 <div class="relative z-10 w-full h-full lg-bubble flex items-center justify-center p-2.5 backdrop-blur-3xl bg-white/[0.03]">
                   <img [ngSrc]="mission.icon" [alt]="mission.title" width="32" height="32" class="object-contain drop-shadow-lg">
                 </div>
              </div>

              <!-- Title Column -->
              <div class="flex flex-col flex-1">
                <h3 class="text-sm font-bold text-white tracking-tight leading-tight">{{ mission.title }}</h3>
                <p class="text-[10px] text-white/40 leading-snug line-clamp-2 mt-0.5">{{ mission.description }}</p>
              </div>

              <!-- Close Button -->
              <button (click)="closeModal()" 
                class="lg-icon-btn w-7 h-7 text-white/40 hover:text-white transition-all active:scale-90 flex-shrink-0 border-white/10">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            
            <!-- Bottom Action Row (Stacked) -->
            <div class="flex flex-col gap-2.5 z-10 w-full mt-1">
              <!-- Reward Tag (Full Width) -->
              <div class="lg-card-card py-2.5 px-4 flex items-center justify-center gap-2 border-emerald-500/10 bg-emerald-500/5 backdrop-blur-2xl w-full">
                 <span class="text-[9px] font-bold text-emerald-400/40 uppercase tracking-widest">RECOMPENSA</span>
                 <span class="text-lg font-black text-emerald-400 tracking-tight">+{{ mission.reward | number }}</span>
                 <span class="text-[10px] font-bold text-emerald-500/30">COP</span>
              </div>

              <!-- Action Button (Full Width) -->
              <button (click)="goToMission()" class="w-full py-3 lg-btn-primary text-[12px] font-bold tracking-[0.2em] active:scale-[0.97] transition-all flex items-center justify-center gap-3 border-white/10 uppercase">
                <span>Ir Ahora</span>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5"><path d="M14 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        }
      </app-glass-modal>

      <app-history-modal [isOpen]="showHistoryModal()" [completedMissions]="completedMissions()" [failedMissions]="failedMissions()" (close)="closeHistoryModal()" />
    </section>
  `,
  styles: [`
    :host { display: block; }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1.5rem); }
    .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .text-glow-emerald { text-shadow: 0 0 20px rgba(52, 211, 153, 0.3); }
    .text-glow { text-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .glass-glare { background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%); }
    .glass-glow { box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.2); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MotionsComponent {
  readonly missionTabKeys = ['Daily', 'Whatsapp', 'Facebook', 'Tiktok', 'Telegram', 'Youtube', 'History'];

  activeTab = signal<string>('Daily');
  activeIndex = computed(() => this.missionTabKeys.indexOf(this.activeTab()));
  selectedMission = signal<Mission | null>(null);
  showHistoryModal = signal(false);

  whatsappMissions = signal<Mission[]>([{ id: 'whatsapp-1', title: 'Estado de WhatsApp', description: 'Publica una captura del juego con tu link.', reward: 10000, currency: 'COP', icon: 'social-icons/Whatsapp_37229.png', completed: false }]);
  completedMissions = signal<Mission[]>([{ id: 'comp-1', title: 'Estado WA', description: '', reward: 10000, currency: 'COP', icon: 'social-icons/Whatsapp_37229.png', completed: true }]);
  failedMissions = signal<Mission[]>([]);

  openMission(m: Mission) { this.selectedMission.set(m); }
  closeModal() { this.selectedMission.set(null); }
  goToMission() { const m = this.selectedMission(); if (m) this.closeModal(); }
  openHistoryModal() { this.showHistoryModal.set(true); }
  closeHistoryModal() { this.showHistoryModal.set(false); }

  getTabIcon(tab: string): string {
    const icons: Record<string, string> = {
      Whatsapp: 'Whatsapp_37229.png', Facebook: 'facebook_icon-icons.com_53612.png',
      Tiktok: 'tiktok_logo_icon_189233.png', Telegram: 'telegram_icon-icons.com_72055.png',
      Youtube: 'YouTube_23392.png'
    };
    return icons[tab] || '';
  }
}
