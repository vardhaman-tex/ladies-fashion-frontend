export type PaymentLinkStatus = "CREATED" | "PAID" | "CANCELLED" | "EXPIRED";

export interface PaymentLink {
  id: string;
  orderId: string;
  razorpayPaymentLinkId: string;
  /** The URL to send the customer. */
  shortUrl: string;
  amount: number;
  status: PaymentLinkStatus;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

/**
 * Every field is optional — omitting all of them means "collect what this order
 * still owes, valid for three days, and let Razorpay text the customer".
 */
export interface CreatePaymentLinkRequest {
  /** Defaults to the order's outstanding balance. The server refuses more than that. */
  amount?: number;
  expiryHours?: number;
  notifyBySms?: boolean;
  notifyByEmail?: boolean;
}
