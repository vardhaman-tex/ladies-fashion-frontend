export interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  title: string | null;
  body: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface ProductReviews {
  avgRating: number;
  reviewCount: number;
  /** Index 0 counts 1-star reviews, index 4 counts 5-star. */
  distribution: number[];
  reviews: Review[];
}

export interface ReviewableItem {
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string | null;
  alreadyReviewed: boolean;
}

export interface SubmitReviewPayload {
  orderNumber: string;
  phone: string;
  productId: string;
  rating: number;
  title?: string;
  body?: string;
}
