"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

/**
 * The header's cart icon: one tap to the cart page, with the item count.
 *
 * It used to open a side drawer holding a second, smaller copy of the cart. That
 * was an extra step for anyone heading to checkout, so it goes straight to the
 * page, and "Added to cart" now offers a View cart shortcut instead.
 */
export function CartButton() {
  const { cart } = useCart();
  const itemCount = cart?.itemCount ?? 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      render={
        <Link
          href="/cart"
          aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : "Cart"}
        />
      }
    >
      <ShoppingBag className="size-5" />
      {itemCount > 0 && (
        <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Button>
  );
}
