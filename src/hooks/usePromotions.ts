"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createPromotion,
  getPromotion,
  listPromotions,
  togglePromotion,
  updatePromotion,
} from "@/services/promotionService";
import type { CreatePromotionPayload } from "@/types/promotion";

export const PROMOTIONS_KEY = ["admin", "promotions"];

export function useAdminPromotions(page = 0) {
  return useQuery({
    queryKey: [...PROMOTIONS_KEY, page],
    queryFn: () => listPromotions(page),
  });
}

export function useAdminPromotion(id: string) {
  return useQuery({
    queryKey: [...PROMOTIONS_KEY, id],
    queryFn: () => getPromotion(id),
    enabled: !!id,
  });
}

export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePromotionPayload) => createPromotion(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROMOTIONS_KEY });
      toast.success("Promotion created");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to create promotion");
    },
  });
}

export function useUpdatePromotion(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePromotionPayload) => updatePromotion(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROMOTIONS_KEY });
      toast.success("Promotion updated");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message ?? "Failed to update promotion");
    },
  });
}

export function useTogglePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => togglePromotion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROMOTIONS_KEY });
    },
    onError: () => toast.error("Failed to toggle promotion"),
  });
}
