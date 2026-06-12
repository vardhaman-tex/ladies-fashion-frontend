/**
 * A sub-category belonging to a parent category.
 */
export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

/**
 * A top-level product category, optionally with its sub-categories.
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  subCategories: SubCategory[];
}
