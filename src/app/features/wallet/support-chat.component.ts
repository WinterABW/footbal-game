import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  id: number; text: string; timestamp: Date; sender: 'user' | 'support';
}

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
               [class.justify-end]="message.sender === 'user'" 
               [class.justify-start]="message.sender === 'support'">
            <div class="max-w-[80%] lg-module-card p-4 text-[13px] font-medium leading-relaxed"
                 [class.rounded-br-md]="message.sender === 'user'"
                 [class.rounded-bl-md]="message.sender === 'support'">
              <p class="text-white/90">{{ message.text }}</p>
              <span class="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-2 block"
                    [class.text-right]="message.sender === 'user'">{{ formatTime(message.timestamp) }}</span>
            </div>
          </div>
        }
      </main>

      <!-- Footer -->
      <footer class="relative z-10 w-full px-5 py-3 border-t border-white/5">
        <form (ngSubmit)="sendMessage()" class="flex items-center gap-3">
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
export class SupportChatComponent {
  closeChat = output<void>();

  messages = signal<Message[]>([
    { id: 1, text: '¡Hola! 👋 ¿En qué podemos ayudarte hoy?', timestamp: new Date(), sender: 'support' },
    { id: 2, text: 'Tengo un problema con un depósito que no se ha reflejado en mi cuenta.', timestamp: new Date(Date.now() - 2 * 60000), sender: 'user' },
    { id: 3, text: 'Entendido. Por favor, bríndame el número de orden o la referencia de la transacción para poder verificarlo.', timestamp: new Date(Date.now() - 1 * 60000), sender: 'support' }
  ]);

  newMessage = signal('');

  onClose() { this.closeChat.emit(); }

  sendMessage() {
    const text = this.newMessage().trim();
    if (text) {
      const message: Message = { id: Date.now(), text, timestamp: new Date(), sender: 'user' };
      this.messages.update(m => [...m, message]);
      this.newMessage.set('');
      setTimeout(() => {
        const reply: Message = { id: Date.now() + 1, text: 'Estamos verificando la información. Un operador te atenderá en breve.', timestamp: new Date(), sender: 'support' };
        this.messages.update(m => [...m, reply]);
      }, 1500);
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
}
