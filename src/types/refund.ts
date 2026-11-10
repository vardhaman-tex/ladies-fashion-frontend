export type RefundType = "RAZORPAY" | "MANUAL";

export interface RefundData {
  id: string;
  orderId: string;
  amount: number;
  reason: string | null;
  refundType: RefundType;
  razorpayRefundId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateRefundPayload {
  amount?: number;
  reason?: string;
  refundType: RefundType;
  notes?: string;
}
