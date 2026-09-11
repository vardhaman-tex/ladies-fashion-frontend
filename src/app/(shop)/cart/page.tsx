"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { useClearCart, useCart } from "@/hooks/useCart";

export default function CartPage() {
  const { cart, isLoading, isMerging } = useCart();
  const { mutate: clearCart, isPending: clearing } = useClearCart();

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
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon-sm" render={<Link href="/products" aria-label="Back" />}>
          <ArrowLeft className="size-4" />
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
          <Loader2 className="size-10 animate-spin text-rose-600" />
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
          <div className="lg:col-span-2">
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
                  <span>₹{cart.subtotal.toFixed(0)}</span>
                </div>
                {cart.totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span>−₹{cart.totalDiscount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>₹{cart.total.toFixed(0)}</span>
              </div>
              {hasStockIssues && (
                <p className="text-xs font-medium text-red-600">
                  Some items exceed available stock. Reduce quantity to continue.
                </p>
              )}
              <Button
                className="w-full bg-rose-600 hover:bg-rose-700"
                disabled={hasStockIssues}
                render={<Link href="/checkout" />}
              >
                Proceed to Checkout
              </Button>
              <Button variant="outline" className="w-full" render={<Link href="/products" />}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
