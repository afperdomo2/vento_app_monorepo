import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';

/**
 * Paths that should not receive a Bearer token (static assets, public API routes).
 */
const PUBLIC_PATHS = ['/assets/', '/public/'];

/**
 * Paths that belong to Keycloak itself and must never carry a Bearer token
 * (avoids circular calls during refresh).
 */
const EXCLUDED_PATHS = ['/realms/', '/protocol/openid-connect/'];

/**
 * Attach a Bearer token to every outgoing request, refreshing proactively when
 * the stored access token is expired before the request is even sent.
 *
 * Flow:
 *  1. Skip excluded / public paths.
 *  2. If the token is expired (or missing) but a refresh token exists →
 *     refresh first, then send the request with the new token (proactive).
 *  3. If the token is still valid → send immediately with the current token.
 *  4. On a 401 response → attempt a reactive refresh and retry once.
 *  5. If any refresh fails → logout + redirect to /login.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  const isExcluded = EXCLUDED_PATHS.some((path) => req.url.includes(path));
  const isPublic = PUBLIC_PATHS.some((path) => req.url.startsWith(path));

  if (isExcluded || isPublic) {
    return next(req);
  }

  // --- Proactive refresh ---
  // If the access token is already expired (within the 60 s buffer) but we
  // still have a refresh token, refresh before sending the request. This
  // prevents the unnecessary 401 round trip.
  const hasRefreshToken = !!localStorage.getItem('refresh_token');
  if (authService.isTokenExpired() && hasRefreshToken) {
    return authService.refreshSession().pipe(
      switchMap(() => next(addBearer(req, authService.getToken()))),
      catchError((refreshError) => {
        handleRefreshFailure(authService, inject(Router));
        return throwError(() => refreshError);
      }),
    );
  }

  // --- Happy path ---
  const token = authService.getToken();
  if (!token) {
    return next(req);
  }

  return next(addBearer(req, token)).pipe(
    catchError((error: HttpErrorResponse) => {
      // --- Reactive refresh on 401 ---
      // Handles the edge case where the token expired in-flight (clock skew,
      // server-side revocation, etc.) after the proactive check passed.
      if (error.status === 401) {
        return authService.refreshSession().pipe(
          switchMap(() => next(addBearer(req, authService.getToken()))),
          catchError((refreshError) => {
            handleRefreshFailure(authService, inject(Router));
            return throwError(() => error);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addBearer(
  req: HttpRequest<unknown>,
  token: string | null,
): HttpRequest<unknown> {
  if (!token) {
    return req;
  }
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function handleRefreshFailure(authService: AuthService, router: Router): void {
  authService.logout();
  router.navigate(['/login']);
}
