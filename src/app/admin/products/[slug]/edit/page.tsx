"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, XIcon, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { ProductDetail, ProductStatus, ProductVariant } from "@/types/product";
import type { Category } from "@/types/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import {
  getAdminProductBySlug,
  updateProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  deleteVariantImage,
  type SizeInventoryEntry,
} from "@/services/adminProductService";

interface SizeRow {
  size: string;
  skuCode: string;
  availableQty: string;
  lowStockThreshold: string;
}

function emptySizeRow(): SizeRow {
  return { size: "", skuCode: "", availableQty: "", lowStockThreshold: "" };
}

function toEntries(rows: SizeRow[]): SizeInventoryEntry[] {
  return rows
    .filter((r) => r.size.trim())
    .map((r) => ({
      size: r.size.trim(),
      skuCode: r.skuCode.trim() || undefined,
      availableQty: r.availableQty ? Number(r.availableQty) : 0,
      lowStockThreshold: r.lowStockThreshold ? Number(r.lowStockThreshold) : undefined,
    }));
}

/* ─── One color variant: details, sizes/stock, images ───────────────────── */
function VariantEditor({
  productId,
  variant,
  onUpdated,
  onDeleted,
}: {
  productId: string;
  variant: ProductVariant;
  onUpdated: (p: ProductDetail) => void;
  onDeleted: (p: ProductDetail) => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [color, setColor] = useState(variant.color);
  const [colorHex, setColorHex] = useState(variant.colorHex ?? "");
  const [isActive, setIsActive] = useState(variant.isActive);
  const [sizeRows, setSizeRows] = useState<SizeRow[]>(
    variant.skus.map((s) => ({
      size: s.size,
      skuCode: s.skuCode ?? "",
      availableQty: s.availableQty.toString(),
      lowStockThreshold: s.lowStockThreshold.toString(),
    }))
  );
  const [newImages, setNewImages] = useState<File[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function updateRow(index: number, patch: Partial<SizeRow>) {
    setSizeRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setSizeRows((rows) => [...rows, emptySizeRow()]);
  }
  function removeRow(index: number) {
    setSizeRows((rows) => rows.filter((_, i) => i !== index));
  }
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setNewImages((prev) => [...prev, ...files]);
    e.target.value = "";
  }
  function removeNewImage(index: number) {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleDeleteImage(imageId: string) {
    setDeletingImageId(imageId);
    try {
      const updated = await deleteVariantImage(productId, variant.id, imageId);
      onUpdated(updated);
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
    } finally {
      setDeletingImageId(null);
    }
  }

  async function handleSave() {
    if (!color.trim()) {
      toast.error("Color name is required");
      return;
    }
    const entries = toEntries(sizeRows);
    if (entries.length === 0) {
      toast.error("Add at least one size");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateVariant(
        productId,
        variant.id,
        { color: color.trim(), colorHex: colorHex || undefined, isActive, sizes: entries },
        newImages
      );
      onUpdated(updated);
      setNewImages([]);
      toast.success(`"${color}" saved`);
    } catch {
      toast.error("Failed to save color variant");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteVariant() {
    if (!confirm(`Delete the "${variant.color}" color? This removes its images and stock.`)) return;
    setDeleting(true);
    try {
      const updated = await deleteVariant(productId, variant.id);
      onDeleted(updated);
      toast.success("Color variant deleted");
    } catch {
      toast.error("Failed to delete color variant");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div>
          <label className="mb-1 block text-sm font-medium">Color name</label>
          <Input value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Swatch</label>
          <input
            type="color"
            value={colorHex || "#000000"}
            onChange={(e) => setColorHex(e.target.value)}
            className="h-9 w-16 rounded-md border p-1"
          />
        </div>
        <div className="flex items-center gap-2 self-end pb-2">
          <input
            type="checkbox"
            id={`active-${variant.id}`}
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4"
          />
          <label htmlFor={`active-${variant.id}`} className="text-sm font-medium">Active</label>
        </div>
      </div>

      {/* Sizes + stock */}
      <div>
        <label className="mb-1 block text-sm font-medium">Sizes & stock</label>
        <div className="flex flex-col gap-2">
          {sizeRows.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
              <Input placeholder="Size" value={row.size} onChange={(e) => updateRow(index, { size: e.target.value })} />
              <Input placeholder="SKU code" value={row.skuCode} onChange={(e) => updateRow(index, { skuCode: e.target.value })} />
              <Input type="number" min="0" placeholder="Qty" value={row.availableQty} onChange={(e) => updateRow(index, { availableQty: e.target.value })} />
              <Input type="number" min="0" placeholder="Low stock at" value={row.lowStockThreshold} onChange={(e) => updateRow(index, { lowStockThreshold: e.target.value })} />
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={sizeRows.length === 1}
                className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground hover:text-red-500 disabled:opacity-40"
                aria-label="Remove size"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-2 flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-3.5" /> Add size
        </button>
      </div>

      {/* Images */}
      <div>
        <label className="mb-2 block text-sm font-medium">Images</label>
        {variant.images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {variant.images.map((img) => (
              <div key={img.id} className="relative size-20 overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.imageUrl} alt={variant.color} className="size-full object-cover" />
                {img.isPrimary && (
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[9px] text-white">
                    Primary
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  disabled={deletingImageId === img.id}
                  className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5 disabled:opacity-50"
                  aria-label="Remove image"
                >
                  {deletingImageId === img.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <XIcon className="size-3" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
        {newImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {newImages.map((file, index) => (
              <div key={index} className="relative size-20 overflow-hidden rounded-lg border border-dashed border-rose-400">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(file)} alt={file.name} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5"
                  aria-label="Remove image"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleImageChange}
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
        >
          <ImagePlus className="size-4" /> Add images
        </button>
        {newImages.length > 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {newImages.length} new image{newImages.length !== 1 ? "s" : ""} will upload when you save this color
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Color"}
        </Button>
        <Button variant="outline" onClick={handleDeleteVariant} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete Color"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Add a new color variant ─────────────────────────────────────────────── */
function AddVariantForm({
  productId,
  onCreated,
}: {
  productId: string;
  onCreated: (p: ProductDetail) => void;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState("");
  const [colorHex, setColorHex] = useState("");
  const [sizeRows, setSizeRows] = useState<SizeRow[]>([emptySizeRow()]);
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  function updateRow(index: number, patch: Partial<SizeRow>) {
    setSizeRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setSizeRows((rows) => [...rows, emptySizeRow()]);
  }
  function removeRow(index: number) {
    setSizeRows((rows) => rows.filter((_, i) => i !== index));
  }
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setImages((prev) => [...prev, ...files]);
    e.target.value = "";
  }
  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function reset() {
    setColor("");
    setColorHex("");
    setSizeRows([emptySizeRow()]);
    setImages([]);
    setOpen(false);
  }

  async function handleCreate() {
    if (!color.trim()) {
      toast.error("Color name is required");
      return;
    }
    const entries = toEntries(sizeRows);
    if (entries.length === 0) {
      toast.error("Add at least one size");
      return;
    }
    setSaving(true);
    try {
      const updated = await createVariant(
        productId,
        { color: color.trim(), colorHex: colorHex || undefined, sizes: entries },
        images
      );
      onCreated(updated);
      reset();
      toast.success(`"${color}" added`);
    } catch {
      toast.error("Failed to add color variant");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
      >
        <Plus className="size-4" /> Add a new color
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-dashed p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label className="mb-1 block text-sm font-medium">Color name</label>
          <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Maroon" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Swatch</label>
          <input
            type="color"
            value={colorHex || "#000000"}
            onChange={(e) => setColorHex(e.target.value)}
            className="h-9 w-16 rounded-md border p-1"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Sizes & stock</label>
        <div className="flex flex-col gap-2">
          {sizeRows.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
              <Input placeholder="Size" value={row.size} onChange={(e) => updateRow(index, { size: e.target.value })} />
              <Input placeholder="SKU code" value={row.skuCode} onChange={(e) => updateRow(index, { skuCode: e.target.value })} />
              <Input type="number" min="0" placeholder="Qty" value={row.availableQty} onChange={(e) => updateRow(index, { availableQty: e.target.value })} />
              <Input type="number" min="0" placeholder="Low stock at" value={row.lowStockThreshold} onChange={(e) => updateRow(index, { lowStockThreshold: e.target.value })} />
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={sizeRows.length === 1}
                className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground hover:text-red-500 disabled:opacity-40"
                aria-label="Remove size"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-2 flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-3.5" /> Add size
        </button>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Images</label>
        {images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {images.map((file, index) => (
              <div key={index} className="relative size-20 overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(file)} alt={file.name} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5"
                  aria-label="Remove image"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleImageChange}
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
        >
          <ImagePlus className="size-4" /> Add images
        </button>
      </div>

      <div className="flex gap-3 pt-1">
        <Button onClick={handleCreate} disabled={saving}>
          {saving ? "Adding…" : "Add Color"}
        </Button>
        <Button variant="outline" onClick={reset} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ─── Main page: product design + color variants ─────────────────────────── */
export default function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Design form state
  const [name, setName]         = useState("");
  const [price, setPrice]       = useState("");
  const [discount, setDiscount] = useState("");
  const [sku, setSku]           = useState("");
  const [fabric, setFabric]     = useState("");
  const [occasion, setOccasion] = useState("");
  const [description, setDesc]  = useState("");
  const [status, setStatus]     = useState<ProductStatus>("ACTIVE");
  const [categoryId, setCatId]  = useState("");
  const [featured, setFeatured] = useState(false);

  function applyProduct(p: ProductDetail) {
    setProduct(p);
    setName(p.name);
    setPrice(p.price.toString());
    setDiscount(p.discountAmount.toString());
    setSku(p.sku);
    setFabric(p.fabric ?? "");
    setOccasion(p.occasion ?? "");
    setDesc(p.description ?? "");
    setStatus(p.status);
    setCatId(p.category?.id ?? "");
    setFeatured(p.isFeatured);
  }

  useEffect(() => {
    async function load() {
      try {
        const [p, cRes] = await Promise.all([
          getAdminProductBySlug(slug),
          api.get<ApiResponse<Category[]>>("/api/v1/categories"),
        ]);
        applyProduct(p);
        setCategories(cRes.data.data);
      } catch {
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [slug]);

  async function handleSave() {
    if (!product) return;
    setSaving(true);
    try {
      const updated = await updateProduct(product.id, {
        name,
        sku,
        description: description || undefined,
        fabricDetails: product.fabricDetails ?? undefined,
        careInstructions: product.careInstructions ?? undefined,
        price: parseFloat(price) || 0,
        discountAmount: parseFloat(discount) || 0,
        categoryId,
        subCategoryId: product.subCategory?.id ?? undefined,
        fabric: fabric || undefined,
        occasion: occasion || undefined,
        status,
        isFeatured: featured,
        metaTitle: product.metaTitle ?? undefined,
        metaDescription: product.metaDescription ?? undefined,
      });
      applyProduct(updated);
      toast.success("Product updated");
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4 lg:p-8">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-4 lg:p-8 text-center text-muted-foreground">
        Product not found.
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/products"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Products
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold">Edit</span>
      </div>

      <div className="max-w-2xl space-y-5 rounded-xl border p-6">
        <h1 className="text-xl font-bold">Edit Product</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">SKU</label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCatId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">— select —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Price (₹)</label>
            <Input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Discount Amount (₹)</label>
            <Input type="number" min={0} step={0.01} value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Fabric</label>
            <Input value={fabric} onChange={(e) => setFabric(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Occasion</label>
            <Input value={occasion} onChange={(e) => setOccasion(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DRAFT">Draft</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end">
            <input
              type="checkbox"
              id="featured"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="size-4"
            />
            <label htmlFor="featured" className="text-sm font-medium">Featured</label>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/admin/products")}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Color variants */}
      <div className="mt-8 max-w-2xl space-y-4">
        <h2 className="text-lg font-bold">Color Variants</h2>
        <p className="text-sm text-muted-foreground">
          Each color has its own images and per-size stock. Customers pick a color, then a size, on the product page.
        </p>

        {product.variants.map((variant) => (
          <VariantEditor
            key={variant.id}
            productId={product.id}
            variant={variant}
            onUpdated={applyProduct}
            onDeleted={applyProduct}
          />
        ))}

        <AddVariantForm productId={product.id} onCreated={applyProduct} />
      </div>
    </div>
  );
}
