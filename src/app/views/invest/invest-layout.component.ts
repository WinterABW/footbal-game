import { ChangeDetectionStrategy, Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { BalanceComponent } from '../../shared/balance/balance.component';
import { ProductCardComponent } from './components/product/product-card.component';
import { ProductCardVerticalComponent } from './components/product-vertical/product-card-vertical.component';
import { PlayerDetailsComponent } from './components/player-details/player-details.component';
import { PerHourEarningsComponent } from '../game/components/per-hour-earnings/per-hour-earnings.component';
import { RouterLink } from '@angular/router';
import { PlayersService, Player } from '../../services/players.service';
import { GlassTabBarComponent, GlassTab } from '../../shared/ui';

@Component({
  selector: 'app-invest-layout',
  imports: [NgOptimizedImage, BalanceComponent, ProductCardComponent, ProductCardVerticalComponent, PerHourEarningsComponent, RouterLink, PlayerDetailsComponent, GlassTabBarComponent],
  template: `
    <section class="h-dvh flex flex-col relative w-full overflow-hidden bg-transparent">
        
        <!-- Floating Header Controls -->
        <div class="absolute top-0 left-0 right-0 z-20 px-5 mt-[calc(env(safe-area-inset-top,0px)+1rem)] flex flex-row justify-between items-center pointer-events-none">
            <a routerLink="/main"
                class="w-10 h-10 lg-module-card flex items-center justify-center active:scale-90 transition-transform pointer-events-auto"
                aria-label="Volver">
                <svg class="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </a>
            <div class="pointer-events-auto">
                <app-per-hour-earnings />
            </div>
        </div>

        <div class="flex-1 w-full relative z-10 flex flex-col overflow-y-auto no-scrollbar pt-safe-top pb-32 px-5 gap-2" #scrollContainer
            (scroll)="onSectionScroll($event)">
            
            <!-- Hero Section -->
            <div class="flex flex-col items-center py-0 -mb-1.5 mt-2">
                <div class="relative w-32 h-32 group">
                    <!-- Deep Aura Glow -->
                    <div class="absolute inset-[-20px] bg-teal-500/20 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse"></div>
                    <img ngSrc="navegation-icons/inversion.webp" alt="invest icon" width="128" height="128"
                        class="relative z-10 w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] lg-float">
                </div>
            </div>

            <app-balance />

            <app-glass-tab-bar
              [tabs]="investTabs"
              [(activeTab)]="activeTabStr"
              class="mb-8 block"
            />

            <div class="w-full pb-12">
                @if (activeTab() === 'jugadores') {
                  @if (isLoading()) {
                    <div class="flex flex-col items-center py-24 gap-6">
                        <div class="w-12 h-12 border-4 border-white/5 border-t-teal-500 rounded-full animate-spin"></div>
                        <p class="text-white/20 font-black text-[10px] uppercase tracking-[0.4em]">Scouting Talentos...</p>
                    </div>
                  } @else if (player().length > 0) {
                    <div class="grid grid-cols-2 gap-4">
                        @for (p of player(); track p.id ) {
                          <app-product-card [product]="p" (buy)="buyPlayer($event)" class="animate-fade-up" />
                        }
                    </div>
                  } @else {
                    <div class="lg-panel p-20 text-center opacity-40">
                        <p class="text-white font-black text-[10px] uppercase tracking-[0.4em] leading-relaxed">Sin Jugadores Libres</p>
                    </div>
                  }
                } @else if(activeTab() === 'vip') {
                  @if (isLoading()) {
                    <div class="flex flex-col items-center py-24 gap-6">
                        <div class="w-12 h-12 border-4 border-white/5 border-t-amber-400 rounded-full animate-spin"></div>
                        <p class="text-white/20 font-black text-[10px] uppercase tracking-[0.4em]">Acceso VIP...</p>
                    </div>
                  } @else if (vipPlayers().length > 0) {
                    <div class="grid grid-cols-2 gap-4">
                        @for (vipPlayer of vipPlayers(); track vipPlayer.id) {
                          <app-product-card-vertical [product]="vipPlayer" (buy)="buyPlayer($event)" class="animate-fade-up" />
                        }
                    </div>
                  } @else {
                    <div class="lg-panel p-20 text-center opacity-40">
                        <p class="text-white font-black text-[10px] uppercase tracking-[0.4em] leading-relaxed">Exclusividad Pendiente</p>
                    </div>
                  }
                } @else if (activeTab() === 'misJugadores') {
                  @if (isLoading()) {
                    <div class="flex flex-col items-center py-24 gap-6">
                        <div class="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin"></div>
                        <p class="text-white/20 font-black text-[10px] uppercase tracking-[0.4em]">Revisando Plantilla...</p>
                    </div>
                  } @else if (myPlayers().length > 0) {
                    @if (myVipPlayers().length > 0) {
                      <div class="mb-12">
                          <h4 class="text-[10px] font-black text-amber-400/50 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
                              <span class="h-px flex-1 bg-amber-400/10"></span>
                              ESTRELLAS
                              <span class="h-px flex-1 bg-amber-400/10"></span>
                          </h4>
                          <div class="grid grid-cols-2 gap-4">
                              @for (myPlayer of myVipPlayers(); track myPlayer.id) {
                                <app-product-card-vertical [product]="myPlayer" />
                              }
                          </div>
                      </div>
                    }
                    @if (myRegularPlayers().length > 0) {
                      <div>
                          <h4 class="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
                              <span class="h-px flex-1 bg-white/5"></span>
                              PLANTILLA
                              <span class="h-px flex-1 bg-white/5"></span>
                          </h4>
                          <div class="grid grid-cols-2 gap-4">
                              @for (myPlayer of myRegularPlayers(); track myPlayer.id) {
                                <app-product-card [product]="myPlayer" />
                              }
                          </div>
                      </div>
                    }
                  } @else {
                    <div class="lg-panel p-20 text-center opacity-30 flex flex-col items-center justify-center">
                        <p class="text-white font-black text-[10px] uppercase tracking-[0.4em] leading-relaxed">Tu equipo está vacío.<br>¡Empieza a fichar!</p>
                    </div>
                  }
                }
            </div>
        </div>

        @if (showScrollToTopButton()) {
            <button (click)="scrollToTop()"
                class="fixed bottom-32 right-6 w-12 h-12 lg-module-card flex items-center justify-center z-50 shadow-teal-500/20 active:scale-90 transition-all duration-300"
                aria-label="Volver arriba">
                <svg class="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            </button>
        }

        @if (purchaseMessage()) {
            <div class="fixed bottom-32 left-6 right-6 z-[100] px-6 py-5 lg-module-card flex items-center justify-center animate-fade-in shadow-2xl"
                [class.bg-emerald-500/10]="purchaseSuccess()" [class.bg-red-500/10]="!purchaseSuccess()"
                [class.border-emerald-400/20]="purchaseSuccess()" [class.border-red-400/20]="!purchaseSuccess()">
                <p class="text-white font-black text-[10px] uppercase tracking-[0.3em] text-glow text-center">{{ purchaseMessage() }}</p>
            </div>
        }

        @if (showPurchaseAnimation()) {
          <div class="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/60 backdrop-blur-2xl animate-fade-in">
              <div class="w-full max-w-sm lg-panel p-12 flex flex-col items-center text-center">
                  <div class="w-24 h-24 rounded-full bg-teal-500/10 border border-teal-400/20 flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(20,184,166,0.1)]">
                      <svg class="w-12 h-12 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                  </div>
                  <h3 class="text-3xl font-black text-white tracking-tighter mb-4 text-glow uppercase">Fichaje Logrado</h3>
                  <p class="text-xl font-black text-teal-400 mb-2 uppercase tracking-tight">{{ purchasedPlayerName() }}</p>
                  <p class="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] mt-10">Transferencia Exitosa</p>
              </div>
          </div>
        }

        @if (selectedPlayerForDetails(); as playerDetail) {
          <app-player-details [player]="playerDetail" (confirm)="confirmPurchase($event)" (close)="closeDetailsModal()" />
        }

    </section>
  `,
  styles: [`
    :host { display: block; }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1.5rem); }
    .animate-fade-up { animation: fadeUp 0.8s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes fadeUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .text-glow { text-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestLayoutComponent {
  private playersService = inject(PlayersService);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  readonly investTabs: GlassTab[] = [
    { id: 'jugadores', label: 'Mercado' },
    { id: 'vip', label: 'VIP' },
    { id: 'misJugadores', label: 'Equipo' },
  ];

  activeTabStr = signal<string>('jugadores');
  activeTab = computed(() => this.activeTabStr() as 'jugadores' | 'misJugadores' | 'vip');

  purchaseMessage = signal<string | null>(null);
  purchaseSuccess = signal(false);
  showPurchaseAnimation = signal(false);
  purchasedPlayerName = signal<string>('');
  showScrollToTopButton = signal(false);
  selectedPlayerForDetails = signal<Player | null>(null);

  player = this.playersService.regularPlayers;
  myPlayers = this.playersService.myPlayers;
  vipPlayers = this.playersService.vipPlayers;
  isLoading = this.playersService.isLoading;

  myRegularPlayers = computed(() => this.myPlayers().filter(p => !p.exclusive));
  myVipPlayers = computed(() => this.myPlayers().filter(p => p.exclusive));

  onSectionScroll(event: Event) {
    this.showScrollToTopButton.set((event.target as HTMLElement).scrollTop > 300);
  }

  scrollToTop() {
    this.scrollContainer.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openPlayerDetails(player: Player) {
    this.selectedPlayerForDetails.set(player);
  }

  closeDetailsModal() {
    this.selectedPlayerForDetails.set(null);
  }

  confirmPurchase(player: Player) {
    if (!player || !player.id) {
      this.purchaseMessage.set('Error: Jugador inválido');
      this.purchaseSuccess.set(false);
      this.closeDetailsModal();
      return;
    }

    const result = this.playersService.buyPlayer(player);
    this.purchaseMessage.set(result.message);
    this.purchaseSuccess.set(result.success);

    if (result.success) {
      this.purchasedPlayerName.set(player.name);
      this.showPurchaseAnimation.set(true);
      setTimeout(() => this.showPurchaseAnimation.set(false), 2500);
    }

    setTimeout(() => this.purchaseMessage.set(null), 2000);
    this.closeDetailsModal();
  }

  buyPlayer(player: Player) {
    this.openPlayerDetails(player);
  }
}
