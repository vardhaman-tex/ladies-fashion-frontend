export type DiscountType = "FLAT" | "PERCENT";

export interface PromotionData {
  id: string;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number | null;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  priority: number;
  timesUsed: number;
  restrictedProductIds: string[];
  restrictedCategoryIds: string[];
  createdAt: string;
}

export interface CreatePromotionPayload {
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number | null;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  priority: number;
  restrictedProductIds: string[];
  restrictedCategoryIds: string[];
}
