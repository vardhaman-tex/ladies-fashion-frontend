"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu, Heart, User, ShoppingBag, Home, Package, X,
  Tag, ChevronRight, Search,
} from "lucide-react";
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
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  // Hide search on product detail pages (/products/[slug])
  const isProductDetail =
    pathname?.startsWith("/products/") &&
    pathname.split("/").length === 3;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="shrink-0 md:hidden" aria-label="Menu" />}>
            <Menu className="size-5" />
          </SheetTrigger>

          <SheetContent side="left" className="flex w-72 flex-col p-0" showCloseButton={false}>
            {/* Sidebar header */}
            <SheetHeader className="border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <SheetTitle className="font-heading text-lg font-bold">Vardhman Textile</SheetTitle>
                <SheetClose render={<Button variant="ghost" size="icon" className="-mr-1" aria-label="Close menu" />}>
                  <X className="size-4" />
                </SheetClose>
              </div>
            </SheetHeader>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Top nav */}
              <div className="py-2">
                <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Navigate
                </p>
                <SheetClose
                  render={
                    <Link
                      href="/"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                    />
                  }
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30">
                    <Home className="size-4" />
                  </div>
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
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/30">
                    <ShoppingBag className="size-4" />
                  </div>
                  All Products
                </SheetClose>
                <SheetClose
                  render={
                    <Link
                      href="/products?discountAmount=1"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                    />
                  }
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30">
                    <Tag className="size-4" />
                  </div>
                  <span className="flex-1">Sale</span>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                    HOT
                  </span>
                </SheetClose>
              </div>

              {/* Categories */}
              {categories && categories.length > 0 && (
                <div className="border-t py-2">
                  <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Categories
                  </p>
                  {categories.map((category) => (
                    <SheetClose
                      key={category.id}
                      render={
                        <Link
                          href={`/products?categorySlug=${category.slug}`}
                          className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                        />
                      }
                    >
                      {category.name}
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </SheetClose>
                  ))}
                </div>
              )}
            </div>

            {/* Account — pinned at bottom */}
            <div className="border-t pb-8 pt-2">
              <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                My Account
              </p>
              <SheetClose
                render={
                  <Link
                    href="/wishlist"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                  />
                }
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950/30">
                  <Heart className="size-4" />
                </div>
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
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30">
                  <Package className="size-4" />
                </div>
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
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950/30">
                  <User className="size-4" />
                </div>
                Account
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          Vardhman Textile
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

        {/* Action icons */}
        <div className="ml-auto flex items-center gap-1">
          {/* Search toggle — hidden on PDP */}
          {!isProductDetail && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={searchOpen ? "Close search" : "Search"}
              onClick={() => setSearchOpen((v) => !v)}
            >
              {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
            </Button>
          )}
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

      {/* Expandable search bar — shown when toggled, hidden on PDP */}
      {!isProductDetail && searchOpen && (
        <div className="border-t border-border px-4 py-2">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
