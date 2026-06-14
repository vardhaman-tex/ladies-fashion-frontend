export type OrderStatus = "PENDING" | "PAID" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface OrderItemData {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string | null;
  price: number;
  discountAmount: number;
  finalPrice: number;
  quantity: number;
  size: string | null;
  color: string | null;
  lineTotal: number;
}

export interface OrderData {
  id: string;
  status: OrderStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  // Address snapshot
  addrFullName: string;
  addrPhone: string;
  addrLine1: string;
  addrLine2: string | null;
  addrCity: string;
  addrState: string;
  addrPincode: string;
  // Totals
  subtotal: number;
  totalDiscount: number;
  adminDiscount: number;
  total: number;
  adminNotes: string | null;
  itemCount: number;
  items: OrderItemData[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummaryData {
  id: string;
  status: OrderStatus;
  itemCount: number;
  total: number;
  firstItemThumbnail: string | null;
  firstItemName: string | null;
  createdAt: string;
}

export interface PlaceOrderPayload {
  addressId: string;
}
