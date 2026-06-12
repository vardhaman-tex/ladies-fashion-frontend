import { useQuery } from "@tanstack/react-query";
import { getSearchSuggestions } from "@/services/productService";

/**
 * Fetches quick search suggestions for the given query, only once the
 * query is at least 2 characters long.
 */
export function useSearchSuggestions(q: string) {
  return useQuery({
    queryKey: ["search", "suggestions", q],
    queryFn: () => getSearchSuggestions(q),
    enabled: q.length >= 2,
  });
}
