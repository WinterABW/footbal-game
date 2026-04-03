import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-toast',
  imports: [],
  template: `
    @if (toast(); as t) {
      <div class="fixed top-[calc(env(safe-area-inset-top,0px)+3.5rem)] left-3 right-3 z-[9999] flex justify-center pointer-events-none"
           aria-live="polite" role="status">
        <div class="animate-toast-in pointer-events-auto max-w-sm w-full"
             [style.--toast-duration]="(t.durationMs ?? 3000) + 'ms'"
             [class]="t.type === 'success' ? 'toast-success' : t.type === 'error' ? 'toast-error' : 'toast-info'">
          <div class="flex items-center gap-2.5 px-3.5 py-2.5">
            <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 toast-icon">
              @if (t.type === 'success') {
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              } @else if (t.type === 'error') {
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              } @else {
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/>
                </svg>
              }
            </div>
            <p class="text-[12px] font-medium leading-snug flex-1 toast-text">{{ t.message }}</p>
          </div>
          <div class="toast-progress"></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .toast-success, .toast-error, .toast-info {
      position: relative;
      overflow: hidden;
      border-radius: 14px;
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border: 1px solid rgba(255, 255, 255, 0.06);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }

    .toast-success {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.06));
      border-color: rgba(16, 185, 129, 0.15);
    }
    .toast-success .toast-icon { background: rgba(16, 185, 129, 0.12); color: #34d399; }
    .toast-success .toast-text { color: rgba(255, 255, 255, 0.88); }
    .toast-success .toast-progress { background: linear-gradient(90deg, #10b981, #34d399); }

    .toast-error {
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(225, 29, 72, 0.06));
      border-color: rgba(244, 63, 94, 0.15);
    }
    .toast-error .toast-icon { background: rgba(244, 63, 94, 0.12); color: #fb7185; }
    .toast-error .toast-text { color: rgba(255, 255, 255, 0.88); }
    .toast-error .toast-progress { background: linear-gradient(90deg, #f43f5e, #fb7185); }

    .toast-info {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.04));
      border-color: rgba(59, 130, 246, 0.12);
    }
    .toast-info .toast-icon { background: rgba(59, 130, 246, 0.12); color: #60a5fa; }
    .toast-info .toast-text { color: rgba(255, 255, 255, 0.82); }
    .toast-info .toast-progress { background: linear-gradient(90deg, #3b82f6, #60a5fa); }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 1.5px;
      border-radius: 0 0 14px 14px;
      animation: toastProgress var(--toast-duration, 3000ms) linear forwards;
    }
    @keyframes toastProgress {
      from { width: 100%; }
      to { width: 0%; }
    }

    .animate-toast-in {
      animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes toastSlideIn {
      from { transform: translateY(-10px) scale(0.97); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .animate-toast-in { animation: none; }
      .toast-progress { animation: none; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  protected readonly toast = inject(ErrorHandlerService).toast;
}
