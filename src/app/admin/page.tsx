"use client";

import Link from "next/link";
import {
  ShoppingBag,
  TrendingUp,
  Users,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
} from "lucide-react";
import { useAdminStats, useAdminOrders } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/order";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:   "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SHIPPED:   "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5">
      <div className={cn("flex size-11 items-center justify-center rounded-full", accent ?? "bg-rose-100 dark:bg-rose-950/40")}>
        <Icon className="size-5 text-rose-600" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-20" />
        ) : (
          <p className="text-xl font-bold text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: recentOrders, isLoading: ordersLoading } = useAdminOrders(undefined, 0);

  return (
    <div className="p-6 lg:p-8">
      <h1 className="mb-1 text-2xl font-bold">Dashboard</h1>
      <p className="mb-6 text-sm text-muted-foreground">Overview of your store</p>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={stats ? `₹${stats.totalRevenue.toLocaleString("en-IN")}` : "—"} icon={TrendingUp} loading={statsLoading} />
        <StatCard label="Total Orders" value={stats?.totalOrders ?? "—"} icon={ShoppingBag} loading={statsLoading} />
        <StatCard label="Total Users" value={stats?.totalUsers ?? "—"} icon={Users} loading={statsLoading} accent="bg-blue-100 dark:bg-blue-950/40" />
        <StatCard label="Total Products" value={stats?.totalProducts ?? "—"} icon={Package} loading={statsLoading} accent="bg-green-100 dark:bg-green-950/40" />
      </div>

      {/* Order status breakdown */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {[
          { label: "Pending",   value: stats?.pendingOrders,   icon: Clock,        color: "text-amber-600" },
          { label: "Confirmed", value: stats?.confirmedOrders, icon: CheckCircle2, color: "text-blue-600"  },
          { label: "Shipped",   value: stats?.shippedOrders,   icon: Truck,        color: "text-indigo-600"},
          { label: "Delivered", value: stats?.deliveredOrders, icon: CheckCircle2, color: "text-green-600" },
          { label: "Cancelled", value: stats?.cancelledOrders, icon: XCircle,      color: "text-red-500"   },
        ].map(({ label, value, icon: Icon, color }) => (
          <Link
            key={label}
            href={`/admin/orders?status=${label.toUpperCase()}`}
            className="flex flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:border-muted-foreground/40"
          >
            <Icon className={cn("size-4", color)} />
            <p className="text-lg font-bold">{statsLoading ? "…" : (value ?? 0)}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-rose-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="divide-y">
          {ordersLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32 flex-1" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          ) : (recentOrders?.content ?? []).slice(0, 8).map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30"
            >
              <span className="w-28 truncate font-mono text-xs text-muted-foreground">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="flex-1 truncate text-sm font-medium">
                {order.addrFullName}
              </span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLES[order.status])}>
                {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
              </span>
              <span className="w-20 text-right text-sm font-semibold text-rose-600">
                ₹{order.total.toLocaleString("en-IN")}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
