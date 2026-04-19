import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { GlassTabBarComponent, GlassTab } from '../../shared/ui';
import { UserStatusService } from '../../core/services/user-status.service';
import { UserInfoService, ReferInfoResponse } from '../../core/services/user-info.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';

@Component({
  selector: 'app-social',
  imports: [NgOptimizedImage, GlassTabBarComponent],
  template: `
    <section class="h-dvh flex flex-col relative w-full overflow-hidden bg-transparent">
      
      <div class="flex-1 w-full relative z-10 flex flex-col overflow-y-auto no-scrollbar pt-safe-top pb-28 px-5 gap-2 animate-slide-up">
        
        <!-- Hero Section -->
        <div class="flex flex-col items-center py-0 -mb-1.5">
          <div class="relative w-32 h-32 group">
             <!-- Deep Aura Glow -->
            <div class="absolute inset-[-20px] bg-indigo-500/20 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse"></div>
            <img ngSrc="social/main/social.png" alt="social icon" width="128" height="128"
                class="relative z-10 w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] lg-float">
          </div>
        </div>

        <!-- Master Invitation Card (iOS 26 Liquid Reference) -->
        <article class="relative group active:scale-[0.98] transition-all duration-300">
           <div class="lg-panel rounded-lg px-5 py-3 flex items-center justify-between border-amber-500/30 accent-amber">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative shadow-inner">
                <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                <img ngSrc="shared/icons/money-box.png" alt="reward" width="32" height="32"
                    class="relative z-10 opacity-90 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
              </div>
              <div class="space-y-0.5">
                <h3 class="text-[12px] font-black text-white tracking-tight uppercase">Bono Amigo</h3>
                <p class="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-none">Gana con cada referido</p>
              </div>
            </div>
            <div class="flex flex-col items-center justify-center pr-1 leading-tight">
              <span class="text-sm font-black text-white tracking-tighter text-glow-amber">💵 + 500 COP</span>
              <span class="text-sm font-black text-white tracking-tighter text-glow-cyan">🎟 + 5 Ticket</span>
            </div>
          </div>
        </article>
 
         <!-- Quick Actions Row -->
         <div class="flex gap-2">
            <button 
              (click)="shareReferralLink()"
              class="flex-1 lg-module-card p-2 flex items-center justify-center gap-3 active:scale-[0.98] transition-all duration-300 group border-indigo-500/30 accent-violet">
             <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner group-hover:bg-indigo-500/20 transition-colors">
               <img ngSrc="shared/icons/add-friend.png" alt="reward" width="32" height="32"
                     class="relative z-10 opacity-90 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
             </div>
             <span class="text-[11px] font-black text-white uppercase tracking-widest">Invitar un amigo</span>
           </button>
          
           <button 
             (click)="copyReferralLink()"
             class="w-14 lg-module-card p-0.5 flex items-center justify-center active:scale-[0.98] transition-all duration-300 group">
              <div class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <img ngSrc="shared/icons/copy.png" alt="copy" width="32" height="32"
                     class="relative z-10 opacity-90 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
              </div>
           </button>
        </div>

        <!-- Redes / Tabs -->
        <div class="w-full">
          <app-glass-tab-bar 
            [tabs]="socialTabs"
            [(activeTab)]="activeTab"
          />
        </div>

        <!-- Dynamic Content Engine -->
        <div class="flex-1 pb-32">
          @switch (activeTab()) {
            @case ('misReferidos') {
              <div class="lg-card-panel p-5 flex flex-col gap-4">
                <!-- Section Header -->
                <div class="flex flex-col gap-2 px-1">
                  <div class="lg-status-badge !py-1 !px-3 !text-[8px] w-fit">
                    <span class="lg-dot-active"></span>
                    PANEL
                  </div>
                  <h2 class="text-xl font-black text-white tracking-tight text-glow uppercase">Mis Referidos</h2>
                  <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">Comparte tu enlace y mira como crece tu red.</p>
                </div>

                <!-- Network Metrics Expanded Grid -->
                <div class="grid grid-cols-2 gap-3">
                  <div class="lg-module-card lg-module-card--highlight-emerald p-3">
                    <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Total</span>
                    <span class="block text-lg font-black text-emerald-400 tracking-tighter text-glow-emerald mt-1">{{ referInfo()?.total ?? '--' }}</span>
                  </div>
                  <div class="lg-module-card lg-module-card--highlight-emerald p-3">
                    <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Hoy</span>
                    <span class="block text-lg font-black text-emerald-400 tracking-tighter text-glow-emerald mt-1">{{ referInfo()?.today ?? '--' }}</span>
                  </div>
                  <div class="lg-module-card lg-module-card--highlight-emerald p-3">
                    <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Último mes</span>
                    <span class="block text-lg font-black text-emerald-400 tracking-tighter text-glow-emerald mt-1">{{ referInfo()?.lastMonth ?? '--' }}</span>
                  </div>
                  <div class="lg-module-card lg-module-card--highlight-emerald p-3">
                    <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Última semana</span>
                    <span class="block text-lg font-black text-emerald-400 tracking-tighter text-glow-emerald mt-1">{{ referInfo()?.lastWeek ?? '--' }}</span>
                  </div>
                </div>

                <!-- Main Action Area -->
                <button 
                  (click)="shareReferralLink()"
                  class="lg-btn-primary w-full h-12 flex items-center justify-center gap-3 px-4 active:scale-[0.98] transition-all">
                  <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                  <span class="text-[12px] font-semibold tracking-wide">INVITAR</span>
                </button>
              </div>
            }

            @case ('detalles') {
              <div class="lg-card-panel p-5 flex flex-col gap-4">
                <!-- Section Header -->
                <div class="flex flex-col gap-1.5 px-1">
                  <div class="inline-flex w-fit px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <span class="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Panel</span>
                  </div>
                  <h2 class="text-xl font-black text-white tracking-tight text-glow uppercase">Detalles</h2>
                  <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">Invite a sus amigos a ganar junto a usted.</p>
                </div>

                <!-- Commission Levels List -->
                <div class="flex flex-col gap-2">
                  <div class="lg-module-card lg-module-card--highlight-emerald p-3.5 flex items-center justify-between active:scale-[0.98] transition-transform">
                    <span class="text-[11px] font-black text-emerald-400 tracking-wide uppercase text-glow-emerald">Nivel 1: Gana el 5%</span>
                    <span class="text-[11px] font-black text-white/20">--</span>
                  </div>
                  <div class="lg-module-card lg-module-card--highlight-emerald p-3.5 flex items-center justify-between active:scale-[0.98] transition-transform">
                    <span class="text-[11px] font-black text-emerald-400 tracking-wide uppercase text-glow-emerald">Nivel 2: Gana el 3%</span>
                    <span class="text-[11px] font-black text-white/20">--</span>
                  </div>
                  <div class="lg-module-card lg-module-card--highlight-emerald p-3.5 flex items-center justify-between active:scale-[0.98] transition-transform">
                    <span class="text-[11px] font-black text-emerald-400 tracking-wide uppercase text-glow-emerald">Nivel 3: Gana el 1%</span>
                    <span class="text-[11px] font-black text-white/20">--</span>
                  </div>
                </div>
              </div>
            }

            @case ('misGanancias') {
              <div class="lg-card-panel p-5 flex flex-col gap-4">
                <!-- Section Header -->
                <div class="flex flex-col gap-1 px-1">
                  <h2 class="text-xl font-black text-white tracking-tight text-glow uppercase">Mis Ganancias</h2>
                  <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed text-balance">Visualiza lo que has acumulado y lo que esta en camino.</p>
                </div>

                <!-- Earnings Metrics 2x2 Grid -->
                <div class="grid grid-cols-2 gap-3">
                  <div class="lg-module-card lg-module-card--highlight-emerald p-3">
                    <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Total</span>
                    <span class="block text-lg font-black text-emerald-400 tracking-tighter text-glow-emerald mt-1">{{ referInfo()?.earnTotal ?? '--' }}</span>
                  </div>
                  <div class="lg-module-card lg-module-card--highlight-emerald p-3">
                    <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Hoy</span>
                    <span class="block text-lg font-black text-emerald-400 tracking-tighter text-glow-emerald mt-1">{{ referInfo()?.earnToday ?? '--' }}</span>
                  </div>
                  <div class="lg-module-card lg-module-card--highlight-emerald p-3">
                    <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Último mes</span>
                    <span class="block text-lg font-black text-emerald-400 tracking-tighter text-glow-emerald mt-1">{{ referInfo()?.earnLastMonth ?? '--' }}</span>
                  </div>
                  <div class="lg-module-card lg-module-card--highlight-emerald p-3">
                    <span class="text-[8px] font-black text-white/20 uppercase tracking-widest">Última semana</span>
                    <span class="block text-lg font-black text-emerald-400 tracking-tighter text-glow-emerald mt-1">{{ referInfo()?.earnLastWeek ?? '--' }}</span>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>

    </section>
  `,
  styles: [`
    :host { display: block; }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 0); }
    .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialComponent implements OnInit {
  private userStatusService = inject(UserStatusService);
  private userInfoService = inject(UserInfoService);
  private errorHandler = inject(ErrorHandlerService);

  readonly userId = this.userStatusService.userStatus;
  readonly referInfo = signal<ReferInfoResponse | null>(null);

  readonly socialTabs: GlassTab[] = [
    { id: 'misReferidos', label: 'Referidos' },
    { id: 'misGanancias', label: 'Ganancias' },
    { id: 'detalles', label: 'Detalles' },
  ];

  activeTab = signal<string>('misReferidos');

  private readonly baseUrl = 'https://fifa-empire.com/welcome?referrealId=';

  async ngOnInit(): Promise<void> {
    await this.loadReferInfo();
  }

  private async loadReferInfo(): Promise<void> {
    const result = await this.userInfoService.getReferInfo();
    if (result.success && result.data) {
      this.referInfo.set(result.data);
    }
  }

  getReferralUrl(): string | null {
    const user = this.userId();
    if (!user?.id) return null;
    return `${this.baseUrl}${user.id}`;
  }

  async shareReferralLink(): Promise<void> {
    const url = this.getReferralUrl();
    if (!url) {
      console.warn('No referral ID available');
      return;
    }

    const shareData: ShareData = {
      title: "FIFA' Empire 🤑",
      text: `⚽️ Juega, invirte, mejora, contrata Jugadores, compite, toca y gana $COP\n\n🎁 Recibe gratis 500 $COP💰 y 5 Tickets 🎫 si comienzas hoy mismo!\n\n${url}`,
      url,
    };

    // Prioridad: share sheet nativo del sistema (WhatsApp, Telegram, SMS, etc.)
    if (navigator.share) {
      try {
        if (!navigator.canShare || navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      } catch {
        // Fallback si falla o el usuario cancela
      }
    }

    // Fallback en WebView/restricciones: compartir por Telegram dentro del Mini App
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      const text = `⚽️ Juega, invirte, mejora, contrata Jugadores, compite, toca y gana $COP\n\n🎁 Recibe gratis 500 $COP💰 y 5 Tickets 🎫 si comienzas hoy mismo!`;
      const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      tg.openTelegramLink(telegramShareUrl);
      return;
    }

    // Último fallback: copiar enlace
    await this.copyToClipboard(url);
  }

  async copyReferralLink(): Promise<void> {
    const url = this.getReferralUrl();
    if (!url) {
      console.warn('No referral ID available');
      return;
    }
    await this.copyToClipboard(url);
  }

  private getShareMessage(url: string): string {
    return `FIFA' Empire 🤑\n⚽️ Juega, invirte, mejora, contrata Jugadores, compite, toca y gana $COP\n\n🎁 Recibe gratis 500 $COP💰 y 5 Tickets 🎫 si comienzas hoy mismo!\n\n${url}`;
  }

  private async copyToClipboard(text: string): Promise<void> {
    try {
      const message = this.getShareMessage(text);
      await navigator.clipboard.writeText(message);
      this.errorHandler.showToast('Enlace copiado', 'success');
    } catch {
      this.errorHandler.showToast('Error al copiar enlace', 'error');
    }
  }
}
