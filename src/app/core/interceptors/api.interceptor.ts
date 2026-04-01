import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Only attach token to API requests
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  // Read token directly from localStorage to avoid circular dependency with AuthService
  const token = localStorage.getItem('auth_token');

  if (!token) {
    return next(req);
  }

  // Backend expects 'token' header, not standard Authorization
  const authReq = req.clone({
    setHeaders: {
      token: token,
    },
  });

  return next(authReq);
};