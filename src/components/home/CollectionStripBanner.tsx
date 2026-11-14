"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { getPublicBanners } from "@/services/bannerService";

export function CollectionStripBanner() {
  const { data: banners } = useQuery({
    queryKey: ["banners-collection-strip"],
    queryFn: () => getPublicBanners("COLLECTION_STRIP"),
    staleTime: 5 * 60_000,
  });

  if (!banners || banners.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4">
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory">
        {banners.map((banner) => {
          const inner = (
            <div
              key={banner.id}
              className="relative shrink-0 snap-start overflow-hidden rounded-xl bg-rose-50 dark:bg-rose-950/20"
              style={{ width: banners.length === 1 ? "100%" : "clamp(260px, 60vw, 420px)" }}
            >
              {banner.imageUrl && (
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  width={420}
                  height={180}
                  className="h-36 w-full object-cover"
                />
              )}
              <div
                className={
                  banner.imageUrl
                    ? "absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-3"
                    : "p-3"
                }
              >
                <div>
                  <p
                    className={`text-sm font-semibold leading-tight ${
                      banner.imageUrl ? "text-white" : "text-foreground"
                    }`}
                  >
                    {banner.title}
                  </p>
                  {banner.subtitle && (
                    <p
                      className={`text-xs mt-0.5 ${
                        banner.imageUrl ? "text-white/80" : "text-muted-foreground"
                      }`}
                    >
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.ctaLabel && (
                    <span className="mt-2 inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700 shadow-sm">
                      {banner.ctaLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );

          return banner.ctaLink ? (
            <Link key={banner.id} href={banner.ctaLink} className="block">
              {inner}
            </Link>
          ) : (
            inner
          );
        })}
      </div>
    </section>
  );
}
