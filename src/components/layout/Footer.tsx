"use client";

import Link from "next/link";
import { useCategories } from "@/hooks/useCategories";

export function Footer() {
  const { data: categories } = useCategories();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="font-heading text-lg font-bold text-foreground">Ladies Fashion</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Curated styles for every occasion, delivered to your doorstep.
            </p>
          </div>

          {/* Shop — categories */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Shop</h4>
            <ul className="mt-3 flex flex-col gap-2">
              {categories?.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/products?categorySlug=${category.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" className="text-sm text-rose-600 hover:text-rose-700 font-medium">
                  View all →
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Account</h4>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-sm text-muted-foreground hover:text-foreground">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-sm text-muted-foreground hover:text-foreground">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-sm text-muted-foreground hover:text-foreground">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Help</h4>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <Link href="/account/addresses" className="text-sm text-muted-foreground hover:text-foreground">
                  Saved Addresses
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                  Home
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Ladies Fashion. All rights reserved.
      </div>
    </footer>
  );
}
