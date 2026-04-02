import { Injectable, inject, signal, computed } from '@angular/core';
import { UserStatusService } from './user-status.service';
import { StorageService } from './storage.service';

const ONBOARDING_KEY = 'onboarding_completed';
const ACCOUNT_AGE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutos

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  highlight?: string; // CSS selector to highlight
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido al juego!',
    description: 'Estás a punto de empezar una aventura épica de inversión en jugadores. Compra, mejora y gana.',
    icon: '⚽',
  },
  {
    id: 'tap',
    title: 'Tapea para ganar',
    description: 'Tocá el balón en el centro de la pantalla para generar ganancias. ¡Mientras más tapes, más ganás!',
    icon: '👆',
    highlight: 'app-tap-area',
  },
  {
    id: 'energy',
    title: 'Cuidá tu energía',
    description: 'Cada tap consume energía. Esperá a que se recargue o usá boosts para seguir tapeando sin parar.',
    icon: '⚡',
    highlight: 'app-energy-boost',
  },
  {
    id: 'invest',
    title: 'Invertí en jugadores',
    description: 'Usá tus monedas para comprar jugadores. Cada jugador te genera ganancias por hora automáticamente.',
    icon: '💎',
  },
  {
    id: 'bonus',
    title: '¡Tu bono de bienvenida!',
    description: 'Por registrarte te damos un regalo especial. ¡Disfrutalo y buena suerte!',
    icon: '🎁',
  },
];

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private userStatusService = inject(UserStatusService);
  private storage = inject(StorageService);

  private _isActive = signal(false);
  private _currentStep = signal(0);
  private _bonusClaimed = signal(false);

  readonly isActive = this._isActive.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();
  readonly bonusClaimed = this._bonusClaimed.asReadonly();
  readonly steps = ONBOARDING_STEPS;

  readonly currentStepData = computed(() => ONBOARDING_STEPS[this._currentStep()]);
  readonly isFirstStep = computed(() => this._currentStep() === 0);
  readonly isLastStep = computed(() => this._currentStep() === ONBOARDING_STEPS.length - 1);

  /**
   * Verifica si el usuario es primera vez combinando:
   * 1. createdAt del backend (cuenta reciente < 10 min)
   * 2. localStorage flag (no completó onboarding antes)
   */
  isFirstTimeUser(): boolean {
    if (!this.storage.isBrowser) return false;

    // Si ya completó el onboarding, no es primera vez
    if (this.storage.get<boolean>(ONBOARDING_KEY)) {
      return false;
    }

    // Verificar si la cuenta es reciente
    const userStatus = this.userStatusService.userStatus();
    if (!userStatus?.createdAt) {
      // Si no hay status cargado, no podemos determinar si es primera vez, asumimos que no.
      // O si no tiene createdAt, no es un usuario recién creado.
      return false;
    }

    const createdAt = new Date(userStatus.createdAt).getTime();
    const now = Date.now();
    const accountAge = now - createdAt;

    return accountAge < ACCOUNT_AGE_THRESHOLD_MS;
  }

  /**
   * Inicia el onboarding si el usuario es primera vez
   */
  startOnboardingIfNeeded(): void {
    if (this.isFirstTimeUser()) {
      this._currentStep.set(0);
      this._isActive.set(true);
    }
  }

  /**
   * Fuerza el inicio del onboarding (para testing o re-play)
   */
  startOnboarding(): void {
    this._currentStep.set(0);
    this._isActive.set(true);
  }

  nextStep(): void {
    if (this._currentStep() < ONBOARDING_STEPS.length - 1) {
      this._currentStep.update(s => s + 1);
    }
  }

  previousStep(): void {
    if (this._currentStep() > 0) {
      this._currentStep.update(s => s - 1);
    }
  }

  /**
   * Marca el bono como reclamado y cierra el onboarding
   */
  claimBonusAndClose(): void {
    this._bonusClaimed.set(true);
    this.completeOnboarding();
  }

  /**
   * Cierra el onboarding sin reclamar el bono (skip)
   */
  skipOnboarding(): void {
    this.completeOnboarding();
  }

  /**
   * Marca el onboarding como completado en localStorage
   */
  completeOnboarding(): void {
    this._isActive.set(false);
    this._currentStep.set(0);
    this.storage.set(ONBOARDING_KEY, true);
  }

  /**
   * Resetea el onboarding (para testing)
   */
  resetOnboarding(): void {
    this.storage.set(ONBOARDING_KEY, false);
    this._bonusClaimed.set(false);
    this._isActive.set(false);
    this._currentStep.set(0);
  }
}
