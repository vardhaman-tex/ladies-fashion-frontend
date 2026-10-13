"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}

/**
 * Pagination controls bound to the `page` URL search parameter
 * (0-indexed internally, displayed as 1-indexed page numbers).
 */
export function Pagination({ totalPages, currentPage }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  };

  // Previous / position / Next rather than a button per page: a catalogue of
  // thirty pages overflowed a phone, and nobody taps page 17 anyway. The URL
  // still carries ?page=N, so every page stays linkable and crawlable.
  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
      <Button
        variant="outline"
        size="lg"
        className="min-w-28 rounded-full"
        disabled={currentPage <= 0}
        onClick={() => goToPage(currentPage - 1)}
      >
        Previous
      </Button>

      <p className="text-sm text-muted-foreground" aria-current="page">
        Page <span className="font-semibold text-foreground">{currentPage + 1}</span> of {totalPages}
      </p>

      <Button
        size="lg"
        className="min-w-28 rounded-full"
        disabled={currentPage >= totalPages - 1}
        onClick={() => goToPage(currentPage + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
