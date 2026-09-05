"use client";

import Script from "next/script";

import { META_PIXEL_ID } from "@/lib/pixel";

/**
 * Loads the Meta Pixel, and nothing at all without an id.
 *
 * Gated on NEXT_PUBLIC_META_PIXEL_ID rather than shipped with the id inline,
 * so local development and any preview deployment stay out of the production
 * dataset — a pixel that fires from a developer's laptop teaches the campaign
 * about a customer who does not exist.
 *
 * Note for whoever sets this up: the pixel needs three CSP entries, which are
 * in src/proxy.ts. Without them the script is blocked with no visible error and
 * every event silently vanishes, which looks exactly like "the pixel isn't
 * working" and takes an afternoon to diagnose.
 */
export function MetaPixel({ nonce }: { nonce?: string }) {
  if (!META_PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" nonce={nonce} strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
