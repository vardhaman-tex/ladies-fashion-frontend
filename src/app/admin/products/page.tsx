"use client";

import * as XLSX from "xlsx";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import {
  useAdminProducts,
  useDeleteAdminProduct,
  useUpdateAdminProductStatus,
  useBulkUploadProducts,
} from "@/hooks/useAdmin";
import type { BulkUploadResult } from "@/services/adminService";
import { cn } from "@/lib/utils";

const STATUS_CHIP: Record<string, string> = {
  ACTIVE:       "bg-green-100 text-green-800",
  INACTIVE:     "bg-red-100 text-red-800",
  OUT_OF_STOCK: "bg-amber-100 text-amber-800",
  DRAFT:        "bg-muted text-muted-foreground",
};

export default function AdminProductsPage() {
  const [page, setPage] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useAdminProducts(undefined, page);
  const deleteProduct  = useDeleteAdminProduct();
  const updateStatus   = useUpdateAdminProductStatus();
  const bulkUpload     = useBulkUploadProducts();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setUploadFile(f);
    setUploadResult(null);
  }

  async function handleBulkUpload() {
    if (!uploadFile) return;
    try {
      const result = await bulkUpload.mutateAsync(uploadFile);
      setUploadResult(result);
      if (result.failed === 0) {
        toast.success(`Uploaded ${result.success} products`);
      } else {
        toast.warning(`${result.success} uploaded, ${result.failed} failed`);
      }
    } catch {
      toast.error("Bulk upload failed");
    }
  }

  function downloadSample() {
    const headers = [
      "name", "sku", "description", "price", "discountAmount",
      "categorySlug", "subCategorySlug", "color", "fabric",
      "occasion", "sizes", "stockQuantity", "status", "imageUrls",
      "fabricDetails", "careInstructions", "categoryImageUrl",
    ];
    const sample = [
      "Floral Kurti", "KRT-001", "Beautiful floral print kurti", 999, 100,
      "kurtis", "cotton-kurtis", "Pink", "Cotton",
      "Casual", "S,M,L,XL", 50, "ACTIVE",
      "https://res.cloudinary.com/your-cloud/image/upload/v1/products/img1.jpg",
      "100% Cotton, lightweight", "Machine wash cold, do not bleach",
      "https://res.cloudinary.com/your-cloud/image/upload/v1/categories/kurtis.jpg",
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    // Set column widths
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "product-upload-sample.xlsx");
  }

  function closeUpload() {
    setUploadOpen(false);
    setUploadFile(null);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast.success(`Product ${newStatus === "ACTIVE" ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  const products = data?.content ?? [];

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            <Upload className="size-4" /> Upload Excel
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            <Plus className="size-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Bulk upload modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold">Bulk Upload Products</h2>
              <button onClick={closeUpload} className="text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              {/* Column guide */}
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
                <p className="mb-1 font-semibold text-foreground">Expected columns (row 1 = header):</p>
                <p className="font-mono leading-relaxed">
                  name · sku · description · price · discountAmount · categorySlug · subCategorySlug · color · fabric · occasion · sizes · stockQuantity · status · imageUrls · fabricDetails · careInstructions · categoryImageUrl
                </p>
              </div>

              <button
                onClick={downloadSample}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-green-400 bg-green-50/50 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
              >
                <FileSpreadsheet className="size-4" /> Download sample .xlsx
              </button>

              {/* File picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 text-center transition-colors",
                  uploadFile ? "border-rose-300 bg-rose-50/40" : "border-muted-foreground/30 hover:border-rose-300"
                )}
              >
                <FileSpreadsheet className={cn("size-8", uploadFile ? "text-rose-600" : "text-muted-foreground")} />
                {uploadFile ? (
                  <p className="text-sm font-medium text-rose-700">{uploadFile.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Click to select an <span className="font-semibold">.xlsx</span> file</p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Result */}
              {uploadResult && (
                <div className="rounded-lg border p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold">
                    {uploadResult.failed === 0 ? (
                      <CheckCircle2 className="size-4 text-green-600" />
                    ) : (
                      <AlertCircle className="size-4 text-amber-500" />
                    )}
                    Upload complete — {uploadResult.total} rows processed
                  </div>
                  <div className="mt-2 flex gap-4 text-muted-foreground">
                    <span className="text-green-600">{uploadResult.success} succeeded</span>
                    {uploadResult.failed > 0 && (
                      <span className="text-red-500">{uploadResult.failed} failed</span>
                    )}
                  </div>
                  {uploadResult.errors.length > 0 && (
                    <div className="mt-3 max-h-36 overflow-y-auto rounded bg-muted/50 p-2 font-mono text-xs text-red-600">
                      {uploadResult.errors.map((e, i) => (
                        <div key={i}>{JSON.stringify(e)}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={closeUpload}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
                >
                  {uploadResult ? "Close" : "Cancel"}
                </button>
                {!uploadResult && (
                  <button
                    onClick={handleBulkUpload}
                    disabled={!uploadFile || bulkUpload.isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {bulkUpload.isPending ? "Uploading…" : "Upload"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Product</th>
                <th className="hidden px-4 py-3 sm:table-cell">SKU</th>
                <th className="hidden px-4 py-3 md:table-cell">Color</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : products.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          className="flex items-center gap-3 hover:text-rose-600"
                        >
                          <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                            {p.thumbnail && (
                              <Image
                                src={p.thumbnail}
                                alt={p.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            )}
                          </div>
                          <span className="max-w-[140px] truncate font-medium sm:max-w-[200px]">
                            {p.name}
                          </span>
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground sm:table-cell">
                        {p.sku}
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {p.color ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-rose-600">
                          ₹{p.finalPrice.toLocaleString("en-IN")}
                        </span>
                        {p.discountAmount > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground line-through">
                            ₹{p.price.toLocaleString("en-IN")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            STATUS_CHIP[p.status] ?? STATUS_CHIP.DRAFT
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products/${p.slug}/edit`}
                            className="text-muted-foreground hover:text-foreground"
                            title="Edit product"
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <Link
                            href={`/admin/inventory?product=${p.id}`}
                            className="text-muted-foreground hover:text-blue-600"
                            title="Manage inventory"
                          >
                            <Package className="size-4" />
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(p.id, p.status)}
                            className="text-muted-foreground hover:text-foreground"
                            title={p.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          >
                            {p.status === "ACTIVE" ? (
                              <ToggleRight className="size-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="size-4 text-muted-foreground" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="text-muted-foreground hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
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
              Page {page + 1} of {data.totalPages} ({data.totalElements} products)
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
