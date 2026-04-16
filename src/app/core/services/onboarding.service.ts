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
  targetId?: string;          // data-tutorial-id to spotlight (null for intro/closing)
  characterPose: 'standing' | 'pointing';
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido, Coach!',
    description: 'Soy el árbitro y te voy a mostrar cómo funciona el juego. ¡Dame un minuto y vas a ser un experto!',
    icon: '⚽',
    characterPose: 'standing',
  },
  {
    id: 'profile',
    title: 'Tu Perfil',
    description: 'Acá está tu avatar y nivel. Tocá para ver tus estadísticas y subir de nivel.',
    icon: '👤',
    targetId: 'header-profile',
    characterPose: 'pointing',
  },
  {
    id: 'settings',
    title: 'Ajustes',
    description: 'Configurá idioma, vibración y más. También podés re-ver este tutorial desde acá.',
    icon: '⚙️',
    targetId: 'header-settings',
    characterPose: 'pointing',
  },
  {
    id: 'balance',
    title: 'Tu Saldo',
    description: 'Este es tu balance de monedas. Cada tap que hagas suma monedas acá.',
    icon: '💰',
    targetId: 'balance',
    characterPose: 'pointing',
  },
  {
    id: 'openball',
    title: 'Open Ball',
    description: 'Abrí pelotas sorpresa para ganar premios instantáneos. ¡Siempre hay algo bueno adentro!',
    icon: '🎁',
    targetId: 'action-openball',
    characterPose: 'pointing',
  },
  {
    id: 'roulette',
    title: 'Ruleta',
    description: 'Girá la ruleta y probá tu suerte. Los premios van desde monedas hasta multiplicadores.',
    icon: '🎰',
    targetId: 'action-roulette',
    characterPose: 'pointing',
  },
  {
    id: 'copspin',
    title: 'COP Spin',
    description: 'Otro minijuego para ganar monedas extra. ¡Mientras más juegues, más ganás!',
    icon: '🌀',
    targetId: 'action-copspin',
    characterPose: 'pointing',
  },
  {
    id: 'tap',
    title: 'La Pelota',
    description: '¡Esto es lo más importante! Tocá la pelota para ganar monedas. Cada tap suma a tu balance.',
    icon: '⚽',
    targetId: 'tap-area',
    characterPose: 'pointing',
  },
  {
    id: 'energy',
    title: 'Energía',
    description: 'Tu energía se gasta con cada tap. Si se agota, esperá un poco a que se recargue sola.',
    icon: '⚡',
    targetId: 'energy-bar',
    characterPose: 'pointing',
  },
  {
    id: 'boost',
    title: 'Boost',
    description: '¿Querés más ganancias? Usá el Boost para multiplicar lo que ganás por tap.',
    icon: '🚀',
    targetId: 'boost-btn',
    characterPose: 'pointing',
  },
  {
    id: 'nav-social',
    title: 'Social',
    description: 'Mirá lo que hacen tus amigos, competí y divertite juntos.',
    icon: '👥',
    targetId: 'nav-social',
    characterPose: 'pointing',
  },
  {
    id: 'nav-retos',
    title: 'Retos',
    description: 'Completá desafíos diarios para ganar recompensas extra. ¡No te los pierdas!',
    icon: '🏆',
    targetId: 'nav-retos',
    characterPose: 'pointing',
  },
  {
    id: 'nav-fichajes',
    title: 'Fichajes',
    description: 'Invertí tus monedas en jugadores. Cada uno te genera ganancias por hora automáticamente.',
    icon: '💎',
    targetId: 'nav-fichajes',
    characterPose: 'pointing',
  },
  {
    id: 'nav-banco',
    title: 'Banco',
    description: 'Tu billetera. Acá ves todo tu historial y podés hacer retiros.',
    icon: '🏦',
    targetId: 'nav-banco',
    characterPose: 'pointing',
  },
  {
    id: 'closing',
    title: '¡A jugar!',
    description: 'Ya sabés todo lo que necesitás. ¡Ahora a divertirse y ganar monedas! 🎉',
    icon: '🎉',
    characterPose: 'standing',
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
  private _showBonusClaim = signal(false);

  readonly isActive = this._isActive.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();
  readonly bonusClaimed = this._bonusClaimed.asReadonly();
  readonly showBonusClaim = this._showBonusClaim.asReadonly();
  readonly steps = ONBOARDING_STEPS;

  readonly currentStepData = computed(() => ONBOARDING_STEPS[this._currentStep()]);
  readonly isFirstStep = computed(() => this._currentStep() === 0);
  readonly isLastStep = computed(() => this._currentStep() === ONBOARDING_STEPS.length - 1);

  /**
   * Verifica si el usuario es primera vez:
   * 1. Flag local de registro nuevo (welcome_bonus_pending)
   * 2. localStorage flag (no completó onboarding antes)
   */
  isFirstTimeUser(): boolean {
    if (!this.storage.isBrowser) return false;

    // Si ya completó el onboarding antes, no mostrar
    if (this.storage.get<boolean>(ONBOARDING_KEY)) {
      return false;
    }

    // Verificar si tiene bonus de bienvenida pendiente (registro nuevo)
    // No mostrar si ya se vio antes (flag = 'seen')
    const welcomeBonusStatus = localStorage.getItem('welcome_bonus_pending');
    if (welcomeBonusStatus === 'true') {
      return true;
    }

    // Vérificar también account age (fallback)
    const userStatus = this.userStatusService.userStatus();
    if (!userStatus?.createdAt) {
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
   * Marca el bono como reclamado y cierra el modal de bonus claim
   */
  claimBonusAndClose(): void {
    this._bonusClaimed.set(true);
    this._showBonusClaim.set(false);
    // Eliminar flag de bonus pendiente después de reclamar
    localStorage.removeItem('welcome_bonus_pending');
  }

  /**
   * Cierra el onboarding sin reclamar el bono (skip)
   */
  skipOnboarding(): void {
    this.completeOnboarding();
  }

  /**
   * Marca el onboarding como completado en localStorage
   * y muestra el modal de bonus claim SOLO si es registro nuevo
   */
  completeOnboarding(): void {
    this._isActive.set(false);
    this._currentStep.set(0);
    this.storage.set(ONBOARDING_KEY, true);
    
    // Solo mostrar bonus si es usuario registrado nuevo (flag existe)
    const hasWelcomeBonus = localStorage.getItem('welcome_bonus_pending') === 'true';
    if (hasWelcomeBonus) {
      // Importante: marcar el flag como visto para que no se muestre otra vez
      // (aunque el usuario skipee el bono)
      localStorage.setItem('welcome_bonus_pending', 'seen');
      this._showBonusClaim.set(true);
    }
  }

  /**
   * Cierra el modal de bonus claim
   */
  dismissBonusClaim(): void {
    this._showBonusClaim.set(false);
    this._bonusClaimed.set(true);
  }

  /**
   * Resetea el onboarding (para testing)
   */
  resetOnboarding(): void {
    this.storage.set(ONBOARDING_KEY, false);
    this._bonusClaimed.set(false);
    this._isActive.set(false);
    this._currentStep.set(0);
    this._showBonusClaim.set(false);
  }
}
