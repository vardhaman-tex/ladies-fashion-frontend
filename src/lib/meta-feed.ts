/**
 * Meta (Facebook/Instagram) product catalog feed.
 *
 * Emits an RSS 2.0 document in the `http://base.google.com/ns/1.0` namespace —
 * the format Meta Commerce Manager ingests as a "scheduled feed", and the same
 * one Google Merchant Center uses. Choosing the shared format means the feed can
 * later be pointed at Google Shopping without a rewrite.
 *
 * Everything in this module is pure: it maps a `ProductDetail` (exactly as the
 * existing /api/v1/products/{slug} endpoint returns it) to feed rows and renders
 * XML. No fetching, no framework, no I/O — which is what makes it testable.
 *
 * Granularity: one row per purchasable SKU (colour × size), with every row of a
 * product sharing an `item_group_id`. That is Meta's documented model for
 * apparel: the catalog shows a single product with colour and size options, and
 * per-size stock stays truthful. A product-level row would report a sold-out
 * size as in stock.
 */
import type { ProductDetail, ProductImage, ProductVariant, VariantSku } from "@/types/product";
import { CURRENCY, SITE_NAME, SITE_URL, absoluteUrl, stripHtml, truncate } from "@/lib/seo";

/** Meta caps additional images per item at 20. */
const MAX_ADDITIONAL_IMAGES = 20;

/** Meta's description limit is 9999 characters. */
const MAX_DESCRIPTION_LENGTH = 5000;

/**
 * Only these lifecycle states belong in a shopping catalog. DRAFT and INACTIVE
 * products are not purchasable, and listing them gets items rejected — or worse,
 * approved and then tagged in a Reel that leads to a dead page. This mirrors the
 * indexability rule already applied in the product page's robots metadata.
 */
const SYNDICATABLE_STATUSES = new Set(["ACTIVE", "OUT_OF_STOCK"]);

/**
 * Broad but accurate Google product taxonomy node for a womenswear store.
 * Overridable per deployment; an accurate category materially improves ad
 * delivery, and a wrong one is worse than a generic one.
 */
export const DEFAULT_GOOGLE_PRODUCT_CATEGORY =
  process.env.NEXT_PUBLIC_META_GOOGLE_PRODUCT_CATEGORY ??
  "Apparel & Accessories > Clothing";

export interface MetaFeedItem {
  id: string;
  itemGroupId: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  availability: "in stock" | "out of stock";
  condition: "new";
  /** Formatted as Meta expects, e.g. "1500.00 INR". */
  price: string;
  salePrice?: string;
  brand: string;
  productType?: string;
  googleProductCategory: string;
  color?: string;
  size?: string;
  material?: string;
  mpn?: string;
  quantityToSellOnFacebook?: number;
  customLabel0?: string;
}

export interface FeedBuildResult {
  items: MetaFeedItem[];
  /** Per-product reasons for exclusion, for logging and the /meta/feed-status route. */
  skipped: Array<{ slug: string; reason: string }>;
}

/* ─── Formatting helpers ──────────────────────────────────────────────────── */

/**
 * Meta requires "<amount> <ISO currency>" with a dot decimal separator and no
 * grouping. Locale-aware formatting would emit "1,500.00" and be rejected.
 */
