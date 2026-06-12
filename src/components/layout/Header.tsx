"use client";

import Link from "next/link";
import { Menu, ShoppingBag, Heart, User } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
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

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Ladies Fashion</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-3 px-4 pb-4">
              {categories?.map((category) => (
                <SheetClose
                  key={category.id}
                  render={
                    <Link
                      href={`/products?categorySlug=${category.slug}`}
                      className="text-sm font-medium text-foreground hover:text-primary"
                    />
                  }
                >
                  {category.name}
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="font-heading text-xl font-bold tracking-tight text-foreground">
          Ladies Fashion
        </Link>

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

        <div className="ml-auto hidden flex-1 justify-end md:flex md:max-w-md">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button variant="ghost" size="icon" render={<Link href="/wishlist" aria-label="Wishlist" />}>
            <Heart className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" render={<Link href="/account" aria-label="Account" />}>
            <User className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" render={<Link href="/cart" aria-label="Cart" />}>
            <ShoppingBag className="size-5" />
          </Button>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
