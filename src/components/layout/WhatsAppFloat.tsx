"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

import { whatsAppLink } from "@/lib/support";
import { trackContact } from "@/lib/pixel";

/**
 * A floating way to ask a person, on every page where one is wanted.
 *
 * Left out of the checkout, where it would sit on top of the pay button on a
 * phone and invite a tap in the wrong place. On product pages it rides above
 * the sticky add-to-cart bar rather than behind it.
 */
export function WhatsAppFloat() {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/checkout")) return null;

  const onProduct = /^\/products\/[^/]+/.test(pathname);

  return (
    <a
      href={whatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onClick={() => trackContact("whatsapp_float")}
      className={`fixed right-4 z-30 flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground md:bottom-6 ${
        onProduct ? "bottom-24" : "bottom-5"
      }`}
    >
      <MessageCircle className="size-6" aria-hidden="true" />
    </a>
  );
}
