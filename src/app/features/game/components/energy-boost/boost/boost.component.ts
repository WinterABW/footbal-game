import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { UserStatusService } from '../../../../../core/services/user-status.service';
import { EnergyService } from '../../../../../core/services/energy.service';
import { UserInfoService, SkillLevelInfo } from '../../../../../core/services/user-info.service';
import { ErrorHandlerService } from '../../../../../core/services/error-handler.service';
import { BalanceComponent } from '../../../../../shared/components/balance/balance.component';
import { GlassSheetComponent } from '../../../../../shared/ui/glass-sheet/glass-sheet.component';

// Las 3 skills siempre son las mismas
const SKILLS = [
    { id: 1, name: 'Energy Plus', description: '+50 energía instantánea', type: 'instant', icon: 'game/energy/thunder.webp' },
    { id: 2, name: 'Max Energy', description: '+100 energía máxima permanente', type: 'permanent', icon: 'game/energy/aumento.png' },
    { id: 3, name: 'Tap Power', description: '+1 valor por toque permanente', type: 'permanent', icon: 'game/energy/touch.webp' },
];

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
    imports: [DecimalPipe, NgOptimizedImage, BalanceComponent, GlassSheetComponent],
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
        [class.opacity-50]="(balanceAmount() < +(boost.cost)) || isPurchasing()"
        [disabled]="(balanceAmount() < +(boost.cost)) || isPurchasing()"
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
export class BoostComponent implements OnInit {

    private router = inject(Router);
    private userStatusService = inject(UserStatusService);
    private energyService = inject(EnergyService);
    private userInfoService = inject(UserInfoService);
    private errorHandler = inject(ErrorHandlerService);

    // Balance desde el servidor
    balanceAmount = computed(() => this.userStatusService.userStatus()?.wallet?.principalBalance ?? 0);

    skillsLevelReport = this.userStatusService.skillsLevelReport;
    
    // Precios de las skills desde el servidor
    skillPrices = signal<Record<number, SkillLevelInfo>>({});

    // Mapping de boostId a skillId
    private readonly boostToSkillId: Record<number, number> = {
        1: 1,  // Energy Plus → skillId 1
        2: 2,  // Max Energy → skillId 2
        3: 3,  // Tap Power → skillId 3
    };

    async ngOnInit(): Promise<void> {
        // Cargar precios de las 3 skills
        // Nota: loadMaxEnergy() ya se llama desde GameLayoutComponent cuando el usuario está logueado
        try {
            await this.loadSkillPrices();
        } catch {
            // Silencioso — el usuario verá precios en 0, puede reintentar recargando
        }
    }

    private async loadSkillPrices(): Promise<void> {
        const prices: Record<number, SkillLevelInfo> = {};
        const skillIds = [1, 2, 3];
        const results = await Promise.all(
            skillIds.map(skillId => this.userInfoService.getSkillInfo(skillId))
        );
        results.forEach((result, i) => {
            const sid = skillIds[i];
            if (result.success && result.data) {
                prices[sid] = result.data;
            } else {
                console.warn(`Failed to load skill info for skillId ${sid}`);
            }
        });
        this.skillPrices.set(prices);
    }

    private getSkillLevel(boostId: number): number {
        const report = this.skillsLevelReport();
        if (!report) return 0;
        
        // Mapping corregido: boostId → skillId
        const skillId = this.boostToSkillId[boostId];
        switch (skillId) {
            case 1: return report.energyPlusLVL;
            case 2: return report.maxEnergyLVL;
            case 3: return report.tapPowerLVL;
            default: return 0;
        }
    }

    private getNextLevelPrice(boostId: number): number {
        const skillId = this.boostToSkillId[boostId];
        const prices = this.skillPrices()[skillId];
        const currentLevel = this.getSkillLevel(boostId);
        const nextLevel = currentLevel + 1;
        
        if (!prices || !prices[nextLevel]) return 0;
        
        return prices[nextLevel].price;
    }

