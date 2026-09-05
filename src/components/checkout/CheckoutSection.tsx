"use client";

import type { ReactNode } from "react";
import { ChevronUp, Plus } from "lucide-react";

/**
 * A checkout step that folds away once it holds everything it needs.
 *
 * Three states, in the order a customer meets them: a dashed placeholder
 * inviting them to start, the open form, and a one-line summary with a way
 * back in. The point is the second screenful — someone who has already given
 * their address should not scroll past it again to reach the pay button.
 *
 * The collapse control only appears once there is a summary to collapse into,
 * which is what stops a step folding away over a half-filled form.
 */
export function CheckoutSection({
  id,
  title,
  icon,
  open,
  onOpenChange,
  summary,
  placeholder,
  editLabel = "Edit",
  headerAction,
  children,
}: {
  /** Anchor for scrolling the customer back to this step. */
  id?: string;
  title: string;
  icon: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown in place of the body once the step holds something usable. */
  summary?: ReactNode;
  /** Invitation shown when the step is closed and still empty. */
  placeholder?: string;
  editLabel?: string;
  /** Rendered beside the title while the section is open, e.g. "Add New". */
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const showSummary = !open && summary != null;
  const showPlaceholder = !open && summary == null && placeholder != null;

  return (
    <section id={id}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold sm:text-lg">
          <span className="shrink-0 text-rose-600">{icon}</span>
          <span className="truncate">{title}</span>
        </h2>
        {open && (
          <div className="flex shrink-0 items-center gap-1">
            {headerAction}
            {summary != null && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label={`Collapse ${title}`}
                className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronUp className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {showPlaceholder ? (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed px-4 py-5 text-left transition-colors hover:border-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/10"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30">
            {icon}
          </span>
          <span className="flex-1 font-medium">{placeholder}</span>
          <Plus className="size-4 shrink-0 text-rose-600" />
        </button>
      ) : showSummary ? (
        <div className="rounded-xl border p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-rose-600">{icon}</span>
            <div className="min-w-0 flex-1 space-y-0.5 text-sm text-muted-foreground">
              {summary}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(true)}
              className="shrink-0 rounded px-1 text-sm font-medium text-rose-600 underline underline-offset-2"
            >
              {editLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border p-4 sm:p-5">{children}</div>
      )}
    </section>
  );
}
