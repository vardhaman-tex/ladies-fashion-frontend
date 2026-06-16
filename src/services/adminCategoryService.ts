import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Category, SubCategory } from "@/types/category";

export interface CategoryRequest {
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

function buildFormData(data: CategoryRequest, image?: File): FormData {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  if (image) formData.append("image", image);
  return formData;
}

/**
 * Fetches all categories (including inactive) with their sub-categories, for admin use.
 */
export async function getAdminCategories(): Promise<Category[]> {
  const response = await api.get<ApiResponse<Category[]>>("/api/v1/admin/categories");
  return response.data.data;
}

/**
 * Creates a new top-level category, optionally with an image.
 */
export async function createCategory(data: CategoryRequest, image?: File): Promise<Category> {
  const response = await api.post<ApiResponse<Category>>("/api/v1/admin/categories", buildFormData(data, image), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

/**
 * Updates an existing category by its id.
 */
export async function updateCategory(id: string, data: CategoryRequest, image?: File): Promise<Category> {
  const response = await api.put<ApiResponse<Category>>(`/api/v1/admin/categories/${id}`, buildFormData(data, image), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

/**
 * Deletes a category by its id.
 */
export async function deleteCategory(id: string): Promise<void> {
  await api.delete<ApiResponse<void>>(`/api/v1/admin/categories/${id}`);
}

/**
 * Creates a new sub-category under the given category, optionally with an image.
 */
export async function createSubCategory(categoryId: string, data: CategoryRequest, image?: File): Promise<SubCategory> {
  const response = await api.post<ApiResponse<SubCategory>>(
    `/api/v1/admin/categories/${categoryId}/sub-categories`,
    buildFormData(data, image),
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data.data;
}

/**
 * Updates an existing sub-category by its id.
 */
export async function updateSubCategory(id: string, data: CategoryRequest, image?: File): Promise<SubCategory> {
  const response = await api.put<ApiResponse<SubCategory>>(`/api/v1/admin/sub-categories/${id}`, buildFormData(data, image), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

/**
 * Deletes a sub-category by its id.
 */
export async function deleteSubCategory(id: string): Promise<void> {
  await api.delete<ApiResponse<void>>(`/api/v1/admin/sub-categories/${id}`);
}
