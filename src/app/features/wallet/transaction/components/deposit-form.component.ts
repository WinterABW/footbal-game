import { ChangeDetectionStrategy, Component, inject, signal, computed, input, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LocalApiService } from '../../../../core/services/local-api.service';
import { SuccessOverlayComponent } from './success-overlay.component';
import { CryptoDepositModalComponent } from '../../crypto-deposit-modal.component';
import { PaymentScreenComponent } from '../payment-screen.component';

@Component({
  selector: 'app-deposit-form',
  imports: [CommonModule, SuccessOverlayComponent, CryptoDepositModalComponent, PaymentScreenComponent],
  template: `
    <div class="h-full flex flex-col relative w-full overflow-hidden bg-transparent">
      @if (showSuccess()) {
        <app-success-overlay [message]="'¡Depósito de ' + amount() + ' monedas solicitado con éxito!'" />
      }

      @if (showPaymentScreen()) {
        <app-payment-screen 
          [currency]="selectedMethod()" 
          [amount]="amount()" 
          [orderNumber]="orderNumber()"
          [qrImage]="qrImage()"
        />
      }

      @if (showCryptoModal()) {
        <app-crypto-deposit-modal
          [currency]="selectedMethod()"
          [address]="cryptoAddress()"
          [logo]="methodLogo()!"
          (close)="showCryptoModal.set(false)"
        />
      }

      @if (transactionMessage() && !showSuccess()) {
        <div class="fixed top-24 left-1/2 -translate-x-1/2 z-[200] lg-module-card px-6 py-4 border-red-500/20 bg-red-500/[0.025] text-red-400 text-[11px] font-black uppercase tracking-widest animate-shake whitespace-nowrap">
          {{ transactionMessage() }}
        </div>
      }

      <header class="w-full relative z-10 pt-safe-top mt-8 px-6 flex justify-between items-center py-6 mb-4">
        <button (click)="goBack()" class="w-12 h-12 lg-icon-btn active:scale-90 transition-transform">
          <svg class="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div class="flex flex-col items-center">
          <span class="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Recarga</span>
          <h1 class="text-2xl font-black text-white tracking-tight text-glow uppercase">Depósito</h1>
        </div>
        <div class="w-12 h-12 lg-module-card flex items-center justify-center overflow-hidden">
           @if (methodLogo()) {
             <img [src]="methodLogo()!" alt="logo" width="32" height="32" class="object-contain" />
           }
        </div>
      </header>

      <main class="flex-1 w-full relative z-10 flex flex-col overflow-y-auto no-scrollbar pb-32 px-6 gap-8 animate-slide-up">
        <!-- Amount Input -->
        <div class="lg-card-panel p-8 flex flex-col items-center gap-6">
           <span class="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Cifra a Recargar</span>
           <div class="flex items-center gap-4 border-b border-white/10 pb-4 w-full justify-center">
             <span class="text-2xl font-black text-white/20">$</span>
             <input #amountInput
              type="number" 
              class="bg-transparent border-none outline-none text-4xl font-black text-white text-center w-full max-w-[200px]"
              placeholder="0"
              [value]="amount()"
              (input)="onAmountChange($event)"
             />
           </div>
           
           <div class="grid grid-cols-3 gap-3 w-full">
             @for (preset of [30000, 50000, 100000, 200000, 300000, 500000]; track preset) {
               <button (click)="setAmount(preset)" class="px-2 py-3 lg-btn-outline !border-white/10 !rounded-2xl text-[10px] font-black text-white/50 hover:text-white hover:bg-white/5 transition-all outline-none">
                 {{ preset | number }}
               </button>
             }
           </div>
        </div>

        <!-- Method Detail (Simulated) -->
        <div class="lg-module-card p-6 flex items-center justify-between">
           <div class="flex flex-col">
             <span class="text-[9px] font-black text-white/20 uppercase tracking-widest">Canal de Pago</span>
             <span class="text-sm font-black text-white uppercase mt-1">{{ selectedMethod() }}</span>
           </div>
           <div class="w-10 h-10 rounded-xl bg-white/[0.025] flex items-center justify-center">
              <svg class="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.82v-1.91c-.39-.07-.77-.17-1.14-.31l.43-1.13c.35.13.7.22 1.05.27.35.05.7.07 1.05.05.35-.02.69-.07 1.02-.16.33-.09.61-.24.84-.46.23-.22.34-.52.34-.89 0-.29-.07-.54-.22-.75s-.37-.38-.66-.52-.64-.26-1.04-.36-1.1-.21-1.1-.64c0-.28.11-.53.33-.74s.54-.31.97-.31c.36 0 .7.05 1.01.14.31.09.58.2.82.35l-.44 1.13c-.23-.13-.49-.24-.76-.32s-.55-.12-.83-.12c-.32 0-.61.07-.85.22-.24.15-.36.38-.36.69 0 .26.07.47.21.65.14.18.35.33.61.43s.58.19.95.27l.9.19c.31.07.63.17.94.3s.58.32.8.58c.22.26.33.6.33 1.02 0 .54-.21 1.02-.63 1.44-.42.42-1 .69-1.74.8z"/></svg>
           </div>
        </div>
      </main>

      <footer class="fixed bottom-0 left-0 right-0 p-8 z-50 bg-gradient-to-t from-[#010208] via-[#010208]/80 to-transparent flex flex-col gap-4">
        <button class="lg-btn-primary w-full py-5 text-sm shadow-indigo-500/20" (click)="onDeposit()">
          Confirmar Depósito
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositFormComponent {
  private router = inject(Router);
  private localApi = inject(LocalApiService);

  currency = input.required<string>();
  network = input<string>('');

  amount = signal(0);
  transactionMessage = signal('');
  showSuccess = signal(false);
  showCryptoModal = signal(false);
  showPaymentScreen = signal(false);
  cryptoAddress = signal('');
  orderNumber = signal('');
  qrImage = signal('qr/deposit.PNG');

  selectedMethod = computed(() => this.currency() || 'NEQUI');

  methodLogo = computed(() => {
    const logoMap: Record<string, string> = {
      'Nequi': 'wallet/col/nequi.png', 'Daviplata': 'wallet/col/daviplata.png',
      'Plin': 'wallet/peru/plin.png', 'Yape': 'wallet/peru/yape.png',
      'USDT': 'wallet/crypto/usdt.png', 'TRX': 'wallet/crypto/trx.png',
      'BNB': 'wallet/crypto/bnb.png', 'BTC': 'wallet/crypto/btc.png',
    };
    return logoMap[this.selectedMethod()] || null;
  });

  onAmountChange(event: Event) { this.amount.set(Number((event.target as HTMLInputElement).value)); }
  setAmount(val: number) { this.amount.set(val); }

  goBack() { this.router.navigate(['/wallet']); }

  async onDeposit() {
    if (this.amount() < 30000 && !['USDT', 'BTC', 'TRX', 'BNB'].includes(this.selectedMethod())) {
      this.transactionMessage.set('Monto mínimo: $30,000');
      setTimeout(() => this.transactionMessage.set(''), 3000);
      return;
    }

    if (['USDT', 'BTC', 'TRX', 'BNB'].includes(this.selectedMethod())) {
      this.cryptoAddress.set('0x71C7656EC7ab88b098defB751B7401B5f6d8976F'); // Simulated
      this.showCryptoModal.set(true);
    } else {
      this.orderNumber.set('FIFA-' + Math.floor(Math.random() * 900000 + 100000));
      this.qrImage.set('qr/deposit.PNG');
      this.showPaymentScreen.set(true);
    }
  }
}
