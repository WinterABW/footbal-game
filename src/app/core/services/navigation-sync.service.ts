import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { TapService } from './tap.service';

@Injectable({
  providedIn: 'root',
})
export class NavigationSyncService {
  private router = inject(Router);
  private authService = inject(AuthService);
  private tapService = inject(TapService);

  // 5 rutas principales que requieren sync de pendingTaps
  private readonly SYNC_ROUTES = ['/main', '/social', '/mociones', '/wallet', '/mining'];

  // Track if a flush is already in progress to prevent concurrent flushes
  private isFlushing = false;

  constructor() {
    console.log('[NavigationSync] Initializing navigation listener for 5 main routes...');
    this.initNavigationListener();
  }

  private initNavigationListener(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        console.log(`[NavigationSync] NavigationEnd: ${event.urlAfterRedirects}`);
        if (this.shouldSyncOnRoute(event.urlAfterRedirects)) {
          this.syncPendingTaps();
        }
      });
  }

  private shouldSyncOnRoute(url: string): boolean {
    const shouldSync = this.SYNC_ROUTES.some((route) => url.startsWith(route));
    if (shouldSync) {
      console.log(`[NavigationSync] Route "${url}" requires sync`);
    }
    return shouldSync;
  }

  private async syncPendingTaps(): Promise<void> {
    // Prevent concurrent flushes
    if (this.isFlushing) {
      console.log('[NavigationSync] Flush already in progress, skipping...');
      return;
    }

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('[NavigationSync] User not authenticated, skipping sync.');
      return;
    }

    // Get pending taps from TapService signal
    const pendingCount = this.tapService.pendingTapsCount();
    console.log(`[NavigationSync] Pending taps: ${pendingCount}`);

    // Only sync if there are pending taps
    if (pendingCount === 0) {
      console.log('[NavigationSync] No pending taps to sync.');
      return;
    }

    // Set flush lock
    this.isFlushing = true;

    try {
      console.log(`[NavigationSync] Flushing ${pendingCount} pending taps on route change...`);
      
      // Force flush for immediate sync
      await this.tapService.forceFlush();
      
      console.log('[NavigationSync] Flush complete.');
    } catch (error) {
      console.error('[NavigationSync] Flush failed:', error);
} finally {
    // Release flush lock
    this.isFlushing = false;
  }
}
}
