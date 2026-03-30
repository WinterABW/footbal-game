import { ChangeDetectionStrategy, Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { BalanceComponent } from '../../shared/components/balance/balance.component';
import { ProductCardComponent } from './components/product/product-card.component';
import { ProductCardVerticalComponent } from './components/product-vertical/product-card-vertical.component';
import { PlayerDetailsComponent } from './components/player-details/player-details.component';
import { PerHourEarningsComponent } from '../game/components/per-hour-earnings/per-hour-earnings.component';
import { RouterLink } from '@angular/router';
import type { InvestApiPlayer } from '../../models/invest.model';
import { GlassTabBarComponent, GlassTab } from '../../shared/ui';
import { InvestService } from '../../core/services/invest.service';

@Component({
  selector: 'app-invest-layout',
  imports: [NgOptimizedImage, BalanceComponent, ProductCardComponent, ProductCardVerticalComponent, PlayerDetailsComponent, PerHourEarningsComponent, RouterLink, GlassTabBarComponent],
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
                    <!-- Deep Aura Glow with Cyan Theme -->
                    <div class="absolute inset-[-20px] rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse accent-cyan-bg"></div>
                    <img ngSrc="shared/navigation/inversion.webp" alt="invest icon" width="128" height="128"
                        class="relative z-10 w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(34,211,238,0.3)] lg-float">
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
                  @if (availablePlayers().length > 0) {
                    <div class="grid grid-cols-2 gap-4">
                        @for (p of availablePlayers(); track p.id ) {
                          <app-product-card [product]="p" (buy)="openPlayerDetails($event)" class="animate-fade-up" />
                        }
                    </div>
                  } @else {
                    <div class="lg-panel p-20 text-center opacity-40">
                        <p class="text-white font-black text-[10px] uppercase tracking-[0.4em] leading-relaxed">Sin Jugadores</p>
                    </div>
                  }
                } @else if(activeTab() === 'vip') {
                  @if (vipPlayers().length > 0) {
                    <div class="grid grid-cols-2 gap-4">
                        @for (vipPlayer of vipPlayers(); track vipPlayer.id) {
                          <app-product-card-vertical [product]="vipPlayer" (buy)="openPlayerDetails($event)" class="animate-fade-up" />
                        }
                    </div>
                  } @else {
                    <div class="lg-panel p-20 text-center opacity-40">
                        <p class="text-white font-black text-[10px] uppercase tracking-[0.4em] leading-relaxed">Sin Jugadores VIP</p>
                    </div>
                  }
                } @else if (activeTab() === 'comprados') {
                  <div class="lg-panel p-20 text-center opacity-40">
                    <p class="text-white font-black text-[10px] uppercase tracking-[0.4em] leading-relaxed">Sin Jugadores Comprados</p>
                  </div>
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

        @if (selectedPlayer()) {
          <app-player-details 
            [player]="selectedPlayer()!" 
            (confirm)="confirmPurchase($event)" 
            (close)="closeDetailsModal()" 
          />
        }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1.5rem); }
    .animate-fade-up { animation: fadeUp 0.8s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes fadeUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestLayoutComponent {
  private investService = inject(InvestService);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  readonly investTabs: GlassTab[] = [
    { id: 'jugadores', label: 'Mercado' },
    { id: 'vip', label: 'VIP' },
    { id: 'comprados', label: 'Equipo' },
  ];

  activeTabStr = signal<string>('jugadores');
  activeTab = computed(() => this.activeTabStr() as 'jugadores' | 'vip' | 'comprados');

  showScrollToTopButton = signal(false);
  selectedPlayer = signal<InvestApiPlayer | null>(null);

  availablePlayers = this.investService.availablePlayers;
  vipPlayers = this.investService.vipPlayers;

  openPlayerDetails(player: InvestApiPlayer) {
    this.selectedPlayer.set(player);
  }

  closeDetailsModal() {
    this.selectedPlayer.set(null);
  }

  confirmPurchase(player: InvestApiPlayer) {
    // TODO: Implement purchase when API is ready
    this.closeDetailsModal();
  }

  onSectionScroll(event: Event) {
    this.showScrollToTopButton.set((event.target as HTMLElement).scrollTop > 300);
  }

  scrollToTop() {
    this.scrollContainer.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
