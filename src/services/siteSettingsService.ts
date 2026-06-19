import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface SiteSettings {
  logoUrl: string | null;
}

/**
 * Fetches public site branding settings (currently just the logo URL).
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const response = await api.get<ApiResponse<SiteSettings>>("/api/v1/settings/site");
  return response.data.data;
}

/**
 * Uploads/replaces the site logo. Admin only.
 */
export async function adminUpdateLogo(image: File): Promise<SiteSettings> {
  const formData = new FormData();
  formData.append("image", image);
  const response = await api.put<ApiResponse<SiteSettings>>("/api/v1/admin/settings/site/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

/**
 * Removes the site logo, reverting to the text wordmark. Admin only.
 */
export async function adminRemoveLogo(): Promise<SiteSettings> {
  const response = await api.delete<ApiResponse<SiteSettings>>("/api/v1/admin/settings/site/logo");
  return response.data.data;
}
