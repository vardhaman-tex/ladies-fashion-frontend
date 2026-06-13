export interface WishlistItemData {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string | null;
  price: number;
  discountAmount: number;
  finalPrice: number;
}

export interface WishlistData {
  items: WishlistItemData[];
  itemCount: number;
}

/** Guest wishlist entry (localStorage) */
export interface GuestWishlistItem {
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string | null;
  price: number;
  discountAmount: number;
}