    boosts = computed(() => {
        return SKILLS.map(skill => {
            const nextPrice = this.getNextLevelPrice(skill.id);
            return {
                id: skill.id,
                title: skill.name,
                desc: skill.description,
                cost: nextPrice > 0 ? nextPrice.toString() : '0',
                level: `Lv${this.getSkillLevel(skill.id)}`,
                type: skill.type,
                icon: skill.icon,
            };
        });
    });

    selectedBoost = signal<BoostDisplay | null>(null);
    isBoostDetailOpen = signal(false);
    isHowItWorksOpen = signal(false);
    isPurchasing = signal(false);
    purchaseMessage = signal<string | null>(null);
    purchaseSuccess = signal(false);

    canAfford(item: BoostDisplay): boolean {
        return this.balanceAmount() >= +item.cost;
    }

    getBoostIcon(id: number): string {
        const icons: Record<number, string> = {
            1: 'game/energy/thunder.webp',
            2: 'game/energy/aumento.png',
            3: 'game/energy/touch.webp',
        };
        return icons[id] || 'game/energy/thunder.webp';
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
        this.purchaseSuccess.set(false);
        this.isBoostDetailOpen.set(true);
    }

    closeSheet(): void {
        this.isBoostDetailOpen.set(false);
        this.selectedBoost.set(null);
        this.purchaseMessage.set(null);
    }

    async purchaseBoost(): Promise<void> {
        const boost = this.selectedBoost();
        if (!boost) return;
        
        if (this.isPurchasing()) return;
        
        const skillId = this.boostToSkillId[boost.id];
        this.isPurchasing.set(true);
        
        try {
            const result = await this.energyService.purchaseBoost(skillId);
            const message = result.message ?? (result.success ? '¡Compra exitosa!' : 'Error desconocido');
            this.purchaseMessage.set(message);
            this.purchaseSuccess.set(result.success);

            if (result.success) {
                await this.userStatusService.loadUserStatus();
                await this.loadSkillPrices();
                await this.energyService.loadMaxEnergy(); // Recargar maxEnergy desde backend
                this.errorHandler.showSuccessToast('¡Mejora aplicada con éxito!');
                setTimeout(() => this.closeSheet(), 800);
            }
        } catch (error) {
            console.error('Purchase boost failed', error);
            this.purchaseMessage.set('Error de conexión. Intenta de nuevo.');
            this.purchaseSuccess.set(false);
            this.errorHandler.showErrorToast('Error de conexión al comprar impulso', 'boost_purchase');
        } finally {
            this.isPurchasing.set(false);
        }
    }

    currentLevel = computed(() => {
        const item = this.selectedBoost();
        if (!item) return 1;
        return this.getSkillLevel(item.id) || 1;
    });

    nextLevel = computed(() => {
        return this.currentLevel() + 1;
    });

    nextLevelAmount = computed(() => {
        const item = this.selectedBoost();
        if (!item) return 0;
        
        const skillId = this.boostToSkillId[item.id];
        const currentLvl = this.currentLevel();
        const nextLvl = currentLvl + 1;
        
        const prices = this.skillPrices()[skillId];
        const nextLevelData = prices?.[nextLvl];
        if (!nextLevelData) return 0;
        
        if (nextLevelData.energyRechargeTime !== undefined) return nextLevelData.energyRechargeTime;
        if (nextLevelData.maxEnergy !== undefined) return nextLevelData.maxEnergy;
        if (nextLevelData.tooks !== undefined) return nextLevelData.tooks;
        
        return 0;
    });

    nextLevelDescription = computed(() => {
        const item = this.selectedBoost();
        if (!item) return '';
        
        const skillId = this.boostToSkillId[item.id];
        const amount = this.nextLevelAmount();
        
        if (skillId === 1) return `${amount}s tiempo de recarga`;
        if (skillId === 2) return `${amount} energía máxima`;
        if (skillId === 3) return `${amount} monedas por toque`;
        return item.desc;
    });
}
