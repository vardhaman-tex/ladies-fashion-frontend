/**
 * One canonical spelling for a mobile number, mirroring the server's
 * MobileNumbers.
 *
 * The same person arrives as "+91 98765 43210" from a browser autofill,
 * "098765-43210" from a form they typed, and "9876543210" from checkout.
 * Identity is keyed on this value, so three spellings is three customers.
 */

// Ten digits opening 6-9 — the whole of India's mobile range. Landlines are
// rejected on purpose: every use of this number is a message meant for a handset.
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

/** Reduces anything recognisable to ten bare digits. */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith("091")) return digits.slice(3);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function isIndianMobile(raw: string): boolean {
  return INDIAN_MOBILE.test(normalisePhone(raw));
}

/** "98765 43210" — easier to check at a glance than ten unbroken digits. */
export function formatMobile(raw: string): string {
  const digits = normalisePhone(raw);
  return digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
}
