"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, Banknote, MessageCircle, Ruler, ShieldCheck, Truck, PackageCheck } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
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

  const heroImage =
    [...(featured?.content ?? []), ...(newArrivals?.content ?? [])].find((p) => p.thumbnail)?.thumbnail ?? null;

  return (
    <div className="flex flex-col gap-8 pb-8 sm:gap-12 sm:pb-12 lg:gap-16">
      {/* Hero: a solid text panel beside the photo, so the words never depend on
          what the picture happens to look like. Stacks on a phone with the
          words first, the way a shopper reads it. */}
      <section className="mx-auto w-full max-w-7xl md:px-4 md:pt-4">
        <div className="grid overflow-hidden bg-accent md:grid-cols-2 md:rounded-3xl">
          <div className="flex flex-col justify-center gap-3 px-5 py-8 sm:px-8 md:py-14 lg:px-14">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">New season collection</p>
            <h1 className="font-heading text-3xl leading-[1.12] font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Celebrate every occasion in style
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Ethnic and contemporary fashion for every festival, function and everyday moment. Easy size exchange within 2 days.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button size="lg" className="rounded-full px-7" render={<Link href="/products" />}>
                Shop now
                <ArrowRightIcon />
              </Button>
              <Button size="lg" variant="ghost" className="hidden rounded-full text-primary md:inline-flex" render={<Link href="/products?discountAmount=1" />}>
                See the sale
              </Button>
            </div>
          </div>
          <div className="relative aspect-4/3 bg-muted md:aspect-auto md:min-h-[26rem]">
            {heroImage && (
              <Image
                src={heroImage}
                alt="A look from our new collection"
                fill
                priority
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
          </div>
        </div>
      </section>

      {/* Trust: the questions a first-time buyer has, answered before the first
          product rather than after the last one. */}
      <section className="mx-auto w-full max-w-7xl px-4" aria-label="Why shop with us">
        <ul className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
          {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
            <li key={label} className="flex items-center gap-3">
              <Icon className="size-6 shrink-0 text-primary" aria-hidden="true" strokeWidth={1.6} />
              <div className="min-w-0">
                <p className="text-sm leading-tight font-semibold text-foreground">{label}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Categories. A round rail on phones, where it has to be one swipe from
          the top; image tiles from tablet up. It used to be hidden on phones,
          which left no way to browse by category from the home page. */}
      {categories && categories.length > 0 && (
        <section id="categories" className="scroll-mt-24" aria-label="Shop by category">
          <div className="mx-auto w-full max-w-7xl px-4 md:hidden">
            <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      {/* A product shows once on the page, in the first rail that has it. */}
      {productSections.map((section) => (
        <section key={section.key} className="mx-auto w-full max-w-7xl px-4">
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
          <ul className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mt-5 md:mx-0 md:grid md:grid-cols-4 md:gap-x-4 md:gap-y-8 md:overflow-visible md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {section.products.map((product) => (
              <li key={product.id} className="w-[44vw] max-w-56 shrink-0 snap-start md:w-auto md:max-w-none">
                <ProductCard product={product} badge={section.badge} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {productSections.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-4 text-center">
          <Button size="lg" variant="outline" className="rounded-full px-8" render={<Link href="/products" />}>
            Browse the full collection
            <ArrowRightIcon />
          </Button>
        </div>
      )}

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
