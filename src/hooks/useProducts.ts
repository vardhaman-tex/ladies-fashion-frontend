import { useQuery } from "@tanstack/react-query";
import {
  getBestSellers,
  getFeatured,
  getNewArrivals,
  getProduct,
  getProducts,
  getTrending,
} from "@/services/productService";
import type { ProductFilter } from "@/types/product";

/**
 * Fetches a paginated, filtered list of products.
 */
export function useProducts(filter: ProductFilter = {}) {
  return useQuery({
    queryKey: ["products", filter],
    queryFn: () => getProducts(filter),
  });
}

/**
 * Fetches a single product's details by its slug.
 */
export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["products", "detail", slug],
    queryFn: () => getProduct(slug),
    enabled: !!slug,
  });
}

/**
 * Fetches featured products.
 */
export function useFeaturedProducts(filter: ProductFilter = {}) {
  return useQuery({
    queryKey: ["products", "featured", filter],
    queryFn: () => getFeatured(filter),
  });
}

/**
 * Fetches newly arrived products.
 */
export function useNewArrivals(filter: ProductFilter = {}) {
  return useQuery({
    queryKey: ["products", "new-arrivals", filter],
    queryFn: () => getNewArrivals(filter),
  });
}

/**
 * Fetches best-selling products.
 */
export function useBestSellers(filter: ProductFilter = {}) {
  return useQuery({
    queryKey: ["products", "best-sellers", filter],
    queryFn: () => getBestSellers(filter),
  });
}

/**
 * Fetches trending products.
 */
export function useTrending(filter: ProductFilter = {}) {
  return useQuery({
    queryKey: ["products", "trending", filter],
    queryFn: () => getTrending(filter),
  });
}
