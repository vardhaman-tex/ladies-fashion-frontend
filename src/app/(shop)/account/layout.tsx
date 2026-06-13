"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { User, MapPin, ShoppingBag, Heart, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { logout } from "@/services/authService";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account", icon: User, label: "My Profile", exact: true },
  { href: "/account/addresses", icon: MapPin, label: "Addresses", exact: false },
  { href: "/orders", icon: ShoppingBag, label: "Orders", exact: false },
  { href: "/wishlist", icon: Heart, label: "Wishlist", exact: false },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, clearUser } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="flex gap-8">
          <div className="hidden lg:block w-56 shrink-0 space-y-2">
            <div className="h-20 rounded-xl bg-muted shimmer-base" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-muted shimmer-base" />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            <div className="h-32 rounded-xl bg-muted shimmer-base" />
            <div className="h-48 rounded-xl bg-muted shimmer-base" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    clearUser();
    router.push("/");
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:gap-1">
          {/* User card */}
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Nav links */}
          {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-rose-600 text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            );
          })}

          {/* Logout */}
          <button
            className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="size-4 shrink-0" />
            Log Out
          </button>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
