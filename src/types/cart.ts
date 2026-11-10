export interface CartItemData {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string | null;
  price: number;
  discountAmount: number;
  finalPrice: number;
  quantity: number;
  size: string | null;
  color: string | null;
  lineTotal: number;
  availableQty?: number;
}

export interface CartData {
  id: string;
  items: CartItemData[];
  itemCount: number;
  subtotal: number;
  totalDiscount: number;
  couponCode: string | null;
  couponDiscount: number;
  promotionName: string | null;
  promotionDiscount: number;
  total: number;
}

/** Shape used for the guest (localStorage) cart */
export interface GuestCartItem {
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string | null;
  price: number;
  discountAmount: number;
  quantity: number;
  size: string | null;
  color: string | null;
}

export interface AddToCartPayload {
  productId: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
}
