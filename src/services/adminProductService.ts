import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { ProductDetail, ProductStatus } from "@/types/product";

/**
 * Creates/updates the product "design" only. Colors are managed separately via
 * variant endpoints once the product itself exists.
 */
export interface ProductRequest {
  name: string;
  sku: string;
  description?: string;
  fabricDetails?: string;
  careInstructions?: string;
  price: number;
  discountAmount?: number;
  categoryId: string;
  subCategoryId?: string;
  fabric?: string;
  occasion?: string;
  status?: ProductStatus;
  isFeatured: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

/** One size + quantity (+ optional low-stock threshold) pair for a variant's stock. */
export interface SizeInventoryEntry {
  size: string;
  skuCode?: string;
  availableQty: number;
  lowStockThreshold?: number;
}

/** Creates/updates one color of a product, including its per-size stock. */
export interface ProductVariantRequest {
  color: string;
  colorHex?: string;
  sortOrder?: number;
  isActive?: boolean;
  sizes: SizeInventoryEntry[];
}

function toJsonPart(data: unknown): Blob {
  return new Blob([JSON.stringify(data)], { type: "application/json" });
}

/**
 * Creates a new product's design fields. No images or colors yet — add those
 * afterward with createVariant.
 */
export async function createProduct(data: ProductRequest): Promise<ProductDetail> {
  const formData = new FormData();
  formData.append("data", toJsonPart(data));
  const response = await api.post<ApiResponse<ProductDetail>>("/api/v1/admin/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

/**
 * Updates an existing product's design fields.
 */
export async function updateProduct(id: string, data: ProductRequest): Promise<ProductDetail> {
  const formData = new FormData();
  formData.append("data", toJsonPart(data));
  const response = await api.put<ApiResponse<ProductDetail>>(`/api/v1/admin/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

/**
 * Fetches a single product by slug for admin use (returns regardless of status).
 */
export async function getAdminProductBySlug(slug: string): Promise<ProductDetail> {
  const response = await api.get<ApiResponse<ProductDetail>>(`/api/v1/admin/products/by-slug/${slug}`);
  return response.data.data;
}

/**
 * Deletes a product by its id (and all of its colors, images, and stock).
 */
export async function deleteProduct(id: string): Promise<void> {
  await api.delete<ApiResponse<void>>(`/api/v1/admin/products/${id}`);
}

/**
 * Adds a color variant to a product, with its images and per-size stock.
 */
export async function createVariant(
  productId: string,
  data: ProductVariantRequest,
  images: File[] = []
): Promise<ProductDetail> {
  const formData = new FormData();
  formData.append("data", toJsonPart(data));
  images.forEach((image) => formData.append("images", image));
  const response = await api.post<ApiResponse<ProductDetail>>(
    `/api/v1/admin/products/${productId}/variants`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data.data;
}

/**
 * Updates a color variant's details and per-size stock. New images, if any,
 * are appended to the variant's existing images.
 */
export async function updateVariant(
  productId: string,
  variantId: string,
  data: ProductVariantRequest,
  images: File[] = []
): Promise<ProductDetail> {
  const formData = new FormData();
  formData.append("data", toJsonPart(data));
  images.forEach((image) => formData.append("images", image));
  const response = await api.put<ApiResponse<ProductDetail>>(
    `/api/v1/admin/products/${productId}/variants/${variantId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data.data;
}

/**
 * Deletes a color variant (and its images and stock).
 */
export async function deleteVariant(productId: string, variantId: string): Promise<ProductDetail> {
  const response = await api.delete<ApiResponse<ProductDetail>>(
    `/api/v1/admin/products/${productId}/variants/${variantId}`
  );
  return response.data.data;
}

/**
 * Adds images to a color variant.
 */
export async function addVariantImages(
  productId: string,
  variantId: string,
  images: File[]
): Promise<ProductDetail> {
  const formData = new FormData();
  images.forEach((image) => formData.append("images", image));
  const response = await api.post<ApiResponse<ProductDetail>>(
    `/api/v1/admin/products/${productId}/variants/${variantId}/images`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data.data;
}

/**
 * Deletes a single image from a color variant.
 */
export async function deleteVariantImage(
  productId: string,
  variantId: string,
  imageId: string
): Promise<ProductDetail> {
  const response = await api.delete<ApiResponse<ProductDetail>>(
    `/api/v1/admin/products/${productId}/variants/${variantId}/images/${imageId}`
  );
  return response.data.data;
}

/**
 * Replaces a color variant's per-size stock rows.
 */
export async function updateVariantSkus(
  productId: string,
  variantId: string,
  entries: SizeInventoryEntry[]
): Promise<ProductDetail> {
  const response = await api.put<ApiResponse<ProductDetail>>(
    `/api/v1/admin/products/${productId}/variants/${variantId}/skus`,
    entries
  );
  return response.data.data;
}
