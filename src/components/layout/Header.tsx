"use client";

import Link from "next/link";
import { Menu, Heart, User, ShoppingBag, Home, Package, X } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useWishlist } from "@/hooks/useWishlist";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCategories } from "@/hooks/useCategories";

export function Header() {
  const { data: categories } = useCategories();
  const { itemCount: wishlistCount } = useWishlist();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="shrink-0 md:hidden" aria-label="Menu" />}>
            <Menu className="size-5" />
          </SheetTrigger>

          <SheetContent side="left" className="flex w-72 flex-col p-0" showCloseButton={false}>
            <SheetHeader className="border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <SheetTitle className="font-heading text-lg font-bold">Ladies Fashion</SheetTitle>
                <SheetClose render={<Button variant="ghost" size="icon" className="-mr-1" aria-label="Close menu" />}>
                  <X className="size-4" />
                </SheetClose>
              </div>
            </SheetHeader>

            {/* Scrollable area: top links + categories */}
            <div className="flex-1 overflow-y-auto">
              <div className="border-b pb-2 pt-3">
                <SheetClose
                  render={
                    <Link
                      href="/"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                    />
                  }
                >
                  <Home className="size-4 text-muted-foreground" />
                  Home
                </SheetClose>
                <SheetClose
                  render={
                    <Link
                      href="/products"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                    />
                  }
                >
                  <ShoppingBag className="size-4 text-muted-foreground" />
                  All Products
                </SheetClose>
              </div>

              {categories && categories.length > 0 && (
                <div className="py-3">
                  <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Categories
                  </p>
                  {categories.map((category) => (
                    <SheetClose
                      key={category.id}
                      render={
                        <Link
                          href={`/products?categorySlug=${category.slug}`}
                          className="block px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                        />
                      }
                    >
                      {category.name}
                    </SheetClose>
                  ))}
                </div>
              )}
            </div>

            {/* Account links — always pinned at bottom */}
            <div className="border-t pb-8 pt-2">
              <SheetClose
                render={
                  <Link
                    href="/wishlist"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                  />
                }
              >
                <Heart className="size-4 text-muted-foreground" />
                Wishlist
                {wishlistCount > 0 && (
                  <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                    {wishlistCount}
                  </span>
                )}
              </SheetClose>
              <SheetClose
                render={
                  <Link
                    href="/orders"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                  />
                }
              >
                <Package className="size-4 text-muted-foreground" />
                My Orders
              </SheetClose>
              <SheetClose
                render={
                  <Link
                    href="/account"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                  />
                }
              >
                <User className="size-4 text-muted-foreground" />
                Account
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Ladies Fashion
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {categories?.map((category) => (
            <Link
              key={category.id}
              href={`/products?categorySlug=${category.slug}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        {/* Desktop search */}
        <div className="ml-auto hidden flex-1 justify-end md:flex md:max-w-md">
          <SearchBar />
        </div>

        {/* Action icons */}
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            render={<Link href="/wishlist" aria-label="Wishlist" />}
          >
            <Heart className="size-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-semibold text-white">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            render={<Link href="/account" aria-label="Account" />}
          >
            <User className="size-5" />
          </Button>
          <CartDrawer />
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="border-t border-border px-4 py-2 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
