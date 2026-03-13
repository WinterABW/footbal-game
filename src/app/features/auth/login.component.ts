import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <section class="min-h-dvh w-full relative overflow-hidden flex flex-col pt-safe-top bg-transparent">
      <!-- iOS 26 Liquid Glass Background -->
      <div class="absolute inset-0 z-0 bg-transparent pointer-events-none overflow-hidden">
        <div class="absolute top-[-20%] right-[-10%] w-[120%] h-[120%] bg-gradient-to-b from-indigo-500/10 via-transparent to-black/80 blur-[120px]"></div>
        <div class="absolute bottom-[-10%] right-[10%] w-[50%] h-[50%] bg-teal-500/5 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <!-- Header / Back -->
      <header class="relative z-20 px-6 py-6 flex items-center">
        <button (click)="goBack()" class="w-10 h-10 lg-icon-btn active:scale-90 transition-transform flex items-center justify-center">
          <svg class="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="ml-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Navigation</span>
      </header>

      <!-- Main Content -->
      <main class="relative z-20 flex-1 flex flex-col px-6 justify-center">
        <div class="mb-10 text-center">
          <h1 class="text-5xl font-black text-white tracking-tighter mb-2 text-glow">
            {{ activeTab() === 'login' ? 'IDENTITY' : 'NETWORK' }}
          </h1>
          <p class="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">
            {{ activeTab() === 'login' ? 'Authenticate System' : 'Establish Protocol' }}
          </p>
        </div>

        <!-- Glass Tabs -->
        <div class="lg-tab-bar mb-8 p-1.5 bg-white/5 backdrop-blur-3xl rounded-[28px] border border-white/10">
          <button (click)="activeTab.set('login')" 
                  [class.lg-tab-item--active]="activeTab() === 'login'"
                  class="lg-tab-item flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all">
            Login
          </button>
          <button (click)="activeTab.set('register')"
                  [class.lg-tab-item--active]="activeTab() === 'register'"
                  class="lg-tab-item flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all">
            Register
          </button>
        </div>

        <!-- Form Card -->
        <div class="lg-panel p-8 animate-slide-up bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px]">
          @if (error()) {
            <div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[11px] font-bold uppercase tracking-wider text-center animate-shake">
              {{ error() }}
            </div>
          }

          @if (activeTab() === 'login') {
            <form (ngSubmit)="onLogin()" class="space-y-6">
              <div class="space-y-3">
                <label class="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Access Key</label>
                <div class="relative group">
                   <div class="absolute inset-y-0 left-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-teal-400 transition-colors">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2"/></svg>
                   </div>
                   <input type="text" [(ngModel)]="identifier" name="ident" class="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-5 text-white placeholder:text-white/10 focus:outline-none focus:border-white/30 transition-all font-bold text-sm" placeholder="Username / Email">
                </div>
              </div>

              <div class="space-y-3">
                <label class="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Security Token</label>
                <div class="relative group">
                   <div class="absolute inset-y-0 left-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-teal-400 transition-colors">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke-width="2"/></svg>
                   </div>
                   <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="pass" name="pass" class="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-12 text-white placeholder:text-white/10 focus:outline-none focus:border-white/30 transition-all font-bold text-sm" placeholder="••••••••">
                   <button type="button" (click)="togglePassword()" class="absolute right-4 inset-y-0 flex items-center text-white/20 hover:text-white/50 transition-colors">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path [attr.d]="showPassword() ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'" />
                      </svg>
                   </button>
                </div>
              </div>

              <button type="submit" [disabled]="isLoading()" class="lg-btn-primary w-full py-5 text-sm uppercase font-black tracking-widest active:scale-95 transition-all">
                 {{ isLoading() ? 'SYNCING...' : 'INITIATE ACCESS' }}
              </button>
            </form>
          } @else {
            <form (ngSubmit)="onRegister()" class="space-y-6">
               <div class="space-y-3">
                <label class="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Digital Identity</label>
                <input type="text" [(ngModel)]="identifier" name="reg-ident" class="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white placeholder:text-white/10 focus:outline-none focus:border-white/30 transition-all font-bold text-sm" placeholder="Email or Phone">
              </div>
              <div class="space-y-3">
                <label class="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Master Code</label>
                <input type="password" [(ngModel)]="pass" name="reg-pass" class="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white placeholder:text-white/10 focus:outline-none focus:border-white/30 transition-all font-bold text-sm" placeholder="Min. 8 characters">
              </div>
              <label class="flex items-center gap-4 cursor-pointer group px-2 py-2">
                <input type="checkbox" [(ngModel)]="terms" name="terms" class="w-5 h-5 rounded-lg border-2 border-white/10 bg-transparent checked:bg-teal-500 checked:border-teal-500 transition-all cursor-pointer">
                <span class="text-[9px] font-black text-white/20 uppercase leading-none tracking-widest group-hover:text-white/40 transition-colors">Accept Network Protocol</span>
              </label>

              <button type="submit" [disabled]="isLoading() || !terms()" class="lg-btn-primary w-full py-5 text-sm uppercase font-black tracking-widest active:scale-95 transition-all">
                 {{ isLoading() ? 'ESTABLISHING...' : 'CREATE IDENTITY' }}
              </button>
            </form>
          }

          <!-- Social Login Minimal -->
          <div class="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
             <span class="text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">External Gateways</span>
             <div class="flex justify-center gap-8">
               <button class="w-14 h-14 lg-icon-btn flex items-center justify-center opacity-40 hover:opacity-100 active:scale-90 transition-all">
                 <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/></svg>
               </button>
               <button class="w-14 h-14 lg-icon-btn flex items-center justify-center opacity-40 hover:opacity-100 active:scale-90 transition-all">
                 <svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
               </button>
             </div>
          </div>
        </div>
      </main>

      <footer class="p-8 text-center">
         <div class="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <div class="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
            <span class="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Quantum Secure Channel</span>
         </div>
      </footer>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .pt-safe-top { padding-top: env(safe-area-inset-top, 1rem); }
    .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
    @keyframes shake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-4px); } 40%, 60% { transform: translateX(4px); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeTab = signal<'login' | 'register'>('login');
  identifier = '';
  pass = '';
  terms = signal(false);
  isLoading = signal(false);
  showPassword = signal(false);
  error = signal<string | null>(null);

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
      const success = await this.authService.login(this.identifier, this.pass);
      if (success) this.router.navigate(['/main']);
    } catch (err) {
      this.error.set('Credenciales inválidas');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onRegister() {
    if (!this.identifier || !this.pass) {
      this.error.set('Campos requeridos vacíos');
      return;
    }
    if (!this.terms()) {
      this.error.set('Acepta los términos');
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const success = await this.authService.register(this.identifier, this.pass);
      if (success) this.router.navigate(['/main']);
    } catch (err) {
      this.error.set('Error en registro');
    } finally {
      this.isLoading.set(false);
    }
  }

  togglePassword() { this.showPassword.update(v => !v); }
  goBack() { this.router.navigate(['/welcome']); }
}
