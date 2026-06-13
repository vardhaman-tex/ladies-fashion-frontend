"use client";

import Image from "next/image";
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product";

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

/**
 * Displays a large primary image with:
 * - Vertical thumbnail strip on the left (desktop) / horizontal strip below (mobile)
 * - Hover-to-zoom magnifier panel shown to the right on desktop
 */
export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const mainRef = useRef<HTMLDivElement>(null);

  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const selected = sorted[selectedIdx] ?? sorted[0];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainRef.current) return;
    const rect = mainRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  }, []);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        No image available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main area: [thumbnails | main image] on desktop */}
      <div className="flex gap-3">
        {/* Vertical thumbnail strip — desktop only (left side) */}
        {sorted.length > 1 && (
          <div className="hidden md:flex flex-col gap-2 overflow-y-auto max-h-[520px] pr-1">
            {sorted.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setSelectedIdx(idx)}
                className={cn(
                  "relative size-[72px] shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                  idx === selectedIdx
                    ? "border-rose-600"
                    : "border-transparent hover:border-rose-300"
                )}
              >
                <Image
                  src={img.imageUrl}
                  alt={`${productName} view ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div className="relative flex-1">
          <div
            ref={mainRef}
            className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted md:cursor-crosshair"
            onMouseEnter={() => setZooming(true)}
            onMouseLeave={() => setZooming(false)}
            onMouseMove={handleMouseMove}
          >
            {selected && (
              <Image
                src={selected.imageUrl}
                alt={productName}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 45vw"
                priority
              />
            )}
          </div>

          {/* Zoom lens overlay — desktop only */}
          {zooming && selected && (
            <div
              className="pointer-events-none absolute inset-0 hidden overflow-hidden rounded-xl md:block"
              style={{ zIndex: 10 }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${selected.imageUrl})`,
                  backgroundSize: "250%",
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundRepeat: "no-repeat",
                  opacity: 0.95,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Horizontal thumbnail strip — mobile only */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
          {sorted.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setSelectedIdx(idx)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                idx === selectedIdx
                  ? "border-rose-600"
                  : "border-transparent hover:border-rose-300"
              )}
            >
              <Image
                src={img.imageUrl}
                alt={`${productName} view ${idx + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
