import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../auth/auth.service';

/**
 * Key to store the return URL in sessionStorage
 */
const RETURN_URL_KEY = 'returnUrl';

/**
 * Auth Guard - Functional Guard
 * 
 * Protects routes that require authentication.
 * If user is not authenticated:
 * 1. Stores the attempted URL in sessionStorage
 * 2. Redirects to /login
 * 
 * After successful login, user is redirected back to the stored URL.
 * 
 * Usage:
 * ```typescript
 * {
 *   path: 'checkout',
 *   component: CheckoutPage,
 *   canActivate: [authGuard]
 * }
 * ```
 */
export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    return new Observable<boolean>(observer => {
      observer.next(true);
      observer.complete();
    });
  }

  // Store current URL for redirect after login
  const currentUrl = router.routerState.snapshot.url;
  if (currentUrl !== '/login') {
    sessionStorage.setItem(RETURN_URL_KEY, currentUrl);
  }

  // Redirect to login
  return new Observable<boolean | UrlTree>(observer => {
    observer.next(router.createUrlTree(['/login']));
    observer.complete();
  });
};

/**
 * Get the stored return URL and clear it from sessionStorage
 * Returns the URL or null if not set
 */
export function getAndClearReturnUrl(): string | null {
  const returnUrl = sessionStorage.getItem(RETURN_URL_KEY);
  sessionStorage.removeItem(RETURN_URL_KEY);
  return returnUrl;
}

/**
 * Get the stored return URL without clearing it
 */
export function getReturnUrl(): string | null {
  return sessionStorage.getItem(RETURN_URL_KEY);
}

/**
 * Clear the stored return URL
 */
export function clearReturnUrl(): void {
  sessionStorage.removeItem(RETURN_URL_KEY);
}
