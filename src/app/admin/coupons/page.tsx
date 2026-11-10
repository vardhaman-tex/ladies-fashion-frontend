"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { useAdminCoupons, useToggleCoupon } from "@/hooks/useCoupons";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { cn } from "@/lib/utils";

export default function AdminCouponsPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useAdminCoupons(page);
  const toggle = useToggleCoupon();

  const coupons = data?.content ?? [];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          <Plus className="size-4" />
          New Coupon
        </Link>
      </div>

      <div className="rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Validity</th>
                <th className="px-4 py-3">Flags</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono font-semibold tracking-wide">{c.code}</td>
                      <td className="px-4 py-3">
                        {c.discountType === "FLAT"
                          ? `₹${c.discountValue.toLocaleString("en-IN")}`
                          : `${c.discountValue}%`}
                        {c.discountType === "PERCENT" && c.maxDiscount && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (max ₹{c.maxDiscount.toLocaleString("en-IN")})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.minOrderValue ? `₹${c.minOrderValue.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.timesUsed}
                        {c.maxUses ? ` / ${c.maxUses}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.validFrom
                          ? new Date(c.validFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                          : "—"}
                        {" → "}
                        {c.validTo
                          ? new Date(c.validTo).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                          : "∞"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {c.firstOrderOnly && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            1st order
                          </span>
                        )}
                        {c.restrictedProductIds.length > 0 && (
                          <span className="ml-1 rounded-full bg-purple-100 px-2 py-0.5 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            {c.restrictedProductIds.length} products
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            c.isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/coupons/${c.id}/edit`}
                            className="rounded p-1 text-muted-foreground hover:text-foreground"
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <button
                            onClick={() => toggle.mutate(c.id)}
                            disabled={toggle.isPending}
                            className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
                            title={c.isActive ? "Deactivate" : "Activate"}
                          >
                            {c.isActive
                              ? <ToggleRight className="size-4 text-green-600" />
                              : <ToggleLeft className="size-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {page + 1} of {data.totalPages} ({data.totalElements} coupons)
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
