"use client";

import { useState } from "react";
import { LinkIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { parseImageUrl } from "@/lib/imageUrl";

/**
 * Collects already-hosted image URLs to attach to a colour variant alongside
 * (or instead of) uploaded files. Nothing is fetched here — the URL is saved
 * as the image's address, so the picture keeps living wherever it already
 * lives. That is the point: a supplier's CDN link becomes a product image
 * without downloading and re-uploading it.
 *
 * URLs are staged locally and only persisted when the surrounding variant form
 * is saved, matching how pending file uploads already behave on these screens.
 */

export function ImageUrlInput({
  urls,
  onChange,
  existingUrls = [],
}: {
  /** URLs staged for the next save. */
  urls: string[];
  onChange: (urls: string[]) => void;
  /** Already-saved image URLs on this variant, used to catch duplicates. */
  existingUrls?: string[];
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addUrl() {
    const { url: value, error: parseError } = parseImageUrl(draft);
    if (!value) {
      if (parseError) setError(parseError);
      return;
    }
    if (urls.includes(value) || existingUrls.includes(value)) {
      setError("That image is already on this colour");
      return;
    }

    onChange([...urls, value]);
    setDraft("");
    setError(null);
  }

  function removeUrl(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          type="url"
          inputMode="url"
          value={draft}
          placeholder="Paste an image URL — https://…"
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            // The variant editors sit inside forms; Enter here means "add this
            // URL", never "submit the whole product".
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={!draft.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground"
        >
          <LinkIcon className="size-3.5" /> Add URL
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, index) => (
            <div
              key={url}
              className="relative size-20 overflow-hidden rounded-lg border border-dashed border-sky-400"
              title={url}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="size-full object-cover"
                onError={(e) => {
                  // A URL that doesn't resolve to an image is worth showing as
                  // broken now rather than discovering it on the storefront.
                  e.currentTarget.style.display = "none";
                }}
              />
              <button
                type="button"
                onClick={() => removeUrl(index)}
                className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5"
                aria-label="Remove image URL"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {urls.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {urls.length} linked image{urls.length !== 1 ? "s" : ""} will be attached when you save.
        </p>
      )}
    </div>
  );
}
