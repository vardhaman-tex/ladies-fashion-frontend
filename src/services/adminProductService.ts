import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { ProductDetail, ProductStatus } from "@/types/product";

export interface AdminProductRequest {
  name: string;
  sku: string;
  description?: string;
  fabricDetails?: string;
  careInstructions?: string;
  price: number;
  discountAmount?: number;
  categoryId: string;
  subCategoryId?: string;
  color?: string;
  fabric?: string;
  occasion?: string;
  sizes?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  status?: ProductStatus;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

/**
 * Creates a new product, optionally uploading images alongside it.
 */
export async function createProduct(data: AdminProductRequest, images: File[]): Promise<ProductDetail> {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  images.forEach((image) => formData.append("images", image));

  const response = await api.post<ApiResponse<ProductDetail>>("/api/v1/admin/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

/**
 * Deletes a product by its id.
 */
export async function deleteProduct(id: string): Promise<void> {
  await api.delete<ApiResponse<void>>(`/api/v1/admin/products/${id}`);
}

/**
 * Deletes a single image from a product.
 */
export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  await api.delete<ApiResponse<void>>(`/api/v1/admin/products/${productId}/images/${imageId}`);
}
