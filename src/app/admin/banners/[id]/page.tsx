"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAdminBanners,
  updateBanner,
} from "@/services/bannerService";
import type { CreateBannerPayload, BannerPosition } from "@/services/bannerService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: bannersPage, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: () => getAdminBanners(),
  });

  const banner = bannersPage?.content.find((b) => b.id === id);

  const [form, setForm] = useState<CreateBannerPayload | null>(null);

  useEffect(() => {
    if (banner) {
      setForm({
        title: banner.title,
        subtitle: banner.subtitle ?? "",
        imageUrl: banner.imageUrl ?? "",
        ctaLabel: banner.ctaLabel ?? "",
        ctaLink: banner.ctaLink ?? "",
        position: banner.position,
        startsAt: banner.startsAt ?? undefined,
        endsAt: banner.endsAt ?? undefined,
        isActive: banner.isActive,
        priority: banner.priority,
      });
    }
  }, [banner]);

  const mut = useMutation({
    mutationFn: () => updateBanner(id, form!),
    onSuccess: () => {
      toast.success("Banner updated");
      router.push("/admin/banners");
    },
    onError: () => toast.error("Failed to update banner"),
  });

  function set<K extends keyof CreateBannerPayload>(key: K, value: CreateBannerPayload[K]) {
    setForm((f) => f ? { ...f, [key]: value } : f);
  }

  if (isLoading || !form) {
    return <div className="p-6 text-muted-foreground text-sm">Loading…</div>;
  }

  if (!banner) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Banner not found.</p>
        <Link href="/admin/banners" className="text-sm text-primary hover:underline mt-2 block">
          ← Back to banners
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <Link href="/admin/banners" className="text-xs text-muted-foreground hover:underline">
          ← Back to banners
        </Link>
        <h1 className="text-2xl font-bold mt-1">Edit Banner</h1>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Title *</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>

        <div>
          <Label>Subtitle</Label>
          <Input value={form.subtitle ?? ""}
            onChange={(e) => set("subtitle", e.target.value || undefined)} />
        </div>

        <div>
          <Label>Image URL</Label>
          <Input value={form.imageUrl ?? ""}
            onChange={(e) => set("imageUrl", e.target.value || undefined)}
            placeholder="https://…" />
          {form.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.imageUrl}
              alt="Preview"
              className="mt-2 h-28 w-full rounded-lg object-cover border"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>CTA Label</Label>
            <Input value={form.ctaLabel ?? ""}
              onChange={(e) => set("ctaLabel", e.target.value || undefined)}
              placeholder="Shop now" />
          </div>
          <div>
            <Label>CTA Link</Label>
            <Input value={form.ctaLink ?? ""}
              onChange={(e) => set("ctaLink", e.target.value || undefined)}
              placeholder="/products?…" />
          </div>
        </div>

        <div>
          <Label>Position *</Label>
          <select
            className="w-full h-10 px-3 border rounded-md text-sm bg-background"
            value={form.position}
            onChange={(e) => set("position", e.target.value as BannerPosition)}
          >
            <option value="HOMEPAGE_HERO">Homepage Hero</option>
            <option value="COLLECTION_STRIP">Collection Strip</option>
            <option value="TICKER">Ticker (scrolling bar)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Starts At</Label>
            <Input type="datetime-local"
              value={form.startsAt?.slice(0, 16) ?? ""}
              onChange={(e) => set("startsAt", e.target.value ? e.target.value + ":00" : undefined)} />
          </div>
          <div>
            <Label>Ends At</Label>
            <Input type="datetime-local"
              value={form.endsAt?.slice(0, 16) ?? ""}
              onChange={(e) => set("endsAt", e.target.value ? e.target.value + ":00" : undefined)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Priority</Label>
            <Input type="number" value={form.priority}
              onChange={(e) => set("priority", parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)} className="rounded" />
            Active
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => mut.mutate()}
            disabled={!form.title || mut.isPending}
          >
            Save Changes
          </Button>
          <Button variant="outline" render={<Link href="/admin/banners" />}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
