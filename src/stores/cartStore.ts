import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GuestCartItem } from "@/types/cart";

interface GuestCartState {
  items: GuestCartItem[];
  addItem: (item: GuestCartItem) => void;
  updateItem: (productId: string, size: string | null, color: string | null, quantity: number) => void;
  removeItem: (productId: string, size: string | null, color: string | null) => void;
  clearCart: () => void;
  itemCount: () => number;
}

function sameVariant(a: GuestCartItem, productId: string, size: string | null, color: string | null) {
  return a.productId === productId && a.size === size && a.color === color;
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (incoming) =>
        set((state) => {
          const exists = state.items.find((i) =>
            sameVariant(i, incoming.productId, incoming.size, incoming.color)
          );
          if (exists) {
            return {
              items: state.items.map((i) =>
                sameVariant(i, incoming.productId, incoming.size, incoming.color)
                  ? { ...i, quantity: i.quantity + incoming.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, incoming] };
        }),

      updateItem: (productId, size, color, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            sameVariant(i, productId, size, color) ? { ...i, quantity } : i
          ),
        })),

      removeItem: (productId, size, color) =>
        set((state) => ({
          items: state.items.filter((i) => !sameVariant(i, productId, size, color)),
        })),

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "lf-guest-cart" }
  )
);
