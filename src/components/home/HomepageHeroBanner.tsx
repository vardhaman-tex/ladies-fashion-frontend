"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { getPublicBanners } from "@/services/bannerService";

export function HomepageHeroBanner() {
  const { data: banners } = useQuery({
    queryKey: ["banners-hero"],
    queryFn: () => getPublicBanners("HOMEPAGE_HERO"),
    staleTime: 5 * 60_000,
  });

  const banner = banners?.[0];
  if (!banner) return null;

  const inner = (
    <div className="relative overflow-hidden rounded-xl bg-rose-50 dark:bg-rose-950/20">
      {banner.imageUrl && (
        <Image
          src={banner.imageUrl}
          alt={banner.title}
          width={1200}
          height={400}
          className="h-48 w-full object-cover sm:h-64"
          priority
          unoptimized
        />
      )}
      <div className={banner.imageUrl ? "absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4 sm:p-6" : "p-4 sm:p-6"}>
        <div>
          <h2 className={`text-lg font-bold sm:text-2xl ${banner.imageUrl ? "text-white" : "text-foreground"}`}>
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className={`text-sm mt-0.5 ${banner.imageUrl ? "text-white/80" : "text-muted-foreground"}`}>
              {banner.subtitle}
            </p>
          )}
          {banner.ctaLabel && (
            <span className="mt-3 inline-block rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-rose-700 shadow-sm">
              {banner.ctaLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (banner.ctaLink) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4">
        <Link href={banner.ctaLink}>{inner}</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4">
      {inner}
    </section>
  );
}
