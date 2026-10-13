import type { Category, SubCategory } from "@/types/category";

/**
 * Lifecycle status of a product.
 */
export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";

/**
 * Image associated with a product variant (color).
 */
export interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

/**
 * One size's stock row within a color variant.
 */
export interface VariantSku {
  id: string;
  size: string;
  skuCode: string | null;
  availableQty: number;
  reservedQty: number;
  soldQty: number;
  lowStockThreshold: number;
  inStock: boolean;
}

/**
 * One color of a product, with its own images and per-size stock.
 */
export interface ProductVariant {
  id: string;
  color: string;
  colorHex: string | null;
  sortOrder: number;
  isActive: boolean;
  inStock: boolean;
  images: ProductImage[];
  skus: VariantSku[];
}

/**
 * Lightweight color swatch shown on listing cards.
 */
export interface ColorSwatch {
  color: string;
  colorHex: string | null;
}

/**
 * Summary representation of a product, used in listings and grids.
 */
export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  discountAmount: number;
  discountPercent: number;
  finalPrice: number;
  avgRating: number;
  reviewCount: number;
  thumbnail: string | null;
  fabric: string | null;
  colors: ColorSwatch[];
  hasSizes: boolean;
  inStock: boolean;
  isFeatured: boolean;
  status: ProductStatus;
}

/**
 * Full product details, including color variants, category info, and recommendations.
 */
export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  discountAmount: number;
  discountPercent: number;
  finalPrice: number;
  avgRating: number;
  reviewCount: number;
  thumbnail: string | null;
  fabric: string | null;
  occasion: string | null;
  inStock: boolean;
  isFeatured: boolean;
  status: ProductStatus;
  description: string | null;
  fabricDetails: string | null;
  careInstructions: string | null;
  variants: ProductVariant[];
  category: Category | null;
  subCategory: SubCategory | null;
  similarProducts: ProductSummary[];
  recommendedProducts: ProductSummary[];
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
}

/**
 * Sort options for product listings.
 */
export type ProductSort = "NEWEST" | "PRICE_ASC" | "PRICE_DESC" | "AVG_RATING" | "BEST_SELLING";

/**
 * Filter criteria used when browsing or searching products.
 */
export interface ProductFilter {
  categorySlug?: string;
  subCategorySlug?: string;
  color?: string;
  fabric?: string;
  occasion?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
  size?: number;
}
