import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

import { UserProfile } from '../models/profile.model';
import { getEnvValue } from '../../../../environments/env.config';

const KEYCLOAK_URL = getEnvValue('KEYCLOAK_URL');
const KEYCLOAK_REALM = getEnvValue('KEYCLOAK_REALM');

/**
 * Profile Service
 *
 * Provides user profile information extracted from JWT token.
 * Does NOT make HTTP requests to Keycloak - uses token claims directly.
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
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
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
