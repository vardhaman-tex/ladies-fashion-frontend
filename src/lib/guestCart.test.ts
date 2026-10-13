import { describe, it, expect } from "vitest";
import { buildGuestCart, cartBadgeCount } from "./guestCart";
import type { GuestCartItem } from "@/types/cart";

const item = (over: Partial<GuestCartItem> = {}): GuestCartItem => ({
  productId: "p1",
  productName: "Suit",
  productSlug: "suit",
  thumbnail: null,
  price: 1900,
  discountAmount: 400,
  quantity: 1,
  size: "M",
  color: "Rani",
  ...over,
});

describe("buildGuestCart", () => {
  it("totals as subtotal minus discount, per unit", () => {
    const cart = buildGuestCart([item({ quantity: 2 }), item({ productId: "p2", price: 1000, discountAmount: 0 })]);
    expect(cart.subtotal).toBe(1900 * 2 + 1000);
    expect(cart.totalDiscount).toBe(800);
    expect(cart.total).toBe(cart.subtotal - cart.totalDiscount);
    expect(cart.itemCount).toBe(3);
  });

  it("keeps the same product in two sizes as two lines", () => {
    const cart = buildGuestCart([item({ size: "M" }), item({ size: "L" })]);
    expect(cart.items).toHaveLength(2);
    expect(cart.items[0].id).not.toBe(cart.items[1].id);
  });
});

describe("cartBadgeCount", () => {
  it("counts quantities for a guest", () => {
    expect(cartBadgeCount(false, null, [item({ quantity: 2 }), item({ productId: "p2" })])).toBe(3);
  });

  it("does not read zero while guest items are still moving into a fresh server cart", () => {
    expect(cartBadgeCount(true, null, [item({ quantity: 2 })])).toBe(2);
  });

  it("uses the server count once there is nothing left to merge", () => {
    expect(cartBadgeCount(true, { itemCount: 4 }, [])).toBe(4);
  });
});
