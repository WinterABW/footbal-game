import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, AfterViewInit, signal, inject } from '@angular/core';
import { UserStatusService } from '../../../core/services/user-status.service';

@Component({
  selector: 'app-level-up-animation',
  imports: [],
  templateUrl: './level-up-animation.component.html',
  styleUrls: ['./level-up-animation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelUpAnimationComponent implements AfterViewInit {
  @Input() newLevel = 0;
  @Input() oldLevel = 0;
  @Output() animationFinished = new EventEmitter<void>();

  private userStatusService = inject(UserStatusService);

  show = signal(false);

  ngAfterViewInit(): void {
    // Use a timeout to ensure the component is rendered before starting the animation
    setTimeout(() => {
      this.show.set(true);
    }, 100);
  }

  close(): void {
    this.show.set(false);
    // Allow fade-out animation to complete before emitting event
    setTimeout(() => {
      this.userStatusService.levelUp.set(null);
      this.animationFinished.emit();
    }, 500);
  }
}
