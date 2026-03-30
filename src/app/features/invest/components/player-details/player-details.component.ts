import { ChangeDetectionStrategy, Component, computed, HostListener, input, output, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import type { InvestApiPlayer } from '../../../../models/invest.model';

@Component({
  selector: 'app-player-details',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  template: `
    <div class="fixed inset-0 z-[150] bg-black/70 backdrop-blur-md animate-fade-in" (click)="onClose()"></div>
    
    <div class="fixed inset-0 z-[160] flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="player-title" [attr.tabindex]="-1" #modalWrapper>
      <div class="w-full bg-gradient-to-b from-white/[0.08] via-white/[0.05] to-white/[0.02] backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden max-h-[85vh] rounded-t-2xl">
        <div class="w-10 h-1 bg-white/20 rounded-full mx-auto mt-2 mb-1"></div>

        <div class="flex items-center justify-between px-4 pt-2 pb-2">
          <h2 id="player-title" class="text-lg font-black text-white tracking-tight">{{ player().name }}</h2>
          <button #closeBtn (click)="onClose()" class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all" aria-label="Cerrar">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="flex flex-col px-4 pb-3 overflow-y-auto max-h-[80vh]">
          <div class="flex items-center gap-3 mb-3 -mx-1">
            <div class="w-20 h-20 flex-shrink-0">
              <img [ngSrc]="player().imagen" [alt]="player().name" width="80" height="80" class="w-full h-full object-contain">
            </div>
            <div class="flex-1 flex flex-col gap-1">
              <div class="flex justify-between items-center bg-white/5 rounded-lg px-2 py-1.5 text-[10px]">
                <span class="text-white/40">Edad</span>
                <span class="text-white font-bold">{{ age() }}</span>
              </div>
              <div class="flex justify-between items-center bg-white/5 rounded-lg px-2 py-1.5 text-[10px]">
                <span class="text-white/40">Altura</span>
                <span class="text-white font-bold">{{ height() }}cm</span>
              </div>
              <div class="flex justify-between items-center bg-white/5 rounded-lg px-2 py-1.5 text-[10px]">
                <span class="text-white/40">Nivel</span>
                <span class="text-amber-400 font-bold">Lv.{{ level() }}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2 mb-3">
            <div class="flex justify-between items-center bg-amber-500/10 rounded-lg px-3 py-2 border border-amber-500/20">
              <span class="text-amber-400/70 text-[10px] font-bold uppercase">Valor</span>
              <span class="text-white font-black">{{ player().price | number }} <span class="text-[9px] text-amber-400/60">COP</span></span>
            </div>
            <div class="flex justify-between items-center bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-500/20">
              <span class="text-emerald-400/70 text-[10px] font-bold uppercase">/Hora</span>
              <span class="text-white font-bold">+{{ player().interest | number }} <span class="text-[9px] text-emerald-400/60">COP</span></span>
            </div>
            <div class="flex justify-between items-center bg-blue-500/10 rounded-lg px-3 py-2 border border-blue-500/20">
              <span class="text-blue-400/70 text-[10px] font-bold uppercase">/Día</span>
              <span class="text-white font-bold">+{{ (player().interest * 24) | number }}</span>
            </div>
            <div class="flex justify-between items-center bg-purple-500/10 rounded-lg px-3 py-2 border border-purple-500/20">
              <span class="text-purple-400/70 text-[10px] font-bold uppercase">Total</span>
              <span class="text-white font-bold">+{{ totalEarnings() | number }}</span>
            </div>
            <div class="flex justify-between items-center bg-cyan-500/10 rounded-lg px-3 py-2 border border-cyan-500/20">
              <span class="text-cyan-400/70 text-[10px] font-bold uppercase">Contrato</span>
              <span class="text-white font-bold">{{ player().days }} <span class="text-[9px] text-cyan-400/60">días</span></span>
            </div>
          </div>

          <div class="flex gap-2 mt-1">
            <button (click)="onClose()" class="flex-1 py-2.5 text-xs font-bold text-white/70 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">Cancelar</button>
            <button (click)="onConfirm()" class="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl hover:opacity-90 transition-all">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerDetailsComponent implements AfterViewInit {
  player = input.required<InvestApiPlayer>();
  confirm = output<InvestApiPlayer>();
  close = output<void>();

  @ViewChild('modalWrapper') modalWrapper!: ElementRef;
  @ViewChild('closeBtn') closeBtn!: ElementRef;

  // Hardcoded values for fields not in API
  age = computed(() => 25);
  height = computed(() => 180);
  level = computed(() => 1);

  totalEarnings = computed(() => {
    const p = this.player();
    return p.interest * 24 * p.days;
  });

  ngAfterViewInit() {
    if (this.closeBtn) {
      this.closeBtn.nativeElement.focus();
    }
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.onClose();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const focusableElements = this.modalWrapper.nativeElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;

      const first = focusableElements[0] as HTMLElement;
      const last = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
        } else {
          const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
          if (currentIndex > 0) {
            (focusableElements[currentIndex - 1] as HTMLElement).focus();
          }
        }
      } else {
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
