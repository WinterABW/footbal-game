import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { NavigationEnd, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, filter } from 'rxjs';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage],
  template: `
    <!--
      Liquid Glass bottom navigation pill with a sliding active indicator.
    -->
    <nav [hidden]="isHidden()" class="mx-4 mb-1 flex flex-row items-center p-1 lg-pill !rounded-[25px] bg-white/[0.03] backdrop-blur-3xl border border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden"
      aria-label="Navegación principal">
      <!-- Glossy Glare Layer -->
      <div class="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent opacity-40"></div>

      <div class="absolute inset-1.5 z-0 pointer-events-none">
        <div class="h-full w-[20%] bg-white/10 backdrop-blur-md rounded-[20px] border border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all duration-800 cubic-bezier(0.2, 1, 0.3, 1)"
          [style.transform]="'translateX(' + (activeIndex() * 100) + '%)'">
          <div class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 rounded-[20px]"></div>
        </div>
      </div>

      @for (nav of navItems; track nav.id) {
        <button [routerLink]="nav.route" routerLinkActive="active" [routerLinkActiveOptions]="{exact: nav.id === 'Social'}"
          class="nav-btn group relative z-10" [attr.aria-label]="nav.id">
          <div class="nav-content">
            <img [ngSrc]="nav.icon" alt="" width="20" height="20" class="nav-icon group-[.active]:opacity-100 opacity-30 group-hover:opacity-60 transition-all duration-500">
            <span class="nav-label group-[.active]:text-white group-[.active]:font-black text-white/30 text-[8px] font-bold uppercase tracking-[0.15em] transition-all duration-500">{{ nav.id }}</span>
          </div>
        </button>
      }
    </nav>
  `,
  styles: [`
    :host { display: block; }
    .nav-btn {
      flex: 1;
      background: none;
      border: none;
      padding: 2px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .nav-btn:active { transform: scale(0.94); }
    .nav-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px 4px;
      border-radius: 20px;
      transition: all 0.4s cubic-bezier(0.2, 1, 0.3, 1);
    }
    .nav-btn.active .nav-icon {
       filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
       transform: scale(1.1);
    }
    .text-glow { text-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  private router = inject(Router);

  navItems = [
    { id: 'Social', route: '/social', icon: 'navegation-icons/friends.webp' },
    { id: 'Retos', route: '/mociones', icon: 'navegation-icons/mociones.webp' },
    { id: 'Jugar', route: '/main', icon: 'navegation-icons/home.webp' },
    { id: 'Fichajes', route: '/mining', icon: 'navegation-icons/inversion.webp' },
    { id: 'Banco', route: '/wallet', icon: 'navegation-icons/cartera.webp' }
  ];

  private currentUrl = toSignal(this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map((event: any) => event.urlAfterRedirects || event.url)
  ), { initialValue: this.router.url });

  activeIndex = computed(() => {
    const url = this.currentUrl();
    const index = this.navItems.findIndex(item => url.startsWith(item.route));
    return index >= 0 ? index : 0;
  });

  isHidden = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/transaccion') || url.startsWith('/main/box');
  });
}
