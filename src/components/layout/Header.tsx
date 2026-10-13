"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, Heart, User, ShoppingBag, Home, Package, X,
  Tag, ChevronRight, LogIn, MapPin,
} from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
import { CartButton } from "@/components/cart/CartButton";
import { useWishlist } from "@/hooks/useWishlist";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCategories } from "@/hooks/useCategories";
import { categoryPath, usableSubCategories } from "@/lib/categories";
import { useAuthStore } from "@/stores/authStore";

export function Header() {
  const { data: categories } = useCategories();
  const { data: siteSettings } = useSiteSettings();
  const { itemCount: wishlistCount } = useWishlist();
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  // Hide search on product detail pages (/products/[slug])
  const isProductDetail =
    pathname?.startsWith("/products/") &&
    pathname.split("/").length === 3;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
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
                <SheetTitle className="flex items-center gap-2 font-heading text-lg font-bold">
                  {siteSettings?.logoUrl && (
                    <img src={siteSettings.logoUrl} alt="" className="h-6 w-auto" />
                  )}
                  Vardhman Textile
                </SheetTitle>
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
                  <Home className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
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
                  <ShoppingBag className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
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
                  <Tag className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
                  <span className="flex-1">Sale</span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                    SALE
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
                    <div key={category.id}>
                      <SheetClose
                        render={
                          <Link
                            href={categoryPath(category.slug)}
                            className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                          />
                        }
                      >
                        {category.name}
                        <ChevronRight className="size-3.5 text-muted-foreground" />
                      </SheetClose>
                      {/* Sub-categories inline rather than behind another tap.
                          There are at most five per category, and a shopper who
                          came for an Anarkali should not have to load Suits and
                          then filter to find out we sell them. */}
                      {usableSubCategories(category).map((sub) => (
                        <SheetClose
                          key={sub.id}
                          render={
                            <Link
                              href={categoryPath(category.slug, sub.slug)}
                              className="block py-2 pl-8 pr-4 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            />
                          }
                        >
                          {sub.name}
                        </SheetClose>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom section — auth-conditional */}
            <div className="border-t pb-8 pt-2">
              {isAuthenticated ? (
                <>
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
                    <Heart className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
                    Wishlist
                    {wishlistCount > 0 && (
                      <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
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
                    <Package className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
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
                    <User className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
                    Account
                  </SheetClose>
                  <SheetClose
                    render={
                      <Link
                        href="/track-order"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                      />
                    }
                  >
                    <MapPin className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
                    Track Order
                  </SheetClose>
                </>
              ) : (
                <>
                  <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Account
                  </p>
                  <SheetClose
                    render={
                      <Link
                        href="/login"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                      />
                    }
                  >
                    <LogIn className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
                    Login
                  </SheetClose>
                  <SheetClose
                    render={
                      <Link
                        href="/track-order"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60"
                      />
                    }
                  >
                    <MapPin className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
                    Track Order
                  </SheetClose>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {siteSettings?.logoUrl && (
            <img src={siteSettings.logoUrl} alt="" className="h-8 w-auto" />
          )}
          Vardhman Textile
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {categories?.map((category) => {
            const subs = usableSubCategories(category);
            return (
              <div key={category.id} className="group relative">
                {/* The category itself stays a plain link. A menu primitive
                    would capture the click, and "Suits" is a destination in its
                    own right, not just a container for the list below. */}
                <Link
                  href={categoryPath(category.slug)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {category.name}
                </Link>
                {subs.length > 0 && (
                  // `pt-3` is the hover bridge: without padding between the
                  // link and the panel, moving the mouse down crosses a gap
                  // where nothing is hovered and the panel closes underneath
                  // the cursor. `focus-within` opens it for keyboard users,
                  // which is why this is invisible/opacity rather than hidden.
                  <div className="invisible absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 pt-3 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <div className="rounded-lg border bg-popover p-1 shadow-md">
                      {subs.map((sub) => (
                        <Link
                          key={sub.id}
                          href={categoryPath(category.slug, sub.slug)}
                          className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {!isProductDetail && (
          <div className="ml-auto hidden w-full max-w-xs md:block lg:max-w-sm">
            <SearchBar />
          </div>
        )}

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
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
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
          <CartButton />
        </div>
      </div>

      {/* Search is always on show: on a phone it is the main way in, so it gets
          its own row instead of hiding behind an icon. The product page keeps the
          header slim because the buy bar is what matters there. */}
      {!isProductDetail && (
        <div className="px-4 pb-3 md:hidden">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
