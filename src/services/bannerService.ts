import { api } from "@/lib/api";
import type { ApiResponse, PageResponse } from "@/types/api";

export type BannerPosition = "HOMEPAGE_HERO" | "COLLECTION_STRIP" | "TICKER";

export interface BannerResponse {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaLink: string | null;
  position: BannerPosition;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  priority: number;
  createdAt: string;
}

export interface CreateBannerPayload {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaLink?: string;
  position: BannerPosition;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  priority: number;
}

export const getAdminBanners = async (page = 0, size = 20): Promise<PageResponse<BannerResponse>> => {
  const { data } = await api.get<ApiResponse<PageResponse<BannerResponse>>>(
    "/api/v1/admin/banners",
    { params: { page, size } }
  );
  return data.data;
};

export const createBanner = async (payload: CreateBannerPayload): Promise<BannerResponse> => {
  const { data } = await api.post<ApiResponse<BannerResponse>>("/api/v1/admin/banners", payload);
  return data.data;
};

export const updateBanner = async (id: string, payload: CreateBannerPayload): Promise<BannerResponse> => {
  const { data } = await api.put<ApiResponse<BannerResponse>>(`/api/v1/admin/banners/${id}`, payload);
  return data.data;
};

export const toggleBanner = async (id: string): Promise<BannerResponse> => {
  const { data } = await api.patch<ApiResponse<BannerResponse>>(`/api/v1/admin/banners/${id}/toggle`);
  return data.data;
};

export const deleteBanner = async (id: string): Promise<void> => {
  await api.delete(`/api/v1/admin/banners/${id}`);
};

export const getPublicBanners = async (position: BannerPosition): Promise<BannerResponse[]> => {
  const { data } = await api.get<ApiResponse<BannerResponse[]>>("/api/v1/banners", { params: { position } });
  return data.data;
};
