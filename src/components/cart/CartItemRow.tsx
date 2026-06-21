"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRemoveCartItem, useUpdateCartItem } from "@/hooks/useCart";
import { useAuthStore } from "@/stores/authStore";
import type { CartItemData } from "@/types/cart";

interface CartItemRowProps {
  item: CartItemData;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { mutate: update, isPending: updating } = useUpdateCartItem();
  const { mutate: remove, isPending: removing } = useRemoveCartItem();

  const changeQty = (delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    update({
      itemId: item.id,
      quantity: newQty,
      ...(!isAuthenticated && { productId: item.productId, size: item.size, color: item.color }),
    });
  };

  const onRemove = () =>
    remove({
      itemId: item.id,
      ...(!isAuthenticated && { productId: item.productId, size: item.size, color: item.color }),
    });

  const atStockLimit = item.availableQty !== undefined && item.quantity >= item.availableQty;
  const overStock = item.availableQty !== undefined && item.quantity > item.availableQty;
  const lowStock = item.availableQty !== undefined && !overStock && item.availableQty <= 10;

  return (
    <div className="flex gap-3 py-3">
      {/* Thumbnail */}
      <Link href={`/products/${item.productSlug}`} className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.thumbnail ? (
          <Image src={item.thumbnail} alt={item.productName} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
        )}
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <Link
          href={`/products/${item.productSlug}`}
          className="line-clamp-2 text-sm font-medium text-foreground hover:underline leading-tight"
        >
          {item.productName}
        </Link>

        {(item.size || item.color) && (
          <p className="text-xs text-muted-foreground">
            {[item.size, item.color].filter(Boolean).join(" · ")}
          </p>
        )}

        {overStock && (
          <p className="text-xs font-medium text-red-600">
            Only {item.availableQty} left — please reduce quantity
          </p>
        )}
        {lowStock && (
          <p className="text-xs font-medium text-amber-600">Only {item.availableQty} left!</p>
        )}

        <div className="flex items-center gap-1.5 mt-auto">
          <span className="text-sm font-semibold">₹{item.finalPrice.toFixed(0)}</span>
          {item.discountAmount > 0 && (
            <span className="text-xs text-muted-foreground line-through">₹{item.price.toFixed(0)}</span>
          )}
        </div>
      </div>

      {/* Qty + remove */}
      <div className="flex flex-col items-end justify-between gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          disabled={removing}
          aria-label="Remove"
        >
          <Trash2 className="size-3.5" />
        </Button>

        <div className="flex items-center gap-1 rounded-full border px-1 py-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-5 w-5"
            onClick={() => changeQty(-1)}
            disabled={updating || item.quantity <= 1}
            aria-label="Decrease"
          >
            <Minus className="size-3" />
          </Button>
          <span className="w-5 text-center text-xs font-medium tabular-nums">{item.quantity}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-5 w-5"
            onClick={() => changeQty(1)}
            disabled={updating || atStockLimit}
            aria-label="Increase"
          >
            <Plus className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
