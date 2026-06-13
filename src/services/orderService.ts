import { api } from "@/lib/api";
import type { ApiResponse, PageResponse } from "@/types/api";
import type { OrderData, OrderSummaryData, PlaceOrderPayload } from "@/types/order";

const BASE = "/api/v1/orders";

export async function placeOrder(payload: PlaceOrderPayload): Promise<OrderData> {
  const { data } = await api.post<ApiResponse<OrderData>>(BASE, payload);
  return data.data;
}

export async function getOrders(page = 0, size = 10): Promise<PageResponse<OrderSummaryData>> {
  const { data } = await api.get<ApiResponse<PageResponse<OrderSummaryData>>>(BASE, {
    params: { page, size },
  });
  return data.data;
}

export async function getOrder(id: string): Promise<OrderData> {
  const { data } = await api.get<ApiResponse<OrderData>>(`${BASE}/${id}`);
  return data.data;
}

export async function cancelOrder(id: string): Promise<OrderData> {
  const { data } = await api.put<ApiResponse<OrderData>>(`${BASE}/${id}/cancel`);
  return data.data;
}
