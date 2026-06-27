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
 * identifier = email address OR mobile number — backend resolves which one.
 */
export interface LoginRequest {
  identifier: string;
  password: string;
}

/**
 * Request payload for registering a new user account.
 * mobile is the primary identity; email is optional.
 */
export interface RegisterRequest {
  mobile: string;
  password: string;
  firstName: string;
  lastName: string;
  email?: string;
}
