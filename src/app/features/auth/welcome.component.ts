import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

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
           <div class="w-full lg-card-module p-4 md:p-5 rounded-2xl">
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1">
                <h2 class="text-sm md:text-lg font-bold text-white mb-0.5">
                  Bono de Bienvenida
                </h2>
                 <p class="text-xs font-medium text-amber-300">
                   Obtén recompensas al registrarte
                 </p>
                 <div class="flex flex-col gap-1 text-xs text-amber-300">
                   <div class="flex items-center gap-1.5">
                   <img src="shared/balance/coin.webp" alt="Monedas" class="w-5 h-5 flex-shrink-0">
                   <span class="font-medium">+500 Monedas</span>
                 </div>
                 <div class="flex items-center gap-1.5">
                   <img src="mini-games/tickets/tickets.webp" alt="Tickets" class="w-5 h-5 flex-shrink-0">
                   <span class="font-medium text-cyan-300">+5 tickets</span>
                   </div>
                 </div>
              </div>
              <div class="text-4xl md:text-5xl">🎁</div>
            </div>
          </div>

          <!-- Benefits Grid - Compact Liquid Glass Cards -->
          <div class="w-full grid grid-cols-2 gap-2 md:gap-3">
            <div class="lg-module-card p-2 md:p-3 text-center">
              <div class="text-2xl md:text-3xl mb-1 md:mb-2">💎</div>
              <p class="text-[10px] md:text-xs font-semibold text-white">Jugadores VIP</p>
              <p class="text-[8px] md:text-[9px] text-blue-300 mt-0.5">Más rentables</p>
            </div>
            <div class="lg-module-card p-2 md:p-3 text-center">
              <div class="text-2xl md:text-3xl mb-1 md:mb-2">⚡</div>
              <p class="text-[10px] md:text-xs font-semibold text-white">Boosts de Poder</p>
              <p class="text-[8px] md:text-[9px] text-purple-300 mt-0.5">Incrementa ganancias</p>
            </div>
            <div class="lg-module-card p-2 md:p-3 text-center">
              <div class="text-2xl md:text-3xl mb-1 md:mb-2">🤝</div>
              <p class="text-[10px] md:text-xs font-semibold text-white">Programa de Referidos</p>
              <p class="text-[8px] md:text-[9px] text-emerald-300 mt-0.5">Gana comisión</p>
            </div>
            <div class="lg-module-card p-2 md:p-3 text-center">
              <div class="text-2xl md:text-3xl mb-1 md:mb-2">🏆</div>
              <p class="text-[10px] md:text-xs font-semibold text-white">Rankings Globales</p>
              <p class="text-[8px] md:text-[9px] text-orange-300 mt-0.5">Compite por premios</p>
            </div>
          </div>
        </div>

        <!-- Bottom Section - CTA Buttons -->
        <div class="w-full flex flex-col gap-2 animate-fade-in-up animation-delay-400 max-w-md mb-5 md:mb-6 px-1">
          
          <!-- Primary CTA - Registrate y Juega -->
          <button
            (click)="goToRegister()"
            class="group relative w-full py-2.5 md:py-2.5 rounded-xl overflow-hidden transition-all duration-300 active:scale-[0.98] cursor-pointer"
            style="background: linear-gradient(to right, rgba(0,212,255,0.45) 0%, rgba(0,212,255,0.20) 40%, transparent 75%); border: 1px solid rgba(0,212,255,0.55);"
          >
            <!-- Hover glow effect -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style="background: linear-gradient(to right, rgba(0,212,255,0.55) 0%, rgba(0,212,255,0.30) 40%, transparent 70%);"></div>
            
            <!-- Shine sweep effect -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 overflow-hidden">
              <div class="absolute -top-full left-0 w-[150%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full duration-700 ease-out skew-x-12"></div>
            </div>
            
            <!-- Content -->
            <div class="relative flex items-center justify-center gap-2">
              <span class="text-sm md:text-sm font-bold text-emerald-100 tracking-wide drop-shadow-lg">Registrate y Juega</span>
              <svg class="w-4 h-4 text-emerald-300 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </div>
          </button>

          <!-- Secondary CTA - Tengo una cuenta -->
          <button
            (click)="goToLogin()"
            class="group relative w-full py-2 md:py-2 rounded-xl overflow-hidden transition-all duration-300 active:scale-[0.98] cursor-pointer"
            style="background: linear-gradient(to right, rgba(255,208,96,0.45) 0%, rgba(255,208,96,0.20) 40%, transparent 75%); border: 1px solid rgba(255,208,96,0.55);"
          >
            <!-- Hover glow effect -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style="background: linear-gradient(to right, rgba(255,208,96,0.55) 0%, rgba(255,208,96,0.30) 40%, transparent 70%);"></div>
            
            <!-- Shine sweep effect -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 overflow-hidden">
              <div class="absolute -top-full left-0 w-[150%] h-full bg-gradient-to-r from-transparent via-white/15 to-transparent transform -translate-x-full group-hover:translate-x-full duration-700 ease-out skew-x-12"></div>
            </div>
            
            <div class="relative flex items-center justify-center gap-2">
              <span class="text-xs md:text-sm font-semibold text-amber-100 drop-shadow-md">Tengo una cuenta</span>
              <svg class="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </button>

          <!-- Ghost CTA - Entrar como invitado -->
          <button
            (click)="goToGuest()"
            class="group relative w-full py-2 md:py-2 rounded-xl overflow-hidden transition-all duration-300 active:scale-[0.98] cursor-pointer"
            style="background: linear-gradient(to right, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.05) 40%, transparent 75%); border: 1px solid rgba(0,212,255,0.15);"
          >
            <!-- Hover glow effect -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style="background: linear-gradient(to right, rgba(0,212,255,0.18) 0%, rgba(0,212,255,0.08) 40%, transparent 70%);"></div>
            
            <!-- Shine sweep effect -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 overflow-hidden">
              <div class="absolute -top-full left-0 w-[150%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full duration-700 ease-out skew-x-12"></div>
            </div>
            
            <div class="relative flex items-center justify-center gap-2">
              <span class="text-xs md:text-sm font-medium text-white/70 group-hover:text-white/95 transition-colors drop-shadow">Entrar como invitado</span>
            </div>
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
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  referrealId = this.route.snapshot.queryParamMap.get('referrealId');

  goToRegister() {
    const queryParams = this.referrealId 
      ? { tab: 'register', referrealId: this.referrealId }
      : { tab: 'register' };
    this.router.navigate(['/login'], { queryParams });
  }

  goToLogin() {
    const queryParams = this.referrealId 
      ? { referrealId: this.referrealId }
      : {};
    this.router.navigate(['/login'], { queryParams });
  }

   goToGuest() {
     this.router.navigate(['/main']);
   }
}