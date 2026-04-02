import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { GlassModalComponent } from '../../../../shared/ui';
import { OnboardingService } from '../../../../core/services/onboarding.service';

@Component({
  selector: 'app-settings',
  imports: [GlassModalComponent],
  template: `
    <app-glass-modal [isOpen]="isOpen()" [compact]="true" (closed)="onClose()">
      <div class="flex flex-col gap-4">
        <!-- Compact Header -->
        <div class="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
           <div class="flex items-center gap-4">
              <div class="relative">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center relative z-10 shadow-lg">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" stroke-width="2" /></svg>
                </div>
                <div class="absolute -inset-2 bg-purple-500/20 rounded-3xl blur-xl animate-pulse"></div>
              </div>
              <h3 class="text-xl font-bold text-white tracking-tight">Ajustes</h3>
           </div>
           <button
             class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
             (click)="onClose()"
             type="button"
             aria-label="Cerrar">
             <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
           </button>
        </div>

        <main class="flex flex-col gap-2.5">
          <!-- 1. Seleccionar idioma -->
          <div class="flex flex-col gap-2 p-3 liquid-glass-card bg-white/[0.03] border-white/5 rounded-2xl">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-[14px] flex items-center justify-center bg-blue-900/40 text-blue-300 shadow-inner">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
              </div>
              <span class="flex-1 text-[15px] font-bold text-white tracking-tight">Seleccionar idioma</span>
            </div>
            <select
              [value]="language()"
              (change)="onLanguageChange($event)"
              class="bg-white/10 border border-white/10 rounded-xl px-3 py-2 w-full text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none cursor-pointer">
              <option value="es" class="bg-slate-900 text-white">Español</option>
              <option value="en" class="bg-slate-900 text-white">English</option>
              <option value="pt" class="bg-slate-900 text-white">Português</option>
            </select>
          </div>

          <!-- 2. Vibración en pantalla -->
          <button (click)="onVibrationToggle()" class="flex items-center gap-4 p-3 liquid-glass-card bg-white/[0.03] border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all w-full text-left rounded-2xl">
            <div class="w-10 h-10 rounded-[14px] flex items-center justify-center bg-purple-900/40 text-purple-300 shadow-inner">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
            </div>
            <span class="flex-1 text-[15px] font-bold text-white tracking-tight">Vibración en pantalla</span>
            <div class="w-[42px] h-[24px] rounded-full relative transition-colors duration-300 shadow-inner" 
                 [class.bg-emerald-500]="vibrationEnabled()" [class.bg-white/10]="!vibrationEnabled()">
              <div class="w-[20px] h-[20px] bg-white rounded-full absolute top-[2px] shadow-sm transition-transform duration-300"
                   [class.translate-x-[20px]]="vibrationEnabled()" [class.translate-x-[2px]]="!vibrationEnabled()"></div>
            </div>
          </button>

          <!-- 3. Tutorial -->
          <button (click)="openTutorial()" class="flex items-center gap-4 p-3 liquid-glass-card bg-white/[0.03] border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all w-full text-left rounded-2xl">
            <div class="w-10 h-10 rounded-[14px] flex items-center justify-center bg-amber-900/40 text-amber-300 shadow-inner">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
            </div>
            <span class="flex-1 text-[15px] font-bold text-white tracking-tight">Tutorial</span>
            <svg class="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>

          <!-- 4. Soporte -->
          <button class="flex items-center gap-4 p-3 liquid-glass-card bg-white/[0.03] border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all w-full text-left rounded-2xl">
            <div class="w-10 h-10 rounded-[14px] flex items-center justify-center bg-emerald-900/40 text-emerald-300 shadow-inner">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <span class="flex-1 text-[15px] font-bold text-white tracking-tight">Soporte</span>
            <svg class="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>

          <!-- 5. Canal de Telegram -->
          <a href="https://t.me/TuCanal" target="_blank" class="flex items-center gap-4 p-3 liquid-glass-card bg-white/[0.03] border-white/5 hover:bg-white/[0.06] active:scale-[0.98] transition-all w-full text-left no-underline rounded-2xl">
            <div class="w-10 h-10 rounded-[14px] flex items-center justify-center bg-sky-900/40 text-sky-400 shadow-inner">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </div>
            <span class="flex-1 text-[15px] font-bold text-white tracking-tight">Canal de Telegram</span>
            <svg class="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </main>
      </div>
    </app-glass-modal>
  `,
  styles: [`:host { display: contents; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  isOpen = input.required<boolean>();
  vibrationEnabled = input.required<boolean>();
  language = input<string>('');

  close = output<void>();
  vibrationChange = output<boolean>();
  languageChange = output<string>();

  private onboarding = inject(OnboardingService);

  onClose() { this.close.emit(); }
  onVibrationToggle() { this.vibrationChange.emit(!this.vibrationEnabled()); }
  onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.languageChange.emit(select.value);
  }

  openTutorial(): void {
    this.onClose();
    this.onboarding.resetOnboarding();
    this.onboarding.startOnboarding();
  }
}
