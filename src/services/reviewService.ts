import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  ProductReviews,
  Review,
  ReviewableItem,
  SubmitReviewPayload,
} from "@/types/review";

export async function getProductReviews(slug: string): Promise<ProductReviews> {
  const { data } = await api.get<ApiResponse<ProductReviews>>(
    `/api/v1/products/${encodeURIComponent(slug)}/reviews`
  );
  return data.data;
}

/** What the order lets this customer review. 404 when the order isn't delivered or the phone doesn't match. */
export async function getReviewableItems(
  orderNumber: string,
  phone: string
): Promise<ReviewableItem[]> {
  const { data } = await api.get<ApiResponse<ReviewableItem[]>>("/api/v1/reviews/eligible", {
    params: { orderNumber, phone },
  });
  return data.data;
}

export async function submitReview(payload: SubmitReviewPayload): Promise<Review> {
  const { data } = await api.post<ApiResponse<Review>>("/api/v1/reviews", payload);
  return data.data;
}
