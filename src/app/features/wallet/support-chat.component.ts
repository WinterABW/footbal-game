import { ChangeDetectionStrategy, Component, output, signal, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportService } from '../../services/support.service';
import { ErrorHandlerService } from '../../core/services/error-handler.service';

@Component({
  selector: 'app-support-chat',
  imports: [NgOptimizedImage, FormsModule],
  template: `
    <section class="fixed inset-0 z-[200] flex flex-col overflow-hidden animate-slide-up chat-bg">

      <!-- Header -->
      <div class="pt-safe-top"></div>
      <header class="relative z-10 w-full px-5 py-3 border-b border-white/5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <div class="relative flex-shrink-0">
              <div class="w-10 h-10 rounded-full overflow-hidden border border-white/15 p-0.5">
                <img ngSrc="shared/icons/support.webp" alt="Soporte" width="40" height="40" class="rounded-full object-cover w-full h-full" />
              </div>
              <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0e0228]"></div>
            </div>
            <div class="flex flex-col justify-center">
              <h2 class="text-sm font-black text-white uppercase tracking-tight leading-none">Soporte</h2>
              <span class="text-[8px] font-bold text-emerald-400/70 uppercase tracking-widest leading-none mt-1">Online</span>
            </div>
          </div>
          <button (click)="onClose()" 
                  class="w-10 h-10 flex-shrink-0 lg-module-card flex items-center justify-center active:scale-90 transition-transform">
            <svg class="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Messages -->
      <main class="relative z-10 flex-1 overflow-y-auto no-scrollbar px-5 py-5 flex flex-col gap-4">
        @for (message of messages(); track message.id) {
          <div class="flex animate-fade-in"
               [class.justify-end]="!message.isFromSupport" 
               [class.justify-start]="message.isFromSupport">
            <div class="max-w-[80%] lg-module-card p-4 text-[13px] font-medium leading-relaxed"
                 [class.rounded-br-md]="!message.isFromSupport"
                 [class.rounded-bl-md]="message.isFromSupport">
              <p class="text-white/90">{{ message.content }}</p>
              <span class="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-2 block"
                    [class.text-right]="!message.isFromSupport">{{ formatTime(message.timestamp) }}</span>
            </div>
          </div>
        }
      </main>

      <!-- Footer -->
      <footer class="relative z-10 w-full px-5 py-3 border-t border-white/5">
        <form (ngSubmit)="onSendMessage()" class="flex items-center gap-3">
          <div class="flex-1 h-12 lg-module-card overflow-hidden">
            <input 
              type="text" 
              class="w-full h-full bg-transparent px-5 text-sm font-medium text-white outline-none placeholder:text-white/15"
              placeholder="Escribe un mensaje..."
              [value]="newMessage()"
              (input)="newMessage.set($any($event.target).value)"
            />
          </div>
          <button type="submit" 
            class="w-12 h-12 flex-shrink-0 rounded-full bg-white/90 text-[#0e0228] flex items-center justify-center active:scale-90 transition-all disabled:opacity-20 disabled:scale-100" 
            [disabled]="!newMessage().trim()">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
      </footer>
      <div class="pb-safe-bottom"></div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .chat-bg {
      background:
        radial-gradient(ellipse at 12% 65%, rgba(13, 27, 110, .95) 0%, transparent 50%),
        radial-gradient(ellipse at 88% 35%, rgba(160, 24, 130, .85) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 100%, rgba(90, 15, 155, .70) 0%, transparent 48%),
        radial-gradient(ellipse at 50% 0%, rgba(8, 15, 80, .80) 0%, transparent 55%),
        linear-gradient(148deg, #060c2a 0%, #0e0228 45%, #130430 75%, #07051a 100%);
    }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 0.75rem); }
    .pb-safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0.75rem); }
    .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportChatComponent implements OnInit, OnDestroy {
  closeChat = output<void>();
  
  private supportService = inject(SupportService);
  private errorHandler = inject(ErrorHandlerService);
  
  // Bind directly to service signals
  messages = this.supportService.messages;
  hasPending = this.supportService.hasPending;
  newMessage = signal('');
  
  constructor() {
    // Watch for send errors and show toast
    effect(() => {
      const error = this.supportService.sendError();
      if (error) {
        this.errorHandler.showErrorToast(error, 'support_chat');
      }
    });
  }

  ngOnInit() {
    // Start polling when component initializes
    this.supportService.startPolling();
  }
  
  ngOnDestroy() {
    // Stop polling when component is destroyed
    this.supportService.stopPolling();
  }
  
  onClose() {
    this.closeChat.emit();
  }
  
  onSendMessage() {
    const text = this.newMessage().trim();
    if (text) {
      this.supportService.sendMessage(text);
      // Clear input on success (service handles optimistic UI)
      this.newMessage.set('');
    }
  }
  
  formatTime(timestamp: string | Date): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
}
