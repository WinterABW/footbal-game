import { ChangeDetectionStrategy, Component, computed, input, output, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { WalletService } from '../../../core/services/wallet.service';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { generateSignedToken } from '../../../core/services/encryption.service';

@Component({
  selector: 'app-payment-screen',
  imports: [],
  template: `
       <section class="fixed inset-0 z-[100] flex flex-col w-full overflow-hidden payment-bg">
       <div class="absolute inset-0 bg-[#010208]/40 backdrop-blur-2xl pointer-events-none"></div>

       <!-- Header -->
      <header class="w-full relative z-10 pt-safe-top px-5 h-14 flex items-center justify-between">
        <button (click)="onGoBack()" class="w-10 h-10 bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-all group">
          <svg class="w-4.5 h-4.5 text-white/40 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div class="flex flex-col items-center text-center">
          <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Confirmación</span>
          <h1 class="text-base font-black text-white tracking-widest uppercase text-glow">{{ currency() }}</h1>
        </div>

        <div class="w-10"></div>
      </header>

      <!-- Main: single unified card -->
      <main class="flex-1 w-full relative z-10 flex flex-col items-center overflow-y-auto no-scrollbar pb-28 px-5 animate-slide-up">

        <div class="w-full max-w-sm relative overflow-hidden bg-white/[0.025] backdrop-blur-3xl border border-white/[0.06] rounded-[28px] flex flex-col shadow-2xl">

          <!-- Top highlight -->
          <span class="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"></span>

          <!-- Section 1: Amount + Order -->
          <div class="flex items-center justify-between px-5 pt-5 pb-4">
            <div class="flex flex-col gap-0.5">
              <span class="text-[7px] font-black text-white/20 uppercase tracking-[0.25em]">Monto</span>
              <div class="flex items-baseline gap-1.5">
                <span class="text-2xl font-black text-white tracking-tight">$ {{ displayAmount() }}</span>
                <span class="text-[10px] font-black text-white/30 uppercase tracking-wider">{{ currencyLabel() }}</span>
              </div>
            </div>
            @if (orderNumber()) {
              <div class="flex flex-col items-end gap-1">
                <span class="text-[7px] font-black text-white/15 uppercase tracking-[0.25em]">Celular</span>
                <div class="flex items-center gap-2">
                  <span class="text-[11px] font-bold text-white/70 tracking-widest">{{ orderNumber() }}</span>
                  <button (click)="onCopy()" class="w-7 h-7 flex items-center justify-center bg-white/[0.06] border border-white/[0.08] rounded-lg active:scale-90 transition-all">
                    <svg class="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Divider -->
          <div class="mx-5 h-px bg-white/[0.04]"></div>

          <!-- Section 2: QR -->
          <div class="flex flex-col items-center px-5 py-4 gap-3">
            <div class="relative w-[240px] h-[240px] bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center p-3">
              <div class="absolute inset-0 bg-white rounded-[14px]"></div>
              <img [src]="qrImage()" alt="QR Code" width="240" height="240" class="relative z-10 w-full h-full object-contain" />
            </div>
            <p class="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] text-center">
              Escanea desde tu app para pagar
            </p>
          </div>

          <!-- Divider -->
          <div class="mx-5 h-px bg-white/[0.04]"></div>

          <!-- Section 3: Reference Input -->
          <div class="px-5 pt-4 pb-5 flex flex-col gap-2">
            <span class="text-[7px] font-black text-white/20 uppercase tracking-[0.25em]">Referencia de Pago</span>

            <div class="relative">
              <input
                #refInput
                type="text"
                [value]="reference()"
                (input)="onReferenceChange($event)"
                class="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-4 pr-20 py-3.5 text-[13px] font-medium text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-white/12"
                placeholder="Nº de transacción"
                maxlength="20"
              />
              <button
                (click)="onPaste()"
                class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.06] text-white/60 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all">
                Pegar
              </button>
            </div>

            @if (reference().length > 0 && !isValidReference()) {
              <p class="text-[8px] font-black text-rose-400/60 uppercase tracking-widest">Mínimo 6 caracteres</p>
            }
          </div>

        </div>
      </main>

      <!-- Footer Action -->
      <footer class="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-5 z-50 bg-gradient-to-t from-[#010208] via-[#010208]/90 to-transparent">
        <button (click)="onConfirm()"
          [disabled]="!isValidReference()"
          class="relative w-full overflow-hidden flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all duration-300 active:scale-[0.97] text-white disabled:opacity-30 disabled:grayscale btn-glass-confirm">
          <span class="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"></span>
          <span class="relative z-10">Confirmar Depósito</span>
          <svg class="relative z-10 w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </footer>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .payment-bg {
      background:
        radial-gradient(ellipse at 12% 65%, rgba(13, 27, 110, .80) 0%, transparent 50%),
        radial-gradient(ellipse at 88% 35%, rgba(160, 24, 130, .65) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 100%, rgba(90, 15, 155, .50) 0%, transparent 48%),
        radial-gradient(ellipse at 50% 0%, rgba(8, 15, 80, .70) 0%, transparent 55%),
        linear-gradient(148deg, #010208 0%, #060214 45%, #0a011a 75%, #010208 100%);
    }
    .btn-glass-confirm {
      background: linear-gradient(135deg, rgba(99,102,241,0.95) 0%, rgba(139,92,246,0.95) 50%, rgba(168,85,247,0.90) 100%);
      box-shadow: 0 0 24px rgba(99,102,241,0.35), 0 0 48px rgba(139,92,246,0.12), 0 4px 20px rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.15);
    }
    .text-glow { text-shadow: 0 0 12px rgba(255, 255, 255, 0.35); }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1rem); }
    .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-bounce-subtle { animation: bounceSubtle 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards; }
    @keyframes bounceSubtle { 0% { transform: translate(-50%, 30px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentScreenComponent {
  private walletService = inject(WalletService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandlerService);

  @ViewChild('refInput') refInput!: ElementRef<HTMLInputElement>;

  currency = input.required<string>();
  amount = input.required<number>();
  orderNumber = input.required<string>();
  qrImage = input.required<string>();
  goBack = output<void>();
  
  // Success/error outputs to emit results back to parent
  depositSuccess = output<{ message: string; txnId: string; orderNumber: string; invoiceUrl: string }>();
  depositError = output<string>();

   reference = signal('');
   copied = signal(false);
   isProcessing = signal(false);

   isValidReference = computed(() => this.reference().length >= 6);

  displayAmount = computed(() => this.amount().toLocaleString('es-CO'));

  currencyLabel = computed(() => this.currency() === 'Paypal' ? 'USD' : 'COP');

  isColombianMethod = computed(() => ['Nequi', 'Daviplata', 'BRE-B'].includes(this.currency()));

private methodMap: Record<string, number> = {
    'Crypto': 0,
    'Nequi': 1,
    'Daviplata': 4,
    'Paypal': 5,
  };

  onReferenceChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.reference.set(value);
  }

  onGoBack() {
    this.goBack.emit();
  }

    async onCopy() {
      try {
        await navigator.clipboard.writeText(this.orderNumber());
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      } catch {
        this.errorHandler.showToast('No se pudo copiar.', 'error');
      }
    }

    onPaste() {
      const win = window as any;
      const isTelegram = typeof win.Telegram !== 'undefined' && win.Telegram?.WebApp;

      if (isTelegram) {
        // Telegram Mini App — focus input first, then use Telegram clipboard API
        this.refInput?.nativeElement?.focus();
        win.Telegram.WebApp.readTextFromClipboard((text: string | null) => {
          if (text) {
            this.reference.set(text);
            this.errorHandler.showSuccessToast('Referencia pegada');
          } else {
            this.errorHandler.showToast('No se pudo leer el portapapeles.', 'error');
          }
        });
      } else {
        // Standard browser — focus + paste via Clipboard API
        this.refInput?.nativeElement?.focus();
        navigator.clipboard.readText().then((text) => {
          if (text) {
            this.reference.set(text);
            this.errorHandler.showSuccessToast('Referencia pegada');
          } else {
            this.errorHandler.showToast('No hay texto para pegar.', 'info');
          }
        }).catch(() => {
          this.errorHandler.showToast('No se pudo acceder al portapapeles.', 'error');
        });
      }
    }

async onConfirm() {
      if (!this.isValidReference()) return;

      const user = this.authService.user();
      if (!user?.id) {
        this.depositError.emit('Sesión expirada');
        return;
      }

      this.isProcessing.set(true);
      
      // --- INICIO DE LA MODIFICACIÓN ---
      console.log('[PaymentScreen] INICIANDO onConfirm');
      console.log('[PaymentScreen] Moneda:', this.currency());
      console.log('[PaymentScreen] Es Colombiano?:', this.isColombianMethod());
      
      const originalAmount = this.amount();
      const payloadAmount = this.isColombianMethod() ? originalAmount / 1000 : originalAmount;

      console.log('[PaymentScreen] Monto Original:', originalAmount);
      console.log('[PaymentScreen] Monto para Payload:', payloadAmount);

      const timestamp = Math.floor(Date.now() / 1000);
      const token = await generateSignedToken(user.id, timestamp);
      
      const payload = {
        amountUSD: payloadAmount,
        method: this.methodMap[this.currency()] ?? 0,
        token,
        uid: user.id,
        transactionId: this.reference(),
      };

      console.log('[PaymentScreen] Payload a Enviar:', payload);
      // --- FIN DE LA MODIFICACIÓN ---
      
      const result = await this.walletService.addDeposit(payload);

      this.isProcessing.set(false);

      if (!result.success) {
        this.depositError.emit(result.error ?? 'Error al procesar el depósito');
        return;
      }

    // Emit success event with all details for parent to show modal
    this.depositSuccess.emit({
      message: result.message ?? 'Depósito confirmado',
      txnId: result.txnId ?? '',
      orderNumber: result.orderNumber ?? '',
      invoiceUrl: result.invoiceUrl ?? ''
    });
   }
}
