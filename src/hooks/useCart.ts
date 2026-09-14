"use client";

import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addToCart,
  clearCart,
  getCart,
  mergeGuestCart,
  removeCartItem,
  updateCartItem,
} from "@/services/cartService";
import { useGuestCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
// remove_from_cart is deliberately not reported from here: the remove payload
// carries only ids, and GA4 wants the item's name and price. Sending zeros
// would put a wrong `value` into the reports, which is worse than the event
// being absent. It wants the cart cache read at the call site instead.
import { gaAddToCart } from "@/lib/ga";
import type { AddToCartPayload, CartData, GuestCartItem } from "@/types/cart";

export const CART_KEY = ["cart"];

/**
 * Keyed so anything rendering the cart can ask whether a merge is in flight.
 *
 * CartProvider fires the merge as a side effect of logging in, far from any
 * component that shows a cart, so without a key the only thing the cart page
 * could see was a server cart that is genuinely still empty — and it said so,
 * on top of items that were about to arrive.
 */
export const MERGE_CART_KEY = ["cart", "merge"];

/** Whether the guest cart is being merged into the server cart right now. */
export function useIsMergingCart() {
  return useIsMutating({ mutationKey: MERGE_CART_KEY }) > 0;
}

/** Server cart for authenticated users */
export function useServerCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<CartData>({
    queryKey: CART_KEY,
    queryFn: getCart,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const guestAdd = useGuestCartStore((s) => s.addItem);

  return useMutation({
    mutationFn: async (payload: AddToCartPayload & { productName: string; productSlug: string; thumbnail: string | null; price: number; discountAmount: number }) => {
      if (isAuthenticated) {
        return addToCart(payload);
      }
      // Guest: add to localStorage store
      const guestItem: GuestCartItem = {
        productId: payload.productId,
        productName: payload.productName,
        productSlug: payload.productSlug,
        thumbnail: payload.thumbnail,
        price: payload.price,
        discountAmount: payload.discountAmount,
        quantity: payload.quantity,
        size: payload.size ?? null,
        color: payload.color ?? null,
      };
      guestAdd(guestItem);
      return null;
    },
    onSuccess: (data, payload) => {
      if (data) qc.setQueryData(CART_KEY, data);
      toast.success("Added to cart");
      // Reported here rather than at each button, so an add from a grid
      // quick-add counts the same as one from the product page. GA4's funnel is
      // only readable if add_to_cart means "an item was added", not "an item was
      // added from the one surface somebody remembered to instrument".
      gaAddToCart({
        item_id: payload.productId,
        item_name: payload.productName,
        price: payload.price - payload.discountAmount,
        quantity: payload.quantity,
        ...(payload.size ? { item_variant: payload.size } : {}),
      });
    },
    onError: () => toast.error("Failed to add to cart"),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const guestUpdate = useGuestCartStore((s) => s.updateItem);

  return useMutation({
    mutationFn: async ({
      itemId,
      quantity,
      productId,
      size,
      color,
    }: {
      itemId: string;
      quantity: number;
      productId?: string;
      size?: string | null;
      color?: string | null;
    }) => {
      if (isAuthenticated) return updateCartItem(itemId, quantity);
      if (productId !== undefined) guestUpdate(productId, size ?? null, color ?? null, quantity);
      return null;
    },
    onSuccess: (data) => {
      if (data) qc.setQueryData(CART_KEY, data);
    },
    onError: () => toast.error("Failed to update cart"),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const guestRemove = useGuestCartStore((s) => s.removeItem);

  return useMutation({
    mutationFn: async ({
      itemId,
      productId,
      size,
      color,
    }: {
      itemId: string;
      productId?: string;
      size?: string | null;
      color?: string | null;
    }) => {
      if (isAuthenticated) return removeCartItem(itemId);
      if (productId !== undefined) guestRemove(productId, size ?? null, color ?? null);
      return null;
    },
    onSuccess: (data) => {
      if (data) qc.setQueryData(CART_KEY, data);
      toast.success("Removed from cart");
    },
    onError: () => toast.error("Failed to remove item"),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const guestClear = useGuestCartStore((s) => s.clearCart);

  return useMutation({
    mutationFn: async () => {
      if (isAuthenticated) return clearCart();
      guestClear();
      return null;
    },
    onSuccess: (data) => {
      if (data) qc.setQueryData(CART_KEY, data);
    },
  });
}

/** Call this after login to merge guest cart into server cart */
export function useMergeCart() {
  const qc = useQueryClient();
  const guestItems = useGuestCartStore((s) => s.items);
  const guestClear = useGuestCartStore((s) => s.clearCart);

  return useMutation({
    mutationKey: MERGE_CART_KEY,
    mutationFn: () => mergeGuestCart(guestItems),
    onSuccess: (data) => {
      qc.setQueryData(CART_KEY, data);
      guestClear();
    },
    onError: () => {
      // The guest items are deliberately left in localStorage: they are the
      // only copy, and dropping them because one request failed would lose the
      // cart outright. CartProvider retries on the next auth change.
      toast.error("We could not move your saved items into your cart. Please refresh.");
    },
  });
}

/**
 * Returns the unified cart for the current session:
 * - authenticated → server cart
 * - guest → derived from guest store
 */
export function useCart() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: serverCart, isLoading } = useServerCart();
  const guestItems = useGuestCartStore((s) => s.items);
  const isMerging = useIsMergingCart();

  if (isAuthenticated) {
    return { cart: serverCart ?? null, isLoading, isMerging };
  }

  // Derive a CartData-like object from guest items
  const subtotal = guestItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalDiscount = guestItems.reduce((sum, i) => sum + i.discountAmount * i.quantity, 0);
  const guestCart: CartData = {
    id: "guest",
    items: guestItems.map((i) => ({
      id: `${i.productId}-${i.size}-${i.color}`,
      productId: i.productId,
      productName: i.productName,
      productSlug: i.productSlug,
      thumbnail: i.thumbnail,
      price: i.price,
      discountAmount: i.discountAmount,
      finalPrice: i.price - i.discountAmount,
      quantity: i.quantity,
      size: i.size,
      color: i.color,
      lineTotal: (i.price - i.discountAmount) * i.quantity,
    })),
    itemCount: guestItems.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    totalDiscount,
    total: subtotal - totalDiscount,
  };

  return { cart: guestCart, isLoading: false, isMerging };
}
