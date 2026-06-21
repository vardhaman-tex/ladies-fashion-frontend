"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, GripVertical, DatabaseBackup, Upload, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  adminGetSocialLinks,
  adminCreateSocialLink,
  adminUpdateSocialLink,
  adminDeleteSocialLink,
  type SocialLink,
  type SocialLinkRequest,
} from "@/services/socialLinkService";
import { exportFullBackup, importFullBackup } from "@/services/adminService";
import { adminUpdateLogo, adminRemoveLogo } from "@/services/siteSettingsService";
import { useSiteSettings, SITE_SETTINGS_QUERY_KEY } from "@/hooks/useSiteSettings";

const QUERY_KEY = ["admin", "social-links"];

const PLATFORM_SUGGESTIONS = [
  { platform: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { platform: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { platform: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
  { platform: "twitter", label: "Twitter / X", placeholder: "https://x.com/..." },
  { platform: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/..." },
  { platform: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/..." },
];

function SocialLinkForm({
  initial,
  onSubmit,
  isPending,
}: {
  initial?: SocialLink;
  onSubmit: (data: SocialLinkRequest) => void;
  isPending: boolean;
}) {
  const [platform, setPlatform] = useState(initial?.platform ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);

  function handlePlatformSelect(p: typeof PLATFORM_SUGGESTIONS[0]) {
    setPlatform(p.platform);
    if (!label) setLabel(p.label);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!platform || !label || !url) { toast.error("All fields required"); return; }
    onSubmit({ platform, label, url, enabled, sortOrder });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Quick platform buttons */}
      {!initial && (
        <div className="flex flex-col gap-1.5">
          <Label>Platform</Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_SUGGESTIONS.map((p) => (
              <button
                key={p.platform}
                type="button"
                onClick={() => handlePlatformSelect(p)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  platform === p.platform
                    ? "border-rose-600 bg-rose-600 text-white"
                    : "border-border hover:border-rose-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="platform">Platform key</Label>
          <Input id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="instagram" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="label">Display label</Label>
          <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Instagram" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="url">URL</Label>
        <Input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://instagram.com/yourbrand" />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="accent-rose-600" />
          Show in footer
        </label>
        <div className="flex items-center gap-2">
          <Label htmlFor="sort" className="text-xs text-muted-foreground">Sort order</Label>
          <input
            id="sort"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="self-end">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {initial ? "Save Changes" : "Add Link"}
      </Button>
    </form>
  );
}

function LogoSection() {
  const qc = useQueryClient();
  const { data: siteSettings, isLoading } = useSiteSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMut = useMutation({
    mutationFn: adminUpdateLogo,
    onSuccess: () => { qc.invalidateQueries({ queryKey: SITE_SETTINGS_QUERY_KEY }); toast.success("Logo updated"); },
    onError: () => toast.error("Failed to upload logo"),
  });

  const removeMut = useMutation({
    mutationFn: adminRemoveLogo,
    onSuccess: () => { qc.invalidateQueries({ queryKey: SITE_SETTINGS_QUERY_KEY }); toast.success("Logo removed"); },
    onError: () => toast.error("Failed to remove logo"),
  });

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) uploadMut.mutate(file);
  }

  return (
    <div className="mb-8 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Site Logo</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Shown in the browser tab icon, site header, footer, mobile menu, and admin panel —
            wherever &quot;Vardhman Textile&quot; appears. Recommended: square or wide PNG with
            transparent background.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {isLoading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : siteSettings?.logoUrl ? (
            <img src={siteSettings.logoUrl} alt="Current logo" className="h-10 w-auto rounded border bg-muted/30 p-1" />
          ) : (
            <span className="flex h-10 w-16 items-center justify-center rounded border border-dashed text-muted-foreground">
              <ImageIcon className="size-4" />
            </span>
          )}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadMut.isPending} className="gap-1.5">
            {uploadMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {siteSettings?.logoUrl ? "Replace" : "Upload"}
          </Button>
          {siteSettings?.logoUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => { if (confirm("Remove the logo?")) removeMut.mutate(); }}
              disabled={removeMut.isPending}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function DataBackupSection() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportFullBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ladies-fashion-backup-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch {
      toast.error("Failed to generate backup");
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const result = await importFullBackup(file);
      const total =
        result.categoriesProcessed +
        result.subCategoriesProcessed +
        result.productsProcessed +
        result.productVariantsProcessed +
        result.productImagesProcessed +
        result.variantSkusProcessed;

      if (result.errors.length === 0) {
        toast.success(`Import complete: ${total} rows applied`);
      } else {
        toast.warning(
          `Import finished with ${result.errors.length} error(s): ${result.errors
            .slice(0, 3)
            .map((err) => `${err.sheet} row ${err.row} – ${err.message}`)
            .join("; ")}${result.errors.length > 3 ? "…" : ""}`
        );
      }
    } catch {
      toast.error("Failed to import backup file");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mb-8 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Data Backup</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Export or restore a full snapshot of categories, sub-categories, products, product
            variants (colors), product images, and per-size stock as a single .xlsx file. Import
            upserts by slug/SKU/color/size, so it&apos;s safe to run after a database reset or to
            top up existing data.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="gap-1.5"
          >
            {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Import Backup
          </Button>
          <Button onClick={handleExport} disabled={exporting} className="gap-1.5">
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <DatabaseBackup className="size-4" />}
            Export Backup
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SocialLink | null>(null);

  const { data: links = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: adminGetSocialLinks,
  });

  const createMut = useMutation({
    mutationFn: adminCreateSocialLink,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEY }); setDialogOpen(false); toast.success("Social link added"); },
    onError: () => toast.error("Failed to add link"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SocialLinkRequest }) => adminUpdateSocialLink(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEY }); setDialogOpen(false); setEditing(null); toast.success("Link updated"); },
    onError: () => toast.error("Failed to update link"),
  });

  const deleteMut = useMutation({
    mutationFn: adminDeleteSocialLink,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEY }); toast.success("Link removed"); },
  });

  const isPending = createMut.isPending || updateMut.isPending;

  function handleSubmit(data: SocialLinkRequest) {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Site Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Configure social media links shown in the footer.</p>
      </div>

      <DataBackupSection />

      <LogoSection />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Social Media Links</h2>
        <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-1.5">
          <Plus className="size-4" /> Add Link
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : links.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <p className="mb-3">No social links yet.</p>
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>Add your first link</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {links
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((link) => (
              <div key={link.id} className="flex items-center gap-3 rounded-xl border p-3">
                <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="w-24 shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-center text-xs font-semibold capitalize">
                    {link.platform}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">{link.url}</span>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  link.enabled ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                }`}>
                  {link.enabled ? "Live" : "Hidden"}
                </span>
                <Button variant="ghost" size="icon" onClick={() => { setEditing(link); setDialogOpen(true); }}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => { if (confirm("Remove this link?")) deleteMut.mutate(link.id); }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o: boolean) => { if (!o) { setDialogOpen(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Social Link" : "Add Social Link"}</DialogTitle>
          </DialogHeader>
          <SocialLinkForm key={editing?.id ?? "new"} initial={editing ?? undefined} onSubmit={handleSubmit} isPending={isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
