import Image from "next/image";
import Link from "next/link";
import { ShoppingCartIcon, StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductSummary } from "@/types/product";

interface ProductCardProps {
  product: ProductSummary;
}

/**
 * Card summarizing a product in a grid, with pricing, rating, and a quick
 * add-to-cart action.
 */
export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.discountAmount > 0;

  return (
    <div className="group flex flex-col gap-2">
      <Link href={`/products/${product.slug}`} className="relative block aspect-3/4 overflow-hidden rounded-xl bg-muted">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Out of stock
            </span>
          </div>
        )}

        {hasDiscount && product.inStock && (
          <span className="absolute top-2 left-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
            {Math.round(product.discountPercent)}% OFF
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-1">
        <Link href={`/products/${product.slug}`} className="line-clamp-1 text-sm font-medium hover:underline">
          {product.name}
        </Link>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
          <span>{product.avgRating.toFixed(1)}</span>
          <span>({product.reviewCount})</span>
        </div>

        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-sm text-muted-foreground line-through">₹{product.price.toFixed(2)}</span>
              <span className="text-sm font-semibold text-destructive">₹{product.finalPrice.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-sm font-semibold">₹{product.price.toFixed(2)}</span>
          )}
        </div>
      </div>

      <Button size="sm" variant="outline" disabled={!product.inStock} className="w-full">
        <ShoppingCartIcon />
        Add to Cart
      </Button>
    </div>
  );
}
