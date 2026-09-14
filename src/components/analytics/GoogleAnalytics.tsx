"use client";

import Script from "next/script";

import { GA_MEASUREMENT_ID } from "@/lib/ga";

/**
 * Loads GA4 via gtag, and nothing at all without a measurement id.
 *
 * Gated on NEXT_PUBLIC_GA_MEASUREMENT_ID for the same reason as the Meta
 * pixel: a developer's laptop and every preview deployment would otherwise
 * pour test traffic and test orders into the production property, and a funnel
 * is only worth reading if the numbers in it are real.
 *
 * Note for whoever sets this up: gtag needs CSP entries, which are in
 * src/proxy.ts and already include Google's hosts. Without them the script is
 * blocked with no visible error and every event silently vanishes — which
 * looks exactly like "analytics isn't working" and takes an afternoon to
 * diagnose.
 */
export function GoogleAnalytics({ nonce }: { nonce?: string }) {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        id="ga4-src"
        nonce={nonce}
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script id="ga4-init" nonce={nonce} strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
