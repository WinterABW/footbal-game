import { Injectable, signal } from '@angular/core';
import type confetti from 'canvas-confetti';

@Injectable({
  providedIn: 'root'
})
export class ConfettiService {
  private readonly _enabled = signal(true);
  readonly enabled = this._enabled.asReadonly();

  private confettiFn: typeof confetti | null = null;

  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private async loadConfetti(): Promise<typeof confetti> {
    if (!this.confettiFn) {
      const module = await import('canvas-confetti');
      this.confettiFn = module.default;
    }
    return this.confettiFn!;
  }

  async fire(type: 'win' | 'daily'): Promise<void> {
    if (!this._enabled() || this.prefersReducedMotion()) return;
    
    try {
      const confetti = await this.loadConfetti();
      
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#FFD700', '#FFA500', '#FF4500', '#10B981', '#3B82F6']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#FFD700', '#FFA500', '#FF4500', '#10B981', '#3B82F6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } catch (e) {
      console.warn('Failed to fire confetti:', e);
    }
  }

  toggle(): void {
    this._enabled.update(enabled => !enabled);
  }
}