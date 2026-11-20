import { api } from "@/lib/api";
import type { AddToCartPayload, CartData, GuestCartItem } from "@/types/cart";

export interface GuestDiscountResult {
  couponCode: string | null;
  couponDiscount: number;
  promotionName: string | null;
  promotionDiscount: number;
}

const BASE = "/api/v1/cart";

export async function getCart(): Promise<CartData> {
  const { data } = await api.get<{ data: CartData }>(BASE);
  return data.data;
}

export async function addToCart(payload: AddToCartPayload): Promise<CartData> {
  const { data } = await api.post<{ data: CartData }>(`${BASE}/items`, payload);
  return data.data;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<CartData> {
  const { data } = await api.put<{ data: CartData }>(`${BASE}/items/${itemId}`, { quantity });
  return data.data;
}

export async function removeCartItem(itemId: string): Promise<CartData> {
  const { data } = await api.delete<{ data: CartData }>(`${BASE}/items/${itemId}`);
  return data.data;
}

export async function clearCart(): Promise<CartData> {
  const { data } = await api.delete<{ data: CartData }>(BASE);
  return data.data;
}

export async function applyCoupon(code: string): Promise<CartData> {
  const { data } = await api.post<{ data: CartData }>(`${BASE}/coupon`, { code });
  return data.data;
}

export async function removeCoupon(): Promise<CartData> {
  const { data } = await api.delete<{ data: CartData }>(`${BASE}/coupon`);
  return data.data;
}

export async function fetchGuestDiscount(
  items: GuestCartItem[],
  couponCode?: string | null,
): Promise<GuestDiscountResult> {
  const payload = {
    items: items.map((i) => ({
      productId: i.productId,
      price: i.price,
      discountAmount: i.discountAmount,
      quantity: i.quantity,
    })),
    couponCode: couponCode ?? null,
  };
  const { data } = await api.post<{ data: GuestDiscountResult }>("/api/v1/guest/discount", payload);
  return data.data;
}

export async function mergeGuestCart(items: GuestCartItem[]): Promise<CartData> {
  const payload = {
    items: items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      size: i.size,
      color: i.color,
    })),
  };
  const { data } = await api.post<{ data: CartData }>(`${BASE}/merge`, payload);
  return data.data;
}
