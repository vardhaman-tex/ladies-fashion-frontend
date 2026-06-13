"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/product/WishlistButton";
import { useWishlist } from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useCart";

export default function WishlistPage() {
  const { items, itemCount, isLoading } = useWishlist();
  const { mutate: addToCart, isPending: addingToCart } = useAddToCart();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-muted aspect-3/4" />
          ))}
        </div>
      </div>
    );
  }

  if (itemCount === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <Heart className="mx-auto size-16 text-muted-foreground/40" />
        <h1 className="mt-4 font-heading text-2xl font-bold">Your wishlist is empty</h1>
        <p className="mt-2 text-muted-foreground">Save items you love and come back to them later.</p>
        <Button className="mt-6" render={<Link href="/products" />}>
          Shop Now
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          My Wishlist
          <span className="ml-2 text-base font-normal text-muted-foreground">({itemCount} items)</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const hasDiscount = item.discountAmount > 0;

          return (
            <div key={item.productId} className="group flex flex-col gap-2">
              <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-muted">
                <Link href={`/products/${item.productSlug}`} className="absolute inset-0 block">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.productName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </Link>

                <WishlistButton
                  productId={item.productId}
                  productName={item.productName}
                  productSlug={item.productSlug}
                  thumbnail={item.thumbnail}
                  price={item.price}
                  discountAmount={item.discountAmount}
                  className="absolute top-2 right-2"
                />

                <Button
                  size="sm"
                  className="absolute inset-x-2 bottom-2 rounded-lg bg-white/90 text-xs font-semibold text-foreground shadow hover:bg-white opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                  onClick={() =>
                    addToCart({
                      productId: item.productId,
                      productName: item.productName,
                      productSlug: item.productSlug,
                      thumbnail: item.thumbnail,
                      price: item.price,
                      discountAmount: item.discountAmount,
                      quantity: 1,
                      size: null,
                      color: null,
                    })
                  }
                  disabled={addingToCart}
                >
                  <ShoppingBag className="size-3.5 mr-1" />
                  {addingToCart ? "Adding…" : "Add to Cart"}
                </Button>
              </div>

              <div className="flex flex-col gap-0.5">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="line-clamp-1 text-sm font-medium text-foreground hover:underline"
                >
                  {item.productName}
                </Link>
                <div className="flex items-center gap-2">
                  {hasDiscount ? (
                    <>
                      <span className="text-sm font-semibold text-foreground">₹{item.finalPrice.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground line-through">₹{item.price.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-foreground">₹{item.price.toFixed(2)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
