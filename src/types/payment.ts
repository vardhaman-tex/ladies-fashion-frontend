/**
 * COD_FULL exists on the server's enum but is refused at checkout — nothing
 * collects money for it and nothing deducts stock without a first payment — so
 * it is deliberately not in this union.
 */
export type PaymentMethod = "PREPAID" | "COD_PARTIAL";

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
  razorpayOrderId: string;
  /** What Razorpay charges now — the full total when prepaid, the advance on COD. */
  amountPaise: number;
  currency: string;
  keyId: string;
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
    Razorpay: new (options: RazorpayOptions) => { open(): void };
  }
}
