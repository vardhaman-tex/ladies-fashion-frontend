"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAdminCoupon, useUpdateCoupon } from "@/hooks/useCoupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import type { CreateCouponPayload, DiscountType } from "@/types/coupon";

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: coupon, isLoading } = useAdminCoupon(id);
  const update = useUpdateCoupon(id);

  const [form, setForm] = useState<CreateCouponPayload | null>(null);

  useEffect(() => {
    if (coupon && !form) {
      setForm({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        minOrderValue: coupon.minOrderValue,
        maxUses: coupon.maxUses,
        maxUsesPerUser: coupon.maxUsesPerUser,
        validFrom: coupon.validFrom,
        validTo: coupon.validTo,
        firstOrderOnly: coupon.firstOrderOnly,
        isActive: coupon.isActive,
        restrictedProductIds: coupon.restrictedProductIds,
        restrictedCategoryIds: coupon.restrictedCategoryIds,
        allowedUserIds: coupon.allowedUserIds,
      });
    }
  }, [coupon, form]);

  function set<K extends keyof CreateCouponPayload>(key: K, value: CreateCouponPayload[K]) {
    setForm((f) => f ? { ...f, [key]: value } : f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    try {
      await update.mutateAsync(form);
      router.push("/admin/coupons");
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
        href="/admin/coupons"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Coupons
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Edit Coupon: {coupon?.code}</h1>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium">Code *</label>
          <Input
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            className="uppercase"
            required
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

        <div>
          <label className="mb-1 block text-sm font-medium">Min Order Value (₹)</label>
          <Input
            type="number"
            min={0}
            placeholder="Leave blank for no minimum"
            value={form.minOrderValue ?? ""}
            onChange={(e) => set("minOrderValue", e.target.value ? parseFloat(e.target.value) : null)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Max Total Uses</label>
            <Input
              type="number"
              min={1}
              placeholder="Unlimited"
              value={form.maxUses ?? ""}
              onChange={(e) => set("maxUses", e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Max Uses per User</label>
            <Input
              type="number"
              min={1}
              placeholder="Unlimited"
              value={form.maxUsesPerUser ?? ""}
              onChange={(e) => set("maxUsesPerUser", e.target.value ? parseInt(e.target.value) : null)}
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

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.firstOrderOnly}
              onChange={(e) => set("firstOrderOnly", e.target.checked)}
              className="rounded"
            />
            First order only
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(e) => set("isActive", e.target.checked)}
              className="rounded"
            />
            Active
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" render={<Link href="/admin/coupons" />}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
