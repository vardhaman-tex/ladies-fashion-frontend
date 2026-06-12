"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 0}
        onClick={() => goToPage(currentPage - 1)}
      >
        Previous
      </Button>

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          className={cn("w-8")}
          onClick={() => goToPage(page)}
        >
          {page + 1}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages - 1}
        onClick={() => goToPage(currentPage + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
