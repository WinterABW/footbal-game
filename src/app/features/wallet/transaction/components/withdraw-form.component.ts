import { ChangeDetectionStrategy, Component, inject, signal, computed, input, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { UserStatusService } from '../../../../core/services/user-status.service';
import { WalletService } from '../../../../core/services/wallet.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SuccessOverlayComponent } from './success-overlay.component';
import { BalanceComponent } from '../../../../shared/components/balance/balance.component';
import { ClipboardService } from '../../../../core/services/clipboard.service';
import { generateSignedToken } from '../../../../core/services/encryption.service';

@Component({
  selector: 'app-withdraw-form',
  imports: [CommonModule, SuccessOverlayComponent, BalanceComponent],
  template: `
    <div class="h-full flex flex-col relative w-full overflow-hidden bg-transparent">
      @if (showSuccess()) {
        <app-success-overlay
          [message]="'¡Retiro de ' + amount().toLocaleString() + ' monedas realizado con éxito!'"
        />
      }

      <!-- Custom toast removed, replaced by ErrorHandlerService -->

      <header class="w-full relative z-10 pt-safe-top px-5 h-14 flex items-center justify-between">
        <button (click)="goBack()" class="w-10 h-10 lg-icon-btn active:scale-90 transition-transform">
          <svg class="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div class="flex flex-col items-center">
          <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Pasarela</span>
          <h1 class="text-base font-black text-white tracking-tight text-glow uppercase">Retiro</h1>
        </div>
        <div class="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center overflow-hidden">
           @if (currencyLogo()) {
             <img [src]="currencyLogo()!" [alt]="currency()" width="28" height="28" class="object-contain" />
           } @else {
             <span class="text-[9px] font-black text-white/40">{{ currency() }}</span>
           }
        </div>
      </header>

      <main class="flex-1 w-full relative z-10 flex flex-col overflow-y-auto no-scrollbar pb-28 px-5 gap-4 animate-slide-up">
        <!-- Channel Selection (Nequi 1/2/3 or USDT TRC20/BEP20) -->
        @if (showChannelSelector()) {
          <div class="lg-card-panel p-4 flex flex-col gap-3">
            <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">
              {{ currency() === 'Nequi' ? 'Selecciona el canal Nequi' : 'Selecciona la red USDT' }}
            </span>
            <div class="flex gap-2">
              @for (channel of channelOptions(); track channel) {
                <button
                  (click)="selectChannel(channel)"
                  class="flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                  [class]="selectedChannel() === channel 
                    ? 'bg-indigo-500/20 border border-indigo-500/60 text-white' 
                    : 'bg-white/[0.03] border border-white/[0.08] text-white/40 hover:border-white/20'"
                >
                  {{ channel }}
                </button>
              }
            </div>
          </div>
        }

        <!-- Balance + Info side by side -->
        <div class="flex gap-3 pt-2">
          <div class="flex-1">
            <app-balance />
          </div>
          <div class="flex-1 flex flex-col justify-center gap-1.5 py-2">
            <div class="flex items-start gap-1.5">
              <span class="text-[7px] text-white/15 mt-0.5">●</span>
              <span class="text-[9px] font-bold text-white/30 uppercase tracking-wider">Mínimo de Retiro 15.000 {{ currencyLabel() }}</span>
            </div>
            <div class="flex items-start gap-1.5">
              <span class="text-[7px] text-white/15 mt-0.5">●</span>
              <span class="text-[9px] font-bold text-white/30 uppercase tracking-wider">Comisión de Retiro 8%</span>
            </div>
            <div class="flex items-start gap-1.5">
              <span class="text-[7px] text-white/15 mt-0.5">●</span>
              <span class="text-[9px] font-bold text-white/30 uppercase tracking-wider">Cada Retiro puede tardar hasta 72H</span>
            </div>
            @if (isCrypto()) {
              <div class="flex items-start gap-1.5">
                <span class="text-[7px] text-white/15 mt-0.5">●</span>
                <span class="text-[9px] font-bold text-white/30 uppercase tracking-wider">El retiro será efectuado al cambio actual de COP/{{ currency() }}</span>
              </div>
            }
            @if (currency() === 'Paypal') {
              <div class="flex items-start gap-1.5">
                <span class="text-[7px] text-white/15 mt-0.5">●</span>
                <span class="text-[9px] font-bold text-white/30 uppercase tracking-wider">El retiro se hará al cambio de COP/USD</span>
              </div>
            }
          </div>
        </div>

        <!-- Amount Input -->
        <div class="lg-card-panel p-5 flex flex-col items-center gap-4">
           <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Cifra a Retirar</span>
           <div class="flex items-center gap-3 border-b border-white/10 pb-3 w-full justify-center">
             <span class="text-xl font-black text-white/20">$</span>
             <input #amountInputField
              type="number"
              class="bg-transparent border-none outline-none text-3xl font-black text-white text-center w-full max-w-[180px]"
              placeholder="0"
              [value]="amount()"
              (input)="onAmountChange($event)"
              [disabled]="isProcessing()"
             />
           </div>

           <div class="grid grid-cols-3 gap-2 w-full">
            @for (preset of presetAmounts(); track preset) {
              <button (click)="setAmount(preset)" class="px-2 py-2.5 lg-btn-outline !border-white/10 !rounded-xl text-[9px] font-black text-white/50 hover:text-white hover:bg-white/5 transition-all outline-none">
                {{ preset | number }}
              </button>
            }
           </div>
        </div>

        <!-- Destination Account -->
        <div class="lg-card-panel p-4 flex flex-col gap-3">
           <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Datos de Destino</span>
           <div class="relative w-full">
             <input #accountInput
              type="text"
              class="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-[11px] font-bold text-white outline-none focus:border-indigo-500/40 transition-all tracking-wide"
              [value]="selectedAccount()"
              (input)="onAccountChange($event.target.value)"
              placeholder="Cuenta o Billetera"
              [disabled]="isProcessing()"
             />
             <button (click)="pasteAddress(accountInput)" class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/5 rounded-lg transition-colors">
               <span class="text-[8px] font-black text-white/30 uppercase tracking-widest">Pegar</span>
             </button>
           </div>
        </div>
      </main>

      <footer class="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-5 z-50 bg-gradient-to-t from-[#010208] via-[#010208]/80 to-transparent">
        <button class="lg-btn-primary w-full py-4 text-[13px] shadow-indigo-500/20" (click)="processWithdraw()" [disabled]="isProcessing()">
          {{ isProcessing() ? 'Transmitiendo...' : 'Ejecutar Retiro' }}
        </button>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1rem); }
    .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    /* .animate-shake removed as it was only used by the custom toast */
    .text-glow-amber { text-shadow: 0 0 15px rgba(251, 191, 36, 0.4); }
    input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithdrawFormComponent {
  private router = inject(Router);
  private userStatusService = inject(UserStatusService);
  private walletService = inject(WalletService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);
  private clipboardService = inject(ClipboardService);

  amountInputField = viewChild<ElementRef<HTMLInputElement>>('amountInputField');

  currency = input.required<string>();
  network = input<string>('');

  isProcessing = signal(false);
  showSuccess = signal(false);
  // transactionMessage signal removed, replaced by ErrorHandlerService
  amount = signal(0);
  selectedAccount = signal('');
  readonly balance = computed(() => this.userStatusService.wallet()?.principalBalance ?? 0);

  // Channel selection: show for Nequi (0-2) and USDT (5-6)
  showChannelSelector = computed(() => {
    const c = this.currency();
    return c === 'Nequi' || c === 'USDT';
  });

  channelOptions = computed(() => {
    const c = this.currency();
    if (c === 'Nequi') return ['Nequi-1', 'Nequi-2', 'Nequi-3'];
    if (c === 'USDT') return ['TRC20', 'BEP20'];
    return [];
  });

  isCrypto = computed(() => ['USDT', 'BTC', 'TRX', 'BNB'].includes(this.currency()));

  currencyLabel = computed(() => {
    const c = this.currency();
    const colombian = ['Nequi', 'Daviplata', 'BRE-B'];
    const peruvian = ['Plin', 'Yape'];
    if (colombian.includes(c)) return 'COP';
    if (peruvian.includes(c)) return 'SOL';
    return 'USD'; // PayPal & crypto
  });

  currencyLogo = computed(() => this.logoMap[this.currency()] || null);

  // === Channel selection for withdrawal methods ===
  // Nequi: 0=Nequi1, 1=Nequi2, 2=Nequi3
  // USDT: 5=TRC20, 6=BEP20
  selectedChannel = signal<string>('');

  getMethodId(): number {
    const currency = this.currency();
    const channel = this.selectedChannel();

    // Nequi channels
    if (currency === 'Nequi') {
      if (channel === 'Nequi-2') return 1;
      if (channel === 'Nequi-3') return 2;
      return 0; // Nequi-1 default
    }

    // USDT channels
    if (currency === 'USDT') {
      if (channel === 'BEP20') return 6;
      return 5; // TRC20 default
    }

    // Other methods use the static map
    return this.methodMap[currency] ?? 0;
  }

  // Withdrawal method IDs for https://fifabanket.shop/Wallet/addWithdrawl
  // 0: Nequi 1, 1: Nequi 2, 2: Nequi 3, 3: Daviplata, 4: PayPal
  // 5: USDT TRC20, 6: USDT BEP20, 7: TRX, 8: BNB, 9: BTC
  // 10: Plin, 11: Yape
  private methodMap: Record<string, number> = {
    'Nequi': 0,
    'Daviplata': 3,
    'Paypal': 4,
    'USDT': 5,
    'TRX': 7,
    'BNB': 8,
    'BTC': 9,
    'Plin': 10,
    'Yape': 11,
  };

  private logoMap: Record<string, string> = {
    'Nequi': 'wallet/colombia/nequi.webp',
    'Daviplata': 'wallet/colombia/daviplata.webp',
    'Plin': 'wallet/peru/plin.webp',
    'Yape': 'wallet/peru/yape.png',
    'Paypal': 'wallet/main/paypal.webp',
    'USDT': 'wallet/crypto/usdt.png',
    'TRX': 'wallet/crypto/trx.png',
    'BNB': 'wallet/crypto/bnb.png',
    'BTC': 'wallet/crypto/btc.png',
  };

  presetAmounts = computed(() => {
    const curr = this.currency();
    if (curr === 'USDT' || curr === 'TRX' || curr === 'BNB' || curr === 'BTC') return [10, 25, 50, 100, 200, 500]; // USD
    if (curr === 'Plin' || curr === 'Yape') return [30, 50, 80, 100, 150, 200];
    return [30000, 50000, 80000, 100000, 200000, 500000];
  });

  onAmountChange(event: Event) { this.amount.set(Number((event.target as HTMLInputElement).value)); }
  setAmount(newAmount: number) {
    this.amount.set(newAmount);
    const inputEl = this.amountInputField();
    if (inputEl) inputEl.nativeElement.value = String(newAmount);
  }
  onAccountChange(account: string) { this.selectedAccount.set(account); }

  selectChannel(channel: string) { this.selectedChannel.set(channel); }

  pasteAddress(input: HTMLInputElement) {
    this.clipboardService.readText((text: string | null) => {
      if (text) {
        this.selectedAccount.set(text);
        input.value = text;
        this.errorHandler.showSuccessToast('Dirección pegada');
      } else if (text === '') {
        this.errorHandler.showToast('No hay texto para pegar.', 'info');
      }
    });
  }

  goBack() { this.router.navigate(['/wallet']); }

  async processWithdraw() {
    const amount = this.amount();
    if (amount <= 0) {
      this.errorHandler.showErrorToast('Monto inválido');
      return;
    }
    if (this.balance() < amount) {
      this.errorHandler.showErrorToast('Saldo insuficiente');
      return;
    }
    if (!this.selectedAccount()) {
      this.errorHandler.showErrorToast('Especifica destino');
      return;
    }

    const user = this.authService.user();
    if (!user?.id) {
      this.errorHandler.showErrorToast('Sesión expirada');
      return;
    }

    this.isProcessing.set(true);

    const timestamp = Math.floor(Date.now() / 1000);
    const token = await generateSignedToken(user.id, timestamp);

    // Convert non-COP currencies to COP using API rates
    const rates = this.walletService.conversionRates();
    const currency = this.currency();
    let amountCOP = amount;
    if (currency === 'Paypal' || currency === 'USDT' || currency === 'TRX' || currency === 'BNB' || currency === 'BTC') {
      amountCOP = amount * rates.usdToCOP;
    } else if (currency === 'Plin' || currency === 'Yape') {
      amountCOP = amount * rates.usdToSoles;
    }

    const result = await this.walletService.addWithdrawal({
      amountCOP: amountCOP,
      methodId: this.getMethodId(),
      token,
      uid: user.id,
      walletAdress: this.selectedAccount(),
    });

    this.isProcessing.set(false);

    if (!result.success) {
      this.errorHandler.showErrorToast(result.error ?? 'Error al procesar el retiro');
      return;
    }

    this.showSuccess.set(true);
    await this.userStatusService.loadUserStatus();
    setTimeout(() => this.router.navigate(['/wallet']), 1500);
  }
}
