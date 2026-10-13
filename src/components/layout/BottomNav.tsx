"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, ShoppingBag, User } from "lucide-react";

import { useCartItemCount } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

/**
 * The phone's main navigation: five places a shopper goes, one thumb away.
 *
 * Absent where something else owns the bottom edge: the product page has its
 * sticky buy bar, the cart and checkout have their own pay buttons. It is also
 * absent from md up, where the header nav takes over.
 */
export function BottomNav() {
  const pathname = usePathname() ?? "";
  const itemCount = useCartItemCount();
  const { itemCount: wishlistCount } = useWishlist();
  const { isAuthenticated } = useAuthStore();

  const hidden =
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    /^\/products\/[^/]+/.test(pathname);
  if (hidden) return null;

  const tabs = [
    { href: "/", label: "Home", icon: Home, count: 0, active: pathname === "/" },
    {
      href: "/products",
      label: "Shop",
      icon: LayoutGrid,
      count: 0,
      active: pathname === "/products" || pathname.startsWith("/search"),
    },
    { href: "/wishlist", label: "Wishlist", icon: Heart, count: wishlistCount, active: pathname.startsWith("/wishlist") },
    { href: "/cart", label: "Cart", icon: ShoppingBag, count: itemCount, active: false },
    {
      href: isAuthenticated ? "/account" : "/login",
      label: "Account",
      icon: User,
      count: 0,
      active: pathname.startsWith("/account") || pathname.startsWith("/orders") || pathname.startsWith("/login"),
    },
  ];

  return (
    <>
      {/* Keeps the footer's last line clear of the fixed bar. */}
      <div className="h-16 md:hidden" aria-hidden="true" />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {tabs.map(({ href, label, icon: Icon, count, active }) => (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={count > 0 ? `${label}, ${count}` : label}
            className={cn(
              "relative flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="relative">
              <Icon className="size-[22px]" aria-hidden="true" strokeWidth={active ? 2.2 : 1.8} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </span>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
