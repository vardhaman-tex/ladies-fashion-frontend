import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface SiteSettings {
  logoUrl: string | null;
  /** Whether the store offers cash on delivery at all. */
  codEnabled: boolean;
  /** Collected online at checkout; the courier collects the rest. */
  codAdvanceAmount: number;
  /** Smallest order COD is offered on. Null means no floor. */
  codMinOrderValue: number | null;
  /** Largest order COD is offered on. Null means no cap. */
  codMaxOrderValue: number | null;
}

export interface UpdateCodSettingsRequest {
  enabled: boolean;
  advanceAmount: number;
  /** Null clears the floor. */
  minOrderValue: number | null;
  /** Null clears the cap. */
  maxOrderValue: number | null;
}

/**
 * Fetches public site settings — branding, plus the COD rules the storefront
 * needs to decide whether to offer the option and what advance to quote.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const response = await api.get<ApiResponse<SiteSettings>>("/api/v1/settings/site");
  return response.data.data;
}

/**
 * Sets the store's cash-on-delivery rules. Admin only.
 */
export async function adminUpdateCodSettings(
  req: UpdateCodSettingsRequest
): Promise<SiteSettings> {
  const response = await api.put<ApiResponse<SiteSettings>>(
    "/api/v1/admin/settings/site/cod",
    req
  );
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
 * Points the site logo at an already-hosted image instead of uploading one.
 * Admin only.
 */
export async function adminUpdateLogoUrl(imageUrl: string): Promise<SiteSettings> {
  const response = await api.put<ApiResponse<SiteSettings>>("/api/v1/admin/settings/site/logo/url", {
    imageUrl,
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
