"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { estimateDelivery, formatDeliveryWindow, isPincode, lookupPincode } from "@/lib/pincode";
import { StateCombobox } from "@/components/checkout/StateCombobox";
import type {
  GuestAddressErrors,
  GuestAddressField,
  GuestAddressForm,
} from "@/lib/checkoutAddress";

/**
 * Placeholders sit a shade lighter than muted text.
 *
 * They are hints, not content — every field here has a visible label — and at
 * full muted weight an example value reads as something already filled in.
 */
export const PLACEHOLDER_TONE = "placeholder:text-muted-foreground/70";

/**
 * Field ids are stable and predictable (`g-pincode`) because the pay button
 * focuses the first failing one by id after a failed submit.
 */
export function guestFieldId(field: GuestAddressField): string {
  return `g-${field}`;
}

function errorId(field: GuestAddressField): string {
  return `${guestFieldId(field)}-error`;
}

/**
 * Label, control and message. Shared so the state picker — which is not an
 * <input> — sits in exactly the same scaffolding as everything else.
 */
function FieldShell({
  field,
  label,
  optional = false,
  error,
  children,
}: {
  field: GuestAddressField;
  label: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={guestFieldId(field)}>
        {label}
        {optional ? (
          <span className="font-normal text-muted-foreground">(optional)</span>
        ) : (
          <span aria-hidden>*</span>
        )}
      </Label>
      {children}
      {error && (
        <p id={errorId(field)} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Field({
  field,
  label,
  form,
  errors,
  onChange,
  optional = false,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
  disabled,
}: {
  field: GuestAddressField;
  label: string;
  form: GuestAddressForm;
  errors: GuestAddressErrors;
  onChange: (field: GuestAddressField, value: string) => void;
  optional?: boolean;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "tel" | "numeric" | "email";
  autoComplete?: string;
  maxLength?: number;
  disabled?: boolean;
}) {
  const error = errors[field];

  return (
    <FieldShell field={field} label={label} optional={optional} error={error}>
      <Input
        id={guestFieldId(field)}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
        className={PLACEHOLDER_TONE}
        value={form[field]}
        disabled={disabled}
        required={!optional}
        onChange={(event) => onChange(field, event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId(field) : undefined}
      />
    </FieldShell>
  );
}

export function GuestAddressFields({
  form,
  errors,
  onChange,
  onFill,
  disabled,
}: {
  form: GuestAddressForm;
  errors: GuestAddressErrors;
  onChange: (field: GuestAddressField, value: string) => void;
  /** Sets several fields at once; a pincode lookup fills city and state together. */
  onFill?: (patch: Partial<GuestAddressForm>) => void;
  disabled?: boolean;
}) {
  const shared = { form, errors, onChange, disabled };

  // Typing a full pincode fills in what it implies. It only ever fills empty
  // fields: a city the shopper typed themselves is the one they meant, and a
  // post office district is a close guess, not the last word.
  const formRef = useRef(form);
  const fillRef = useRef(onFill);
  useEffect(() => {
    formRef.current = form;
    fillRef.current = onFill;
  });
  const pincode = form.pincode.trim();
  // Remembers which pincode the hint is for, so editing the pincode hides it
  // at once rather than showing a stale place until the next lookup lands.
  const [located, setLocated] = useState<{ pincode: string; place: string } | null>(null);
  useEffect(() => {
    if (!isPincode(pincode)) return;
    let current = true;
    void lookupPincode(pincode).then((place) => {
      if (!current || !place) return;
      const now = formRef.current;
      const patch: Partial<GuestAddressForm> = {};
      if (!now.city.trim()) patch.city = place.city;
      if (!now.state.trim()) patch.state = place.state;
      if (Object.keys(patch).length > 0) fillRef.current?.(patch);
      setLocated({ pincode, place: `${place.city ? `${place.city}, ` : ""}${place.state}` });
    });
    return () => {
      current = false;
    };
  }, [pincode]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          {...shared}
          field="fullName"
          label="Full Name"
          placeholder="Full Name"
          autoComplete="name"
        />
        <Field
          {...shared}
          field="phone"
          label="Phone"
          type="tel"
          inputMode="tel"
          placeholder="Phone"
          autoComplete="tel"
        />
      </div>

      <p className="-mt-2 text-xs text-muted-foreground">
        By entering your number you agree to get order updates on WhatsApp, and a reminder if you
        leave before finishing. Reply STOP to opt out.
      </p>

      <Field
        {...shared}
        field="email"
        label="Email"
        optional
        type="email"
        inputMode="email"
        placeholder="you@example.com"
        autoComplete="email"
      />

      <Field
        {...shared}
        field="addressLine1"
        label="Address Line 1"
        placeholder="House / Flat no., Street"
        autoComplete="address-line1"
      />

      <Field
        {...shared}
        field="addressLine2"
        label="Address Line 2"
        optional
        placeholder="Landmark, Area"
        autoComplete="address-line2"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          {...shared}
          field="city"
          label="City"
          placeholder="City"
          autoComplete="address-level2"
        />

        {/* The one field with a fixed set of right answers, so it is the one
            worth constraining — a mistyped state is a parcel that goes to the
            wrong sorting hub. */}
        <FieldShell field="state" label="State" error={errors.state}>
          <StateCombobox
            id={guestFieldId("state")}
            className={PLACEHOLDER_TONE}
            value={form.state}
            disabled={disabled}
            invalid={Boolean(errors.state)}
            describedBy={errors.state ? errorId("state") : undefined}
            onChange={(next) => onChange("state", next)}
          />
        </FieldShell>

        <Field
          {...shared}
          field="pincode"
          label="Pincode"
          inputMode="numeric"
          placeholder="Pincode"
          maxLength={6}
          autoComplete="postal-code"
        />
      </div>

      {located?.pincode === pincode && isPincode(pincode) && !errors.pincode && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Delivering to {located.place} · Estimated delivery {formatDeliveryWindow(estimateDelivery())}
        </p>
      )}
    </div>
  );
}
