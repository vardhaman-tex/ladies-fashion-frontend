"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Edit2, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getAdminBanners, toggleBanner, deleteBanner } from "@/services/bannerService";
import type { BannerPosition } from "@/services/bannerService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const POSITION_LABELS: Record<BannerPosition, string> = {
  HOMEPAGE_HERO: "Homepage Hero",
  COLLECTION_STRIP: "Collection Strip",
  TICKER: "Ticker",
};

export default function AdminBannersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-banners", page],
    queryFn: () => getAdminBanners(page),
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => toggleBanner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner updated");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const banners = data?.content ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banners</h1>
          <p className="text-sm text-muted-foreground">
            Manage homepage heroes, collection strips, and ticker banners
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/banners/new">
            <Plus className="size-4 mr-1.5" /> New Banner
          </Link>
        </Button>
      </div>

      {isLoading && <div className="text-muted-foreground text-sm">Loading…</div>}

      {!isLoading && banners.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No banners yet. Create one to display on the storefront.
        </div>
      )}

      <div className="space-y-3">
        {banners.map((banner) => (
          <div key={banner.id} className="rounded-xl border bg-card p-4 flex items-start gap-4">
            {banner.imageUrl && (
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="h-16 w-24 object-cover rounded-lg shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{banner.title}</span>
                <Badge variant="outline" className="text-xs">
                  {POSITION_LABELS[banner.position]}
                </Badge>
                <Badge variant={banner.isActive ? "default" : "secondary"}>
                  {banner.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {banner.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{banner.subtitle}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Priority {banner.priority}
                {banner.ctaLabel && ` · CTA: "${banner.ctaLabel}"`}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={() => toggleMut.mutate(banner.id)}
              >
                {banner.isActive ? (
                  <ToggleRight className="size-4 text-green-600" />
                ) : (
                  <ToggleLeft className="size-4 text-muted-foreground" />
                )}
              </Button>
              <Button size="icon" variant="ghost" className="size-8" asChild>
                <Link href={`/admin/banners/${banner.id}`}>
                  <Edit2 className="size-3.5" />
                </Link>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm("Delete this banner?")) deleteMut.mutate(banner.id);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            {page + 1} / {data.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page + 1 >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
