"use client";

import type { ReactNode } from "react";
import { Check, ChevronUp } from "lucide-react";

/**
 * A checkout step that folds away once it holds everything it needs.
 *
 * The point is the second screenful: a customer who has already given their
 * address should not scroll past it again to reach the pay button. When the
 * step is incomplete no summary can be rendered for it, so it simply stays
 * open — there is no way to collapse a step into a half-answer.
 */
export function CheckoutSection({
  id,
  title,
  icon,
  open,
  onOpenChange,
  summary,
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
  /**
   * Shown in place of the body when collapsed. Omitting it means the section
   * has nothing worth summarising yet, and it stays expanded.
   */
  summary?: ReactNode;
  /** Label on the control that reopens a collapsed section. */
  editLabel?: string;
  /** Rendered in the header while the section is open, e.g. an "Add New" button. */
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const collapsed = summary != null && !open;

  return (
    <section id={id} className="rounded-xl border">
      <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5">
        <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold sm:text-lg">
          <span className="flex size-5 shrink-0 items-center justify-center text-rose-600">
            {collapsed ? <Check className="size-5" /> : icon}
          </span>
          <span className="truncate">{title}</span>
        </h2>

        {collapsed ? (
          <button
            type="button"
            onClick={() => onOpenChange(true)}
            className="shrink-0 rounded px-2 py-1 text-sm font-medium text-rose-600 underline-offset-2 hover:underline"
          >
            {editLabel}
          </button>
        ) : (
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

      {collapsed ? (
        <div className="space-y-0.5 border-t px-4 py-3 text-sm text-muted-foreground sm:px-5">
          {summary}
        </div>
      ) : (
        <div className="border-t px-4 py-4 sm:px-5">{children}</div>
      )}
    </section>
  );
}
