import { ProductCard } from "@/components/product/ProductCard";
import type { ProductSummary } from "@/types/product";

interface ProductStripProps {
  products: ProductSummary[];
}

/**
 * Horizontal scroll on mobile (smaller cards), 4-column grid on desktop.
 */
export function ProductStrip({ products }: ProductStripProps) {
  if (products.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No products found.</p>;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
      {products.map((product) => (
        <div key={product.id} className="w-36 shrink-0 sm:w-44 md:w-auto">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
