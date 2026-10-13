"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddToCart } from "@/hooks/useCart";
import { useProduct } from "@/hooks/useProducts";
import { dedupeSizes, formatSizeLabel } from "@/lib/catalogueDisplay";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/types/product";

/**
 * "Add to cart" from a product card, for products that need a choice first.
 *
 * The product's colours and per-size stock are only on the detail endpoint, so
 * it is fetched when the popup opens rather than for every card in the grid.
 * Opening it from a card costs one request; the product page then finds the
 * same data already cached.
 */
export function QuickAddDialog({
  product,
  open,
  onClose,
}: {
  product: ProductSummary;
  open: boolean;
  onClose: () => void;
}) {
  const { data: detail, isLoading, isError } = useProduct(product.slug, undefined, open);
  const { mutate: addToCart, isPending } = useAddToCart();

  const variants = useMemo(
    () => (detail?.variants ?? []).filter((variant) => variant.isActive),
    [detail]
  );
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [pickedSize, setPickedSize] = useState<string | null>(null);

  // Until the shopper picks, the first colour with anything in stock is
  // selected for them: most products have one colour, and asking someone to
  // choose from a list of one is a wasted tap.
  const variant =
    variants.find((v) => v.color === pickedColor) ??
    variants.find((v) => v.inStock) ??
    variants[0];
  const sizes = useMemo(() => dedupeSizes(variant?.skus ?? []), [variant]);
  const needsSize = sizes.length > 0;
  const size = sizes.some((s) => s.size === pickedSize) ? pickedSize : null;

  function add() {
    if (!variant || (needsSize && !size)) return;
    addToCart(
      {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        thumbnail: product.thumbnail,
        price: product.price,
        discountAmount: product.discountAmount,
        quantity: 1,
        size: size ?? null,
        color: variant.color,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle className="pr-8 text-base">{product.name}</DialogTitle>
          <DialogDescription>
            ₹{product.finalPrice.toLocaleString("en-IN")}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <p className="py-4 text-sm text-destructive">
            Couldn&apos;t load the options. Please try again.
          </p>
        )}

        {detail && variant && (
          <div className="space-y-4">
            {variants.length > 1 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Colour: <span className="text-foreground normal-case">{variant.color}</span>
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setPickedColor(v.color);
                        setPickedSize(null);
                      }}
                      role="radio"
                      aria-label={`${v.color}${v.inStock ? "" : ", sold out"}`}
                      aria-checked={v.color === variant.color}
                      className={cn(
                        "relative size-12 overflow-hidden rounded-lg border-2 bg-muted",
                        v.color === variant.color ? "border-primary" : "border-transparent",
                        !v.inStock && "opacity-50"
                      )}
                    >
                      {v.images[0]?.imageUrl ? (
                        <Image src={v.images[0].imageUrl} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <span className="text-[10px]">{v.color}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {needsSize && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Select size
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                  {sizes.map((sku) => (
                    <button
                      key={sku.id}
                      type="button"
                      disabled={!sku.inStock}
                      onClick={() => sku.inStock && setPickedSize(sku.size)}
                      role="radio"
                      aria-checked={size === sku.size}
                      aria-label={`${formatSizeLabel(sku.size)}${sku.inStock ? "" : ", sold out"}`}
                      className={cn(
                        "h-11 min-w-11 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                        size === sku.size
                          ? "border-primary bg-primary text-white"
                          : "hover:border-primary",
                        !sku.inStock && "cursor-not-allowed text-muted-foreground/60 line-through hover:border-border"
                      )}
                    >
                      {formatSizeLabel(sku.size)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
              disabled={isPending || (needsSize && !size)}
              onClick={add}
            >
              {isPending ? "Adding…" : needsSize && !size ? "Select a size" : "Add to cart"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
