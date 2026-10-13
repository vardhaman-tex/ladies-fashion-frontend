import type { CartData, GuestCartItem } from "@/types/cart";

/**
 * The cart a guest sees, derived from what is in their browser.
 *
 * Pure so the badge, the cart page and checkout cannot disagree about what a
 * guest's cart is worth: they all call this, and it is tested.
 */
export function buildGuestCart(items: readonly GuestCartItem[]): CartData {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalDiscount = items.reduce((sum, i) => sum + i.discountAmount * i.quantity, 0);
  return {
    id: "guest",
    items: items.map((i) => ({
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
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    totalDiscount,
    total: subtotal - totalDiscount,
  };
}

/**
 * The number on the header's cart icon.
 *
 * A signed-in shopper's cart lives on the server, but for a moment after
 * signing in it is not there yet: their guest items are still being moved
 * across, and the server cart reads as empty. Showing 0 for that moment while
 * the cart page lists the items is exactly the mismatch a shopper notices, so
 * until the server's answer arrives the guest items still count.
 */
export function cartBadgeCount(
  isAuthenticated: boolean,
  serverCart: Pick<CartData, "itemCount"> | null | undefined,
  guestItems: readonly GuestCartItem[]
): number {
  const guestCount = guestItems.reduce((sum, i) => sum + i.quantity, 0);
  if (!isAuthenticated) return guestCount;
  return serverCart ? serverCart.itemCount + guestCount : guestCount;
}
