"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product";

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

/**
 * Displays a large primary image with a row of clickable thumbnails.
 */
export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        No image available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <Image
          src={images[selectedImage].imageUrl}
          alt={productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg border-2",
                index === selectedImage ? "border-primary" : "border-transparent"
              )}
            >
              <Image src={image.imageUrl} alt={`${productName} thumbnail ${index + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
