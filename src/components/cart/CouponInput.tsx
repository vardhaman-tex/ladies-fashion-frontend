"use client";

import { useState } from "react";
import { Tag, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApplyCoupon, useRemoveCoupon } from "@/hooks/useCart";
import { inr } from "@/lib/money";

interface CouponInputProps {
  appliedCode: string | null;
  couponDiscount: number;
}

export function CouponInput({ appliedCode, couponDiscount }: CouponInputProps) {
  const [code, setCode] = useState("");
  const { mutate: apply, isPending: applying } = useApplyCoupon();
  const { mutate: remove, isPending: removing } = useRemoveCoupon();

  function handleApply() {
    const trimmed = code.trim();
    if (!trimmed) return;
    apply(trimmed, { onSuccess: () => setCode("") });
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-success/10 px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Tag className="size-3.5 shrink-0 text-success" />
          <span className="font-medium text-success">{appliedCode}</span>
          <span className="text-success">−{inr(couponDiscount)}</span>
        </div>
        <button
          onClick={() => remove()}
          disabled={removing}
          className="ml-2 rounded p-0.5 text-success/70 hover:text-success disabled:opacity-50"
          aria-label="Remove coupon"
        >
          {removing ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Coupon code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === "Enter" && handleApply()}
        className="h-9 text-sm uppercase"
        disabled={applying}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={handleApply}
        disabled={applying || !code.trim()}
        className="h-9 shrink-0"
      >
        {applying ? <Loader2 className="size-3.5 animate-spin" /> : "Apply"}
      </Button>
    </div>
  );
}
