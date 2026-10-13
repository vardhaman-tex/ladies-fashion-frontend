"use client";

import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, Banknote, MessageCircle, Ruler, ShieldCheck, Truck, PackageCheck } from "lucide-react";
import { HeroSlider, type HeroSlide } from "@/components/home/HeroSlider";
import { ProductCard } from "@/components/product/ProductCard";
import { Testimonials } from "@/components/product/Testimonials";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { useBestSellers, useFeaturedProducts, useProducts, useNewArrivals, useSaleProducts } from "@/hooks/useProducts";
import type { PageResponse } from "@/types/api";
import type { Category } from "@/types/category";
import type { ProductSummary } from "@/types/product";

const TRUST_BADGES = [
  { icon: Truck, label: "Free shipping", sub: "Across India" },
  { icon: Banknote, label: "Cash on delivery", sub: "Pay when it arrives" },
  { icon: ShieldCheck, label: "Secure payment", sub: "Encrypted checkout" },
  { icon: MessageCircle, label: "WhatsApp help", sub: "Help on WhatsApp" },
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
  initialNewArrivals,
  initialSale,
  initialBestSellers,
}: HomeClientProps) {
  const { data: categories } = useCategories(initialCategories);
  const { data: featured } = useFeaturedProducts({ size: 8 }, initialFeatured);
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
    // Four rails, not six: a phone scrolls past each one, and the extra two were
    // the same suits again under another heading. A badge is only set where the
    // list itself is the claim (the backend's own new-arrival and bestseller
    // lists), never guessed from a single product.
    return [
      { key: "new", eyebrow: "Just landed", title: "New Arrivals", href: "/products", badge: "New", products: take(newArrivals), loading: loadingNewArrivals },
      { key: "best", eyebrow: "Loved by customers", title: "Bestsellers", href: "/products", badge: "Bestseller", products: take(bestSellers), loading: loadingBestSellers },
      { key: "sale", eyebrow: "Limited time", title: "On Sale", href: "/products?discountAmount=1", badge: undefined, products: take(sale), loading: loadingSale },
      // The rest of the catalogue, so a short list above never leaves the page thin.
      { key: "more", eyebrow: "Keep browsing", title: "More to Love", href: "/products", badge: undefined, products: take(allProducts), loading: loadingAll },
    ].filter((section) => section.products.length > 0);
  })();

  // Up to four distinct product photos, featured first, then new arrivals.
  const heroSlides: HeroSlide[] = (() => {
    const seen = new Set<string>();
    return [...(featured?.content ?? []), ...(newArrivals?.content ?? [])]
      .filter((p) => p.thumbnail && !seen.has(p.id) && seen.add(p.id))
      .slice(0, 4)
      .map((p) => ({ id: p.id, image: p.thumbnail as string, href: `/products/${p.slug}`, alt: p.name }));
  })();

  return (
    <div className="flex flex-col gap-6 pb-8 sm:gap-12 sm:pb-12 lg:gap-16">
      {/* Categories. A round rail on phones, where it has to be one swipe from
          the top; image tiles from tablet up. It used to be hidden on phones,
          which left no way to browse by category from the home page. */}
      {categories && categories.length > 0 && (
        <section id="categories" className="scroll-mt-24" aria-label="Shop by category">
          <div className="mx-auto w-full max-w-7xl px-4 pt-4 md:hidden">
            <ul className="-mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((category, index) => (
                <li key={category.id} className="w-[4.5rem] shrink-0 snap-start">
                  <Link href={`/products?categorySlug=${category.slug}`} className="flex flex-col items-center gap-2">
                    <span className="relative block size-[4.5rem] overflow-hidden rounded-full bg-muted ring-1 ring-border">
                      {category.imageUrl && (
                        <Image
                          src={category.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="72px"
                          loading={index < 5 ? "eager" : "lazy"}
                        />
                      )}
                    </span>
                    <span className="line-clamp-2 text-center text-xs leading-tight font-medium text-foreground">{category.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto hidden w-full max-w-7xl px-4 md:block">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Browse</p>
            <h2 className="mt-1 font-heading text-3xl font-bold text-foreground">Shop by Category</h2>
            <div className="mt-4 grid grid-cols-3 gap-4 lg:grid-cols-6">
              {categories.slice(0, 6).map((category, index) => (
                <Link
                  key={category.id}
                  href={`/products?categorySlug=${category.slug}`}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted transition-shadow hover:shadow-lg"
                >
                  {category.imageUrl && (
                    <Image
                      src={category.imageUrl}
                      alt={`Shop ${category.name} — women's fashion at Vardhman Textile`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 33vw, 16vw"
                      loading={index < 3 ? "eager" : "lazy"}
                    />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/65 via-transparent to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-4 text-sm font-semibold text-white">{category.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* The opening photo is a short slider of real products. Kept compact so
          the first product rail is on the first screen of a phone. */}
      <section className="mx-auto w-full max-w-7xl px-4 md:pt-2">
        <HeroSlider slides={heroSlides} />
      </section>

      {/* Trust, in one line: the four things a first-time buyer wonders about,
          answered before the first product. */}
      <section className="mx-auto w-full max-w-7xl px-4" aria-label="Why shop with us">
        <ul className="grid grid-cols-4 gap-1 rounded-2xl border bg-card px-1 py-3">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-1.5 px-1 text-center">
              <Icon className="size-5 text-primary" aria-hidden="true" strokeWidth={1.7} />
              <span className="text-[11px] leading-tight font-medium text-foreground sm:text-sm">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* A product shows once on the page, in the first rail that has it. */}
      {productSections.map((section) => (
        <Fragment key={section.key}>
        <section className="mx-auto w-full max-w-7xl px-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{section.eyebrow}</p>
              <h2 className="mt-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">{section.title}</h2>
            </div>
            <Link href={section.href} className="flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View all
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          {/* A swipe rail on a phone (the next card peeks in to say there is more),
              a four-column grid from tablet up. */}
          <ul className="-mx-4 mt-3 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mt-5 md:mx-0 md:grid md:grid-cols-4 md:gap-x-4 md:gap-y-8 md:overflow-visible md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {section.products.map((product) => (
              <li key={product.id} className="w-[44vw] max-w-56 shrink-0 snap-start md:w-auto md:max-w-none">
                <ProductCard product={product} badge={section.badge} />
              </li>
            ))}
          </ul>
        </section>
        </Fragment>
      ))}

      {productSections.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-4 text-center">
          <Button size="lg" variant="outline" className="rounded-full px-8" render={<Link href="/products" />}>
            Browse the full collection
            <ArrowRightIcon />
          </Button>
        </div>
      )}

      {/* Renders nothing until the store has genuine feedback to show. */}
      <Testimonials className="mx-auto w-full max-w-7xl px-4" />

      {/* Size help and exchanges, said plainly. The exchange and returns lines
          restate the published Terms & Conditions (section 3, size exchange within
          2 days; section 4, no refund for change of mind). If those change,
          change this with them. */}
      <section className="mx-auto w-full max-w-7xl px-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <Ruler className="size-6 text-primary" aria-hidden="true" />
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
            <PackageCheck className="size-6 text-primary" aria-hidden="true" />
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
