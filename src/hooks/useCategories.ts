import { useQuery } from "@tanstack/react-query";
import { getCategories, getCategory } from "@/services/categoryService";
import { getAdminCategories } from "@/services/adminCategoryService";

/**
 * Fetches all active categories with their sub-categories.
 */
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
}

/**
 * Fetches all categories (including inactive ones) for admin management screens.
 */
export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: getAdminCategories,
  });
}

/**
 * Fetches a single category by its slug.
 */
export function useCategory(slug: string) {
  return useQuery({
    queryKey: ["categories", slug],
    queryFn: () => getCategory(slug),
    enabled: !!slug,
  });
}
