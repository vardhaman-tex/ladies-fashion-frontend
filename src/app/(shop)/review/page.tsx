"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalisePhone } from "@/lib/checkoutAddress";
import { cn } from "@/lib/utils";
import { getReviewableItems, submitReview } from "@/services/reviewService";
import type { ReviewableItem } from "@/types/review";

/**
 * Write a review for something you've received.
 *
 * Proof of purchase is the order number plus the phone it was placed with, the
 * same pair order tracking asks for. The phone is typed here and sent in the
 * request body, never carried in the URL: a link someone shares or a browser
 * history entry should not contain a phone number.
 */
function ReviewForm() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<ReviewableItem[] | null>(null);
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ReviewableItem | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function findOrder(event: React.FormEvent) {
    event.preventDefault();
    setLookupError(null);
    setLooking(true);
    try {
      const found = await getReviewableItems(orderNumber.trim(), normalisePhone(phone));
      setItems(found);
      setSelected(found.find((item) => !item.alreadyReviewed) ?? null);
    } catch (err) {
      setItems(null);
      setLookupError(
        isAxiosError(err) && err.response?.status === 404
          ? "We couldn't find a delivered order with those details. Reviews open once your order has been delivered."
          : "Something went wrong. Please try again."
      );
    } finally {
      setLooking(false);
    }
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    if (rating < 1) {
      toast.error("Please choose a star rating.");
      return;
    }
    setSubmitting(true);
    try {
      await submitReview({
        orderNumber: orderNumber.trim(),
        phone: normalisePhone(phone),
        productId: selected.productId,
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      });
      setDone(selected.productSlug);
    } catch (err) {
      toast.error(
        isAxiosError(err) && err.response?.data?.message
          ? String(err.response.data.message)
          : "Could not save your review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
        <h2 className="font-heading text-2xl font-bold">Thank you for your review</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          It&apos;s now live on the product page and helps other shoppers choose.
        </p>
        <Button render={<Link href={`/products/${done}`} />}>See it on the product page</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={findOrder} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="review-order">Order number</Label>
          <Input
            id="review-order"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Order number"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="review-phone">Phone number on the order</Label>
          <Input
            id="review-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={looking}>
          {looking ? <Loader2 className="size-4 animate-spin" /> : null}
          Find my order
        </Button>
        {lookupError && (
          <p role="alert" className="text-sm text-destructive">
            {lookupError}
          </p>
        )}
      </form>

      {items && items.every((item) => item.alreadyReviewed) && (
        <p className="text-sm text-muted-foreground">
          You&apos;ve already reviewed everything in this order. Thank you!
        </p>
      )}

      {items && items.some((item) => !item.alreadyReviewed) && (
        <form onSubmit={send} className="space-y-5 border-t pt-6">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">What are you reviewing?</legend>
            <div className="grid gap-2">
              {items
                .filter((item) => !item.alreadyReviewed)
                .map((item) => (
                  <label
                    key={item.productId}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-3",
                      selected?.productId === item.productId && "border-primary bg-accent/50"
                    )}
                  >
                    <input
                      type="radio"
                      name="product"
                      checked={selected?.productId === item.productId}
                      onChange={() => setSelected(item)}
                      className="size-4 accent-primary"
                    />
                    <span className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
                      {item.thumbnail && (
                        <Image src={item.thumbnail} alt="" fill className="object-cover" sizes="48px" />
                      )}
                    </span>
                    <span className="text-sm font-medium">{item.productName}</span>
                  </label>
                ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold">Your rating</legend>
            <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  className="flex size-11 items-center justify-center rounded-md hover:bg-muted"
                >
                  <Star
                    className={cn(
                      "size-7",
                      n <= rating ? "fill-warning text-warning" : "text-muted-foreground/40"
                    )}
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="review-title">Headline (optional)</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Perfect fit, lovely fabric"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="review-body">Your review (optional)</Label>
            <textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="How was the fit, fabric and colour compared with the photos?"
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <Button type="submit" size="lg" disabled={submitting || !selected}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Submit review
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Verified reviews</p>
      <h1 className="mt-1 font-heading text-3xl font-bold text-foreground">Write a review</h1>
      <p className="mt-3 mb-8 text-sm text-muted-foreground">
        Reviews come only from delivered orders. Enter the order number and the phone number you
        ordered with.
      </p>
      <Suspense fallback={<Loader2 className="size-6 animate-spin text-muted-foreground" />}>
        <ReviewForm />
      </Suspense>
    </div>
  );
}
