import { api } from "@/lib/api";
import type { PromotionData, CreatePromotionPayload } from "@/types/promotion";

const BASE = "/api/v1/admin/promotions";

export interface PagedPromotions {
  content: PromotionData[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export async function listPromotions(page = 0, size = 20): Promise<PagedPromotions> {
  const { data } = await api.get<{ data: PagedPromotions }>(`${BASE}?page=${page}&size=${size}`);
  return data.data;
}

export async function getPromotion(id: string): Promise<PromotionData> {
  const { data } = await api.get<{ data: PromotionData }>(`${BASE}/${id}`);
  return data.data;
}

export async function createPromotion(payload: CreatePromotionPayload): Promise<PromotionData> {
  const { data } = await api.post<{ data: PromotionData }>(BASE, payload);
  return data.data;
}

export async function updatePromotion(id: string, payload: CreatePromotionPayload): Promise<PromotionData> {
  const { data } = await api.put<{ data: PromotionData }>(`${BASE}/${id}`, payload);
  return data.data;
}

export async function togglePromotion(id: string): Promise<PromotionData> {
  const { data } = await api.patch<{ data: PromotionData }>(`${BASE}/${id}/toggle`);
  return data.data;
}
