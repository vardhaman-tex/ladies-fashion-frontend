"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ImagePlus, XIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { createProduct, createVariant, type SizeInventoryEntry } from "@/services/adminProductService";
import type { ApiError } from "@/types/api";
import type { ProductDetail, ProductStatus } from "@/types/product";

const STATUS_OPTIONS: ProductStatus[] = ["DRAFT", "ACTIVE", "INACTIVE"];

interface SizeRow {
  size: string;
  skuCode: string;
  availableQty: string;
  lowStockThreshold: string;
}

function emptySizeRow(): SizeRow {
  return { size: "", skuCode: "", availableQty: "", lowStockThreshold: "" };
}

export default function NewProductPage() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const imageInputRef = useRef<HTMLInputElement>(null);

  /* ─── Step 1: product design ──────────────────────────────────────────── */
  const [step, setStep] = useState<1 | 2>(1);
  const [createdProduct, setCreatedProduct] = useState<ProductDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [fabricDetails, setFabricDetails] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [price, setPrice] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [fabric, setFabric] = useState("");
  const [occasion, setOccasion] = useState("");
  const [status, setStatus] = useState<ProductStatus>("DRAFT");
  const [isFeatured, setIsFeatured] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  /* ─── Step 2: first color variant ─────────────────────────────────────── */
  const [color, setColor] = useState("");
  const [colorHex, setColorHex] = useState("");
  const [sizeRows, setSizeRows] = useState<SizeRow[]>([emptySizeRow()]);
  const [images, setImages] = useState<File[]>([]);

  const selectedCategory = categories?.find((c) => c.id === categoryId);

  function updateSizeRow(index: number, patch: Partial<SizeRow>) {
    setSizeRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addSizeRow() {
    setSizeRows((rows) => [...rows, emptySizeRow()]);
  }

  function removeSizeRow(index: number) {
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

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !price || !categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const product = await createProduct({
        name,
        sku,
        description: description || undefined,
        fabricDetails: fabricDetails || undefined,
        careInstructions: careInstructions || undefined,
        price: Number(price),
        discountAmount: discountAmount ? Number(discountAmount) : undefined,
        categoryId,
        subCategoryId: subCategoryId || undefined,
        fabric: fabric || undefined,
        occasion: occasion || undefined,
        status,
        isFeatured,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
      });
      setCreatedProduct(product);
      setStep(2);
    } catch (error) {
      const message = isAxiosError<ApiError>(error)
        ? error.response?.data?.message ?? "Unable to create product"
        : "Unable to create product";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!createdProduct) return;
    if (!color.trim()) {
      toast.error("Please name this color");
      return;
    }
    const entries: SizeInventoryEntry[] = sizeRows
      .filter((row) => row.size.trim())
      .map((row) => ({
        size: row.size.trim(),
        skuCode: row.skuCode.trim() || undefined,
        availableQty: row.availableQty ? Number(row.availableQty) : 0,
        lowStockThreshold: row.lowStockThreshold ? Number(row.lowStockThreshold) : undefined,
      }));
    if (entries.length === 0) {
      toast.error("Please add at least one size");
      return;
    }
    setIsSubmitting(true);
    try {
      const product = await createVariant(
        createdProduct.id,
        { color: color.trim(), colorHex: colorHex || undefined, sizes: entries },
        images
      );
      toast.success("Product created successfully");
      router.push(`/products/${product.slug}`);
    } catch (error) {
      const message = isAxiosError<ApiError>(error)
        ? error.response?.data?.message ?? "Unable to add color variant"
        : "Unable to add color variant";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">New Product</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Step {step} of 2 — {step === 1 ? "Product details" : "First color & stock"}
      </p>

      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="min-h-24 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fabricDetails">Fabric Details</Label>
              <textarea
                id="fabricDetails"
                className="min-h-20 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={fabricDetails}
                onChange={(e) => setFabricDetails(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="careInstructions">Care Instructions</Label>
              <textarea
                id="careInstructions"
                className="min-h-20 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Price *</Label>
              <Input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="discountAmount">Discount Amount</Label>
              <Input id="discountAmount" type="number" step="0.01" min="0" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v ?? ""); setSubCategoryId(""); }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Sub-category</Label>
              <Select value={subCategoryId} onValueChange={(v) => setSubCategoryId(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select sub-category" /></SelectTrigger>
                <SelectContent>
                  {selectedCategory?.subCategories.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fabric">Fabric</Label>
              <Input id="fabric" value={fabric} onChange={(e) => setFabric(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="occasion">Occasion</Label>
              <Input id="occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus((v ?? "DRAFT") as ProductStatus)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Label className="flex items-center gap-2 text-sm font-normal self-end pb-2.5">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              Featured product
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input id="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Input id="metaDescription" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating..." : "Next: Add color & stock"}
          </Button>
        </form>
      )}

      {step === 2 && createdProduct && (
        <form onSubmit={handleStep2Submit} className="mt-6 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            “{createdProduct.name}” was created. Add its first color, sizes, and stock below.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="color">Color name *</Label>
              <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Maroon" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="colorHex">Color swatch (optional)</Label>
              <Input id="colorHex" type="color" value={colorHex || "#000000"} onChange={(e) => setColorHex(e.target.value)} className="h-9 w-20 p-1" />
            </div>
          </div>

          {/* Sizes + stock */}
          <div className="flex flex-col gap-2">
            <Label>Sizes & stock *</Label>
            <div className="flex flex-col gap-2">
              {sizeRows.map((row, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
                  <Input
                    placeholder="Size (e.g. M)"
                    value={row.size}
                    onChange={(e) => updateSizeRow(index, { size: e.target.value })}
                  />
                  <Input
                    placeholder="SKU code (optional)"
                    value={row.skuCode}
                    onChange={(e) => updateSizeRow(index, { skuCode: e.target.value })}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Qty"
                    value={row.availableQty}
                    onChange={(e) => updateSizeRow(index, { availableQty: e.target.value })}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Low stock at"
                    value={row.lowStockThreshold}
                    onChange={(e) => updateSizeRow(index, { lowStockThreshold: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeSizeRow(index)}
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
              onClick={addSizeRow}
              className="flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
            >
              <Plus className="size-3.5" /> Add size
            </button>
            <p className="text-xs text-muted-foreground">
              No size variations? Add one row with a size like “Free Size”.
            </p>
          </div>

          {/* Images */}
          <div className="flex flex-col gap-2">
            <Label>Images</Label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative size-20 overflow-hidden rounded-lg border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(img)} alt={img.name} className="size-full object-cover" />
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

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex w-fit items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
            >
              <ImagePlus className="size-4" />
              {images.length === 0 ? "Add images" : "Add more images"}
            </button>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : "Finish & Create Product"}
          </Button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Skip — add a color variant later
          </button>
        </form>
      )}
    </div>
  );
}
