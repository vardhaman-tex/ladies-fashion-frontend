import { useEffect, useRef } from "react";

import { INDIAN_MOBILE, normalisePhone } from "@/lib/checkoutAddress";
import { rememberCart } from "@/services/abandonedCartService";
import type { CartItemData, GuestCartItem } from "@/types/cart";

/**
 * Once a guest has typed a real phone number and has something in the cart,
 * tell the server — after a pause, and only when something changed — so a
 * WhatsApp reminder can bring them back if they leave.
 *
 * Fire-and-forget: a failure here must never be visible, let alone block the
 * order. The checkout shows the consent notice next to the phone field; this
 * never runs for a signed-in customer.
 */
export function useAbandonedCartCapture({
  enabled,
  phone,
  name,
  items,
}: {
  enabled: boolean;
  phone: string;
  name: string;
  items: CartItemData[];
}) {
  const lastSent = useRef<string>("");

  useEffect(() => {
    const digits = normalisePhone(phone);
    if (!enabled || !INDIAN_MOBILE.test(digits) || items.length === 0) return;

    const snapshot: GuestCartItem[] = items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      thumbnail: item.thumbnail,
      price: item.price,
      discountAmount: item.discountAmount,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    }));
    const key = JSON.stringify([digits, name.trim(), snapshot]);
    if (key === lastSent.current) return;

    const timer = window.setTimeout(() => {
      lastSent.current = key;
      rememberCart({ phone: digits, name: name.trim() || undefined, items: snapshot }).catch(() => {
        // Allow a retry on the next change rather than silently giving up.
        lastSent.current = "";
      });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [enabled, phone, name, items]);
}
