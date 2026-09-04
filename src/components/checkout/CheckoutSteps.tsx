"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Address", "Review", "Pay"] as const;

/**
 * Address → Review → Pay.
 *
 * Earns its place because the section below it folds away: without a marker
 * saying the address step is done, a collapsed form reads as something being
 * hidden rather than something being finished. The tick is the reassurance
 * that makes the collapse feel like progress.
 */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="mb-6 flex items-center justify-center gap-1 sm:gap-2" aria-label="Checkout progress">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const isComplete = step < current;
        const isCurrent = step === current;

        return (
          <li key={label} className="flex items-center gap-1 sm:gap-2">
            {index > 0 && <span aria-hidden className="h-px w-6 bg-border sm:w-10" />}
            <span
              className="flex items-center gap-1.5"
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  isComplete && "border-emerald-600 bg-emerald-600 text-white",
                  isCurrent && "border-rose-600 bg-rose-600 text-white",
                  !isComplete && !isCurrent && "border-border text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="size-3.5" /> : step}
              </span>
              <span
                className={cn(
                  "text-sm",
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
