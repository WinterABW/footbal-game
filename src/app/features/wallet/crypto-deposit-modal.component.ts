import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-crypto-deposit-modal',
  imports: [NgOptimizedImage],
  template: `
    <div class="fixed inset-0 z-[200] flex items-center justify-center p-5 animate-fade-in" (click)="onBackdropClick($event)">
      <div class="absolute inset-0 bg-[#010208]/80 backdrop-blur-2xl"></div>

      <div class="relative w-full max-w-sm overflow-hidden bg-white/[0.03] backdrop-blur-3xl rounded-[28px] flex flex-col items-center shadow-[0_30px_80px_rgba(0,0,0,0.8)] border border-white/[0.08] animate-slide-up">
        <!-- Top highlight -->
        <span class="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"></span>

        <!-- Close button -->
        <button class="absolute top-3 right-3 w-8 h-8 bg-white/[0.05] border border-white/[0.08] rounded-lg flex items-center justify-center active:scale-90 transition-all z-20 hover:bg-white/[0.1]" (click)="onClose()">
          <svg class="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <!-- Header: icon + name -->
        <div class="flex flex-col items-center pt-6 pb-4 px-6 relative z-10">
          <div class="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3 shadow-xl">
            <img [ngSrc]="logo()" alt="Currency" width="40" height="40" class="object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]" priority />
          </div>
          <h2 class="text-lg font-black text-white tracking-tight uppercase text-glow text-center">{{ displayName() }}</h2>
          <span class="text-[7px] font-black text-white/15 uppercase tracking-[0.25em] mt-0.5">Recarga de Activo Digital</span>
        </div>

        <!-- Info pills -->
        <div class="flex gap-2 px-6 pb-4 w-full relative z-10">
          <div class="flex-1 flex items-center gap-2 py-2 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
            <svg class="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span class="text-[7px] font-black text-white/30 uppercase tracking-wider">Instantáneo</span>
          </div>
          <div class="flex-1 flex items-center gap-2 py-2 px-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
            <svg class="w-3.5 h-3.5 text-indigo-400/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span class="text-[7px] font-black text-white/30 uppercase tracking-wider">Cifrado</span>
          </div>
        </div>

        <!-- Divider -->
        <div class="w-[calc(100%-3rem)] h-px bg-white/[0.04]"></div>

        <!-- Address -->
        <div class="flex flex-col gap-2 px-6 pt-4 pb-4 w-full relative z-10">
          <span class="text-[7px] font-black text-white/15 uppercase tracking-[0.25em]">Dirección de Depósito</span>
          <div class="bg-black/40 backdrop-blur-3xl border border-white/[0.08] rounded-xl p-4 flex items-center gap-3 relative">
            <code class="flex-1 text-[10px] font-black text-white/60 tracking-wider break-all leading-relaxed uppercase">{{ address() }}</code>
            <button (click)="copyAddress()" class="flex-shrink-0 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/[0.08] text-white/70 active:scale-95 transition-all">
              <span class="text-[9px] font-black uppercase tracking-widest">{{ showCopiedMessage() ? '✓ OK' : 'Copiar' }}</span>
            </button>
          </div>

          @if (showCopiedMessage()) {
            <div class="text-center text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] animate-fade-in text-glow-emerald mt-1">Dirección Copiada</div>
          }
        </div>

        <!-- Disclaimer about blockchain confirmation -->
        <div class="px-6 pb-3 w-full relative z-10" data-testid="disclaimer">
          <p class="text-[8px] font-black text-white/25 uppercase tracking-wider text-center leading-relaxed">
            El crédito ocurrirá después de la confirmación de la red blockchain
          </p>
        </div>

        <!-- Error Message Display -->
        @if (errorMessage() && errorMessage().length > 0) {
          <div class="px-6 pb-3 w-full relative z-10" data-testid="error-message">
            <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
              <p class="text-[9px] font-black text-red-400 uppercase tracking-wider">{{ errorMessage() }}</p>
            </div>
            <button 
              (click)="onRetry()" 
              data-testid="retry-btn"
              class="mt-2 w-full py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/[0.08] text-white/70 active:scale-95 transition-all">
              <span class="text-[9px] font-black uppercase tracking-widest">Reintentar</span>
            </button>
          </div>
        }

        <!-- Confirmation Button -->
        <div class="px-6 pb-6 w-full relative z-10">
          <button 
            (click)="onConfirm()" 
            [disabled]="isLoading()"
            data-testid="confirm-btn"
            class="w-full py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 active:scale-[0.97] text-white btn-confirm"
            [class.opacity-50]="isLoading()"
            [class.cursor-not-allowed]="isLoading()">
            @if (isLoading()) {
              <span data-testid="loading-spinner" class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
            }
            {{ isLoading() ? 'Procesando...' : 'Confirmar que/envié los fondos' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .text-glow { text-shadow: 0 0 12px rgba(255, 255, 255, 0.25); }
    .text-glow-emerald { text-shadow: 0 0 10px rgba(52, 211, 153, 0.4); }
    .btn-confirm {
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
    .btn-confirm:hover:not(:disabled) {
      background: rgba(0, 212, 255, 0.20);
      border-color: rgba(0, 212, 255, 0.45);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.25),
        0 0 32px rgba(0, 212, 255, 0.28),
        0 12px 40px rgba(0, 0, 0, 0.45);
    }
    .btn-confirm:active:not(:disabled) {
      background: rgba(0, 212, 255, 0.10);
      transform: scale(0.97);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CryptoDepositModalComponent {
  currency = input.required<string>();
  address = input.required<string>();
  logo = input.required<string>();
  close = output<void>();
  
  // Phase 2.1: New outputs and inputs
  confirm = output<{ amount: number; method: string }>();
  isLoading = input<boolean>(false);
  
  // Phase 2.2: Error message signal
  errorMessage = input<string>('');

  showCopiedMessage = signal(false);

  displayName = computed(() => {
    const names: Record<string, string> = { 'USDT': 'Tether USDT', 'BTC': 'Bitcoin', 'TRX': 'TRON TRX', 'BNB': 'Binance Coin' };
    return names[this.currency()] || this.currency();
  });

  onClose() { this.close.emit(); }
  onBackdropClick(event: MouseEvent) { if ((event.target as HTMLElement).classList.contains('fixed')) this.onClose(); }

  onConfirm() {
    if (this.isLoading()) return;
    // Emit with amount and method - the amount will be passed from parent
    this.confirm.emit({ amount: 0, method: this.currency() });
  }

  onRetry() {
    // Clear error message by setting empty - parent should handle this
    // For now, just emit close to allow retry from beginning, or we could emit a specific retry event
    this.close.emit();
  }

  async copyAddress() {
    await navigator.clipboard.writeText(this.address());
    this.showCopiedMessage.set(true);
    setTimeout(() => this.showCopiedMessage.set(false), 2000);
  }
}
