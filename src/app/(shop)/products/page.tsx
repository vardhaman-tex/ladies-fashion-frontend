import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbSchema,
  collectionPageSchema,
  itemListSchema,
  type Crumb,
} from "@/lib/schema";
import { getCategoriesServer, getProductsServer } from "@/lib/server-api";
import { SITE_NAME, metaDescriptionFrom } from "@/lib/seo";
import type { Category, SubCategory } from "@/types/category";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Filters that *refine* a listing rather than define one.
 *
 * Every combination of these produces a near-duplicate of its parent category
 * page. Left indexable they generate thousands of thin, competing URLs — the
 * classic faceted-navigation index-bloat problem. Pages carrying any of them
 * are served `noindex, follow`: crawlers still walk through to the product
 * pages, but the facet URLs themselves stay out of the index.
 */
const REFINEMENT_PARAMS = [
  "color",
  "fabric",
  "occasion",
  "minPrice",
  "maxPrice",
  "inStock",
  "sort",
] as const;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Rebuilds the query string the browser will report, for the seed-data guard. */
function searchString(params: SearchParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((entry) => search.append(key, entry));
    else if (value !== undefined) search.set(key, value);
  }
  return search.toString();
}

interface Resolved {
  categorySlug?: string;
  subCategorySlug?: string;
  page: number;
  hasRefinement: boolean;
  category?: Category;
  subCategory?: SubCategory;
  title: string;
  canonical: string;
}

async function resolve(params: SearchParams): Promise<Resolved> {
  const categorySlug = first(params.categorySlug);
  const subCategorySlug = first(params.subCategorySlug);
  const pageParam = Number(first(params.page) ?? 0);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 0;

  const hasRefinement = REFINEMENT_PARAMS.some(
    (key) => first(params[key]) !== undefined
  );

  const categories = await getCategoriesServer();
  const category = categories?.find((entry) => entry.slug === categorySlug);
  const subCategory = category?.subCategories?.find(
    (entry) => entry.slug === subCategorySlug
  );

  const title = subCategory?.name ?? category?.name ?? "All Products";

  // The canonical deliberately drops refinement params and keeps the page
  // number: paginated pages should self-canonicalise, not all collapse onto
  // page 1, or Google never indexes anything past the first page.
  const canonicalParams = new URLSearchParams();
  if (category) canonicalParams.set("categorySlug", category.slug);
  if (subCategory) canonicalParams.set("subCategorySlug", subCategory.slug);
  if (page > 0) canonicalParams.set("page", String(page));
  const qs = canonicalParams.toString();

  return {
    categorySlug,
    subCategorySlug,
    page,
    hasRefinement,
    category,
    subCategory,
    title,
    canonical: qs ? `/products?${qs}` : "/products",
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const { title, canonical, hasRefinement, page, category, subCategory } =
    await resolve(params);

  const isRoot = !category && !subCategory;

  const heading = isRoot
    ? `Shop Women's Fashion Online — All Products`
    : `Buy ${title} Online for Women`;

  const pageSuffix = page > 0 ? ` — Page ${page + 1}` : "";

  const description = metaDescriptionFrom(
    subCategory?.description ?? category?.description,
    isRoot
      ? `Browse the full ${SITE_NAME} catalogue of ethnic and contemporary ladies fashion. Filter by category, colour, fabric, occasion and price, with free shipping and secure checkout.`
      : `Shop ${title.toLowerCase()} for women at ${SITE_NAME}. Filter by colour, fabric, occasion and price, with authentic fabrics, free shipping and secure checkout across India.`
  );

  return {
    title: `${heading}${pageSuffix}`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${heading} | ${SITE_NAME}`,
      description,
      url: canonical,
      type: "website",
    },
    ...(hasRefinement
      ? { robots: { index: false, follow: true } }
      : { robots: { index: true, follow: true } }),
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const resolved = await resolve(params);
  const categories = await getCategoriesServer();

  const products = await getProductsServer({
    categorySlug: resolved.categorySlug,
    subCategorySlug: resolved.subCategorySlug,
    color: first(params.color),
    fabric: first(params.fabric),
    occasion: first(params.occasion),
    minPrice: first(params.minPrice),
    maxPrice: first(params.maxPrice),
    inStock: first(params.inStock) === "true" ? true : undefined,
    sort: first(params.sort),
    page: resolved.page,
  });

  const crumbs: Crumb[] = [
    { name: "Home", path: "/" },
    {
      name: "Products",
      ...(resolved.category ? { path: "/products" } : {}),
    },
  ];
  if (resolved.category) {
    crumbs.push({
      name: resolved.category.name,
      ...(resolved.subCategory
        ? { path: `/products?categorySlug=${resolved.category.slug}` }
        : {}),
    });
  }
  if (resolved.subCategory) {
    crumbs.push({ name: resolved.subCategory.name });
  }

  const graph: object[] = [
    breadcrumbSchema(crumbs),
    collectionPageSchema({
      name: resolved.title,
      description: `${resolved.title} at ${SITE_NAME}.`,
      path: resolved.canonical,
    }),
  ];

  if (products?.content?.length) {
    graph.push(
      itemListSchema({
        products: products.content,
        name: resolved.title,
        path: resolved.canonical,
        startPosition: resolved.page * (products.size || products.content.length) + 1,
      })
    );
  }

  return (
    <>
      <JsonLd data={graph} />
      <ProductsClient
        initialProducts={products ?? undefined}
        initialCategories={categories ?? undefined}
        initialSearch={searchString(params)}
      />
    </>
  );
}
