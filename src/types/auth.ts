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
 * What came back from asking for a code.
 *
 * Deliberately silent about whether the number has an account — that is only
 * revealed once the code is verified, so learning it costs holding the phone.
 * `channel` is NONE when nothing was configured to deliver the code, which the
 * UI has to say rather than claiming a message is on its way.
 */
export interface OtpRequestedResponse {
  challengeId: string;
  maskedMobile: string;
  channel: "WHATSAPP" | "SMS" | "NONE";
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

/**
 * Two outcomes in one shape. A known number arrives with `user` populated and
 * the session cookies already set; an unknown one arrives with
 * `requiresProfile` and a short-lived token to finish signing up with.
 */
export interface OtpVerifiedResponse {
  requiresProfile: boolean;
  registrationToken: string | null;
  user: AuthResponse | null;
}

export interface VerifyOtpRequest {
  challengeId: string;
  code: string;
}

/** No password: the code was the credential. */
export interface CompleteSignupRequest {
  registrationToken: string;
  firstName: string;
  lastName?: string;
  email?: string;
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
