"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Edit2, ToggleLeft, ToggleRight, Zap, Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { getPromotions, togglePromotion, generatePromoCodes } from "@/services/promotionService";
import type { PromotionResponse } from "@/services/promotionService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminPromotionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [genCount, setGenCount] = useState<Record<string, number>>({});
  const [genPrefix, setGenPrefix] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-promotions", page],
    queryFn: () => getPromotions(page),
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => togglePromotion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast.success("Promotion status updated");
    },
  });

  const genMut = useMutation({
    mutationFn: ({ id, count, prefix }: { id: string; count: number; prefix?: string }) =>
      generatePromoCodes(id, count, prefix),
    onSuccess: (created) => {
      toast.success(`${created} coupon codes generated`);
    },
    onError: () => toast.error("Failed to generate codes"),
  });

  function copyShareLink(promo: PromotionResponse) {
    if (!promo.shareToken) return;
    const url = `${window.location.origin}/?promo=${promo.shareToken}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedId(promo.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const promos = data?.content ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-sm text-muted-foreground">
            Auto-applied discounts with advanced targeting
          </p>
        </div>
        <Button render={<Link href="/admin/promotions/new" />}>
          <Plus className="size-4 mr-1.5" /> New Promotion
        </Button>
      </div>

      {isLoading && (
        <div className="text-muted-foreground text-sm">Loading…</div>
      )}

      {!isLoading && promos.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No promotions yet. Create one to get started.
        </div>
      )}

      <div className="space-y-3">
        {promos.map((promo) => (
          <div
            key={promo.id}
            className="rounded-xl border bg-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{promo.name}</span>
                  <Badge variant={promo.isActive ? "default" : "secondary"}>
                    {promo.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {promo.stackable && (
                    <Badge variant="outline" className="text-xs">Stackable</Badge>
                  )}
                  {promo.userSegment !== "ALL" && (
                    <Badge variant="outline" className="text-xs text-blue-600">
                      {promo.userSegment === "NEW_USER" ? "New users" : "Returning users"}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {promo.discountType === "FLAT" ? `₹${promo.discountValue} off` : `${promo.discountValue}% off`}
                  {promo.maxDiscount ? ` (max ₹${promo.maxDiscount})` : ""}
                  {promo.minOrderValue ? ` · min order ₹${promo.minOrderValue}` : ""}
                  {promo.minQuantity ? ` · min qty ${promo.minQuantity}` : ""}
                  {" · "}priority {promo.priority}
                  {" · "}used {promo.timesUsed}×
                </p>
                {promo.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{promo.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {promo.shareToken && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    title="Copy share link"
                    onClick={() => copyShareLink(promo)}
                  >
                    {copiedId === promo.id ? (
                      <Check className="size-3.5 text-green-600" />
                    ) : (
                      <Share2 className="size-3.5" />
                    )}
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  onClick={() => toggleMut.mutate(promo.id)}
                  title={promo.isActive ? "Deactivate" : "Activate"}
                >
                  {promo.isActive ? (
                    <ToggleRight className="size-4 text-green-600" />
                  ) : (
                    <ToggleLeft className="size-4 text-muted-foreground" />
                  )}
                </Button>
                <Button size="icon" variant="ghost" className="size-8" render={<Link href={`/admin/promotions/${promo.id}`} />}>
                  <Edit2 className="size-3.5" />
                </Button>
              </div>
            </div>

            {/* Bulk code generation row */}
            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
              <Zap className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">Generate coupon codes:</span>
              <input
                type="text"
                placeholder="Prefix (e.g. DIWALI)"
                value={genPrefix[promo.id] ?? ""}
                onChange={(e) => setGenPrefix((p) => ({ ...p, [promo.id]: e.target.value }))}
                className="h-6 px-1.5 text-xs border rounded w-28 bg-background"
              />
              <input
                type="number"
                min={1}
                max={500}
                placeholder="Count"
                value={genCount[promo.id] ?? ""}
                onChange={(e) => setGenCount((p) => ({ ...p, [promo.id]: Number(e.target.value) }))}
                className="h-6 px-1.5 text-xs border rounded w-16 bg-background"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs px-2"
                onClick={() => genMut.mutate({
                  id: promo.id,
                  count: genCount[promo.id] ?? 10,
                  prefix: genPrefix[promo.id] || undefined,
                })}
                disabled={genMut.isPending}
              >
                Generate
              </Button>
            </div>
          </div>
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            {page + 1} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
