import { describe, expect, it } from "vitest";

import { categoryPath, usableSubCategories } from "./categories";
import type { Category, SubCategory } from "@/types/category";

function sub(overrides: Partial<SubCategory>): SubCategory {
  return {
    id: crypto.randomUUID(),
    categoryId: "cat",
    name: "Anarkali Suits",
    slug: "anarkali-suits",
    description: null,
    imageUrl: null,
    isActive: true,
    sortOrder: 0,
    ...overrides,
  };
}

function category(subCategories: SubCategory[]): Pick<Category, "subCategories"> {
  return { subCategories };
}

describe("usableSubCategories", () => {
  it("drops a slug that cannot survive a URL", () => {
    // The live catalogue really does contain the slug `"fancy cord set "`.
    const result = usableSubCategories(
      category([
        sub({ name: "Fancy cord set", slug: "fancy cord set " }),
        sub({ name: "Cotton Suits", slug: "cotton-suits" }),
      ])
    );
    expect(result.map((s) => s.slug)).toEqual(["cotton-suits"]);
  });

  it("keeps the clean record when the same name exists twice", () => {
    // Which matters because the clean-slug record is the one the products are
    // attached to; the other leads to an empty page.
    const result = usableSubCategories(
      category([
        sub({ name: "Fancy cord set", slug: "fancy cord set " }),
        sub({ name: "Fancy Cord Set", slug: "fancy-cord-set" }),
      ])
    );
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("fancy-cord-set");
  });

  it("keeps slugs that a previous record left a -1 suffix on", () => {
    // Ugly, but real and working — these are where the products actually live.
    const result = usableSubCategories(
      category([sub({ name: "Anarkali Suits", slug: "anarkali-suits-1" })])
    );
    expect(result.map((s) => s.slug)).toEqual(["anarkali-suits-1"]);
  });

  it("hides deactivated sub-categories", () => {
    const result = usableSubCategories(
      category([sub({ slug: "cotton-suits", isActive: false })])
    );
    expect(result).toEqual([]);
  });

  it("honours sortOrder", () => {
    const result = usableSubCategories(
      category([
        sub({ name: "Straight", slug: "straight-suits", sortOrder: 2 }),
        sub({ name: "Anarkali", slug: "anarkali-suits", sortOrder: 1 }),
      ])
    );
    expect(result.map((s) => s.name)).toEqual(["Anarkali", "Straight"]);
  });

  it("copes with a category that has none, or no category at all", () => {
    expect(usableSubCategories(category([]))).toEqual([]);
    expect(usableSubCategories(null)).toEqual([]);
    expect(usableSubCategories(undefined)).toEqual([]);
  });
});

describe("categoryPath", () => {
  it("builds the browse URL for a category", () => {
    expect(categoryPath("suits")).toBe("/products?categorySlug=suits");
  });

  it("builds the browse URL for one sub-category", () => {
    expect(categoryPath("suits", "anarkali-suits-1")).toBe(
      "/products?categorySlug=suits&subCategorySlug=anarkali-suits-1"
    );
  });

  it("encodes rather than emitting a broken link", () => {
    expect(categoryPath("cord sets")).toBe("/products?categorySlug=cord+sets");
  });
});
