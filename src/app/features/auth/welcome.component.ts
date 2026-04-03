import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-welcome',
  template: `
    <div class="welcome-container min-h-screen w-full flex flex-col relative overflow-hidden">
      <!-- Background Image -->
      <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" style="background-image: url('backgrounds/main.jpeg');">
        <div class="absolute inset-0 bg-gradient-to-b from-black/70 via-black/75 to-black/85"></div>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col items-center justify-between flex-1 p-3 md:p-4">
        
        <!-- Top Section - Welcome Text -->
        <div class="w-full text-center mt-4 md:mt-6 animate-fade-in-down">
          <h1 class="text-3xl md:text-4xl font-black text-white mb-1 tracking-tight leading-tight">
            ¡Juega y Gana!
          </h1>
          <p class="text-xs text-cyan-300 font-semibold mb-1">
            Compra jugadores y genera ganancias
          </p>
          <p class="text-[9px] text-slate-400">
            Líder en inversión de jugadores
          </p>
        </div>

        <!-- Middle Section - Featured Content -->
        <div class="flex flex-col items-center gap-2.5 md:gap-3.5 animate-fade-in-up animation-delay-200 w-full max-w-md px-1">
          
          <!-- Promo Card - Liquid Glass Compact -->
          <div class="w-full liquid-glass-card p-4 md:p-5 rounded-2xl">
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1">
                <h2 class="text-sm md:text-lg font-bold text-white mb-0.5">
                  Bono de Bienvenida
                </h2>
                <p class="text-xs text-cyan-300 font-semibold mb-2">
                  Obtén recompensas al registrarte
                </p>
                <div class="flex items-center gap-1.5 text-slate-300 text-[10px]">
                  <svg class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="font-semibold">+500 Monedas</span>
                </div>
              </div>
              <div class="text-4xl md:text-5xl">🎁</div>
            </div>
          </div>

          <!-- Benefits Grid - Compact Liquid Glass Cards -->
          <div class="w-full grid grid-cols-2 gap-2 md:gap-3">
            <div class="lg-module-card p-2 md:p-3 text-center hover:scale-[1.02] active:scale-95">
              <div class="text-2xl md:text-3xl mb-1 md:mb-2">💎</div>
              <p class="text-[10px] md:text-xs font-semibold text-white">Jugadores VIP</p>
              <p class="text-[8px] md:text-[9px] text-blue-300 mt-0.5">Más rentables</p>
            </div>
            <div class="lg-module-card p-2 md:p-3 text-center hover:scale-[1.02] active:scale-95">
              <div class="text-2xl md:text-3xl mb-1 md:mb-2">⚡</div>
              <p class="text-[10px] md:text-xs font-semibold text-white">Boosts de Poder</p>
              <p class="text-[8px] md:text-[9px] text-purple-300 mt-0.5">Incrementa ganancias</p>
            </div>
            <div class="lg-module-card p-2 md:p-3 text-center hover:scale-[1.02] active:scale-95">
              <div class="text-2xl md:text-3xl mb-1 md:mb-2">🤝</div>
              <p class="text-[10px] md:text-xs font-semibold text-white">Programa de Referidos</p>
              <p class="text-[8px] md:text-[9px] text-emerald-300 mt-0.5">Gana comisión</p>
            </div>
            <div class="lg-module-card p-2 md:p-3 text-center hover:scale-[1.02] active:scale-95">
              <div class="text-2xl md:text-3xl mb-1 md:mb-2">🏆</div>
              <p class="text-[10px] md:text-xs font-semibold text-white">Rankings Globales</p>
              <p class="text-[8px] md:text-[9px] text-orange-300 mt-0.5">Compite por premios</p>
            </div>
          </div>
        </div>

        <!-- Bottom Section - CTA Buttons -->
        <div class="w-full flex flex-col gap-2.5 animate-fade-in-up animation-delay-400 max-w-md mb-6 md:mb-8 px-1">
          <button
            (click)="goToRegister()"
            class="w-full py-2.5 md:py-3 lg-btn-primary text-sm md:text-base"
          >
            Registrate y Juega
          </button>

          <button
            (click)="goToLogin()"
            class="w-full py-2.5 md:py-3 lg-btn-outline text-sm md:text-base"
          >
            Tengo una cuenta
          </button>

          <button
            (click)="goToGuest()"
            class="w-full py-2.5 md:py-3 lg-btn-ghost text-sm md:text-base"
          >
            Entrar como invitado
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1rem); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  identifier = '';
  password = signal('');
  referralCode = signal('');
  acceptTerms = signal(false);
  isLoading = signal(false);
  showPassword = signal(false);
  error = signal<string | null>(null);

  goToRegister() {
    this.router.navigate(['/login'], { queryParams: { tab: 'register' } });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToGuest() {
    this.router.navigate(['/main']);
  }

  goBack() {
    this.router.navigate(['/welcome']);
  }
}