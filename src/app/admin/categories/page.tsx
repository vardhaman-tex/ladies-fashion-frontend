"use client";

import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ListTreeIcon, PackageSearchIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryFormDialog } from "@/components/admin/CategoryFormDialog";
import { useAdminCategories } from "@/hooks/useCategories";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryRequest,
} from "@/services/adminCategoryService";
import type { ApiError } from "@/types/api";
import type { Category } from "@/types/category";

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useAdminCategories();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  function openCreateDialog() {
    setEditingCategory(null);
    setDialogOpen(true);
  }

  function openEditDialog(category: Category) {
    setEditingCategory(category);
    setDialogOpen(true);
  }

  async function handleSubmit(data: CategoryRequest, image?: File) {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data, image);
        toast.success("Category updated");
      } else {
        await createCategory(data, image);
        toast.success("Category created");
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    } catch (error) {
      const message = isAxiosError<ApiError>(error)
        ? error.response?.data?.message ?? "Unable to save category"
        : "Unable to save category";
      toast.error(message);
      throw error;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteCategory(id);
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    } catch {
      toast.error("Unable to delete category");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Categories</h1>
        <Button onClick={openCreateDialog}>
          <PlusIcon />
          New Category
        </Button>
      </div>

      {/* Desktop table */}
      <div className="mt-4 hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Sort Order</th>
              <th className="px-4 py-2">Sub-categories</th>
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
            ) : categories?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No categories found.
                </td>
              </tr>
            ) : (
              categories?.map((category) => (
                <tr key={category.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{category.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{category.slug}</td>
                  <td className="px-4 py-2">{category.sortOrder}</td>
                  <td className="px-4 py-2">{category.subCategories.length}</td>
                  <td className="px-4 py-2">
                    <Badge variant={category.isActive ? "secondary" : "outline"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        render={<Link href={`/admin/products?categorySlug=${category.slug}`} />}
                        aria-label="View products in this category"
                      >
                        <PackageSearchIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/admin/categories/${category.id}/sub-categories`} />}
                      >
                        <ListTreeIcon />
                        Sub-categories
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                        aria-label="Edit category"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === category.id}
                        onClick={() => handleDelete(category.id)}
                        aria-label="Delete category"
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 flex flex-col gap-3 md:hidden">
        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
        ) : categories?.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No categories found.</p>
        ) : (
          categories?.map((category) => (
            <div key={category.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{category.slug}</p>
                </div>
                <Badge variant={category.isActive ? "secondary" : "outline"}>
                  {category.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Sort order: {category.sortOrder}</span>
                <span>{category.subCategories.length} sub-categories</span>
              </div>

              <div className="mt-3 flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  render={<Link href={`/admin/categories/${category.id}/sub-categories`} />}
                >
                  <ListTreeIcon />
                  Sub-categories
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  render={<Link href={`/admin/products?categorySlug=${category.slug}`} />}
                  aria-label="View products in this category"
                >
                  <PackageSearchIcon className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)} aria-label="Edit category">
                  <PencilIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deletingId === category.id}
                  onClick={() => handleDelete(category.id)}
                  aria-label="Delete category"
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingCategory ? "Edit Category" : "New Category"}
        initialValues={
          editingCategory
            ? {
                name: editingCategory.name,
                description: editingCategory.description,
                sortOrder: editingCategory.sortOrder,
                isActive: editingCategory.isActive,
              }
            : undefined
        }
        onSubmit={handleSubmit}
      />
    </div>
  );
}
