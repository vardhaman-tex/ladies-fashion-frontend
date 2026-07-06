"use client";

import { use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Package, CheckCircle2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOrder, useCancelOrder } from "@/hooks/useOrders";
import { OrderDetailSkeleton } from "@/components/common/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/types/order";

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
  PENDING: "bg-warning/15 text-warning",
  PAID: "bg-success/15 text-success",
  CONFIRMED: "bg-secondary text-secondary-foreground",
  SHIPPED: "bg-accent text-accent-foreground",
  DELIVERED: "bg-success/15 text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
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
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentStep;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                  done ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
              <span className={cn("mt-1 text-[10px]", done ? "text-primary font-medium" : "text-muted-foreground")}>
                {STATUS_LABELS[step]}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={cn("h-0.5 flex-1 mb-4", done && i < currentStep ? "bg-primary" : "bg-muted")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed") === "true";
  const { data: order, isLoading } = useOrder(id);
  const cancelOrder = useCancelOrder();

  async function handleCancel() {
    if (!confirm("Cancel this order?")) return;
    try {
      await cancelOrder.mutateAsync(id);
      toast.success("Order cancelled");
    } catch {
      toast.error("Failed to cancel order");
    }
  }

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold">Order not found</h2>
        <Button className="mt-4" render={<Link href="/orders" />}>
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/orders"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Orders
      </Link>

      {confirmed && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-success/25 bg-success/10 px-4 py-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="font-semibold text-success">Order placed successfully!</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              We&apos;ve received your order and will confirm it shortly.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {order.status === "PENDING" && (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={handleCancel}
              disabled={cancelOrder.isPending}
            >
              {cancelOrder.isPending ? "Cancelling…" : "Cancel Order"}
            </Button>
          )}
        </div>
      </div>

      {/* Status timeline */}
      <div className="mb-6 rounded-xl border p-4">
        <StatusTimeline status={order.status} />
        {order.status === "CANCELLED" && (
          <p className="text-center text-sm text-destructive">This order has been cancelled.</p>
        )}
      </div>

      {/* Items */}
      <div className="mb-6 rounded-xl border">
        <div className="border-b px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Package className="size-4 text-primary" /> Items ({order.itemCount})
          </h2>
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
                <Link
                  href={`/products/${item.productSlug}`}
                  className="font-medium hover:text-primary"
                >
                  {item.productName}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {[item.size, item.color].filter(Boolean).join(" · ")} × {item.quantity}
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <span className="font-semibold text-primary">
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
            <div className="flex justify-between text-success">
              <span>Discount</span>
              <span>−₹{order.totalDiscount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-success">FREE</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Total</span>
            <span>₹{order.total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      <div className="rounded-xl border p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <MapPin className="size-4 text-primary" /> Delivery Address
        </h2>
        <p className="font-medium">{order.addrFullName}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {[order.addrLine1, order.addrLine2].filter(Boolean).join(", ")}
        </p>
        <p className="text-sm text-muted-foreground">
          {order.addrCity}, {order.addrState} — {order.addrPincode}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{order.addrPhone}</p>
      </div>

      {/* Payment info */}
      {order.razorpayPaymentId && (
        <div className="rounded-xl border p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <CreditCard className="size-4 text-primary" /> Payment
          </h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Method</span>
            <span className="font-medium">Razorpay</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Payment ID</span>
            <span className="font-mono text-xs text-muted-foreground">{order.razorpayPaymentId}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Amount paid</span>
            <span className="font-semibold text-primary">₹{order.total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderDetailContent id={id} />
    </Suspense>
  );
}
