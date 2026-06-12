import { ProductCard } from "@/components/product/ProductCard";
import type { ProductSummary } from "@/types/product";

interface ProductGridProps {
  products: ProductSummary[];
}

/**
 * Responsive grid of {@link ProductCard}s.
 */
export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No products found.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
