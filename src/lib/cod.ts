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

/**
 * What the store says about cash on delivery, worked out from its live
 * settings rather than typed into each page.
 *
 * The FAQ, its structured data, the announcement bar and the checkout used to
 * each carry their own wording, and they drifted: the FAQ kept promising a
 * ₹100 non-refundable advance long after the store switched to full COD with a
 * ₹40 fee. Anything that describes COD to a customer should come from here, so
 * changing the setting in admin changes every sentence at once.
 */
export interface CodCopy {
  /** A few words, for a banner or a badge. Null when COD is off. */
  short: string | null;
  /** A sentence or two, for the FAQ and structured data. */
  long: string;
}

type CodCopySettings = Pick<SiteSettings, "codEnabled" | "codAdvanceAmount" | "codFeeAmount">;

export function describeCod(settings: CodCopySettings | null | undefined): CodCopy {
  if (!settings || !settings.codEnabled) {
    return {
      short: null,
      long: "Cash on Delivery is not available at the moment. Orders are paid online by card, UPI or net banking.",
    };
  }

  const advance = Math.max(settings.codAdvanceAmount, 0);
  const fee = Math.max(settings.codFeeAmount, 0);
  const feeText = fee > 0 ? `${inr(fee)} Cash on Delivery fee` : null;

  if (advance <= 0) {
    return {
      short: fee > 0 ? `Cash on delivery (${inr(fee)} fee)` : "Cash on delivery",
      long:
        fee > 0
          ? `Yes. Cash on Delivery is available on eligible orders across India, and nothing is paid online in advance. A ${feeText} is added to the order total, and you pay the full amount to the courier when your order arrives. Free shipping applies to every order, with or without COD.`
          : "Yes. Cash on Delivery is available on eligible orders across India, and nothing is paid online in advance. You pay the full amount to the courier when your order arrives.",
    };
  }

  return {
    short: `Cash on delivery (${inr(advance)} advance${fee > 0 ? `, ${inr(fee)} fee` : ""})`,
    long:
      `Yes. Cash on Delivery is available on eligible orders across India. ${inr(advance)} is paid online to confirm the order` +
      `${feeText ? `, a ${feeText} is added to the order total,` : ""} and the remaining amount is paid to the courier on delivery. ` +
      `The ${inr(advance)} advance is non-refundable if the customer refuses, fails to collect, or returns the order for reasons attributable to the customer.`,
  };
}
