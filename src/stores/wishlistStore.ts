import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GuestWishlistItem } from "@/types/wishlist";

interface GuestWishlistState {
  items: GuestWishlistItem[];
  addItem: (item: GuestWishlistItem) => void;
  removeItem: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useGuestWishlistStore = create<GuestWishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) return state;
          return { items: [...state.items, item] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      isWishlisted: (productId) => get().items.some((i) => i.productId === productId),

      clearWishlist: () => set({ items: [] }),
    }),
    { name: "lf-guest-wishlist" }
  )
);
