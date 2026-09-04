export type OrderStatus = "PENDING" | "PAID" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

/** How an order is paid for. Separate from OrderStatus, which is about fulfilment. */
export type OrderPaymentMethod = "PREPAID" | "COD_PARTIAL" | "COD_FULL";

/** How much of the money has actually been collected. */
export type OrderPaymentStatus = "UNPAID" | "ADVANCE_PAID" | "PAID_IN_FULL" | "REFUNDED";

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
  orderNumber: string;
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
  // Payment split — an order can be part-paid, so these are not derivable from status
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  amountPaid: number;
  amountDue: number;
  /** What the courier handed over on delivery. Null until then. */
  codCollectedAmount: number | null;
  codCollectedAt: string | null;
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
  paymentStatus: OrderPaymentStatus;
  amountDue: number;
  firstItemThumbnail: string | null;
  firstItemName: string | null;
  createdAt: string;
}

export interface PlaceOrderPayload {
  addressId: string;
}

export interface TrackOrderData {
  id: string;
  status: OrderStatus;
  addrFullName: string;
  addrPhone: string;
  addrLine1: string;
  addrLine2: string | null;
  addrCity: string;
  addrState: string;
  addrPincode: string;
  subtotal: number;
  totalDiscount: number;
  total: number;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  amountPaid: number;
  /** What is still to pay — for COD, what to have ready for the courier. */
  amountDue: number;
  itemCount: number;
  items: OrderItemData[];
  createdAt: string;
}
