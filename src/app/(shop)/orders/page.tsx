"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, ChevronRight, Loader2 } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { OrderCardSkeleton } from "@/components/common/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OrderStatus, OrderSummaryData } from "@/types/order";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SHIPPED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status]
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function OrderCard({ order }: { order: OrderSummaryData }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:border-muted-foreground/40 hover:bg-muted/30"
    >
      {/* Thumbnail */}
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {order.firstItemThumbnail ? (
          <Image
            src={order.firstItemThumbnail}
            alt={order.firstItemName ?? "Product"}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-medium leading-snug">
            {order.firstItemName ?? "Order"}
            {order.itemCount > 1 && (
              <span className="text-muted-foreground"> +{order.itemCount - 1}</span>
            )}
          </p>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <span className="font-semibold text-rose-600 text-sm">
              ₹{order.total.toLocaleString("en-IN")}
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </Link>
  );
}

const PAGE_SIZE = 10;

export default function OrdersPage() {
  const [page, setPage] = useState(0);
  const [allOrders, setAllOrders] = useState<OrderSummaryData[]>([]);

  const { data, isLoading, isFetching } = useOrders(page, PAGE_SIZE);

  // Merge new page results into accumulated list
  const currentPageOrders = data?.content ?? [];
  const merged = page === 0
    ? currentPageOrders
    : [...allOrders, ...currentPageOrders.filter((o) => !allOrders.some((a) => a.id === o.id))];

  const hasMore = data ? (data.page + 1) < data.totalPages : false;
  const orders = page === 0 && !isLoading ? currentPageOrders : merged;

  const handleLoadMore = () => {
    setAllOrders(orders);
    setPage((p) => p + 1);
  };

  if (isLoading && page === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <Package className="mx-auto mb-4 size-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">No orders yet</h2>
        <p className="mb-6 text-muted-foreground">Start shopping and your orders will appear here.</p>
        <Button render={<Link href="/products" />}>Shop Now</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isFetching}
            className="min-w-32"
          >
            {isFetching ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Loading…
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
