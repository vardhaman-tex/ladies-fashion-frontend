import { api } from "@/lib/api";
import type { CouponData, CreateCouponPayload } from "@/types/coupon";

const BASE = "/api/v1/admin/coupons";

export interface PagedCoupons {
  content: CouponData[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export async function listCoupons(page = 0, size = 20): Promise<PagedCoupons> {
  const { data } = await api.get<{ data: PagedCoupons }>(`${BASE}?page=${page}&size=${size}`);
  return data.data;
}

export async function getCoupon(id: string): Promise<CouponData> {
  const { data } = await api.get<{ data: CouponData }>(`${BASE}/${id}`);
  return data.data;
}

export async function createCoupon(payload: CreateCouponPayload): Promise<CouponData> {
  const { data } = await api.post<{ data: CouponData }>(BASE, payload);
  return data.data;
}

export async function updateCoupon(id: string, payload: CreateCouponPayload): Promise<CouponData> {
  const { data } = await api.put<{ data: CouponData }>(`${BASE}/${id}`, payload);
  return data.data;
}

export async function toggleCoupon(id: string): Promise<CouponData> {
  const { data } = await api.patch<{ data: CouponData }>(`${BASE}/${id}/toggle`);
  return data.data;
}
