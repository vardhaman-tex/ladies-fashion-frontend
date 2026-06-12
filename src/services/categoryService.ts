import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Category } from "@/types/category";

/**
 * Retrieves all active categories along with their sub-categories.
 */
export async function getCategories(): Promise<Category[]> {
  const response = await api.get<ApiResponse<Category[]>>("/api/v1/categories");
  return response.data.data;
}

/**
 * Retrieves a single category by its slug.
 */
export async function getCategory(slug: string): Promise<Category> {
  const response = await api.get<ApiResponse<Category>>(`/api/v1/categories/${slug}`);
  return response.data.data;
}
