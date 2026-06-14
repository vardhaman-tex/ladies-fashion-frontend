import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminStats,
  getAdminOrders,
  getAdminOrder,
  updateOrderStatus,
  editAdminOrder,
  getAdminUsers,
  toggleUserActive,
  getAdminProducts,
  deleteAdminProduct,
  updateAdminProductStatus,
  bulkUploadProducts,
  getAdminInventory,
  updateInventory,
  updateSizeInventories,
} from "@/services/adminService";
import type { AdminEditOrderPayload, SizeInventoryEntry } from "@/services/adminService";
import type { OrderStatus } from "@/types/order";

export const ADMIN_KEYS = {
  stats: ["admin", "stats"] as const,
  orders: (status?: OrderStatus, page?: number) => ["admin", "orders", status, page] as const,
  order: (id: string) => ["admin", "order", id] as const,
  users: (page?: number) => ["admin", "users", page] as const,
  products: (search?: string, page?: number) => ["admin", "products", search, page] as const,
  inventory: (lowStock?: boolean, page?: number) => ["admin", "inventory", lowStock, page] as const,
};

export function useAdminStats() {
  return useQuery({ queryKey: ADMIN_KEYS.stats, queryFn: getAdminStats });
}

export function useAdminOrders(status?: OrderStatus, page = 0) {
  return useQuery({
    queryKey: ADMIN_KEYS.orders(status, page),
    queryFn: () => getAdminOrders({ status, page }),
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ADMIN_KEYS.order(id),
    queryFn: () => getAdminOrder(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useEditAdminOrder(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminEditOrderPayload) => editAdminOrder(orderId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.order(orderId) });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}

export function useAdminUsers(page = 0) {
  return useQuery({
    queryKey: ADMIN_KEYS.users(page),
    queryFn: () => getAdminUsers({ page }),
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleUserActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminProducts(search?: string, page = 0) {
  return useQuery({
    queryKey: ADMIN_KEYS.products(search, page),
    queryFn: () => getAdminProducts({ search, page }),
  });
}

export function useDeleteAdminProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useBulkUploadProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => bulkUploadProducts(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useUpdateAdminProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAdminProductStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
}

export function useAdminInventory(lowStock = false, page = 0) {
  return useQuery({
    queryKey: ADMIN_KEYS.inventory(lowStock, page),
    queryFn: () => getAdminInventory({ lowStock, page }),
  });
}

export function useUpdateInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      stockQuantity,
      lowStockThreshold,
    }: {
      productId: string;
      stockQuantity: number;
      lowStockThreshold: number;
    }) => updateInventory(productId, stockQuantity, lowStockThreshold),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "inventory"] }),
  });
}

export function useUpdateSizeInventories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, entries }: { productId: string; entries: SizeInventoryEntry[] }) =>
      updateSizeInventories(productId, entries),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "inventory"] }),
  });
}
