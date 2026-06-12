"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "NEWEST", label: "Newest" },
  { value: "PRICE_ASC", label: "Price: Low to High" },
  { value: "PRICE_DESC", label: "Price: High to Low" },
  { value: "AVG_RATING", label: "Top Rated" },
  { value: "BEST_SELLING", label: "Best Selling" },
];

/**
 * Sort dropdown bound to the `sort` URL search parameter.
 */
export function ProductSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "NEWEST";

  const handleChange = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "NEWEST") {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <Select value={currentSort} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
