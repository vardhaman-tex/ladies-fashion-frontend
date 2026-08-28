import { useQuery } from "@tanstack/react-query";
import {
  getBestSellers,
  getFeatured,
  getNewArrivals,
  getProduct,
  getProducts,
  getSaleProducts,
  getTrending,
} from "@/services/productService";
import type { PageResponse } from "@/types/api";
import type { ProductDetail, ProductFilter, ProductSummary } from "@/types/product";

/**
 * Every hook here takes an optional `initialData`.
 *
 * The server components that wrap these pages fetch the same data during
 * render and hand it down, which is what puts product names, prices and links
 * into the initial HTML. Without it React Query starts empty and the markup a
 * crawler receives is a loading skeleton — invisible to any crawler that does
 * not execute JavaScript, which is most AI answer engines.
 *
 * Callers must only pass `initialData` that matches the current query key
 * (see the `initialSearch`/slug guards in the client components), otherwise a
 * filter change would be served the previous page's rows.
 */

type ProductPage = PageResponse<ProductSummary>;

/**
 * Fetches a paginated, filtered list of products.
 */
export function useProducts(filter: ProductFilter = {}, initialData?: ProductPage) {
  return useQuery({
    queryKey: ["products", filter],
    queryFn: () => getProducts(filter),
    initialData,
  });
}

/**
 * Fetches a single product's details by its slug.
 */
export function useProduct(slug: string, initialData?: ProductDetail) {
  return useQuery({
    queryKey: ["products", "detail", slug],
    queryFn: () => getProduct(slug),
    enabled: !!slug,
    initialData,
  });
}

/**
 * Fetches featured products.
 */
export function useFeaturedProducts(
  filter: ProductFilter = {},
  initialData?: ProductPage
) {
  return useQuery({
    queryKey: ["products", "featured", filter],
    queryFn: () => getFeatured(filter),
    initialData,
  });
}

/**
 * Fetches newly arrived products.
 */
export function useNewArrivals(filter: ProductFilter = {}, initialData?: ProductPage) {
  return useQuery({
    queryKey: ["products", "new-arrivals", filter],
    queryFn: () => getNewArrivals(filter),
    initialData,
  });
}

/**
 * Fetches best-selling products.
 */
export function useBestSellers(filter: ProductFilter = {}, initialData?: ProductPage) {
  return useQuery({
    queryKey: ["products", "best-sellers", filter],
    queryFn: () => getBestSellers(filter),
    initialData,
  });
}

/**
 * Fetches trending products.
 */
export function useTrending(filter: ProductFilter = {}, initialData?: ProductPage) {
  return useQuery({
    queryKey: ["products", "trending", filter],
    queryFn: () => getTrending(filter),
    initialData,
  });
}

/**
 * Fetches products currently on sale.
 */
export function useSaleProducts(filter: ProductFilter = {}, initialData?: ProductPage) {
  return useQuery({
    queryKey: ["products", "sale", filter],
    queryFn: () => getSaleProducts(filter),
    initialData,
  });
}
