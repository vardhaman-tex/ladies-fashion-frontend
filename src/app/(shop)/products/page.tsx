"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/common/Breadcrumbs";
import { Pagination } from "@/components/common/Pagination";
import { ProductGridSkeleton } from "@/components/common/LoadingSkeleton";
import { ActiveFilters } from "@/components/product/ActiveFilters";
import { EmptyProductState } from "@/components/product/EmptyProductState";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductSort } from "@/components/product/ProductSort";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import type { ProductFilter, ProductSort as ProductSortType } from "@/types/product";

const FILTER_PARAM_KEYS = [
  "categorySlug",
  "subCategorySlug",
  "color",
  "fabric",
  "occasion",
  "minPrice",
  "maxPrice",
  "inStock",
];

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const { data: categories } = useCategories();

  const categorySlug = searchParams.get("categorySlug");
  const subCategorySlug = searchParams.get("subCategorySlug");

  const filter: ProductFilter = {
    categorySlug: categorySlug ?? undefined,
    subCategorySlug: subCategorySlug ?? undefined,
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

  const category = categories?.find((c) => c.slug === categorySlug);
  const subCategory = category?.subCategories.find((sc) => sc.slug === subCategorySlug);

  const title = subCategory?.name ?? category?.name ?? "All Products";

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Products", href: category || subCategory ? "/products" : undefined },
  ];
  if (category) {
    breadcrumbs.push({
      label: category.name,
      href: subCategory ? `/products?categorySlug=${category.slug}` : undefined,
    });
  }
  if (subCategory) {
    breadcrumbs.push({ label: subCategory.name });
  }

  const hasFilters = FILTER_PARAM_KEYS.some((key) => searchParams.has(key)) || searchParams.has("sort");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="mt-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-4">
            <ProductFilters />
          </div>
        </aside>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {/* Top bar: count + mobile filter button */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading…" : `${data?.totalElements ?? 0} products`}
              </p>
              <Sheet>
                <SheetTrigger render={<Button variant="outline" size="sm" className="gap-1.5 lg:hidden" />}>
                  <SlidersHorizontalIcon className="size-3.5" />
                  Filter &amp; Sort
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
                  <SheetHeader className="px-4 pb-2 pt-4">
                    <SheetTitle>Filter &amp; Sort</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-6 px-4 pb-6">
                    <div>
                      <p className="mb-2 text-sm font-semibold">Sort by</p>
                      <ProductSort />
                    </div>
                    <ProductFilters />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop sort chips */}
            <div className="hidden lg:block">
              <ProductSort />
            </div>
          </div>

          <ActiveFilters />

          {isLoading ? (
            <ProductGridSkeleton />
          ) : data?.content.length === 0 ? (
            <EmptyProductState hasFilters={hasFilters} />
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
