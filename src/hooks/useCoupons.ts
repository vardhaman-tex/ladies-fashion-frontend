"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCoupon,
  getCoupon,
  listCoupons,
  toggleCoupon,
  updateCoupon,
} from "@/services/couponService";
import type { CreateCouponPayload } from "@/types/coupon";

export const COUPONS_KEY = ["admin", "coupons"];

export function useAdminCoupons(page = 0) {
  return useQuery({
    queryKey: [...COUPONS_KEY, page],
    queryFn: () => listCoupons(page),
  });
}

export function useAdminCoupon(id: string) {
  return useQuery({
    queryKey: [...COUPONS_KEY, id],
    queryFn: () => getCoupon(id),
    enabled: !!id,
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCouponPayload) => createCoupon(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COUPONS_KEY });
      toast.success("Coupon created");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to create coupon");
    },
  });
}

export function useUpdateCoupon(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCouponPayload) => updateCoupon(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COUPONS_KEY });
      toast.success("Coupon updated");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to update coupon");
    },
  });
}

export function useToggleCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleCoupon(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COUPONS_KEY });
    },
    onError: () => toast.error("Failed to toggle coupon"),
  });
}
