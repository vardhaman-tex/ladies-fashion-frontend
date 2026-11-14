"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPromotion, updatePromotion } from "@/services/promotionService";
import type { CreatePromotionPayload, UserSegment } from "@/services/promotionService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: promo, isLoading } = useQuery({
    queryKey: ["promotion", id],
    queryFn: () => getPromotion(id),
  });

  const [form, setForm] = useState<CreatePromotionPayload | null>(null);

  useEffect(() => {
    if (promo) {
      setForm({
        name: promo.name,
        description: promo.description ?? "",
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        maxDiscount: promo.maxDiscount ?? undefined,
        minOrderValue: promo.minOrderValue ?? undefined,
        validFrom: promo.validFrom ?? undefined,
        validTo: promo.validTo ?? undefined,
        isActive: promo.isActive,
        priority: promo.priority,
        restrictedProductIds: promo.restrictedProductIds,
        restrictedCategoryIds: promo.restrictedCategoryIds,
        shareToken: promo.shareToken ?? "",
        minQuantity: promo.minQuantity ?? undefined,
        userSegment: promo.userSegment,
        stackable: promo.stackable,
        maxUsesPerUser: promo.maxUsesPerUser ?? undefined,
      });
    }
  }, [promo]);

  const mut = useMutation({
    mutationFn: () => updatePromotion(id, form!),
    onSuccess: () => {
      toast.success("Promotion updated");
      router.push("/admin/promotions");
    },
    onError: () => toast.error("Failed to update promotion"),
  });

  function set<K extends keyof CreatePromotionPayload>(key: K, value: CreatePromotionPayload[K]) {
    setForm((f) => f ? { ...f, [key]: value } : f);
  }

  if (isLoading || !form) {
    return <div className="p-6 text-muted-foreground text-sm">Loading…</div>;
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <Link href="/admin/promotions" className="text-xs text-muted-foreground hover:underline">
          ← Back to promotions
        </Link>
        <h1 className="text-2xl font-bold mt-1">Edit Promotion</h1>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>

        <div>
          <Label>Description</Label>
          <Input value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Discount Type *</Label>
            <select
              className="w-full h-10 px-3 border rounded-md text-sm bg-background"
              value={form.discountType}
              onChange={(e) => set("discountType", e.target.value as "FLAT" | "PERCENT")}
            >
              <option value="PERCENT">Percent (%)</option>
              <option value="FLAT">Flat (₹)</option>
            </select>
          </div>
          <div>
            <Label>Discount Value *</Label>
            <Input type="number" min={0.01} step={0.01} value={form.discountValue}
              onChange={(e) => set("discountValue", parseFloat(e.target.value))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Max Discount (₹)</Label>
            <Input type="number" min={0} placeholder="No cap"
              value={form.maxDiscount ?? ""}
              onChange={(e) => set("maxDiscount", e.target.value ? parseFloat(e.target.value) : undefined)} />
          </div>
          <div>
            <Label>Min Order Value (₹)</Label>
            <Input type="number" min={0} placeholder="No minimum"
              value={form.minOrderValue ?? ""}
              onChange={(e) => set("minOrderValue", e.target.value ? parseFloat(e.target.value) : undefined)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Valid From</Label>
            <Input type="datetime-local"
              value={form.validFrom?.slice(0, 16) ?? ""}
              onChange={(e) => set("validFrom", e.target.value ? e.target.value + ":00" : undefined)} />
          </div>
          <div>
            <Label>Valid To</Label>
            <Input type="datetime-local"
              value={form.validTo?.slice(0, 16) ?? ""}
              onChange={(e) => set("validTo", e.target.value ? e.target.value + ":00" : undefined)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Priority</Label>
            <Input type="number" value={form.priority}
              onChange={(e) => set("priority", parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Min Quantity</Label>
            <Input type="number" min={1} placeholder="None"
              value={form.minQuantity ?? ""}
              onChange={(e) => set("minQuantity", e.target.value ? parseInt(e.target.value) : undefined)} />
          </div>
          <div>
            <Label>Max Uses / User</Label>
            <Input type="number" min={1} placeholder="Unlimited"
              value={form.maxUsesPerUser ?? ""}
              onChange={(e) => set("maxUsesPerUser", e.target.value ? parseInt(e.target.value) : undefined)} />
          </div>
        </div>

        <div>
          <Label>User Segment</Label>
          <select
            className="w-full h-10 px-3 border rounded-md text-sm bg-background"
            value={form.userSegment}
            onChange={(e) => set("userSegment", e.target.value as UserSegment)}
          >
            <option value="ALL">All Users</option>
            <option value="NEW_USER">New Users Only</option>
            <option value="RETURNING_USER">Returning Users Only</option>
          </select>
        </div>

        <div>
          <Label>Share Token (for WhatsApp links)</Label>
          <Input value={form.shareToken ?? ""}
            onChange={(e) => set("shareToken", e.target.value || undefined)}
            placeholder="e.g. DIWALI25" />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)} className="rounded" />
            Active
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input type="checkbox" checked={form.stackable}
              onChange={(e) => set("stackable", e.target.checked)} className="rounded" />
            Stackable with coupons
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => mut.mutate()}
            disabled={!form.name || mut.isPending}
          >
            Save Changes
          </Button>
          <Button variant="outline" render={<Link href="/admin/promotions" />}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
