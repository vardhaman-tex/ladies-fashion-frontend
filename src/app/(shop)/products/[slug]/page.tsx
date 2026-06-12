"use client";

import { useParams } from "next/navigation";
import { HeartIcon, ShoppingCartIcon, StarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductGridSkeleton } from "@/components/common/LoadingSkeleton";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProduct } from "@/hooks/useProducts";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(params.slug);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <ProductGridSkeleton count={1} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center text-muted-foreground">
        Product not found.
      </div>
    );
  }

  const hasDiscount = product.discountAmount > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <ProductImageGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-4">
          <div>
            {product.category && (
              <p className="text-sm text-muted-foreground">
                {product.category.name}
                {product.subCategory ? ` / ${product.subCategory.name}` : ""}
              </p>
            )}
            <h1 className="font-heading text-2xl font-bold text-foreground">{product.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <StarIcon className="size-4 fill-amber-400 text-amber-400" />
              <span>{product.avgRating.toFixed(1)}</span>
              <span>({product.reviewCount} reviews)</span>
            </div>
            <Badge variant={product.inStock ? "secondary" : "destructive"}>
              {product.inStock ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {hasDiscount ? (
              <>
                <span className="text-lg text-muted-foreground line-through">₹{product.price.toFixed(2)}</span>
                <span className="text-2xl font-bold text-destructive">₹{product.finalPrice.toFixed(2)}</span>
                <Badge variant="destructive">{Math.round(product.discountPercent)}% OFF</Badge>
              </>
            ) : (
              <span className="text-2xl font-bold">₹{product.price.toFixed(2)}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {product.color && <span>Color: {product.color}</span>}
            {product.fabric && <span>· Fabric: {product.fabric}</span>}
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" disabled={!product.inStock}>
              <ShoppingCartIcon />
              Add to Cart
            </Button>
            <Button className="flex-1" variant="secondary" disabled={!product.inStock}>
              Buy Now
            </Button>
            <Button variant="outline" size="icon" aria-label="Add to wishlist">
              <HeartIcon />
            </Button>
          </div>

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

      {product.similarProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-xl font-bold text-foreground">Similar Products</h2>
          <div className="mt-4">
            <ProductGrid products={product.similarProducts} />
          </div>
        </section>
      )}

      {product.recommendedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-xl font-bold text-foreground">Recommended For You</h2>
          <div className="mt-4">
            <ProductGrid products={product.recommendedProducts} />
          </div>
        </section>
      )}
    </div>
  );
}
