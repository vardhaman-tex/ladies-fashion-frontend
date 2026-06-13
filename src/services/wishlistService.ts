import { api } from "@/lib/api";
import type { WishlistData } from "@/types/wishlist";

const BASE = "/api/v1/wishlist";

export async function getWishlist(): Promise<WishlistData> {
  const { data } = await api.get<{ data: WishlistData }>(BASE);
  return data.data;
}

export async function addToWishlist(productId: string): Promise<WishlistData> {
  const { data } = await api.post<{ data: WishlistData }>(`${BASE}/items`, { productId });
  return data.data;
}

export async function removeFromWishlist(productId: string): Promise<WishlistData> {
  const { data } = await api.delete<{ data: WishlistData }>(`${BASE}/items/${productId}`);
  return data.data;
}
