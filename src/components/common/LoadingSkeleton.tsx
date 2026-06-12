import { cn } from "@/lib/utils";

/**
 * Pulsing placeholder block used to build skeleton layouts.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/**
 * Skeleton placeholder matching the shape of a {@link ProductCard}.
 */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-3/4 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/**
 * Renders a grid of {@link ProductCardSkeleton}s while products are loading.
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export { Skeleton };
