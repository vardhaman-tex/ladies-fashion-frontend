"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { usableSubCategories } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";
import { useProductFacets } from "@/hooks/useProducts";
import type { ProductFacet } from "@/types/product";

const PRICE_PRESETS = [
  { label: "Under ₹500", min: "", max: "500" },
  { label: "₹500–₹1000", min: "500", max: "1000" },
  { label: "₹1000–₹2000", min: "1000", max: "2000" },
  { label: "₹2000+", min: "2000", max: "" },
];

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <button
        className="flex w-full items-center justify-between py-3 text-sm font-semibold"
        onClick={() => setOpen(!open)}
      >
        {title}
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-rose-600 bg-rose-600 text-white"
          : "border-border bg-background text-foreground hover:border-rose-400 hover:text-rose-600"
      )}
    >
      {label}
    </button>
  );
}

/**
 * One facet group, rendered only when the catalogue has something in it.
 *
 * The count is shown because "Cotton (14)" and "Velvet (1)" are different
 * propositions, and a shopper deciding where to spend a click deserves to know
 * which is which.
 */
function FacetSection({
  title,
  facets,
  loading,
  selected,
  onToggle,
}: {
  title: string;
  facets: ProductFacet[] | undefined;
  loading: boolean;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  // While loading, nothing is shown rather than an empty section that would
  // pop into existence a moment later and shift everything below it.
  if (loading || !facets || facets.length === 0) return null;

  return (
    <FilterSection title={title} defaultOpen={false}>
      <div className="flex flex-wrap gap-2">
        {facets.map((facet) => (
          <Chip
            key={facet.value}
            label={`${facet.value} (${facet.count})`}
            active={selected.includes(facet.value.toLowerCase())}
            onClick={() => onToggle(facet.value)}
          />
        ))}
      </div>
    </FilterSection>
  );
}

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories } = useCategories();
  const { data: facets, isLoading: facetsLoading } = useProductFacets();

  const currentCategory = searchParams.get("categorySlug");
  const currentSubCategory = searchParams.get("subCategorySlug");
  const currentColors = searchParams.get("color")?.toLowerCase().split(",").filter(Boolean) ?? [];
  const currentFabrics = searchParams.get("fabric")?.toLowerCase().split(",").filter(Boolean) ?? [];
  const currentOccasions = searchParams.get("occasion")?.toLowerCase().split(",").filter(Boolean) ?? [];
  const currentMin = searchParams.get("minPrice") ?? "";
  const currentMax = searchParams.get("maxPrice") ?? "";
  const inStock = searchParams.get("inStock") === "true";

  const updateParam = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const toggleChip = (key: string, value: string) => {
    const existing = searchParams.get(key)?.toLowerCase().split(",").filter(Boolean) ?? [];
    const val = value.toLowerCase();
    const updated = existing.includes(val)
      ? existing.filter((v) => v !== val)
      : [...existing, val];
    updateParam({ [key]: updated.length > 0 ? updated.join(",") : null });
  };

  const setPrice = (min: string, max: string) => {
    const currentPreset = PRICE_PRESETS.find(
      (p) => p.min === currentMin && p.max === currentMax
    );
    const selectedPreset = PRICE_PRESETS.find((p) => p.min === min && p.max === max);
    if (currentPreset === selectedPreset) {
      updateParam({ minPrice: null, maxPrice: null });
    } else {
      updateParam({ minPrice: min || null, maxPrice: max || null });
    }
  };

  const clearAll = () => {
    router.push("?");
  };

  const hasFilters =
    currentCategory || currentColors.length > 0 || currentFabrics.length > 0 ||
    currentOccasions.length > 0 || currentMin || currentMax || inStock;

  return (
    <div className="flex flex-col gap-0">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Filters</span>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700"
          >
            <X className="size-3" /> Clear all
          </button>
        )}
      </div>

      {/* Category */}
      {categories && categories.length > 0 && (
        <FilterSection title="Category">
          <div className="flex flex-col gap-0.5">
            <button
              className={cn(
                "rounded px-2 py-1.5 text-left text-sm transition-colors",
                !currentCategory
                  ? "bg-rose-50 font-semibold text-rose-700 dark:bg-rose-950/30"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => updateParam({ categorySlug: null, subCategorySlug: null })}
            >
              All
            </button>
            {categories.map((cat) => {
              const isOpen = currentCategory === cat.slug;
              const subs = isOpen ? usableSubCategories(cat) : [];
              return (
                <div key={cat.id}>
                  <button
                    className={cn(
                      "w-full rounded px-2 py-1.5 text-left text-sm transition-colors",
                      isOpen
                        ? "bg-rose-50 font-semibold text-rose-700 dark:bg-rose-950/30"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() =>
                      updateParam({
                        categorySlug: isOpen ? null : cat.slug,
                        subCategorySlug: null,
                      })
                    }
                  >
                    {cat.name}
                  </button>

                  {/* Sub-categories appear only under the open category. Showing
                      every sub-category of every category at once would be a
                      wall of options; showing them on selection turns the
                      filter into a path the shopper is already walking. */}
                  {subs.length > 0 && (
                    <div className="mt-0.5 flex flex-col gap-0.5 border-l pl-3">
                      {subs.map((sub) => {
                        const active = currentSubCategory === sub.slug;
                        return (
                          <button
                            key={sub.id}
                            className={cn(
                              "rounded px-2 py-1 text-left text-sm transition-colors",
                              active
                                ? "font-semibold text-rose-700 dark:text-rose-400"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() =>
                              updateParam({
                                categorySlug: cat.slug,
                                subCategorySlug: active ? null : sub.slug,
                              })
                            }
                          >
                            {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Price */}
      <FilterSection title="Price">
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => {
            const active = preset.min === currentMin && preset.max === currentMax;
            return (
              <Chip
                key={preset.label}
                label={preset.label}
                active={active}
                onClick={() => setPrice(preset.min, preset.max)}
              />
            );
          })}
        </div>
      </FilterSection>

      {/*
        Colour, fabric and occasion come from the catalogue.

        Each was a hardcoded list — Velvet, Net, Bridal, Beach — with nothing
        checking that a product matched, so picking one of them produced an
        empty grid. A filter that leads nowhere reads as a broken shop rather
        than an empty result, and it wastes the one bit of intent the shopper
        gave us. A section with nothing behind it now does not render at all.
      */}
      <FacetSection
        title="Color"
        facets={facets?.colors}
        loading={facetsLoading}
        selected={currentColors}
        onToggle={(value) => toggleChip("color", value)}
      />

      <FacetSection
        title="Fabric"
        facets={facets?.fabrics}
        loading={facetsLoading}
        selected={currentFabrics}
        onToggle={(value) => toggleChip("fabric", value)}
      />

      <FacetSection
        title="Occasion"
        facets={facets?.occasions}
        loading={facetsLoading}
        selected={currentOccasions}
        onToggle={(value) => toggleChip("occasion", value)}
      />

      {/* In Stock */}
      <FilterSection title="Availability" defaultOpen={false}>
        <label className="flex cursor-pointer items-center gap-2.5">
          <div
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              inStock ? "bg-rose-600" : "bg-muted-foreground/30"
            )}
            onClick={() => updateParam({ inStock: inStock ? null : "true" })}
          >
            <div
              className={cn(
                "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                inStock ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </div>
          <span className="text-sm text-foreground">In stock only</span>
        </label>
      </FilterSection>
    </div>
  );
}
