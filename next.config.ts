import path from "path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Allow ngrok tunnels in local dev only
  ...(isDev && {
    allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io"],
  }),
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
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
  // Security headers — applied to every response (Vercel/Next both honor this).
  // *.razorpay.com is allow-listed because checkout.js loads a script from
  // checkout.razorpay.com and opens its payment UI in an iframe/XHR to
  // api.razorpay.com; everything else stays same-origin since our own API
  // calls go through the /api rewrite above, not direct cross-origin fetches.
  async headers() {
    const razorpay = "https://*.razorpay.com";
    const csp = [
      "default-src 'self'",
      `script-src 'self' ${razorpay}`,
      // 'unsafe-inline' kept for style only — next/image sets inline style
      // attributes for layout, and CSS-only injection doesn't get an attacker
      // cookie theft or arbitrary JS, which is what this header is for.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://res.cloudinary.com https://picsum.photos",
      "font-src 'self' data:",
      `connect-src 'self' ${razorpay}`,
      `frame-src ${razorpay}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
