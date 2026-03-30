import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { getAndClearReturnUrl } from './auth.guard';

/**
 * Default URL to redirect after successful login
 * Can be overridden by returnUrl query param
 */
const DEFAULT_REDIRECT_URL = '/home';

/**
 * Public Guard - Functional Guard
 * 
 * Protects public routes (like login) from authenticated users.
 * If user is already authenticated:
 * 1. Checks for stored return URL
 * 2. Redirects to return URL or home page
 * 
 * Usage:
 * ```typescript
 * {
 *   path: 'login',
 *   component: LoginPage,
 *   canActivate: [publicGuard]
 * }
 * ```
 */
export const publicGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is already authenticated
  if (authService.isAuthenticated()) {
    // Get stored return URL or use default
    const returnUrl = getAndClearReturnUrl() || DEFAULT_REDIRECT_URL;
    
    // Redirect to return URL
    return router.createUrlTree([returnUrl]);
  }

  // User is not authenticated, allow access to public route
  return true;
};
