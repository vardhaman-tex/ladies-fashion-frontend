"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  Tag,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { logout as logoutApi } from "@/services/authService";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin",             label: "Dashboard",  icon: LayoutDashboard, exact: true },
  { href: "/admin/orders",      label: "Orders",     icon: ShoppingBag },
  { href: "/admin/products",    label: "Products",   icon: Package },
  { href: "/admin/categories",  label: "Categories", icon: Tag },
  { href: "/admin/inventory",   label: "Inventory",  icon: BarChart3 },
  { href: "/admin/users",       label: "Users",      icon: Users },
  { href: "/admin/policies",    label: "Policies",   icon: FileText },
  { href: "/admin/settings",    label: "Settings",   icon: Settings },
];

interface AdminSidebarProps {
  /** On mobile, the sidebar renders as a drawer; this controls open state */
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const { data: siteSettings } = useSiteSettings();
  const pathname = usePathname();
  const storeLogout = useAuthStore((s) => s.logout);
  const router = useRouter();

  async function handleLogout() {
    try { await logoutApi(); } catch { /* ignore */ }
    storeLogout();
    router.push("/login");
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/admin" onClick={onClose} className="flex items-center gap-2">
            {siteSettings?.logoUrl && (
              <img src={siteSettings.logoUrl} alt="" className="h-6 w-auto" />
            )}
            <span className="font-heading text-base font-bold text-foreground">
              Vardhman Textile
            </span>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-rose-600">
          Admin Panel
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="size-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
        <Link
          href="/"
          onClick={onClose}
          className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to store
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: always-visible fixed sidebar */}
      <aside className="hidden h-dvh w-56 shrink-0 flex-col border-r border-border bg-card lg:flex">
        {navContent}
      </aside>

      {/* Mobile: overlay drawer */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card lg:hidden">
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
