"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { useCart } from "@/hooks/useCart";

export function CartDrawer() {
  const { cart } = useCart();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const itemCount = cart?.itemCount ?? 0;

  function goToCheckout() {
    setOpen(false);
    router.push("/checkout");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Cart" className="relative" />}>
        <ShoppingBag className="size-5" />
        {itemCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white pointer-events-none">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingBag className="size-4" />
            Your Cart
            {itemCount > 0 && (
              <span className="ml-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                {itemCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable item list */}
        <div className="flex-1 overflow-y-auto px-4">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <ShoppingBag className="size-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Your cart is empty</p>
              <Button size="sm" onClick={() => { setOpen(false); router.push("/products"); }}>
                Shop Now
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {cart.items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Order summary */}
        {cart && cart.items.length > 0 && (
          <div className="border-t px-4 py-4 space-y-3">
            {cart.totalDiscount > 0 && (
              <>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{cart.subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-green-600">
                  <span>Discount</span>
                  <span>−₹{cart.totalDiscount.toFixed(0)}</span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>₹{cart.total.toFixed(0)}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                render={<Link href="/cart" onClick={() => setOpen(false)} />}
              >
                View Cart
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                onClick={goToCheckout}
              >
                Checkout
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
