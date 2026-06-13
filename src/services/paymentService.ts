import type {
  CreatePaymentOrderRequest,
  CreatePaymentOrderResponse,
  PaymentVerifyRequest,
} from "@/types/payment";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function createRazorpayOrder(
  req: CreatePaymentOrderRequest
): Promise<CreatePaymentOrderResponse> {
  const res = await fetch("/api/v1/payments/create-order", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as ApiResponse<unknown>).message ?? "Failed to create payment order"
    );
  }
  const body: ApiResponse<CreatePaymentOrderResponse> = await res.json();
  return body.data;
}

export async function verifyPayment(req: PaymentVerifyRequest): Promise<{ id: string }> {
  const res = await fetch("/api/v1/payments/verify", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as ApiResponse<unknown>).message ?? "Payment verification failed"
    );
  }
  const body: ApiResponse<{ id: string }> = await res.json();
  return body.data;
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
