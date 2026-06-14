import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  enabled: boolean;
  sortOrder: number;
}

export interface SocialLinkRequest {
  platform: string;
  label: string;
  url: string;
  enabled: boolean;
  sortOrder: number;
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  const res = await api.get<ApiResponse<SocialLink[]>>("/api/v1/settings/social-links");
  return res.data.data;
}

// Admin
export async function adminGetSocialLinks(): Promise<SocialLink[]> {
  const res = await api.get<ApiResponse<SocialLink[]>>("/api/v1/admin/settings/social-links");
  return res.data.data;
}

export async function adminCreateSocialLink(data: SocialLinkRequest): Promise<SocialLink> {
  const res = await api.post<ApiResponse<SocialLink>>("/api/v1/admin/settings/social-links", data);
  return res.data.data;
}

export async function adminUpdateSocialLink(id: string, data: SocialLinkRequest): Promise<SocialLink> {
  const res = await api.put<ApiResponse<SocialLink>>(`/api/v1/admin/settings/social-links/${id}`, data);
  return res.data.data;
}

export async function adminDeleteSocialLink(id: string): Promise<void> {
  await api.delete(`/api/v1/admin/settings/social-links/${id}`);
}
