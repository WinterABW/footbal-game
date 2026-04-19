import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-deposit-response-modal',
  template: `
    <div class="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-fade-in">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-3xl"></div>
      
      <!-- Main Glass Container -->
      <div class="relative w-full max-w-md overflow-hidden bg-white/0.05 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.9)] animate-scale-up">
        <!-- Top highlight -->
        <span class="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none"></span>
        
        <!-- Content -->
        <div class="p-6 flex flex-col items-center">
          <!-- Success Icon with glow -->
          <div class="relative mb-6">
            <div class="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div class="relative w-16 h-16 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full border-2 border-emerald-400/40 flex items-center justify-center shadow-soft-emerald">
              <svg class="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <!-- Title -->
          <h2 class="text-xl font-semibold text-white text-center mb-1 leading-tight tracking-tight">
            ¡Depósito Enviado!
          </h2>
          
          <!-- Subtitle -->
          <p class="text-xs font-medium text-cyan-300/60 uppercase tracking-wider text-center mb-6 leading-relaxed">
            Factura creada exitosamente
          </p>

          <!-- Transaction Details Card -->
          <div class="w-full bg-white/5 backdrop-blur-2xl rounded-xl border border-white/10 p-4 mb-4 space-y-3">
            <!-- Transaction ID -->
            @if (txnId()) {
              <div class="flex items-start gap-2">
                <div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <span class="text-[7px] font-medium text-white/50 uppercase tracking-[0.2em] block mb-0.5">ID de Transacción</span>
                  <code class="text-[8px] font-mono tracking-wider break-all text-white/80">{{ txnId() }}</code>
                </div>
              </div>
            } @else {
              <div class="flex items-start gap-2 opacity-50">
                <div class="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <span class="text-[7px] font-medium text-white/30 uppercase tracking-[0.2em] block mb-0.5">ID de Transacción</span>
                  <span class="text-[8px] font-mono tracking-wider text-white/40">---</span>
                </div>
              </div>
            }
            
            <!-- Order Number -->
            @if (orderNumber()) {
              <div class="flex items-start gap-2">
                <div class="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div class="flex-1">
                  <span class="text-[7px] font-medium text-white/50 uppercase tracking-[0.2em] block mb-0.5">Número de Orden</span>
                  <span class="text-[8px] font-mono tracking-wider text-amber-300">{{ orderNumber() }}</span>
                </div>
              </div>
            } @else {
              <div class="flex items-start gap-2 opacity-50">
                <div class="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div class="flex-1">
                  <span class="text-[7px] font-medium text-white/30 uppercase tracking-[0.2em] block mb-0.5">Número de Orden</span>
                  <span class="text-[8px] font-mono tracking-wider text-white/40">---</span>
                </div>
              </div>
            }
          </div>

          <!-- Invoice Button -->
          @if (invoiceUrl()) {
            <a [href]="invoiceUrl()" target="_blank" 
               class="group relative overflow-hidden w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-soft-amber hover:shadow-amber-300 active:scale-[0.98]"
               style="background: linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(251,191,36,0.08) 100%); border: 1px solid rgba(245,158,11,0.2);">
              
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              
              <div class="relative z-10 w-4 h-4 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <svg class="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <span class="relative z-10 text-[9px] font-bold text-amber-300 tracking-wider">Ver Factura</span>
              
              <svg class="relative z-10 w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              
              <span class="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </a>
          } @else {
            <div class="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-white/5 border border-white/10 opacity-50">
              <div class="w-4 h-4 rounded-md bg-white/10 flex items-center justify-center">
                <svg class="w-3 h-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span class="text-[9px] font-medium text-white/30 tracking-wider">Ver Factura</span>
            </div>
          }

          <!-- Close Button -->
          <button (click)="onClose()" class="mt-4 w-full py-2.5 px-5 rounded-lg font-medium text-xs uppercase tracking-wider transition-all duration-300 active:scale-[0.97] text-white bg-white/5 border border-white/10 hover:bg-white/10">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-scale-up { animation: scaleUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    @keyframes scaleUp { from { transform: scale(0.6) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    .shadow-soft-emerald { box-shadow: 0 0 30px rgba(52, 211, 153, 0.15), 0 0 60px rgba(52, 211, 153, 0.05); }
    .shadow-soft-amber { box-shadow: 0 0 30px rgba(245,158,11,0.15), 0 0 60px rgba(245,158,11,0.05); }
    .hover\\:shadow-amber-300:hover { box-shadow: 0 0 32px rgba(245,158,11,0.28), 0 12px 40px rgba(0, 0, 0, 0.45); }
    .rounded-3xl { border-radius: 1.5rem; }
    .text-xs { font-size: 0.75rem; }
    .text-\\[11px\\] { font-size: 11px; }
    .text-\\[9px\\] { font-size: 9px; }
    .text-\\[10px\\] { font-size: 10px; }
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