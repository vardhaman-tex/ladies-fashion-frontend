"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGridSkeleton } from "@/components/common/LoadingSkeleton";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useCategories } from "@/hooks/useCategories";
import { useBestSellers, useNewArrivals, useTrending } from "@/hooks/useProducts";

export default function HomePage() {
  const { data: categories } = useCategories();
  const { data: newArrivals, isLoading: loadingNewArrivals } = useNewArrivals({ size: 8 });
  const { data: bestSellers, isLoading: loadingBestSellers } = useBestSellers({ size: 8 });
  const { data: trending, isLoading: loadingTrending } = useTrending({ size: 8 });

  return (
    <div className="flex flex-col gap-12 pb-12">
      <section className="bg-gradient-to-br from-primary/20 via-primary/5 to-background px-4 py-20 text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Elevate Your Everyday Style
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Discover the latest collections of ladies fashion — curated for comfort, style, and every occasion.
        </p>
        <Button size="lg" className="mt-6" render={<Link href="/products" />}>
          Shop Now
          <ArrowRightIcon />
        </Button>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <h2 className="font-heading text-2xl font-bold text-foreground">Shop by Category</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories?.map((category) => (
            <Link
              key={category.id}
              href={`/products?categorySlug=${category.slug}`}
              className="group flex flex-col gap-2"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    {category.name}
                  </div>
                )}
              </div>
              <span className="text-center text-sm font-medium text-foreground">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-foreground">New Arrivals</h2>
          <Link href="/products?sort=NEWEST" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="mt-4">
          {loadingNewArrivals ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <ProductGrid products={newArrivals?.content ?? []} />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-foreground">Best Sellers</h2>
          <Link href="/products?sort=BEST_SELLING" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="mt-4">
          {loadingBestSellers ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <ProductGrid products={bestSellers?.content ?? []} />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-foreground">Trending Now</h2>
          <Link href="/products?sort=AVG_RATING" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="mt-4">
          {loadingTrending ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <ProductGrid products={trending?.content ?? []} />
          )}
        </div>
      </section>
    </div>
  );
}
