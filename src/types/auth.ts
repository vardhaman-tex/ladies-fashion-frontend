/**
 * Represents the currently authenticated user's profile.
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string | null;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  profileImageUrl?: string | null;
  roles: string[];
}

/**
 * Response payload returned after a successful authentication
 * (registration, login, or token refresh).
 */
export interface AuthResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

/**
 * Request payload for authenticating an existing user.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Request payload for registering a new user account.
 */
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  password: string;
}
