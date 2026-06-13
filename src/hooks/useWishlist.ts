"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addToWishlist, getWishlist, removeFromWishlist } from "@/services/wishlistService";
import { useGuestWishlistStore } from "@/stores/wishlistStore";
import { useAuthStore } from "@/stores/authStore";
import type { GuestWishlistItem, WishlistData, WishlistItemData } from "@/types/wishlist";

export const WISHLIST_KEY = ["wishlist"];

export function useServerWishlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery<WishlistData>({
    queryKey: WISHLIST_KEY,
    queryFn: getWishlist,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/** Returns whether a specific product is in the wishlist */
export function useIsWishlisted(productId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: wishlist } = useServerWishlist();
  const guestCheck = useGuestWishlistStore((s) => s.isWishlisted);

  if (isAuthenticated) {
    return wishlist?.items.some((i) => i.productId === productId) ?? false;
  }
  return guestCheck(productId);
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const guestAdd = useGuestWishlistStore((s) => s.addItem);
  const guestRemove = useGuestWishlistStore((s) => s.removeItem);

  return useMutation({
    mutationFn: async (
      payload: GuestWishlistItem & { alreadyWishlisted: boolean }
    ) => {
      const { alreadyWishlisted, productId, ...guestItem } = payload;

      if (isAuthenticated) {
        if (alreadyWishlisted) {
          return removeFromWishlist(productId);
        } else {
          return addToWishlist(productId);
        }
      }

      // Guest path
      if (alreadyWishlisted) {
        guestRemove(productId);
      } else {
        guestAdd({ productId, ...guestItem });
      }
      return null;
    },
    onSuccess: (data, variables) => {
      if (data) {
        qc.setQueryData(WISHLIST_KEY, data);
      }
      const added = !variables.alreadyWishlisted;
      toast.success(added ? "Added to wishlist" : "Removed from wishlist");
    },
    onError: () => toast.error("Failed to update wishlist"),
  });
}

/** Unified wishlist — server data for auth users, localStorage for guests */
export function useWishlist() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: serverWishlist, isLoading } = useServerWishlist();
  const guestItems = useGuestWishlistStore((s) => s.items);

  if (isAuthenticated) {
    const items: WishlistItemData[] = serverWishlist?.items ?? [];
    return {
      wishlist: serverWishlist ?? null,
      items,
      itemCount: serverWishlist?.itemCount ?? 0,
      isLoading,
    };
  }

  const items: WishlistItemData[] = guestItems.map((i) => ({
    id: i.productId,
    productId: i.productId,
    productName: i.productName,
    productSlug: i.productSlug,
    thumbnail: i.thumbnail,
    price: i.price,
    discountAmount: i.discountAmount,
    finalPrice: i.price - i.discountAmount,
  }));

  const guestWishlist: WishlistData = { items, itemCount: guestItems.length };

  return {
    wishlist: guestWishlist,
    items,
    itemCount: guestItems.length,
    isLoading: false,
  };
}
