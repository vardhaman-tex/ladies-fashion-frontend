"use client";

import { useRouter } from "next/navigation";
import { SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyProductStateProps {
  hasFilters: boolean;
}

/**
 * Empty state shown on the PLP when no products match the current filters.
 */
export function EmptyProductState({ hasFilters }: EmptyProductStateProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <SearchXIcon className="size-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-heading text-lg font-semibold text-foreground">No products found</p>
        <p className="text-sm text-muted-foreground">
          {hasFilters ? "Try adjusting or clearing your filters." : "Check back soon for new arrivals."}
        </p>
      </div>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={() => router.push("?")}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
