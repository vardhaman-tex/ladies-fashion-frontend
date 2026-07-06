"use client";

import { useEffect, useState } from "react";

interface HeroCarouselProps {
  images: string[];
  /** Milliseconds between slide transitions. */
  intervalMs?: number;
}

/**
 * Full-bleed, auto-rotating background image carousel for the homepage hero.
 * Falls back to the brand gradient when no images are available yet (e.g. while
 * featured products are still loading), so the hero never renders blank.
 */
export function HeroCarousel({ images, intervalMs = 4500 }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [images.length, intervalMs]);

  if (images.length === 0) {
    return (
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[oklch(0.32_0.05_15)] to-[oklch(0.24_0.03_270)]" />
    );
  }

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-neutral-900">
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 size-full object-cover object-top transition-opacity duration-1000"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
      {/* Overlay for text legibility */}
      <div className="absolute inset-0 bg-black/45" />
    </div>
  );
}
