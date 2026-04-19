import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { SyncCoordinatorService, SyncStatus } from '../../../core/services/sync-coordinator.service';

@Component({
  selector: 'app-sync-indicator',
  imports: [NgOptimizedImage],
  template: `
    <!-- Sync Status Indicator -->
    <div 
      class="sync-indicator flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-300"
      [class.status-idle]="status() === 'SYNC_IDLE'"
      [class.status-pending]="status() === 'SYNC_PENDING'"
      [class.status-in-progress]="status() === 'SYNC_IN_PROGRESS'"
      [class.status-error]="status() === 'SYNC_ERROR'"
    >
      <!-- Icon -->
      @switch (status()) {
        @case ('SYNC_IDLE') {
          <!-- Check mark - green -->
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        }
        @case ('SYNC_PENDING') {
          <!-- Sync arrows - warning yellow -->
          <svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        }
        @case ('SYNC_IN_PROGRESS') {
          <!-- Loader - info cyan -->
          <svg class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        }
        @case ('SYNC_ERROR') {
          <!-- Alert - error red -->
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        }
      }

      <!-- Text -->
      <span class="text-[10px] font-bold uppercase tracking-wider">
        {{ label() }}
      </span>

      <!-- Pending count badge -->
      @if (pendingCount() > 0 && status() !== 'SYNC_IDLE') {
        <span class="text-[9px] font-mono">
          ({{ pendingCount() }})
        </span>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-flex; }

    .sync-indicator {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* IDLE - Green - All synced */
    .status-idle {
      color: #22c55e;
      background: rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.2);
    }

    /* PENDING - Yellow/Orange - Pending taps */
    .status-pending {
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.2);
    }

    /* IN_PROGRESS - Cyan - Flushing */
    .status-in-progress {
      color: #06b6d4;
      background: rgba(6, 182, 212, 0.1);
      border-color: rgba(6, 182, 212, 0.2);
    }

    /* ERROR - Red - Failed */
    .status-error {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.2);
    }

    /* Animations */
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncIndicatorComponent {
  private syncCoordinator = inject(SyncCoordinatorService);

  // Signals from coordinator
  readonly status = computed(() => this.syncCoordinator.getStatus());
  readonly pendingCount = computed(() => this.syncCoordinator.getPendingOpsCount());

  // Computed label
  readonly label = computed(() => {
    const status = this.status();
    const count = this.pendingCount();

    switch (status) {
      case 'SYNC_IDLE':
        return 'Listo';
      case 'SYNC_PENDING':
        return count > 0 ? `${count}` : 'Pend';
      case 'SYNC_IN_PROGRESS':
        return 'Enviando';
      case 'SYNC_ERROR':
        return 'Error';
      default:
        return '...';
    }
  });
}