import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <section class="min-h-dvh w-full relative overflow-hidden flex flex-col bg-transparent">
      <!-- Background -->
      <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div class="absolute top-[-20%] right-[-10%] w-[120%] h-[120%] bg-gradient-to-b from-[#0d1b6e]/20 via-transparent to-black/80 blur-[80px] lg-float"></div>
        <div class="absolute bottom-[-10%] right-[10%] w-[50%] h-[50%] bg-[#00d4ff]/10 rounded-full blur-[60px] lg-float animation-delay-200"></div>
      </div>

      <!-- Header Minimal -->
      <header class="relative z-20 px-4 py-4 flex items-center">
        <button (click)="goBack()" class="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </header>

      <!-- Main Content Compact -->
      <main class="relative z-20 flex-1 flex flex-col px-5 justify-center -mt-10">
        <!-- Logo Icon -->
        <div class="text-center mb-4">
           <img 
             src="/backgrounds/login.webp" 
             alt="FIFA Empire Logo" 
             class="w-32 h-32 mx-auto object-contain"
           />
        </div>

        <!-- Logo/Title -->
        <div class="text-center mb-6">
          <h1 class="text-3xl font-black text-white tracking-tighter text-glow-cyan">
            FIFA' Empire
          </h1>
          <p class="text-xs font-medium text-white/70 uppercase tracking-widest mt-1">
            {{ activeTab() === 'login' ? 'Acceder' : 'Registrar' }}
          </p>
        </div>


        <!-- Compact Tabs - Using official lg-tab-bar -->
         <div class="lg-tab-bar mb-6">
           <button (click)="activeTab.set('login')" 
                   [class.lg-tab-item--active]="activeTab() === 'login'"
                   class="lg-tab-item flex-1">
             Acceder
           </button>
           <button (click)="activeTab.set('register')"
                   [class.lg-tab-item--active]="activeTab() === 'register'"
                   class="lg-tab-item flex-1">
             Registrar
           </button>
         </div>

        <!-- Error Alert -->
        @if (error()) {
          <div class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-[10px] font-medium text-center animate-pulse">
            {{ error() }}
          </div>
        }

        <!-- Form -->
        <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          @if (activeTab() === 'login') {
            <form (ngSubmit)="onLogin()" class="space-y-3">
              <div class="space-y-2">
                 <label class="text-[8px] font-bold text-white/30 uppercase tracking-wider ml-1">Nombre de Usuario</label>
                <input type="text" [(ngModel)]="username" name="ident" 
                       class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                       placeholder="Tu nombre de usuario">
              </div>

              <div class="space-y-2">
                <label class="text-[8px] font-bold text-white/30 uppercase tracking-wider ml-1">Contraseña</label>
                <div class="relative">
                  <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="pass" name="pass"
                         class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 pr-10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                         placeholder="••••••••">
                  <button type="button" (click)="togglePassword()" class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path [attr.d]="showPassword() ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'" />
                    </svg>
                  </button>
                </div>
              </div>

                <button type="submit" [disabled]="isLoading()" 
                        class="w-full lg-btn-primary py-2.5 px-4 text-sm uppercase tracking-wider active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-glow-cyan">
                  {{ isLoading() ? 'Cargando...' : 'Entrar' }}
                </button>
            </form>
          } @else {
            <form (ngSubmit)="onRegister()" class="space-y-3">
              <div class="space-y-2">
                <label class="text-[8px] font-bold text-white/30 uppercase tracking-wider ml-1">Nombre de Usuario</label>
                <input type="text" [(ngModel)]="name" name="reg-username" 
                       class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                       placeholder="Tu nombre de usuario">
              </div>

              <div class="space-y-2">
                <label class="text-[8px] font-bold text-white/30 uppercase tracking-wider ml-1">Teléfono</label>
                <div class="flex gap-2">
                  <!-- Country Prefix Select -->
                  <div class="relative w-24">
                    <select [(ngModel)]="countryPrefix" name="country-prefix"
                            class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-2 text-white text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all appearance-none cursor-pointer">
                      @for (country of countries; track country.code) {
                        <option [value]="country.prefix" class="bg-slate-900 text-white">
                          {{ country.prefix }} {{ country.flag }}
                        </option>
                      }
                    </select>
                    <svg class="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <!-- Phone Input -->
                  <input type="tel" [(ngModel)]="phone" name="reg-phone" 
                         class="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                         placeholder="Tu número de teléfono">
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-[8px] font-bold text-white/30 uppercase tracking-wider ml-1">Código de Referido (Opcional)</label>
                <input type="text" [(ngModel)]="refId" name="reg-refid"
                       class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                       placeholder="Ingresa tu código de referido">
              </div>

              <div class="space-y-2">
                <label class="text-[8px] font-bold text-white/30 uppercase tracking-wider ml-1">Contraseña</label>
                <input type="password" [(ngModel)]="pass" name="reg-pass"
                       class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                       placeholder="Tu contraseña">
              </div>

               <button type="submit" [disabled]="isLoading()" 
                         class="w-full lg-btn-primary py-2.5 px-4 text-sm uppercase tracking-wider active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-glow-cyan">
                   {{ isLoading() ? 'Creando...' : 'Crear cuenta' }}
                 </button>
            </form>
          }
         </div>
        </main>
      </section>
  `,
  styles: [`
    :host { display: block; }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1rem); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeTab = signal<'login' | 'register'>('login');
  username = '';
  name = '';
  phone = '';
  pass = '';
  refId = '';
  countryPrefix = '+54'; // Default: Argentina
  isLoading = signal(false);
  showPassword = signal(false);
  error = signal<string | null>(null);

  // Country prefixes for Latin America & Caribbean
  countries = [
    { code: 'AR', name: 'Argentina', prefix: '+54', flag: '🇦🇷' },
    { code: 'BO', name: 'Bolivia', prefix: '+591', flag: '🇧🇴' },
    { code: 'BR', name: 'Brasil', prefix: '+55', flag: '🇧🇷' },
    { code: 'CL', name: 'Chile', prefix: '+56', flag: '🇨🇱' },
    { code: 'CO', name: 'Colombia', prefix: '+57', flag: '🇨🇴' },
    { code: 'CR', name: 'Costa Rica', prefix: '+506', flag: '🇨🇷' },
    { code: 'CU', name: 'Cuba', prefix: '+53', flag: '🇨🇺' },
    { code: 'DO', name: 'Rep. Dominicana', prefix: '+1', flag: '🇩🇴' },
    { code: 'EC', name: 'Ecuador', prefix: '+593', flag: '🇪🇨' },
    { code: 'SV', name: 'El Salvador', prefix: '+503', flag: '🇸🇻' },
    { code: 'GT', name: 'Guatemala', prefix: '+502', flag: '🇬🇹' },
    { code: 'HN', name: 'Honduras', prefix: '+504', flag: '🇭🇳' },
    { code: 'MX', name: 'México', prefix: '+52', flag: '🇲🇽' },
    { code: 'NI', name: 'Nicaragua', prefix: '+505', flag: '🇳🇮' },
    { code: 'PA', name: 'Panamá', prefix: '+507', flag: '🇵🇦' },
    { code: 'PY', name: 'Paraguay', prefix: '+595', flag: '🇵🇾' },
    { code: 'PE', name: 'Perú', prefix: '+51', flag: '🇵🇪' },
    { code: 'PR', name: 'Puerto Rico', prefix: '+1', flag: '🇵🇷' },
    { code: 'UY', name: 'Uruguay', prefix: '+598', flag: '🇺🇾' },
    { code: 'VE', name: 'Venezuela', prefix: '+58', flag: '🇻🇪' },
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'register') {
        this.activeTab.set('register');
      }
    });
  }

  async onLogin() {
    if (!this.username || !this.pass) {
      this.error.set('Campos requeridos vacíos');
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const result = await this.authService.login(this.username, this.pass);
      if (result.success) {
        this.router.navigate(['/main']);
      } else {
        this.error.set(result.error || 'Credenciales inválidas');
      }
    } catch (err) {
      this.error.set('Credenciales inválidas');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onRegister() {
    // Validate required fields: name (username), phone, pass (password)
    if (!this.name || !this.phone || !this.pass) {
      this.error.set('Todos los campos son requeridos');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    try {
      // Full phone number with country prefix
      const fullPhone = `${this.countryPrefix}${this.phone.replace(/^\+?\d/i, '')}`;
      // refId is optional, so we can pass null or undefined if not provided by a field
      const refId = undefined; // Or null, depending on backend preference for optional unset values

      const result = await this.authService.register(
        this.name, // username
        this.pass, // password
        fullPhone, // phone with prefix
        refId // refId (optional)
      );
      if (result.success) {
        this.router.navigate(['/main']);
      } else {
        this.error.set(result.error || 'Error en registro');
      }
    } catch (err) {
      this.error.set('Error en registro');
    } finally {
      this.isLoading.set(false);
    }
  }

  togglePassword() { this.showPassword.update(v => !v); }
  goBack() { this.router.navigate(['/welcome']); }
  
  skipLogin() {
    // Dev mode - skip authentication and go directly to main
    console.warn('⚠️ DEV MODE: Skipping authentication');
    this.router.navigate(['/main']);
  }
}
