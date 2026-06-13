"use client";

import { HeartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsWishlisted, useToggleWishlist } from "@/hooks/useWishlist";

interface WishlistButtonProps {
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string | null;
  price: number;
  discountAmount: number;
  className?: string;
  /** "icon" = icon-only button (card overlay), "full" = icon+label (PDP) */
  variant?: "icon" | "full";
}

export function WishlistButton({
  productId,
  productName,
  productSlug,
  thumbnail,
  price,
  discountAmount,
  className,
  variant = "icon",
}: WishlistButtonProps) {
  const isWishlisted = useIsWishlisted(productId);
  const { mutate: toggle, isPending } = useToggleWishlist();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle({
      productId,
      productName,
      productSlug,
      thumbnail,
      price,
      discountAmount,
      alreadyWishlisted: isWishlisted,
    });
  };

  if (variant === "full") {
    return (
      <Button
        variant="outline"
        size="icon"
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        onClick={handleClick}
        disabled={isPending}
        className={cn(isWishlisted && "text-rose-600 border-rose-200 bg-rose-50", className)}
      >
        <HeartIcon className={cn("size-5", isWishlisted && "fill-rose-600")} />
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="icon-sm"
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "rounded-full shadow-sm opacity-100 transition-all md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
        isWishlisted && "text-rose-600 bg-rose-50",
        className
      )}
    >
      <HeartIcon className={cn("size-4", isWishlisted && "fill-rose-600")} />
    </Button>
  );
}
