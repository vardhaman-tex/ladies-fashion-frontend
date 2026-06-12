import { useQuery } from "@tanstack/react-query";
import { getCategories, getCategory } from "@/services/categoryService";

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
 * Fetches a single category by its slug.
 */
export function useCategory(slug: string) {
  return useQuery({
    queryKey: ["categories", slug],
    queryFn: () => getCategory(slug),
    enabled: !!slug,
  });
}
