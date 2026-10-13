"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import Link from "next/link";
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
import { categoryPath, usableSubCategories } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { PageResponse } from "@/types/api";
import type { Category } from "@/types/category";
import type {
  ProductFilter,
  ProductSort as ProductSortType,
  ProductSummary,
} from "@/types/product";

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

export interface ProductsClientProps {
  /** First page of results, fetched on the server for the same query string. */
  initialProducts?: PageResponse<ProductSummary>;
  initialCategories?: Category[];
  /**
   * The query string the server used when it fetched `initialProducts`.
   * React Query keys results by filter, so the seed data is only handed over
   * when the client is looking at that exact query — otherwise a filter change
   * would briefly render the previous filter's rows as if they were current.
   */
  initialSearch?: string;
}

function ProductsPageContent({
  initialProducts,
  initialCategories,
  initialSearch,
}: ProductsClientProps) {
  const searchParams = useSearchParams();
  const { data: categories } = useCategories(initialCategories);

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
  const seedApplies = initialSearch !== undefined && searchParams.toString() === initialSearch;
  const { data, isLoading } = useProducts(filter, seedApplies ? initialProducts : undefined);

  const category = categories?.find((c) => c.slug === categorySlug);
  const subCategory = category?.subCategories.find((sc) => sc.slug === subCategorySlug);
  const siblingSubCategories = usableSubCategories(category);

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

  const activeFilterCount = FILTER_PARAM_KEYS.filter((key) => key !== "categorySlug" && key !== "subCategorySlug" && searchParams.has(key)).length;
  const hasFilters = FILTER_PARAM_KEYS.some((key) => searchParams.has(key)) || searchParams.has("sort");

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="mt-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>

      {/* Sub-category chips. On mobile the filter panel is behind a button, so
          without this a shopper who lands on Suits from an ad has no visible
          sign that Anarkali, A-Line and Straight are separate things to look
          at. Horizontally scrollable rather than wrapping, so a category with
          five sub-categories does not push the products off the first screen. */}
      {category && siblingSubCategories.length > 0 && (
        <div className="-mx-4 mt-3 overflow-x-auto px-4">
          <div className="flex w-max gap-2 pb-1">
            <Link
              href={categoryPath(category.slug)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
                subCategory
                  ? "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                  : "border-primary bg-primary text-primary-foreground"
              )}
            >
              All {category.name}
            </Link>
            {siblingSubCategories.map((sub) => (
              <Link
                key={sub.id}
                href={categoryPath(category.slug, sub.slug)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  subCategory?.id === sub.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                )}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-4">
            <ProductFilters />
          </div>
        </aside>

        <div className="flex flex-col gap-4">
          {/* Sticky on a phone: Filter and the sort chips stay under the header
              while the grid scrolls, so changing the order never means scrolling
              back to the top. */}
          <div className="sticky top-[7.25rem] z-30 -mx-4 flex flex-col gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:top-[4.25rem] lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger render={<Button variant="outline" className="h-10 shrink-0 gap-1.5 rounded-full px-4 lg:hidden" />}>
                  <SlidersHorizontalIcon className="size-4" aria-hidden="true" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
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
              <ProductSort />
            </div>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {isLoading ? "Loading…" : `${data?.totalElements ?? 0} products`}
            </p>
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

export default function ProductsClient(props: ProductsClientProps) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductsPageContent {...props} />
    </Suspense>
  );
}
