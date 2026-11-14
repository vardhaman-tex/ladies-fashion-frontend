"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPromotion } from "@/services/promotionService";
import type { CreatePromotionPayload, UserSegment } from "@/services/promotionService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function NewPromotionPage() {
  const router = useRouter();

  const [form, setForm] = useState<CreatePromotionPayload>({
    name: "",
    description: "",
    discountType: "PERCENT",
    discountValue: 10,
    isActive: true,
    priority: 0,
    userSegment: "ALL",
    stackable: false,
  });

  function set<K extends keyof CreatePromotionPayload>(key: K, value: CreatePromotionPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const mut = useMutation({
    mutationFn: () => createPromotion(form),
    onSuccess: () => {
      toast.success("Promotion created");
      router.push("/admin/promotions");
    },
    onError: () => toast.error("Failed to create promotion"),
  });

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <Link href="/admin/promotions" className="text-xs text-muted-foreground hover:underline">
          ← Back to promotions
        </Link>
        <h1 className="text-2xl font-bold mt-1">New Promotion</h1>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Diwali Sale" />
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
            placeholder="e.g. DIWALI25 (leave blank to skip)" />
          <p className="text-xs text-muted-foreground mt-1">
            Users arriving via <code>?promo=TOKEN</code> will auto-apply this promotion.
          </p>
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
            Create Promotion
          </Button>
          <Button variant="outline" render={<Link href="/admin/promotions" />}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
