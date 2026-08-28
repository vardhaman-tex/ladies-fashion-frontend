import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, productSchema, type Crumb } from "@/lib/schema";
import { getProductServer } from "@/lib/server-api";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  metaDescriptionFrom,
  truncate,
} from "@/lib/seo";

/**
 * Product detail is the money page: it is what ranks for long-tail product
 * searches and what answer engines cite when asked for a specific item. It is
 * rendered on the server so the price, availability, description and Product
 * schema are all in the initial HTML.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductServer(slug);

  if (!product) {
    return {
      title: "Product not found",
      description: SITE_DESCRIPTION,
      robots: { index: false, follow: true },
    };
  }

  const canonical = `/products/${product.slug}`;

  // Admin-set metaTitle wins; otherwise build one that carries the product
  // name plus a purchase-intent qualifier rather than the bare name.
  const title =
    product.metaTitle ??
    truncate(
      product.category?.name
        ? `${product.name} — ${product.category.name}`
        : product.name,
      60
    );

  const description = metaDescriptionFrom(
    product.metaDescription ?? product.description ?? product.fabricDetails,
    `Buy ${product.name} at ${SITE_NAME}. ${
      product.fabric ? `${product.fabric} fabric. ` : ""
    }Free shipping and secure checkout across India.`
  );

  const image = product.ogImageUrl ?? product.thumbnail;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      // "website" is wrong for a product; og:type=product is what shopping
      // surfaces and social unfurlers look for.
      type: "website",
      siteName: SITE_NAME,
      ...(image
        ? {
            images: [
              { url: absoluteUrl(image), width: 1200, height: 1200, alt: product.name },
            ],
          }
        : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [absoluteUrl(image)] } : {}),
    },
    other: {
      // Consumed by Facebook/Pinterest product unfurls and some shopping
      // crawlers that read og product properties rather than JSON-LD.
      "product:price:amount": product.finalPrice.toFixed(2),
      "product:price:currency": "INR",
      "product:availability": product.inStock ? "in stock" : "out of stock",
      "product:condition": "new",
      "product:brand": SITE_NAME,
      ...(product.sku ? { "product:retailer_item_id": product.sku } : {}),
    },
    robots:
      product.status === "ACTIVE" || product.status === "OUT_OF_STOCK"
        ? { index: true, follow: true }
        : // Draft and deactivated products must never enter the index.
          { index: false, follow: false },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductServer(slug);

  // A missing product should be a real 404, not a soft 404 rendered with a
  // 200 status — soft 404s waste crawl budget and can suppress the whole
  // /products/ path in Search Console.
  if (!product) notFound();

  const crumbs: Crumb[] = [{ name: "Home", path: "/" }];
  if (product.category) {
    crumbs.push({
      name: product.category.name,
      path: `/products?categorySlug=${product.category.slug}`,
    });
  }
  if (product.subCategory && product.category) {
    crumbs.push({
      name: product.subCategory.name,
      path:
        `/products?categorySlug=${product.category.slug}` +
        `&subCategorySlug=${product.subCategory.slug}`,
    });
  }
  crumbs.push({ name: product.name });

  return (
    <>
      <JsonLd data={[productSchema(product), breadcrumbSchema(crumbs)]} />
      <ProductDetailClient initialProduct={product} />
    </>
  );
}
