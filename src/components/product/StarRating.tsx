import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Read-only stars. The accessible name carries the number; the glyphs are decoration. */
export function StarRating({ value, className }: { value: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={cn(
            "size-4",
            n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
          )}
        />
      ))}
    </span>
  );
}
