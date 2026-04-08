import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import { UserProfile } from '../models/profile.model';
import { getEnvValue } from '../../../../environments/env.config';

const KEYCLOAK_URL = getEnvValue('KEYCLOAK_URL');
const KEYCLOAK_REALM = getEnvValue('KEYCLOAK_REALM');

interface DecodedToken {
  sub: string;
  preferred_username: string;
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  realm_access?: { roles: string[] };
  email_verified?: boolean;
}

/**
 * Profile Service
 *
 * Provides user profile information extracted from JWT token.
 *
 * **Why no HTTP calls?**
 * This service intentionally reads the JWT token from localStorage and extracts
 * profile claims directly instead of making HTTP requests to Keycloak. This is the
 * recommended pattern for Keycloak integration because:
 *
 * 1. The access token is already stored by the auth service after login
 * 2. All profile information is embedded in the JWT claims (sub, email, preferred_username, etc.)
 * 3. No additional network round-trip is needed
 * 4. The token is refreshed automatically by the auth interceptor when needed
 *
 * For account management (change password, update email, etc.), users are redirected
 * to Keycloak's Account Console via `getAccountConsoleUrl()`.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfileService {

  private readonly accountConsoleUrl: string;

  constructor() {
    this.accountConsoleUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/account/`;
  }

  /**
   * Get user profile from JWT token
   * Extracts profile information from the access token stored in localStorage
   */
  getUserProfile(): Observable<UserProfile> {
    return new Observable<UserProfile>(observer => {
      try {
        const token = localStorage.getItem('access_token');

        if (!token) {
          observer.error(new Error('No token available'));
          return;
        }

        const profile = this.extractProfileFromToken(token);
        observer.next(profile);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  /**
   * Get Keycloak Account Console URL for account management
   * Users will be redirected here to manage password, profile, email, and security settings
   */
  getAccountConsoleUrl(): string {
    return this.accountConsoleUrl;
  }

  /**
   * Extract profile information from JWT token
   */
  private extractProfileFromToken(token: string): UserProfile {
    const tokenInfo = this.decodeToken(token);

    return {
      id: tokenInfo.sub,
      email: tokenInfo.email,
      username: tokenInfo.preferred_username,
      firstName: tokenInfo.given_name,
      lastName: tokenInfo.family_name,
      fullName: tokenInfo.name,
      roles: tokenInfo.realm_access?.roles || [],
      avatarUrl: this.generateAvatarUrl(tokenInfo.email),
      emailVerified: tokenInfo.email_verified ?? false,
    };
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): DecodedToken {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as DecodedToken;
    } catch {
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate avatar URL from email
   */
  private generateAvatarUrl(email: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=4a40e0&color=fff&size=128`;
  }
}
