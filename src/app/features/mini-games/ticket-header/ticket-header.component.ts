import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
  output,
  inject
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';

export type TicketAccentColor = 'yellow' | 'cyan';

@Component({
  selector: 'app-ticket-header',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ticket-header-wrapper">
      <button
        class="back-btn"
        (click)="onBackClick()"
        aria-label="Volver"
      >
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div
        class="header glass !p-2 !mb-4 inline-flex items-center gap-3 border-{{ accentBorder() }}/30 shadow-lg accent-{{ accentClass() }}"
      >
        <img
          ngSrc="mini-games/tickets/tickets.webp"
          alt="Tickets"
          class="w-12 h-12 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 drop-shadow-md transition-all"
          width="48"
          height="48"
        />
        <h1>Tickets: <span class="text-glow-{{ accentClass() }}"> {{ ticketCount() }}</span></h1>
      </div>
    </div>
  `,
  styles: [`
    .ticket-header-wrapper {
      display: flex;
      align-items: flex-start;
      width: 100%;
      justify-content: center;
    }

    .back-btn {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 50;
      transition: transform 150ms ease;
      color: white;
    }

    .back-btn:hover {
      transform: translateX(-2px);
    }

    .glass {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow:
        inset 0 0 20px rgba(255, 255, 255, 0.05),
        0 8px 32px rgba(0, 0, 0, 0.3);
      border-radius: 24px;
    }

    .header {
      padding: 0.5rem 1rem;
      border-radius: 40px;
    }

    .header h1 {
      margin: 0;
      font-size: 1.5rem;
      letter-spacing: 1.5px;
      font-weight: 400;
      color: white;
    }

    .header span {
      font-weight: 700;
    }

    .text-glow-yellow {
      color: #facc15;
    }

    .text-glow-cyan {
      color: #22d3ee;
    }

    .accent-yellow {
      --accent-color: #facc15;
    }

    .accent-cyan {
      --accent-color: #22d3ee;
    }
  `]
})
export class TicketHeaderComponent {
  private router = inject(Router);

  ticketCount = input.required<number>();
  accentColor = input<TicketAccentColor>('yellow');

  backClick = output<void>();

  accentBorder = computed(() => this.accentColor() === 'cyan' ? 'cyan-500' : 'yellow-500');
  accentClass = computed(() => this.accentColor());

  onBackClick(): void {
    this.backClick.emit();
    // Default navigation if no handler
    this.router.navigate(['/main']);
  }
}