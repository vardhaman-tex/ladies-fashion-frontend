"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Package, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAdminOrders, useUpdateOrderStatus } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/order";

const ALL_STATUSES: OrderStatus[] = ["PENDING", "PAID", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:   "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  PAID:      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SHIPPED:   "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:   ["CANCELLED"],
  PAID:      ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED",   "CANCELLED"],
  SHIPPED:   ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = (searchParams.get("status") as OrderStatus) || undefined;
  const [page, setPage] = useState(0);

  const { data, isLoading } = useAdminOrders(statusParam, page);
  const updateStatus = useUpdateOrderStatus();

  async function handleStatusChange(id: string, newStatus: OrderStatus) {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast.success(`Order marked as ${newStatus.toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  function setFilter(status?: OrderStatus) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    setPage(0);
    router.push(`/admin/orders${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const orders = data?.content ?? [];

  return (
    <div className="p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold">Orders</h1>

      {/* Status filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter()}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            !statusParam
              ? "border-rose-600 bg-rose-600 text-white"
              : "border-border text-muted-foreground hover:border-rose-400"
          )}
        >
          All
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              statusParam === s
                ? "border-rose-600 bg-rose-600 text-white"
                : "border-border text-muted-foreground hover:border-rose-400"
            )}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : orders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="flex items-center gap-2 font-mono text-xs hover:text-rose-600"
                        >
                          <div className="relative size-8 shrink-0 overflow-hidden rounded bg-muted">
                            {order.firstItemThumbnail && (
                              <Image src={order.firstItemThumbnail} alt="" fill className="object-cover" sizes="32px" />
                            )}
                          </div>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">{order.addrFullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{order.itemCount}</td>
                      <td className="px-4 py-3 font-semibold text-rose-600">
                        ₹{order.total.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLES[order.status])}>
                          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {STATUS_TRANSITIONS[order.status].map((next) => (
                            <button
                              key={next}
                              onClick={() => handleStatusChange(order.id, next)}
                              disabled={updateStatus.isPending}
                              className="rounded border border-border px-2 py-0.5 text-[11px] font-medium hover:border-rose-400 hover:text-rose-600 disabled:opacity-50"
                            >
                              → {next.charAt(0) + next.slice(1).toLowerCase()}
                            </button>
                          ))}
                          <Link href={`/admin/orders/${order.id}`}>
                            <ChevronRight className="size-4 text-muted-foreground hover:text-foreground" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {page + 1} of {data.totalPages} ({data.totalElements} orders)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded border px-3 py-1 disabled:opacity-40 hover:border-rose-400"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                disabled={page >= data.totalPages - 1}
                className="rounded border px-3 py-1 disabled:opacity-40 hover:border-rose-400"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <OrdersContent />
    </Suspense>
  );
}
