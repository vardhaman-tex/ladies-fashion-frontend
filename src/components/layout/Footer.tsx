"use client";

import Link from "next/link";
import { useCategories } from "@/hooks/useCategories";

// Inline SVG icons for social platforms (not in lucide-react)
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { Icon: InstagramIcon, href: "https://instagram.com", label: "Instagram" },
  { Icon: FacebookIcon, href: "https://facebook.com", label: "Facebook" },
  { Icon: YoutubeIcon, href: "https://youtube.com", label: "YouTube" },
];

const HELP_LINKS = [
  { label: "My Orders", href: "/orders" },
  { label: "My Profile", href: "/account" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Saved Addresses", href: "/account/addresses" },
];

export function Footer() {
  const { data: categories } = useCategories();

  return (
    <footer className="border-t border-border bg-muted/30">
      {/* ── Mobile layout (< md) ── */}
      <div className="md:hidden">
        {/* Brand + tagline */}
        <div className="flex flex-col items-center gap-2 border-b border-border px-4 py-6">
          <Link href="/" className="font-heading text-xl font-bold tracking-tight text-foreground">
            Vardhman Textile
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            Curated styles for every occasion
          </p>

          {/* Social icons */}
          <div className="mt-2 flex items-center gap-5">
            {SOCIAL_LINKS.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-rose-400 hover:text-rose-600 transition-colors"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick links row */}
        <div className="grid grid-cols-2 gap-0 border-b border-border">
          <div className="border-r border-border px-4 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shop</p>
            <ul className="flex flex-col gap-1.5">
              {categories?.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?categorySlug=${cat.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/products" className="text-sm font-medium text-rose-600">
                  View all →
                </Link>
              </li>
            </ul>
          </div>

          <div className="px-4 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
            <ul className="flex flex-col gap-1.5">
              {HELP_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="px-4 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Vardhman Textile. All rights reserved.
        </div>
      </div>

      {/* ── Desktop layout (≥ md) ── */}
      <div className="mx-auto hidden max-w-7xl px-4 py-10 md:block">
        <div className="grid grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="font-heading text-lg font-bold text-foreground">
              Vardhman Textile
            </Link>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Curated styles for every occasion, delivered to your doorstep.
            </p>
            <div className="mt-4 flex gap-3">
              {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-rose-400 hover:text-rose-600 transition-colors"
                >
                  <Icon className="size-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
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
                <Link href="/products" className="text-sm font-medium text-rose-600 hover:text-rose-700">
                  View all →
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Account</h4>
            <ul className="mt-3 flex flex-col gap-2">
              {HELP_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <Link href="/policies/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/policies/terms-and-conditions" className="text-sm text-muted-foreground hover:text-foreground">Terms & Conditions</Link>
              </li>
              <li>
                <Link href="/policies/return-policy" className="text-sm text-muted-foreground hover:text-foreground">Return Policy</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="hidden border-t border-border py-4 text-center text-xs text-muted-foreground md:block">
        © {new Date().getFullYear()} Vardhman Textile. All rights reserved.
      </div>
    </footer>
  );
}
