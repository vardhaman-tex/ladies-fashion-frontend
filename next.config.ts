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
        ],
      },
    ];
  },
};

export default nextConfig;
