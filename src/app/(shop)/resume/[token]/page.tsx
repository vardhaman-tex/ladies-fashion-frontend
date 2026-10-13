"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useGuestCartStore } from "@/stores/cartStore";
import { getResumableCart } from "@/services/abandonedCartService";

/**
 * Where a WhatsApp cart reminder lands.
 *
 * The link opens in whatever browser WhatsApp hands it to, which is often not
 * the one the cart was built in, so the cart is rebuilt here from the server's
 * copy and the shopper goes straight on to checkout. Prices shown are display
 * data; the order is priced by the server when it is placed.
 */
export default function ResumeCartPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const addItem = useGuestCartStore((state) => state.addItem);
  const clearCart = useGuestCartStore((state) => state.clearCart);
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Effects run twice in development; restoring twice would double every quantity.
    if (started.current) return;
    started.current = true;

    getResumableCart(token)
      .then((items) => {
        if (items.length === 0) {
          setFailed(true);
          return;
        }
        clearCart();
        items.forEach((item) => addItem(item));
        router.replace("/checkout");
      })
      .catch(() => setFailed(true));
  }, [token, addItem, clearCart, router]);

  if (failed) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold">This cart link has expired</h1>
        <p className="text-sm text-muted-foreground">
          Saved carts are kept for a few days. Your favourites are still in the shop.
        </p>
        <Button render={<Link href="/products" />}>Continue shopping</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Getting your cart ready…</p>
    </div>
  );
}
