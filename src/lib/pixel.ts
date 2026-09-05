/**
 * Meta Pixel events.
 *
 * Every call here is a no-op unless the pixel actually loaded, so nothing has
 * to be guarded at the call site and local development stays silent.
 *
 * The events matter more than the pageviews. A campaign optimising for
 * purchases with no Purchase signal has nothing to learn from and will settle
 * on whoever clicks cheapest — which is the pattern the first week of traffic
 * showed.
 */

type FbqArgs =
  | ["track", string, Record<string, unknown>?, { eventID?: string }?]
  | ["init", string]
  | ["consent", "grant" | "revoke"];

declare global {
  interface Window {
    fbq?: (...args: FbqArgs[number][]) => void;
  }
}

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export interface PixelProduct {
  id: string;
  name: string;
  /** Rupees, not paise — Meta expects a major-unit number. */
  value: number;
  quantity?: number;
}

function track(event: string, params?: Record<string, unknown>, eventID?: string) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventID) {
    window.fbq("track", event, params, { eventID });
  } else {
    window.fbq("track", event, params);
  }
}

export function trackViewContent(product: PixelProduct) {
  track("ViewContent", {
    content_type: "product",
    content_ids: [product.id],
    content_name: product.name,
    value: product.value,
    currency: "INR",
  });
}

export function trackAddToCart(product: PixelProduct) {
  track("AddToCart", {
    content_type: "product",
    content_ids: [product.id],
    content_name: product.name,
    value: product.value * (product.quantity ?? 1),
    currency: "INR",
  });
}

export function trackInitiateCheckout(items: PixelProduct[], total: number) {
  track("InitiateCheckout", {
    content_type: "product",
    content_ids: items.map((item) => item.id),
    num_items: items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
    value: total,
    currency: "INR",
  });
}

/**
 * Fires at most once per order, ever, in this browser.
 *
 * The confirmation page is refreshable and shareable, and a double-counted
 * Purchase is worse than a missing one: it teaches the campaign that traffic
 * converts at twice its real rate and quietly wrecks the bidding. The order id
 * is also sent as Meta's eventID, so a future server-side CAPI event for the
 * same order deduplicates against this one rather than adding to it.
 */
export function trackPurchase(orderId: string, total: number, items: PixelProduct[] = []) {
  if (typeof window === "undefined") return;
  const key = `fb-purchase-${orderId}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Private mode or blocked storage: still report the sale rather than
    // losing it. A rare duplicate beats a systematically missing conversion.
  }
  track(
    "Purchase",
    {
      content_type: "product",
      content_ids: items.map((item) => item.id),
      num_items: items.reduce((sum, item) => sum + (item.quantity ?? 1), 0) || 1,
      value: total,
      currency: "INR",
    },
    orderId
  );
}
