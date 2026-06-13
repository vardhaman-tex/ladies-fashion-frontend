"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useMergeCart } from "@/hooks/useCart";
import { useAuthStore } from "@/stores/authStore";
import { useGuestCartStore } from "@/stores/cartStore";

/**
 * Watches for the user becoming authenticated and, if there are guest cart
 * items in localStorage, merges them into the server cart exactly once.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const guestItems = useGuestCartStore((s) => s.items);
  const { mutate: mergeCart } = useMergeCart();
  const hasMerged = useRef(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && guestItems.length > 0 && !hasMerged.current) {
      hasMerged.current = true;
      mergeCart();
    }
    // Reset merge flag on logout so next login triggers merge again
    if (!isAuthenticated) {
      hasMerged.current = false;
    }
  }, [isAuthenticated, isLoading, guestItems.length, mergeCart]);

  return <>{children}</>;
}
