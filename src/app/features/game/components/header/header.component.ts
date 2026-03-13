import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';
import { PerHourEarningsComponent } from '../per-hour-earnings/per-hour-earnings.component';
import { LevelMenuComponent } from '../level-menu/level-menu.component';
import { SettingsComponent } from '../settings/settings.component';
import { AuthService } from '../../../../core/services/auth.service';
import { LocalApiService } from '../../../../core/services/local-api.service';

@Component({
  selector: 'app-header',
  imports: [PerHourEarningsComponent, NgOptimizedImage, LevelMenuComponent, SettingsComponent, CommonModule],
  template: `
    <header class="w-full h-fit flex flex-col justify-center items-center bg-transparent relative z-20 pt-safe-top px-4 pb-2 animate-slide-down">
      <div class="w-full mt-1.5 mb-1 liquid-glass-card bg-white/[0.03] border-white/5 rounded-[36px] flex flex-row justify-between items-center p-2 min-h-[60px]">
        
        @if (authService.isAuthenticated()) {
          <article class="flex items-center group cursor-pointer active:scale-95 transition-all" (click)="toggleLevelMenu()">
            <div class="relative flex-shrink-0 ml-1">
              <div class="w-[44px] h-[44px] rounded-full liquid-glass-card bg-white/[0.03] border-white/5 overflow-hidden flex items-center justify-center">
                <img ngSrc="game/header/user.png" alt="User" width="24" height="24" class="opacity-80 group-hover:scale-110 transition-transform" />
              </div>
              <!-- Level Badge -->
              <div class="absolute -bottom-0.5 -right-0.5 w-[20px] h-[20px] bg-indigo-950 border border-white/20 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-xl">
                {{ level() }}
              </div>
            </div>
            <div class="flex flex-col ml-3 mr-2">
              <span class="text-[9px] font-black text-white/60 uppercase tracking-widest mb-[2px] leading-none">Coach</span>
              <h3 class="text-[13px] font-black text-white uppercase tracking-tight leading-none">{{ authService.getUsername() }}</h3>
            </div>
          </article>
        } @else {
          <article class="flex items-center group cursor-pointer active:scale-95 transition-all" (click)="toggleLevelMenu()">
            <div class="w-[44px] h-[44px] rounded-full liquid-glass-card bg-white/[0.03] border-white/5 flex items-center justify-center flex-shrink-0 ml-1">
              <img ngSrc="game/header/user.png" alt="Guest" width="22" height="22" class="opacity-70" />
            </div>
            <div class="flex flex-col ml-3 mr-2">
              <span class="text-[9px] font-black text-white/60 uppercase tracking-widest mb-[2px] leading-none">Invitado</span>
              <h3 class="text-[13px] font-black text-white uppercase leading-none">Offline</h3>
            </div>
          </article>
        }

        <div class="flex items-center gap-2">
          <app-per-hour-earnings />
          <!-- Settings Trigger Button -->
          <button
            class="w-[44px] h-[44px] rounded-full liquid-glass-card bg-white/[0.03] border-white/5 flex items-center justify-center active:scale-90 transition-all group overflow-hidden mr-1"
            (click)="toggleSettings()" type="button" aria-label="Ajustes">
            <svg class="w-[22px] h-[22px] text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <div class="modal-context">
      <app-level-menu [isOpen]="showLevelMenu()" class="block w-full" [levelInfo]="levelInfo()" [isAuthenticated]="authService.isAuthenticated()"
        [username]="authService.getUsername()" (close)="closeLevelMenu()" />
      <app-settings [isOpen]="showSettings()" class="block w-full" [vibrationEnabled]="vibrationEnabled()"
        (close)="closeSettings()" (vibrationChange)="onVibrationChange($event)" />
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1rem); }
    .animate-slide-down { animation: slideDown 0.6s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
    .modal-context { display: contents; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  authService = inject(AuthService);
  private localApi = inject(LocalApiService);

  showLevelMenu = signal(false);
  showSettings = signal(false);
  vibrationEnabled = signal(true);

  readonly level = computed(() => this.localApi.profile()?.level ?? 1);
  readonly levelInfo = computed(() => this.localApi.getLevelInfo());

  toggleLevelMenu() { this.showLevelMenu.update(v => !v); }
  closeLevelMenu() { this.showLevelMenu.set(false); }
  toggleSettings() { this.showSettings.update(v => !v); }
  closeSettings() { this.showSettings.set(false); }
  onVibrationChange(enabled: boolean) { this.vibrationEnabled.set(enabled); }
}
