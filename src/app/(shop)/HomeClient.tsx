"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, Banknote, MessageCircle, Ruler, ShieldCheck, Truck, PackageCheck } from "lucide-react";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { useBestSellers, useFeaturedProducts, useProducts, useNewArrivals, useSaleProducts, useTrending } from "@/hooks/useProducts";
import type { PageResponse } from "@/types/api";
import type { Category } from "@/types/category";
import type { ProductSummary } from "@/types/product";

const TRUST_BADGES = [
  { icon: Truck, label: "Free shipping", sub: "On every order, across India" },
  { icon: Banknote, label: "Cash on delivery", sub: "Pay when it arrives" },
  { icon: ShieldCheck, label: "Secure payment", sub: "Encrypted checkout" },
  { icon: MessageCircle, label: "Ask a person", sub: "Help on WhatsApp" },
];

type ProductPage = PageResponse<ProductSummary>;

export interface HomeClientProps {
  /**
   * Server-fetched seed data. Passing it through to React Query means the
   * category tiles and product strips are rendered into the initial HTML
   * instead of appearing only after client-side hydration — which is what
   * makes them crawlable and gives the home page real internal links to
   * every category and featured product.
   */
  initialCategories?: Category[];
  initialFeatured?: ProductPage;
  initialTrending?: ProductPage;
  initialNewArrivals?: ProductPage;
  initialSale?: ProductPage;
  initialBestSellers?: ProductPage;
}

export default function HomeClient({
  initialCategories,
  initialFeatured,
  initialTrending,
  initialNewArrivals,
  initialSale,
  initialBestSellers,
}: HomeClientProps) {
  const { data: categories } = useCategories(initialCategories);
  const { data: featured, isLoading: loadingFeatured } = useFeaturedProducts({ size: 8 }, initialFeatured);
  const { data: trending, isLoading: loadingTrending } = useTrending({ size: 8 }, initialTrending);
  const { data: newArrivals, isLoading: loadingNewArrivals } = useNewArrivals({ size: 8 }, initialNewArrivals);
  const { data: bestSellers, isLoading: loadingBestSellers } = useBestSellers({ size: 8 }, initialBestSellers);
  const { data: sale, isLoading: loadingSale } = useSaleProducts({ size: 8 }, initialSale);

  const { data: allProducts, isLoading: loadingAll } = useProducts({ size: 24 });

  const productSections = (() => {
    const seen = new Set<string>();
    const take = (page: ProductPage | undefined) => {
      const fresh = (page?.content ?? []).filter((p) => !seen.has(p.id)).slice(0, 8);
      fresh.forEach((p) => seen.add(p.id));
      return fresh;
    };
    return [
      { key: "featured", eyebrow: "Curated for you", title: "Featured Picks", href: "/products", products: take(featured), loading: loadingFeatured },
      { key: "best", eyebrow: "Loved by customers", title: "Bestsellers", href: "/products", products: take(bestSellers), loading: loadingBestSellers },
      { key: "new", eyebrow: "Just landed", title: "New Arrivals", href: "/products", products: take(newArrivals), loading: loadingNewArrivals },
      { key: "trending", eyebrow: "Popular right now", title: "Trending Now", href: "/products", products: take(trending), loading: loadingTrending },
      { key: "sale", eyebrow: "Limited time", title: "On Sale", href: "/products", products: take(sale), loading: loadingSale },
      // The rest of the catalogue, so a short list above never leaves the page thin.
      { key: "more", eyebrow: "Keep browsing", title: "More to Love", href: "/products", products: take(allProducts), loading: loadingAll },
    ].filter((section) => section.products.length > 0);
  })();

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
            <Button size="lg" variant="outline" className="hidden border-white/60 bg-transparent text-white hover:bg-white/10 md:inline-flex" render={<a href="#categories" />}>
              Shop by Category
            </Button>
          </div>
        </div>
      </section>

      {/* Category showcase */}
      <section id="categories" className="mx-auto hidden w-full max-w-7xl scroll-mt-24 px-4 md:block">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-rose-600 uppercase">Browse</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">Shop by Category</h2>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categories?.slice(0, 6).map((category, index) => (
            <Link
              key={category.id}
              href={`/products?categorySlug=${category.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted shadow-sm transition-shadow hover:shadow-xl"
            >
              {category.imageUrl ? (
                /* The first row of tiles sits above the fold on most
                   viewports and is a frequent LCP candidate; lazy-loading it
                   costs Largest Contentful Paint, which is a ranking signal. */
                <Image
                  src={category.imageUrl}
                  alt={`Shop ${category.name} — women's fashion at Vardhman Textile`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  loading={index < 3 ? "eager" : "lazy"}
                  {...(index === 0 ? { priority: true } : {})}
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

      {/* One section per list instead of tabs, so a visitor scrolling a phone
          meets the whole range rather than only the first tab. A product shown in
          one section is left out of the ones below it: with a catalogue this size
          the same suit would otherwise appear in every row. */}
      {productSections.map((section) => (
        <section key={section.key} className="mx-auto w-full max-w-7xl px-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-rose-600 uppercase">{section.eyebrow}</p>
              <h2 className="mt-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">{section.title}</h2>
            </div>
            <Link href={section.href} className="flex shrink-0 items-center gap-1 text-sm font-medium text-rose-600 hover:underline">
              View all
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:mt-6 md:grid-cols-4 md:gap-x-4">
            {section.products.map((product, index) => (
              // Six on a phone (three even rows of two), eight from tablet up.
              <div key={product.id} className={index >= 6 ? "hidden md:block" : undefined}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      ))}

      {productSections.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-4 text-center">
          <Button size="lg" variant="outline" render={<Link href="/products" />}>
            Browse the full collection
            <ArrowRightIcon />
          </Button>
        </div>
      )}

      {/* Trust strip */}
      <section className="mx-auto w-full max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:divide-x sm:divide-border sm:gap-0">
          {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-2 px-2 text-center sm:gap-3 sm:px-6">
              <div className="flex size-11 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Size help and exchanges, said plainly. The exchange and returns lines
          restate the published Terms & Conditions (section 3, size exchange within
          2 days; section 4, no refund for change of mind). If those change,
          change this with them. */}
      <section className="mx-auto w-full max-w-7xl px-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <Ruler className="size-6 text-rose-600" aria-hidden="true" />
            <h2 className="mt-3 font-heading text-xl font-bold text-foreground">Not sure of your size?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Every product page has a size chart to help you choose. Still unsure? Message us on
              WhatsApp before you order and we&apos;ll help you pick the right size.
            </p>
            <Button variant="outline" className="mt-4" render={<Link href="/contact" />}>
              Ask us about sizing
            </Button>
          </div>
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <PackageCheck className="size-6 text-rose-600" aria-hidden="true" />
            <h2 className="mt-3 font-heading text-xl font-bold text-foreground">Exchanges &amp; returns, plainly</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Wrong size? We exchange it for another size of the same piece within 2 days of
              delivery, subject to stock. Damaged, defective or wrong item? Tell us within 2 days
              with photos and an unboxing video. We don&apos;t offer refunds for change of mind.
            </p>
            <Button variant="outline" className="mt-4" render={<Link href="/policies/return-policy" />}>
              Read the full policy
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
