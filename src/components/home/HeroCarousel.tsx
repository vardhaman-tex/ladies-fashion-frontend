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
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-400 via-rose-500 to-purple-700">
        <div className="absolute -top-24 -left-24 size-72 rounded-full bg-amber-300/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 size-96 rounded-full bg-purple-400/30 blur-3xl" />
      </div>
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
          className="absolute inset-0 size-full object-cover transition-opacity duration-1000"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
      {/* Overlay for text legibility, matching the previous gradient's contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-purple-900/60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
    </div>
  );
}
