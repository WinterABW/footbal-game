import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { LocalApiService } from './core/services/local-api.service';

function initializeLocalApi(): () => void {
  const localApi = inject(LocalApiService);
  return () => {
    localApi.initialize();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withViewTransitions({ skipInitialTransition: true })),
    provideClientHydration(withEventReplay()),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeLocalApi,
      multi: true,
    },
  ]
};
