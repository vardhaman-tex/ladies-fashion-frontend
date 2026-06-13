"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from "@/services/addressService";
import { useAuthStore } from "@/stores/authStore";
import type { AddressRequest } from "@/types/address";

export const ADDRESSES_KEY = ["addresses"];

export function useAddresses() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: getAddresses,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: AddressRequest) => addAddress(request),
    onSuccess: (newAddress) => {
      qc.setQueryData(ADDRESSES_KEY, (old: typeof newAddress[] = []) => {
        // If new address is default, demote others
        const updated = newAddress.isDefault
          ? old.map((a) => ({ ...a, isDefault: false }))
          : [...old];
        return [newAddress, ...updated.filter((a) => a.id !== newAddress.id)];
      });
      toast.success("Address added");
    },
    onError: () => toast.error("Failed to add address"),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: AddressRequest }) =>
      updateAddress(id, request),
    onSuccess: (updated) => {
      qc.setQueryData(ADDRESSES_KEY, (old: typeof updated[] = []) => {
        const withDemoted = updated.isDefault
          ? old.map((a) => ({ ...a, isDefault: false }))
          : old;
        return withDemoted.map((a) => (a.id === updated.id ? updated : a));
      });
      toast.success("Address updated");
    },
    onError: () => toast.error("Failed to update address"),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: (_, id) => {
      qc.setQueryData(ADDRESSES_KEY, (old: { id: string }[] = []) =>
        old.filter((a) => a.id !== id)
      );
      toast.success("Address removed");
    },
    onError: () => toast.error("Failed to remove address"),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: (updated) => {
      qc.setQueryData(ADDRESSES_KEY, (old: typeof updated[] = []) =>
        old.map((a) => ({ ...a, isDefault: a.id === updated.id }))
      );
      toast.success("Default address updated");
    },
    onError: () => toast.error("Failed to update default address"),
  });
}
