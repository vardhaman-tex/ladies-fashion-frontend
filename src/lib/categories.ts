import type { Category, SubCategory } from "@/types/category";

/**
 * Which sub-categories are safe to put in front of a shopper.
 *
 * The sub-category data has been edited by hand for a while and shows it. Two
 * records exist for "Fancy Cord Set" — one with the slug `fancy-cord-set` and
 * one with the literal slug `"fancy cord set "`, spaces and all. The second has
 * no products attached to it, so surfacing it would put a link in the nav that
 * leads to an empty page, and a slug containing spaces cannot round-trip
 * through a query string cleanly in the first place.
 *
 * This filters at the display layer rather than waiting for a data cleanup,
 * because the nav is going in now. The records still want fixing — this just
 * means a shopper is not the one who finds out.
 */

/** A slug that can survive being put in a URL and read back out. */
const CLEAN_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isUsable(sub: SubCategory): boolean {
  return sub.isActive && CLEAN_SLUG.test(sub.slug);
}

/**
 * Active sub-categories with a usable slug, one per name.
 *
 * Where the same name exists twice, the record with the clean slug wins — which
 * is also, in the one case this currently applies to, the record the products
 * are actually attached to.
 */
export function usableSubCategories(
  category: Pick<Category, "subCategories"> | null | undefined
): SubCategory[] {
  const byName = new Map<string, SubCategory>();
  for (const sub of category?.subCategories ?? []) {
    if (!isUsable(sub)) continue;
    const key = sub.name.trim().toLowerCase();
    if (!byName.has(key)) byName.set(key, sub);
  }
  return [...byName.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** The browse URL for a category, or for one sub-category within it. */
export function categoryPath(categorySlug: string, subCategorySlug?: string): string {
  const params = new URLSearchParams({ categorySlug });
  if (subCategorySlug) params.set("subCategorySlug", subCategorySlug);
  return `/products?${params.toString()}`;
}
