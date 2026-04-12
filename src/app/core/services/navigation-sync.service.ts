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

  // Routes that require pendingTaps sync
  private readonly SYNC_ROUTES = ['/main', '/social', '/mociones', '/wallet', '/mining'];

  // Track last sync to prevent duplicate syncs
  private lastSyncTime = 0;
  private readonly SYNC_COOLDOWN = 5000; // 5 seconds cooldown

  constructor() {
    console.log('[DEBUG] NavigationSyncService: Constructor called. Initializing listener...');
    this.initNavigationListener();
  }

  private initNavigationListener(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        console.log(`[DEBUG] NavigationSyncService: NavigationEnd event detected for URL: ${event.urlAfterRedirects}`);
        if (this.shouldSyncOnRoute(event.urlAfterRedirects)) {
          this.syncPendingTaps();
        }
      });
  }

  private shouldSyncOnRoute(url: string): boolean {
    // Check if the URL starts with any of the sync routes
    const shouldSync = this.SYNC_ROUTES.some((route) => url.startsWith(route));
    console.log(`[DEBUG] NavigationSyncService: Checking if URL "${url}" should sync. Result: ${shouldSync}`);
    return shouldSync;
  }

  private async syncPendingTaps(): Promise<void> {
    console.log('[DEBUG] NavigationSyncService: syncPendingTaps called.');

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('[DEBUG] NavigationSyncService: User not authenticated, skipping sync.');
      return;
    }

    // Prevent rapid successive syncs
    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_COOLDOWN) {
      console.log(`[DEBUG] NavigationSyncService: Skipping sync due to cooldown. Last sync was ${now - this.lastSyncTime}ms ago.`);
      return;
    }

    this.lastSyncTime = now;

    // Get pending taps directly from TapService signal (not localStorage)
    const pendingCount = this.tapService.pendingTapsCount();
    console.log(`[DEBUG] NavigationSyncService: Pending taps count: ${pendingCount}`);

    // Only sync if there are pending taps
    if (pendingCount > 0) {
      console.log(`[DEBUG] NavigationSyncService: Syncing ${pendingCount} pending taps on route change...`);
      
      // Flush pending taps to backend
      await this.tapService.flushPendingTaps();
      
      console.log('[DEBUG] NavigationSyncService: Pending taps sent, sync complete.');
    } else {
      console.log('[DEBUG] NavigationSyncService: No pending taps to sync, skipping.');
    }
  }
}
