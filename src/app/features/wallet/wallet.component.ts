import { ChangeDetectionStrategy, Component, signal, inject, computed, OnInit, effect } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { UserStatusService } from '../../core/services/user-status.service';
import { AuthService } from '../../core/services/auth.service';
import { SupportService } from '../../services/support.service';
import { WalletService } from '../../services/wallet.service';
import { WalletService as CoreWalletService } from '../../core/services/wallet.service';
import { Transaction } from '../../models/transaction.model';
import { SupportChatComponent } from './support-chat.component';
import { BalanceWalletComponent } from '../../shared/components/balance-wallet/balance-wallet.component';
import { GlassTab, GlassSheetComponent } from '../../shared/ui';

interface Deposit {
  title: string;
  desc: string;
  icon: string;
}

@Component({
  selector: 'app-wallet',
  imports: [CommonModule, NgOptimizedImage, SupportChatComponent, BalanceWalletComponent, GlassSheetComponent],
  template: `
    <section class="h-dvh flex flex-col relative w-full overflow-hidden bg-transparent">

      <!-- Support button (floating top-right) -->
      <button (click)="navigateToSupport()" 
              class="absolute top-0 right-5 mt-[calc(env(safe-area-inset-top,0px)+1.5rem)] z-20 w-12 h-12 lg-icon-btn flex items-center justify-center active:scale-90 transition-all p-0.5"
              [style.outline]="hasPendingMessages() ? '2px solid #ef4444' : 'none'"
              [style.outline-offset]="'2px'"
              [class.animate-pulse]="hasPendingMessages()">
        <div class="relative w-full h-full">
          <img ngSrc="shared/icons/support.webp" alt="Soporte" width="32" height="32" class="rounded-full object-cover w-full h-full" />
        </div>
      </button>

      <div class="flex-1 w-full relative z-10 flex flex-col overflow-y-auto no-scrollbar pb-24 px-5 gap-2" style="padding-top: calc(var(--safe-top, 0px) + 0.75rem);">

        <!-- Hero Section -->
        <div class="flex flex-col items-center py-0 -mb-1.5">
          <div class="relative w-32 h-32 group">
            <!-- Deep Aura Glow -->
            <div class="absolute inset-[-20px] bg-teal-500/20 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse"></div>
            <img ngSrc="wallet/main/wallet-main.png" alt="wallet icon" width="128" height="128"
                class="relative z-10 w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] lg-float">
          </div>
        </div>

        <app-balance-wallet />

        <!-- Tab Bar -->
        <div class="lg-tab-bar p-1 bg-white/5 backdrop-blur-3xl rounded-[24px] border border-white/10">
          @for (tab of walletTabs; track tab.id) {
            <button (click)="activeTabStr.set(tab.id)" 
                    [class.lg-tab-item--active]="activeTabStr() === tab.id"
                    class="lg-tab-item flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all">
              {{ tab.label }}
            </button>
          }
        </div>

        <div class="flex-1 flex flex-col min-h-0">
          @if (activeTab() === 'depositar') {
            <div class="flex flex-col gap-4 animate-slide-up">
              @for (item of deposits(); track item.title) {
                <article (click)="onSheetItemClick(item)"
                  class="lg-module-card p-3 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer backdrop-blur-2xl border-white/10 rounded-2xl"
                  [style.background]="getDepositGradient(item.title)"
                  [style.border-color]="getDepositBorderColor(item.title)">
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden">
                      <img [ngSrc]="getDepositIcon(item.title)" alt="{{ item.title }}" width="80" height="80" class="w-full h-full object-contain scale-125 group-hover:scale-150 transition-all">
                    </div>
                    <div>
                      <h3 class="text-[11px] font-black text-white tracking-widest uppercase">{{ item.title }}</h3>
                      <p class="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mt-1">{{ item.desc }}</p>
                    </div>
                  </div>
                  <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-teal-500/20 transition-all">
                    <svg class="w-4 h-4 text-white/20 group-hover:text-teal-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </article>
              }
            </div>
          } @else if (activeTab() === 'retirar') {
            <div class="flex flex-col gap-4 animate-slide-up">
              @for (item of deposits(); track item.title) {
                <article (click)="onSheetItemClick(item)"
                  class="lg-module-card p-3 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer backdrop-blur-2xl border-white/10 rounded-2xl"
                  [style.background]="getDepositGradient(item.title)"
                  [style.border-color]="getDepositBorderColor(item.title)">
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden">
                      <img [ngSrc]="getDepositIcon(item.title)" alt="{{ item.title }}" width="80" height="80" class="w-full h-full object-contain scale-125 group-hover:scale-150 transition-all">
                    </div>
                    <div>
                      <h3 class="text-[11px] font-black text-white tracking-widest uppercase">{{ item.title }}</h3>
                      <p class="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mt-1">{{ item.desc }}</p>
                    </div>
                  </div>
                  <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-teal-500/20 transition-all">
                    <svg class="w-4 h-4 text-white/20 group-hover:text-teal-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </article>
              }
            </div>
          } @else if (activeTab() === 'historial') {
            <div class="flex flex-col gap-4 animate-slide-up pb-8">

              <!-- Filter Buttons -->
              <div class="lg-tab-bar p-1 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 self-center mb-2">
                <button (click)="historyFilter.set('all')" [class.lg-tab-item--active]="historyFilter() === 'all'" class="lg-tab-item flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest transition-all">Todos</button>
                <button (click)="historyFilter.set('deposit')" [class.lg-tab-item--active]="historyFilter() === 'deposit'" class="lg-tab-item flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest transition-all">Depósitos</button>
                <button (click)="historyFilter.set('withdrawal')" [class.lg-tab-item--active]="historyFilter() === 'withdrawal'" class="lg-tab-item flex-1 py-2 px-4 text-[10px] font-black uppercase tracking-widest transition-all">Retiros</button>
              </div>

              @if (isLoadingHistory()) {
                <div class="lg-panel p-16 text-center opacity-50 border-white/5">
                  <p class="text-[9px] font-black text-white uppercase tracking-[0.4em]">Cargando...</p>
                </div>
              } @else if (historyTransactions().length === 0) {
                <div class="lg-panel p-16 text-center opacity-20 border-white/5">
                  <p class="text-[9px] font-black text-white uppercase tracking-[0.4em]">Empty Ledger</p>
                </div>
              } @else {
                @for (tx of historyTransactions(); track tx.id) {
                  <div class="lg-module-card p-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl group transition-all hover:bg-white/10 hover:border-white/20 active:scale-[0.99]">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <!-- Icon -->
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center border"
                            [ngClass]="{
                              'bg-cyan-500/10 border-cyan-500/20': tx.type === 'deposit',
                              'bg-pink-500/10 border-pink-500/20': tx.type === 'withdrawal'
                            }">
                          @if (tx.type === 'deposit') {
                            <svg class="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M12 2v10m0 0l-4-4m4 4l4-4"/>
                              <path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6"/>
                            </svg>
                          } @else {
                            <svg class="w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M12 12v-10m0 0l-4 4m4-4l4 4"/>
                              <path d="M4 12v6a2 2 0 002 2h12a2 2 0 002-2v-6"/>
                            </svg>
                          }
                        </div>
                        <!-- Info -->
                        <div>
                          <h4 class="text-[11px] font-black text-white uppercase tracking-wider">{{ tx.method }}</h4>
                          <span class="text-[8px] text-white/40 font-semibold uppercase tracking-[0.1em] mt-0.5 block">{{ tx.formattedDate }}</span>
                        </div>
                      </div>
        <!-- Amount & Status -->
        <div class="flex flex-col items-end">
          <span class="text-base font-black tracking-tighter text-glow" [class.text-emerald-400]="tx.type === 'deposit'" [class.text-red-400]="tx.type === 'withdrawal'">
            {{ tx.type === 'deposit' ? '+' : '-' }}{{ tx.displayAmount | number: tx.displayCurrency === 'COP' ? '1.0-0' : '1.2-2' }} <span class="text-[9px] opacity-50 uppercase tracking-normal">{{ tx.displayCurrency === 'COP' ? 'COP' : tx.displayCurrency }}</span>
          </span>
                        <span class="mt-1 px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-[0.1em] border"
                            [class.bg-emerald-500/10]="tx.status === 'completed'" [class.text-emerald-400]="tx.status === 'completed'" [class.border-emerald-500/20]="tx.status === 'completed'"
                            [class.bg-amber-500/10]="tx.status === 'pending'" [class.text-amber-400]="tx.status === 'pending'" [class.border-amber-500/20]="tx.status === 'pending'"
                            [class.bg-red-500/10]="tx.status === 'failed'" [class.text-red-400]="tx.status === 'failed'" [class.border-red-500/20]="tx.status === 'failed'">
                            {{ tx.statusLabel }}
                        </span>
                      </div>
                    </div>
                  </div>
                }
              }
            </div>
          }
        </div>
      </div>

      <!-- Volo Sheet -->
      <app-glass-sheet [isOpen]="isSheetOpen()" [title]="selectedDeposit()?.title ?? 'PROTOCOL'" maxHeight="85vh" (closed)="closeSheet()">
        <div class="w-full flex flex-col gap-4">
          @switch (sheetContent()) {
            @case ('colombia') {
              <div class="flex flex-col gap-4">
                <p class="text-[10px] text-white/50 font-black uppercase tracking-widest px-2 mb-1">Deposita dentro de alguno de estos métodos</p>
                <div class="grid grid-cols-1 gap-3">
                  <article (click)="onSheetItemClick({title: 'Nequi', desc: '', icon: ''})"
                    class="lg-module-card p-4 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer backdrop-blur-2xl rounded-2xl accent-teal">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                        <img ngSrc="wallet/colombia/nequi.webp" alt="Nequi" width="32" height="32" class="w-8 h-8 object-contain drop-shadow-lg group-hover:scale-110 transition-transform">
                      </div>
                      <div>
                        <h3 class="text-[12px] font-black text-white tracking-widest uppercase mb-1">Nequi</h3>
                        <p class="text-[8px] text-white/50 font-bold uppercase tracking-widest">Recarga con Nequi desde 30000</p>
                      </div>
                    </div>
                    <div class="w-6 h-6 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                      <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </article>

                  <article (click)="onSheetItemClick({title: 'Daviplata', desc: '', icon: ''})"
                    class="lg-module-card p-4 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer backdrop-blur-2xl rounded-2xl"
                    style="background: linear-gradient(to right, rgba(239,68,68,0.20) 0%, rgba(239,68,68,0.18) 25%, rgba(239,68,68,0.08) 55%, transparent 75%); border-color: rgba(239,68,68,0.30);">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                        <img ngSrc="wallet/colombia/daviplata.webp" alt="Daviplata" width="32" height="32" class="w-8 h-8 object-contain drop-shadow-lg group-hover:scale-110 transition-transform">
                      </div>
                      <div>
                        <h3 class="text-[12px] font-black text-white tracking-widest uppercase mb-1">Daviplata</h3>
                        <p class="text-[8px] text-white/50 font-bold uppercase tracking-widest">Recarga con Daviplata desde 30000</p>
                      </div>
                    </div>
                    <div class="w-6 h-6 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                      <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </article>

                  @if (activeTab() === 'depositar') {
                  <article (click)="onSheetItemClick({title: 'BRE-B', desc: '', icon: ''})"
                    class="lg-module-card p-4 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer backdrop-blur-2xl rounded-2xl"
                    style="background: linear-gradient(to right, rgba(234,179,8,0.20) 0%, rgba(234,179,8,0.18) 25%, rgba(234,179,8,0.08) 55%, transparent 75%); border-color: rgba(234,179,8,0.30);">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                        <img ngSrc="wallet/colombia/bre-b.webp" alt="BRE-B" width="32" height="32" class="w-8 h-8 object-contain drop-shadow-lg group-hover:scale-110 transition-transform">
                      </div>
                      <div>
                        <h3 class="text-[12px] font-black text-white tracking-widest uppercase mb-1">BRE-B</h3>
                        <p class="text-[8px] text-white/50 font-bold uppercase tracking-widest">Recarga con BRE-B desde 30000</p>
                      </div>
                    </div>
                    <div class="w-6 h-6 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                      <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </article>
                  }
                </div>
              </div>
            }
            @case ('peru') {
              <div class="flex flex-col gap-4">
                <p class="text-[10px] text-white/50 font-black uppercase tracking-widest px-2 mb-1">Explora otras formas de depósito.</p>
                <div class="grid grid-cols-1 gap-3">
                  <article (click)="onSheetItemClick({title: 'Plin', desc: '', icon: ''})"
                    class="lg-module-card p-4 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer backdrop-blur-2xl rounded-2xl"
                    style="background: linear-gradient(to right, rgba(6,182,212,0.20) 0%, rgba(6,182,212,0.18) 25%, rgba(6,182,212,0.08) 55%, transparent 75%); border-color: rgba(6,182,212,0.30);">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                        <img ngSrc="wallet/peru/plin.webp" alt="Plin" width="32" height="32" class="w-8 h-8 object-contain drop-shadow-lg group-hover:scale-110 transition-transform">
                      </div>
                      <div>
                        <h3 class="text-[12px] font-black text-white tracking-widest uppercase mb-1">Plin</h3>
                        <p class="text-[8px] text-white/50 font-bold uppercase tracking-widest">Deposita desde 30Soles</p>
                      </div>
                    </div>
                    <div class="w-6 h-6 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                      <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </article>

                  <article (click)="onSheetItemClick({title: 'Yape', desc: '', icon: ''})"
                    class="lg-module-card p-4 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer backdrop-blur-2xl rounded-2xl"
                    style="background: linear-gradient(to right, rgba(168,85,247,0.20) 0%, rgba(168,85,247,0.18) 25%, rgba(168,85,247,0.08) 55%, transparent 75%); border-color: rgba(168,85,247,0.30);">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                        <img ngSrc="wallet/peru/yape.png" alt="Yape" width="32" height="32" class="w-8 h-8 object-contain drop-shadow-lg group-hover:scale-110 transition-transform">
                      </div>
                      <div>
                        <h3 class="text-[12px] font-black text-white tracking-widest uppercase mb-1">Yape</h3>
                        <p class="text-[8px] text-white/50 font-bold uppercase tracking-widest">Deposita desde 30Soles</p>
                      </div>
                    </div>
                    <div class="w-6 h-6 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                      <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </article>
                </div>
              </div>
            }
            @case ('cryptos') {
              <div class="flex flex-col gap-4">
                <p class="text-[10px] text-white/50 font-black uppercase tracking-widest px-2 mb-1">Selecciona la moneda</p>
                <div class="grid grid-cols-1 gap-3">
                  @for (coin of ['USDT']; track coin) {
                    <article (click)="onSheetItemClick({title: coin, desc: '', icon: ''})"
                      class="lg-module-card p-4 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer backdrop-blur-2xl rounded-2xl"
                      style="background: linear-gradient(to right, rgba(245,158,11,0.20) 0%, rgba(245,158,11,0.18) 25%, rgba(245,158,11,0.08) 55%, transparent 75%); border-color: rgba(245,158,11,0.30);">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                          <img [ngSrc]="'wallet/crypto/' + coin.toLowerCase() + '.png'" [alt]="coin" width="32" height="32" class="w-8 h-8 object-contain drop-shadow-lg group-hover:scale-110 transition-transform">
                        </div>
                        <div>
                          <h3 class="text-[12px] font-black text-white tracking-widest uppercase mb-1">{{ coin }}</h3>
                          <p class="text-[8px] text-white/50 font-bold uppercase tracking-widest">Red soportada nativa</p>
                        </div>
                      </div>
                      <div class="w-6 h-6 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                        <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </article>
                  }
                </div>
              </div>
            }
            @case ('cryptos-withdraw') {
              <div class="flex flex-col gap-4">
                <p class="text-[10px] text-white/50 font-black uppercase tracking-widest px-2 mb-1">Selecciona la moneda a retirar</p>
                <div class="grid grid-cols-1 gap-3">
                  @for (coin of ['USDT']; track coin) {
                    <article (click)="onSheetItemClick({title: coin, desc: '', icon: ''})"
                      class="lg-module-card p-4 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer backdrop-blur-2xl rounded-2xl"
                      style="background: linear-gradient(to right, rgba(245,158,11,0.20) 0%, rgba(245,158,11,0.18) 25%, rgba(245,158,11,0.08) 55%, transparent 75%); border-color: rgba(245,158,11,0.30);">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                          <img [ngSrc]="'wallet/crypto/' + coin.toLowerCase() + '.png'" [alt]="coin" width="32" height="32" class="w-8 h-8 object-contain drop-shadow-lg group-hover:scale-110 transition-transform">
                        </div>
                        <div>
                          <h3 class="text-[12px] font-black text-white tracking-widest uppercase mb-1">{{ coin }}</h3>
                          <p class="text-[8px] text-white/50 font-bold uppercase tracking-widest">Red soportada nativa</p>
                        </div>
                      </div>
                      <div class="w-6 h-6 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                        <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </article>
                  }
                </div>
              </div>
            }
          }
        </div>
      </app-glass-sheet>

      @if (showSupportChat()) {
        <app-support-chat class="fixed inset-0 z-[300]" (closeChat)="onCloseChat()" />
      }

    </section>
  `,
  styles: [`
    :host { display: block; }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1rem); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletComponent implements OnInit {
  private router = inject(Router);
  private userStatusService = inject(UserStatusService);
  private authService = inject(AuthService);
  private supportService = inject(SupportService);
  private walletService = inject(WalletService);
  private coreWallet = inject(CoreWalletService);

  readonly walletTabs: GlassTab[] = [
    { id: 'depositar', label: 'Depositar' },
    { id: 'historial', label: 'Historial' },
    { id: 'retirar', label: 'Retirar' },
  ];

  activeTabStr = signal<string>('depositar');
  activeTab = computed(() => this.activeTabStr() as 'depositar' | 'historial' | 'retirar');
  historyFilter = signal<'all' | 'deposit' | 'withdrawal'>('all');

  showSupportChat = signal(false);
  hasPendingMessages = this.supportService.hasPending;
  readonly balance = computed(() => this.userStatusService.wallet()?.principalBalance ?? 0);

  readonly depositMethods: Deposit[] = [
    { title: 'Colombia', desc: 'Depósitos instantáneos', icon: 'wallet/main/col.webp' },
    { title: 'Peru', desc: 'Depósitos instantáneos', icon: 'wallet/main/peru.png' },
    { title: 'Paypal', desc: 'Depósitos instantáneos', icon: 'wallet/main/paypal.webp' },
    { title: 'Cryptos', desc: 'Depósitos vía criptomonedas', icon: 'wallet/main/bynance.png' },
  ];

  deposits = computed(() => this.depositMethods);

  getDepositIcon(title: string): string {
    const icons: Record<string, string> = {
      'Colombia': 'wallet/main/col.webp',
      'Peru': 'wallet/main/peru.png',
      'Cryptos': 'wallet/main/bynance.png',
      'Paypal': 'wallet/main/paypal.webp',
    };
    return icons[title] || 'wallet/main/wallet-main.png';
  }

  getDepositGradient(title: string): string {
    const gradients: Record<string, string> = {
      'Colombia': 'linear-gradient(to right, rgba(20,184,166,0.20) 0%, rgba(20,184,166,0.18) 25%, rgba(20,184,166,0.08) 55%, transparent 75%)',
      'Peru': 'linear-gradient(to right, rgba(168,85,247,0.20) 0%, rgba(168,85,247,0.18) 25%, rgba(168,85,247,0.08) 55%, transparent 75%)',
      'Cryptos': 'linear-gradient(to right, rgba(245,158,11,0.20) 0%, rgba(245,158,11,0.18) 25%, rgba(245,158,11,0.08) 55%, transparent 75%)',
      'Paypal': 'linear-gradient(to right, rgba(239,68,68,0.20) 0%, rgba(239,68,68,0.18) 25%, rgba(239,68,68,0.08) 55%, transparent 75%)',
    };
    return gradients[title] ?? 'rgba(255,255,255,0.05)';
  }

  getDepositBorderColor(title: string): string {
    const colors: Record<string, string> = {
      'Colombia': 'rgba(20,184,166,0.30)',
      'Peru': 'rgba(168,85,247,0.30)',
      'Cryptos': 'rgba(245,158,11,0.30)',
      'Paypal': 'rgba(239,68,68,0.30)',
    };
    return colors[title] ?? 'rgba(255,255,255,0.10)';
  }

  readonly transactions = signal<Transaction[]>([]);
  readonly isLoadingHistory = signal<boolean>(false);

  historyTransactions = computed(() => {
    const txs = this.transactions();
    const filter = this.historyFilter();

    const filteredTxs = txs.filter(t => {
      if (filter === 'all') {
        return t.type === 'deposit' || t.type === 'withdrawal';
      }
      return t.type === filter;
    });

    return filteredTxs.map(t => {
      // Convert COP amount back to original currency based on methodId
      const conversion = this.getMethodConversion(t.type, t.methodId);
      const displayAmount = t.amount / conversion.factor;
      const displayCurrency = conversion.currency;
      const displaySymbol = conversion.symbol;

      return {
        ...t,
        displayAmount,
        displayCurrency,
        displaySymbol,
        statusLabel: this.getStatusLabel(t.status),
        formattedDate: this.formatDate(t.date),
      };
    });
  });

  // Conversion configuration for displaying original amounts
  // DEPOSIT IDs (FinanceMethod enum): 0=Crypto, 1=Nequi1, 2=Nequi2, 3=Nequi3, 4=Daviplata, 5=PayPal, 6=BRE-B, 7=Plin, 8=Yape
  // WITHDRAWAL IDs (methodId): 0=Nequi1, 1=Nequi2, 2=Nequi3, 3=Daviplata, 4=PayPal, 5=USDT-TRC20, 6=USDT-BEP20, 7=TRX, 8=BNB, 9=BTC, 10=Plin, 11=Yape
  private getMethodConversion(
    type: string,
    methodId?: number
  ): { factor: number; currency: string; symbol: string } {
    if (methodId == null) {
      return { factor: 1, currency: 'COP', symbol: '$' };
    }

    const rates = this.coreWallet.conversionRates();

    // DEPOSIT methods (0-8 from FinanceMethod enum)
    if (type === 'deposit') {
      switch (methodId) {
        case 0: return { factor: rates.usdToCOP, currency: 'USD', symbol: '$' }; // Crypto → USD
        case 1: case 2: case 3: return { factor: 1, currency: 'COP', symbol: '$' }; // Nequi
        case 4: return { factor: 1, currency: 'COP', symbol: '$' }; // Daviplata
        case 5: return { factor: rates.usdToCOP, currency: 'USD', symbol: '$' }; // PayPal
        case 6: return { factor: 1, currency: 'COP', symbol: '$' }; // BRE-B
        case 7: case 8: return { factor: rates.usdToSoles, currency: 'PEN', symbol: 'S/' }; // Plin/Yape
        default: return { factor: 1, currency: 'COP', symbol: '$' };
      }
    }

    // WITHDRAWAL methods (0-11 from withdraw-form methodId)
    switch (methodId) {
      case 0: case 1: case 2: return { factor: 1, currency: 'COP', symbol: '$' }; // Nequi
      case 3: return { factor: 1, currency: 'COP', symbol: '$' }; // Daviplata
      case 4: return { factor: rates.usdToCOP, currency: 'USD', symbol: '$' }; // PayPal
      case 5: case 6:                       // USDT TRC20 / BEP20
      case 7:                               // TRX
      case 8:                               // BNB
      case 9: return { factor: rates.usdToCOP, currency: 'USD', symbol: '$' }; // BTC
      case 10: case 11: return { factor: rates.usdToSoles, currency: 'PEN', symbol: 'S/' }; // Plin/Yape
      default: return { factor: 1, currency: 'COP', symbol: '$' };
    }
  }

  private loadConversions() {
    this.coreWallet.loadConversions();
  }

  selectedDeposit = signal<Deposit | null>(null);
  isSheetOpen = signal(false);
  sheetContent = signal<'default' | 'colombia' | 'cryptos' | 'cryptos-withdraw' | 'externos' | 'peru' | 'usdt-networks' | 'usdt-networks-withdraw'>('default');

  constructor() {
    // Debug effect - MUST be in constructor or injection context
    effect(() => {
      console.log('[Wallet] hasPendingMessages signal changed:', this.hasPendingMessages());
    });
  }

  ngOnInit() {
    // Check for pending messages on wallet initialization
    console.log('[Wallet] Checking pending messages...');
    this.supportService.checkForPendingMessages();
    this.refreshBalanceOnEntry();
    this.loadTransactionHistory();
    this.loadConversions();
  }

  private refreshBalanceOnEntry() {
    this.walletService.refreshBalance().subscribe({
      next: (response) => {
        console.log('[Wallet] Balance refreshed:', response);
        this.userStatusService.loadUserStatus();
      },
      error: (err) => {
        console.error('[Wallet] Failed to refresh balance:', err);
      }
    });
  }

  loadTransactionHistory() {
    this.isLoadingHistory.set(true);
    this.walletService.getTransactionHistory(50, 50).subscribe({
      next: (history) => {
        this.transactions.set(history);
        this.isLoadingHistory.set(false);
      },
      error: (err) => {
        console.error('Failed to load transaction history', err);
        this.isLoadingHistory.set(false);
      }
    });
  }

  navigateToSupport() { 
    this.showSupportChat.set(true);
    this.supportService.isChatOpen.set(true);
  }
  onCloseChat() { 
    this.showSupportChat.set(false);
    this.supportService.isChatOpen.set(false);
  }

  setTab(tab: 'historial' | 'depositar' | 'retirar') {
    if (tab !== 'depositar' && tab !== 'retirar' && this.isSheetOpen()) {
      this.closeSheet();
    }
    this.activeTabStr.set(tab);
  }

  onSheetItemClick(item: Deposit) {
    const tab = this.activeTab();
    if (tab !== 'depositar' && tab !== 'retirar') return;

    // Paypal va directo a transacción sin sheet
    if (item.title === 'Paypal') {
      this.navigateToTransaction(item.title, tab);
      return;
    }

    if (!this.isSheetOpen()) {
      this.selectedDeposit.set(item);
      if (item.title === 'Colombia') this.sheetContent.set('colombia');
      else if (item.title === 'Peru') this.sheetContent.set('peru');
      else if (item.title === 'Cryptos') {
        if (tab === 'depositar') {
          this.navigateToTransaction('USDT', tab);
        } else {
          this.sheetContent.set(tab === 'retirar' ? 'cryptos-withdraw' : 'cryptos');
        }
      }
      else this.sheetContent.set('default');
      this.isSheetOpen.set(true);
    } else {
      this.navigateToTransaction(item.title, tab);
    }
  }

  navigateToTransactionWithNetwork(currency: string, network: string, type: 'depositar' | 'retirar') {
    this.closeSheet();
    this.router.navigate(['/transaccion'], { queryParams: { currency, network, type } });
  }

  navigateToTransaction(currency: string, type: 'depositar' | 'retirar') {
    this.closeSheet();
    this.router.navigate(['/transaccion'], { queryParams: { currency, type } });
  }

  closeSheet() {
    this.isSheetOpen.set(false);
    this.selectedDeposit.set(null);
    this.sheetContent.set('default');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getStatusLabel(status: Transaction['status']): string {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      default: return status;
    }
  }
}
