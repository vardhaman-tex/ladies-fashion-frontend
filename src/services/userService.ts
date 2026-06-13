import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/auth";

const BASE = "/api/v1/users";

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  mobile?: string;
  profileImageUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await api.patch<ApiResponse<User>>(`${BASE}/me`, payload);
  return data.data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await api.patch(`${BASE}/me/password`, payload);
}
