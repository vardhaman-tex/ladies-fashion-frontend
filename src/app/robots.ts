import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * robots.txt
 *
 * Private, per-shopper and transactional routes are kept out of the crawl
 * entirely — they carry no ranking value and burn crawl budget that should go
 * to product pages. `/search` is deliberately *not* disallowed: it is marked
 * `noindex, follow` via an `X-Robots-Tag` header in `next.config.ts` instead,
 * so crawlers still traverse it to discover product URLs.
 *
 * AI answer-engine crawlers are listed explicitly and allowed. They obey
 * robots.txt but read it under their own user-agent tokens, so an
 * unqualified wildcard rule is not a reliable grant for them.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/admin",
    "/admin/",
    "/account",
    "/account/",
    "/cart",
    "/checkout",
    "/orders",
    "/orders/",
    "/wishlist",
    "/track-order",
    "/guest-order-confirmed",
    "/login",
    "/register",
    "/api/",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      // Answer engines and AI crawlers — explicit allow for the public catalogue.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "ClaudeBot",
          "Claude-User",
          "Claude-SearchBot",
          "Applebot-Extended",
          "CCBot",
          "meta-externalagent",
          "Bingbot",
          "DuckDuckBot",
        ],
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
