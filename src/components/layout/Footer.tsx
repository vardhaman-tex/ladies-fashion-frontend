"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCategories } from "@/hooks/useCategories";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuthStore } from "@/stores/authStore";
import { getSocialLinks, type SocialLink } from "@/services/socialLinkService";

const AUTH_LINKS = [
  { label: "Track Order", href: "/track-order" },
  { label: "My Orders", href: "/orders" },
  { label: "My Profile", href: "/account" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Saved Addresses", href: "/account/addresses" },
];

const GUEST_LINKS = [
  { label: "Track Order", href: "/track-order" },
];

// Inline SVG icons keyed by platform name
function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform.toLowerCase()) {
    case "instagram":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "facebook":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
          <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
        </svg>
      );
    case "twitter":
    case "x":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "pinterest":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
        </svg>
      );
  }
}

function SocialIconBar({ links, size }: { links: SocialLink[]; size: "sm" | "md" }) {
  if (links.length === 0) return null;
  const dim = size === "md" ? "size-9" : "size-8";
  const icon = size === "md" ? "size-4" : "size-3.5";
  return (
    <div className={`flex items-center gap-${size === "md" ? "5" : "3"}`}>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className={`flex ${dim} items-center justify-center rounded-full border border-border text-muted-foreground hover:border-rose-400 hover:text-rose-600 transition-colors`}
        >
          <SocialIcon platform={link.platform} className={icon} />
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  const { data: categories } = useCategories();
  const { data: siteSettings } = useSiteSettings();
  const { isAuthenticated } = useAuthStore();
  const accountLinks = isAuthenticated ? AUTH_LINKS : GUEST_LINKS;
  const { data: socialLinks = [] } = useQuery({
    queryKey: ["social-links"],
    queryFn: getSocialLinks,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <footer className="border-t border-border bg-muted/30">
      {/* ── Mobile layout (< md) ── */}
      <div className="md:hidden">
        <div className="flex flex-col items-center gap-2 border-b border-border px-4 py-6">
          <Link href="/" className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight text-foreground">
            {siteSettings?.logoUrl && (
              <img src={siteSettings.logoUrl} alt="" className="h-7 w-auto" />
            )}
            Vardhman Textile
          </Link>
          <p className="text-center text-xs text-muted-foreground">Curated styles for every occasion</p>
          <div className="mt-2">
            <SocialIconBar links={socialLinks} size="md" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 border-b border-border">
          <div className="border-r border-border px-4 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shop</p>
            <ul className="flex flex-col gap-1.5">
              {categories?.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/products?categorySlug=${cat.slug}`} className="text-sm text-muted-foreground hover:text-foreground">
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li><Link href="/products" className="text-sm font-medium text-rose-600">View all →</Link></li>
            </ul>
          </div>
          <div className="px-4 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
            <ul className="flex flex-col gap-1.5">
              {accountLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-b border-border px-4 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</p>
          <ul className="flex flex-col gap-1.5">
            <li><Link href="/policies/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
            <li><Link href="/policies/terms-and-conditions" className="text-sm text-muted-foreground hover:text-foreground">Terms &amp; Conditions</Link></li>
            <li><Link href="/policies/return-policy" className="text-sm text-muted-foreground hover:text-foreground">Return Policy</Link></li>
          </ul>
        </div>

        <div className="px-4 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Vardhman Textile. All rights reserved.
        </div>
      </div>

      {/* ── Desktop layout (≥ md) ── */}
      <div className="mx-auto hidden max-w-7xl px-4 py-10 md:block">
        <div className="grid grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
              {siteSettings?.logoUrl && (
                <img src={siteSettings.logoUrl} alt="" className="h-7 w-auto" />
              )}
              Vardhman Textile
            </Link>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Curated styles for every occasion, delivered to your doorstep.
            </p>
            <div className="mt-4">
              <SocialIconBar links={socialLinks} size="sm" />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Shop</h4>
            <ul className="mt-3 flex flex-col gap-2">
              {categories?.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link href={`/products?categorySlug=${category.slug}`} className="text-sm text-muted-foreground hover:text-foreground">
                    {category.name}
                  </Link>
                </li>
              ))}
              <li><Link href="/products" className="text-sm font-medium text-rose-600 hover:text-rose-700">View all →</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Account</h4>
            <ul className="mt-3 flex flex-col gap-2">
              {accountLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <ul className="mt-3 flex flex-col gap-2">
              <li><Link href="/policies/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/policies/terms-and-conditions" className="text-sm text-muted-foreground hover:text-foreground">Terms & Conditions</Link></li>
              <li><Link href="/policies/return-policy" className="text-sm text-muted-foreground hover:text-foreground">Return Policy</Link></li>
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
