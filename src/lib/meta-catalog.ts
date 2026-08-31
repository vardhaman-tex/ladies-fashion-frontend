/**
 * Catalog assembly for the Meta product feed.
 *
 * Sourcing: the public list endpoint returns summaries only — no variants, no
 * per-size SKUs, no gallery images — so full detail has to be fetched per
 * product. That fan-out is the one genuinely expensive part of the feed, and it
 * is bounded three ways:
 *
 *   1. Pagination. `getAllProductSlugsServer` walks pages rather than asking
 *      for the whole catalogue in one response, and is capped.
 *   2. Concurrency. Detail requests run `CONCURRENCY` at a time, so a large
 *      catalogue never opens hundreds of sockets against the backend at once.
 *   3. Caching. Every underlying fetch carries `next: { revalidate }`, and the
 *      route itself is an ISR route. Meta polls on a schedule measured in hours;
 *      the backend sees at most one rebuild per revalidate window regardless of
 *      how often the URL is hit.
 *
 * At the current catalogue size (about 20 products) a cold rebuild is one list
 * call plus ~20 detail calls. If the catalogue grows past a few hundred, the
 * right next step is a single bulk endpoint on the backend rather than raising
 * the concurrency here.
 */
import { getAllProductSlugsServer, getProductServer } from "@/lib/server-api";
import { buildFeedItems, renderFeedXml, type FeedBuildResult } from "@/lib/meta-feed";
import type { ProductDetail } from "@/types/product";

/** Simultaneous detail requests against the backend. */
const CONCURRENCY = 6;

export interface CatalogFeed {
  xml: string;
  itemCount: number;
  productCount: number;
  skipped: FeedBuildResult["skipped"];
}

/** Runs `worker` over `values`, at most `limit` at a time, preserving order. */
async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  worker: (value: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;

  async function run(): Promise<void> {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await worker(values[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => run())
  );
  return results;
}

/**
 * Builds the feed document.
 *
 * Returns null when the catalogue could not be read at all. That distinction
 * matters: the route turns null into a 503 rather than serving a valid but
 * empty feed. An empty feed is not a harmless no-op — Meta treats absent items
 * as delisted and would wipe the catalog (and every Instagram product tag
 * pointing at it) because the backend happened to be asleep.
 */
export async function buildCatalogFeed(): Promise<CatalogFeed | null> {
  const summaries = await getAllProductSlugsServer();

  if (summaries.length === 0) {
    return null;
  }

  const details = await mapWithConcurrency(
    summaries.map((summary) => summary.slug),
    CONCURRENCY,
    async (slug) => {
      try {
        return await getProductServer(slug);
      } catch {
        // getProductServer already swallows, but a caller-side guard keeps one
        // unexpected rejection from failing the whole Promise.all above.
        return null;
      }
    }
  );

  const products = details.filter((product): product is ProductDetail => product !== null);

  if (products.length === 0) {
    return null;
  }

  const { items, skipped } = buildFeedItems(products);

  // Every product detail failing to map means something systemic (a schema
  // change, say), not a handful of bad rows. Serving nothing is safer than
  // telling Meta the catalogue is empty.
  if (items.length === 0) {
    return null;
  }

  const unreachable = summaries.length - products.length;
  const allSkipped = [
    ...skipped,
    ...(unreachable > 0
      ? [{ slug: `(${unreachable} products)`, reason: "detail fetch failed" }]
      : []),
  ];

  return {
    xml: renderFeedXml(items),
    itemCount: items.length,
    productCount: products.length,
    skipped: allSkipped,
  };
}
