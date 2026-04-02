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
        <div class="flex flex-col gap-2 px-6 pt-4 pb-6 w-full relative z-10">
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CryptoDepositModalComponent {
  currency = input.required<string>();
  address = input.required<string>();
  logo = input.required<string>();
  close = output<void>();

  showCopiedMessage = signal(false);

  displayName = computed(() => {
    const names: Record<string, string> = { 'USDT': 'Tether USDT', 'BTC': 'Bitcoin', 'TRX': 'TRON TRX', 'BNB': 'Binance Coin' };
    return names[this.currency()] || this.currency();
  });

  onClose() { this.close.emit(); }
  onBackdropClick(event: MouseEvent) { if ((event.target as HTMLElement).classList.contains('fixed')) this.onClose(); }

  async copyAddress() {
    await navigator.clipboard.writeText(this.address());
    this.showCopiedMessage.set(true);
    setTimeout(() => this.showCopiedMessage.set(false), 2000);
  }
}
