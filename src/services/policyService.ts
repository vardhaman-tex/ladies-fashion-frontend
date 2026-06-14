import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface Policy {
  id: string;
  slug: string;
  title: string;
  content: string;
  visible: boolean;
  updatedAt: string;
}

export interface PolicyRequest {
  slug: string;
  title: string;
  content: string;
  visible: boolean;
}

export async function getVisiblePolicies(): Promise<Policy[]> {
  const res = await api.get<ApiResponse<Policy[]>>("/api/v1/policies");
  return res.data.data;
}

export async function getPolicyBySlug(slug: string): Promise<Policy> {
  const res = await api.get<ApiResponse<Policy>>(`/api/v1/policies/${slug}`);
  return res.data.data;
}

// Admin
export async function adminGetAllPolicies(): Promise<Policy[]> {
  const res = await api.get<ApiResponse<Policy[]>>("/api/v1/admin/policies");
  return res.data.data;
}

export async function adminGetPolicy(id: string): Promise<Policy> {
  const res = await api.get<ApiResponse<Policy>>(`/api/v1/admin/policies/${id}`);
  return res.data.data;
}

export async function adminCreatePolicy(data: PolicyRequest): Promise<Policy> {
  const res = await api.post<ApiResponse<Policy>>("/api/v1/admin/policies", data);
  return res.data.data;
}

export async function adminUpdatePolicy(id: string, data: PolicyRequest): Promise<Policy> {
  const res = await api.put<ApiResponse<Policy>>(`/api/v1/admin/policies/${id}`, data);
  return res.data.data;
}

export async function adminDeletePolicy(id: string): Promise<void> {
  await api.delete(`/api/v1/admin/policies/${id}`);
}
