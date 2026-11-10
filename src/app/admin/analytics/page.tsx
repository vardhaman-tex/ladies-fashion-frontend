"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, Users, MousePointerClick, ShoppingCart, Package, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAnalyticsSummary, getTopProducts } from "@/services/analyticsService";
import type { AnalyticsSummary, TopProductRow } from "@/services/analyticsService";

/* ── helpers ───────────────────────────────────────────────────────────── */

function pct(a: number, b: number): string {
  if (b === 0) return "—";
  return `${Math.round((a / b) * 100)}%`;
}

function fmt(n: number): string {
  return n.toLocaleString("en-IN");
}

/* ── sub-components ─────────────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className={cn("mb-3 inline-flex size-9 items-center justify-center rounded-lg", color)}>
        <Icon className="size-4" />
      </div>
      <p className="text-2xl font-bold">{fmt(Number(value))}</p>
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function FunnelBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{fmt(value)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/* ── main page ───────────────────────────────────────────────────────────── */

const DAY_OPTIONS = [7, 14, 30, 90] as const;
type DayOption = (typeof DAY_OPTIONS)[number];

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState<DayOption>(30);

  const { data: summary, isLoading: loadingSummary } = useQuery<AnalyticsSummary>({
    queryKey: ["admin", "analytics", "summary", days],
    queryFn: () => getAnalyticsSummary(days),
  });

  const { data: topProducts = [], isLoading: loadingProducts } = useQuery<TopProductRow[]>({
    queryKey: ["admin", "analytics", "top-products", days],
    queryFn: () => getTopProducts(days, 10),
  });

  const funnel = summary?.funnel;
  const funnelMax = funnel?.productViews ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">User journey overview</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1 text-sm">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "rounded-md px-3 py-1 font-medium",
                days === d
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* stat cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={MousePointerClick}
            label="Total events"
            value={summary.totalEvents}
            color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatCard
            icon={Users}
            label="Unique sessions"
            value={summary.uniqueSessions}
            color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          />
          <StatCard
            icon={BarChart2}
            label="Logged-in users"
            value={summary.uniqueUsers}
            color="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
          />
          <StatCard
            icon={ShoppingCart}
            label="Orders placed"
            value={funnel?.ordersPlaced ?? 0}
            sub={`${pct(funnel?.ordersPlaced ?? 0, funnelMax)} of product viewers`}
            color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          />
        </div>
      ) : null}

      {/* funnel + top products */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* funnel */}
        <div className="rounded-xl border p-4">
          <h2 className="mb-4 flex items-center gap-1.5 font-semibold">
            <TrendingUp className="size-4 text-primary" /> Purchase funnel
          </h2>
          {loadingSummary || !funnel ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <FunnelBar
                label="Product views"
                value={funnel.productViews}
                max={funnelMax}
                color="bg-blue-500"
              />
              <div className="pl-2 text-xs text-muted-foreground">
                ↳ {pct(funnel.addToCarts, funnel.productViews)} added to cart
              </div>
              <FunnelBar
                label="Add to cart"
                value={funnel.addToCarts}
                max={funnelMax}
                color="bg-indigo-500"
              />
              <div className="pl-2 text-xs text-muted-foreground">
                ↳ {pct(funnel.checkoutStarts, funnel.addToCarts)} started checkout
              </div>
              <FunnelBar
                label="Checkout started"
                value={funnel.checkoutStarts}
                max={funnelMax}
                color="bg-violet-500"
              />
              <div className="pl-2 text-xs text-muted-foreground">
                ↳ {pct(funnel.ordersPlaced, funnel.checkoutStarts)} completed
              </div>
              <FunnelBar
                label="Order placed"
                value={funnel.ordersPlaced}
                max={funnelMax}
                color="bg-green-500"
              />
            </div>
          )}
        </div>

        {/* top products */}
        <div className="rounded-xl border p-4">
          <h2 className="mb-4 flex items-center gap-1.5 font-semibold">
            <Package className="size-4 text-primary" /> Top products
          </h2>
          {loadingProducts ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No product views yet.</p>
          ) : (
            <div className="divide-y text-sm">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 pb-1.5 text-xs font-medium text-muted-foreground">
                <span>Product</span>
                <span className="text-right">Views</span>
                <span className="text-right">Add-to-cart</span>
              </div>
              {topProducts.map((p) => (
                <div
                  key={p.slug}
                  className="grid grid-cols-[1fr_auto_auto] gap-2 py-2"
                >
                  <span className="truncate font-medium">{p.slug}</span>
                  <span className="tabular-nums text-right">{fmt(p.views)}</span>
                  <span className="tabular-nums text-right text-muted-foreground">
                    {fmt(p.addToCarts)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
