import { matchState } from "@/lib/indianStates";

export interface PincodeLookup {
  city: string;
  /** Canonical spelling from the state list, so it can be dropped into the form as is. */
  state: string;
}

const SIX_DIGITS = /^[1-9]\d{5}$/;

export function isPincode(value: string): boolean {
  return SIX_DIGITS.test(value);
}

/**
 * Resolves a pincode to its city and state, or null when it can't be resolved.
 * Null covers "no such pincode", "lookup is down" and "state we don't
 * recognise" alike: every one of them means the shopper fills the field in.
 */
export async function lookupPincode(pin: string): Promise<PincodeLookup | null> {
  if (!isPincode(pin)) return null;
  try {
    const response = await fetch(`/pincode/${pin}`);
    if (!response.ok) return null;
    const body = (await response.json()) as { found?: boolean; city?: string; state?: string };
    if (!body.found || !body.state) return null;
    const state = matchState(body.state);
    return state ? { city: body.city ?? "", state } : null;
  } catch {
    return null;
  }
}

/** Dispatch takes 1–2 business days, delivery 4–7 after that (the published shipping policy). */
const DISPATCH_DAYS = { min: 1, max: 2 };
const TRANSIT_DAYS = { min: 4, max: 7 };

function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return date;
}

/** The window an order placed `from` should arrive in. */
export function estimateDelivery(from: Date = new Date()): { earliest: Date; latest: Date } {
  return {
    earliest: addBusinessDays(from, DISPATCH_DAYS.min + TRANSIT_DAYS.min),
    latest: addBusinessDays(from, DISPATCH_DAYS.max + TRANSIT_DAYS.max),
  };
}

/** "21–26 Oct", or "28 Oct – 3 Nov" when the window crosses a month. */
export function formatDeliveryWindow({ earliest, latest }: { earliest: Date; latest: Date }): string {
  const month = (d: Date) => d.toLocaleDateString("en-IN", { month: "short" });
  return earliest.getMonth() === latest.getMonth()
    ? `${earliest.getDate()}–${latest.getDate()} ${month(latest)}`
    : `${earliest.getDate()} ${month(earliest)} – ${latest.getDate()} ${month(latest)}`;
}
