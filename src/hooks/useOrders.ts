import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelOrder, getOrder, getOrders, placeOrder } from "@/services/orderService";
import type { PlaceOrderPayload } from "@/types/order";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (page: number, size: number) => [...orderKeys.lists(), { page, size }] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

export function useOrders(page = 0, size = 10) {
  return useQuery({
    queryKey: orderKeys.list(page, size),
    queryFn: () => getOrders(page, size),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PlaceOrderPayload) => placeOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.setQueryData(orderKeys.detail(data.id), data);
    },
  });
}
