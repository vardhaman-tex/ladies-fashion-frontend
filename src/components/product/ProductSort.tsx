"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// AVG_RATING is deliberately absent.
//
// There is no Review entity anywhere in the backend: Product.avgRating and
// reviewCount are plain columns an admin can type into, so this chip sorted
// the catalogue by a hand-entered number and presented it as customer
// opinion. The API still accepts the sort, so the chip can come back the day
// real reviews land behind it.
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "RECOMMENDED", label: "Best Match" },
  { value: "NEWEST", label: "New" },
  { value: "PRICE_ASC", label: "Price ↑" },
  { value: "PRICE_DESC", label: "Price ↓" },
];

export function ProductSort({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "RECOMMENDED";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "RECOMMENDED") {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    params.delete("page");
    router.push(params.toString() ? `?${params.toString()}` : "?");
  };

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto [scrollbar-width:none] lg:flex-wrap [&::-webkit-scrollbar]:hidden", className)}>
      {SORT_OPTIONS.map((option) => {
        const active = currentSort === option.value;
        return (
          <button
            key={option.value}
            aria-pressed={active}
            onClick={() => handleChange(option.value)}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors lg:h-8 lg:px-3 lg:text-xs",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
