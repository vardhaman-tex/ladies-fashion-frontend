import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/providers/CartProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function getLogoUrl(): Promise<string | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
    const res = await fetch(`${base}/api/v1/settings/site`, {
      next: { revalidate: 300 },
      // Hard timeout — this fetch runs at build/render time for every route via
      // the root layout. Without it, an unreachable/slow backend (e.g. a dead
      // ngrok tunnel) can hang each page well past Next's own build watchdog,
      // failing the whole build instead of just falling back to no icon.
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.logoUrl ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const logoUrl = await getLogoUrl();
  return {
    title: "Vardhman Textile",
    description: "Vardhman Textile — Premium Ladies Fashion",
    ...(logoUrl ? { icons: { icon: logoUrl } } : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Reading request headers opts every route into dynamic rendering.
  // This is required so Next.js can stamp the per-request nonce (set by
  // proxy.ts) onto its own inline RSC-payload scripts at serve time.
  await headers();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
