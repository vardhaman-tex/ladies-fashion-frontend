"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/useCategories";

/**
 * Sidebar of filter controls (category, price, color, fabric, occasion,
 * stock) that read from and write to the URL search params.
 */
export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories } = useCategories();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [color, setColor] = useState(searchParams.get("color") ?? "");
  const [fabric, setFabric] = useState(searchParams.get("fabric") ?? "");
  const [occasion, setOccasion] = useState(searchParams.get("occasion") ?? "");

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const applyPriceRange = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set("minPrice", minPrice); else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice); else params.delete("maxPrice");
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const applyText = (key: string, value: string) => {
    updateParam(key, value.trim() || null);
  };

  const currentCategory = searchParams.get("categorySlug");
  const inStock = searchParams.get("inStock") === "true";

  const clearAll = () => {
    router.push("?");
    setMinPrice("");
    setMaxPrice("");
    setColor("");
    setFabric("");
    setOccasion("");
  };

  return (
    <aside className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Clear all
        </Button>
      </div>

      <Accordion defaultValue={["category", "price"]} multiple>
        <AccordionItem value="category">
          <AccordionTrigger>Category</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-1">
              {categories?.map((category) => (
                <button
                  key={category.id}
                  className={`text-left text-sm ${currentCategory === category.slug ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => updateParam("categorySlug", currentCategory === category.slug ? null : category.slug)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onBlur={applyPriceRange}
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={applyPriceRange}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="color">
          <AccordionTrigger>Color</AccordionTrigger>
          <AccordionContent>
            <Input
              placeholder="e.g. red"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              onBlur={() => applyText("color", color)}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fabric">
          <AccordionTrigger>Fabric</AccordionTrigger>
          <AccordionContent>
            <Input
              placeholder="e.g. cotton"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              onBlur={() => applyText("fabric", fabric)}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="occasion">
          <AccordionTrigger>Occasion</AccordionTrigger>
          <AccordionContent>
            <Input
              placeholder="e.g. wedding"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              onBlur={() => applyText("occasion", occasion)}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="stock">
          <AccordionTrigger>Availability</AccordionTrigger>
          <AccordionContent>
            <Label className="flex items-center gap-2 text-sm font-normal">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => updateParam("inStock", e.target.checked ? "true" : null)}
              />
              In Stock only
            </Label>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
