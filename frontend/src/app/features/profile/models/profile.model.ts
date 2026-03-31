/**
 * User profile information
 * Extracted from JWT token claims
 */
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  roles: string[];
  avatarUrl?: string;
  emailVerified: boolean;
}

/**
 * Profile tab type for navigation
 */
export type ProfileTab = 'overview';

/**
 * Profile state for signal-based management
 */
export interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial profile state
 */
export const initialProfileState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null,
};
