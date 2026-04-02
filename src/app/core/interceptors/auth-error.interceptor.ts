import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 && req.url.startsWith(environment.apiBaseUrl)) {
        // Clear auth state
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');

        // Redirect to welcome/login
        router.navigate(['/welcome']);
      }

      return throwError(() => error);
    })
  );
};
