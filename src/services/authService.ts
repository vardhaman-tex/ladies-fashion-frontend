import { api, type AuthRequestOptions } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  AuthResponse,
  CompleteSignupRequest,
  LoginRequest,
  OtpRequestedResponse,
  OtpVerifiedResponse,
  RegisterRequest,
  User,
  VerifyOtpRequest,
} from "@/types/auth";

/**
 * Registers a new user account.
 */
export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>("/api/v1/auth/register", payload);
  return response.data.data;
}

/**
 * Authenticates a user with email and password.
 */
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>("/api/v1/auth/login", payload);
  return response.data.data;
}

/**
 * Asks for a one-time code. Says nothing about whether the number is
 * registered — that only comes back from verifyOtp, and only to someone who
 * entered the right code.
 */
export async function requestOtp(mobile: string): Promise<OtpRequestedResponse> {
  const response = await api.post<ApiResponse<OtpRequestedResponse>>(
    "/api/v1/auth/otp/request",
    { mobile }
  );
  return response.data.data;
}

/**
 * Proves the code. A known number is signed in here — the session cookies come
 * back on this response — while an unknown one gets a token to sign up with.
 */
export async function verifyOtp(payload: VerifyOtpRequest): Promise<OtpVerifiedResponse> {
  const response = await api.post<ApiResponse<OtpVerifiedResponse>>(
    "/api/v1/auth/otp/verify",
    payload
  );
  return response.data.data;
}

/**
 * Finishes a signup whose number has already been verified.
 */
export async function completeSignup(payload: CompleteSignupRequest): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>(
    "/api/v1/auth/otp/complete-signup",
    payload
  );
  return response.data.data;
}

/**
 * Logs out the current user and revokes their refresh token.
 */
export async function logout(): Promise<void> {
  await api.post<ApiResponse<null>>("/api/v1/auth/logout");
}

/**
 * Rotates the access and refresh tokens using the current refresh token.
 */
export async function refreshToken(): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>("/api/v1/auth/refresh");
  return response.data.data;
}

/**
 * Retrieves the current authenticated user's profile.
 *
 * `silent` suppresses the redirect-to-login that normally follows a failed
 * token refresh. The app-wide session probe on first paint passes it, because
 * a visitor who simply isn't signed in must be allowed to browse the shop
 * rather than being bounced to /login — while a signed-in user whose access
 * token merely lapsed is still refreshed transparently on the way through.
 */
export async function getMe(silent = false): Promise<User> {
  const options: AuthRequestOptions = silent ? { skipAuthRedirect: true } : {};
  const response = await api.get<ApiResponse<User>>("/api/v1/users/me", options);
  return response.data.data;
}
