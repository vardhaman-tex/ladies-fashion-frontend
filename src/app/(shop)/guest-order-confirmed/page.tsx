"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Search, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const shortId = orderId.slice(0, 8).toUpperCase();

  return (
    <div className="container mx-auto max-w-lg px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto mb-4 size-16 text-green-500" />
      <h1 className="mb-2 text-2xl font-bold">Order Placed!</h1>
      <p className="mb-6 text-muted-foreground">
        Thank you for your order. We&apos;ve received it and will confirm shortly.
      </p>

      {orderId && (
        <div className="mb-8 rounded-xl border p-5 text-left">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Order ID</p>
          <p className="mt-1 font-mono text-xl font-bold">#{shortId}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            To track your order, use your{" "}
            <span className="font-medium text-foreground">Order ID</span> and the{" "}
            <span className="font-medium text-foreground">phone number</span> you provided at
            checkout.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          render={<Link href={`/track-order${orderId ? `?orderId=${orderId}` : ""}`} />}
          className="gap-2 bg-rose-600 hover:bg-rose-700"
        >
          <Search className="size-4" />
          Track Order
        </Button>
        <Button variant="outline" render={<Link href="/products" />} className="gap-2">
          <ShoppingBag className="size-4" />
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}

export default function GuestOrderConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
