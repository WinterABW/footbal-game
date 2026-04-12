import { ChangeDetectionStrategy, Component, inject, afterNextRender, effect } from '@angular/core';
import { BalanceComponent } from '../../shared/components/balance/balance.component';
import { ActionButtonsComponent } from './components/action-buttons/action-buttons.component';
import { EnergyBoostComponent } from './components/energy-boost/energy-boost.component';
import { HeaderComponent } from './components/header/header.component';
import { TapAreaComponent } from './components/tap-area/tap-area.component';
import { LevelUpAnimationComponent } from '../../shared/components/level-up-animation/level-up-animation.component';
import { OnboardingService } from '../../core/services/onboarding.service';
import { SpotlightTutorialComponent } from '../../shared/components/spotlight-tutorial/spotlight-tutorial.component';
import { BonusClaimComponent } from '../../shared/components/bonus-claim/bonus-claim.component';
import { UserStatusService } from '../../core/services/user-status.service';
import { EnergyService } from '../../core/services/energy.service';

@Component({
  selector: 'app-game-layout',
  imports: [
    HeaderComponent,
    ActionButtonsComponent,
    BalanceComponent,
    TapAreaComponent,
    EnergyBoostComponent,
    LevelUpAnimationComponent,
    SpotlightTutorialComponent,
    BonusClaimComponent,
  ],
  template: `
    <section class="h-dvh flex flex-col relative w-full overflow-hidden bg-transparent">
      <!-- Main UI Layer -->
      <app-header class="relative z-20 pt-1.5" />
      
      <main class="flex-1 flex flex-col px-4 gap-3 pb-24 overflow-hidden relative z-10">
        <app-action-buttons />
        <app-balance />
        <app-tap-area class="flex-1 flex flex-col justify-center items-center min-h-0" />
        <app-energy-boost />
      </main>

      <!-- Overlays -->
      @if (userStatusService.levelUp(); as levelUpInfo) {
        <app-level-up-animation 
          [newLevel]="levelUpInfo.newLevel" 
          [oldLevel]="levelUpInfo.oldLevel"
          (animationFinished)="onLevelUpAnimationFinished()" />
      }

      <!-- Welcome Tutorial (first-time onboarding) -->
      <app-spotlight-tutorial />

      <!-- Bonus Claim (after tutorial completes) -->
      @if (onboarding.showBonusClaim()) {
        <app-bonus-claim (claimed)="onBonusClaimed()" />
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameLayoutComponent {
  userStatusService = inject(UserStatusService);
  onboarding = inject(OnboardingService);
  private energyService = inject(EnergyService);

  constructor() {
    effect(() => {
      const userStatus = this.userStatusService.userStatus();
      if (userStatus) {
        this.onboarding.startOnboardingIfNeeded();
        // Cargar maxEnergy y tapPower desde el backend
        this.energyService.loadAllSkills();
      }
    });
  }

  onLevelUpAnimationFinished(): void {
    this.userStatusService.levelUp.set(null);
  }

  onBonusClaimed(): void {
    // Close the bonus claim modal in the onboarding service
    // Note: Backend integration for actual credit will be added later
    this.onboarding.claimBonusAndClose();
  }
}
