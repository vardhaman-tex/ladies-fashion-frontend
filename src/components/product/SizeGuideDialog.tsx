"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Body measurements, in inches, for S through 4XL.
 *
 * Deliberately body rather than garment measurements: this tells a customer
 * which size to pick by measuring herself, which is the question she is
 * actually asking at the size selector. A garment chart answers a different
 * question and mixing the two is how "I ordered my usual size" becomes a
 * return.
 *
 * One chart for the whole catalogue. If Suits and Sarees ever need to diverge,
 * this wants to move onto the product and be passed in — the component already
 * takes its rows from one place, so that is a prop change rather than a rewrite.
 */
const SIZE_ROWS: ReadonlyArray<{ size: string; bust: number; waist: number }> = [
  { size: "S", bust: 36, waist: 32 },
  { size: "M", bust: 38, waist: 34 },
  { size: "L", bust: 40, waist: 36 },
  { size: "XL", bust: 42, waist: 38 },
  { size: "XXL", bust: 44, waist: 40 },
  { size: "3XL", bust: 46, waist: 42 },
  { size: "4XL", bust: 48, waist: 44 },
];

export function SizeGuideDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes, and focus moves into the dialog so a keyboard user is not
  // left tabbing through the page behind it.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      {/* Bottom sheet on a phone, centred dialog from sm up — the size selector
          is most often tapped on a phone, where a centred box means reaching. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        className="w-full max-w-md rounded-t-2xl bg-background p-5 shadow-xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-4">
          <h2 id="size-guide-title" className="font-heading text-lg font-bold">
            Women&apos;s Kurti Size Guide
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="-mr-1 -mt-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Measure yourself and pick the row closest to your measurements.
        </p>

        {/* Own scroll container so a narrow phone scrolls the table rather
            than the page sideways. */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Body measurements in inches for sizes S to 4XL
            </caption>
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th scope="col" className="pb-2 pr-4 font-medium">Size</th>
                <th scope="col" className="pb-2 pr-4 font-medium">Bust (in)</th>
                <th scope="col" className="pb-2 font-medium">Waist (in)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {SIZE_ROWS.map((row) => (
                <tr key={row.size}>
                  <th scope="row" className="py-2.5 pr-4 text-left font-semibold text-foreground">
                    {row.size}
                  </th>
                  <td className="py-2.5 pr-4 text-foreground">{row.bust}</td>
                  <td className="py-2.5 text-foreground">{row.waist}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* The distinction that keeps this honest. Saying it once, plainly,
            costs a line and saves an argument after delivery. */}
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          These are <span className="font-medium text-foreground">body measurements in inches</span>,
          not the measurements of the garment itself. If you are between two sizes, choose the larger one.
        </p>
      </div>
    </div>
  );
}
