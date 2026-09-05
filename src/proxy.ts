import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const razorpay = "https://*.razorpay.com";
  // Vercel Analytics is served same-origin in production (/_vercel/insights/…),
  // so 'self' already covers both its script and its beacons there. In
  // development it loads the debug build from va.vercel-scripts.com instead,
  // which has to be named explicitly or CSP blocks it and no events are
  // recorded. Production CSP is deliberately left unchanged.
  const vercelAnalytics = isDev ? " https://va.vercel-scripts.com" : "";
  // The Meta Pixel needs three separate grants and fails silently without any
  // one of them: the loader script comes from connect.facebook.net, and events
  // leave as both a 1x1 image and a fetch to facebook.com. A blocked pixel
  // reports nothing and logs nothing you would notice — it just looks like the
  // campaign has no data. Only named when a pixel id is actually configured.
  const metaPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID
    ? { script: " https://connect.facebook.net", endpoint: " https://www.facebook.com" }
    : { script: "", endpoint: "" };

  const csp = [
    "default-src 'self'",
    // 'nonce-…' lets Next.js stamp its own inline RSC-payload scripts.
    // The razorpay domain is kept for the <Script> component on checkout.
    // 'unsafe-eval' is required in dev — React uses eval for better error stacks.
    `script-src 'self' 'nonce-${nonce}' ${razorpay}${vercelAnalytics}${metaPixel.script}${isDev ? " 'unsafe-eval'" : ""}`,
    // 'unsafe-inline' for styles is fine — CSS injection can't steal cookies.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: https://res.cloudinary.com https://picsum.photos${metaPixel.endpoint}`,
    "font-src 'self' data:",
    `connect-src 'self' ${razorpay}${metaPixel.endpoint}`,
    `frame-src ${razorpay}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");

  // Forward the nonce to the app via a request header so that server
  // components can read it (e.g. to pass to third-party <Script> tags).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  // Also set it on the response so the browser enforces it.
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    {
      // Run on all page requests; skip static assets, images, and favicon
      // so CSP headers don't interfere with Turbopack's asset pipeline.
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        // Skip Next.js prefetch requests — they don't render pages.
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
