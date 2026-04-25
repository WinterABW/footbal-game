import { ChangeDetectionStrategy, Component, inject, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { WalletService, FinanceMethod } from '../../../../core/services/wallet.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserStatusService } from '../../../../core/services/user-status.service';
import { generateSignedToken } from '../../../../core/services/encryption.service';
import { SuccessOverlayComponent } from './success-overlay.component';
import { DepositResponseModalComponent } from './deposit-response-modal.component';
import { CryptoDepositModalComponent } from '../../crypto-deposit-modal.component';
import { PaymentScreenComponent } from '../payment-screen.component';

@Component({
  selector: 'app-deposit-form',
  imports: [CommonModule, SuccessOverlayComponent, DepositResponseModalComponent, CryptoDepositModalComponent, PaymentScreenComponent],
  template: `
    <div class="h-full flex flex-col relative w-full overflow-hidden bg-transparent">
      @if (showSuccess()) {
        <app-success-overlay [message]="'¡Depósito de ' + amount() + ' monedas en proceso de verificación!'" />
      }

      @if (showDepositResponse()) {
        <app-deposit-response-modal
          [responseMessage]="depositResponseMessage()"
          [txnId]="depositTxnId()"
          [orderNumber]="depositOrderNumber()"
          [invoiceUrl]="depositInvoiceUrl()"
          (close)="onDepositResponseClose()"
        />
      }

      @if (showPaymentScreen()) {
        <app-payment-screen
          [currency]="selectedMethod()"
          [amount]="amount()"
          [orderNumber]="orderNumber()"
          [qrImage]="qrImage()"
          (goBack)="showPaymentScreen.set(false)"
          (depositSuccess)="onPaymentSuccess($event)"
          (depositError)="onPaymentError($event)"
        />
      }

      @if (showCryptoModal()) {
        <app-crypto-deposit-modal
          [currency]="selectedMethod()"
          [address]="cryptoAddress()"
          [logo]="methodLogo()!"
          [isLoading]="isSubmitting()"
          [errorMessage]="modalErrorMessage()"
          (close)="onModalClose()"
          (confirm)="onCryptoConfirm($event)"
        />
      }

      <!-- Pending Deposit Modal (404 case) -->
      @if (showPendingDeposit()) {
        <div class="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-fade-in">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>
          
          <div class="relative w-full max-w-sm overflow-hidden bg-white/[0.03] backdrop-blur-3xl rounded-[40px] p-8 flex flex-col items-center shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 animate-scale-up">
            <!-- Top highlight line -->
            <span class="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"></span>
            
            <!-- Icon -->
            <div class="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(245,158,11,0.25)]">
              <svg class="w-10 h-10 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 class="text-xl font-black text-white tracking-tight uppercase text-glow-amber text-center mb-4">Depósito en Curso</h2>
            
            <p class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center leading-relaxed mb-6">{{ pendingDepositMessage() }}</p>

            <!-- Invoice URL -->
            @if (pendingDepositInvoiceUrl()) {
              <div class="w-full flex flex-col gap-2 mb-6">
                <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] px-2">Enlace de Factura</span>
                <div class="relative w-full">
                  <div class="w-full h-14 pl-5 pr-16 rounded-2xl flex items-center bg-white/[0.03] border border-white/10 shadow-inner-sm">
                    <span class="font-mono text-xs text-cyan-300/80 truncate">
                      {{ pendingDepositInvoiceUrl() }}
                    </span>
                  </div>
                  <button (click)="copyPendingInvoiceUrl()" 
                    class="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-90"
                    [ngClass]="justCopied() ? 'bg-teal-500/20' : 'bg-white/5 hover:bg-white/10'">
                    @if (justCopied()) {
                      <svg class="w-5 h-5 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    } @else {
                      <svg class="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    }
                  </button>
                </div>
              </div>
            }

            <!-- Close Button -->
            <button (click)="onPendingDepositClose()" class="w-full py-3 px-6 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 active:scale-[0.97] text-white bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30">
              Entendido
            </button>
          </div>
        </div>
      }

      <header class="w-full relative z-10 pt-safe-top mt-8 px-6 flex justify-between items-center py-6 mb-4">
        <button (click)="goBack()" class="w-12 h-12 lg-icon-btn active:scale-90 transition-transform">
          <svg class="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div class="flex flex-col items-center">
          <span class="text-[10px] font-medium text-white/20 uppercase tracking-[0.3em] mb-1">Recarga</span>
          <h1 class="text-2xl font-semibold text-white tracking-tight text-glow uppercase">Depósito</h1>
        </div>
        @if (methodLogo()) {
          <img [src]="methodLogo()!" alt="logo" width="48" height="48" class="w-12 h-12 object-contain drop-shadow-lg" />
        } @else {
          <div class="w-12 h-12"></div>
        }
      </header>

      <main class="flex-1 w-full relative z-10 flex flex-col overflow-y-auto no-scrollbar pb-32 px-6 gap-8 animate-slide-up">
        <!-- Amount Input -->
        <div class="lg-card-panel p-8 flex flex-col items-center gap-6">
           <span class="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Cifra a Recargar</span>
           <div class="flex items-center gap-4 border-b border-white/10 pb-4 w-full justify-center">
             <span class="text-2xl font-black text-white/20">$</span>
             <input
              type="number" 
              class="bg-transparent border-none outline-none text-4xl font-black text-white text-center w-full max-w-[200px]"
              placeholder="0"
              [value]="amount()"
              (input)="onAmountChange($event)"
             />
           </div>
           
<div class="grid grid-cols-3 gap-2 w-full">
              @for (preset of presetValues(); track preset) {
                <button (click)="setAmount(preset)" class="px-2 py-2 lg-btn-outline !border-white/10 !rounded-xl text-[9px] font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all outline-none">
                  {{ preset | number: '1.0-0' }}
                </button>
              }
            </div>
         </div>

        <!-- Canal de Pago -->
        <div class="flex flex-col gap-2.5">
          <span class="text-[8px] font-medium text-white/20 uppercase tracking-wider px-1">
            Canal de Pago
          </span>

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
          } @else if (isCrypto()) {
            <!-- Crypto: single full-width card with logo, like other methods -->
            <div class="relative flex items-center justify-between p-4 rounded-xl border backdrop-blur-2xl overflow-hidden"
              style="background: linear-gradient(to right, rgba(245,158,11,0.20) 0%, rgba(245,158,11,0.18) 25%, rgba(245,158,11,0.08) 55%, transparent 75%);
                     border-color: rgba(245,158,11,0.35);
                     box-shadow: 0 0 15px rgba(245,158,11,0.1), 0 0 30px rgba(245,158,11,0.05);">
              <div class="flex flex-col gap-0.5">
                <span class="text-[7px] font-semibold text-amber-400/70 uppercase tracking-[0.2em]">Método activo</span>
                <span class="text-sm font-semibold text-white uppercase tracking-wider">Crypto</span>
              </div>
              @if (methodLogo()) {
                <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                  style="background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25);">
                  <img [src]="methodLogo()!" alt="logo" width="28" height="28" class="w-7 h-7 object-contain drop-shadow-lg" />
                </div>
              }
              <!-- Glow dot -->
              <span class="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]"></span>
            </div>
          } @else {
            <!-- Other methods: single full-width card with logo -->
            <div class="relative flex items-center justify-between p-4 rounded-xl border backdrop-blur-2xl overflow-hidden"
              style="background: linear-gradient(to right, rgba(20,184,166,0.20) 0%, rgba(20,184,166,0.18) 25%, rgba(20,184,166,0.08) 55%, transparent 75%);
                     border-color: rgba(20,184,166,0.35);
                     box-shadow: 0 0 15px rgba(20,184,166,0.1), 0 0 30px rgba(20,184,166,0.05);">
              <div class="flex flex-col gap-0.5">
                <span class="text-[7px] font-semibold text-teal-400/70 uppercase tracking-[0.2em]">Método activo</span>
                <span class="text-sm font-semibold text-white uppercase tracking-wider">{{ selectedMethod() }}</span>
              </div>
              @if (methodLogo()) {
                <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                  style="background: rgba(20,184,166,0.12); border: 1px solid rgba(20,184,166,0.25);">
                  <img [src]="methodLogo()!" alt="logo" width="28" height="28" class="w-7 h-7 object-contain drop-shadow-lg" />
                </div>
              }
              <!-- Glow dot -->
              <span class="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(20,184,166,0.8)]"></span>
            </div>
          }

          <!-- Security Labels -->
          <div class="px-1 mt-1">
            @if (isCrypto()) {
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="w-1 h-1 rounded-full bg-emerald-400/50"></span>
                  <span class="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Depósito validado por Blockchain.com</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="w-1 h-1 rounded-full bg-emerald-400/50"></span>
                  <span class="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Protocolo Binance API</span>
                </div>
              </div>
            } @else {
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="w-1 h-1 rounded-full bg-emerald-400/50"></span>
                  <span class="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Depósito Seguro</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="w-1 h-1 rounded-full bg-emerald-400/50"></span>
                  <span class="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Rápido</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="w-1 h-1 rounded-full bg-emerald-400/50"></span>
                  <span class="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Cifrado de extremo a extremo</span>
                </div>
              </div>
            }
          </div>
        </div>
      </main>

      <footer class="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-6 z-50 bg-gradient-to-t from-[#010208] via-[#010208]/90 to-transparent">
        <button (click)="onDeposit()"
          class="relative w-full overflow-hidden flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 active:scale-[0.97] text-white btn-glass-cta">
          <!-- Top highlight line -->
          <span class="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"></span>
          <!-- Shimmer sweep -->
          <span class="absolute inset-0 shimmer-anim pointer-events-none"></span>
          <!-- Lock icon -->
          <svg class="relative z-10 w-4 h-4 opacity-70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span class="relative z-10">Confirmar Depósito</span>
          <!-- Arrow -->
          <svg class="relative z-10 w-4 h-4 opacity-60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
        <p class="text-center text-[7px] text-white/15 font-medium uppercase tracking-wider mt-2">
          🔒 Transacción segura y encriptada
        </p>
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
    .btn-glass-cta {
      background: rgba(0, 212, 255, 0.13);
      backdrop-filter: blur(32px) saturate(200%);
      -webkit-backdrop-filter: blur(32px) saturate(200%);
      border: 1px solid rgba(0, 212, 255, 0.28);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.18),
        inset 0 -1px 0 rgba(0, 0, 0, 0.15),
        0 0 24px rgba(0, 212, 255, 0.18),
        0 0 60px rgba(0, 212, 255, 0.08),
        0 8px 32px rgba(0, 0, 0, 0.40);
    }
    .btn-glass-cta:hover {
      background: rgba(0, 212, 255, 0.20);
      border-color: rgba(0, 212, 255, 0.45);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.25),
        0 0 32px rgba(0, 212, 255, 0.28),
        0 12px 40px rgba(0, 0, 0, 0.45);
    }
    .btn-glass-cta:active {
      background: rgba(0, 212, 255, 0.10);
      transform: scale(0.97);
    }
    .shimmer-anim {
      background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.10) 50%, transparent 60%);
      background-size: 200% 100%;
      animation: shimmer 2.4s infinite linear;
    }
    @keyframes shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-scale-up { animation: scaleUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    @keyframes scaleUp { from { transform: scale(0.6) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    .text-glow-amber { text-shadow: 0 0 25px rgba(251, 191, 36, 0.6); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositFormComponent {
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService)!;
  private walletService = inject(WalletService)!;
  private authService = inject(AuthService)!;
  private userStatusService = inject(UserStatusService)!;

  currency = input.required<string>();
  network = input<string>('');

  amount = signal(0);
  selectedChannel = signal<string>('Nequi-1');

  // Phase 3.3: isSubmitting signal for crypto submit flow
  isSubmitting = signal(false);
  
  // Phase 3.2: cryptoConfigured computed based on environment
  cryptoConfigured = computed(() => !!environment.cryptoDepositAddress);
  
  // Phase 2.2: error message for modal
  modalErrorMessage = signal('');

  // Pending deposit (404 case)
  showPendingDeposit = signal(false);
  pendingDepositInvoiceUrl = signal('');
  pendingDepositMessage = signal('');
  justCopied = signal(false);

  // Deposit response modal signals
  showDepositResponse = signal(false);
  depositResponseMessage = signal('');
  depositTxnId = signal('');
  depositOrderNumber = signal('');
  depositInvoiceUrl = signal('');

  readonly paymentChannels = computed(() => {
    const m = this.selectedMethod();
    return [
      { id: `${m}-1`, label: `${m} 1` },
      { id: `${m}-2`, label: `${m} 2` },
      { id: `${m}-3`, label: `${m} 3` },
    ];
  });

    presetValues = computed(() => {
      const m = this.selectedMethod();
      switch (m) {
        case 'USDT':
        case 'TRX':
        case 'BNB':
        case 'BTC': return [5, 10, 25, 50, 100, 200]; // USD
        case 'Paypal': return [10, 25, 50, 80, 150, 400];
        case 'Plin':
        case 'Yape': return [30, 50, 80, 100, 150, 200];
        default: return [30000, 50000, 100000, 200000, 300000, 500000];
      }
     });
  showSuccess = signal(false);
  showCryptoModal = signal(false);
  showPaymentScreen = signal(false);
  cryptoAddress = signal('');
  orderNumber = signal('');
  qrImage = signal('wallet/qr/nequi1.jpg');

  selectedMethod = computed(() => this.currency() || 'NEQUI');
  isNequi = computed(() => this.selectedMethod() === 'Nequi');
  isDaviplata = computed(() => this.selectedMethod() === 'Daviplata');
  isBREB = computed(() => this.selectedMethod() === 'BRE-B');
  isPlin = computed(() => this.selectedMethod() === 'Plin');
  isYape = computed(() => this.selectedMethod() === 'Yape');

  isCrypto = computed(() => ['USDT', 'BTC', 'TRX', 'BNB'].includes(this.selectedMethod()));

 resolvedQrImage = computed(() => {
      if (this.isDaviplata()) return 'wallet/qr/deviplata.jpg';
      if (this.selectedMethod() === 'Paypal') return 'wallet/qr/paypal.jpg';
      if (this.selectedMethod() === 'BRE-B') return 'wallet/qr/bre-b.jpg';
      if (this.isPlin()) return 'wallet/qr/plin.jpg';
      if (this.isYape()) return 'wallet/qr/yape.jpg';
      const channel = this.selectedChannel();
      const qrMap: Record<string, string> = {
        'Nequi-1': 'wallet/qr/nequi1.jpg',
        'Nequi-2': 'wallet/qr/nequi2.jpg',
        'Nequi-3': 'wallet/qr/nequi3.jpg',
      };
      return qrMap[channel] ?? 'wallet/qr/nequi1.jpg';
    });

  resolveOrderNumber(): string {
    if (this.isBREB()) return '0035095215';
    if (this.isPlin()) return '999888777';
    if (this.isYape()) return '999666555';
    if (!this.isNequi()) return '';
    const phones: Record<string, string> = {
      'Nequi-1': '3229681972',
      'Nequi-2': '3203871326',
      'Nequi-3': '3213756514',
    };
    return phones[this.selectedChannel()] ?? phones['Nequi-1'];
  }

  isCryptoMethod = computed(() => ['USDT', 'BTC', 'TRX', 'BNB'].includes(this.selectedMethod()));

  methodLogo = computed(() => {
      // If it's a crypto method, always return the generic Binance logo as per user request
      if (this.isCryptoMethod()) {
        return 'wallet/main/bynance.png';
      }

      const logoMap: Record<string, string> = {
        'Nequi': 'wallet/colombia/nequi.webp', 'Daviplata': 'wallet/colombia/daviplata.webp',
        'BRE-B': 'wallet/colombia/bre-b.webp',
        'Plin': 'wallet/peru/plin.webp', 'Yape': 'wallet/peru/yape.png',
        'Paypal': 'wallet/main/paypal.webp',
      };
      return logoMap[this.selectedMethod()] || null;
    });

  onAmountChange(event: Event) { this.amount.set(Number((event.target as HTMLInputElement).value)); }
  setAmount(val: number) { this.amount.set(val); }

  goBack() { this.router.navigate(['/wallet']); }

  minAmount = computed(() => this.presetValues()[0]);

  async onDeposit() {
    if (this.amount() < this.minAmount()) {
      const amount = this.isCrypto() ? this.minAmount() : this.minAmount().toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
      this.errorHandler.showToast(`Monto mínimo ${amount} ${this.selectedMethod()}`, 'error');
      return;
    }

    // CRYPTO: llamar directamente al backend, sin modal de dirección
    if (this.isCrypto()) {
      this.processCryptoDeposit();
      return;
    }

    // Otros métodos: mostrar pantalla de pago
    this.orderNumber.set(this.resolveOrderNumber());
    this.qrImage.set(this.resolvedQrImage());
    this.showPaymentScreen.set(true);
  }

  async processCryptoDeposit() {
    const amount = this.amount();
    if (amount < this.minAmount()) {
      this.errorHandler.showToast(`Monto mínimo ${this.minAmount()} ${this.selectedMethod()}`, 'error');
      return;
    }

    const user = this.authService.user();

    if (!user?.id) {
      this.errorHandler.showErrorToast('Sesión expirada');
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const token = await generateSignedToken(user.id, timestamp);

    // Map method string to FinanceMethod enum based on selection
    let financeMethod: FinanceMethod; // Use the enum type directly

    if (this.isCrypto()) {
      financeMethod = FinanceMethod.CRYPTO;
    } else if (this.selectedMethod() === 'Nequi') {
      // Map Nequi channel to enum: Nequi-1=1, Nequi-2=2, Nequi-3=3
      const channel = this.selectedChannel();
      if (channel === 'Nequi-2') {
        financeMethod = FinanceMethod.NEQUI_2;
      } else if (channel === 'Nequi-3') {
        financeMethod = FinanceMethod.NEQUI_3;
      } else {
        financeMethod = FinanceMethod.NEQUI_1; // Nequi-1 default
      }
    } else if (this.selectedMethod() === 'Daviplata') {
      financeMethod = FinanceMethod.DAVIPLATA;
    } else if (this.selectedMethod() === 'Paypal') {
      financeMethod = FinanceMethod.PAYPAL;
    } else if (this.selectedMethod() === 'BRE-B') {
      financeMethod = FinanceMethod.BRE_B;
    } else if (this.selectedMethod() === 'Plin') {
      financeMethod = FinanceMethod.PLIN;
    } else if (this.selectedMethod() === 'Yape') {
      financeMethod = FinanceMethod.YAPE;
    } else {
      financeMethod = FinanceMethod.CRYPTO; // Fallback, though isCrypto should cover it for selected methods
    }

    const rates = this.walletService.conversionRates();

    this.isSubmitting.set(true);

    // Call addDeposit directly — user enters USD, backend receives COP
    this.walletService.addDeposit({
      amountUSD: amount * rates.usdToCOP,
      method: financeMethod,
      token: token,
      uid: user.id,
      transactionId: null as any
    }).then(result => {
      this.isSubmitting.set(false);
      if (result.success && result.invoiceUrl) {
        // Successful creation, show the response modal
        this.depositResponseMessage.set('¡Depósito Enviado! Factura creada exitosamente.');
        this.depositTxnId.set(result.txnId ?? '');
        this.depositOrderNumber.set(result.orderNumber ?? '');
        this.depositInvoiceUrl.set(result.invoiceUrl ?? '');
        this.showDepositResponse.set(true);
      } else if (!result.success && result.invoiceUrl) {
        // Pending deposit case (404)
        this.pendingDepositMessage.set(result.message ?? 'Ya existe un depósito pendiente.');
        this.pendingDepositInvoiceUrl.set(result.invoiceUrl);
        this.showPendingDeposit.set(true);
      } else {
        // Generic error case
        this.errorHandler.showErrorToast(result.error ?? 'Ocurrió un error desconocido.');
      }
    }).catch((err) => {
      this.isSubmitting.set(false);
      const errorString = err instanceof Error ? err.message : JSON.stringify(err);
      this.errorHandler.showErrorToast('DEBUG .CATCH: ' + errorString);
    });
  }

  async onCryptoConfirm(event: { amount: number; method: string }) {
    // Prevent duplicate submits
    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.modalErrorMessage.set('');

    // Map method string to FinanceMethod enum based on selection
    let financeMethod: FinanceMethod; // Use the enum type directly
    
    if (this.isCrypto()) {
      financeMethod = FinanceMethod.CRYPTO;
    } else if (this.selectedMethod() === 'Nequi') {
      // Map Nequi channel to enum: Nequi-1=1, Nequi-2=2, Nequi-3=3
      const channel = this.selectedChannel();
      if (channel === 'Nequi-2') {
        financeMethod = FinanceMethod.NEQUI_2;
      } else if (channel === 'Nequi-3') {
        financeMethod = FinanceMethod.NEQUI_3;
      } else {
        financeMethod = FinanceMethod.NEQUI_1; // Nequi-1 default
      }
    } else if (this.selectedMethod() === 'Daviplata') {
      financeMethod = FinanceMethod.DAVIPLATA;
    } else if (this.selectedMethod() === 'Paypal') {
      financeMethod = FinanceMethod.PAYPAL;
    } else if (this.selectedMethod() === 'BRE-B') {
      financeMethod = FinanceMethod.BRE_B;
    } else if (this.selectedMethod() === 'Plin') {
      financeMethod = FinanceMethod.PLIN;
    } else if (this.selectedMethod() === 'Yape') {
      financeMethod = FinanceMethod.YAPE;
    } else {
      financeMethod = FinanceMethod.CRYPTO; // Fallback, though isCrypto should cover it for selected methods
    }

    // Get user data from authService
    const user = this.authService.user();

    if (!user?.id) {
      this.isSubmitting.set(false);
      this.modalErrorMessage.set('Sesión expirada. Por favor, inicia sesión nuevamente.');
      return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const token = await generateSignedToken(user.id, timestamp);

    const rates = this.walletService.conversionRates();

    // Phase 3.4: Call WalletService.addDeposit — user enters USD, backend receives COP
    this.walletService.addDeposit({
      amountUSD: this.amount() * rates.usdToCOP,
      method: financeMethod,
      token: token,
      uid: user.id,
      transactionId: null as any  // null for crypto - pending blockchain confirmation
    }).then(result => {
      this.isSubmitting.set(false);
      if (result.success && result.invoiceUrl) {
        // Success, close this modal and show the response modal
        this.showCryptoModal.set(false);
        this.depositResponseMessage.set('¡Depósito Enviado! Factura creada exitosamente.');
        this.depositTxnId.set(result.txnId ?? '');
        this.depositOrderNumber.set(result.orderNumber ?? '');
        this.depositInvoiceUrl.set(result.invoiceUrl ?? '');
        this.showDepositResponse.set(true);
      } else if (!result.success && result.invoiceUrl) {
        // Pending deposit case (404)
        this.showCryptoModal.set(false); // Close current modal
        this.pendingDepositMessage.set(result.message ?? 'Ya existe un depósito pendiente.');
        this.pendingDepositInvoiceUrl.set(result.invoiceUrl);
        this.showPendingDeposit.set(true);
      } else {
        // Generic error inside the modal
        this.modalErrorMessage.set(result.error ?? 'Ocurrió un error desconocido.');
      }
    }).catch((err: unknown) => {
      this.isSubmitting.set(false);
      // Try to stringify the error object, which might have more details
      const errorString = err instanceof Error ? err.message : JSON.stringify(err);
      this.modalErrorMessage.set('DEBUG .CATCH: ' + errorString);
    });
  }

  onModalClose() {
    this.showCryptoModal.set(false);
    this.modalErrorMessage.set('');
    this.isSubmitting.set(false);
  }

  onDepositResponseClose() {
    this.showDepositResponse.set(false);
    this.showSuccess.set(true);
    setTimeout(() => this.router.navigate(['/wallet']), 1500);
  }

  async onPaymentSuccess(event: { message: string; txnId: string; orderNumber: string; invoiceUrl: string }) {
    this.showPaymentScreen.set(false);
    
    // Refresh user status
    await this.userStatusService.loadUserStatus();
    
    const method = this.selectedMethod();
    const isColombian = ['Nequi', 'Daviplata', 'BRE-B'].includes(method);
    const isPaypal = method === 'Paypal';

    // If it's Colombian or Paypal, don't show the response modal, just show success overlay
    if (isColombian || isPaypal) {
      this.showSuccess.set(true);
      setTimeout(() => this.router.navigate(['/wallet']), 1500);
      return;
    }
    
    this.depositResponseMessage.set(event.message);
    this.depositTxnId.set(event.txnId);
    this.depositOrderNumber.set(event.orderNumber);
    this.depositInvoiceUrl.set(event.invoiceUrl);
    this.showDepositResponse.set(true);
  }

  onPaymentError(event: string) {
    this.showPaymentScreen.set(false);
    this.errorHandler.showErrorToast(event);
    // Navigate back to wallet after showing error
    setTimeout(() => this.router.navigate(['/wallet']), 1500);
  }

  onPendingDepositClose() {
    this.showPendingDeposit.set(false);
    this.pendingDepositInvoiceUrl.set('');
    this.pendingDepositMessage.set('');
    this.showCryptoModal.set(false);
    // Do NOT show success, just navigate
    this.router.navigate(['/wallet']);
  }

  async copyPendingInvoiceUrl() {
    if (this.justCopied()) return;
    await navigator.clipboard.writeText(this.pendingDepositInvoiceUrl());
    this.errorHandler.showSuccessToast('URL copiada');
    this.justCopied.set(true);
    setTimeout(() => this.justCopied.set(false), 2000);
  }
}
