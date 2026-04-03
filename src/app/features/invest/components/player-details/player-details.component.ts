import { ChangeDetectionStrategy, Component, computed, HostListener, input, output, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { InvestApiPlayer } from '../../../../models/invest.model';

@Component({
  selector: 'app-player-details',
  imports: [CommonModule],
  template: `
    <!-- Scrim -->
    <div class="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md animate-scrim-in" (click)="onClose()" aria-hidden="true"></div>

    <!-- Bottom sheet -->
    <div class="fixed inset-0 z-[160] flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="player-title" [attr.tabindex]="-1" #modalWrapper>
      <div class="w-full max-w-lg relative overflow-hidden max-h-[88vh] rounded-t-[28px] animate-sheet-up"
           style="background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 50%, #0a0a12 100%); border-top: 1px solid rgba(255,255,255,0.08); box-shadow: 0 -24px 80px rgba(0,0,0,0.8), 0 0 120px rgba(0,212,255,0.03);">

        <!-- Top accent line -->
        <div class="absolute top-0 left-0 right-0 h-[2px]"
             [class]="player().isVIP
               ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent'
               : 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent'"></div>

        <!-- Drag handle -->
        <div class="flex justify-center pt-3">
          <div class="w-8 h-1 rounded-full bg-white/15"></div>
        </div>

        <!-- Content -->
        <div class="flex flex-col px-4 pb-6 overflow-y-auto max-h-[83vh]">

          <!-- Hero: compact row -->
          <div class="flex items-center gap-4 mb-4">
            <!-- Player image -->
            <div class="relative w-20 h-20 flex-shrink-0">
              <div class="w-full h-full rounded-2xl overflow-hidden relative"
                   style="background: linear-gradient(135deg, rgba(0,212,255,0.15), rgba(255,208,96,0.1)); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
                <img [src]="player().imagen" [alt]="player().name"
                     class="w-full h-full object-contain p-1"
                     width="80" height="80">
              </div>
              @if (player().isVIP) {
                <div class="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full"
                     style="background: linear-gradient(135deg, #f59e0b, #fbbf24); box-shadow: 0 2px 8px rgba(245,158,11,0.5);">
                  <span class="text-[8px] font-black text-black tracking-wider">VIP</span>
                </div>
              }
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <h2 id="player-title" class="text-lg font-black text-white tracking-tight leading-tight truncate">
                {{ player().name }}
              </h2>
              <p class="text-white/35 text-xs font-medium mt-0.5">
                {{ age() }} a&ntilde;os &middot; {{ player().goals }} goles
              </p>
              @if (player().lesions > 0) {
                <span class="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full"
                      style="background: rgba(244,63,94,0.12); border: 1px solid rgba(244,63,94,0.2);">
                  <svg class="w-3 h-3 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01"/>
                  </svg>
                  <span class="text-[9px] font-bold text-rose-400">{{ player().lesions }} lesion{{ player().lesions > 1 ? 'es' : '' }}</span>
                </span>
              } @else {
                <span class="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full"
                      style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.15);">
                  <svg class="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span class="text-[9px] font-bold text-emerald-400">Sin lesiones</span>
                </span>
              }
            </div>

            <!-- Close -->
            <button #closeBtn (click)="onClose()"
              class="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 text-white/25 hover:text-white/60 active:scale-90 transition-all duration-150 cursor-pointer"
              aria-label="Cerrar detalle del jugador"
              style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Price bar -->
          <div class="rounded-2xl p-3.5 mb-3 flex items-center justify-between"
               style="background: linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.06)); border: 1px solid rgba(245,158,11,0.2);">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full flex items-center justify-center"
                   style="background: rgba(245,158,11,0.15);">
                <img src="shared/balance/coin.webp" alt="" width="16" height="16" class="object-contain" aria-hidden="true">
              </div>
              <span class="text-[10px] font-bold uppercase tracking-wider" style="color: rgba(251,191,36,0.7);">Valor</span>
            </div>
            <span class="text-xl font-black text-white tabular-nums">{{ player().price | number }} <span class="text-[10px] font-semibold" style="color: rgba(251,191,36,0.4);">COP</span></span>
          </div>

          <!-- ROI: 3 cols -->
          <div class="rounded-2xl p-3 mb-3"
               style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" style="color: #10b981;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
                <span class="text-[10px] font-bold uppercase tracking-wider" style="color: rgba(16,185,129,0.6);">Retorno</span>
              </div>
              <span class="text-xs font-black tabular-nums" style="color: #10b981;">+{{ roiPercent() }}%</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="text-center py-1.5 rounded-xl" style="background: rgba(255,255,255,0.03);">
                <p class="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style="color: rgba(255,255,255,0.25);">Hora</p>
                <p class="text-sm font-black text-white tabular-nums">+{{ player().interest | number }}</p>
              </div>
              <div class="text-center py-1.5 rounded-xl" style="background: rgba(255,255,255,0.03);">
                <p class="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style="color: rgba(255,255,255,0.25);">D&iacute;a</p>
                <p class="text-sm font-black text-white tabular-nums">+{{ dailyEarnings() | number }}</p>
              </div>
              <div class="text-center py-1.5 rounded-xl" style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.12);">
                <p class="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style="color: rgba(16,185,129,0.5);">Total</p>
                <p class="text-sm font-black tabular-nums" style="color: #34d399;">+{{ totalEarnings() | number }}</p>
              </div>
            </div>
          </div>

          <!-- Contract + Goals -->
          <div class="grid grid-cols-2 gap-2 mb-4">
            <div class="rounded-2xl p-3 text-center"
                 style="background: rgba(0,212,255,0.06); border: 1px solid rgba(0,212,255,0.12);">
              <p class="text-[9px] font-bold uppercase tracking-wider mb-1" style="color: rgba(0,212,255,0.5);">Contrato</p>
              <p class="text-lg font-black text-white tabular-nums">{{ player().days }} <span class="text-[10px] font-semibold" style="color: rgba(0,212,255,0.35);">d&iacute;as</span></p>
            </div>
            <div class="rounded-2xl p-3 text-center"
                 style="background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.12);">
              <p class="text-[9px] font-bold uppercase tracking-wider mb-1" style="color: rgba(16,185,129,0.5);">Goles</p>
              <p class="text-lg font-black text-white tabular-nums">{{ player().goals }}</p>
            </div>
          </div>

          <!-- CTA -->
          <div class="flex gap-2">
            <button (click)="onClose()"
              [disabled]="loading()"
              class="flex-1 py-3 text-sm font-bold rounded-2xl active:scale-[0.97] transition-all duration-150 cursor-pointer"
              style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.4);"
              [class.opacity-50]="loading()"
              [class.pointer-events-none]="loading()">
              Cancelar
            </button>
            <button (click)="onConfirm()"
              [disabled]="loading()"
              class="flex-1 py-3 text-sm font-bold text-white rounded-2xl active:scale-[0.97] transition-all duration-150 cursor-pointer relative"
              style="background: linear-gradient(135deg, #06b6d4, #10b981); box-shadow: 0 4px 20px rgba(6,182,212,0.35), 0 0 40px rgba(16,185,129,0.15);"
              [class.opacity-70]="loading()"
              [class.pointer-events-none]="loading()">
              @if (loading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Procesando...
                </span>
              } @else {
                Confirmar Fichaje
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .animate-scrim-in {
      animation: scrimIn 0.2s ease-out forwards;
    }
    @keyframes scrimIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .animate-sheet-up {
      animation: sheetUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes sheetUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .animate-scrim-in, .animate-sheet-up { animation: none; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerDetailsComponent implements AfterViewInit {
  player = input.required<InvestApiPlayer>();
  confirm = output<InvestApiPlayer>();
  close = output<void>();
  loading = input(false);

  @ViewChild('modalWrapper') modalWrapper!: ElementRef;
  @ViewChild('closeBtn') closeBtn!: ElementRef;

  age = computed(() => this.player().age);
  dailyEarnings = computed(() => this.player().interest * 24);
  totalEarnings = computed(() => this.player().interest * 24 * this.player().days);
  roiPercent = computed(() => {
    const p = this.player();
    if (p.price === 0) return 0;
    return Math.round((this.totalEarnings() / p.price) * 100);
  });

  ngAfterViewInit() {
    if (this.closeBtn) this.closeBtn.nativeElement.focus();
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') { this.onClose(); return; }
    if (event.key === 'Tab') {
      event.preventDefault();
      const els = this.modalWrapper.nativeElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (els.length === 0) return;
      const first = els[0] as HTMLElement;
      const last = els[els.length - 1] as HTMLElement;
      if (event.shiftKey) {
        if (document.activeElement === first) { last.focus(); }
        else { const i = Array.from(els).indexOf(document.activeElement); if (i > 0) (els[i - 1] as HTMLElement).focus(); }
      } else {
        if (document.activeElement === last) { first.focus(); }
        else { const i = Array.from(els).indexOf(document.activeElement); if (i < els.length - 1) (els[i + 1] as HTMLElement).focus(); }
      }
    }
  }

  onConfirm() { this.confirm.emit(this.player()); }
  onClose() { this.close.emit(); }
}
