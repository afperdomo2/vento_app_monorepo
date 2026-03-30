/**
 * User information extracted from JWT token
 */
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  avatarUrl?: string;
}

/**
 * Login request payload
 * Supports login with email OR username
 */
export interface LoginRequest {
  username: string; // Can be email or username
  password: string;
}

/**
 * Authentication response from Keycloak
 */
export interface AuthResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Token information decoded from JWT
 */
export interface TokenInfo {
  exp: number; // Expiration time
  iat: number; // Issued at
  sub: string; // Subject (user ID)
  email: string;
  preferred_username: string;
  given_name?: string;
  family_name?: string;
  realm_access: {
    roles: string[];
  };
}

/**
 * Authentication state for signals
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean;
}

/**
 * Initial auth state
 */
export const initialAuthState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isLoggedIn: false,
};
