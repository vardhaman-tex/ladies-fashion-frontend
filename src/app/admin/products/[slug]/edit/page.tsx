"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, XIcon, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { ProductDetail, ProductImage } from "@/types/product";
import type { Category } from "@/types/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { deleteProductImage } from "@/services/adminProductService";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName]           = useState("");
  const [price, setPrice]         = useState("");
  const [discount, setDiscount]   = useState("");
  const [sku, setSku]             = useState("");
  const [color, setColor]         = useState("");
  const [fabric, setFabric]       = useState("");
  const [occasion, setOccasion]   = useState("");
  const [sizes, setSizes]         = useState("");
  const [description, setDesc]    = useState("");
  const [status, setStatus]       = useState("ACTIVE");
  const [categoryId, setCatId]    = useState("");
  const [featured, setFeatured]   = useState(false);

  // Image state
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, cRes] = await Promise.all([
          api.get<ApiResponse<ProductDetail>>(`/api/v1/products/${slug}`),
          api.get<ApiResponse<Category[]>>("/api/v1/categories"),
        ]);
        const p = pRes.data.data;
        setProduct(p);
        setName(p.name);
        setPrice(p.price.toString());
        setDiscount(p.discountAmount.toString());
        setSku(p.sku);
        setColor(p.color ?? "");
        setFabric(p.fabric ?? "");
        setOccasion("");
        setSizes(p.sizes ?? "");
        setDesc(p.description ?? "");
        setStatus(p.status);
        setCatId(p.category?.id ?? "");
        setFeatured(p.isFeatured);
        setExistingImages(p.images ?? []);
        setCategories(cRes.data.data);
      } catch {
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [slug]);

  function handleNewImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setNewImages((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  function removeNewImage(index: number) {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleDeleteExistingImage(imageId: string) {
    if (!product) return;
    setDeletingImageId(imageId);
    try {
      await deleteProductImage(product.id, imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
    } finally {
      setDeletingImageId(null);
    }
  }

  async function handleSave() {
    if (!product) return;
    setSaving(true);
    try {
      const formData = new FormData();
      const payload = {
        name,
        sku,
        description,
        fabricDetails: product.fabricDetails ?? "",
        careInstructions: product.careInstructions ?? "",
        price: parseFloat(price),
        discountAmount: parseFloat(discount) || 0,
        categoryId,
        subCategoryId: product.subCategory?.id ?? null,
        color,
        fabric,
        occasion,
        sizes: sizes || null,
        stockQuantity: product.inventory?.availableQty ?? 0,
        lowStockThreshold: product.inventory?.lowStockThreshold ?? 5,
        status,
        isFeatured: featured,
        metaTitle: product.metaTitle ?? "",
        metaDescription: product.metaDescription ?? "",
      };
      formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      newImages.forEach((img) => formData.append("images", img));
      await api.put(`/api/v1/admin/products/${product.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Product updated");
      router.push("/admin/products");
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
            <label className="mb-1 block text-sm font-medium">Color</label>
            <Input value={color} onChange={(e) => setColor(e.target.value)} />
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
            <label className="mb-1 block text-sm font-medium">
              Sizes <span className="text-muted-foreground font-normal">(e.g. S,M,L,XL)</span>
            </label>
            <Input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S,M,L,XL,XXL" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DRAFT">Draft</option>
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

        {/* Images section */}
        <div>
          <label className="mb-2 block text-sm font-medium">Images</label>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {existingImages.map((img) => (
                <div key={img.id} className="relative size-20 overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.imageUrl} alt="Product image" className="size-full object-cover" />
                  {img.isPrimary && (
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[9px] text-white">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteExistingImage(img.id)}
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

          {/* New images to be added on save */}
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
            onChange={handleNewImageChange}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            <ImagePlus className="size-4" />
            Add images
          </button>
          {newImages.length > 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {newImages.length} new image{newImages.length !== 1 ? "s" : ""} will be uploaded on save
            </p>
          )}
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
    </div>
  );
}
