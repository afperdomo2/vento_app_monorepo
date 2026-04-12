import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';

/**
 * Paths that should not be prefixed with API_URL
 */
const PUBLIC_PATHS = [
  '/assets/',
  '/public/',
];

/**
 * Paths that should be excluded from token attachment
 * (e.g., Keycloak endpoints)
 */
const EXCLUDED_PATHS = [
  '/realms/',
  '/protocol/openid-connect/',
];

/**
 * Authentication Interceptor
 * 
 * - Attaches JWT token to outgoing HTTP requests
 * - Handles 401 errors by clearing auth state
 * - Skips authentication for public endpoints
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // Check if request should be excluded from token attachment
  const isExcluded = EXCLUDED_PATHS.some(path => req.url.includes(path));
  
  // Check if request is for a public path
  const isPublic = PUBLIC_PATHS.some(path => req.url.startsWith(path));

  if (isExcluded || isPublic) {
    return next(req);
  }

  // Get token from service
  const token = authService.getToken();

  // If no token, proceed with original request
  if (!token) {
    return next(req);
  }

  // Clone request and add authorization header
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Send cloned request with authorization header
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors — try to refresh the token
      if (error.status === 401) {
        const router = inject(Router);

        return authService.refreshSession().pipe(
          switchMap(() => {
            // Token refreshed successfully — retry the original request
            const newToken = authService.getToken();
            if (!newToken) {
              return throwError(() => error);
            }
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Refresh failed — logout and redirect to login
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => error);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
