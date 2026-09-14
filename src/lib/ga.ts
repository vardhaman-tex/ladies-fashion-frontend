/**
 * GA4 ecommerce events.
 *
 * Every call is a no-op unless the measurement id is set and gtag has loaded,
 * so nothing has to be guarded at the call site and local development stays
 * silent.
 *
 * This exists alongside the Meta Pixel rather than replacing it. The pixel is
 * what the ad campaigns optimise on; GA4 is where the funnel can actually be
 * read — which step loses people, and how many. Neither answers the other's
 * question, so both fire.
 *
 * Event and parameter names are GA4's own, not invented ones: `items` with
 * `item_id`/`item_name`/`price`/`quantity`, `value` and `currency` on the
 * monetary ones. Anything else lands in GA4 as an event it has no report for.
 */

type GtagArgs =
  | ["js", Date]
  | ["config", string, Record<string, unknown>?]
  | ["event", string, Record<string, unknown>?]
  | ["consent", "default" | "update", Record<string, unknown>];

declare global {
  interface Window {
    gtag?: (...args: GtagArgs[number][]) => void;
    dataLayer?: unknown[];
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

/** One line of an ecommerce event. Prices are rupees, not paise. */
export interface GaItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
  index?: number;
}

function event(name: string, params?: Record<string, unknown>) {
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

/** Sum of an item list, for the events GA4 expects a `value` on. */
function totalOf(items: GaItem[]): number {
  return items.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0);
}

/* ── Discovery ─────────────────────────────────────────────────────────────── */

/** A grid of products was shown. `listName` is what the shopper was looking at. */
export function gaViewItemList(listName: string, items: GaItem[]) {
  if (items.length === 0) return;
  event("view_item_list", { item_list_name: listName, items });
}

/** A product in a grid was clicked. Pairs with view_item_list in GA4's reports. */
export function gaSelectItem(listName: string, item: GaItem) {
  event("select_item", { item_list_name: listName, items: [item] });
}

export function gaViewItem(item: GaItem) {
  event("view_item", { currency: "INR", value: item.price, items: [item] });
}

export function gaSearch(term: string) {
  if (!term.trim()) return;
  event("search", { search_term: term.trim() });
}

/* ── Cart ──────────────────────────────────────────────────────────────────── */

export function gaAddToCart(item: GaItem) {
  event("add_to_cart", { currency: "INR", value: item.price * (item.quantity ?? 1), items: [item] });
}

export function gaRemoveFromCart(item: GaItem) {
  event("remove_from_cart", { currency: "INR", value: item.price * (item.quantity ?? 1), items: [item] });
}

export function gaViewCart(items: GaItem[], total?: number) {
  event("view_cart", { currency: "INR", value: total ?? totalOf(items), items });
}

export function gaAddToWishlist(item: GaItem) {
  event("add_to_wishlist", { currency: "INR", value: item.price, items: [item] });
}

/* ── Checkout ──────────────────────────────────────────────────────────────── */

export function gaBeginCheckout(items: GaItem[], total: number) {
  event("begin_checkout", { currency: "INR", value: total, items });
}

/**
 * The address step completed. GA4 wants a `shipping_tier`; "Free Shipping" is
 * the only one this store has, and naming it is what makes the step show up as
 * a distinct stage in the funnel rather than a gap.
 */
export function gaAddShippingInfo(items: GaItem[], total: number) {
  event("add_shipping_info", { currency: "INR", value: total, shipping_tier: "Free Shipping", items });
}

/**
 * A payment method was chosen. `payment_type` is the interesting dimension in
 * this business: it is how the COD share of checkouts becomes readable, and how
 * the COD-versus-prepaid drop-off can be compared at all.
 */
export function gaAddPaymentInfo(items: GaItem[], total: number, paymentType: string) {
  event("add_payment_info", { currency: "INR", value: total, payment_type: paymentType, items });
}

/**
 * Fires at most once per order, ever, in this browser.
 *
 * The confirmation page is refreshable and shareable, and a double-counted
 * purchase is worse than a missing one: every conversion rate downstream of it
 * is then wrong in a direction nobody notices. Same guard, and the same reason
 * for it, as the Meta pixel's Purchase.
 */
export function gaPurchase(
  orderId: string,
  total: number,
  items: GaItem[],
  paymentType?: string
) {
  if (typeof window === "undefined") return;
  const key = `ga-purchase-${orderId}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Private mode or blocked storage: still report the sale rather than lose
    // it. A rare duplicate beats a systematically missing conversion.
  }
  event("purchase", {
    transaction_id: orderId,
    currency: "INR",
    value: total,
    shipping: 0,
    ...(paymentType ? { payment_type: paymentType } : {}),
    items,
  });
}
