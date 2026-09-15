/**
 * COD_PARTIAL is what the storefront sends to mean "cash on delivery". Which
 * COD model that becomes is the store's decision, not the client's: the server
 * reads its own settings and answers with COD_PARTIAL or COD_FULL, so
 * COD_FULL appears in responses without ever being requested.
 */
export type PaymentMethod = "PREPAID" | "COD_PARTIAL" | "COD_FULL";

export interface CreatePaymentOrderRequest {
  addressId: string;
  /** Omitted means PREPAID. */
  paymentMethod?: PaymentMethod;
}

export interface GuestOrderItem {
  productId: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
}

export interface GuestCreatePaymentOrderRequest {
  fullName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  items: GuestOrderItem[];
  /** Omitted means PREPAID. */
  paymentMethod?: PaymentMethod;
}

export type GuestCreatePaymentOrderResponse = CreatePaymentOrderResponse;

export interface GuestPaymentVerifyRequest {
  internalOrderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface CreatePaymentOrderResponse {
  internalOrderId: string;
  orderNumber: string;
  /**
   * Null under full cash on delivery: there is no payment to open, and the
   * gateway will not mint a ₹0 order. That null, with amountPaise 0, is how the
   * storefront knows the order is already placed and it should go straight to
   * confirmation rather than launching Razorpay.
   */
  razorpayOrderId: string | null;
  /** What Razorpay charges now — the full total when prepaid, the advance on COD, zero under full COD. */
  amountPaise: number;
  currency: string;
  keyId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  /** The order's full value, whatever is being charged right now. */
  orderTotal: number;
  /** What the courier will collect. Zero when prepaid. */
  amountDueOnDelivery: number;
}

export interface PaymentVerifyRequest {
  internalOrderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// Razorpay global types
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    // Optional on purpose: checkout.js is loaded at runtime, so every caller
    // has to cope with it not being there yet. Typing it as always present let
    // a truthiness guard read as dead code.
    Razorpay?: new (options: RazorpayOptions) => { open(): void };
  }
}
