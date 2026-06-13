import { cn } from "@/lib/utils";

/**
 * Skeleton block with a shimmer sweep animation.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("shimmer-base rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/** Skeleton matching the shape of a ProductCard */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-3/4 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

/** Grid of ProductCardSkeletons */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton for a single order card row */
export function OrderCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <Skeleton className="size-16 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

/** Skeleton for an address card */
export function AddressCardSkeleton() {
  return (
    <div className="rounded-xl border p-4 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

/** Skeleton for an order detail page */
export function OrderDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <Skeleton className="h-4 w-28" />
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="rounded-xl border overflow-hidden">
        <Skeleton className="h-14 w-full" />
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4 p-4 border-t">
            <Skeleton className="size-16 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { Skeleton };
