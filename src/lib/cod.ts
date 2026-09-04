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

function inr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

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

/** What the customer pays online, given their chosen method. */
export function amountPayableNow(
  method: "PREPAID" | "COD_PARTIAL",
  orderTotal: number,
  advanceAmount: number
): number {
  return method === "COD_PARTIAL" ? Math.min(advanceAmount, orderTotal) : orderTotal;
}
