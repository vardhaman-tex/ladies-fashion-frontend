"use client";

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * The six-box code field.
 *
 * Separate boxes are what people expect, but they are also where OTP entry
 * usually breaks: a naive implementation takes one character per box and
 * throws away a paste or an autofill, which is exactly how the code arrives
 * from a WhatsApp copy-code button or Android's SMS suggestion. So every box
 * accepts a whole code and distributes it, and the first box carries
 * autoComplete="one-time-code" for the browser to fill.
 */
export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  invalid,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Fired once the last digit lands, from typing or from a paste. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.replace(/\D/g, "").slice(0, length);

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  function commit(next: string, focusIndex: number) {
    const cleaned = next.replace(/\D/g, "").slice(0, length);
    onChange(cleaned);
    inputs.current[Math.min(focusIndex, length - 1)]?.focus();
    if (cleaned.length === length) onComplete?.(cleaned);
  }

  function handleChange(index: number, raw: string) {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;

    // More than one digit means a paste or an autofill landed in this box —
    // spread it across the rest rather than keeping only the last character.
    if (typed.length > 1) {
      const next = (digits.slice(0, index) + typed).slice(0, length);
      commit(next, next.length);
      return;
    }

    const next = (digits.slice(0, index) + typed + digits.slice(index + 1)).slice(0, length);
    commit(next, index + 1);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) {
        commit(digits.slice(0, index) + digits.slice(index + 1), index);
      } else if (index > 0) {
        // Empty box: step back and clear the one before it, which is what
        // people mean when they hit backspace twice in a row.
        commit(digits.slice(0, index - 1) + digits.slice(index), index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();
    commit(pasted.slice(0, length), pasted.length);
  }

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="Verification code">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          // Only the first box: browsers fill the whole code into one field,
          // and handleChange spreads it from there.
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length}
          disabled={disabled}
          value={digits[index] ?? ""}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={cn(
            "size-12 rounded-lg border bg-transparent text-center text-lg font-semibold outline-none transition-colors",
            "focus-visible:border-rose-600 focus-visible:ring-3 focus-visible:ring-rose-600/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid ? "border-red-500" : "border-input"
          )}
        />
      ))}
    </div>
  );
}
