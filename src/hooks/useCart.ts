"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import type { AddToCartPayload, CartData, GuestCartItem } from "@/types/cart";

export const CART_KEY = ["cart"];

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
    onSuccess: (data) => {
      if (data) qc.setQueryData(CART_KEY, data);
      toast.success("Added to cart");
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
    mutationFn: () => mergeGuestCart(guestItems),
    onSuccess: (data) => {
      qc.setQueryData(CART_KEY, data);
      guestClear();
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

  if (isAuthenticated) {
    return { cart: serverCart ?? null, isLoading };
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

  return { cart: guestCart, isLoading: false };
}
