import { api } from "@/lib/api";
import type { AddToCartPayload, CartData, GuestCartItem } from "@/types/cart";

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
