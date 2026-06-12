import { api } from "@/lib/api";
import type { ApiResponse, PageResponse } from "@/types/api";
import type { ProductDetail, ProductFilter, ProductSummary } from "@/types/product";

function toParams(filter: ProductFilter = {}): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};
  if (filter.categorySlug) params.categorySlug = filter.categorySlug;
  if (filter.subCategorySlug) params.subCategorySlug = filter.subCategorySlug;
  if (filter.color) params.color = filter.color;
  if (filter.fabric) params.fabric = filter.fabric;
  if (filter.occasion) params.occasion = filter.occasion;
  if (filter.minPrice !== undefined) params.minPrice = filter.minPrice;
  if (filter.maxPrice !== undefined) params.maxPrice = filter.maxPrice;
  if (filter.inStock !== undefined) params.inStock = filter.inStock;
  if (filter.sort) params.sort = filter.sort;
  if (filter.page !== undefined) params.page = filter.page;
  if (filter.size !== undefined) params.size = filter.size;
  return params;
}

/**
 * Retrieves a paginated, filtered list of products.
 */
export async function getProducts(filter: ProductFilter = {}): Promise<PageResponse<ProductSummary>> {
  const response = await api.get<ApiResponse<PageResponse<ProductSummary>>>("/api/v1/products", {
    params: toParams(filter),
  });
  return response.data.data;
}

/**
 * Retrieves a single product's details by its slug.
 */
export async function getProduct(slug: string): Promise<ProductDetail> {
  const response = await api.get<ApiResponse<ProductDetail>>(`/api/v1/products/${slug}`);
  return response.data.data;
}

/**
 * Retrieves featured products.
 */
export async function getFeatured(filter: ProductFilter = {}): Promise<PageResponse<ProductSummary>> {
  const response = await api.get<ApiResponse<PageResponse<ProductSummary>>>("/api/v1/products/featured", {
    params: toParams(filter),
  });
  return response.data.data;
}

/**
 * Retrieves newly arrived products.
 */
export async function getNewArrivals(filter: ProductFilter = {}): Promise<PageResponse<ProductSummary>> {
  const response = await api.get<ApiResponse<PageResponse<ProductSummary>>>("/api/v1/products/new-arrivals", {
    params: toParams(filter),
  });
  return response.data.data;
}

/**
 * Retrieves best-selling products.
 */
export async function getBestSellers(filter: ProductFilter = {}): Promise<PageResponse<ProductSummary>> {
  const response = await api.get<ApiResponse<PageResponse<ProductSummary>>>("/api/v1/products/best-sellers", {
    params: toParams(filter),
  });
  return response.data.data;
}

/**
 * Retrieves trending products.
 */
export async function getTrending(filter: ProductFilter = {}): Promise<PageResponse<ProductSummary>> {
  const response = await api.get<ApiResponse<PageResponse<ProductSummary>>>("/api/v1/products/trending", {
    params: toParams(filter),
  });
  return response.data.data;
}

/**
 * Retrieves products currently on sale.
 */
export async function getSaleProducts(filter: ProductFilter = {}): Promise<PageResponse<ProductSummary>> {
  const response = await api.get<ApiResponse<PageResponse<ProductSummary>>>("/api/v1/products/sale", {
    params: toParams(filter),
  });
  return response.data.data;
}

/**
 * Retrieves quick search suggestions for the given query.
 */
export async function getSearchSuggestions(q: string): Promise<ProductSummary[]> {
  const response = await api.get<ApiResponse<ProductSummary[]>>("/api/v1/products/search/suggestions", {
    params: { q },
  });
  return response.data.data;
}

/**
 * Searches products by query text, with optional additional filters.
 */
export async function searchProducts(q: string, filter: ProductFilter = {}): Promise<PageResponse<ProductSummary>> {
  const response = await api.get<ApiResponse<PageResponse<ProductSummary>>>("/api/v1/search", {
    params: { q, ...toParams(filter) },
  });
  return response.data.data;
}
