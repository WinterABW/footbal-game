import { ChangeDetectionStrategy, Component, computed, HostListener, input, output, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Player } from '../../../../services/players.service';

@Component({
  selector: 'app-player-details',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
      <div class="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm animate-fade-in" (click)="onClose()"></div>
      
      <div class="fixed inset-0 z-[160] flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="player-title" [attr.tabindex]="-1" #modalWrapper>
        <div class="w-full bg-[#16143f] rounded-t-[32px] flex flex-col shadow-[0_-8px_30px_rgb(0,0,0,0.6)] relative overflow-hidden ring-1 ring-white/10 animate-slide-up max-h-[95vh]">
          
          <!-- Handle indicator -->
          <div class="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1"></div>

          <!-- Header -->
          <div class="flex items-center justify-between px-6 pt-3 pb-2 flex-shrink-0">
            <h2 id="player-title" class="m-0 p-0 text-xl font-bold text-[#a79cf1]">{{ player().name }}</h2>
            <button #closeBtn (click)="onClose()" class="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#5b51ff]" aria-label="Cerrar">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex flex-col px-6 pb-6 mt-2 overflow-y-auto">
            <!-- Top Section: 50% Image, 50% Stats -->
            <div class="flex flex-row items-center gap-4 mb-4 flex-shrink-0">
              <!-- Player Image (50%) -->
              <div class="w-1/2 flex justify-center">
                <img [ngSrc]="imageUrlWebp()" [alt]="player().name" width="130" height="180" class="object-contain drop-shadow-2xl max-h-[180px]">
              </div>

              <!-- Basic Parameters (50%) -->
              <div class="w-1/2 flex flex-col gap-2">
                <div class="flex justify-between items-center bg-[#0d0b26]/60 rounded-xl px-3 py-2">
                  <span class="text-white/60 text-xs font-medium">Edad:</span>
                  <span class="text-white font-bold text-sm">{{ player().age || 'N/A' }}</span>
                </div>
                <div class="flex justify-between items-center bg-[#0d0b26]/60 rounded-xl px-3 py-2">
                  <span class="text-white/60 text-xs font-medium">Altura:</span>
                  <span class="text-white font-bold text-sm">{{ player().height || 'N/A' }} cm</span>
                </div>
                <div class="flex justify-between items-center bg-[#0d0b26]/60 rounded-xl px-3 py-2">
                  <span class="text-white/60 text-xs font-medium">Lesiones:</span>
                  <span class="text-white font-bold text-sm">{{ player().injuries || 0 }}</span>
                </div>
                <div class="flex justify-between items-center bg-[#0d0b26]/60 rounded-xl px-3 py-2">
                  <span class="text-white/60 text-xs font-medium">Goles:</span>
                  <span class="text-white font-bold text-sm">{{ totalGoals() | number }}</span>
                </div>
              </div>
            </div>

            <!-- Instruction -->
            <p class="text-center text-sm text-white/90 font-medium mb-6 flex-shrink-0">Contrata este jugador para aumentar tu equipo.</p>

            <!-- Stats List -->
            <div class="flex flex-col gap-2 mb-6 flex-shrink-0">
              <div class="flex justify-between items-center bg-[#0d0b26] rounded-xl px-4 py-3">
                <span class="text-white/60 text-sm font-medium">Valor:</span>
                <span class="text-[#ffc107] font-bold text-sm">{{ player().price | number }} COP</span>
              </div>
              <div class="flex justify-between items-center bg-[#0d0b26] rounded-xl px-4 py-3">
                <span class="text-white/60 text-sm font-medium">Ganancias por hora:</span>
                <span class="text-white font-bold text-sm">{{ player().earning | number }} COP</span>
              </div>
              <div class="flex justify-between items-center bg-[#0d0b26] rounded-xl px-4 py-3">
                <span class="text-white/60 text-sm font-medium">Ganancias por día:</span>
                <span class="text-white font-bold text-sm">{{ (player().earning * 24) | number }} COP</span>
              </div>
              <div class="flex justify-between items-center bg-[#0d0b26] rounded-xl px-4 py-3">
                <span class="text-white/60 text-sm font-medium">Ganancias totales:</span>
                <span class="text-white font-bold text-sm">{{ (player().earning * 24 * player().contract_days) | number }} COP</span>
              </div>
              <div class="flex justify-between items-center bg-[#0d0b26] rounded-xl px-4 py-3">
                <span class="text-white/60 text-sm font-medium">Tiempo del contrato:</span>
                <span class="text-white font-bold text-sm">{{ player().contract_days }} Días</span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="grid grid-cols-2 gap-3 mt-auto flex-shrink-0">
              <button (click)="onClose()" class="py-3 px-4 text-sm font-bold text-white/90 bg-[#24214f] border border-[#3b367d] rounded-xl hover:bg-[#2e2a69] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#5b51ff]">Cancelar</button>
              <button (click)="onConfirm()" class="py-3 px-4 text-sm font-bold text-white bg-[#5b51ff] rounded-xl hover:bg-[#4a41cc] active:scale-95 transition-all shadow-lg shadow-[#5b51ff]/20 focus:outline-none focus:ring-2 focus:ring-[#a79cf1]">Confirmar</button>
            </div>
          </div>
        </div>
      </div>
    `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerDetailsComponent implements AfterViewInit {
  player = input.required<Player>();
  confirm = output<Player>();
  close = output<void>();

  @ViewChild('modalWrapper') modalWrapper!: ElementRef;
  @ViewChild('closeBtn') closeBtn!: ElementRef;

  imageUrlWebp = computed(() => {
    const url = this.player().imageUrl;
    return url ? url.replace('.png', '.webp') : '';
  });

  totalGoals = computed(() => {
    const p = this.player();
    return (p.earning || 0) * 24 * (p.contract_days || 0);
  });

  ngAfterViewInit() {
    // Set initial focus on close button for accessibility
    if (this.closeBtn) {
      this.closeBtn.nativeElement.focus();
    }
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.onClose();
    } else if (event.key === 'Tab') {
      // Simple focus trap: keep focus within modal
      event.preventDefault();
      const focusableElements = this.modalWrapper.nativeElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;

      const first = focusableElements[0] as HTMLElement;
      const last = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift+Tab: move focus backward
        if (document.activeElement === first) {
          last.focus();
        } else {
          const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
          if (currentIndex > 0) {
            (focusableElements[currentIndex - 1] as HTMLElement).focus();
          }
        }
      } else {
        // Tab: move focus forward
        if (document.activeElement === last) {
          first.focus();
        } else {
          const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
          if (currentIndex < focusableElements.length - 1) {
            (focusableElements[currentIndex + 1] as HTMLElement).focus();
          }
        }
      }
    }
  }

  onConfirm() { this.confirm.emit(this.player()); }
  onClose() { this.close.emit(); }
}
