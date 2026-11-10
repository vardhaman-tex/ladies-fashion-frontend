import { api } from "@/lib/api";

export type EventType =
  | "PAGE_VIEW"
  | "PRODUCT_VIEW"
  | "ADD_TO_CART"
  | "REMOVE_FROM_CART"
  | "CHECKOUT_START"
  | "ORDER_PLACED"
  | "SEARCH"
  | "COUPON_APPLIED";

function getSessionId(): string {
  try {
    const key = "lf_sid";
    let sid = localStorage.getItem(key);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return "unknown";
  }
}

export function track(
  eventType: EventType,
  opts: { refId?: string; refSlug?: string } = {}
): void {
  const sessionId = getSessionId();
  // Fire-and-forget: errors are silently swallowed so tracking never breaks UX
  api
    .post("/api/v1/analytics/events", {
      sessionId,
      eventType,
      refId: opts.refId ?? null,
      refSlug: opts.refSlug ?? null,
    })
    .catch(() => {});
}
