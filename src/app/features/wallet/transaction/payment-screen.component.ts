import { ChangeDetectionStrategy, Component, computed, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-screen',
  imports: [CommonModule],
  template: `
    <section class="fixed inset-0 z-[100] flex flex-col w-full overflow-hidden payment-bg">
      
      <!-- Toast -->
      @if (toastVisible()) {
        <div class="fixed top-24 left-1/2 -translate-x-1/2 z-[200] liquid-glass-card px-6 py-3 border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest animate-bounce-subtle whitespace-nowrap">
          {{ toastMessage() }}
        </div>
      }

      <!-- Header -->
      <header class="w-full relative z-10 pt-safe-top px-4 h-14 flex items-center justify-center">
        <button (click)="onGoBack()" class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 liquid-glass-card flex items-center justify-center active:scale-90 transition-transform z-20">
          <svg class="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <div class="flex flex-col items-center text-center -mt-1">
          <h1 class="text-xl font-black text-white tracking-wide uppercase">{{ currency() }}</h1>
          <span class="text-[9px] font-black text-white/30 uppercase tracking-[0.25em]">Depósito</span>
        </div>
      </header>

      <main class="flex-1 w-full relative z-10 flex flex-col items-center overflow-y-auto no-scrollbar pb-safe-bottom px-4 gap-2 animate-slide-up">
        
        <!-- Bloque 1: Información -->
        <div class="w-full max-w-sm liquid-glass-card border-white/5 bg-white/[0.02] rounded-[16px] p-2 flex flex-col items-center gap-0 shadow-lg">
          <div class="flex items-center justify-between w-full py-0.5 border-b border-white/5">
            <span class="text-[10px] font-black text-white/30 uppercase tracking-wider">Orden</span>
            <span class="text-xs font-bold text-white tracking-wider">{{ formattedOrderNumber() }}</span>
          </div>
          <div class="flex items-center justify-between w-full py-0.5">
            <span class="text-[10px] font-black text-white/30 uppercase tracking-wider">Monto</span>
            <span class="text-xl font-black text-white">$ {{ displayAmount() }}</span>
          </div>
        </div>

        <!-- Bloque 2: QR -->
        <div class="w-full max-w-sm liquid-glass-card border-white/5 bg-white/[0.02] rounded-[16px] p-3 flex flex-col items-center gap-2 shadow-lg">
          <div class="w-full aspect-square max-w-[280px] bg-white p-2 rounded-lg flex items-center justify-center">
            <img [src]="qrImage()" alt="QR Code" class="w-full h-full object-contain rounded" />
          </div>
          
          <button (click)="onCopy()" class="liquid-glass-button w-full py-2 text-[10px] uppercase tracking-wider">
            @if (copied()) {
              <span class="flex items-center justify-center gap-1">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7" /></svg>
                Copiado
              </span>
            } @else {
              Copiar dirección
            }
          </button>
        </div>

        <!-- Bloque 3: Confirmación -->
        <div class="w-full max-w-sm flex flex-col gap-2">
          <div class="liquid-glass-card border-white/5 bg-white/[0.02] rounded-[16px] p-2.5 flex flex-col gap-1.5 shadow-lg">
            <span class="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Referencia</span>
            
            <div class="relative">
              <input 
                type="text" 
                [value]="reference()"
                (input)="onReferenceChange($event)"
                class="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-24 py-3.5 text-sm font-medium text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-white/20"
                placeholder="Ingrese el número de serie"
                maxlength="20"
              />
              <button 
                (click)="onPaste()" 
                class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 border border-white/5 text-white/70 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors">
                Pegar
              </button>
            </div>

            @if (reference().length > 0 && !isValidReference()) {
              <p class="text-[8px] font-medium text-rose-400/80">Mínimo 6 caracteres</p>
            }
          </div>

          <!-- Botón Confirmar -->
          <button 
            (click)="onConfirm()"
            [disabled]="!isValidReference()"
            class="liquid-glass-button w-full py-3 text-xs font-black uppercase tracking-wider"
            [class.opacity-50]="!isValidReference()">
            Confirmar depósito
          </button>
        </div>
      </main>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .payment-bg {
      background:
        radial-gradient(ellipse at 12% 65%, rgba(13, 27, 110, .95) 0%, transparent 50%),
        radial-gradient(ellipse at 88% 35%, rgba(160, 24, 130, .85) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 100%, rgba(90, 15, 155, .70) 0%, transparent 48%),
        radial-gradient(ellipse at 50% 0%, rgba(8, 15, 80, .80) 0%, transparent 55%),
        linear-gradient(148deg, #060c2a 0%, #0e0228 45%, #130430 75%, #07051a 100%);
    }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1rem); }
    .pb-safe-bottom { padding-bottom: env(safe-area-inset-bottom, 1rem); }
    .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-bounce-subtle { animation: bounceSubtle 0.5s ease-out; }
    @keyframes bounceSubtle { 0% { transform: translate(-50%, 20px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentScreenComponent {
  private router = inject(Router);

  currency = input.required<string>();
  amount = input.required<number>();
  orderNumber = input.required<string>();
  qrImage = input.required<string>();

  reference = signal('');
  copied = signal(false);
  toastVisible = signal(false);
  toastMessage = signal('');

  isValidReference = computed(() => this.reference().length >= 6);

  displayAmount = computed(() => this.amount().toLocaleString('es-CO'));

  formattedOrderNumber = computed(() => this.orderNumber());

  onReferenceChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.reference.set(value);
  }

  onGoBack() {
    this.router.navigate(['/wallet']);
  }

  async onCopy() {
    await navigator.clipboard.writeText(this.orderNumber());
    this.copied.set(true);
    this.showToast('Copiado');
    setTimeout(() => this.copied.set(false), 2000);
  }

  async onPaste() {
    try {
      const text = await navigator.clipboard.readText();
      this.reference.set(text);
      this.showToast('Pegado');
    } catch { }
  }

  private showToast(message: string) {
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 2000);
  }

  onConfirm() {
    if (this.isValidReference()) {
      console.log('Confirmando referencia:', this.reference());
      this.router.navigate(['/wallet']);
    }
  }
}
