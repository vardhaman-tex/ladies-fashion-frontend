"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAdminOrder, useUpdateOrderStatus } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/order";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:   "bg-amber-100 text-amber-800",
  PAID:      "bg-purple-100 text-purple-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED:   "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:   ["CANCELLED"],
  PAID:      ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED:   ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: order, isLoading } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();

  async function handleStatus(next: OrderStatus) {
    try {
      await updateStatus.mutateAsync({ id, status: next });
      toast.success(`Order marked as ${next.toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 lg:p-8">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Order not found.{" "}
        <Link href="/admin/orders" className="text-rose-600 hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const transitions = STATUS_TRANSITIONS[order.status];

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Orders
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-mono text-sm font-semibold">
          #{order.id.slice(0, 8).toUpperCase()}
        </span>
        <span
          className={cn(
            "ml-auto rounded-full px-3 py-1 text-xs font-semibold",
            STATUS_STYLES[order.status]
          )}
        >
          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
        </span>
      </div>

      {/* Status actions */}
      {transitions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-4">
          <span className="mr-2 self-center text-sm font-medium">Move to:</span>
          {transitions.map((next) => (
            <button
              key={next}
              onClick={() => handleStatus(next)}
              disabled={updateStatus.isPending}
              className="rounded-lg border border-rose-200 bg-white px-4 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
              {next.charAt(0) + next.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order items */}
        <div className="rounded-xl border lg:col-span-2">
          <div className="border-b px-4 py-3 font-semibold">
            Items ({order.itemCount})
          </div>
          <div className="divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-4">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.thumbnail && (
                    <Image
                      src={item.thumbnail}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.productSlug}`}
                    target="_blank"
                    className="line-clamp-1 font-medium hover:text-rose-600"
                  >
                    {item.productName}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {item.color && <span>Color: {item.color}</span>}
                    {item.size && <span>Size: {item.size}</span>}
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-rose-600">
                    ₹{item.lineTotal.toLocaleString("en-IN")}
                  </p>
                  {item.discountAmount > 0 && (
                    <p className="text-xs text-muted-foreground line-through">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Totals */}
          <div className="space-y-1.5 border-t p-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
            </div>
            {order.totalDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>−₹{order.totalDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border p-4">
            <h3 className="mb-3 font-semibold">Delivery Address</h3>
            <div className="space-y-0.5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{order.addrFullName}</p>
              <p>{order.addrLine1}</p>
              {order.addrLine2 && <p>{order.addrLine2}</p>}
              <p>
                {order.addrCity}, {order.addrState} – {order.addrPincode}
              </p>
              <p>📞 {order.addrPhone}</p>
            </div>
          </div>

          <div className="rounded-xl border p-4 text-sm">
            <h3 className="mb-3 font-semibold">Order Info</h3>
            <div className="space-y-1.5 text-muted-foreground">
              <div className="flex justify-between">
                <span>Order ID</span>
                <span className="font-mono text-xs">
                  {order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Placed on</span>
                <span>
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>
                  {new Date(order.updatedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
