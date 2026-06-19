"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, Lock, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { ProductGridSkeleton } from "@/components/common/LoadingSkeleton";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductStrip } from "@/components/product/ProductStrip";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/useCategories";
import { useFeaturedProducts, useNewArrivals, useSaleProducts, useTrending } from "@/hooks/useProducts";

const TRUST_BADGES = [
  { icon: Truck, label: "Free Shipping", sub: "On orders above ₹999", bg: "bg-orange-100 text-orange-600" },
  { icon: RotateCcw, label: "Easy Returns", sub: "7-day return window", bg: "bg-rose-100 text-rose-600" },
  { icon: ShieldCheck, label: "Authentic Products", sub: "100% genuine fabrics", bg: "bg-purple-100 text-purple-600" },
  { icon: Lock, label: "Secure Payment", sub: "Safe & encrypted checkout", bg: "bg-amber-100 text-amber-600" },
];

export default function HomePage() {
  const { data: categories } = useCategories();
  const { data: featured, isLoading: loadingFeatured } = useFeaturedProducts({ size: 8 });
  const { data: trending, isLoading: loadingTrending } = useTrending({ size: 8 });
  const { data: newArrivals, isLoading: loadingNewArrivals } = useNewArrivals({ size: 8 });
  const { data: sale, isLoading: loadingSale } = useSaleProducts({ size: 8 });

  const heroImages = Array.from(
    new Set(
      [...(featured?.content ?? []), ...(newArrivals?.content ?? [])]
        .map((p) => p.thumbnail)
        .filter((url): url is string => Boolean(url))
    )
  ).slice(0, 6);

  return (
    <div className="flex flex-col gap-10 pb-10 sm:gap-16 sm:pb-16 lg:gap-24 lg:pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-14 text-center sm:py-24 lg:py-36">
        <HeroCarousel images={heroImages} />

        <div className="relative mx-auto max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-white/80 uppercase">New Season Collection</p>
          <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-7xl">
            Celebrate Every Occasion in Style
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/90 sm:mt-5 sm:text-lg">
            Discover the latest collections of ethnic and contemporary fashion — curated for every festival, function, and everyday moment.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8">
            <Button size="lg" className="bg-white text-rose-600 hover:bg-white/90" render={<Link href="/products" />}>
              Shop Now
              <ArrowRightIcon />
            </Button>
            <Button size="lg" variant="outline" className="border-white/60 bg-transparent text-white hover:bg-white/10" render={<Link href="/products" />}>
              Explore Categories
            </Button>
          </div>
        </div>
      </section>

      {/* Category showcase */}
      <section className="mx-auto w-full max-w-7xl px-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-rose-600 uppercase">Browse</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">Shop by Category</h2>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categories?.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={`/products?categorySlug=${category.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted shadow-sm transition-shadow hover:shadow-xl"
            >
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  {category.name}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-colors group-hover:from-black/80" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 sm:p-4">
                <span className="text-xs font-bold text-white sm:text-sm">{category.name}</span>
                <ArrowRightIcon className="size-4 shrink-0 -translate-x-1 text-white opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products — only show once loaded and non-empty */}
      {!loadingFeatured && (featured?.content?.length ?? 0) > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-rose-600 uppercase">Curated for you</p>
              <h2 className="mt-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">Featured Picks</h2>
            </div>
            <Link href="/products" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View All
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <div className="mt-4 sm:mt-6">
            {loadingFeatured ? <ProductGridSkeleton count={4} /> : <ProductStrip products={featured?.content ?? []} />}
          </div>
        </section>
      )}

      {/* Trending / New Arrivals / Sale — hidden when all empty */}
      {(() => {
        const tabs = [
          { value: "trending", label: "Trending", loading: loadingTrending, data: trending },
          { value: "new-arrivals", label: "New Arrivals", loading: loadingNewArrivals, data: newArrivals },
          { value: "sale", label: "Sale", loading: loadingSale, data: sale },
        ];
        const visibleTabs = tabs.filter((t) => !t.loading && (t.data?.content?.length ?? 0) > 0);
        if (visibleTabs.length === 0) return null;
        const defaultTab = visibleTabs[0].value;
        return (
          <section className="mx-auto w-full max-w-7xl px-4">
            <p className="text-xs font-semibold tracking-[0.2em] text-rose-600 uppercase">Discover More</p>
            <Tabs defaultValue={defaultTab} className="mt-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">What&apos;s Hot</h2>
                <TabsList className="w-full sm:w-auto">
                  {visibleTabs.map((t) => (
                    <TabsTrigger key={t.value} value={t.value} className="flex-1 sm:flex-none">
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {visibleTabs.map((t) => (
                <TabsContent key={t.value} value={t.value} className="mt-4 sm:mt-6">
                  {t.loading ? <ProductGridSkeleton count={4} /> : <ProductStrip products={t.data?.content ?? []} />}
                </TabsContent>
              ))}
            </Tabs>
          </section>
        );
      })()}

      {/* Trust strip */}
      <section className="mx-auto w-full max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:divide-x sm:divide-border sm:gap-0">
          {TRUST_BADGES.map(({ icon: Icon, label, sub, bg }) => (
            <div key={label} className="flex flex-col items-center gap-2 px-2 text-center sm:gap-3 sm:px-6">
              <div className={`flex size-10 items-center justify-center rounded-full sm:size-12 ${bg}`}>
                <Icon className="size-4 sm:size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground sm:text-sm">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
