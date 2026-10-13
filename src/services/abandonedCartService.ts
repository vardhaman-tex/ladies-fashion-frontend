import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { GuestCartItem } from "@/types/cart";

/**
 * Remembers a guest's cart against their phone number so a reminder can bring
 * them back. Sent only after the checkout page has shown the WhatsApp notice.
 */
export async function rememberCart(payload: {
  phone: string;
  name?: string;
  items: GuestCartItem[];
}): Promise<void> {
  await api.post("/api/v1/abandoned-carts", { ...payload, consent: true });
}

/** The items behind a reminder link. 404 when the link has expired. */
export async function getResumableCart(token: string): Promise<GuestCartItem[]> {
  const { data } = await api.get<ApiResponse<{ items: GuestCartItem[] }>>(
    `/api/v1/abandoned-carts/${encodeURIComponent(token)}`
  );
  return data.data.items;
}
