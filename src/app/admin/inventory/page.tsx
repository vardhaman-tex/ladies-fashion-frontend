"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { useAdminInventory, useUpdateInventory } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { cn } from "@/lib/utils";

interface InventoryItem {
  productId: string;
  productName?: string;
  productSku?: string;
  availableQty: number;
  reservedQty: number;
  soldQty: number;
  lowStockThreshold: number;
  inStock: boolean;
}

export default function AdminInventoryPage() {
  const [page, setPage] = useState(0);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editing, setEditing] = useState<{ id: string; qty: number; threshold: number } | null>(null);

  const { data, isLoading } = useAdminInventory(lowStockOnly, page);
  const updateInventory = useUpdateInventory();

  async function handleSave() {
    if (!editing) return;
    try {
      await updateInventory.mutateAsync({
        productId: editing.id,
        stockQuantity: editing.qty,
        lowStockThreshold: editing.threshold,
      });
      toast.success("Inventory updated");
      setEditing(null);
    } catch {
      toast.error("Failed to update inventory");
    }
  }

  const items = (data?.content ?? []) as InventoryItem[];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <div
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              lowStockOnly ? "bg-rose-600" : "bg-muted-foreground/30"
            )}
            onClick={() => { setLowStockOnly(!lowStockOnly); setPage(0); }}
          >
            <div className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
              lowStockOnly ? "translate-x-4" : "translate-x-0.5")} />
          </div>
          Low stock only
        </label>
      </div>

      <div className="rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Product ID</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Reserved</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Low Stock At</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}</tr>
                  ))
                : items.map((item) => {
                    const isEditing = editing?.id === item.productId;
                    const isLow = item.availableQty <= item.lowStockThreshold;
                    return (
                      <tr key={item.productId} className={cn("hover:bg-muted/20", isLow && "bg-amber-50/40 dark:bg-amber-950/10")}>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {isLow && <AlertTriangle className="size-3.5 text-amber-500" />}
                            {item.productId.slice(0, 8).toUpperCase()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={editing.qty}
                              onChange={(e) => setEditing({ ...editing, qty: Number(e.target.value) })}
                              className="w-20 rounded border px-2 py-1 text-sm"
                            />
                          ) : (
                            <span className={cn("font-semibold", isLow ? "text-amber-600" : "text-foreground")}>
                              {item.availableQty}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.reservedQty}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.soldQty}</td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={editing.threshold}
                              onChange={(e) => setEditing({ ...editing, threshold: Number(e.target.value) })}
                              className="w-20 rounded border px-2 py-1 text-sm"
                            />
                          ) : (
                            item.lowStockThreshold
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            item.inStock
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {item.inStock ? "In Stock" : "Out of Stock"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <button onClick={handleSave} disabled={updateInventory.isPending}
                                className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700 disabled:opacity-50">
                                Save
                              </button>
                              <button onClick={() => setEditing(null)}
                                className="rounded border px-2 py-1 text-xs hover:border-rose-400">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditing({ id: item.productId, qty: item.availableQty, threshold: item.lowStockThreshold })}
                              className="rounded border px-2 py-1 text-xs hover:border-rose-400 hover:text-rose-600"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {data && (data as { totalPages?: number }).totalPages && (data as { totalPages: number }).totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">Page {page + 1} of {(data as { totalPages: number }).totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="rounded border px-3 py-1 disabled:opacity-40 hover:border-rose-400">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= (data as { totalPages: number }).totalPages - 1}
                className="rounded border px-3 py-1 disabled:opacity-40 hover:border-rose-400">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
