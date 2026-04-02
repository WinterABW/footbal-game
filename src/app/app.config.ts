import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { LocalApiService } from './core/services/local-api.service';
import { NavigationSyncService } from './core/services/navigation-sync.service';
import { apiInterceptor } from './core/interceptors/api.interceptor';
import { authErrorInterceptor } from './core/interceptors/auth-error.interceptor';

function initializeLocalApi(): () => void {
  const localApi = inject(LocalApiService);
  return () => {
    localApi.initialize();
  };
}

function initializeNavigationSync(): () => void {
  const navSync = inject(NavigationSyncService);
  // El servicio ya se inicializa en su constructor
  return () => {};
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withViewTransitions({ skipInitialTransition: true })),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([apiInterceptor, authErrorInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeLocalApi,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeNavigationSync,
      multi: true,
    },
  ]
};
