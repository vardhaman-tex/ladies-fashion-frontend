"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useCreateCoupon } from "@/hooks/useCoupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreateCouponPayload, DiscountType } from "@/types/coupon";

export default function NewCouponPage() {
  const router = useRouter();
  const create = useCreateCoupon();

  const [form, setForm] = useState<CreateCouponPayload>({
    code: "",
    discountType: "FLAT",
    discountValue: 0,
    maxDiscount: null,
    minOrderValue: null,
    maxUses: null,
    maxUsesPerUser: null,
    validFrom: null,
    validTo: null,
    firstOrderOnly: false,
    isActive: true,
    restrictedProductIds: [],
    restrictedCategoryIds: [],
    allowedUserIds: [],
  });

  function set<K extends keyof CreateCouponPayload>(key: K, value: CreateCouponPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    try {
      await create.mutateAsync(form);
      router.push("/admin/coupons");
    } catch {
      // error toast handled by hook
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/admin/coupons"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Coupons
      </Link>

      <h1 className="mb-6 text-2xl font-bold">New Coupon</h1>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
        {/* Code */}
        <div>
          <label className="mb-1 block text-sm font-medium">Code *</label>
          <Input
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="SAVE20"
            className="uppercase"
            required
          />
        </div>

        {/* Discount type + value */}
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

        {/* Max discount (only for PERCENT) */}
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

        {/* Min order */}
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

        {/* Usage limits */}
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

        {/* Validity */}
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

        {/* Flags */}
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
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="rounded"
            />
            Active
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create Coupon"}
          </Button>
          <Button type="button" variant="outline" render={<Link href="/admin/coupons" />}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
