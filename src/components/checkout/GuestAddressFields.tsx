"use client";

import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateCombobox } from "@/components/checkout/StateCombobox";
import type {
  GuestAddressErrors,
  GuestAddressField,
  GuestAddressForm,
} from "@/lib/checkoutAddress";

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
        <p id={errorId(field)} className="text-xs font-medium text-red-600 dark:text-red-400">
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
  disabled,
}: {
  form: GuestAddressForm;
  errors: GuestAddressErrors;
  onChange: (field: GuestAddressField, value: string) => void;
  disabled?: boolean;
}) {
  const shared = { form, errors, onChange, disabled };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          {...shared}
          field="fullName"
          label="Full Name"
          placeholder="Jane Doe"
          autoComplete="name"
        />
        <Field
          {...shared}
          field="phone"
          label="Phone"
          type="tel"
          inputMode="tel"
          placeholder="9876543210"
          autoComplete="tel"
        />
      </div>

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
          placeholder="Mumbai"
          autoComplete="address-level2"
        />

        {/* The one field with a fixed set of right answers, so it is the one
            worth constraining — a mistyped state is a parcel that goes to the
            wrong sorting hub. */}
        <FieldShell field="state" label="State" error={errors.state}>
          <StateCombobox
            id={guestFieldId("state")}
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
          placeholder="400001"
          maxLength={6}
          autoComplete="postal-code"
        />
      </div>
    </div>
  );
}
