"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getPromotionByShareToken } from "@/services/promotionService";

const PROMO_KEY = "lf_promo";

export function getStoredPromoToken(): string | null {
  try {
    return localStorage.getItem(PROMO_KEY);
  } catch {
    return null;
  }
}

export function clearStoredPromoToken(): void {
  try {
    localStorage.removeItem(PROMO_KEY);
  } catch {
    // ignore
  }
}

export function usePromoToken() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("promo");
    if (!token) return;

    getPromotionByShareToken(token)
      .then((promo) => {
        try {
          localStorage.setItem(PROMO_KEY, token);
        } catch {
          // ignore
        }
        toast.success(`Promo unlocked: ${promo.name}`, {
          description: promo.discountType === "FLAT"
            ? `₹${promo.discountValue} off — discount will apply at checkout`
            : `${promo.discountValue}% off${promo.maxDiscount ? ` (up to ₹${promo.maxDiscount})` : ""} — discount will apply at checkout`,
          duration: 5000,
        });
      })
      .catch(() => {
        // Invalid or expired token — silently ignore
      });
  }, [searchParams]);
}
