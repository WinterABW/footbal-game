import { ChangeDetectionStrategy, Component, inject, signal, computed, input, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserStatusService } from '../../../../core/services/user-status.service';
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

      @if (transactionMessage() && !showSuccess() && !isProcessing()) {
        <div class="fixed top-24 left-1/2 -translate-x-1/2 z-[200] lg-module-card px-6 py-4 border-red-500/20 bg-red-500/[0.025] text-red-400 text-[11px] font-black uppercase tracking-widest animate-shake text-center whitespace-nowrap">
          {{ transactionMessage() }}
        </div>
      }

      <header class="w-full relative z-10 pt-safe-top mt-8 px-6 flex justify-between items-center py-6 mb-4">
        <button (click)="goBack()" class="w-12 h-12 lg-icon-btn active:scale-90 transition-transform">
          <svg class="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div class="flex flex-col items-center">
          <span class="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Pasarela</span>
          <h1 class="text-2xl font-black text-white tracking-tight text-glow uppercase">Retiro</h1>
        </div>
        <div class="w-12 h-12 lg-module-card flex items-center justify-center overflow-hidden text-[10px] font-black text-white/40">
           @if (currencyLogo()) {
             <img [src]="currencyLogo()!" [alt]="currency()" width="32" height="32" class="object-contain" />
           } @else {
             {{ currency() }}
           }
        </div>
      </header>

      <main class="flex-1 w-full relative z-10 flex flex-col overflow-y-auto no-scrollbar pb-40 px-6 gap-8 animate-slide-up">
        <!-- Balance Display -->
        <app-balance />

        <!-- Amount Input -->
        <div class="lg-card-panel p-8 flex flex-col items-center gap-6">
           <span class="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Cifra a Retirar</span>
           <div class="flex items-center gap-4 border-b border-white/10 pb-4 w-full justify-center">
             <span class="text-2xl font-black text-white/20">$</span>
             <input #amountInputField
              type="number" 
              class="bg-transparent border-none outline-none text-4xl font-black text-white text-center w-full max-w-[200px]"
              placeholder="0"
              [value]="amount()"
              (input)="onAmountChange($event)"
              [disabled]="isProcessing()"
             />
           </div>

           <!-- Presets -->
           <div class="grid grid-cols-3 gap-3 w-full">
            @for (preset of presetAmounts(); track $index) {
              <button (click)="setAmount(preset)" class="px-2 py-3 lg-btn-outline !border-white/10 !rounded-2xl text-[10px] font-black text-white/50 hover:text-white hover:bg-white/5 transition-all outline-none">
                {{ preset | number }}
              </button>
            }
           </div>
        </div>

        <!-- Destination Account -->
        <div class="lg-card-panel p-6 flex flex-col gap-4">
           <span class="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Datos de Destino</span>
           <div class="relative w-full">
             <input #accountInput
              type="text" 
              class="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-[11px] font-bold text-white outline-none focus:border-indigo-500/40 transition-all tracking-wide"
              [value]="selectedAccount()"
              (input)="onAccountChange($event.target.value)"
              placeholder="Cuenta o Billetera"
              [disabled]="isProcessing()"
             />
             <button (click)="pasteAddress(accountInput)" class="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-xl transition-colors">
                <svg class="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
             </button>
           </div>
        </div>
      </main>

      <footer class="fixed bottom-0 left-0 right-0 p-8 z-50 bg-gradient-to-t from-[#010208] via-[#010208]/80 to-transparent flex flex-col gap-4">
        <button class="lg-btn-primary w-full py-5 text-sm shadow-indigo-500/20" (click)="processWithdraw()" [disabled]="isProcessing()">
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
    .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
    @keyframes shake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-4px); } 40%, 60% { transform: translateX(4px); } }
    .text-glow-amber { text-shadow: 0 0 15px rgba(251, 191, 36, 0.4); }
    input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithdrawFormComponent {
  private router = inject(Router);
  private userStatusService = inject(UserStatusService);

  amountInputField = viewChild<ElementRef<HTMLInputElement>>('amountInputField');

  currency = input.required<string>();
  network = input<string>('');

  isProcessing = signal(false);
  showSuccess = signal(false);
  transactionMessage = signal('');
  amount = signal(0);
  selectedAccount = signal('');
  readonly balance = computed(() => this.userStatusService.wallet()?.principalBalance ?? 0);

  isCrypto = computed(() => ['USDT', 'BTC', 'TRX', 'BNB'].includes(this.currency()));
  currencyLogo = computed(() => {
    const logoMap: Record<string, string> = {
      'Nequi': 'wallet/colombia/nequi.png', 'Daviplata': 'wallet/colombia/daviplata.png',
      'Plin': 'wallet/peru/plin.png', 'Yape': 'wallet/peru/yape.png',
      'USDT': 'wallet/crypto/usdt.png', 'TRX': 'wallet/crypto/trx.png',
      'BNB': 'wallet/crypto/bnb.png', 'BTC': 'wallet/crypto/btc.png',
    };
    return logoMap[this.currency()] || null;
  });

  presetAmounts = computed(() => {
    const curr = this.currency();
    if (curr === 'USDT') return [10, 15, 25, 50, 100, 200];
    if (curr === 'TRX') return [50, 120, 230, 500, 1000, 2000];
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
      this.transactionMessage.set('Dirección pegada');
      setTimeout(() => this.transactionMessage.set(''), 2000);
    } catch {
      this.transactionMessage.set('Error al pegar');
      setTimeout(() => this.transactionMessage.set(''), 2000);
    }
  }

  goBack() { this.router.navigate(['/wallet']); }

  processWithdraw() {
    const amount = this.amount();
    if (amount <= 0) {
      this.transactionMessage.set('Monto inválido');
      setTimeout(() => this.transactionMessage.set(''), 3000);
      return;
    }
    if (this.balance() < amount) {
      this.transactionMessage.set('Saldo insuficiente');
      setTimeout(() => this.transactionMessage.set(''), 3000);
      return;
    }
    if (!this.selectedAccount() && !this.isCrypto()) {
      this.transactionMessage.set('Especifica destino');
      setTimeout(() => this.transactionMessage.set(''), 3000);
      return;
    }

    this.isProcessing.set(true);
    setTimeout(() => {
      // TODO: Implement API call for withdrawal
      // this.localApi.updateBalance?.(-amount);
      // this.localApi.addTransaction?.({
      //   type: 'withdrawal', amount, currency: 'coins', status: 'completed',
      //   method: this.selectedAccount() || this.currency(),
      //   description: `Retiro de ${amount} monedas`,
      // });
      this.isProcessing.set(false);
      this.showSuccess.set(true);
      setTimeout(() => this.router.navigate(['/wallet']), 1500);
    }, 2000);
  }
}
