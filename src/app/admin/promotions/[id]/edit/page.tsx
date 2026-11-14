"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAdminPromotion, useUpdatePromotion } from "@/hooks/usePromotions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import type { CreatePromotionPayload, DiscountType } from "@/types/promotion";

export default function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: promotion, isLoading } = useAdminPromotion(id);
  const update = useUpdatePromotion(id);

  const [form, setForm] = useState<CreatePromotionPayload | null>(null);

  useEffect(() => {
    if (promotion && !form) {
      setForm({
        name: promotion.name,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        maxDiscount: promotion.maxDiscount,
        minOrderValue: promotion.minOrderValue,
        validFrom: promotion.validFrom,
        validTo: promotion.validTo,
        isActive: promotion.isActive,
        priority: promotion.priority,
        restrictedProductIds: promotion.restrictedProductIds,
        restrictedCategoryIds: promotion.restrictedCategoryIds,
      });
    }
  }, [promotion, form]);

  function set<K extends keyof CreatePromotionPayload>(key: K, value: CreatePromotionPayload[K]) {
    setForm((f) => f ? { ...f, [key]: value } : f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    try {
      await update.mutateAsync(form);
      router.push("/admin/promotions");
    } catch {
      // error toast handled by hook
    }
  }

  if (isLoading || !form) {
    return (
      <div className="p-6 lg:p-8 space-y-4 max-w-xl">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/admin/promotions"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Promotions
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Edit Promotion: {promotion?.name}</h1>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Name *</label>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <Input
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value || null)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Discount Type *</label>
            <select
              value={form.discountType}
              onChange={(e) => set("discountType", e.target.value as DiscountType)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="FLAT">Flat (₹)</option>
              <option value="PERCENT">Percent (%)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Discount Value *</label>
            <Input
              type="number"
              min={0}
              step={form.discountType === "PERCENT" ? "0.01" : "1"}
              value={form.discountValue}
              onChange={(e) => set("discountValue", parseFloat(e.target.value) || 0)}
              required
            />
          </div>
        </div>

        {form.discountType === "PERCENT" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Max Discount (₹)</label>
            <Input
              type="number"
              min={0}
              placeholder="Leave blank for no cap"
              value={form.maxDiscount ?? ""}
              onChange={(e) => set("maxDiscount", e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Min Order Value (₹)</label>
            <Input
              type="number"
              min={0}
              placeholder="None"
              value={form.minOrderValue ?? ""}
              onChange={(e) => set("minOrderValue", e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Priority</label>
            <Input
              type="number"
              min={0}
              value={form.priority}
              onChange={(e) => set("priority", parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Valid From</label>
            <Input
              type="datetime-local"
              value={form.validFrom ? form.validFrom.slice(0, 16) : ""}
              onChange={(e) => set("validFrom", e.target.value ? `${e.target.value}:00` : null)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Valid To</label>
            <Input
              type="datetime-local"
              value={form.validTo ? form.validTo.slice(0, 16) : ""}
              onChange={(e) => set("validTo", e.target.value ? `${e.target.value}:00` : null)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="rounded"
          />
          Active
        </label>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" render={<Link href="/admin/promotions" />}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
