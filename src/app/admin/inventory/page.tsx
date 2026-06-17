"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Download, Upload } from "lucide-react";
import { useAdminInventory, useUpdateInventory } from "@/hooks/useAdmin";
import { exportInventoryExcel, importInventoryExcel } from "@/services/adminService";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { cn } from "@/lib/utils";
import type { InventoryRow } from "@/types/admin";

export default function AdminInventoryPage() {
  const searchParams = useSearchParams();
  const highlightProductId = searchParams.get("product");

  const [page, setPage] = useState(0);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editing, setEditing] = useState<{ skuId: string; qty: number; threshold: number } | null>(null);

  const { data, isLoading } = useAdminInventory(lowStockOnly, page);
  const updateInventory = useUpdateInventory();
  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportInventoryExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inventory.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const msg = await importInventoryExcel(file);
      toast.success(msg ?? "Inventory imported");
    } catch {
      toast.error("Import failed — check file format");
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!editing) return;
    try {
      await updateInventory.mutateAsync({
        skuId: editing.skuId,
        availableQty: editing.qty,
        lowStockThreshold: editing.threshold,
      });
      toast.success("Inventory updated");
      setEditing(null);
    } catch {
      toast.error("Failed to update inventory");
    }
  }

  const items = (data?.content ?? []) as InventoryRow[];
  const totalPages = (data as { totalPages?: number })?.totalPages ?? 1;

  return (
    <div className="p-6 lg:p-8">
      <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:border-rose-400 hover:text-rose-600 disabled:opacity-50"
          >
            <Download className="size-4" />
            {exporting ? "Exporting…" : "Export Excel"}
          </button>
          <button
            onClick={() => importRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
          >
            <Upload className="size-4" />
            {importing ? "Importing…" : "Import Excel"}
          </button>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <div
            className={cn("relative h-5 w-9 rounded-full transition-colors", lowStockOnly ? "bg-rose-600" : "bg-muted-foreground/30")}
            onClick={() => { setLowStockOnly(!lowStockOnly); setPage(0); }}
          >
            <div className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform", lowStockOnly ? "translate-x-4" : "translate-x-0.5")} />
          </div>
          Low stock only
        </label>
      </div>

      <div className="rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Low Stock At</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}</tr>
                  ))
                : items.map((item) => {
                    const isEditing = editing?.skuId === item.skuId;
                    const isLow = item.availableQty <= item.lowStockThreshold;
                    return (
                      <tr
                        key={item.skuId}
                        id={`inv-${item.skuId}`}
                        className={cn(
                          "hover:bg-muted/20",
                          isLow && "bg-amber-50/40 dark:bg-amber-950/10",
                          highlightProductId === item.productId && "ring-2 ring-inset ring-rose-400"
                        )}
                      >
                        {/* Product identity */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.productThumbnail ? (
                              <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                                <Image src={item.productThumbnail} alt={item.productName} fill className="object-cover" sizes="40px" />
                              </div>
                            ) : (
                              <div className="size-10 shrink-0 rounded-lg bg-muted" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-medium text-sm max-w-[180px]">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">{item.productSku}</p>
                            </div>
                            {isLow && <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">{item.color}</td>
                        <td className="px-4 py-3 font-medium">{item.size}</td>

                        {/* Available qty */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input type="number" min={0} value={editing.qty}
                              onChange={(e) => setEditing({ ...editing, qty: Number(e.target.value) })}
                              className="w-20 rounded border px-2 py-1 text-sm" />
                          ) : (
                            <span className={cn("font-semibold", isLow ? "text-amber-600" : "text-foreground")}>
                              {item.availableQty}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">{item.soldQty}</td>

                        {/* Low stock threshold */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input type="number" min={0} value={editing.threshold}
                              onChange={(e) => setEditing({ ...editing, threshold: Number(e.target.value) })}
                              className="w-20 rounded border px-2 py-1 text-sm" />
                          ) : item.lowStockThreshold}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            item.inStock
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {item.inStock ? "In Stock" : "Out"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <button onClick={handleSave} disabled={updateInventory.isPending}
                                className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700 disabled:opacity-50">
                                Save
                              </button>
                              <button onClick={() => setEditing(null)} className="rounded border px-2 py-1 text-xs hover:border-rose-400">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditing({ skuId: item.skuId, qty: item.availableQty, threshold: item.lowStockThreshold })}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="rounded border px-3 py-1 disabled:opacity-40 hover:border-rose-400">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}
                className="rounded border px-3 py-1 disabled:opacity-40 hover:border-rose-400">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
