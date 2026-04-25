import {
  ChangeDetectionStrategy,
  Component,
  output,
  signal,
  inject,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';


@Component({
  selector: 'app-bonus-claim',
  imports: [NgOptimizedImage],
  template: `
    @if (isVisible()) {
      <div class="bonus-overlay">
        

        <!-- Backdrop -->
        <div class="bonus-backdrop" (click)="onBackdropClick($event)"></div>

        <!-- Card -->
        <div class="bonus-card">
          <!-- Inner glow layer -->
          <div class="card-glow"></div>
          
          <!-- Top: Bonus icon with glow -->
          <div class="crown-wrapper">
            <div class="crown-ring">
              <img ngSrc="tuto/bono.webp" alt="Bono" width="140" height="140" class="crown-icon" />
            </div>
            <div class="crown-glow"></div>
          </div>

          <!-- Typography -->
          <h2 class="bonus-title">
            <span class="title-gradient">¡Bienvenido, Coach!</span>
          </h2>
          
          <p class="bonus-subtitle">
            Tu bono de bienvenida está listo para reclamar
          </p>

          <!-- Rewards -->
          <div class="rewards-container">
            <!-- Coins -->
            <div class="reward-card coins">
              <div class="reward-icon">
                <img ngSrc="shared/balance/coin.webp" alt="Monedas" width="44" height="44" class="w-11 h-11" />
              </div>
              <div class="reward-value">+500</div>
              <div class="reward-label">Monedas</div>
            </div>

            <!-- Separator -->
            <div class="reward-plus">
              <span>+</span>
            </div>

            <!-- Tokens -->
            <div class="reward-card tokens">
              <div class="reward-icon">
                <img ngSrc="mini-games/tickets/tickets.webp" alt="Tokens" width="44" height="44" class="w-11 h-11" />
              </div>
              <div class="reward-value">+5</div>
              <div class="reward-label">Tokens</div>
            </div>
          </div>

          <!-- CTA Button -->
          <button 
            class="claim-btn"
            [class.claimed]="isClaiming()"
            (click)="claimBonus()"
          >
            @if (isClaiming()) {
              <span class="btn-text">
                <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                ¡Bono Reclamado!
              </span>
            } @else {
              <span class="btn-text">¡Reclamar Bono!</span>
            }
          </button>

          <!-- Footer -->
          <p class="bonus-footer">
            Se acreditará en tu cuenta inmediatamente
          </p>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ═══════════ Overlay & Backdrop ═══════════ */
    .bonus-overlay {
      position: fixed;
      inset: 0;
      z-index: 400;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: overlay-in 400ms ease-out forwards;
    }

    @keyframes overlay-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .bonus-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(7, 13, 58, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    

    /* ═══════════ Card ═══════════ */
    .bonus-card {
      position: relative;
      width: 100%;
      max-width: 340px;
      background: linear-gradient(
        145deg,
        rgba(13, 27, 110, 0.8) 0%,
        rgba(30, 27, 61, 0.9) 50%,
        rgba(13, 27, 110, 0.8) 100%
      );
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 28px;
      padding: 36px 24px 28px;
      box-shadow: 
        0 24px 80px rgba(0, 0, 0, 0.5),
        0 8px 24px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        inset 0 0 60px rgba(0, 212, 255, 0.03);
      animation: card-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      z-index: 1;
    }

    @keyframes card-in {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(30px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    /* Inner glow */
    .card-glow {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.05) 0%,
        transparent 100%
      );
      border-radius: 28px 28px 0 0;
      pointer-events: none;
    }

    /* ═══════════ Crown ═══════════ */
    .crown-wrapper {
      display: flex;
      justify-content: center;
      margin-bottom: 32px;
    }

    .crown-ring {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(
        135deg,
        rgba(255, 208, 96, 0.12) 0%,
        rgba(255, 180, 50, 0.06) 100%
      );
      border: 1px solid rgba(255, 208, 96, 0.2);
      animation: crown-pulse 4s ease-in-out infinite;
    }

    @keyframes crown-pulse {
      0%, 100% { 
        box-shadow: 0 0 20px rgba(255, 208, 96, 0.15), 0 0 40px rgba(255, 208, 96, 0.05);
        border-color: rgba(255, 208, 96, 0.2);
      }
      50% { 
        box-shadow: 0 0 30px rgba(255, 208, 96, 0.25), 0 0 60px rgba(255, 208, 96, 0.1);
        border-color: rgba(255, 208, 96, 0.35);
      }
    }

    .crown-icon {
      width: 120px;
      height: 120px;
      object-fit: contain;
      animation: crown-bob 3s ease-in-out infinite;
      filter: drop-shadow(0 4px 8px rgba(255, 208, 96, 0.3));
    }

    @keyframes crown-bob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    .crown-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 160px;
      height: 160px;
      background: radial-gradient(circle, rgba(255, 208, 96, 0.15) 0%, transparent 70%);
      animation: glow-expand 4s ease-in-out infinite;
      z-index: -1;
    }

    @keyframes glow-expand {
      0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
      50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
    }

    /* ═══════════ Typography ═══════════ */
    .bonus-title {
      text-align: center;
      font-size: 22px;
      font-weight: 900;
      margin-bottom: 8px;
      line-height: 1.3;
    }

    .title-gradient {
      background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.85) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .bonus-subtitle {
      text-align: center;
      font-size: 13px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 28px;
      line-height: 1.5;
    }

    /* ═══════════ Rewards ═══════════ */
    .rewards-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 28px;
    }

    .reward-card {
      flex: 1;
      max-width: 130px;
      text-align: center;
      padding: 16px 14px;
      border-radius: 12px;
      background: linear-gradient(
        145deg,
        rgba(255, 255, 255, 0.04) 0%,
        rgba(255, 255, 255, 0.02) 100%
      );
      border: 1px solid rgba(255, 255, 255, 0.06);
      transition: all 300ms ease;
    }

    .reward-card.coins {
      border-color: rgba(255, 208, 96, 0.12);
      box-shadow: inset 0 0 30px rgba(255, 208, 96, 0.03);
    }

    .reward-card.tokens {
      border-color: rgba(0, 212, 255, 0.12);
      box-shadow: inset 0 0 30px rgba(0, 212, 255, 0.03);
    }

    .reward-icon {
      font-size: 26px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 44px;
    }

    .reward-icon img {
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }

    .reward-value {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 0.02em;
      line-height: 1.2;
    }

    .coins .reward-value {
      background: linear-gradient(135deg, #ffd060 0%, #ffb832 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .tokens .reward-value {
      background: linear-gradient(135deg, #00d4ff 0%, #6366f1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .reward-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 4px;
    }

    .reward-plus {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
    }

    .reward-plus span {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    /* ═══════════ Button ═══════════ */
    .claim-btn {
      width: 100%;
      padding: 16px 24px;
      border: none;
      border-radius: 18px;
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #0d1b6e;
      cursor: pointer;
      background: linear-gradient(135deg, #ffd060 0%, #ffb832 100%);
      box-shadow: 
        0 6px 24px rgba(255, 208, 96, 0.25),
        0 2px 8px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.25);
      transition: all 250ms cubic-bezier(0.25, 1, 0.5, 1);
      -webkit-tap-highlight-color: transparent;
      position: relative;
      overflow: hidden;
    }

    .claim-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -60%;
      width: 50%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      animation: btn-shimmer 3s ease-in-out infinite;
    }

    @keyframes btn-shimmer {
      0% { left: -60%; }
      100% { left: 120%; }
    }

    .claim-btn:hover {
      box-shadow: 
        0 10px 32px rgba(255, 208, 96, 0.35),
        0 4px 12px rgba(0, 0, 0, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
    }

    .claim-btn:active {
      transform: scale(0.97) translateY(0);
      box-shadow: 
        0 4px 16px rgba(255, 208, 96, 0.2),
        0 1px 4px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .claim-btn.claimed {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      box-shadow: 
        0 6px 24px rgba(34, 197, 94, 0.25),
        0 2px 8px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    .claim-btn.claimed::before {
      display: none;
    }

    .btn-text {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .check-icon {
      width: 20px;
      height: 20px;
    }

    /* ═══════════ Footer ═══════════ */
    .bonus-footer {
      text-align: center;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.3);
      margin-top: 18px;
      line-height: 1.4;
    }

    /* ═══════════ Exit Animation (Premium) ═══════════ */
    
    .bonus-overlay.exiting .bonus-card {
      animation: card-exit 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes card-exit {
      0% { transform: scale(1); opacity: 1; }
      40% { transform: scale(1.03); box-shadow: 0 30px 80px rgba(255, 208, 96, 0.2), 0 10px 30px rgba(0, 0, 0, 0.4); }
      100% { transform: scale(0.95); opacity: 0; }
    }

    .bonus-overlay.exiting .bonus-backdrop {
      animation: backdrop-fade 0.8s ease-out forwards;
    }

    @keyframes backdrop-fade {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    .bonus-overlay.exiting .claim-btn {
      animation: btn-flash 0.6s ease-out forwards;
    }

    @keyframes btn-flash {
      0% { transform: scale(1); box-shadow: 0 6px 24px rgba(255, 208, 96, 0.25); }
      50% { transform: scale(1.08); box-shadow: 0 0 30px rgba(255, 208, 96, 0.5), 0 0 60px rgba(255, 208, 96, 0.2); }
      100% { transform: scale(1); opacity: 0; }
    }

    .bonus-overlay.exiting .crown-wrapper {
      animation: crown-bounce 0.7s ease-out forwards;
    }

    @keyframes crown-bounce {
      0% { transform: translateY(0) scale(1); }
      40% { transform: translateY(-8px) scale(1.1); }
      100% { transform: translateY(-20px) scale(0.8); opacity: 0; }
    }

    .bonus-overlay.exiting .rewards-container {
      animation: rewards-float 0.7s ease-out forwards;
    }

    @keyframes rewards-float {
      0% { transform: translateY(0); opacity: 1; }
      100% { transform: translateY(-12px); opacity: 0; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BonusClaimComponent {
  isVisible = signal(true);
  isClaiming = signal(false);
  

  claimed = output<void>();

  

  claimBonus(): void {
    if (this.isClaiming()) return;
    this.isClaiming.set(true);

    

    // Premium exit animation
    this.triggerExit();

    // Emit and close after animation
    setTimeout(() => {
      this.claimed.emit();
      setTimeout(() => {
        this.isVisible.set(false);
      }, 600);
    }, 1800);
  }

  triggerExit(): void {
    requestAnimationFrame(() => {
      const overlay = document.querySelector('.bonus-overlay');
      if (overlay) overlay.classList.add('exiting');
    });
  }

  onBackdropClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}