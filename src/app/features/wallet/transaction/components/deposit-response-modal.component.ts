import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';

@Component({
  selector: 'app-deposit-response-modal',
  template: `
    <div class="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-fade-in">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>
      
      <div class="relative w-full max-w-sm overflow-hidden bg-white/[0.03] backdrop-blur-3xl rounded-[40px] p-8 flex flex-col items-center shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 animate-scale-up">
        <!-- Top highlight line -->
        <span class="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"></span>
        
        <!-- Icon -->
        <div class="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.25)]">
          <svg class="w-10 h-10 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 class="text-2xl font-black text-white tracking-tight uppercase text-glow-emerald text-center mb-4">¡Depósito Enviado!</h2>
        
        <p class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center leading-relaxed mb-6">{{ responseMessage() }}</p>

        <!-- Response Details -->
        <div class="w-full flex flex-col gap-3 mb-6">
          @if (txnId()) {
            <div class="flex flex-col gap-1 p-3 bg-white/[0.02] rounded-xl border border-white/5">
              <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">ID de Transacción</span>
              <span class="text-[10px] font-bold text-white/60 uppercase tracking-wider break-all">{{ txnId() }}</span>
            </div>
          }
          
          @if (orderNumber()) {
            <div class="flex flex-col gap-1 p-3 bg-white/[0.02] rounded-xl border border-white/5">
              <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Número de Orden</span>
              <span class="text-[10px] font-bold text-white/60 uppercase tracking-wider">{{ orderNumber() }}</span>
            </div>
          }

          @if (invoiceUrl()) {
            <div class="flex flex-col gap-1 p-3 bg-white/[0.02] rounded-xl border border-white/5">
              <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Enlace de Factura</span>
              <a [href]="invoiceUrl()" target="_blank" class="text-[10px] font-bold text-cyan-400 uppercase tracking-wider hover:underline truncate">
                Ver Factura
              </a>
            </div>
          }
        </div>

        <!-- Close Button -->
        <button (click)="onClose()" class="w-full py-3 px-6 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 active:scale-[0.97] text-white bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30">
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-scale-up { animation: scaleUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    @keyframes scaleUp { from { transform: scale(0.6) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    .text-glow-emerald { text-shadow: 0 0 25px rgba(52, 211, 153, 0.6); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositResponseModalComponent {
  responseMessage = input<string>('');
  txnId = input<string>('');
  orderNumber = input<string>('');
  invoiceUrl = input<string>('');
  close = output<void>();

  onClose() {
    this.close.emit();
  }
}