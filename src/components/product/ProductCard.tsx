"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/product/WishlistButton";
import { useAddToCart } from "@/hooks/useCart";
import { QuickAddDialog } from "@/components/product/QuickAddDialog";
import type { ProductSummary } from "@/types/product";

interface ProductCardProps {
  product: ProductSummary;
  /** A short label for the photo corner, set only where the list is the claim (New, Bestseller). */
  badge?: string;
}

export function ProductCard({ product, badge }: ProductCardProps) {
  const hasDiscount = product.discountAmount > 0;
  const { mutate: addToCart, isPending: adding } = useAddToCart();

  // Does the shopper need to make a choice we can't make for them?
  const needsSelection = product.hasSizes || product.colors.length > 1;

  const [pickerOpen, setPickerOpen] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Sizes or several colours: ask here, in a popup, instead of sending the
    // shopper to the product page and losing their place in the grid.
    if (needsSelection) {
      setPickerOpen(true);
      return;
    }
    addToCart({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      thumbnail: product.thumbnail,
      price: product.price,
      discountAmount: product.discountAmount,
      quantity: 1,
      size: null,
      color: product.colors[0]?.color ?? null,
    });
  };

  return (
    // Photo first. No box around the card: the picture is the card, and the
    // details sit under it like a lookbook caption.
    <div className="group flex h-full flex-col gap-2">
      <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-muted">
        <Link href={`/products/${product.slug}`} className="absolute inset-0 block" aria-label={product.name}>
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </Link>

        {!product.inStock && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60">
            <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-sm">
              Out of stock
            </span>
          </div>
        )}

        {badge && product.inStock && (
          <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-background px-2.5 py-1 text-[11px] leading-none font-semibold text-primary shadow-sm">
            {badge}
          </span>
        )}

        <WishlistButton
          productId={product.id}
          productName={product.name}
          productSlug={product.slug}
          thumbnail={product.thumbnail}
          price={product.price}
          discountAmount={product.discountAmount}
          className="absolute top-1 right-1"
        />

        {product.inStock && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-2 bottom-2 size-11 rounded-full bg-background/95 text-primary shadow-md hover:bg-background"
            onClick={handleAddToCart}
            disabled={adding}
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-0.5">
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-sm leading-snug text-foreground hover:underline"
        >
          {product.name}
        </Link>

        {product.reviewCount > 0 && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
            <span className="font-medium text-foreground">{product.avgRating.toFixed(1)}</span>
            <span aria-label={`${product.reviewCount} reviews`}>({product.reviewCount})</span>
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-base font-bold text-foreground">
            ₹{product.finalPrice.toLocaleString("en-IN")}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          )}
        </div>
        {hasDiscount && (
          <p className="text-xs font-semibold text-success">
            {Math.round(product.discountPercent)}% off · You save ₹{product.discountAmount.toLocaleString("en-IN")}
          </p>
        )}
      </div>

      {needsSelection && (
        <QuickAddDialog product={product} open={pickerOpen} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
