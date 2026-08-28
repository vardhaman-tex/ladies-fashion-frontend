import path from "path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Routes that must never appear in a search index.
 *
 * These are per-shopper or transactional pages: they carry no ranking value,
 * some of them render personal data, and letting them into the index dilutes
 * the site's crawl budget. robots.txt already discourages crawling them; the
 * `X-Robots-Tag` below is the enforcement layer for crawlers that fetch a URL
 * anyway (from a shared link, a stray backlink, or because they ignore
 * robots.txt entirely).
 */
const NOINDEX_PATHS = [
  "/admin",
  "/account",
  "/cart",
  "/checkout",
  "/orders",
  "/wishlist",
  "/track-order",
  "/guest-order-confirmed",
  "/login",
  "/register",
];

const nextConfig: NextConfig = {
  // Allow ngrok tunnels in local dev only
  ...(isDev && {
    allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io"],
  }),
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    // AVIF first, WebP as the fallback. Product photography is the Largest
    // Contentful Paint element on nearly every page here, and LCP is a
    // Core Web Vitals ranking signal.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  // Proxy all /api/** requests to the backend.
  // In dev: http://localhost:8080
  // In prod: set NEXT_PUBLIC_API_BASE_URL to your Railway backend URL
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"}/api/:path*`,
      },
    ];
  },
  // Non-CSP security headers applied to every response via the config layer.
  // CSP itself is handled per-request in src/proxy.ts (nonce-based), so it is
  // intentionally absent here — a static CSP string cannot carry a nonce.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // HTTPS-only. Beyond the security value, HSTS is one of the trust
          // signals crawlers and AI answer engines weigh when deciding
          // whether a commerce site is safe to surface.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      // Internal search: keep it out of the index, but let crawlers follow the
      // result links through to product pages.
      {
        source: "/search",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
      ...NOINDEX_PATHS.flatMap((route) => [
        {
          source: route,
          headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
        },
        {
          source: `${route}/:path*`,
          headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
        },
      ]),
      // The generated sitemap and robots file change on their own schedule;
      // a short shared cache with stale-while-revalidate keeps them cheap to
      // serve without going stale for crawlers.
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
