import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { UserStatusService } from '../../core/services/user-status.service';
import { Transaction } from '../../models/transaction.model';
import { SupportChatComponent } from './support-chat.component';
import { BalanceWalletComponent } from '../../shared/components/balance-wallet/balance-wallet.component';
import { GlassTabBarComponent, GlassTab, GlassSheetComponent } from '../../shared/ui';

interface Deposit {
  title: string;
  desc: string;
  icon: string;
}

@Component({
  selector: 'app-wallet',
  imports: [NgOptimizedImage, CommonModule, SupportChatComponent, BalanceWalletComponent, GlassSheetComponent],
  template: `
    <section class="h-dvh flex flex-col relative w-full overflow-hidden bg-transparent">

      <!-- Support button (floating top-right) -->
      <button (click)="navigateToSupport()" class="absolute top-0 right-5 mt-[calc(env(safe-area-inset-top,0px)+1.5rem)] z-20 w-12 h-12 lg-icon-btn flex items-center justify-center active:scale-90 transition-transform p-0.5">
        <img ngSrc="shared/icons/support.webp" alt="Soporte" width="32" height="32" class="rounded-full object-cover w-full h-full" />
      </button>

      <div class="flex-1 w-full relative z-10 flex flex-col overflow-y-auto no-scrollbar pt-safe-top pb-24 px-5 gap-2">

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
              @if (historyTransactions().length === 0) {
                <div class="lg-panel p-16 text-center opacity-20 border-white/5">
                  <p class="text-[9px] font-black text-white uppercase tracking-[0.4em]">Empty Ledger</p>
                </div>
              } @else {
                @for (tx of historyTransactions(); track tx.id) {
                  <div class="lg-module-card p-6 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px]">
                    <div class="flex justify-between items-start mb-6">
                      <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm border border-white/5">
                          {{ tx.type === 'deposit' ? '📥' : '📤' }}
                        </div>
                        <div>
                          <h4 class="text-[10px] font-black text-white uppercase tracking-wider">{{ tx.type === 'deposit' ? 'Inbound' : 'Outbound' }}</h4>
                          <span class="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mt-1 block">{{ tx.formattedDate }}</span>
                        </div>
                      </div>
                      <span class="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border backdrop-blur-md"
                        [class.bg-emerald-500/10]="tx.status === 'completed'" [class.text-emerald-400]="tx.status === 'completed'" [class.border-emerald-500/20]="tx.status === 'completed'"
                        [class.bg-amber-500/10]="tx.status === 'pending'" [class.text-amber-400]="tx.status === 'pending'" [class.border-amber-500/20]="tx.status === 'pending'">
                        {{ tx.statusLabel }}
                      </span>
                    </div>

                    <div class="flex items-center justify-between pt-5 border-t border-white/5">
                      <span class="text-[8px] font-black text-white/10 uppercase tracking-[0.3em]">{{ tx.method }}</span>
                      <span class="text-2xl font-black tracking-tighter text-glow" [class.text-emerald-400]="tx.type === 'deposit'" [class.text-red-400]="tx.type === 'withdrawal'">
                        {{ tx.type === 'deposit' ? '+' : '-' }}{{ tx.amount | number }} <span class="text-[9px] opacity-40 ml-0.5 uppercase tracking-normal">{{ tx.currency }}</span>
                      </span>
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
                        <img ngSrc="wallet/colombia/nequi.png" alt="Nequi" width="32" height="32" class="w-8 h-8 object-contain drop-shadow-lg group-hover:scale-110 transition-transform">
                      </div>
                      <div>
                        <h3 class="text-[12px] font-black text-white tracking-widest uppercase mb-1">Nequi</h3>
                        <p class="text-[8px] text-white/50 font-bold uppercase tracking-widest">Recarga con Nequi desde 2500</p>
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
                        <img ngSrc="wallet/colombia/daviplata.png" alt="Daviplata" width="32" height="32" class="w-8 h-8 object-contain drop-shadow-lg group-hover:scale-110 transition-transform">
                      </div>
                      <div>
                        <h3 class="text-[12px] font-black text-white tracking-widest uppercase mb-1">Daviplata</h3>
                        <p class="text-[8px] text-white/50 font-bold uppercase tracking-widest">Recarga con Daviplata desde 2500</p>
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
            @case ('peru') {
              <div class="flex flex-col gap-4">
                <p class="text-[10px] text-white/50 font-black uppercase tracking-widest px-2 mb-1">Explora otras formas de depósito.</p>
                <div class="grid grid-cols-1 gap-3">
                  <article (click)="onSheetItemClick({title: 'Plin', desc: '', icon: ''})"
                    class="lg-module-card p-4 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer backdrop-blur-2xl rounded-2xl"
                    style="background: linear-gradient(to right, rgba(6,182,212,0.20) 0%, rgba(6,182,212,0.18) 25%, rgba(6,182,212,0.08) 55%, transparent 75%); border-color: rgba(6,182,212,0.30);">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
                        <img ngSrc="wallet/peru/plin.png" alt="Plin" width="32" height="32" class="w-8 h-8 object-contain drop-shadow-lg group-hover:scale-110 transition-transform">
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
                  @for (coin of ['USDT', 'TRX', 'BNB', 'BTC']; track coin) {
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
                  @for (coin of ['USDT', 'TRX', 'BNB', 'BTC']; track coin) {
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
export class WalletComponent {
  private router = inject(Router);
  private userStatusService = inject(UserStatusService);

  readonly walletTabs: GlassTab[] = [
    { id: 'depositar', label: 'Depositar' },
    { id: 'historial', label: 'Historial' },
    { id: 'retirar', label: 'Retirar' },
  ];

  activeTabStr = signal<string>('depositar');
  activeTab = computed(() => this.activeTabStr() as 'depositar' | 'historial' | 'retirar');

  showSupportChat = signal(false);
  readonly balance = computed(() => this.userStatusService.wallet()?.principalBalance ?? 0);

  readonly depositMethods: Deposit[] = [
    { title: 'Colombia', desc: 'Depósitos instantáneos', icon: 'wallet/main/col.webp' },
    { title: 'Perú', desc: 'Depósitos instantáneos', icon: 'wallet/main/peru.png' },
    { title: 'Cryptos', desc: 'Depósitos vía criptomonedas', icon: 'wallet/main/bynance.png' },
  ];

  deposits = computed(() => this.depositMethods);

  getDepositIcon(title: string): string {
    const icons: Record<string, string> = {
      'Colombia': 'wallet/main/col.webp',
      'Cryptos': 'wallet/main/bynance.png',
      'Perú': 'wallet/main/peru.png',
    };
    return icons[title] || 'wallet/main/wallet-main.png';
  }

  getDepositGradient(title: string): string {
    const gradients: Record<string, string> = {
      'Colombia': 'linear-gradient(to right, rgba(20,184,166,0.20) 0%, rgba(20,184,166,0.18) 25%, rgba(20,184,166,0.08) 55%, transparent 75%)',
      'Cryptos': 'linear-gradient(to right, rgba(245,158,11,0.20) 0%, rgba(245,158,11,0.18) 25%, rgba(245,158,11,0.08) 55%, transparent 75%)',
      'Perú': 'linear-gradient(to right, rgba(239,68,68,0.20) 0%, rgba(239,68,68,0.18) 25%, rgba(239,68,68,0.08) 55%, transparent 75%)',
    };
    return gradients[title] ?? 'rgba(255,255,255,0.05)';
  }

  getDepositBorderColor(title: string): string {
    const colors: Record<string, string> = {
      'Colombia': 'rgba(20,184,166,0.30)',
      'Cryptos': 'rgba(245,158,11,0.30)',
      'Perú': 'rgba(239,68,68,0.30)',
    };
    return colors[title] ?? 'rgba(255,255,255,0.10)';
  }

  readonly transactions = signal<Transaction[]>([]);

  historyTransactions = computed(() => {
    const txs = this.transactions();
    return txs
      .filter((t): t is Transaction => t.type === 'deposit' || t.type === 'withdrawal')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(t => ({
        ...t,
        statusLabel: this.getStatusLabel(t.status),
        formattedDate: this.formatDate(t.date),
      }));
  });

  selectedDeposit = signal<Deposit | null>(null);
  isSheetOpen = signal(false);
  sheetContent = signal<'default' | 'colombia' | 'cryptos' | 'cryptos-withdraw' | 'externos' | 'peru' | 'usdt-networks' | 'usdt-networks-withdraw'>('default');

  constructor() { }

  navigateToSupport() { this.showSupportChat.set(true); }
  onCloseChat() { this.showSupportChat.set(false); }

  setTab(tab: 'historial' | 'depositar' | 'retirar') {
    if (tab !== 'depositar' && tab !== 'retirar' && this.isSheetOpen()) {
      this.closeSheet();
    }
    this.activeTabStr.set(tab);
  }

  onSheetItemClick(item: Deposit) {
    const tab = this.activeTab();
    if (tab !== 'depositar' && tab !== 'retirar') return;

    if (!this.isSheetOpen()) {
      this.selectedDeposit.set(item);
      if (item.title === 'Colombia') this.sheetContent.set('colombia');
      else if (item.title === 'Cryptos') this.sheetContent.set(tab === 'retirar' ? 'cryptos-withdraw' : 'cryptos');
      else if (item.title === 'Perú') this.sheetContent.set('peru');
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
