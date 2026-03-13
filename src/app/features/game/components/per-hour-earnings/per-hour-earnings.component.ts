import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';
import { LocalApiService } from '../../../../core/services/local-api.service';

@Component({
  selector: 'app-per-hour-earnings',
  standalone: true,
  imports: [NgOptimizedImage, CommonModule],
  template: `
    <div class="flex items-center gap-1.5 py-1.5 px-3.5 rounded-full liquid-glass-card bg-white/[0.03] border-white/5 transition-all active:scale-95 cursor-default h-[44px]">
      <div class="w-[22px] h-[22px] flex items-center justify-center drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
         <img ngSrc="shared/balance/coin.webp" alt="COP" width="26" height="26" class="object-contain" />
      </div>
      <div class="flex flex-col">
        <span class="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-[2px]">Earnings</span>
        <span class="text-[12px] font-black text-white tracking-tight uppercase leading-none">
          {{ formattedEarning() }}<span class="text-[8px] text-white/40 ml-0.5">/H</span>
        </span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerHourEarningsComponent {
  private localApi = inject(LocalApiService);

  readonly hourlyEarning = this.localApi.hourlyEarning;

  readonly formattedEarning = computed(() => {
    const value = this.hourlyEarning();
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
  });
}
