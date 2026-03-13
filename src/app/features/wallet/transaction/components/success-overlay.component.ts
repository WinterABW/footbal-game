import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-overlay',
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-fade-in">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-xl"></div>
      
      <div class="relative w-full max-w-sm lg-card-panel !rounded-[40px] p-12 flex flex-col items-center shadow-[0_40px_100px_rgba(0,0,0,0.8)] animate-scale-up">
        
        <div class="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
          <svg class="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 class="text-2xl font-black text-white tracking-tight uppercase text-glow-emerald text-center mb-4">¡Éxito!</h2>
        <p class="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] text-center leading-relaxed">{{ message() }}</p>

        <div class="mt-10 w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div class="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] animate-progress"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .animate-scale-up { animation: scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
    @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .text-glow-emerald { text-shadow: 0 0 20px rgba(52, 211, 153, 0.4); }
    .animate-progress { animation: progress 2s linear forwards; width: 0; }
    @keyframes progress { to { width: 100%; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessOverlayComponent {
  message = input.required<string>();
}
