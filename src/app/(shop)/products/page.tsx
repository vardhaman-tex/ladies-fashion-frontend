"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Pagination } from "@/components/common/Pagination";
import { ProductGridSkeleton } from "@/components/common/LoadingSkeleton";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductSort } from "@/components/product/ProductSort";
import { useProducts } from "@/hooks/useProducts";
import type { ProductFilter, ProductSort as ProductSortType } from "@/types/product";

function ProductsPageContent() {
  const searchParams = useSearchParams();

  const filter: ProductFilter = {
    categorySlug: searchParams.get("categorySlug") ?? undefined,
    subCategorySlug: searchParams.get("subCategorySlug") ?? undefined,
    color: searchParams.get("color") ?? undefined,
    fabric: searchParams.get("fabric") ?? undefined,
    occasion: searchParams.get("occasion") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    inStock: searchParams.get("inStock") === "true" ? true : undefined,
    sort: (searchParams.get("sort") as ProductSortType) ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 0,
  };

  const currentPage = filter.page ?? 0;
  const { data, isLoading } = useProducts(filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">All Products</h1>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <ProductFilters />

        <div className="flex flex-col gap-4">
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
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductsPageContent />
    </Suspense>
  );
}
