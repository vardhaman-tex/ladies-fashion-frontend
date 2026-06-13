"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { XIcon } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

const FILTER_KEYS = [
  "categorySlug",
  "subCategorySlug",
  "color",
  "fabric",
  "occasion",
  "minPrice",
  "maxPrice",
  "inStock",
] as const;

/**
 * Row of removable chips summarizing the active product filters, read from
 * and written back to the URL search params.
 */
export function ActiveFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories } = useCategories();

  const removeParams = (keys: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    keys.forEach((key) => params.delete(key));
    params.delete("page");
    const query = params.toString();
    router.push(query ? `?${query}` : "?");
  };

  const chips: { key: string; label: string; remove: () => void }[] = [];

  const categorySlug = searchParams.get("categorySlug");
  const subCategorySlug = searchParams.get("subCategorySlug");

  if (categorySlug) {
    const category = categories?.find((c) => c.slug === categorySlug);
    chips.push({
      key: "categorySlug",
      label: category?.name ?? categorySlug,
      remove: () => removeParams(["categorySlug", "subCategorySlug"]),
    });
  }

  if (subCategorySlug) {
    const subCategory = categories?.flatMap((c) => c.subCategories).find((sc) => sc.slug === subCategorySlug);
    chips.push({
      key: "subCategorySlug",
      label: subCategory?.name ?? subCategorySlug,
      remove: () => removeParams(["subCategorySlug"]),
    });
  }

  const color = searchParams.get("color");
  if (color) {
    chips.push({ key: "color", label: `Color: ${color}`, remove: () => removeParams(["color"]) });
  }

  const fabric = searchParams.get("fabric");
  if (fabric) {
    chips.push({ key: "fabric", label: `Fabric: ${fabric}`, remove: () => removeParams(["fabric"]) });
  }

  const occasion = searchParams.get("occasion");
  if (occasion) {
    chips.push({ key: "occasion", label: `Occasion: ${occasion}`, remove: () => removeParams(["occasion"]) });
  }

  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice || maxPrice) {
    const label = minPrice && maxPrice ? `₹${minPrice} - ₹${maxPrice}` : minPrice ? `Above ₹${minPrice}` : `Under ₹${maxPrice}`;
    chips.push({ key: "price", label, remove: () => removeParams(["minPrice", "maxPrice"]) });
  }

  if (searchParams.get("inStock") === "true") {
    chips.push({ key: "inStock", label: "In Stock", remove: () => removeParams(["inStock"]) });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.remove}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {chip.label}
          <XIcon className="size-3" />
        </button>
      ))}
      <button
        onClick={() => removeParams([...FILTER_KEYS, "sort"])}
        className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
