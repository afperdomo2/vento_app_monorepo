import { Provider, signal, computed, inject, effect, Signal } from '@angular/core';

import { AuthService } from './auth.service';
import { User, AuthState, initialAuthState } from './auth.model';

/**
 * Signal-based authentication state service
 * Provides reactive auth state management using Angular Signals
 */
export class AuthStateService {
  private authService = inject(AuthService);

  /**
   * Private signal holding the auth state
   */
  private state = signal<AuthState>({
    ...initialAuthState,
    isLoggedIn: this.authService.isAuthenticated(),
    user: this.authService.getCurrentUser(),
    token: this.authService.getToken(),
  });

  /**
   * Public read-only signal for auth state
   */
  readonly authState = this.state.asReadonly();

  /**
   * Computed signal: true if user is logged in
   */
  readonly isLoggedIn = computed(() => this.state().isLoggedIn);

  /**
   * Computed signal: current user or null
   */
  readonly currentUser = computed<User | null>(() => this.state().user);

  /**
   * Computed signal: true if auth is loading
   */
  readonly isLoading = computed(() => this.state().isLoading);

  /**
   * Computed signal: current error message or null
   */
  readonly error = computed(() => this.state().error);

  /**
   * Computed signal: user's display name
   */
  readonly userName = computed(() => {
    const user = this.state().user;
    if (!user) return '';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.username;
  });

  /**
   * Computed signal: user's initials for avatar fallback
   */
  readonly userInitials = computed(() => {
    const user = this.state().user;
    if (!user) return '';
    const name = this.userName();
    return name
      .split(' ')
      .map(part => part[0]?.toUpperCase())
      .slice(0, 2)
      .join('');
  });

  constructor() {
    // Subscribe to auth changes from AuthService
    effect(() => {
      this.authService.authChanged.subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          this.setLoggedIn();
        } else {
          this.setLoggedOut();
        }
      });
    });
  }

  /**
   * Set loading state
   */
  setLoading(isLoading: boolean): void {
    this.state.update(state => ({
      ...state,
      isLoading,
      error: null,
    }));
  }

  /**
   * Set error state
   */
  setError(error: string | null): void {
    this.state.update(state => ({
      ...state,
      error,
      isLoading: false,
    }));
  }

  /**
   * Set user as logged in
   */
  setLoggedIn(): void {
    const user = this.authService.getCurrentUser();
    const token = this.authService.getToken();

    this.state.update(() => ({
      user,
      token,
      isLoading: false,
      error: null,
      isLoggedIn: true,
    }));
  }

  /**
   * Set user as logged out
   */
  setLoggedOut(): void {
    this.state.update(() => ({
      ...initialAuthState,
      isLoggedIn: false,
    }));
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.state.update(state => ({
      ...state,
      error: null,
    }));
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    return this.authService.hasAnyRole(roles);
  }
}

/**
 * Injection token for the auth state provider
 * Must be declared after AuthStateService class
 */
export const AUTH_STATE_PROVIDER: Provider = {
  provide: AuthStateService,
  useClass: AuthStateService,
  deps: [AuthService],
};

/**
 * Helper function to inject the auth state service
 * Can be used in components, guards, and other services
 */
export function injectAuthState(): AuthStateService {
  return inject(AuthStateService);
}

/**
 * Helper function to inject the auth service
 * Can be used when you need direct access to auth methods
 */
export function injectAuthService(): AuthService {
  return inject(AuthService);
}
