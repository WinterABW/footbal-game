import { ChangeDetectionStrategy, Component, inject, signal, computed, input, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { UserStatusService } from '../../../../core/services/user-status.service';
import { WalletService } from '../../../../core/services/wallet.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SuccessOverlayComponent } from './success-overlay.component';
import { BalanceComponent } from '../../../../shared/components/balance/balance.component';

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
        <!-- Balance + Info side by side -->
        <div class="flex gap-3 pt-2">
          <div class="flex-1">
            <app-balance />
          </div>
          <div class="flex-1 flex flex-col justify-center gap-1.5 py-2">
            <div class="flex items-start gap-1.5">
              <span class="text-[7px] text-white/15 mt-0.5">●</span>
              <span class="text-[9px] font-bold text-white/30 uppercase tracking-wider">Mínimo de Retiro 15.000 COP</span>
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

  amountInputField = viewChild<ElementRef<HTMLInputElement>>('amountInputField');

  currency = input.required<string>();
  network = input<string>('');

  isProcessing = signal(false);
  showSuccess = signal(false);
  // transactionMessage signal removed, replaced by ErrorHandlerService
  amount = signal(0);
  selectedAccount = signal('');
  readonly balance = computed(() => this.userStatusService.wallet()?.principalBalance ?? 0);

  isCrypto = computed(() => ['USDT', 'BTC', 'TRX', 'BNB'].includes(this.currency()));
  currencyLogo = computed(() => {
    const logoMap: Record<string, string> = {
      'Nequi': 'wallet/colombia/nequi.webp', 'Daviplata': 'wallet/colombia/daviplata.webp',
      'Plin': 'wallet/peru/plin.png', 'Yape': 'wallet/peru/yape.png',
      'Paypal': 'wallet/main/paypal.webp',
      'USDT': 'wallet/crypto/usdt.png', 'TRX': 'wallet/crypto/trx.png',
      'BNB': 'wallet/crypto/bnb.png', 'BTC': 'wallet/crypto/btc.png',
    };
    return logoMap[this.currency()] || null;
  });

  private methodMap: Record<string, number> = {
    'Crypto': 0,
    'Nequi': 1,
    'Daviplata': 4,
    'Paypal': 5,
  };

  presetAmounts = computed(() => {
    const curr = this.currency();
    if (curr === 'USDT') return [10, 15, 25, 50, 100, 200];
    if (curr === 'TRX') return [30000, 50000, 80000, 100000, 200000, 500000];
    if (curr === 'BNB') return [0.02, 0.045, 0.08, 0.15, 0.3, 0.5];
    if (curr === 'BTC') return [0.0002, 0.0004, 0.0008, 0.0015, 0.003, 0.005];
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

  async pasteAddress(input: HTMLInputElement) {
    try {
      const text = await navigator.clipboard.readText();
      this.selectedAccount.set(text);
      input.value = text;
      this.errorHandler.showSuccessToast('Dirección pegada');
    } catch {
      this.errorHandler.showErrorToast('Error al pegar');
    }
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
    const token = this.authService.authToken();
    if (!user?.id || !token) {
      this.errorHandler.showErrorToast('Sesión expirada');
      return;
    }

    this.isProcessing.set(true);

    const result = await this.walletService.addWithdrawal({
      amountCOP: amount,
      methodId: this.methodMap[this.currency()] ?? 0,
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
