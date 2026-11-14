"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBanner } from "@/services/bannerService";
import type { CreateBannerPayload, BannerPosition } from "@/services/bannerService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function NewBannerPage() {
  const router = useRouter();

  const [form, setForm] = useState<CreateBannerPayload>({
    title: "",
    position: "HOMEPAGE_HERO",
    isActive: true,
    priority: 0,
  });

  function set<K extends keyof CreateBannerPayload>(key: K, value: CreateBannerPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const mut = useMutation({
    mutationFn: () => createBanner(form),
    onSuccess: () => {
      toast.success("Banner created");
      router.push("/admin/banners");
    },
    onError: () => toast.error("Failed to create banner"),
  });

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <Link href="/admin/banners" className="text-xs text-muted-foreground hover:underline">
          ← Back to banners
        </Link>
        <h1 className="text-2xl font-bold mt-1">New Banner</h1>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Title *</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Up to 50% off on sarees" />
        </div>

        <div>
          <Label>Subtitle</Label>
          <Input value={form.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value || undefined)} />
        </div>

        <div>
          <Label>Image URL</Label>
          <Input value={form.imageUrl ?? ""} onChange={(e) => set("imageUrl", e.target.value || undefined)}
            placeholder="https://…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>CTA Label</Label>
            <Input value={form.ctaLabel ?? ""} onChange={(e) => set("ctaLabel", e.target.value || undefined)}
              placeholder="Shop Now" />
          </div>
          <div>
            <Label>CTA Link</Label>
            <Input value={form.ctaLink ?? ""} onChange={(e) => set("ctaLink", e.target.value || undefined)}
              placeholder="/collections/sarees" />
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
            <option value="TICKER">Ticker (scrolling strip)</option>
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

        <div>
          <Label>Priority</Label>
          <Input type="number" value={form.priority}
            onChange={(e) => set("priority", parseInt(e.target.value) || 0)} />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
          <input type="checkbox" checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)} className="rounded" />
          Active
        </label>

        <div className="flex gap-3 pt-2">
          <Button onClick={() => mut.mutate()} disabled={!form.title || mut.isPending}>
            Create Banner
          </Button>
          <Button variant="outline" render={<Link href="/admin/banners" />}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
