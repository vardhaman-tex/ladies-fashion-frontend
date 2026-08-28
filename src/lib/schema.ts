/**
 * schema.org JSON-LD builders.
 *
 * Structured data is what lets Google render rich product results (price,
 * availability, breadcrumb trail) and what lets answer engines — ChatGPT
 * Search, Perplexity, Google AI Overviews, Gemini — recognise the brand as an
 * entity and quote facts about it. Everything here returns a plain object;
 * rendering happens in `components/seo/JsonLd.tsx`.
 *
 * Stable `@id` values (`{SITE_URL}/#organization`, `/#website`) let the graph
 * cross-reference nodes instead of repeating them on every page.
 */
import {
  CURRENCY,
  DEFAULT_OG_IMAGE,
  SITE_LONG_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  metaDescriptionFrom,
  stripHtml,
} from "@/lib/seo";
import type { Category } from "@/types/category";
import type { ProductDetail, ProductSummary } from "@/types/product";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * The brand entity. `sameAs` is the strongest signal AI engines use to link a
 * site to its social profiles and reconcile it as a single real organisation,
 * so the store's configured social links are threaded in here.
 */
export function organizationSchema(options: {
  logoUrl?: string | null;
  sameAs?: string[];
}) {
  const { logoUrl, sameAs = [] } = options;
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: "Vardhman Textiles",
    url: SITE_URL,
    description: SITE_LONG_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(logoUrl || DEFAULT_OG_IMAGE),
    },
    image: absoluteUrl(logoUrl || DEFAULT_OG_IMAGE),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    currenciesAccepted: CURRENCY,
    paymentAccepted: "Credit Card, Debit Card, UPI, Net Banking",
  };
}

/**
 * The site entity, including the SearchAction that makes Google's sitelinks
 * search box eligible and tells answer engines how to query the catalogue.
 */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_LONG_DESCRIPTION,
    inLanguage: "en-IN",
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface Crumb {
  name: string;
  /** App-relative path. Omit on the final (current page) crumb. */
  path?: string;
}

/**
 * BreadcrumbList — drives the breadcrumb trail Google shows in place of the
 * raw URL in search results, and gives answer engines the category hierarchy.
 */
export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(crumb.path ? { item: absoluteUrl(crumb.path) } : {}),
    })),
  };
}

/**
 * A full Product node with its Offer. `priceValidUntil` is required by Google
 * for merchant listings; it's set a year out and refreshed on every render.
 */
export function productSchema(product: ProductDetail) {
  const url = absoluteUrl(`/products/${product.slug}`);

  const images = Array.from(
    new Set(
      [
        product.ogImageUrl,
        product.thumbnail,
        ...product.variants.flatMap((variant) =>
          variant.images.map((image) => image.imageUrl)
        ),
      ].filter((value): value is string => Boolean(value))
    )
  ).slice(0, 8);

  const colors = product.variants
    .filter((variant) => variant.isActive)
    .map((variant) => variant.color)
    .filter(Boolean);

  const sizes = Array.from(
    new Set(
      product.variants.flatMap((variant) => variant.skus.map((sku) => sku.size))
    )
  ).filter(Boolean);

  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: metaDescriptionFrom(
      product.description ?? product.fabricDetails,
      `${product.name} from ${SITE_NAME}.`
    ),
    sku: product.sku,
    ...(images.length > 0 ? { image: images } : {}),
    url,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    ...(product.category?.name ? { category: product.category.name } : {}),
    ...(product.fabric ? { material: product.fabric } : {}),
    ...(colors.length > 0 ? { color: colors.join(", ") } : {}),
    ...(sizes.length > 0 ? { size: sizes } : {}),
    ...(product.careInstructions
      ? {
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Care instructions",
              value: stripHtml(product.careInstructions),
            },
          ],
        }
      : {}),
    offers: {
      "@type": "Offer",
      "@id": `${url}#offer`,
      url,
      priceCurrency: CURRENCY,
      price: product.finalPrice.toFixed(2),
      priceValidUntil,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORGANIZATION_ID },
    },
    // Only emitted when real ratings exist — fabricated aggregateRating is a
    // structured-data policy violation and can cost the whole rich result.
    ...(product.reviewCount > 0 && product.avgRating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.avgRating.toFixed(1),
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

/**
 * ItemList for a product listing page. This is what gives a crawler that does
 * not execute JavaScript — most AI crawlers — an enumerable view of what is on
 * the page, with names, prices and canonical URLs.
 */
export function itemListSchema(options: {
  products: ProductSummary[];
  name: string;
  path: string;
  startPosition?: number;
}) {
  const { products, name, path, startPosition = 1 } = options;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl(path),
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: startPosition + index,
      item: {
        "@type": "Product",
        name: product.name,
        url: absoluteUrl(`/products/${product.slug}`),
        ...(product.thumbnail ? { image: product.thumbnail } : {}),
        ...(product.fabric ? { material: product.fabric } : {}),
        brand: { "@type": "Brand", name: SITE_NAME },
        offers: {
          "@type": "Offer",
          priceCurrency: CURRENCY,
          price: product.finalPrice.toFixed(2),
          availability: product.inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
      },
    })),
  };
}

/** CollectionPage wrapper for category and listing routes. */
export function collectionPageSchema(options: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
  };
}

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * FAQPage — the highest-leverage AEO markup available. Each answer is written
 * to stand alone at 40-60 words so it can be lifted whole into a featured
 * snippet, a People Also Ask panel or a voice result.
 */
export function faqSchema(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}

/** Marks the store's policy pages as such for trust-signal extraction. */
export function webPageSchema(options: {
  name: string;
  description: string;
  path: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en-IN",
    ...(options.dateModified ? { dateModified: options.dateModified } : {}),
  };
}

/** Convenience: the category list rendered as a navigational ItemList. */
export function categoryListSchema(categories: Category[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${SITE_NAME} categories`,
    itemListElement: categories.map((category, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: category.name,
      url: absoluteUrl(`/products?categorySlug=${category.slug}`),
    })),
  };
}
