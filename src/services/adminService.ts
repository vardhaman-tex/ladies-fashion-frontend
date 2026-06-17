import { api } from "@/lib/api";
import type { ApiResponse, PageResponse } from "@/types/api";
import type { AdminStats, AdminOrderSummary, AdminUser, AdminDataImportResult, InventoryRow } from "@/types/admin";
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
  params: { search?: string; categorySlug?: string; page?: number; size?: number } = {}
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

// Inventory — one row per (color, size) SKU. Replacing the full set of sizes
// for a color lives on the product variant endpoints (see adminProductService);
// this covers browsing stock and adjusting one SKU's quantity at a time.
export const getAdminInventory = async (
  params: { lowStock?: boolean; page?: number; size?: number } = {}
): Promise<PageResponse<InventoryRow>> => {
  const { data } = await api.get<ApiResponse<PageResponse<InventoryRow>>>(
    "/api/v1/admin/inventory",
    { params }
  );
  return data.data;
};

export const getAdminInventoryByProduct = async (productId: string): Promise<InventoryRow[]> => {
  const { data } = await api.get<ApiResponse<InventoryRow[]>>(
    `/api/v1/admin/inventory/product/${productId}`
  );
  return data.data;
};

export const updateInventory = async (
  skuId: string,
  payload: { availableQty?: number; lowStockThreshold?: number }
): Promise<InventoryRow> => {
  const { data } = await api.patch<ApiResponse<InventoryRow>>(
    `/api/v1/admin/inventory/${skuId}`,
    payload
  );
  return data.data;
};

// Full data backup (categories, sub-categories, products, variants, images, SKUs)
export const exportFullBackup = async (): Promise<Blob> => {
  const response = await api.get("/api/v1/admin/export/full-backup", {
    responseType: "blob",
  });
  return response.data as Blob;
};

// Restore the workbook produced by exportFullBackup. Rows are upserted by
// natural key (slug/sku/color/size), so this is safe to run against a
// freshly-wiped database or to top up an existing one.
export const importFullBackup = async (file: File): Promise<AdminDataImportResult> => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiResponse<AdminDataImportResult>>(
    "/api/v1/admin/import/full-backup",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.data;
};

export const exportInventoryExcel = async (): Promise<Blob> => {
  const response = await api.get("/api/v1/admin/inventory/export", {
    responseType: "blob",
  });
  return response.data as Blob;
};

export const importInventoryExcel = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiResponse<string>>(
    "/api/v1/admin/inventory/import",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data.message;
};
