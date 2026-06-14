"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";

const COLORS = ["Red", "Pink", "Blue", "Green", "Black", "White", "Yellow", "Orange", "Purple", "Beige", "Brown", "Grey"];
const FABRICS = ["Cotton", "Silk", "Georgette", "Chiffon", "Linen", "Polyester", "Rayon", "Velvet", "Net", "Crepe"];
const OCCASIONS = ["Casual", "Festive", "Wedding", "Party", "Office", "Beach", "Traditional", "Bridal"];
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

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories } = useCategories();

  const currentCategory = searchParams.get("categorySlug");
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
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={cn(
                  "rounded px-2 py-1.5 text-left text-sm transition-colors",
                  currentCategory === cat.slug
                    ? "bg-rose-50 font-semibold text-rose-700 dark:bg-rose-950/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() =>
                  updateParam({
                    categorySlug: currentCategory === cat.slug ? null : cat.slug,
                    subCategorySlug: null,
                  })
                }
              >
                {cat.name}
              </button>
            ))}
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

      {/* Color */}
      <FilterSection title="Color" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <Chip
              key={color}
              label={color}
              active={currentColors.includes(color.toLowerCase())}
              onClick={() => toggleChip("color", color)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Fabric */}
      <FilterSection title="Fabric" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {FABRICS.map((fabric) => (
            <Chip
              key={fabric}
              label={fabric}
              active={currentFabrics.includes(fabric.toLowerCase())}
              onClick={() => toggleChip("fabric", fabric)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Occasion */}
      <FilterSection title="Occasion" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((occasion) => (
            <Chip
              key={occasion}
              label={occasion}
              active={currentOccasions.includes(occasion.toLowerCase())}
              onClick={() => toggleChip("occasion", occasion)}
            />
          ))}
        </div>
      </FilterSection>

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
