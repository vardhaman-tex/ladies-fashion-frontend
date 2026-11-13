"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getPublicBanners } from "@/services/bannerService";

export function TickerBanner() {
  const { data: banners } = useQuery({
    queryKey: ["banners-ticker"],
    queryFn: () => getPublicBanners("TICKER"),
    staleTime: 5 * 60_000,
  });

  if (!banners || banners.length === 0) return null;

  const items = [...banners, ...banners];

  return (
    <div className="bg-rose-600 text-white text-xs font-medium overflow-hidden py-1.5 marquee-viewport">
      <div className="marquee-track">
        {items.map((b, i) => (
          <span key={i} className="inline-flex items-center gap-4 px-8">
            {b.ctaLink ? (
              <Link href={b.ctaLink} className="hover:underline">
                {b.title}
              </Link>
            ) : (
              <span>{b.title}</span>
            )}
            <span className="opacity-40 text-base">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
