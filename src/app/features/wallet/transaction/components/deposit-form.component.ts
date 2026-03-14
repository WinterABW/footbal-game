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

        <!-- Canal de Pago -->
        <div class="flex flex-col gap-3">
          <span class="text-[9px] font-black text-white/20 uppercase tracking-widest px-1">Canal de Pago</span>

          @if (isNequi()) {
            <!-- Nequi: 3 channel cards -->
            <div class="grid grid-cols-3 gap-3">
              @for (channel of paymentChannels(); track channel.id) {
                <button
                  (click)="selectedChannel.set(channel.id)"
                  class="relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border backdrop-blur-2xl transition-all duration-300 active:scale-95 overflow-hidden"
                  [style.background]="selectedChannel() === channel.id
                    ? 'linear-gradient(to right, rgba(20,184,166,0.28) 0%, rgba(20,184,166,0.18) 25%, rgba(20,184,166,0.08) 55%, transparent 75%)'
                    : 'rgba(255,255,255,0.04)'"
                  [style.border-color]="selectedChannel() === channel.id ? 'rgba(20,184,166,0.40)' : 'rgba(255,255,255,0.08)'"
                  [style.box-shadow]="selectedChannel() === channel.id ? '0 0 20px rgba(20,184,166,0.15), 0 0 40px rgba(20,184,166,0.08)' : 'none'">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300"
                    [style.background]="selectedChannel() === channel.id ? 'rgba(20,184,166,0.20)' : 'rgba(255,255,255,0.05)'">
                    <svg class="w-5 h-5 transition-colors duration-300"
                      [style.color]="selectedChannel() === channel.id ? 'rgb(20,184,166)' : 'rgba(255,255,255,0.25)'"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span class="text-[9px] font-black uppercase tracking-widest leading-tight text-center transition-colors duration-300"
                    [style.color]="selectedChannel() === channel.id ? 'rgb(204,251,241)' : 'rgba(255,255,255,0.35)'">
                    {{ channel.label }}
                  </span>
                  @if (selectedChannel() === channel.id) {
                    <span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(20,184,166,0.8)]"></span>
                  }
                </button>
              }
            </div>
          } @else {
            <!-- Other methods: single full-width card with logo -->
            <div class="relative flex items-center justify-between p-5 rounded-2xl border backdrop-blur-2xl overflow-hidden"
              style="background: linear-gradient(to right, rgba(20,184,166,0.20) 0%, rgba(20,184,166,0.18) 25%, rgba(20,184,166,0.08) 55%, transparent 75%);
                     border-color: rgba(20,184,166,0.35);
                     box-shadow: 0 0 20px rgba(20,184,166,0.12), 0 0 40px rgba(20,184,166,0.06);">
              <div class="flex flex-col gap-1">
                <span class="text-[8px] font-black text-teal-400/70 uppercase tracking-[0.25em]">Método activo</span>
                <span class="text-sm font-black text-white uppercase tracking-widest">{{ selectedMethod() }}</span>
              </div>
              @if (methodLogo()) {
                <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                  style="background: rgba(20,184,166,0.12); border: 1px solid rgba(20,184,166,0.25);">
                  <img [src]="methodLogo()!" alt="logo" width="32" height="32" class="w-8 h-8 object-contain drop-shadow-lg" />
                </div>
              }
              <!-- Glow dot -->
              <span class="absolute top-3 right-3 w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.9)]"></span>
            </div>
          }
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
  selectedChannel = signal<string>('nequi-1');

  readonly paymentChannels = computed(() => {
    const m = this.selectedMethod();
    return [
      { id: `${m}-1`, label: `${m} 1` },
      { id: `${m}-2`, label: `${m} 2` },
      { id: `${m}-3`, label: `${m} 3` },
    ];
  });
  transactionMessage = signal('');
  showSuccess = signal(false);
  showCryptoModal = signal(false);
  showPaymentScreen = signal(false);
  cryptoAddress = signal('');
  orderNumber = signal('');
  qrImage = signal('qr/deposit.PNG');

  selectedMethod = computed(() => this.currency() || 'NEQUI');
  isNequi = computed(() => this.selectedMethod() === 'Nequi');

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
