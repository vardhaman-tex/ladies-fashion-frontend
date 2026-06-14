import { api } from "@/lib/api";
import type { ApiResponse, PageResponse } from "@/types/api";
import type { AdminStats, AdminOrderSummary, AdminUser } from "@/types/admin";
import type { OrderData } from "@/types/order";
import type { OrderStatus } from "@/types/order";
import type { ProductSummary } from "@/types/product";

// Stats
export const getAdminStats = async (): Promise<AdminStats> => {
  const { data } = await api.get<ApiResponse<AdminStats>>("/api/v1/admin/stats");
  return data.data;
};

// Orders
export const getAdminOrders = async (
  params: { status?: OrderStatus; page?: number; size?: number } = {}
): Promise<PageResponse<AdminOrderSummary>> => {
  const { data } = await api.get<ApiResponse<PageResponse<AdminOrderSummary>>>(
    "/api/v1/admin/orders",
    { params: { ...params, size: params.size ?? 20 } }
  );
  return data.data;
};

export const getAdminOrder = async (id: string): Promise<OrderData> => {
  const { data } = await api.get<ApiResponse<OrderData>>(`/api/v1/admin/orders/${id}`);
  return data.data;
};

export const updateOrderStatus = async (
  id: string,
  status: OrderStatus
): Promise<AdminOrderSummary> => {
  const { data } = await api.patch<ApiResponse<AdminOrderSummary>>(
    `/api/v1/admin/orders/${id}/status`,
    { status }
  );
  return data.data;
};

export interface AdminEditOrderPayload {
  items?: { itemId: string; quantity: number }[];
  adminDiscount?: number;
  adminNotes?: string;
  addrFullName?: string;
  addrPhone?: string;
  addrLine1?: string;
  addrLine2?: string;
  addrCity?: string;
  addrState?: string;
  addrPincode?: string;
}

export const editAdminOrder = async (
  id: string,
  payload: AdminEditOrderPayload
): Promise<OrderData> => {
  const { data } = await api.put<ApiResponse<OrderData>>(
    `/api/v1/admin/orders/${id}/edit`,
    payload
  );
  return data.data;
};

// Users
export const getAdminUsers = async (
  params: { page?: number; size?: number } = {}
): Promise<PageResponse<AdminUser>> => {
  const { data } = await api.get<ApiResponse<PageResponse<AdminUser>>>(
    "/api/v1/admin/users",
    { params: { ...params, size: params.size ?? 20 } }
  );
  return data.data;
};

export const toggleUserActive = async (id: string): Promise<AdminUser> => {
  const { data } = await api.patch<ApiResponse<AdminUser>>(
    `/api/v1/admin/users/${id}/toggle-active`
  );
  return data.data;
};

// Products — uses admin endpoint that returns ALL statuses
export const getAdminProducts = async (
  params: { search?: string; page?: number; size?: number } = {}
): Promise<PageResponse<ProductSummary>> => {
  const { data } = await api.get<ApiResponse<PageResponse<ProductSummary>>>(
    "/api/v1/admin/products",
    { params: { ...params, size: params.size ?? 20 } }
  );
  return data.data;
};

export const deleteAdminProduct = async (id: string): Promise<void> => {
  await api.delete(`/api/v1/admin/products/${id}`);
};

export const updateAdminProductStatus = async (
  id: string,
  status: string
): Promise<void> => {
  await api.patch(`/api/v1/admin/products/${id}/status`, { status });
};

// Bulk upload
export interface BulkUploadResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<Record<string, string>>;
}

export const bulkUploadProducts = async (file: File): Promise<BulkUploadResult> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<ApiResponse<BulkUploadResult>>(
    "/api/v1/admin/products/bulk-upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
};

// Inventory
export const getAdminInventory = async (
  params: { lowStock?: boolean; page?: number; size?: number } = {}
): Promise<PageResponse<unknown>> => {
  const { data } = await api.get<ApiResponse<PageResponse<unknown>>>(
    "/api/v1/admin/inventory",
    { params }
  );
  return data.data;
};

export const updateInventory = async (
  productId: string,
  stockQuantity: number,
  lowStockThreshold: number
): Promise<unknown> => {
  const { data } = await api.patch<ApiResponse<unknown>>(
    `/api/v1/admin/inventory/${productId}`,
    { availableQty: stockQuantity, lowStockThreshold }
  );
  return data.data;
};

export interface SizeInventoryEntry { size: string; availableQty: number; }

export const updateSizeInventories = async (
  productId: string,
  entries: SizeInventoryEntry[]
): Promise<unknown> => {
  const { data } = await api.put<ApiResponse<unknown>>(
    `/api/v1/admin/inventory/${productId}/sizes`,
    entries
  );
  return data.data;
};