export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} ${CURRENCY}`;
}

/**
 * Escapes the five XML predefined entities. Product names, colours and sizes are
 * admin-authored free text — a single unescaped "&" in "Gold & Maroon" makes the
 * whole document unparseable and Meta rejects the entire feed, not just the row.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Strips control characters that are illegal in XML 1.0 even when escaped.
 * Copy-pasted product descriptions routinely carry stray \x00-\x08 bytes.
 */
export function sanitizeText(value: string): string {
  // XML 1.0 forbids these code points outright — escaping does not rescue them.
  // Copy-pasted product copy routinely carries stray control bytes.
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

/** Builds a stable, URL-safe fragment from free text (a colour or size label). */
function slugFragment(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "na"
  );
}

/* ─── Mapping ─────────────────────────────────────────────────────────────── */

function pickVariantImages(variant: ProductVariant, product: ProductDetail): string[] {
  const ordered = [...(variant.images ?? [])].sort((a: ProductImage, b: ProductImage) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  const urls = ordered.map((image) => image.imageUrl).filter(Boolean);

  // A colour variant with no images of its own still needs an image_link —
  // Meta rejects any item without one — so fall back to the product thumbnail.
  if (urls.length === 0 && product.thumbnail) return [product.thumbnail];
  return urls;
}

function buildDescription(product: ProductDetail): string {
  const parts = [
    product.metaDescription,
    product.description,
    product.fabricDetails,
    product.careInstructions,
  ]
    .map((part) => stripHtml(part))
    .filter((part) => part.length > 0);

  const combined = parts.join(" ").trim();

  // Meta requires a non-empty description. Several products in this catalogue
  // have two-word descriptions, so a generated fallback keeps them syndicatable
  // rather than silently dropped.
  if (combined.length === 0) {
    const bits = [product.name, product.fabric, product.occasion].filter(Boolean);
    return `${bits.join(" · ")} from ${SITE_NAME}.`;
  }
  return truncate(combined, MAX_DESCRIPTION_LENGTH);
}

function productType(product: ProductDetail): string | undefined {
  const parts = [product.category?.name, product.subCategory?.name].filter(
    (part): part is string => Boolean(part && part.trim())
  );
  return parts.length > 0 ? parts.join(" > ") : undefined;
}

/**
 * Expands one product into its purchasable SKU rows.
 *
 * Throws nothing: a product that cannot be represented returns an empty array,
 * and the caller records why. One bad product must never cost the whole feed.
 */
export function buildItemsForProduct(product: ProductDetail): {
  items: MetaFeedItem[];
  reason?: string;
} {
  if (!product?.id || !product.slug || !product.name) {
    return { items: [], reason: "missing id, slug or name" };
  }
  if (!SYNDICATABLE_STATUSES.has(product.status)) {
    return { items: [], reason: `status ${product.status} is not syndicatable` };
  }
  if (!Number.isFinite(product.price) || product.price <= 0) {
    return { items: [], reason: "price is missing or not positive" };
  }

  const link = absoluteUrl(`/products/${product.slug}`);
  const description = sanitizeText(buildDescription(product));
  const type = productType(product);
  const hasDiscount =
    Number.isFinite(product.finalPrice) &&
    product.finalPrice > 0 &&
    product.finalPrice < product.price;

  const activeVariants = (product.variants ?? []).filter((variant) => variant.isActive);
  // Fall back to inactive variants only when there is no active one, mirroring
  // the product detail page, which does the same so a page is never blank.
  const variants =
    activeVariants.length > 0 ? activeVariants : (product.variants ?? []);

  const items: MetaFeedItem[] = [];

  for (const variant of variants) {
    const images = pickVariantImages(variant, product);
    if (images.length === 0) continue; // Meta rejects an item with no image.

    const base = {
      itemGroupId: product.id,
      title: sanitizeText(product.name),
      description,
      link,
      imageLink: images[0],
      additionalImageLinks: images.slice(1, MAX_ADDITIONAL_IMAGES + 1),
      condition: "new" as const,
      price: formatPrice(product.price),
      ...(hasDiscount ? { salePrice: formatPrice(product.finalPrice) } : {}),
      brand: SITE_NAME,
      ...(type ? { productType: type } : {}),
      googleProductCategory: DEFAULT_GOOGLE_PRODUCT_CATEGORY,
      ...(variant.color ? { color: sanitizeText(variant.color) } : {}),
      ...(product.fabric ? { material: sanitizeText(product.fabric) } : {}),
      ...(product.occasion ? { customLabel0: sanitizeText(product.occasion) } : {}),
    };

    const skus = variant.skus ?? [];

    if (skus.length === 0) {
      // One-size product: still a valid row, just without a size dimension.
      items.push({
        ...base,
        id: `${product.sku || product.id}-${slugFragment(variant.color ?? "default")}`,
        availability: variant.inStock ? "in stock" : "out of stock",
        ...(product.sku ? { mpn: product.sku } : {}),
      });
      continue;
    }

    for (const sku of skus) {
      items.push({
        ...base,
        // skuCode is the merchant's own identifier and the most stable id Meta
        // can key on across feed refreshes. The composite fallback is equally
        // stable, since it derives only from ids and the variant's own labels.
        id:
          sku.skuCode?.trim() ||
          `${product.id}-${slugFragment(variant.color ?? "default")}-${slugFragment(sku.size ?? "os")}`,
        availability: skuInStock(sku) ? "in stock" : "out of stock",
        ...(sku.size ? { size: sanitizeText(sku.size) } : {}),
        ...(sku.skuCode ? { mpn: sku.skuCode } : {}),
        ...(Number.isFinite(sku.availableQty)
          ? { quantityToSellOnFacebook: Math.max(0, sku.availableQty) }
          : {}),
      });
    }
  }

  if (items.length === 0) {
    return { items: [], reason: "no variant produced a usable item (no images or no variants)" };
  }
  return { items };
}

/**
 * Availability is computed from the actual quantity rather than trusting the
 * `inStock` flag alone: the two can disagree after a manual inventory edit, and
 * advertising a sold-out size is worse than under-reporting stock.
 */
function skuInStock(sku: VariantSku): boolean {
  if (Number.isFinite(sku.availableQty)) return sku.availableQty > 0;
  return Boolean(sku.inStock);
}

/** Maps a whole catalogue, isolating failures to the individual product. */
export function buildFeedItems(products: ProductDetail[]): FeedBuildResult {
  const items: MetaFeedItem[] = [];
  const skipped: FeedBuildResult["skipped"] = [];
  const seenIds = new Set<string>();

  for (const product of products) {
    try {
      const result = buildItemsForProduct(product);
      if (result.reason) {
        skipped.push({ slug: product?.slug ?? "(unknown)", reason: result.reason });
        continue;
      }
      for (const item of result.items) {
        // Meta rejects a feed containing duplicate ids. A duplicated skuCode in
        // the catalogue would otherwise poison the whole upload.
        if (seenIds.has(item.id)) {
          skipped.push({ slug: product.slug, reason: `duplicate item id ${item.id}` });
          continue;
        }
        seenIds.add(item.id);
        items.push(item);
      }
    } catch (error) {
      skipped.push({
        slug: product?.slug ?? "(unknown)",
        reason: error instanceof Error ? error.message : "unexpected mapping error",
      });
    }
  }

  return { items, skipped };
}

/* ─── XML rendering ───────────────────────────────────────────────────────── */

function tag(name: string, value: string | number | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  return `      <${name}>${escapeXml(String(value))}</${name}>\n`;
}

export function renderItemXml(item: MetaFeedItem): string {
  return (
    "    <item>\n" +
    tag("g:id", item.id) +
    tag("g:item_group_id", item.itemGroupId) +
    tag("title", item.title) +
    tag("description", item.description) +
    tag("link", item.link) +
    tag("g:image_link", item.imageLink) +
    item.additionalImageLinks.map((url) => tag("g:additional_image_link", url)).join("") +
    tag("g:availability", item.availability) +
    tag("g:condition", item.condition) +
    tag("g:price", item.price) +
    tag("g:sale_price", item.salePrice) +
    tag("g:brand", item.brand) +
    tag("g:product_type", item.productType) +
    tag("g:google_product_category", item.googleProductCategory) +
    tag("g:color", item.color) +
    tag("g:size", item.size) +
    tag("g:material", item.material) +
    tag("g:mpn", item.mpn) +
    tag("g:quantity_to_sell_on_facebook", item.quantityToSellOnFacebook) +
    tag("g:custom_label_0", item.customLabel0) +
    // These products carry no GTIN/EAN. Declaring that explicitly stops Meta
    // from holding items back while it waits for a global identifier.
    tag("g:identifier_exists", "no") +
    tag("g:age_group", "adult") +
    tag("g:gender", "female") +
    "    </item>\n"
  );
}

export function renderFeedXml(items: MetaFeedItem[]): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n' +
    "  <channel>\n" +
    `    <title>${escapeXml(SITE_NAME)} — Product Catalog</title>\n` +
    `    <link>${escapeXml(SITE_URL)}</link>\n` +
    `    <description>${escapeXml(
      `Product catalog feed for ${SITE_NAME}, for Meta Commerce Manager.`
    )}</description>\n` +
    items.map(renderItemXml).join("") +
    "  </channel>\n" +
    "</rss>\n"
  );
}
