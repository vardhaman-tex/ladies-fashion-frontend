"use client";

import { MessageCircle, Truck, Wallet } from "lucide-react";

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { SUPPORT_HOURS, SUPPORT_WHATSAPP_DISPLAY, whatsAppLink } from "@/lib/support";

/**
 * The three things a stranger from an ad needs to know before they will risk
 * ₹1,399 on a brand they have never heard of, plus a way to reach a person.
 *
 * Every line is a fact taken from somewhere real — whether COD is on from live
 * site settings, the timings from the published Shipping Policy. Nothing here claims
 * easy returns or guaranteed quality, because the Cancellation, Return, Refund
 * & Exchange Policy does not offer either, and a badge that promises what the
 * policy refuses turns a browse into a dispute rather than a sale.
 */
export function ProductTrustBox({ productName }: { productName: string }) {
  const { data: settings } = useSiteSettings();

  // Only claim COD while the store is actually accepting it — the same setting
  // the checkout enforces, so the promise and the form cannot drift apart. The
  // advance is deliberately not named here; it is stated at checkout, where the
  // buyer is deciding to pay rather than deciding to look.
  const codEnabled = settings?.codEnabled === true;

  return (
    <section className="rounded-xl border bg-muted/30 p-4">
      <ul className="space-y-2.5 text-sm">
        {codEnabled && (
          <li className="flex items-start gap-2.5">
            <Wallet className="mt-0.5 size-4 shrink-0 text-rose-600" />
            <span>
              <span className="font-medium">Cash on delivery</span> available
            </span>
          </li>
        )}
        <li className="flex items-start gap-2.5">
          <Truck className="mt-0.5 size-4 shrink-0 text-rose-600" />
          <span>
            <span className="font-medium">Free shipping</span> across India
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Truck className="mt-0.5 size-4 shrink-0 text-rose-600" />
          <span>Dispatched in 1–2 days · Delivered in 4–7</span>
        </li>
      </ul>

      <div className="mt-4 border-t pt-4">
        <p className="text-sm font-semibold">Have a question? We&apos;re here to help.</p>
        <a
          href={whatsAppLink(productName)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
        >
          <MessageCircle className="size-4 shrink-0" />
          WhatsApp us on {SUPPORT_WHATSAPP_DISPLAY}
        </a>
        <p className="mt-1.5 text-xs text-muted-foreground">{SUPPORT_HOURS}</p>
      </div>
    </section>
  );
}
