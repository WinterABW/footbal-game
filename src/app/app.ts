import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, BottomNavComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private router = inject(Router);
  protected readonly title = signal('nequi-v2-a21');
  protected readonly isLoading = signal(true);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e: any) => e.urlAfterRedirects || e.url)
    ),
    { initialValue: this.router.url }
  );

  protected showBottomNav = computed(() => {
    const url = this.currentUrl();
    const publicRoutes = ['/welcome', '/login', '/transaccion'];
    return !publicRoutes.some((route) => url.startsWith(route));
  });

  constructor() {
    afterNextRender(() => {
      setTimeout(() => {
        this.isLoading.set(false);
      }, 3000); // Resetting to 3s
    });
  }
}
