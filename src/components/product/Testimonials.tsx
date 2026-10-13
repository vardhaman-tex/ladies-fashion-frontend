"use client";

import { useQuery } from "@tanstack/react-query";

import { StarRating } from "@/components/product/StarRating";
import { getTestimonials } from "@/services/testimonialService";

/**
 * Feedback customers sent the store directly, shown for what it is.
 *
 * It is not a review: it has no "Verified purchase" label, says where it came
 * from, and has no part in any product's rating. It renders nothing at all when
 * there is none, so the section only exists once there is something genuine to
 * put in it.
 */
export function Testimonials({
  productSlug,
  heading = "What customers say",
  limit = 6,
  className,
}: {
  /** Only feedback about this product. Omit for the store-wide set. */
  productSlug?: string;
  heading?: string;
  limit?: number;
  className?: string;
}) {
  const { data } = useQuery({
    queryKey: ["testimonials", productSlug ?? "all", limit],
    queryFn: () => getTestimonials({ productSlug, limit }),
    staleTime: 5 * 60_000,
  });

  if (!data || data.length === 0) return null;

  return (
    <section aria-labelledby={`testimonials-${productSlug ?? "all"}`} className={className}>
      <h2
        id={`testimonials-${productSlug ?? "all"}`}
        className="font-heading text-2xl font-bold text-foreground sm:text-3xl"
      >
        {heading}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Feedback customers shared with us directly, used with their permission.
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
            {item.rating != null && <StarRating value={item.rating} />}
            <blockquote className="text-sm leading-relaxed text-foreground">
              &ldquo;{item.body}&rdquo;
            </blockquote>
            <p className="mt-auto text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{item.customerName}</span>
              {item.location ? ` · ${item.location}` : ""}
              <br />
              Via {item.source}
              {item.receivedOn
                ? ` · ${new Date(item.receivedOn).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
                : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
