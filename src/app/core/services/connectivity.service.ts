import { Injectable, signal, computed, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Tracks online/offline connectivity status using browser APIs.
 * Provides signals for reactive UI updates.
 *
 * Usage:
 *   const connectivity = inject(ConnectivityService);
 *   if (connectivity.isOffline()) { ... }
 */
@Injectable({
  providedIn: 'root',
})
export class ConnectivityService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  private _isOnline = signal(true);
  private _wasOffline = signal(false);

  /** Current online status. */
  readonly isOnline = this._isOnline.asReadonly();
  /** Current offline status (computed inverse of isOnline). */
  readonly isOffline = computed(() => !this._isOnline());

  /** True if the user was offline and just came back online. */
  readonly justReconnected = this._wasOffline.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize from browser state
      this._isOnline.set(navigator.onLine);

      // Listen for online/offline events
      this.ngZone.runOutsideAngular(() => {
        window.addEventListener('online', () => {
          this.ngZone.run(() => {
            const wasOffline = !this._isOnline();
            this._isOnline.set(true);
            this._wasOffline.set(wasOffline);

            // Reset wasOffline after a short delay
            if (wasOffline) {
              setTimeout(() => this._wasOffline.set(false), 5000);
            }
          });
        });

        window.addEventListener('offline', () => {
          this.ngZone.run(() => {
            this._isOnline.set(false);
            this._wasOffline.set(false);
          });
        });
      });
    }
  }

  /**
   * Checks if we're currently offline.
   * SSR-safe: returns false on server.
   */
  get offline(): boolean {
    return !this._isOnline();
  }
}
