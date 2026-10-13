"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/product/WishlistButton";
import { useAddToCart } from "@/hooks/useCart";
import { QuickAddDialog } from "@/components/product/QuickAddDialog";
import type { ProductSummary } from "@/types/product";

interface ProductCardProps {
  product: ProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
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
    <div className="group flex flex-col gap-2">
      <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-muted">
        <Link href={`/products/${product.slug}`} className="absolute inset-0 block">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
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
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Out of stock
            </span>
          </div>
        )}

        {hasDiscount && product.inStock && (
          <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
            {Math.round(product.discountPercent)}% OFF
          </span>
        )}

        <WishlistButton
          productId={product.id}
          productName={product.name}
          productSlug={product.slug}
          thumbnail={product.thumbnail}
          price={product.price}
          discountAmount={product.discountAmount}
          className="absolute top-2 right-2"
        />

      </div>

      <div className="flex flex-col gap-0.5">
        <Link href={`/products/${product.slug}`} className="line-clamp-1 text-sm font-medium text-foreground hover:underline">
          {product.name}
        </Link>

        {hasDiscount ? (
          <div className="flex flex-col gap-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground">
                ₹{product.finalPrice.toLocaleString("en-IN")}
              </span>
              <span className="whitespace-nowrap text-xs font-semibold text-rose-600">
                {Math.round(product.discountPercent)}% off
              </span>
            </div>
            <span className="text-xs text-muted-foreground line-through">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          </div>
        ) : (
          <span className="text-sm font-bold text-foreground">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
        )}
      </div>
      {product.inStock && (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white"
          onClick={handleAddToCart}
          disabled={adding}
        >
          <ShoppingBag className="size-3.5" />
          {adding ? "Adding…" : "Add to Cart"}
        </Button>
      )}

      {needsSelection && (
        <QuickAddDialog product={product} open={pickerOpen} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
