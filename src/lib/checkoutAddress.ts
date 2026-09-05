/**
 * Validation for the guest checkout address.
 *
 * Kept out of the page component so the rules are testable on their own, and so
 * the same message the customer reads is defined in exactly one place. This is
 * presentation only — the server validates the address again when the order is
 * created, and that check is the one that decides.
 */

import { isKnownState, matchState } from "@/lib/indianStates";

export interface GuestAddressForm {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

export type GuestAddressField = keyof GuestAddressForm;

export type GuestAddressErrors = Partial<Record<GuestAddressField, string>>;

/**
 * The order the customer reads the form in. The first failing field in this
 * order is the one we focus, so attention lands at the top of the problem
 * rather than wherever object key order happens to put it.
 */
export const GUEST_ADDRESS_FIELD_ORDER: GuestAddressField[] = [
  "fullName",
  "phone",
  "email",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "pincode",
];

// Ten digits opening 6-9 — the whole of India's mobile range. Landlines are
// rejected on purpose: the courier calls this number on the doorstep.
const INDIAN_MOBILE = /^[6-9]\d{9}$/;

// Indian pincodes never start with a zero.
const PINCODE = /^[1-9]\d{5}$/;

// Deliberately loose. The job here is to catch "jane@gmail" and a stray space,
// not to adjudicate RFC 5322.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Reduces anything a customer might paste — "+91 98765 43210", "098765-43210" —
 * to the bare ten digits, so the same person is not stored under two numbers.
 */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function validateGuestAddress(form: GuestAddressForm): GuestAddressErrors {
  const errors: GuestAddressErrors = {};

  if (form.fullName.trim().length < 2) {
    errors.fullName = "Enter your full name.";
  }

  const phone = normalisePhone(form.phone);
  if (!phone) {
    errors.phone = "Enter your mobile number.";
  } else if (!INDIAN_MOBILE.test(phone)) {
    errors.phone = "Enter a valid 10-digit mobile number.";
  }

  // Optional — but a typo here sends the order confirmation nowhere, so it is
  // worth catching while the customer is still looking at the field.
  const email = form.email.trim();
  if (email && !EMAIL.test(email)) {
    errors.email = "Enter a valid email address, or leave it blank.";
  }

  if (!form.addressLine1.trim()) {
    errors.addressLine1 = "Enter your house or flat number and street.";
  }

  if (!form.city.trim()) {
    errors.city = "Enter your city.";
  }

  // The one field with a fixed set of right answers. Accepting "Maharastra"
  // here means a parcel routed to the wrong sorting hub and a delivery that
  // fails days later, so an unrecognised state is refused at the form.
  if (!form.state.trim()) {
    errors.state = "Choose your state.";
  } else if (!isKnownState(form.state)) {
    errors.state = "Choose your state from the list.";
  }

  const pincode = form.pincode.trim();
  if (!pincode) {
    errors.pincode = "Enter your 6-digit pincode.";
  } else if (!PINCODE.test(pincode)) {
    errors.pincode = "Enter a valid 6-digit pincode.";
  }

  return errors;
}

export function isGuestAddressComplete(form: GuestAddressForm): boolean {
  return Object.keys(validateGuestAddress(form)).length === 0;
}

/** The field to send the customer to, or null when nothing is wrong. */
export function firstErrorField(errors: GuestAddressErrors): GuestAddressField | null {
  return GUEST_ADDRESS_FIELD_ORDER.find((field) => errors[field]) ?? null;
}

/**
 * The state as it should leave the browser.
 *
 * "MH", "orissa" and "jammu & kashmir" all describe one place; the courier's
 * manifest should not have to. Falls back to what was typed, since validation
 * has already refused anything unrecognised.
 */
export function canonicalState(form: GuestAddressForm): string {
  return matchState(form.state) ?? form.state.trim();
}

/** One-line rendering of the address, for the collapsed section header. */
export function formatGuestAddress(form: GuestAddressForm): string {
  return [form.addressLine1, form.addressLine2, form.city, canonicalState(form), form.pincode]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}
