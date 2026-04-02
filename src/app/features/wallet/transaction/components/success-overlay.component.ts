import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-success-overlay',
  imports: [],
  template: `
    <div class="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-fade-in">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>
      
      <div class="relative w-full max-w-sm overflow-hidden bg-white/[0.03] backdrop-blur-3xl rounded-[40px] p-12 flex flex-col items-center shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 animate-scale-up">
        <!-- Top highlight line -->
        <span class="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"></span>
        
        <div class="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.25)] relative">
          <svg class="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <!-- Pulse rings -->
          <span class="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping opacity-20"></span>
        </div>

        <h2 class="text-3xl font-black text-white tracking-tight uppercase text-glow-emerald text-center mb-4">¡Éxito!</h2>
        <p class="text-[11px] font-black text-white/40 uppercase tracking-[0.25em] text-center leading-relaxed max-w-[200px]">{{ message() }}</p>

        <div class="mt-10 w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
          <div class="absolute inset-0 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)] animate-progress"></div>
        </div>
        
        <p class="mt-4 text-[8px] font-black text-emerald-400/50 uppercase tracking-widest animate-pulse">Cerrando ventana...</p>
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
    .animate-progress { animation: progress 2.5s linear forwards; width: 0; }
    @keyframes progress {
      0% { width: 0%; }
      100% { width: 100%; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessOverlayComponent {
  message = input.required<string>();
}
