import type { Category, SubCategory } from "@/types/category";

/**
 * Lifecycle status of a product.
 */
export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";

/**
 * Image associated with a product.
 */
export interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface SizeInventoryEntry {
  size: string;
  availableQty: number;
}

/**
 * Stock information for a product.
 */
export interface Inventory {
  productId: string;
  productName?: string;
  productSku?: string;
  productThumbnail?: string | null;
  availableQty: number;
  reservedQty: number;
  soldQty: number;
  lowStockThreshold: number;
  inStock: boolean;
  sizeInventories: SizeInventoryEntry[];
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
  color: string | null;
  fabric: string | null;
  sizes: string | null;
  inStock: boolean;
  isFeatured: boolean;
  status: ProductStatus;
}

/**
 * Full product details, including images, category info, and recommendations.
 */
export interface ProductDetail extends ProductSummary {
  description: string | null;
  fabricDetails: string | null;
  careInstructions: string | null;
  sizes: string | null;
  images: ProductImage[];
  category: Category | null;
  subCategory: SubCategory | null;
  inventory: Inventory | null;
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
