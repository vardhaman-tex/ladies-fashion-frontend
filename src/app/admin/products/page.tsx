"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { PlusIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { deleteProduct } from "@/services/adminProductService";
import { useState } from "react";

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useProducts({ size: 50 });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch {
      toast.error("Unable to delete product");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Products</h1>
        <Button render={<Link href="/admin/products/new" />}>
          <PlusIcon />
          New Product
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : data?.content.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            ) : (
              data?.content.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{product.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{product.sku}</td>
                  <td className="px-4 py-2">₹{product.price.toFixed(2)}</td>
                  <td className="px-4 py-2">{product.inStock ? "In stock" : "Out of stock"}</td>
                  <td className="px-4 py-2">
                    <Badge variant={product.status === "ACTIVE" ? "secondary" : "outline"}>
                      {product.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletingId === product.id}
                      onClick={() => handleDelete(product.id)}
                      aria-label="Delete product"
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
