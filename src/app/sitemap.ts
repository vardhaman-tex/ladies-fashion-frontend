import type { MetadataRoute } from "next";
import {
  getAllProductSlugsServer,
  getCategoriesServer,
  getPoliciesServer,
} from "@/lib/server-api";
import { SITE_URL } from "@/lib/seo";

/**
 * Escapes an ampersand for XML.
 *
 * Next's sitemap serialiser writes `<loc>` values verbatim, so a URL with two
 * query parameters emits a bare `&` and the whole sitemap fails to parse —
 * Search Console rejects it outright. Category listings here are query-string
 * URLs (there are no /category/[slug] routes), so this matters.
 */
function xmlSafeUrl(url: string): string {
  return url.replace(/&(?!amp;)/g, "&amp;");
}

/**
 * Dynamic sitemap.
 *
 * Regenerated hourly rather than at build time, so newly published products
 * become discoverable without a redeploy. If the backend is unreachable the
 * catalogue sections come back empty and the sitemap still serves the static
 * routes — a thin sitemap is recoverable, a 500 on /sitemap.xml is not.
 *
 * `lastModified` is only set where the API actually exposes a modification
 * date (policies). Stamping "now" on every product would train crawlers to
 * distrust the field.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, policies] = await Promise.all([
    getCategoriesServer(),
    getAllProductSlugsServer(),
    getPoliciesServer(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // The catalogue has no dedicated /category/[slug] routes — categories are
  // filtered views of /products — so their query-string URLs are what gets
  // submitted. These are the pages that rank for category-level searches.
  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).flatMap(
    (category) => [
      {
        url: `${SITE_URL}/products?categorySlug=${encodeURIComponent(category.slug)}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      },
      ...(category.subCategories ?? [])
        .filter((sub) => sub.isActive)
        .map((sub) => ({
          url: xmlSafeUrl(
            `${SITE_URL}/products?categorySlug=${encodeURIComponent(category.slug)}` +
              `&subCategorySlug=${encodeURIComponent(sub.slug)}`
          ),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
    ]
  );

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${encodeURIComponent(product.slug)}`,
    changeFrequency: "weekly",
    priority: product.isFeatured ? 0.8 : 0.7,
  }));

  const policyRoutes: MetadataRoute.Sitemap = (policies ?? [])
    .filter((policy) => policy.visible)
    .map((policy) => ({
      url: `${SITE_URL}/policies/${encodeURIComponent(policy.slug)}`,
      lastModified: policy.updatedAt ? new Date(policy.updatedAt) : undefined,
      changeFrequency: "yearly",
      priority: 0.3,
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...policyRoutes];
}
