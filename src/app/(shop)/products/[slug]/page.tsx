"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Minus,
  Plus,
  Share2,
  ShoppingCartIcon,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductStrip } from "@/components/product/ProductStrip";
import { WishlistButton } from "@/components/product/WishlistButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart, useCart, useUpdateCartItem } from "@/hooks/useCart";
import { useDebouncedQuantity } from "@/hooks/useDebouncedQuantity";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

/* ─── Quantity stepper (replaces Add to Cart once item is in cart) ───────── */
function QtyStepper({
  quantity,
  onDecrement,
  onIncrement,
  disabled,
  atMax,
  className = "",
}: {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  disabled?: boolean;
  atMax?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border border-rose-600 bg-rose-50 px-1 ${className}`}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDecrement}
        disabled={disabled || quantity <= 1}
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" />
      </Button>
      <span className="min-w-6 text-center text-sm font-semibold tabular-nums">
        {quantity}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onIncrement}
        disabled={disabled || atMax}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

/* ─── Breadcrumb ──────────────────────────────────────────────────────────── */
function Breadcrumb({
  categoryName,
  categorySlug,
  productName,
}: {
  categoryName: string | null;
  categorySlug: string | null;
  productName: string;
}) {
  const label =
    productName.length > 32 ? productName.slice(0, 32) + "…" : productName;
  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground">
      <Link href="/" className="hover:text-foreground transition-colors">
        Home
      </Link>
      {categoryName && categorySlug && (
        <>
          <ChevronRight className="size-3 shrink-0" />
          <Link
            href={`/products?categorySlug=${categorySlug}`}
            className="hover:text-foreground transition-colors"
          >
            {categoryName}
          </Link>
        </>
      )}
      <ChevronRight className="size-3 shrink-0" />
      <span className="text-foreground">{label}</span>
    </nav>
  );
}

/* ─── Stock indicator ─────────────────────────────────────────────────────── */
function StockIndicator({
  inStock,
  availableQty,
}: {
  inStock: boolean;
  availableQty: number | null;
}) {
  if (!inStock) {
    return (
      <Badge variant="destructive" className="text-xs">
        Out of Stock
      </Badge>
    );
  }
  if (availableQty !== null && availableQty <= 10) {
    return (
      <span className="text-xs font-semibold text-amber-600">
        Only {availableQty} left!
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
      <CheckCircle2 className="size-3.5" />
      In Stock
    </span>
  );
}

/* ─── Size Guide Modal ────────────────────────────────────────────────────── */
function SizeGuideModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Size Guide</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Size</th>
                <th className="pb-2 pr-4">Bust (in)</th>
                <th className="pb-2 pr-4">Waist (in)</th>
                <th className="pb-2">Hip (in)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ["XS", "32", "26", "35"],
                ["S", "34", "28", "37"],
                ["M", "36", "30", "39"],
                ["L", "38", "32", "41"],
                ["XL", "40", "34", "43"],
                ["XXL", "42", "36", "45"],
              ].map(([size, bust, waist, hip]) => (
                <tr key={size} className="text-foreground">
                  <td className="py-2 pr-4 font-medium">{size}</td>
                  <td className="py-2 pr-4">{bust}</td>
                  <td className="py-2 pr-4">{waist}</td>
                  <td className="py-2">{hip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Measurements are in inches. If between sizes, size up.
        </p>
      </div>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function PDPSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 h-4 w-48 rounded bg-muted shimmer-base" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="aspect-square rounded-xl bg-muted shimmer-base" />
        <div className="flex flex-col gap-4">
          <div className="h-6 w-32 rounded bg-muted shimmer-base" />
          <div className="h-8 w-3/4 rounded bg-muted shimmer-base" />
          <div className="h-5 w-40 rounded bg-muted shimmer-base" />
          <div className="h-10 w-48 rounded bg-muted shimmer-base" />
          <div className="flex gap-2">
            <div className="h-10 flex-1 rounded-lg bg-muted shimmer-base" />
            <div className="h-10 flex-1 rounded-lg bg-muted shimmer-base" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: product, isLoading } = useProduct(params.slug);
  const { mutate: addToCart, isPending: adding } = useAddToCart();
  const { cart } = useCart();
  const { mutate: updateCartItem } = useUpdateCartItem();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const ctaRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Sticky bar visibility via IntersectionObserver
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [product]);

  // Initialize the selected color to the first active variant once the product loads
  useEffect(() => {
    if (!product) return;
    const active = product.variants.filter((v) => v.isActive);
    const first = (active.length > 0 ? active : product.variants)[0];
    if (first) {
      setSelectedVariantId(first.id);
      setSelectedSize(first.skus.length === 1 ? first.skus[0].size : null);
    }
  }, [product]);

  if (isLoading) return <PDPSkeleton />;

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center text-muted-foreground">
        Product not found.
      </div>
    );
  }

  const hasDiscount = product.discountAmount > 0;
  const activeVariants = product.variants.filter((v) => v.isActive);
  const displayVariants = activeVariants.length > 0 ? activeVariants : product.variants;
  const selectedVariant = displayVariants.find((v) => v.id === selectedVariantId) ?? displayVariants[0] ?? null;
  const availableSizes = selectedVariant?.skus ?? [];
  const selectedSku = selectedVariant?.skus.find((s) => s.size === selectedSize) ?? null;
  const needsSizeChoice = availableSizes.length > 1;

  const availableQty = selectedSku?.availableQty ?? null;
  const inStockNow = selectedSku ? selectedSku.availableQty > 0 : selectedVariant?.inStock ?? product.inStock;

  function selectVariant(variantId: string) {
    setSelectedVariantId(variantId);
    const variant = displayVariants.find((v) => v.id === variantId);
    setSelectedSize(variant && variant.skus.length === 1 ? variant.skus[0].size : null);
  }

  const galleryImages = selectedVariant?.images ?? [];
  const thumbnail =
    galleryImages.find((img) => img.isPrimary)?.imageUrl ??
    galleryImages[0]?.imageUrl ??
    product.thumbnail;

  function handleAddToCart() {
    if (needsSizeChoice && !selectedSize) {
      toast.error("Please select a size before adding to cart");
      return;
    }
    addToCart({
      productId: product!.id,
      productName: product!.name,
      productSlug: product!.slug,
      thumbnail,
      price: product!.price,
      discountAmount: product!.discountAmount,
      quantity: 1,
      size: selectedSize,
      color: selectedVariant?.color ?? null,
    });
  }

  const cartItem =
    cart?.items.find(
      (i) =>
        i.productId === product?.id &&
        i.size === selectedSize &&
        i.color === (selectedVariant?.color ?? null)
    ) ?? null;
  const { quantity: displayCartQty, change: changeCartQtyDebounced } = useDebouncedQuantity(
    cartItem?.quantity ?? 1,
    (quantity) => {
      if (!cartItem) return;
      updateCartItem({
        itemId: cartItem.id,
        quantity,
        ...(!isAuthenticated && {
          productId: cartItem.productId,
          size: cartItem.size,
          color: cartItem.color,
        }),
      });
    }
  );
  const atStockLimit = availableQty !== null && displayCartQty >= availableQty;

  function changeCartQty(delta: number) {
    if (!cartItem) return;
    const newQty = displayCartQty + delta;
    if (newQty < 1) return;
    if (availableQty !== null && newQty > availableQty) return;
    changeCartQtyDebounced(newQty);
  }

  function handleBuyNow() {
    if (needsSizeChoice && !selectedSize) {
      toast.error("Please select a size before buying");
      return;
    }
    // The button itself swaps to "Go to Cart" (-> router.push("/cart")) once
    // cartItem exists, so this function is only ever invoked pre-add-to-cart.
    addToCart(
      {
        productId: product!.id,
        productName: product!.name,
        productSlug: product!.slug,
        thumbnail,
        price: product!.price,
        discountAmount: product!.discountAmount,
        quantity: 1,
        size: selectedSize,
        color: selectedVariant?.color ?? null,
      },
      // Buy Now should skip the cart page and take the customer straight to
      // checkout — previously this routed to /cart, making the button behave
      // like a second "Add to Cart" instead of an express checkout shortcut.
      { onSuccess: () => router.push("/checkout") }
    );
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product!.name, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  }

  const hasSimilar = product.similarProducts.length > 0;
  const hasRecommended = product.recommendedProducts.length > 0;

  return (
    <>
      {/* SizeGuideModal hidden for now */}

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumb
            categoryName={product.category?.name ?? null}
            categorySlug={product.category?.slug ?? null}
            productName={product.name}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Gallery */}
          <ProductImageGallery
            key={selectedVariant?.id ?? "default"}
            images={galleryImages}
            productName={product.name}
          />

          {/* Info panel */}
          <div className="flex flex-col gap-4">
            {/* Category + name + share */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                {product.category && (
                  <p className="text-sm text-muted-foreground">
                    {product.category.name}
                    {product.subCategory ? ` / ${product.subCategory.name}` : ""}
                  </p>
                )}
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {product.name}
                </h1>
              </div>
              <button
                onClick={handleShare}
                className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border hover:bg-muted transition-colors"
                aria-label="Share product"
              >
                <Share2 className="size-4 text-muted-foreground" />
              </button>
            </div>

            {/* Stock */}
            <div className="flex flex-wrap items-center gap-3">
              <StockIndicator inStock={inStockNow} availableQty={availableQty} />
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              {hasDiscount ? (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{product.price.toFixed(2)}
                  </span>
                  <span className="text-2xl font-bold text-destructive">
                    ₹{product.finalPrice.toFixed(2)}
                  </span>
                  <Badge variant="destructive">
                    {Math.round(product.discountPercent)}% OFF
                  </Badge>
                </>
              ) : (
                <span className="text-2xl font-bold">₹{product.price.toFixed(2)}</span>
              )}
            </div>

            {/* Fabric */}
            {product.fabric && (
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="rounded-full border px-3 py-0.5">
                  Fabric: {product.fabric}
                </span>
              </div>
            )}

            {/* Color variant thumbnails — show each variant's hero image instead of a flat swatch */}
            {displayVariants.length > 1 && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Color{selectedVariant ? <span className="ml-1 font-bold text-rose-600">— {selectedVariant.color}</span> : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {displayVariants.map((variant) => {
                    const isSelected = variant.id === selectedVariant?.id;
                    const variantThumb =
                      variant.images.find((img) => img.isPrimary)?.imageUrl ??
                      variant.images[0]?.imageUrl ??
                      null;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        title={variant.color}
                        aria-label={variant.color}
                        onClick={() => selectVariant(variant.id)}
                        className={`relative size-14 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-all ${
                          isSelected ? "border-rose-600 ring-2 ring-rose-200" : "border-border"
                        }`}
                      >
                        {variantThumb ? (
                          <Image
                            src={variantThumb}
                            alt={variant.color}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <span
                            className="absolute inset-0"
                            style={{ backgroundColor: variant.colorHex ?? undefined }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size selector */}
            {needsSizeChoice && (
              <div ref={sizeRef}>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Size{selectedSize ? <span className="ml-1 font-bold text-rose-600">— {selectedSize}</span> : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((sku) => (
                    <button
                      key={sku.id}
                      type="button"
                      disabled={!sku.inStock}
                      onClick={() => setSelectedSize(selectedSize === sku.size ? null : sku.size)}
                      className={`min-w-[2.5rem] rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedSize === sku.size
                          ? "border-rose-600 bg-rose-600 text-white"
                          : !sku.inStock
                            ? "border-border text-muted-foreground/50 line-through"
                            : "border-border text-foreground hover:border-rose-400"
                      }`}
                    >
                      {sku.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA buttons — observed for sticky bar */}
            <div ref={ctaRef} className="flex gap-2">
              {cartItem ? (
                <QtyStepper
                  quantity={displayCartQty}
                  onDecrement={() => changeCartQty(-1)}
                  onIncrement={() => changeCartQty(1)}
                  atMax={atStockLimit}
                  className="flex-1"
                />
              ) : (
                <Button
                  className="flex-1"
                  disabled={!inStockNow || adding}
                  onClick={handleAddToCart}
                >
                  <ShoppingCartIcon className="size-4" />
                  {adding ? "Adding…" : "Add to Cart"}
                </Button>
              )}
              <Button
                className="flex-1"
                variant="secondary"
                disabled={!inStockNow || adding}
                onClick={cartItem ? () => router.push("/cart") : handleBuyNow}
              >
                {cartItem ? (
                  <>
                    <ShoppingCartIcon className="size-4" />
                    Go to Cart
                  </>
                ) : (
                  <>
                    <Zap className="size-4" />
                    Buy Now
                  </>
                )}
              </Button>
              <WishlistButton
                variant="full"
                productId={product.id}
                productName={product.name}
                productSlug={product.slug}
                thumbnail={thumbnail}
                price={product.price}
                discountAmount={product.discountAmount}
              />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="description">
              <TabsList>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="fabric">Fabric & Care</TabsTrigger>
              </TabsList>
              <TabsContent value="description">
                <p className="text-sm text-muted-foreground">
                  {product.description ?? "No description available."}
                </p>
              </TabsContent>
              <TabsContent value="fabric">
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <p>{product.fabricDetails ?? "No fabric details available."}</p>
                  <p>{product.careInstructions ?? "No care instructions available."}</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Related products */}
        {hasSimilar && (
          <section className="mt-14">
            <h2 className="font-heading text-xl font-bold text-foreground">
              You May Also Like
            </h2>
            <div className="mt-4">
              <ProductStrip products={product.similarProducts} />
            </div>
          </section>
        )}

        {hasRecommended && (
          <section className="mt-14">
            <h2 className="font-heading text-xl font-bold text-foreground">
              Recommended For You
            </h2>
            <div className="mt-4">
              <ProductStrip products={product.recommendedProducts} />
            </div>
          </section>
        )}
      </div>

      {/* Sticky add-to-cart bar — mobile only, shown when CTA is off-screen */}
      {!ctaVisible && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t bg-background/95 px-4 pt-3 shadow-lg backdrop-blur md:hidden"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {product.name}
            </p>
            {hasDiscount ? (
              <p className="text-sm font-bold text-destructive">
                ₹{product.finalPrice.toFixed(2)}
              </p>
            ) : (
              <p className="text-sm font-bold">₹{product.price.toFixed(2)}</p>
            )}
          </div>
          {cartItem ? (
            <QtyStepper
              quantity={displayCartQty}
              onDecrement={() => changeCartQty(-1)}
              onIncrement={() => changeCartQty(1)}
              atMax={atStockLimit}
              className="max-w-32 shrink-0"
            />
          ) : (
          <Button
            size="sm"
            disabled={!inStockNow || adding}
            onClick={() => {
              if (needsSizeChoice && !selectedSize) {
                sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                return;
              }
              handleAddToCart();
            }}
            className="shrink-0"
          >
            <ShoppingCartIcon className="size-4" />
            {adding ? "Adding…" : needsSizeChoice && !selectedSize ? "Select Size" : "Add to Cart"}
          </Button>
          )}
        </div>
      )}
    </>
  );
}
