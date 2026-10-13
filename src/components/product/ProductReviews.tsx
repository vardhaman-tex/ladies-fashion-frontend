"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { StarRating } from "@/components/product/StarRating";
import { Button } from "@/components/ui/button";
import { getProductReviews } from "@/services/reviewService";

/**
 * What buyers said, and nothing else.
 *
 * Every review shown here is tied to a delivered order, so there is no
 * placeholder content and no "be the first" padding: with no reviews yet this
 * renders only the invitation to write one, for people who have received it.
 */
export function ProductReviews({ slug }: { slug: string }) {
  const { data } = useQuery({
    queryKey: ["reviews", slug],
    queryFn: () => getProductReviews(slug),
    staleTime: 60_000,
  });

  const hasReviews = (data?.reviewCount ?? 0) > 0;

  return (
    <section aria-labelledby="reviews-heading" className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reviews-heading" className="font-heading text-xl font-bold text-foreground">
            Customer reviews
          </h2>
          {hasReviews && data && (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <StarRating value={data.avgRating} />
              <span>
                {data.avgRating.toFixed(1)} · {data.reviewCount}{" "}
                {data.reviewCount === 1 ? "review" : "reviews"}
              </span>
            </p>
          )}
        </div>
        <Button variant="outline" render={<Link href="/review" />}>
          Received this? Write a review
        </Button>
      </div>

      {hasReviews && data ? (
        <ul className="mt-6 divide-y border-y">
          {data.reviews.map((review) => (
            <li key={review.id} className="py-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <StarRating value={review.rating} />
                <span className="text-sm font-medium text-foreground">{review.reviewerName}</span>
                <span className="text-xs font-medium text-green-600">Verified purchase</span>
                <time dateTime={review.createdAt} className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>
              {review.title && <p className="mt-2 text-sm font-semibold">{review.title}</p>}
              {review.body && (
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{review.body}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No reviews yet. Reviews on this store come only from customers whose order has been
          delivered.
        </p>
      )}
    </section>
  );
}
