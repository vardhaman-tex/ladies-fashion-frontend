"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ImagePlus, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { createProduct } from "@/services/adminProductService";
import type { ApiError } from "@/types/api";
import type { ProductStatus } from "@/types/product";

const STATUS_OPTIONS: ProductStatus[] = ["DRAFT", "ACTIVE", "INACTIVE"];

export default function NewProductPage() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [fabricDetails, setFabricDetails] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [price, setPrice] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [color, setColor] = useState("");
  const [fabric, setFabric] = useState("");
  const [occasion, setOccasion] = useState("");
  const [sizes, setSizes] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("");
  const [status, setStatus] = useState<ProductStatus>("DRAFT");
  const [isFeatured, setIsFeatured] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCategory = categories?.find((c) => c.id === categoryId);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setImages((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !price || !categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const product = await createProduct(
        {
          name,
          sku,
          description: description || undefined,
          fabricDetails: fabricDetails || undefined,
          careInstructions: careInstructions || undefined,
          price: Number(price),
          discountAmount: discountAmount ? Number(discountAmount) : undefined,
          categoryId,
          subCategoryId: subCategoryId || undefined,
          color: color || undefined,
          fabric: fabric || undefined,
          occasion: occasion || undefined,
          sizes: sizes || undefined,
          stockQuantity: stockQuantity ? Number(stockQuantity) : undefined,
          lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : undefined,
          status,
          isFeatured,
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
        },
        images
      );
      toast.success("Product created successfully");
      router.push(`/products/${product.slug}`);
    } catch (error) {
      const message = isAxiosError<ApiError>(error)
        ? error.response?.data?.message ?? "Unable to create product"
        : "Unable to create product";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">New Product</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
            <Label htmlFor="color">Color</Label>
            <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fabric">Fabric</Label>
            <Input id="fabric" value={fabric} onChange={(e) => setFabric(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="occasion">Occasion</Label>
            <Input id="occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sizes">
              Sizes <span className="text-muted-foreground font-normal">(e.g. S,M,L,XL)</span>
            </Label>
            <Input id="sizes" value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S,M,L,XL,XXL" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="stockQuantity">Stock Quantity</Label>
            <Input id="stockQuantity" type="number" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
            <Input id="lowStockThreshold" type="number" min="0" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus((v ?? "DRAFT") as ProductStatus)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Label className="flex items-center gap-2 text-sm font-normal">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Featured product
        </Label>

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
          {isSubmitting ? "Creating..." : "Create Product"}
        </Button>
      </form>
    </div>
  );
}
