import { inr } from "@/lib/money";
import type { SiteSettings } from "@/services/siteSettingsService";

/**
 * Mirrors the server's COD eligibility rule so checkout can show the option, or
 * explain why it is unavailable, without a round trip.
 *
 * This is presentation only. The server checks the same rule against live
 * settings when the order is created, and that check is the one that decides —
 * this copy exists so the customer is told before they choose, not after.
 */
export type CodAvailability =
  | { available: true }
  | { available: false; reason: string };

export function getCodAvailability(
  settings: Pick<
    SiteSettings,
    "codEnabled" | "codAdvanceAmount" | "codMinOrderValue" | "codMaxOrderValue"
  > | undefined,
  orderTotal: number
): CodAvailability {
  // Settings still loading, or the request failed. Treated as unavailable so a
  // slow network can never surface an option the store has switched off.
  if (!settings || !settings.codEnabled) {
    return { available: false, reason: "Cash on delivery is not available right now." };
  }

  const advance = settings.codAdvanceAmount;

  // At or below the advance there is no balance left for the courier to
  // collect, which makes it a prepaid order wearing a COD label.
  if (orderTotal <= advance) {
    return {
      available: false,
      reason: `Cash on delivery needs an order above ${inr(advance)}.`,
    };
  }

  if (settings.codMinOrderValue != null && orderTotal < settings.codMinOrderValue) {
    return {
      available: false,
      reason: `Cash on delivery is available on orders of ${inr(settings.codMinOrderValue)} and above.`,
    };
  }

  if (settings.codMaxOrderValue != null && orderTotal > settings.codMaxOrderValue) {
    return {
      available: false,
      reason: `Cash on delivery is not available on orders above ${inr(settings.codMaxOrderValue)}.`,
    };
  }

  return { available: true };
}

/**
 * Every number the checkout shows about one payment method, worked out once.
 *
 * It exists because these four figures have to agree with each other and with
 * the server, and they were previously each derived at the point of display —
 * which is how the summary came to show a total with no COD fee in it while the
 * server charged one, and how the pay button came to read "Pay ₹0 now".
 *
 * @param merchandiseTotal the cart's value, before any COD fee
 */
export interface PaymentQuote {
  /** Added to the total for choosing COD. Zero when prepaid, or when no fee is set. */
  fee: number;
  /** What the order is actually worth: merchandise plus the fee. */
  total: number;
  /** Collected online now. The whole total when prepaid, the advance on COD, zero under full COD. */
  payableNow: number;
  /** What the courier collects. */
  dueOnDelivery: number;
  /**
   * Nothing is collected online, so there is no payment step at all — the order
   * is placed and that is that. Drives the button's label and the decision not
   * to open the gateway.
   */
  isPlaceOnly: boolean;
}

export function quotePayment(
  method: "PREPAID" | "COD_PARTIAL" | "COD_FULL",
  merchandiseTotal: number,
  advanceAmount: number,
  feeAmount: number
): PaymentQuote {
  if (method === "PREPAID") {
    return {
      fee: 0,
      total: merchandiseTotal,
      payableNow: merchandiseTotal,
      dueOnDelivery: 0,
      isPlaceOnly: false,
    };
  }

  // The fee rides on the order, so it is collected by the courier along with
  // everything else — it is part of the total, not a separate charge.
  const fee = Math.max(feeAmount, 0);
  const total = merchandiseTotal + fee;
  // Never ask for more than the order is worth, however the advance is set.
  const payableNow = Math.min(Math.max(advanceAmount, 0), total);

  return {
    fee,
    total,
    payableNow,
    dueOnDelivery: Math.max(total - payableNow, 0),
    isPlaceOnly: payableNow <= 0,
  };
}
