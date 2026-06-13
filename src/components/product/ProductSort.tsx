"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "RECOMMENDED", label: "Best Match" },
  { value: "NEWEST", label: "New" },
  { value: "PRICE_ASC", label: "Price ↑" },
  { value: "PRICE_DESC", label: "Price ↓" },
  { value: "AVG_RATING", label: "Rating" },
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
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {SORT_OPTIONS.map((option) => {
        const active = currentSort === option.value;
        return (
          <button
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-rose-600 bg-rose-600 text-white"
                : "border-border bg-background text-muted-foreground hover:border-rose-400 hover:text-rose-600"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
