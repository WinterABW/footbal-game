import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { NgOptimizedImage, DecimalPipe } from '@angular/common';
import { GlassModalComponent } from '../../shared/ui';
import confetti from 'canvas-confetti';

interface Mission {
  id: string; title: string; description: string; reward: number; currency: string; icon: string; completed: boolean;
}

interface DailyReward {
  day: number;
  state: 'claimed' | 'available' | 'upcoming';
  icon: string;
}

@Component({
  selector: 'app-motions',
  imports: [NgOptimizedImage, DecimalPipe, GlassModalComponent],
  template: `
    <section class="h-dvh flex flex-col relative w-full overflow-hidden bg-transparent">
      
      <div class="flex-1 w-full relative z-10 flex flex-col overflow-y-auto no-scrollbar pt-safe-top pb-32 px-5 gap-2 animate-slide-up">
        
        <!-- Hero Section -->
        <div class="flex flex-col items-center py-0 -mb-1.5">
          <div class="relative w-24 h-32 group">
             <!-- Deep Aura Glow -->
            <div class="absolute inset-[-20px] bg-indigo-500/20 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse"></div>
            <img ngSrc="motions/main/mociones.webp" alt="Misiones" width="128" height="128" 
                class="relative z-10 w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] lg-float">
          </div>
        </div>

        <nav class="relative bg-white/5 backdrop-blur-3xl rounded-full p-1.5 flex items-center border border-cyan-500/30 shadow-2xl accent-cyan-bg-alt">
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
              <img [ngSrc]="'social/icons/' + (tab === 'History' ? 'complete.png' : tab === 'Daily' ? 'daily.png' : getTabIcon(tab))" 
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
                <div class="flex flex-col gap-4 p-4">
                  <div class="grid grid-cols-4 gap-2 md:gap-4">
                    @for (reward of dailyRewards(); track reward.day; let i = $index) {
                      <div (click)="claimDailyReward(reward)" 
                        [style.animation-delay.ms]="i * 75"
                        class="animate-pop-in group relative flex flex-col items-center justify-center p-2 sm:p-4 aspect-square rounded-2xl sm:rounded-[32px] border transition-all duration-500 cursor-pointer active:scale-95"
                        [class]="reward.state === 'available' 
                          ? 'bg-gradient-to-b from-white/10 to-white/5 border-emerald-500/40 shadow-[0_10px_30px_rgba(16,185,129,0.2)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.3)] -translate-y-1 hover:-translate-y-2' 
                          : reward.state === 'claimed' 
                            ? 'bg-white/5 border-white/10 opacity-90' 
                            : 'bg-white/[0.02] border-white/5 opacity-40 hover:opacity-60'">
                        
                        @if (reward.state === 'available') {
                          <!-- Pulse Glow for Available Item -->
                          <div class="absolute inset-0 bg-emerald-500/10 rounded-2xl sm:rounded-[32px] blur-xl animate-pulse-fast pointer-events-none"></div>
                          
                          <!-- Sparkles for Available Item -->
                          <div class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-400 rounded-full blur-md opacity-60 animate-bounce" style="animation-duration: 2s;"></div>
                          <div class="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full blur-md opacity-60 animate-bounce" style="animation-duration: 3s; animation-delay: 0.5s;"></div>
                        }

                        <!-- Header: Día Label -->
                        <span class="relative z-10 text-[10px] md:text-[13px] font-extrabold text-white mb-1 sm:mb-2 tracking-wide drop-shadow-md whitespace-nowrap transition-colors duration-300"
                              [class.text-emerald-300]="reward.state === 'available'">
                          Día {{ reward.day }}
                        </span>

                        <!-- Main Icon Area -->
                        <div class="relative w-full flex-1 flex items-center justify-center p-1 sm:p-2">
                          <img [ngSrc]="reward.icon" [alt]="reward.state" width="100" height="100" 
                            class="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform duration-500"
                            [class.animate-float]="reward.state === 'available'"
                            [class.group-hover:scale-110]="reward.state !== 'upcoming'"
                            [class.opacity-70]="reward.state === 'upcoming'">
                        </div>

                        <!-- Checkmark Overlay for Claimed -->
                        @if (reward.state === 'claimed') {
                          <div class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl sm:rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                            <svg class="w-8 h-8 text-emerald-400 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        }
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
                          <span class="text-xs font-bold text-emerald-400 mt-1 text-glow-emerald">+{{ mission.reward | number }} <span class="text-[10px] text-emerald-500/60">COP</span></span>
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
                    <div class="lg-module-card p-3 border-emerald-500/30 accent-emerald">
                      <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Totales</span>
                      <span class="block text-lg font-black text-emerald-400 tracking-tighter text-glow-emerald mt-1">16</span>
                    </div>
                    <div class="lg-module-card p-3">
                      <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Fallidas</span>
                      <span class="block text-lg font-black text-white tracking-tighter text-glow mt-1">{{ failedMissions().length }}</span>
                    </div>
                    <div class="lg-module-card p-3 border-rose-500/30 accent-rose">
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

      <!-- Toast Notification (Professional Glass) -->
      @if (toastData(); as toast) {
        <div class="fixed top-[env(safe-area-inset-top,1.5rem)] inset-x-0 z-[100] flex justify-center p-4 pointer-events-none mt-2">
          <div class="animate-slide-down-toast backdrop-blur-2xl border flex items-center gap-3.5 px-5 py-3.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] w-full max-w-[340px]"
               [class]="toast.type === 'success' ? 'bg-emerald-950/60 border-emerald-500/20' : toast.type === 'error' ? 'bg-rose-950/60 border-rose-500/20' : 'bg-black/60 border-white/10'">
            <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                 [class]="toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : toast.type === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-white/20 text-white'">
               @if (toast.type === 'success') {
                 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
               } @else if (toast.type === 'error') {
                 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
               } @else {
                 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               }
            </div>
            <span class="text-[13px] font-medium tracking-wide text-white/95 leading-snug">{{ toast.message }}</span>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1.5rem); }
    .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    .animate-slide-down-toast { animation: slideDownToast 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-pulse-subtle { animation: pulseSubtle 3s ease-in-out infinite; }
    .animate-pop-in { animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    .animate-float { animation: float 3s ease-in-out infinite; }
    .animate-pulse-fast { animation: pulseFast 1.5s ease-in-out infinite; }

    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes slideDownToast { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes pulseSubtle { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.02); opacity: 0.9; } }
    @keyframes popIn { from { transform: scale(0.8) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @keyframes pulseFast { 0%, 100% { opacity: 0.3; transform: scale(0.95); } 50% { opacity: 0.7; transform: scale(1.05); } }

    .text-glow-emerald { text-shadow: 0 0 20px rgba(52, 211, 153, 0.3); }
    .text-glow { text-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .glass-glare { background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%); }
    .glass-glow { box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.2); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MotionsComponent {
  readonly missionTabKeys = ['Daily', 'Whatsapp', 'Facebook', 'Tiktok', 'Telegram', 'Youtube', 'History'];

  activeTab = signal<string>('Daily');
  activeIndex = computed(() => this.missionTabKeys.indexOf(this.activeTab()));
  selectedMission = signal<Mission | null>(null);
  showHistoryModal = signal(false);

  whatsappMissions = signal<Mission[]>([{ id: 'whatsapp-1', title: 'Estado de WhatsApp', description: 'Publica una captura del juego con tu link.', reward: 10000, currency: 'COP', icon: 'social/icons/Whatsapp_37229.png', completed: false }]);
  completedMissions = signal<Mission[]>([{ id: 'comp-1', title: 'Estado WA', description: '', reward: 10000, currency: 'COP', icon: 'social/icons/Whatsapp_37229.png', completed: true }]);
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

  dailyRewards = signal<DailyReward[]>([
    { day: 1, state: 'claimed', icon: 'motions/daily/reclamed.webp' },
    { day: 2, state: 'claimed', icon: 'motions/daily/reclamed.webp' },
    { day: 3, state: 'available', icon: 'motions/daily/current.webp' },
    { day: 4, state: 'upcoming', icon: 'motions/daily/comingsoon.webp' },
    { day: 5, state: 'upcoming', icon: 'motions/daily/comingsoon.webp' },
    { day: 6, state: 'upcoming', icon: 'motions/daily/comingsoon.webp' },
    { day: 7, state: 'upcoming', icon: 'motions/daily/comingsoon.webp' },
  ]);

  toastData = signal<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  claimDailyReward(reward: DailyReward) {
    if (reward.state === 'upcoming') {
      this.playErrorSound();
      this.showToast('¡Aún no! Esta recompensa estará disponible pronto.', 'error');
    } else if (reward.state === 'claimed') {
      this.playErrorSound();
      this.showToast('¡Ya reclamaste este premio! Vuelve mañana.', 'error');
    } else if (reward.state === 'available') {
      this.triggerConfetti();
      this.playClaimSound();
      this.dailyRewards.update(rewards => rewards.map(r =>
        r.day === reward.day ? { ...r, state: 'claimed', icon: 'motions/daily/reclamed.webp' } : r
      ));
      this.showToast(`¡Genial! Has reclamado tu recompensa del Día ${reward.day}.`, 'success');
    }
  }

  playClaimSound() {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const playNote = (freq: number, startTime: number, type: OscillatorType = 'sine', duration: number = 0.5) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Magical chime chord (C Maj 7 Arpeggio)
    playNote(523.25, now, 'sine', 0.6);       // C5
    playNote(659.25, now + 0.1, 'sine', 0.6); // E5
    playNote(783.99, now + 0.2, 'sine', 0.6); // G5
    playNote(987.77, now + 0.3, 'sine', 0.6); // B5
    playNote(1046.50, now + 0.4, 'triangle', 0.8); // C6 Sparkle
  }

  playErrorSound() {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastData.set({ message, type });
    setTimeout(() => this.toastData.set(null), 3000);
  }

  triggerConfetti() {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#FFD700', '#FFA500', '#FF4500', '#10B981', '#3B82F6']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#FFD700', '#FFA500', '#FF4500', '#10B981', '#3B82F6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }
}
