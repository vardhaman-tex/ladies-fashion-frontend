"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart2,
  Users,
  MousePointerClick,
  ShoppingCart,
  Package,
  TrendingUp,
  Download,
  ArrowRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAnalyticsSummary,
  getDailyBreakdown,
  getTopProducts,
  getTopUsers,
} from "@/services/analyticsService";
import type {
  AnalyticsSummary,
  DailyCountRow,
  TopProductRow,
  UserActivityRow,
} from "@/services/analyticsService";

/* ── helpers ───────────────────────────────────────────────────────────── */

function pct(a: number, b: number): string {
  if (b === 0) return "—";
  return `${Math.round((a / b) * 100)}%`;
}

function fmt(n: number): string {
  return n.toLocaleString("en-IN");
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function exportCSV(
  summary: AnalyticsSummary,
  daily: DailyCountRow[],
  products: TopProductRow[],
  users: UserActivityRow[]
) {
  const rows: string[] = [];

  rows.push("=== Summary ===");
  rows.push(`Period (days),${summary.days}`);
  rows.push(`Total Events,${fmt(summary.totalEvents)}`);
  rows.push(`Unique Sessions,${fmt(summary.uniqueSessions)}`);
  rows.push(`Logged-in Users,${fmt(summary.uniqueUsers)}`);
  rows.push(`Orders Placed,${fmt(summary.funnel.ordersPlaced)}`);
  rows.push("");

  rows.push("=== Daily Events ===");
  rows.push("Date,Events");
  daily.forEach((d) => rows.push(`${d.date},${d.count}`));
  rows.push("");

  rows.push("=== Top Products ===");
  rows.push("Slug,Views,Add-to-carts");
  products.forEach((p) => rows.push(`${p.slug},${p.views},${p.addToCarts}`));
  rows.push("");

  rows.push("=== User Activity ===");
  rows.push("Email,First Name,Last Name,Events,Last Seen");
  users.forEach((u) =>
    rows.push(`${u.email},${u.firstName},${u.lastName},${u.eventCount},${u.lastSeen}`)
  );

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-${summary.days}d.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
      <p className="text-2xl font-bold tabular-nums">{typeof value === "number" ? fmt(value) : value}</p>
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function FunnelBar({
  label,
  value,
  max,
  pctLabel,
  color,
}: {
  label: string;
  value: number;
  max: number;
  pctLabel?: string;
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
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${width}%` }} />
      </div>
      {pctLabel && (
        <p className="pl-1 text-xs text-muted-foreground">
          <ArrowRight className="mr-0.5 inline size-3" />
          {pctLabel}
        </p>
      )}
    </div>
  );
}

function DailyChart({ data }: { data: DailyCountRow[] }) {
  if (!data.length) return <p className="text-sm text-muted-foreground">No data yet.</p>;
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex h-36 items-end gap-0.5 overflow-x-auto pb-6">
      {data.map((d) => {
        const height = Math.round((d.count / max) * 100);
        const label = d.date.slice(5); // MM-DD
        return (
          <div key={d.date} className="group relative flex min-w-[18px] flex-1 flex-col items-center">
            {/* tooltip */}
            <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 transition-opacity group-hover:opacity-100">
              {d.date}: {fmt(d.count)}
            </div>
            <div
              className="w-full rounded-t bg-primary/70 transition-all group-hover:bg-primary"
              style={{ height: `${height}%` }}
            />
            {data.length <= 31 && (
              <span className="absolute -bottom-5 text-[9px] text-muted-foreground" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── skeleton ─────────────────────────────────────────────────────────── */

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} style={style} />;
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

  const { data: daily = [], isLoading: loadingDaily } = useQuery<DailyCountRow[]>({
    queryKey: ["admin", "analytics", "daily", days],
    queryFn: () => getDailyBreakdown(days),
  });

  const { data: topProducts = [], isLoading: loadingProducts } = useQuery<TopProductRow[]>({
    queryKey: ["admin", "analytics", "top-products", days],
    queryFn: () => getTopProducts(days, 10),
  });

  const { data: topUsers = [], isLoading: loadingUsers } = useQuery<UserActivityRow[]>({
    queryKey: ["admin", "analytics", "users", days],
    queryFn: () => getTopUsers(days, 20),
  });

  const funnel = summary?.funnel;
  const funnelMax = funnel?.productViews ?? 0;

  const conversionRate = funnel && funnel.productViews > 0
    ? `${((funnel.ordersPlaced / funnel.productViews) * 100).toFixed(1)}%`
    : "—";
  const cartAbandonment = funnel && funnel.addToCarts > 0
    ? `${(100 - (funnel.ordersPlaced / funnel.addToCarts) * 100).toFixed(1)}%`
    : "—";
  const avgEventsPerSession = summary && summary.uniqueSessions > 0
    ? (summary.totalEvents / summary.uniqueSessions).toFixed(1)
    : "—";

  const canExport = summary && daily.length > 0;

  return (
    <div className="space-y-6 p-4 md:p-6">

      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">User journey overview</p>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            disabled={!canExport}
            onClick={() => canExport && exportCSV(summary!, daily, topProducts, topUsers)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* stat cards — row 1: core metrics */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
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
            sub={`avg ${avgEventsPerSession} events/session`}
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
            sub={`${conversionRate} overall conversion`}
            color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          />
        </div>
      ) : null}

      {/* stat cards — row 2: derived metrics */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Conversion rate</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-green-600 dark:text-green-400">{conversionRate}</p>
            <p className="text-xs text-muted-foreground">product views → orders</p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cart abandonment</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-orange-600 dark:text-orange-400">{cartAbandonment}</p>
            <p className="text-xs text-muted-foreground">added to cart, didn't buy</p>
          </div>
          <div className="rounded-xl border p-4 col-span-2 md:col-span-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg events / session</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{avgEventsPerSession}</p>
            <p className="text-xs text-muted-foreground">engagement depth</p>
          </div>
        </div>
      )}

      {/* daily events chart */}
      <div className="rounded-xl border p-4">
        <h2 className="mb-4 flex items-center gap-1.5 font-semibold">
          <BarChart2 className="size-4 text-primary" /> Daily events
        </h2>
        {loadingDaily ? (
          <div className="flex h-36 items-end gap-0.5">
            {[...Array(20)].map((_, i) => (
              <Skeleton key={i} className="flex-1" style={{ height: `${30 + Math.random() * 70}%` } as React.CSSProperties} />
            ))}
          </div>
        ) : (
          <DailyChart data={daily} />
        )}
      </div>

      {/* funnel + top products */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* funnel */}
        <div className="rounded-xl border p-4">
          <h2 className="mb-4 flex items-center gap-1.5 font-semibold">
            <TrendingUp className="size-4 text-primary" /> Purchase funnel
          </h2>
          {loadingSummary || !funnel ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : (
            <div className="space-y-3">
              <FunnelBar label="Product views" value={funnel.productViews} max={funnelMax} color="bg-blue-500" />
              <FunnelBar
                label="Add to cart"
                value={funnel.addToCarts}
                max={funnelMax}
                pctLabel={`${pct(funnel.addToCarts, funnel.productViews)} of product viewers`}
                color="bg-indigo-500"
              />
              <FunnelBar
                label="Checkout started"
                value={funnel.checkoutStarts}
                max={funnelMax}
                pctLabel={`${pct(funnel.checkoutStarts, funnel.addToCarts)} of cart adds`}
                color="bg-violet-500"
              />
              <FunnelBar
                label="Order placed"
                value={funnel.ordersPlaced}
                max={funnelMax}
                pctLabel={`${pct(funnel.ordersPlaced, funnel.checkoutStarts)} of checkouts`}
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
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No product views yet.</p>
          ) : (
            <div className="divide-y text-sm">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 pb-1.5 text-xs font-medium text-muted-foreground">
                <span>Product</span>
                <span className="text-right">Views</span>
                <span className="text-right">Cart</span>
              </div>
              {topProducts.map((p) => (
                <div key={p.slug} className="grid grid-cols-[1fr_auto_auto] gap-2 py-2">
                  <Link
                    href={`/products/${p.slug}`}
                    target="_blank"
                    className="truncate font-medium text-primary hover:underline"
                  >
                    {p.slug}
                  </Link>
                  <span className="tabular-nums text-right">{fmt(p.views)}</span>
                  <span className="tabular-nums text-right text-muted-foreground">{fmt(p.addToCarts)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* user activity */}
      <div className="rounded-xl border p-4">
        <h2 className="mb-4 flex items-center gap-1.5 font-semibold">
          <Clock className="size-4 text-primary" /> User activity
          <span className="ml-auto text-xs font-normal text-muted-foreground">logged-in users only</span>
        </h2>
        {loadingUsers ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : topUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No logged-in user activity in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 text-right font-medium">Events</th>
                  <th className="pb-2 font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topUsers.map((u) => (
                  <tr key={u.userId} className="group">
                    <td className="py-2 pr-4 font-medium">{u.email}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{fmt(u.eventCount)}</td>
                    <td className="py-2 text-xs text-muted-foreground">{fmtDate(u.lastSeen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
