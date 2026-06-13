"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Share2,
  ShoppingCartIcon,
  StarIcon,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductStrip } from "@/components/product/ProductStrip";
import { WishlistButton } from "@/components/product/WishlistButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import { toast } from "sonner";

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
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
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

  if (isLoading) return <PDPSkeleton />;

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center text-muted-foreground">
        Product not found.
      </div>
    );
  }

  const hasDiscount = product.discountAmount > 0;
  const availableQty = product.inventory?.availableQty ?? null;
  const availableSizes = product.sizes
    ? product.sizes.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const thumbnail =
    product.images.find((img) => img.isPrimary)?.imageUrl ??
    product.images[0]?.imageUrl ??
    null;

  function handleAddToCart() {
    addToCart({
      productId: product!.id,
      productName: product!.name,
      productSlug: product!.slug,
      thumbnail,
      price: product!.price,
      discountAmount: product!.discountAmount,
      quantity: 1,
      size: selectedSize,
      color: product!.color ?? null,
    });
  }

  function handleBuyNow() {
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
        color: product!.color ?? null,
      },
      { onSuccess: () => router.push("/cart") }
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
          <ProductImageGallery images={product.images} productName={product.name} />

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

            {/* Ratings + stock */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <StarIcon className="size-4 fill-amber-400 text-amber-400" />
                <span>{product.avgRating.toFixed(1)}</span>
                <span>({product.reviewCount} reviews)</span>
              </div>
              <StockIndicator inStock={product.inStock} availableQty={availableQty} />
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

            {/* Attributes */}
            {(product.color ?? product.fabric) && (
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {product.color && (
                  <span className="rounded-full border px-3 py-0.5">
                    Color: {product.color}
                  </span>
                )}
                {product.fabric && (
                  <span className="rounded-full border px-3 py-0.5">
                    Fabric: {product.fabric}
                  </span>
                )}
              </div>
            )}

            {/* Size selector */}
            {availableSizes.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Size{selectedSize ? <span className="ml-1 font-bold text-rose-600">— {selectedSize}</span> : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                      className={`min-w-[2.5rem] rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? "border-rose-600 bg-rose-600 text-white"
                          : "border-border text-foreground hover:border-rose-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA buttons — observed for sticky bar */}
            <div ref={ctaRef} className="flex gap-2">
              <Button
                className="flex-1"
                disabled={!product.inStock || adding}
                onClick={handleAddToCart}
              >
                <ShoppingCartIcon className="size-4" />
                {adding ? "Adding…" : "Add to Cart"}
              </Button>
              <Button
                className="flex-1"
                variant="secondary"
                disabled={!product.inStock || adding}
                onClick={handleBuyNow}
              >
                <Zap className="size-4" />
                Buy Now
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
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur md:hidden">
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
          <Button
            size="sm"
            disabled={!product.inStock || adding}
            onClick={handleAddToCart}
            className="shrink-0"
          >
            <ShoppingCartIcon className="size-4" />
            {adding ? "Adding…" : "Add to Cart"}
          </Button>
        </div>
      )}
    </>
  );
}
