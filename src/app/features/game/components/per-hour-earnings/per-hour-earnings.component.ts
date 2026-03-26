import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';
import { UserStatusService } from '../../../../core/services/user-status.service';

@Component({
  selector: 'app-per-hour-earnings',
  imports: [NgOptimizedImage, CommonModule],
  template: `
    <div class="flex items-center gap-1.5 py-1.5 px-3.5 rounded-full liquid-glass-card border-emerald-500/30 shadow-lg transition-all active:scale-95 cursor-default h-[44px] accent-emerald">
      <div class="w-[22px] h-[22px] flex items-center justify-center drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
         <img ngSrc="shared/balance/coin.webp" alt="COP" width="26" height="26" class="object-contain" />
      </div>
      <div class="flex flex-col">
        <span class="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-[2px]">Earnings</span>
        <span class="text-[12px] font-black text-emerald-400 tracking-tight uppercase leading-none text-glow-emerald">
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
  private userStatusService = inject(UserStatusService);

  readonly hourlyEarning = this.userStatusService.earnPerHour;

  readonly formattedEarning = computed(() => {
    const value = this.hourlyEarning();
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
  });
}
