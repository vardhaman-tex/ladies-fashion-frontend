"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { isAxiosError } from "axios";
import {
  Search,
  MapPin,
  Package,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { trackOrder } from "@/services/orderService";
import type { TrackOrderData, OrderStatus } from "@/types/order";

const STATUS_STEPS: OrderStatus[] = ["PENDING", "PAID", "CONFIRMED", "SHIPPED", "DELIVERED"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SHIPPED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") return null;
  const currentStep = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentStep;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                  done ? "bg-rose-600 text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px]",
                  done ? "font-medium text-rose-600" : "text-muted-foreground"
                )}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={cn(
                  "mb-4 h-0.5 flex-1",
                  done && i < currentStep ? "bg-rose-600" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TrackOrderForm() {
  const searchParams = useSearchParams();
  // orderRef is the human-readable order number (or UUID until backend ships orderNumber).
  // When backend adds orderNumber, the confirmation page will start passing that value here.
  const [orderId, setOrderId] = useState(searchParams.get("orderRef") ?? "");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<TrackOrderData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim()) return;
    setIsLoading(true);
    setError(null);
    setOrder(null);
    try {
      const result = await trackOrder(orderId.trim(), phone.trim());
      setOrder(result);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        setError("No order found. Please check your Order ID and phone number.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Home
      </Link>

      <h1 className="mb-2 text-xl font-bold sm:text-2xl">Track Your Order</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter your Order ID and the phone number used at checkout.
      </p>

      <form onSubmit={handleTrack} className="mb-8 rounded-xl border p-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="track-orderId">Order ID</Label>
            <Input
              id="track-orderId"
              placeholder="e.g. a1b2c3d4-…"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="track-phone">Phone Number</Label>
            <Input
              id="track-phone"
              type="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full gap-2 bg-rose-600 hover:bg-rose-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            {isLoading ? "Searching…" : "Track Order"}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {order && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Status timeline */}
          <div className="rounded-xl border p-4">
            <StatusTimeline status={order.status} />
            {order.status === "CANCELLED" && (
              <p className="text-center text-sm text-red-600">This order has been cancelled.</p>
            )}
          </div>

          {/* Items */}
          <div className="rounded-xl border">
            <div className="border-b px-5 py-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <Package className="size-4 text-rose-600" /> Items ({order.itemCount})
              </h3>
            </div>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.thumbnail && (
                      <Image
                        src={item.thumbnail}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[item.size, item.color].filter(Boolean).join(" · ")} × {item.quantity}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span className="font-semibold text-rose-600">
                        ₹{item.finalPrice.toLocaleString("en-IN")}
                      </span>
                      {item.discountAmount > 0 && (
                        <span className="text-muted-foreground line-through">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm font-semibold">
                    ₹{item.lineTotal.toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t px-5 py-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>
              {order.totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>−₹{order.totalDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total</span>
                <span>₹{order.total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="rounded-xl border p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              <MapPin className="size-4 text-rose-600" /> Delivery Address
            </h3>
            <p className="font-medium">{order.addrFullName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {[order.addrLine1, order.addrLine2].filter(Boolean).join(", ")}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.addrCity}, {order.addrState} — {order.addrPincode}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{order.addrPhone}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TrackOrderForm />
    </Suspense>
  );
}
