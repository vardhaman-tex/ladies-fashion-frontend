"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Download, Plus, Upload, X } from "lucide-react";
import { useAdminInventory, useUpdateInventory, useUpdateSizeInventories } from "@/hooks/useAdmin";
import { exportInventoryExcel, importInventoryExcel } from "@/services/adminService";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { cn } from "@/lib/utils";
import type { Inventory } from "@/types/product";

interface SizeEntry { size: string; availableQty: number; }

function SizesModal({ item, onClose }: { item: Inventory; onClose: () => void }) {
  const [sizes, setSizes] = useState<SizeEntry[]>(
    item.sizeInventories?.length > 0
      ? item.sizeInventories.map((s) => ({ ...s }))
      : [{ size: "", availableQty: 0 }]
  );
  const updateSizes = useUpdateSizeInventories();

  function addRow() { setSizes((p) => [...p, { size: "", availableQty: 0 }]); }
  function removeRow(i: number) { setSizes((p) => p.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, field: keyof SizeEntry, value: string | number) {
    setSizes((p) => p.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  async function handleSave() {
    const valid = sizes.filter((s) => s.size.trim());
    try {
      await updateSizes.mutateAsync({ productId: item.productId, entries: valid });
      toast.success("Size inventory updated");
      onClose();
    } catch {
      toast.error("Failed to update size inventory");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold text-sm">Size Inventory</h2>
            <p className="text-xs text-muted-foreground">{item.productName ?? item.productId}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-2 p-5">
          <div className="grid grid-cols-[1fr_80px_32px] gap-1.5 text-xs font-medium text-muted-foreground mb-1">
            <span>Size</span><span>Qty</span><span />
          </div>
          {sizes.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_32px] gap-1.5">
              <input
                value={s.size}
                onChange={(e) => updateRow(i, "size", e.target.value.toUpperCase())}
                placeholder="e.g. S"
                className="rounded border border-input bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-rose-400"
              />
              <input
                type="number" min={0} value={s.availableQty}
                onChange={(e) => updateRow(i, "availableQty", Number(e.target.value))}
                className="rounded border border-input bg-transparent px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-rose-400"
              />
              <button onClick={() => removeRow(i)} className="flex items-center justify-center text-muted-foreground hover:text-red-500">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <button onClick={addRow} className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 mt-1">
            <Plus className="size-3.5" /> Add size
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            Saving sizes here also updates the product's size list, enabling size-based cart gating on the storefront.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
          <button
            onClick={handleSave} disabled={updateSizes.isPending}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {updateSizes.isPending ? "Saving…" : "Save Sizes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminInventoryPage() {
  const searchParams = useSearchParams();
  const highlightProductId = searchParams.get("product");

  const [page, setPage] = useState(0);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editing, setEditing] = useState<{ id: string; qty: number; threshold: number } | null>(null);
  const [sizesItem, setSizesItem] = useState<Inventory | null>(null);

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
      await updateInventory.mutateAsync({ productId: editing.id, stockQuantity: editing.qty, lowStockThreshold: editing.threshold });
      toast.success("Inventory updated");
      setEditing(null);
    } catch {
      toast.error("Failed to update inventory");
    }
  }

  const items = (data?.content ?? []) as Inventory[];
  const totalPages = (data as { totalPages?: number })?.totalPages ?? 1;

  return (
    <div className="p-6 lg:p-8">
      {sizesItem && <SizesModal item={sizesItem} onClose={() => setSizesItem(null)} />}

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
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Sizes</th>
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
                    const hasSizeInv = (item.sizeInventories?.length ?? 0) > 0;
                    return (
                      <tr
                      key={item.productId}
                      id={`inv-${item.productId}`}
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
                                <Image src={item.productThumbnail} alt={item.productName ?? ""} fill className="object-cover" sizes="40px" />
                              </div>
                            ) : (
                              <div className="size-10 shrink-0 rounded-lg bg-muted" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-medium text-sm max-w-[180px]">{item.productName ?? "—"}</p>
                              <p className="text-xs text-muted-foreground">{item.productSku ?? ""}</p>
                            </div>
                            {isLow && <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />}
                          </div>
                        </td>

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

                        {/* Size inventory */}
                        <td className="px-4 py-3">
                          {hasSizeInv ? (
                            <div className="flex flex-wrap gap-1">
                              {item.sizeInventories.map((s) => (
                                <span key={s.size} className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                                  {s.size}: {s.availableQty}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
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
                            <div className="flex gap-1 flex-wrap">
                              <button
                                onClick={() => setEditing({ id: item.productId, qty: item.availableQty, threshold: item.lowStockThreshold })}
                                className="rounded border px-2 py-1 text-xs hover:border-rose-400 hover:text-rose-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setSizesItem(item)}
                                className="rounded border px-2 py-1 text-xs hover:border-purple-400 hover:text-purple-600"
                              >
                                Sizes
                              </button>
                            </div>
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
