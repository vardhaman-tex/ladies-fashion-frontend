"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { gaViewCart } from "@/lib/ga";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { useClearCart, useCart } from "@/hooks/useCart";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { getCodAvailability, quotePayment } from "@/lib/cod";
import { inr } from "@/lib/money";

export default function CartPage() {
  const { cart, isLoading, isMerging } = useCart();
  const { mutate: clearCart, isPending: clearing } = useClearCart();
  const { data: siteSettings } = useSiteSettings();

  // What cash on delivery would make this cart cost, shown before checkout so
  // the fee is never a surprise at the last step. Null when COD is off or does
  // not apply to this total, in which case the line is simply not shown.
  const codOption =
    cart && siteSettings && getCodAvailability(siteSettings, cart.total).available
      ? quotePayment("COD_FULL", cart.total, siteSettings.codAdvanceAmount, siteSettings.codFeeAmount)
      : null;

  // Reported once the cart has resolved to something, keyed on the item count
  // rather than the cart object: a refetch returning the same cart must not
  // report a second view, and an empty cart is not a cart view.
  const cartItemCount = cart?.items.length ?? 0;
  useEffect(() => {
    if (cartItemCount === 0) return;
    const items = cart?.items ?? [];
    gaViewCart(
      items.map((item) => ({
        item_id: item.productId,
        item_name: item.productName,
        price: item.finalPrice,
        quantity: item.quantity,
      })),
      cart?.total
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItemCount]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;
  const hasStockIssues =
    cart?.items.some((item) => item.availableQty !== undefined && item.quantity > item.availableQty) ?? false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-32 sm:py-8 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" render={<Link href="/products" aria-label="Back" />}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="font-heading text-2xl font-bold">
          Cart {cart && cart.itemCount > 0 && (
            <span className="text-base font-normal text-muted-foreground">({cart.itemCount} items)</span>
          )}
        </h1>
      </div>

      {/*
        A merge in flight outranks an empty cart.

        Signing in fires the guest-cart merge from CartProvider, and until it
        returns the server cart really is empty — so this page used to tell a
        customer who had just signed in with a full cart that their cart was
        empty, moments before the items appeared. "Empty" is only true once
        nothing is on its way.
      */}
      {isMerging && isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-lg font-medium">Moving your items into your cart…</p>
          <p className="text-sm text-muted-foreground">
            The items you added before signing in are on their way.
          </p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <ShoppingBag className="size-16 text-muted-foreground/30" />
          <p className="text-lg font-medium">Your cart is empty</p>
          <p className="text-sm text-muted-foreground">Add items to get started</p>
          <Button render={<Link href="/products" />}>Shop Now</Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items list */}
          <div className="min-w-0 lg:col-span-2">
            <div className="rounded-xl border bg-card">
              <div className="divide-y px-4">
                {cart.items.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))}
              </div>
              <div className="border-t px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive text-xs"
                  onClick={() => clearCart()}
                  disabled={clearing}
                >
                  Clear cart
                </Button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border bg-card p-4 space-y-4 sticky top-24">
              <h2 className="font-semibold text-base">Order Summary</h2>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({cart.itemCount} items)</span>
                  <span>{inr(cart.subtotal)}</span>
                </div>
                {cart.totalDiscount > 0 && (
                  <div className="flex justify-between text-success font-medium">
                    <span>Discount</span>
                    <span>−{inr(cart.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className="text-success">Free</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{inr(cart.total)}</span>
              </div>
              {codOption && (
                <div className="space-y-1 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <p>
                    Pay online: <span className="font-medium text-foreground">{inr(cart.total)}</span>
                  </p>
                  <p>
                    Cash on delivery:{" "}
                    <span className="font-medium text-foreground">{inr(codOption.total)}</span>
                    {codOption.fee > 0 ? ` (includes ${inr(codOption.fee)} fee)` : ""}
                  </p>
                  {codOption.payableNow > 0 && (
                    <p>
                      Pay <span className="font-medium text-foreground">{inr(codOption.payableNow)}</span> online
                      now to confirm, and{" "}
                      <span className="font-medium text-foreground">{inr(codOption.dueOnDelivery)}</span> on
                      delivery. The advance is part of the total, not extra.
                    </p>
                  )}
                </div>
              )}
              {hasStockIssues && (
                <p className="text-xs font-medium text-destructive">
                  Some items exceed available stock. Reduce quantity to continue.
                </p>
              )}
              {/* On a phone the checkout button lives in the sticky bar below, so it
                  is under the thumb however long the list is. */}
              <Button
                size="lg"
                className="hidden w-full rounded-full lg:inline-flex"
                disabled={hasStockIssues}
                render={<Link href="/checkout" />}
              >
                Proceed to Checkout
              </Button>
              <Button variant="outline" size="lg" className="w-full rounded-full" render={<Link href="/products" />}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isEmpty && cart && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t bg-background/95 px-4 pt-3 shadow-lg backdrop-blur lg:hidden"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Total · free delivery</p>
            <p className="text-lg leading-tight font-bold text-foreground">{inr(cart.total)}</p>
          </div>
          <Button
            size="lg"
            className="h-12 flex-1 rounded-full text-base"
            disabled={hasStockIssues}
            render={<Link href="/checkout" />}
          >
            Checkout
          </Button>
        </div>
      )}
    </div>
  );
}
