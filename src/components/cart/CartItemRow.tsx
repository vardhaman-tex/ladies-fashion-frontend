"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRemoveCartItem, useUpdateCartItem } from "@/hooks/useCart";
import { useDebouncedQuantity } from "@/hooks/useDebouncedQuantity";
import { formatVariantSummary } from "@/lib/catalogueDisplay";
import { inr } from "@/lib/money";
import { useAuthStore } from "@/stores/authStore";
import type { CartItemData } from "@/types/cart";

interface CartItemRowProps {
  item: CartItemData;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { mutate: update } = useUpdateCartItem();
  const { mutate: remove, isPending: removing } = useRemoveCartItem();

  const { quantity: displayQty, change } = useDebouncedQuantity(item.quantity, (quantity) => {
    update({
      itemId: item.id,
      quantity,
      ...(!isAuthenticated && { productId: item.productId, size: item.size, color: item.color }),
    });
  });

  const changeQty = (delta: number) => {
    const newQty = displayQty + delta;
    if (newQty < 1) return;
    if (item.availableQty !== undefined && newQty > item.availableQty) return;
    change(newQty);
  };

  const onRemove = () =>
    remove({
      itemId: item.id,
      ...(!isAuthenticated && { productId: item.productId, size: item.size, color: item.color }),
    });

  const atStockLimit = item.availableQty !== undefined && displayQty >= item.availableQty;
  const overStock = item.availableQty !== undefined && item.quantity > item.availableQty;
  const lowStock = item.availableQty !== undefined && !overStock && item.availableQty <= 10;

  return (
    <div className="py-4">
    <div className="flex gap-3">
      {/* Thumbnail */}
      <Link href={`/products/${item.productSlug}`} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.thumbnail ? (
          <Image src={item.thumbnail} alt={item.productName} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
        )}
      </Link>

      {/* Details: name and variant on top, then price, then the controls, so the
          name gets the full width instead of sharing a row with the stepper. */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/products/${item.productSlug}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:underline"
        >
          {item.productName}
        </Link>

        {(item.size || item.color) && (
          <p className="text-xs text-muted-foreground">
            {formatVariantSummary(item.size, item.color)}
          </p>
        )}

        {overStock && (
          <p className="text-xs font-medium text-destructive">
            Only {item.availableQty} left — please reduce quantity
          </p>
        )}
        {lowStock && (
          <p className="text-xs font-medium text-warning">Only {item.availableQty} left!</p>
        )}

        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold">{inr(item.finalPrice)}</span>
            {item.discountAmount > 0 && (
              <span className="text-xs text-muted-foreground line-through">{inr(item.price)}</span>
            )}
          </div>
          {displayQty > 1 && (
            <span className="text-xs text-muted-foreground">
              Total <span className="font-semibold text-foreground">{inr(item.finalPrice * displayQty)}</span>
            </span>
          )}
        </div>

      </div>
    </div>

    {/* Controls get a full-width row of their own: beside the thumbnail they
        do not fit at 320px. */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-full border">
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-full"
              onClick={() => changeQty(-1)}
              disabled={displayQty <= 1}
              aria-label={`Decrease quantity of ${item.productName}`}
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-7 text-center text-sm font-medium tabular-nums" aria-live="polite">
              {displayQty}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-full"
              onClick={() => changeQty(1)}
              disabled={atStockLimit}
              aria-label={`Increase quantity of ${item.productName}`}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            className="h-10 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            disabled={removing}
            aria-label={`Remove ${item.productName} from cart`}
          >
            <Trash2 className="size-4" />
            Remove
          </Button>
        </div>
    </div>
  );
}
