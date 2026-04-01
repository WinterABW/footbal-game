import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check signal first, fallback to localStorage for hard reload race condition
  const token = localStorage.getItem('auth_token');
  const isValidToken = token && token !== 'null' && token !== 'undefined' && token.trim() !== '';
  if (authService.isLoggedIn() || isValidToken) {
    return true;
  }

  // Redirect to welcome if not authenticated
  return router.createUrlTree(['/welcome']);
};
