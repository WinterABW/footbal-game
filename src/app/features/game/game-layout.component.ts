import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BalanceComponent } from '../../shared/components/balance/balance.component';
import { ActionButtonsComponent } from './components/action-buttons/action-buttons.component';
import { EnergyBoostComponent } from './components/energy-boost/energy-boost.component';
import { HeaderComponent } from './components/header/header.component';
import { TapAreaComponent } from './components/tap-area/tap-area.component';
import { LevelUpAnimationComponent } from '../../shared/components/level-up-animation/level-up-animation.component';
import { LocalApiService } from '../../core/services/local-api.service';

@Component({
  selector: 'app-game-layout',
  imports: [
    HeaderComponent,
    ActionButtonsComponent,
    BalanceComponent,
    TapAreaComponent,
    EnergyBoostComponent,
    LevelUpAnimationComponent,
    CommonModule
  ],
  template: `
    <section class="h-dvh flex flex-col relative w-full overflow-hidden bg-transparent">
      <!-- Main UI Layer -->
      <app-header class="relative z-20" />
      
      <main class="flex-1 flex flex-col px-4 gap-3 pb-24 overflow-hidden relative z-10">
        <app-action-buttons />
        <app-balance />
        <app-tap-area class="flex-1 flex flex-col justify-center items-center min-h-0" />
        <app-energy-boost />
      </main>

      <!-- Overlays -->
      @if (localApi.levelUp(); as levelUpInfo) {
        <app-level-up-animation 
          [newLevel]="levelUpInfo.newLevel" 
          [oldLevel]="levelUpInfo.oldLevel"
          (animationFinished)="localApi.clearLevelUp()" />
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameLayoutComponent {
  localApi = inject(LocalApiService);
}
