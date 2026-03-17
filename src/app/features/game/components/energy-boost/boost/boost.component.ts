import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { LocalApiService } from '../../../../../core/services/local-api.service';
import { Boost } from '../../../../../models/game.model';
import { BalanceComponent } from '../../../../../shared/components/balance/balance.component';
import { GlassSheetComponent } from '../../../../../shared/ui/glass-sheet/glass-sheet.component';

interface BoostDisplay {
    id: number;
    title: string;
    desc: string;
    cost: string;
    level: string;
    amount?: number;
    type: string;
    icon: string;
}

@Component({
    selector: 'app-boost',
    imports: [DecimalPipe, BalanceComponent, GlassSheetComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
<section class="min-h-dvh flex flex-col relative overflow-hidden">

  <!-- Header -->
  <div class="pt-safe-top px-4 flex items-center gap-3 py-4 z-10">
    <button
      class="lg-bubble w-11 h-11 flex items-center justify-center flex-shrink-0"
      (click)="goBack()"
      aria-label="Volver"
      type="button"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <h1 class="text-white font-semibold text-xl flex-1">Impulsos</h1>
    <app-balance />
  </div>

  <!-- Hero section -->
  <div class="flex flex-col items-center gap-2 px-4 py-4 z-10">
    <img
      [src]="'game/energy/goal-keeper.png'"
      alt="goal-keeper"
      width="80"
      height="80"
      class="drop-shadow-2xl"
      priority
    >
    <p class="text-white/70 text-sm text-center">Mejora velocidad, capacidad y ganancias</p>
    <button
      class="lg-btn-outline px-4 py-2 text-sm"
      (click)="openHowItWorks()"
      type="button"
      aria-label="Cómo funciona"
    >
      ¿Cómo funciona?
    </button>
  </div>

  <!-- Boost list -->
  <div class="flex-1 flex flex-col gap-3 px-4 pb-24 overflow-y-auto z-10">
    @for (item of boosts(); track item.id) {
      <div class="liquid-glass-card p-4 flex items-center gap-4">
        <!-- Icon -->
        <div class="w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center
                    bg-gradient-to-br from-blue-500/30 to-emerald-500/30
                    shadow-[0_8px_24px_rgba(59,130,246,0.2)]">
          <img
            [src]="getBoostIcon(item.id)"
            [alt]="item.title"
            width="48"
            height="48"
            class="object-contain drop-shadow-lg"
          >
        </div>

        <!-- Meta -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-white font-semibold text-base truncate">{{ item.title }}</span>
            <span class="rounded-full px-2 py-0.5 text-xs font-semibold
                         bg-blue-500/20 text-blue-200 border border-blue-500/30">
              {{ item.level }}
            </span>
          </div>
          <p class="text-white/60 text-xs truncate">{{ item.desc }}</p>
          <p class="text-amber-400 text-xs mt-1 font-medium">
            🪙 {{ +item.cost | number }} monedas
          </p>
        </div>

        <!-- Action -->
        <button
          class="lg-btn-primary px-3 py-2 text-sm flex-shrink-0 min-w-[72px] transition-all duration-200"
          [class.opacity-50]="!canAfford(item)"
          [class.pointer-events-none]="!canAfford(item)"
          (click)="selectBoost(item)"
          type="button"
          [attr.aria-label]="'Mejorar ' + item.title"
        >
          Subir
        </button>
      </div>
    }
  </div>

  <!-- How It Works Sheet -->
  <app-glass-sheet
    [isOpen]="isHowItWorksOpen()"
    title="¿Cómo Funciona?"
    maxHeight="70vh"
    (closed)="isHowItWorksOpen.set(false)"
  >
    <p class="text-white/70 text-sm leading-relaxed">
      Desde aquí puedes utilizar tu dinero para mejorar las ganancias por cada toque al balón,
      aumentar el tiempo en que demoras en recuperar la energía y además aumentar la capacidad
      máxima de almacenamiento de energía.
    </p>

    <div class="mt-4 flex flex-col gap-3">
      <div class="liquid-glass-card p-3 flex items-start gap-3">
        <span class="text-2xl">⚡</span>
        <div>
          <p class="text-white text-sm font-semibold mb-0.5">Energía Instantánea</p>
          <p class="text-white/60 text-xs">Recarga tu energía inmediatamente para seguir jugando.</p>
        </div>
      </div>
      <div class="liquid-glass-card p-3 flex items-start gap-3">
        <span class="text-2xl">🔋</span>
        <div>
          <p class="text-white text-sm font-semibold mb-0.5">Energía Máxima</p>
          <p class="text-white/60 text-xs">Aumenta el límite máximo de energía permanentemente.</p>
        </div>
      </div>
      <div class="liquid-glass-card p-3 flex items-start gap-3">
        <span class="text-2xl">👆</span>
        <div>
          <p class="text-white text-sm font-semibold mb-0.5">Poder de Toque</p>
          <p class="text-white/60 text-xs">Gana más monedas por cada toque al balón.</p>
        </div>
      </div>
    </div>
  </app-glass-sheet>

  <!-- Boost Detail Sheet -->
  <app-glass-sheet
    [isOpen]="isBoostDetailOpen()"
    [title]="selectedBoost()?.title ?? ''"
    maxHeight="75vh"
    (closed)="closeSheet()"
  >
    @if (selectedBoost(); as boost) {
      <!-- Next level card -->
      <div class="liquid-glass-card p-4 flex items-center gap-4
                  border-emerald-500/30 bg-emerald-500/[0.06] mb-2">
        <div class="w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center
                    bg-gradient-to-br from-emerald-500/30 to-blue-500/30">
          <img
            [src]="boost.icon"
            [alt]="boost.title"
            width="48"
            height="48"
            class="object-contain"
          >
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-emerald-300 font-bold text-base">LVL {{ nextLevel() }}</p>
          <p class="text-white/70 text-xs mt-0.5">{{ nextLevelDescription() }}</p>
          <span class="inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-semibold
                       bg-amber-500/20 text-amber-300 border border-amber-500/30">
            +{{ nextLevelAmount() }}
          </span>
        </div>
        <span class="text-white/30 text-xs font-semibold">Próximo</span>
      </div>

      <!-- Arrow indicator -->
      <div class="flex items-center justify-center my-2" aria-hidden="true">
        <div class="w-8 h-8 rounded-full flex items-center justify-center
                    bg-white/10 text-white/60 text-base font-black">
          ↑
        </div>
      </div>

      <!-- Current level card -->
      <div class="liquid-glass-card p-4 flex items-center gap-4
                  border-white/10 bg-white/[0.03] mb-4">
        <div class="w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center
                    bg-gradient-to-br from-blue-500/20 to-slate-500/20">
          <img
            [src]="boost.icon"
            [alt]="boost.title"
            width="48"
            height="48"
            class="object-contain opacity-70"
          >
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white/70 font-bold text-base">LVL {{ currentLevel() }}</p>
          <p class="text-white/50 text-xs mt-0.5">{{ boost.desc }}</p>
        </div>
        <span class="text-white/30 text-xs font-semibold">Actual</span>
      </div>

      <!-- Purchase message -->
      @if (purchaseMessage()) {
        <div
          class="mb-3 px-4 py-3 rounded-2xl text-sm font-semibold text-center transition-all"
          [class.bg-emerald-500]="purchaseSuccess()"
          [class.text-white]="purchaseSuccess()"
          [class.bg-red-500]="!purchaseSuccess()"
          [class.text-white]="!purchaseSuccess()"
          aria-live="polite"
        >
          {{ purchaseMessage() }}
        </div>
      }

      <!-- Upgrade button -->
      <button
        class="w-full lg-btn-primary py-3.5 text-base font-bold flex items-center justify-center gap-2
               transition-all duration-200"
        [class.opacity-50]="balanceAmount() < +(boost.cost)"
        [disabled]="balanceAmount() < +(boost.cost)"
        (click)="purchaseBoost()"
        type="button"
        aria-label="Confirmar mejora"
      >
         <img
           ngSrc="shared/balance/coin.webp"
           alt="moneda"
           width="24"
           height="24"
           class="flex-shrink-0"
         >
        <span>{{ +boost.cost | number }} monedas</span>
      </button>
    }
  </app-glass-sheet>

</section>
`,
})
export class BoostComponent {

    private localApi = inject(LocalApiService);
    private router = inject(Router);

    balanceAmount = this.localApi.balance;
    currentEnergy = this.localApi.currentEnergy;
    maxEnergy = this.localApi.maxEnergy;
    tapValue = this.localApi.tapValue;

    boosts = computed(() => {
        const apiBoosts = this.localApi.boosts();
        return apiBoosts
            .filter(b => b.type === 'permanent' || b.type === 'instant')
            .map(b => ({
                id: b.id,
                title: b.name,
                desc: b.description,
                cost: b.cost.toString(),
                level: `Lv${b.level}`,
                amount: b.amount,
                type: b.type,
                icon: b.icon ?? 'game/energy/thunder.png',
            }));
    });

    selectedBoost = signal<BoostDisplay | null>(null);
    isBoostDetailOpen = signal(false);
    isHowItWorksOpen = signal(false);
    purchaseMessage = signal<string | null>(null);
    purchaseSuccess = signal(false);

    canAfford(item: BoostDisplay): boolean {
        return this.balanceAmount() >= +item.cost;
    }

    getBoostIcon(id: number): string {
        const icons: Record<number, string> = {
            1: 'game/energy/thunder.png',
            4: 'game/energy/aumento.png',
            5: 'game/energy/touch.png',
        };
        return icons[id] || 'game/energy/thunder.png';
    }

    goBack(): void {
        this.router.navigate(['/main']);
    }

    openHowItWorks(): void {
        this.isHowItWorksOpen.set(true);
    }

    selectBoost(item: BoostDisplay): void {
        this.selectedBoost.set(item);
        this.purchaseMessage.set(null);
        this.isBoostDetailOpen.set(true);
    }

    closeSheet(): void {
        this.isBoostDetailOpen.set(false);
        this.selectedBoost.set(null);
        this.purchaseMessage.set(null);
    }

    purchaseBoost(): void {
        const boost = this.selectedBoost();
        if (!boost) return;

        const result = this.localApi.purchaseBoost(boost.id);
        this.purchaseMessage.set(result.message);
        this.purchaseSuccess.set(result.success);

        if (result.success) {
            setTimeout(() => {
                this.closeSheet();
            }, 1500);
        }
    }

    currentLevel = computed(() => {
        const item = this.selectedBoost();
        if (!item) return 1;
        const numeric = Number(String(item.level).replace(/\D/g, ''));
        return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
    });

    nextLevel = computed(() => {
        return this.currentLevel() + 1;
    });

    nextLevelAmount = computed(() => {
        const item = this.selectedBoost();
        if (!item) return 0;
        const currentLvl = this.currentLevel();
        if (item.id === 1) {
            // Energy Plus: +50 base * 1.2^level
            return Math.floor(50 * Math.pow(1.2, currentLvl));
        } else if (item.id === 4) {
            // Max Energy: +100 base * 1.2^level
            return Math.floor(100 * Math.pow(1.2, currentLvl));
        } else if (item.id === 5) {
            // Tap Power: current level value
            return currentLvl;
        }
        return item.amount ?? 0;
    });

    nextLevelDescription = computed(() => {
        const item = this.selectedBoost();
        if (!item) return '';
        const amount = this.nextLevelAmount();
        if (item.id === 1) {
            return `+${amount} energía instantánea`;
        } else if (item.id === 4) {
            return `+${amount} energía máxima permanente`;
        } else if (item.id === 5) {
            return `+${amount} valor por toque permanente`;
        }
        return item.desc;
    });
}
