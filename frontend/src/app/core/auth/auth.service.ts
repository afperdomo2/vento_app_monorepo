import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, finalize, shareReplay } from 'rxjs/operators';

import { getEnvValue } from '../../../environments/env.config';

import {
  User,
  LoginRequest,
  AuthResponse,
  TokenInfo,
} from './auth.model';

/**
 * Environment configuration
 * Uses environment variables from window.__env (injected via index.html)
 */
const API_URL = getEnvValue('API_URL');
const KEYCLOAK_URL = getEnvValue('KEYCLOAK_URL');
const KEYCLOAK_REALM = getEnvValue('KEYCLOAK_REALM');
const KEYCLOAK_CLIENT_ID = getEnvValue('KEYCLOAK_CLIENT_ID');

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private readonly keycloakTokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  private readonly keycloakUserInfoUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;

  private readonly tokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';

  // Subject to emit auth state changes
  private authChanged$ = new BehaviorSubject<boolean>(this.isAuthenticated());

  /**
   * Observable that emits when auth state changes
   */
  authChanged = this.authChanged$.asObservable();

  // Refresh token in-flight tracking (prevents concurrent refresh requests)
  private refreshInProgress$: Observable<User> | null = null;

  /**
   * Login with email/username and password
   * Uses Keycloak Direct Access Grant (Resource Owner Password Credentials)
   */
  login(username: string, password: string): Observable<User> {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', KEYCLOAK_CLIENT_ID);
    body.set('username', username);
    body.set('password', password);

    return this.http.post<AuthResponse>(this.keycloakTokenUrl, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).pipe(
      tap((response) => {
        this.storeTokens(response);
      }),
      map(() => this.extractUserFromToken()),
      tap(() => {
        this.authChanged$.next(true);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Logout user and clear tokens
   */
  logout(): void {
    this.clearTokens();
    this.authChanged$.next(false);
    this.refreshInProgress$ = null;
  }

  /**
   * Refresh access token using the stored refresh token.
   *
   * Public entry point that deduplicates concurrent refresh attempts —
   * multiple callers (interceptor, guards, etc.) will share the same
   * in-flight HTTP request.
   */
  refreshSession(): Observable<User> {
    // If a refresh is already in progress, return that observable instead
    // of creating a new request.
    if (this.refreshInProgress$) {
      return this.refreshInProgress$;
    }

    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', KEYCLOAK_CLIENT_ID);
    body.set('refresh_token', refreshToken);

    this.refreshInProgress$ = this.http
      .post<AuthResponse>(this.keycloakTokenUrl, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        tap((response) => {
          this.storeTokens(response);
        }),
        map(() => this.extractUserFromToken()),
        tap(() => {
          this.authChanged$.next(true);
        }),
        catchError((error) => {
          // Refresh failed — clear all tokens and force re-login.
          // Must be BEFORE shareReplay so the error is handled before the
          // observable is multicasted to all subscribers.
          this.logout();
          return throwError(() => error);
        }),
        finalize(() => {
          // finalize BEFORE shareReplay ensures the in-flight tracker is
          // cleared on every terminal event (complete, error, unsubscribe),
          // even when multiple subscribers share the same observable.
          this.refreshInProgress$ = null;
        }),
        shareReplay(1),
      );

    return this.refreshInProgress$;
  }

  /**
   * Check if user is authenticated.
   *
   * Returns true if the access token is still valid (> 60s buffer),
   * OR if a refresh token exists (the interceptor will refresh it).
   *
   * This prevents the auth guard from redirecting to /login when the
   * access token expired but the user can still be silently re-authenticated.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      // No token at all — but check if we have a refresh token
      const hasRefreshToken = !!localStorage.getItem(this.refreshTokenKey);
      return hasRefreshToken;
    }

    try {
      const tokenInfo = this.decodeToken(token);
      const now = Date.now() / 1000;
      const isValid = tokenInfo.exp > now + 60;

      if (!isValid) {
        // Token is expired — but if refresh token exists, user can be
        // silently re-authenticated. Let the guard proceed; the interceptor
        // will handle the actual refresh on 401.
        const hasRefreshToken = !!localStorage.getItem(this.refreshTokenKey);
        return hasRefreshToken;
      }

      return true;
    } catch {
      // Malformed token — fall back to refresh token check
      const hasRefreshToken = !!localStorage.getItem(this.refreshTokenKey);
      return hasRefreshToken;
    }
  }

  /**
   * Check if the stored access token is expired (or missing).
   * Uses the same 60-second buffer as isAuthenticated().
   * Used by the interceptor to decide whether to proactively refresh
   * before sending a request.
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }
    try {
      const tokenInfo = this.decodeToken(token);
      const now = Date.now() / 1000;
      return tokenInfo.exp <= now + 60;
    } catch {
      return true;
    }
  }

  /**
   * Get current user information
   */
  getCurrentUser(): User | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      return this.extractUserFromToken();
    } catch {
      return null;
    }
  }

  /**
   * Get access token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get user roles
   */
  getUserRoles(): string[] {
    const user = this.getCurrentUser();
    return user?.roles || [];
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    const roles = this.getUserRoles();
    return roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const userRoles = this.getUserRoles();
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.access_token);
    localStorage.setItem(this.refreshTokenKey, response.refresh_token);
  }

  /**
   * Clear tokens from localStorage
   */
  private clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  /**
   * Decode JWT token and extract user information
   */
  private decodeToken(token: string): TokenInfo {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as TokenInfo;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Extract user information from token
   */
  private extractUserFromToken(): User {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const tokenInfo = this.decodeToken(token);

    return {
      id: tokenInfo.sub,
      email: tokenInfo.email,
      username: tokenInfo.preferred_username,
      firstName: tokenInfo.given_name,
      lastName: tokenInfo.family_name,
      roles: tokenInfo.realm_access?.roles || [],
      avatarUrl: this.generateAvatarUrl(tokenInfo.email),
    };
  }

  /**
   * Generate avatar URL from email (using Gravatar or similar)
   */
  private generateAvatarUrl(email: string): string {
    // Using a simple avatar service based on email hash
    // In production, you might want to use a real avatar service
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=4a40e0&color=fff&size=128`;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.error_description || 'Invalid credentials';
          break;
        case 401:
          errorMessage = 'Invalid username or password';
          break;
        case 403:
          errorMessage = 'Account is disabled';
          break;
        case 0:
          errorMessage = 'Unable to connect to authentication server';
          break;
        default:
          errorMessage = error.error?.error_description || `Error: ${error.status}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
