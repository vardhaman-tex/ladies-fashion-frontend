import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/providers/CartProvider";
import { Toaster } from "@/components/ui/sonner";
import { getSiteSettingsServer } from "@/lib/server-api";
import {
  DEFAULT_OG_IMAGE,
  FACEBOOK_DOMAIN_VERIFICATION,
  SITE_DESCRIPTION,
  SITE_LANG,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettingsServer();
  const logoUrl = settings?.logoUrl ?? null;

  return {
    // Everything relative below (canonicals, OG images) resolves against this.
    // Without it Next emits relative og:image URLs, which most social and AI
    // crawlers refuse to fetch.
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} — ${SITE_TAGLINE}`,
      // Page-level titles become "Banarasi Silk Saree | Vardhman Textile".
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    generator: "Next.js",
    keywords: [
      "ladies fashion",
      "women's ethnic wear",
      "sarees online",
      "kurtis online",
      "lehenga",
      "designer suits",
      "festive wear for women",
      "Indian womenswear",
      SITE_NAME,
    ],
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      locale: SITE_LOCALE,
      images: [
        {
          url: absoluteUrl(DEFAULT_OG_IMAGE),
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
      images: [absoluteUrl(DEFAULT_OG_IMAGE)],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        // Without these, Google caps image previews and text snippets, which
        // suppresses both rich results and AI Overview citations.
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    category: "shopping",
    verification: {
      // Meta checks for this on the root domain before approving Instagram
      // product tagging, and re-checks after. Emitted site-wide via the root
      // layout so it is present wherever their crawler lands.
      other: {
        "facebook-domain-verification": FACEBOOK_DOMAIN_VERIFICATION,
      },
    },
    formatDetection: {
      telephone: false,
      address: false,
      email: false,
    },
    ...(logoUrl
      ? { icons: { icon: logoUrl, shortcut: logoUrl, apple: logoUrl } }
      : {}),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "light dark",
};

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
      lang={SITE_LANG}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Warm up the connection to the image CDN before the first product
            image is requested — this is LCP on almost every page. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
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
