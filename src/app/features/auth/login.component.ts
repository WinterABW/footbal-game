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
            class="w-20 h-20 mx-auto object-contain"
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
                 <label class="text-[8px] font-bold text-white/30 uppercase tracking-wider ml-1">Email o Número</label>
                <input type="text" [(ngModel)]="identifier" name="ident" 
                       class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                       placeholder="usuario@email.com">
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
                <label class="text-[8px] font-bold text-white/30 uppercase tracking-wider ml-1">Nombre</label>
                <input type="text" [(ngModel)]="name" name="reg-name" 
                       class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                       placeholder="Tu nombre">
              </div>

              <div class="space-y-2">
                <label class="text-[8px] font-bold text-white/30 uppercase tracking-wider ml-1">Correo electrónico</label>
                <input type="email" [(ngModel)]="email" name="reg-email" 
                       class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                       placeholder="tu.correo@ejemplo.com">
              </div>

              <div class="space-y-2">
                <label class="text-[8px] font-bold text-white/30 uppercase tracking-wider ml-1">Número telefónico</label>
                <input type="tel" [(ngModel)]="phoneNumber" name="reg-phone" 
                       class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                       placeholder="+XX YYY ZZZZ">
              </div>

              <div class="space-y-2">
                <label class="text-[8px] font-bold text-white/30 uppercase tracking-wider ml-1">Contraseña</label>
                <input type="password" [(ngModel)]="pass" name="reg-pass"
                       class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                       placeholder="Mínimo 8 caracteres">
              </div>

              <div class="space-y-2">
                <label class="text-[8px] font-bold text-white/30 uppercase tracking-wider ml-1">Repetir Contraseña</label>
                <input type="password" [(ngModel)]="repeatPass" name="reg-repeat-pass"
                       class="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                       placeholder="Repite tu contraseña">
              </div>

              <div class="flex items-center gap-3">
                <input type="checkbox" id="terms" [ngModel]="terms()" (ngModelChange)="terms.set($event)" name="terms" class="hidden" />
                <label for="terms" class="flex items-center gap-3 cursor-pointer select-none">
                  <div [class]="checkboxClass()">
                    @if (terms()) {
                    <svg class="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                    }
                  </div>
                  <span class="text-[11px] text-white/70 hover:text-white transition-colors">Acepto los términos</span>
                </label>
              </div>

               <button type="submit" [disabled]="isLoading() || !terms()" 
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
  identifier = '';
  name = '';
  email = '';
  phoneNumber = '';
  pass = '';
  repeatPass = '';
  terms = signal(false);
  isLoading = signal(false);
  showPassword = signal(false);
  error = signal<string | null>(null);

  checkboxClass = computed(() => {
    const base = 'relative w-5 h-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center';
    const state = this.terms() ? 'border-emerald-400 bg-emerald-600/20' : 'border-white/20 bg-white/5';
    const hover = 'hover:border-white/40';
    return `${base} ${state} ${hover}`;
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'register') {
        this.activeTab.set('register');
      }
    });
  }

  async onLogin() {
    if (!this.identifier || !this.pass) {
      this.error.set('Campos requeridos vacíos');
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const result = await this.authService.login(this.identifier, this.pass);
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
    if (!this.name || !this.email || !this.phoneNumber || !this.pass || !this.repeatPass) {
      this.error.set('Todos los campos son requeridos');
      return;
    }
    if (this.pass !== this.repeatPass) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }
    if (!this.terms()) {
      this.error.set('Acepta los términos');
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const result = await this.authService.register(
        this.email, // Usamos el email como identificador principal
        this.pass,
        this.name, // Nombre de usuario
        this.phoneNumber // Número de teléfono
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
