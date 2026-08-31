/**
 * Central SEO configuration.
 *
 * Every canonical URL, sitemap entry, Open Graph tag and JSON-LD `@id` in the
 * app is derived from `SITE_URL`, so the production domain is configured in
 * exactly one place. Set `NEXT_PUBLIC_SITE_URL` in the deployment environment
 * (no trailing slash); the literal below is only a fallback for local builds.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.vardhmantextile.com"
).replace(/\/+$/, "");

export const SITE_NAME = "Vardhman Textile";

export const SITE_TAGLINE = "Premium Ladies Fashion";

/**
 * Default meta description. Kept inside the 150-160 character window search
 * engines render without truncation, and leads with what the store sells
 * rather than with the brand name.
 */
export const SITE_DESCRIPTION =
  "Shop ethnic and contemporary ladies fashion at Vardhman Textile — sarees, kurtis, lehengas and festive wear in authentic fabrics. Free shipping and secure checkout.";

/**
 * Longer-form description used for JSON-LD and AI answer engines, which are
 * not constrained by SERP snippet length.
 */
export const SITE_LONG_DESCRIPTION =
  "Vardhman Textile is an online ladies fashion store offering ethnic and contemporary womenswear — sarees, kurtis, lehengas, suit sets and festive occasion wear — in authentic fabrics, with free shipping, a curated seasonal collection and secure encrypted checkout.";

export const SITE_LOCALE = "en_IN";

export const SITE_LANG = "en-IN";

export const DEFAULT_OG_IMAGE = "/og-default.png";

/**
 * Meta (Facebook) domain-verification token for vardhmantextile.com.
 *
 * Rendered as <meta name="facebook-domain-verification"> on every page. Meta
 * requires the domain to be verified before it will approve Instagram product
 * tagging, and it re-checks periodically — so this tag has to stay on the site,
 * not be removed once verification passes.
 *
 * Not a secret: it is public in the page source by design, and is only
 * meaningful for this one domain. Overridable per environment all the same.
 */
export const FACEBOOK_DOMAIN_VERIFICATION =
  process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION ??
  "sy7oo5q5xj8k4g6nfw9to5oj2qq5zi";

export const CURRENCY = "INR";

export const COUNTRY = "IN";

/**
 * Turns an app-relative path into a fully-qualified URL. Absolute URLs are
 * returned untouched, so this is safe to call on values coming back from the
 * API (Cloudinary image URLs, for example).
 */
export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Strips HTML tags and collapses whitespace. Product descriptions and policy
 * bodies are admin-authored rich text; meta descriptions must be plain text.
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Truncates on a word boundary so meta descriptions don't end mid-word.
 */
export function truncate(input: string, max = 160): string {
  const text = input.trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Builds a meta description from a product/category description, falling back
 * to the site default when the source text is empty or too thin to be useful.
 */
export function metaDescriptionFrom(
  source: string | null | undefined,
  fallback: string = SITE_DESCRIPTION
): string {
  const text = stripHtml(source);
  return text.length >= 50 ? truncate(text, 158) : fallback;
}
