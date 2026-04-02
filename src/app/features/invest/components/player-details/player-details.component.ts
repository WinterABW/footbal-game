import { ChangeDetectionStrategy, Component, computed, HostListener, input, output, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { InvestApiPlayer } from '../../../../models/invest.model';

@Component({
  selector: 'app-player-details',
  imports: [CommonModule],
  template: `
    <!-- Scrim overlay -->
    <div class="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm animate-scrim-in" (click)="onClose()"></div>

    <!-- Bottom sheet -->
    <div class="fixed inset-0 z-[160] flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="player-title" [attr.tabindex]="-1" #modalWrapper>
      <div class="w-full max-w-lg bg-gradient-to-b from-white/[0.07] via-white/[0.04] to-white/[0.02] backdrop-blur-3xl border-t border-white/[0.12] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden max-h-[90vh] rounded-t-[28px] animate-sheet-up">

        <!-- Drag indicator -->
        <div class="flex justify-center pt-3 pb-1">
          <div class="w-10 h-1 bg-white/20 rounded-full"></div>
        </div>

        <!-- Scrollable content -->
        <div class="flex flex-col px-5 pb-6 overflow-y-auto max-h-[85vh]">

          <!-- Hero: Image + Name -->
          <div class="flex flex-col items-center text-center mb-5">
            <!-- Close button (absolute top-right) -->
            <button #closeBtn (click)="onClose()"
              class="absolute top-3 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.1] text-white/50 hover:text-white hover:bg-white/[0.12] transition-all duration-200"
              aria-label="Cerrar detalle del jugador">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <!-- Player image with aura -->
            <div class="relative w-28 h-28 mb-3">
              <div class="absolute inset-[-16px] rounded-full bg-gradient-to-br from-cyan-400/20 via-teal-500/10 to-emerald-500/5 blur-2xl animate-pulse-slow"></div>
              <div class="relative w-full h-full rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <img [src]="player().imagen" [alt]="player().name"
                     class="w-full h-full object-contain p-1.5"
                     width="112" height="112">
              </div>
            </div>

            <!-- Player name -->
            <h2 id="player-title" class="text-xl font-black text-white tracking-tight leading-tight mb-1">
              {{ player().name }}
            </h2>

            <!-- VIP badge -->
            @if (player().isVIP) {
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                VIP
              </span>
            }
          </div>

          <!-- Stats row: age, goals, lesions -->
          <div class="grid grid-cols-3 gap-2 mb-5">
            <!-- Age -->
            <div class="flex flex-col items-center gap-1 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <svg class="w-4 h-4 text-cyan-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span class="text-lg font-black text-white tabular-nums">{{ age() }}</span>
              <span class="text-[9px] font-semibold text-white/30 uppercase tracking-wider">Edad</span>
            </div>

            <!-- Goals -->
            <div class="flex flex-col items-center gap-1 py-3 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/[0.12]">
              <svg class="w-4 h-4 text-emerald-400/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 010 20M12 2a15 15 0 000 20M2 12h20"/>
              </svg>
              <span class="text-lg font-black text-white tabular-nums">{{ player().goals }}</span>
              <span class="text-[9px] font-semibold text-emerald-400/50 uppercase tracking-wider">Goles</span>
            </div>

            <!-- Lesions -->
            <div [ngClass]="player().lesions > 0
              ? 'flex flex-col items-center gap-1 py-3 rounded-2xl bg-rose-500/[0.06] border border-rose-500/[0.15]'
              : 'flex flex-col items-center gap-1 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]'">
              <svg class="w-4 h-4" [ngClass]="player().lesions > 0 ? 'text-rose-400' : 'text-white/30'"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span class="text-lg font-black tabular-nums"
                    [ngClass]="player().lesions > 0 ? 'text-rose-400' : 'text-white/30'">{{ player().lesions }}</span>
              <span class="text-[9px] font-semibold uppercase tracking-wider"
                    [ngClass]="player().lesions > 0 ? 'text-rose-400/60' : 'text-white/20'">Lesiones</span>
            </div>
          </div>

          <!-- Financial details: bento grid -->
          <div class="grid grid-cols-2 gap-2 mb-5">
            <!-- Price (full width) -->
            <div class="col-span-2 flex justify-between items-center py-3 px-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/[0.12]">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center">
                  <img src="shared/balance/coin.webp" alt="coin" width="16" height="16" class="object-contain">
                </div>
                <span class="text-[10px] font-bold text-amber-400/70 uppercase tracking-wider">Valor</span>
              </div>
              <span class="text-base font-black text-white tabular-nums">{{ player().price | number }} <span class="text-[10px] font-semibold text-amber-400/50">COP</span></span>
            </div>

            <!-- Interest per hour -->
            <div class="flex flex-col gap-1 py-3 px-3 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/[0.1]">
              <span class="text-[9px] font-bold text-emerald-400/60 uppercase tracking-wider">Por Hora</span>
              <span class="text-sm font-black text-white tabular-nums">+{{ player().interest | number }}</span>
            </div>

            <!-- Interest per day -->
            <div class="flex flex-col gap-1 py-3 px-3 rounded-2xl bg-blue-500/[0.05] border border-blue-500/[0.1]">
              <span class="text-[9px] font-bold text-blue-400/60 uppercase tracking-wider">Por Día</span>
              <span class="text-sm font-black text-white tabular-nums">+{{ (player().interest * 24) | number }}</span>
            </div>

            <!-- Total earnings -->
            <div class="flex flex-col gap-1 py-3 px-3 rounded-2xl bg-purple-500/[0.05] border border-purple-500/[0.1]">
              <span class="text-[9px] font-bold text-purple-400/60 uppercase tracking-wider">Ganancia Total</span>
              <span class="text-sm font-black text-white tabular-nums">+{{ totalEarnings() | number }}</span>
            </div>

            <!-- Contract duration -->
            <div class="flex flex-col gap-1 py-3 px-3 rounded-2xl bg-cyan-500/[0.05] border border-cyan-500/[0.1]">
              <span class="text-[9px] font-bold text-cyan-400/60 uppercase tracking-wider">Contrato</span>
              <span class="text-sm font-black text-white tabular-nums">{{ player().days }} <span class="text-[10px] font-semibold text-cyan-400/50">días</span></span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-3">
            <button (click)="onClose()"
              class="flex-1 py-3.5 text-sm font-bold text-white/60 bg-white/[0.04] border border-white/[0.08] rounded-2xl hover:bg-white/[0.08] hover:text-white/80 active:scale-[0.97] transition-all duration-200">
              Cancelar
            </button>
            <button (click)="onConfirm()"
              class="flex-1 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl shadow-[0_4px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_6px_28px_rgba(20,184,166,0.4)] hover:brightness-110 active:scale-[0.97] transition-all duration-200">
              Confirmar Fichaje
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .animate-scrim-in {
      animation: scrimIn 0.25s ease-out forwards;
    }
    @keyframes scrimIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .animate-sheet-up {
      animation: sheetUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes sheetUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .animate-pulse-slow {
      animation: pulseSlow 4s ease-in-out infinite;
    }
    @keyframes pulseSlow {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }

    @media (prefers-reduced-motion: reduce) {
      .animate-scrim-in,
      .animate-sheet-up {
        animation: none;
      }
      .animate-pulse-slow {
        animation: none;
        opacity: 0.8;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerDetailsComponent implements AfterViewInit {
  player = input.required<InvestApiPlayer>();
  confirm = output<InvestApiPlayer>();
  close = output<void>();

  @ViewChild('modalWrapper') modalWrapper!: ElementRef;
  @ViewChild('closeBtn') closeBtn!: ElementRef;

  age = computed(() => this.player().age);

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
