"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Pagination } from "@/components/common/Pagination";
import { ProductGridSkeleton } from "@/components/common/LoadingSkeleton";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductSort } from "@/components/product/ProductSort";
import { searchProducts } from "@/services/productService";
import type { ProductFilter, ProductSort as ProductSortType } from "@/types/product";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const filter: ProductFilter = {
    sort: (searchParams.get("sort") as ProductSortType) ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 0,
  };

  const currentPage = filter.page ?? 0;

  const { data, isLoading } = useQuery({
    queryKey: ["search", q, filter],
    queryFn: () => searchProducts(q, filter),
    enabled: !!q,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Search results for: &ldquo;{q}&rdquo;
      </h1>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${data?.totalElements ?? 0} products found`}
          </p>
          <ProductSort />
        </div>

        {isLoading ? (
          <ProductGridSkeleton />
        ) : (
          <>
            <ProductGrid products={data?.content ?? []} />
            <Pagination totalPages={data?.totalPages ?? 0} currentPage={currentPage} />
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}
