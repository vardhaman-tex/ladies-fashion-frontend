"use client";

import Link from "next/link";
import { useCategories } from "@/hooks/useCategories";

export function Footer() {
  const { data: categories } = useCategories();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground">Ladies Fashion</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Curated styles for every occasion, delivered to your doorstep.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Shop</h4>
          <ul className="mt-3 flex flex-col gap-2">
            {categories?.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/products?categorySlug=${category.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Help</h4>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">
                My Account
              </Link>
            </li>
            <li>
              <Link href="/cart" className="text-sm text-muted-foreground hover:text-foreground">
                Cart
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="text-sm text-muted-foreground hover:text-foreground">
                Wishlist
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Company</h4>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Home
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Ladies Fashion. All rights reserved.
      </div>
    </footer>
  );
}
