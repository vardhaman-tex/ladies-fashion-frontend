export type DiscountType = "FLAT" | "PERCENT";

export interface CouponData {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number | null;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  timesUsed: number;
  validFrom: string | null;
  validTo: string | null;
  firstOrderOnly: boolean;
  isActive: boolean;
  restrictedProductIds: string[];
  restrictedCategoryIds: string[];
  allowedUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponPayload {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number | null;
  minOrderValue?: number | null;
  maxUses?: number | null;
  maxUsesPerUser?: number | null;
  validFrom?: string | null;
  validTo?: string | null;
  firstOrderOnly?: boolean;
  isActive?: boolean;
  restrictedProductIds?: string[];
  restrictedCategoryIds?: string[];
  allowedUserIds?: string[];
}
