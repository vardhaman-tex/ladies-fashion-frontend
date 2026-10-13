"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchSuggestions } from "@/hooks/useSearch";
import { gaSearch } from "@/lib/ga";
import { cn } from "@/lib/utils";

/**
 * Debounced search input with a keyboard-navigable suggestions dropdown.
 */
export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [] } = useSearchSuggestions(debouncedQuery);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToSearch = (q: string) => {
    if (!q.trim()) return;
    // Reported on submit, not per keystroke: the debounced suggestion query
    // fires as she types, and counting those would make `search` a measure of
    // typing speed rather than of intent.
    gaSearch(q);
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const goToProduct = (slug: string) => {
    setIsOpen(false);
    router.push(`/products/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        goToProduct(suggestions[activeIndex].slug);
      } else {
        goToSearch(query);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for products..."
          aria-label="Search products"
          className="h-11 rounded-full border-border bg-card pl-10 text-base md:h-10 md:text-sm"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute top-full z-50 mt-1 w-full rounded-lg border border-border bg-popover p-1 shadow-md">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id}>
              <button
                className={cn(
                  "min-h-11 w-full rounded-md px-3 py-2 text-left text-sm",
                  index === activeIndex ? "bg-muted" : "hover:bg-muted"
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => goToProduct(suggestion.slug)}
              >
                {suggestion.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
