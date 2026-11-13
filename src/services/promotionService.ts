import { api } from "@/lib/api";
import type { ApiResponse, PageResponse } from "@/types/api";

export type DiscountType = "FLAT" | "PERCENT";
export type UserSegment = "ALL" | "NEW_USER" | "RETURNING_USER";

export interface PromotionResponse {
  id: string;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number | null;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  priority: number;
  timesUsed: number;
  restrictedProductIds: string[];
  restrictedCategoryIds: string[];
  shareToken: string | null;
  minQuantity: number | null;
  userSegment: UserSegment;
  stackable: boolean;
  maxUsesPerUser: number | null;
  createdAt: string;
}

export interface CreatePromotionPayload {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
  priority: number;
  restrictedProductIds?: string[];
  restrictedCategoryIds?: string[];
  shareToken?: string;
  minQuantity?: number;
  userSegment: UserSegment;
  stackable: boolean;
  maxUsesPerUser?: number;
}

export const getPromotions = async (page = 0, size = 20): Promise<PageResponse<PromotionResponse>> => {
  const { data } = await api.get<ApiResponse<PageResponse<PromotionResponse>>>(
    "/api/v1/admin/promotions",
    { params: { page, size } }
  );
  return data.data;
};

export const getPromotion = async (id: string): Promise<PromotionResponse> => {
  const { data } = await api.get<ApiResponse<PromotionResponse>>(`/api/v1/admin/promotions/${id}`);
  return data.data;
};

export const createPromotion = async (payload: CreatePromotionPayload): Promise<PromotionResponse> => {
  const { data } = await api.post<ApiResponse<PromotionResponse>>("/api/v1/admin/promotions", payload);
  return data.data;
};

export const updatePromotion = async (id: string, payload: CreatePromotionPayload): Promise<PromotionResponse> => {
  const { data } = await api.put<ApiResponse<PromotionResponse>>(`/api/v1/admin/promotions/${id}`, payload);
  return data.data;
};

export const togglePromotion = async (id: string): Promise<PromotionResponse> => {
  const { data } = await api.patch<ApiResponse<PromotionResponse>>(`/api/v1/admin/promotions/${id}/toggle`);
  return data.data;
};

export const generatePromoCodes = async (id: string, count: number, prefix?: string): Promise<number> => {
  const { data } = await api.post<ApiResponse<{ created: number }>>(`/api/v1/admin/promotions/${id}/generate-codes`, { count, prefix });
  return data.data.created;
};

export const getPromotionByShareToken = async (token: string): Promise<PromotionResponse> => {
  const { data } = await api.get<ApiResponse<PromotionResponse>>(`/api/v1/promotions/by-token/${token}`);
  return data.data;
};
