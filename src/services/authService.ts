import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@/types/auth";

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
 */
export async function getMe(): Promise<User> {
  const response = await api.get<ApiResponse<User>>("/api/v1/users/me");
  return response.data.data;
}
