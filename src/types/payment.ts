export interface CreatePaymentOrderRequest {
  addressId: string;
}

export interface CreatePaymentOrderResponse {
  internalOrderId: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
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
