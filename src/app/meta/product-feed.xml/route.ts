import { buildCatalogFeed } from "@/lib/meta-catalog";

/**
 * GET /meta/product-feed.xml
 *
 * The scheduled feed Meta Commerce Manager pulls. Public and unauthenticated by
 * design — Meta's fetcher has no credentials — and it exposes only what the
 * storefront already shows anyone: names, prices, images, stock. No customer,
 * order or admin data passes through this path.
 *
 * Freshness: the route is ISR-cached for an hour, so price, stock, image and
 * availability edits made in admin appear in the feed within that window and
 * reach Meta on its next scheduled pull. There is nothing to regenerate and
 * nothing to redeploy.
 */
export const revalidate = 3600;

/** Content type Meta expects for an RSS/XML feed. */
const CONTENT_TYPE = "application/xml; charset=utf-8";

export async function GET(): Promise<Response> {
  try {
    const feed = await buildCatalogFeed();

    if (!feed) {
      // Deliberately a 503 with no body rather than an empty <rss> document.
      // Meta treats a successfully-fetched feed as the complete truth: an empty
      // one delists every item and breaks the Instagram tags pointing at them.
      // A 503 makes Meta keep the last good version and retry.
      return new Response("Catalog temporarily unavailable", {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex",
        },
      });
    }

    if (feed.skipped.length > 0) {
      // Visible in the platform logs so a product that silently stops appearing
      // in the catalog can be traced without re-deriving why.
      console.warn(
        `[meta-feed] ${feed.itemCount} items from ${feed.productCount} products; ` +
          `${feed.skipped.length} skipped: ` +
          feed.skipped.map((entry) => `${entry.slug} (${entry.reason})`).join("; ")
      );
    }

    return new Response(feed.xml, {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPE,
        "Cache-Control":
          "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "noindex",
        // Useful when checking a Commerce Manager upload against what was served.
        "X-Feed-Item-Count": String(feed.itemCount),
        "X-Feed-Product-Count": String(feed.productCount),
      },
    });
  } catch (error) {
    console.error(
      "[meta-feed] feed generation failed:",
      error instanceof Error ? error.message : error
    );
    return new Response("Catalog temporarily unavailable", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  }
}
