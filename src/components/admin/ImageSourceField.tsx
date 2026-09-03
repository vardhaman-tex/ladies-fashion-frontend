"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, LinkIcon, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { parseImageUrl } from "@/lib/imageUrl";

/**
 * Picks the single image for a category, sub-category, or the site logo —
 * by upload or by URL, whichever the admin has to hand.
 *
 * The two routes are mutually exclusive by construction: choosing a file
 * clears a staged URL and vice versa, so the form never has to guess which
 * one the admin meant. Nothing is saved here; the parent submits.
 */
export function ImageSourceField({
  currentUrl,
  file,
  onFileChange,
  url,
  onUrlChange,
  removed,
  onRemovedChange,
  disabled = false,
  busy = false,
}: {
  /** The image already saved on the record, if any. */
  currentUrl?: string | null;
  /** A file staged for upload. */
  file?: File;
  onFileChange: (file: File | undefined) => void;
  /** A URL staged to be stored by reference. */
  url: string;
  onUrlChange: (url: string) => void;
  /** Whether the admin asked to clear the existing image. */
  removed?: boolean;
  onRemovedChange?: (removed: boolean) => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoised on the file rather than minted inline in the JSX: a bare
  // URL.createObjectURL() in the render body hands out a fresh URL on every
  // re-render and the browser keeps the file alive behind each one until the
  // tab closes. The effect exists only to release it.
  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    if (!filePreview) return;
    return () => URL.revokeObjectURL(filePreview);
  }, [filePreview]);

  const stagedUrl = parseImageUrl(url).url;
  // What the admin will end up with, in the same precedence the backend uses.
  const previewUrl =
    filePreview ?? stagedUrl ?? (removed ? undefined : currentUrl ?? undefined);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    onFileChange(picked);
    onUrlChange("");
    onRemovedChange?.(false);
    setError(null);
  }

  function handleUrl(value: string) {
    onUrlChange(value);
    if (value.trim()) {
      onFileChange(undefined);
      onRemovedChange?.(false);
    }
    setError(value.trim() ? parseImageUrl(value).error ?? null : null);
  }

  function handleClear() {
    onFileChange(undefined);
    onUrlChange("");
    setError(null);
    // Only a saved image needs an explicit removal flag; clearing something
    // merely staged just undoes the staging.
    onRemovedChange?.(Boolean(currentUrl));
  }

  const hasSomething = Boolean(file || url.trim() || (currentUrl && !removed));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        {previewUrl ? (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="size-full object-cover" />
          </div>
        ) : (
          <span className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
            <ImagePlus className="size-4" />
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || busy}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
              {file ? file.name.slice(0, 24) : currentUrl && !removed ? "Replace file" : "Upload file"}
            </button>
            {hasSomething && (
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled || busy}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
              >
                <X className="size-3.5" /> Remove
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <Input
              type="url"
              inputMode="url"
              value={url}
              disabled={disabled || busy}
              placeholder="…or paste an image URL — https://…"
              onChange={(e) => handleUrl(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {removed && !file && !url.trim() && (
        <p className="text-xs text-muted-foreground">The current image will be removed when you save.</p>
      )}
    </div>
  );
}
