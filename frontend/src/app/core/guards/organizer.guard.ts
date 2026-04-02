import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from '../auth/auth.service';

/**
 * Organizer Guard - Functional Guard
 *
 * Protects routes that require ADMIN role.
 * Only users with the 'ADMIN' role can access the organizer dashboard.
 *
 * If user doesn't have ADMIN role:
 * - Redirects to /home
 *
 * Usage:
 * ```typescript
 * {
 *   path: 'organizer',
 *   component: OrganizerLayoutPage,
 *   canActivate: [organizerGuard]
 * }
 * ```
 */
export const organizerGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user has ADMIN role
  if (authService.hasRole('ADMIN')) {
    return true;
  }

  // Redirect to home if not authorized
  return router.createUrlTree(['/home']);
};
