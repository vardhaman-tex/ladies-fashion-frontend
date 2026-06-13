"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { ProductDetail } from "@/types/product";
import type { Category } from "@/types/category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/common/LoadingSkeleton";

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

  // Form state
  const [name, setName]           = useState("");
  const [price, setPrice]         = useState("");
  const [discount, setDiscount]   = useState("");
  const [sku, setSku]             = useState("");
  const [color, setColor]         = useState("");
  const [fabric, setFabric]       = useState("");
  const [occasion, setOccasion]   = useState("");
  const [description, setDesc]    = useState("");
  const [status, setStatus]       = useState("ACTIVE");
  const [categoryId, setCatId]    = useState("");
  const [featured, setFeatured]   = useState(false);

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
        setDesc(p.description ?? "");
        setStatus(p.status);
        setCatId(p.category?.id ?? "");
        setFeatured(p.isFeatured);
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
        stockQuantity: product.inventory?.availableQty ?? 0,
        lowStockThreshold: product.inventory?.lowStockThreshold ?? 5,
        status,
        isFeatured: featured,
        metaTitle: product.metaTitle ?? "",
        metaDescription: product.metaDescription ?? "",
      };
      formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
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
            <Input
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Discount Amount (₹)</label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
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
            <label htmlFor="featured" className="text-sm font-medium">
              Featured
            </label>
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
    </div>
  );
}
