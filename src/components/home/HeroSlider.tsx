"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  id: string;
  image: string;
  /** Where tapping the photo goes: the product itself. */
  href: string;
  alt: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  /** Milliseconds each slide stays before the next one slides in. */
  intervalMs?: number;
}

/**
 * The home page's opening photo: a short, swipeable slider of real products with a
 * fixed caption strip on top, so the headline and Shop now button never depend on
 * which photo is showing.
 *
 * Native scroll-snap does the swiping, so it is smooth and accessible by default.
 * It advances by itself every few seconds, stops for good once the shopper touches
 * or focuses it, and does not move at all for anyone who asked for reduced motion.
 */
export function HeroSlider({ slides, intervalMs = 5000 }: HeroSliderProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeRef = useRef(0);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      // The scroll handler below updates `active` as the track moves.
      goTo((activeRef.current + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [slides.length, paused, intervalMs, goTo]);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    activeRef.current = index;
    setActive(index);
  };

  return (
    <div
      className="relative h-[23rem] overflow-hidden rounded-2xl bg-accent sm:h-[28rem] md:h-[30rem] md:rounded-3xl"
      onPointerDown={() => setPaused(true)}
      onFocus={() => setPaused(true)}
      role="region"
      aria-roledescription="carousel"
      aria-label="New collection"
    >
      <ul
        ref={trackRef}
        onScroll={handleScroll}
        className="flex size-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <li key={slide.id} className="relative size-full shrink-0 snap-start" aria-roledescription="slide">
            <Link href={slide.href} tabIndex={index === active ? 0 : -1} className="absolute inset-0 block">
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                className="object-cover object-top"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </Link>
          </li>
        ))}
      </ul>

      {/* One caption for the whole slider, over the foot of the photo. The scrim
          is only as tall as the text, so the picture stays almost entirely
          visible; white on that dark foot reads over any photo. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-linear-to-t from-black/75 via-black/45 to-transparent px-4 pt-14 pb-4 text-white sm:px-8 sm:pb-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase opacity-90">New season collection</p>
          <h1 className="font-heading text-xl leading-tight font-bold sm:text-3xl">Celebrate every occasion in style</h1>
        </div>
        <Button
          size="lg"
          variant="secondary"
          className="pointer-events-auto h-11 shrink-0 rounded-full px-5 text-primary"
          render={<Link href="/products" />}
        >
          Shop now
          <ArrowRightIcon />
        </Button>
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-0 top-3 flex justify-center gap-1.5" aria-hidden="true">
          {slides.map((slide, index) => (
            <span
              key={slide.id}
              className={cn(
                "h-1.5 rounded-full bg-background shadow-sm transition-all",
                index === active ? "w-5" : "w-1.5 opacity-70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
