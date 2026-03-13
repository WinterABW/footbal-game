import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';

@Component({
    selector: 'app-crypto-deposit-modal',
    imports: [NgOptimizedImage, CommonModule],
    template: `
    <div class="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in" (click)="onBackdropClick($event)">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-xl"></div>
      
      <div class="relative w-full max-w-md liquid-glass-card rounded-[40px] p-10 flex flex-col items-center shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-white/5 animate-slide-up">
        
        <button class="absolute top-6 right-6 w-10 h-10 liquid-glass-card flex items-center justify-center active:scale-90 transition-transform" (click)="onClose()">
          <svg class="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div class="flex flex-col items-center mb-10">
          <div class="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
            <img [ngSrc]="logo()" alt="Currency" width="56" height="56" class="object-contain" priority />
          </div>
          <h2 class="text-2xl font-black text-white tracking-tight uppercase text-glow">{{ displayName() }}</h2>
          <span class="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mt-1">Recarga de Activo</span>
        </div>

        <div class="w-full space-y-3 mb-10">
          <div class="flex items-start gap-4 p-4 liquid-glass-card bg-emerald-500/[0.03] border-emerald-500/10">
            <span class="text-lg">🚀</span>
            <p class="text-[10px] font-black text-white/60 uppercase tracking-widest leading-relaxed">Liquidación inmediata tras confirmación de red.</p>
          </div>
          <div class="flex items-start gap-4 p-4 liquid-glass-card bg-indigo-500/[0.03] border-indigo-500/10">
            <span class="text-lg">🔐</span>
            <p class="text-[10px] font-black text-white/60 uppercase tracking-widest leading-relaxed">Operación cifrada bajo protocolo E2EE.</p>
          </div>
        </div>

        <div class="w-full flex flex-col gap-3">
          <span class="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Dirección de Depósito</span>
          <div class="liquid-glass-card p-6 bg-white/[0.02] border-white/10 flex items-center justify-between gap-4">
            <code class="text-[11px] font-black text-white/90 tracking-widest break-all leading-relaxed uppercase">{{ address() }}</code>
            <button (click)="copyAddress()" class="flex-shrink-0 w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center active:scale-90 transition-all shadow-xl">
               @if (showCopiedMessage()) {
                 <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7" /></svg>
               } @else {
                 <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
               }
            </button>
          </div>
        </div>

        @if (showCopiedMessage()) {
          <div class="mt-6 text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] animate-fade-in">Link de Pago Copiado</div>
        }
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
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
