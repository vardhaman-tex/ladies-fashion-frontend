"use client";

import { useSiteSettings } from "@/hooks/useSiteSettings";
import { describeCod } from "@/lib/cod";
import { SUPPORT_WHATSAPP_DISPLAY, whatsAppLink } from "@/lib/support";

/**
 * The three things a first-time visitor wants settled before they scroll:
 * what shipping costs, whether they can pay on delivery, and whether a person
 * answers questions.
 *
 * Shipping is free on every order, so the bar says that rather than naming a
 * threshold that does not exist. The COD wording comes from the live settings
 * (see describeCod), so the fee in the banner is the fee at checkout.
 */
export function AnnouncementBar() {
  const { data: settings } = useSiteSettings();
  const cod = describeCod(settings).short;

  return (
    <div className="bg-rose-600 text-white">
      <p className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-0.5 px-4 py-2 text-center text-xs font-medium">
        <span>Free shipping across India</span>
        {cod && (
          <>
            <span aria-hidden="true" className="opacity-50">·</span>
            <span>{cod}</span>
          </>
        )}
        <span aria-hidden="true" className="hidden opacity-50 sm:inline">·</span>
        <a
          href={whatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
        >
          WhatsApp {SUPPORT_WHATSAPP_DISPLAY}
        </a>
      </p>
    </div>
  );
}
