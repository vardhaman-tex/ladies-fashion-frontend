/**
 * Server-side data access for SEO surfaces.
 *
 * The browser talks to the backend through the Axios instance in `lib/api.ts`,
 * which uses same-origin relative URLs and relies on Next's `/api/**` rewrite.
 * That doesn't work during server rendering (there is no origin to be relative
 * to and the rewrite isn't in play), so metadata generation, the sitemap and
 * the server components that pre-render product data use plain `fetch` against
 * the absolute backend URL instead.
 *
 * Every call here is wrapped so a slow or unreachable backend degrades to
 * `null` rather than failing the render — an SEO tag is never worth a 500.
 */
import { cache } from "react";
import type { Category } from "@/types/category";
import type { PageResponse } from "@/types/api";
import type { ProductDetail, ProductSummary } from "@/types/product";
import type { Policy } from "@/services/policyService";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

/** How long server-fetched catalogue data stays fresh, in seconds. */
const DEFAULT_REVALIDATE = 300;

/** Backend timeout. Matches the guard already used in the root layout. */
const TIMEOUT_MS = 5000;

async function apiGet<T>(
  path: string,
  revalidate: number = DEFAULT_REVALIDATE
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        // Mirrors lib/api.ts — skips ngrok's interstitial during tunnelled dev.
        "ngrok-skip-browser-warning": "true",
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? null) as T | null;
  } catch {
    return null;
  }
}

function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * A single product. `cache()` dedupes the call so `generateMetadata` and the
 * page body share one request per render pass.
 */
export const getProductServer = cache(
  (slug: string): Promise<ProductDetail | null> =>
    apiGet<ProductDetail>(`/api/v1/products/${encodeURIComponent(slug)}`)
);

export const getProductsServer = cache(
  (
    params: Record<string, string | number | boolean | undefined> = {}
  ): Promise<PageResponse<ProductSummary> | null> =>
    apiGet<PageResponse<ProductSummary>>(`/api/v1/products${query(params)}`)
);

export const getFeaturedServer = cache(
  (size = 8): Promise<PageResponse<ProductSummary> | null> =>
    apiGet<PageResponse<ProductSummary>>(`/api/v1/products/featured${query({ size })}`)
);

export const getNewArrivalsServer = cache(
  (size = 8): Promise<PageResponse<ProductSummary> | null> =>
    apiGet<PageResponse<ProductSummary>>(`/api/v1/products/new-arrivals${query({ size })}`)
);

export const getTrendingServer = cache(
  (size = 8): Promise<PageResponse<ProductSummary> | null> =>
    apiGet<PageResponse<ProductSummary>>(`/api/v1/products/trending${query({ size })}`)
);

export const getSaleProductsServer = cache(
  (size = 8): Promise<PageResponse<ProductSummary> | null> =>
    apiGet<PageResponse<ProductSummary>>(`/api/v1/products/sale${query({ size })}`)
);

export const getCategoriesServer = cache(
  (): Promise<Category[] | null> => apiGet<Category[]>("/api/v1/categories")
);

export const getPoliciesServer = cache(
  (): Promise<Policy[] | null> => apiGet<Policy[]>("/api/v1/policies")
);

export const getPolicyServer = cache(
  (slug: string): Promise<Policy | null> =>
    apiGet<Policy>(`/api/v1/policies/${encodeURIComponent(slug)}`)
);

export const getSocialLinksServer = cache(
  (): Promise<Array<{ platform: string; url: string; enabled: boolean }> | null> =>
    apiGet<Array<{ platform: string; url: string; enabled: boolean }>>(
      "/api/v1/settings/social-links",
      3600
    )
);

export const getSiteSettingsServer = cache(
  (): Promise<{ logoUrl: string | null } | null> =>
    apiGet<{ logoUrl: string | null }>("/api/v1/settings/site", 300)
);

/**
 * Walks the paginated product endpoint to collect every product slug for the
 * sitemap. Capped so a runaway catalogue can never turn sitemap generation
 * into an unbounded crawl of the backend.
 */
export async function getAllProductSlugsServer(
  pageSize = 100,
  maxPages = 50
): Promise<ProductSummary[]> {
  const all: ProductSummary[] = [];
  for (let page = 0; page < maxPages; page++) {
    const result = await getProductsServer({ page, size: pageSize });
    if (!result?.content?.length) break;
    all.push(...result.content);
    if (page + 1 >= (result.totalPages ?? 0)) break;
  }
  return all;
}
