"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowLeftIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryFormDialog } from "@/components/admin/CategoryFormDialog";
import { useAdminCategories } from "@/hooks/useCategories";
import {
  createSubCategory,
  deleteSubCategory,
  updateSubCategory,
  type CategoryRequest,
} from "@/services/adminCategoryService";
import type { ApiError } from "@/types/api";
import type { SubCategory } from "@/types/category";

export default function AdminSubCategoriesPage() {
  const params = useParams<{ id: string }>();
  const categoryId = params.id;
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useAdminCategories();
  const category = categories?.find((c) => c.id === categoryId);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);

  function openCreateDialog() {
    setEditingSubCategory(null);
    setDialogOpen(true);
  }

  function openEditDialog(subCategory: SubCategory) {
    setEditingSubCategory(subCategory);
    setDialogOpen(true);
  }

  async function handleSubmit(data: CategoryRequest, image?: File) {
    try {
      if (editingSubCategory) {
        await updateSubCategory(editingSubCategory.id, data, image);
        toast.success("Sub-category updated");
      } else {
        await createSubCategory(categoryId, data, image);
        toast.success("Sub-category created");
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    } catch (error) {
      const message = isAxiosError<ApiError>(error)
        ? error.response?.data?.message ?? "Unable to save sub-category"
        : "Unable to save sub-category";
      toast.error(message);
      throw error;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sub-category? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteSubCategory(id);
      toast.success("Sub-category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    } catch {
      toast.error("Unable to delete sub-category");
    } finally {
      setDeletingId(null);
    }
  }

  const subCategories = category?.subCategories ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Button variant="ghost" size="sm" render={<Link href="/admin/categories" />}>
        <ArrowLeftIcon />
        Back to Categories
      </Button>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {isLoading ? "Sub-categories" : `Sub-categories: ${category?.name ?? "Unknown"}`}
        </h1>
        <Button onClick={openCreateDialog} disabled={!category}>
          <PlusIcon />
          New Sub-category
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
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : subCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No sub-categories found.
                </td>
              </tr>
            ) : (
              subCategories.map((subCategory) => (
                <tr key={subCategory.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{subCategory.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{subCategory.slug}</td>
                  <td className="px-4 py-2">{subCategory.sortOrder}</td>
                  <td className="px-4 py-2">
                    <Badge variant={subCategory.isActive ? "secondary" : "outline"}>
                      {subCategory.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(subCategory)}
                        aria-label="Edit sub-category"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === subCategory.id}
                        onClick={() => handleDelete(subCategory.id)}
                        aria-label="Delete sub-category"
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
        ) : subCategories.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No sub-categories found.</p>
        ) : (
          subCategories.map((subCategory) => (
            <div key={subCategory.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{subCategory.name}</p>
                  <p className="text-xs text-muted-foreground">{subCategory.slug}</p>
                </div>
                <Badge variant={subCategory.isActive ? "secondary" : "outline"}>
                  {subCategory.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">Sort order: {subCategory.sortOrder}</p>

              <div className="mt-3 flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(subCategory)} aria-label="Edit sub-category">
                  <PencilIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deletingId === subCategory.id}
                  onClick={() => handleDelete(subCategory.id)}
                  aria-label="Delete sub-category"
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
        title={editingSubCategory ? "Edit Sub-category" : "New Sub-category"}
        initialValues={
          editingSubCategory
            ? {
                name: editingSubCategory.name,
                description: editingSubCategory.description,
                sortOrder: editingSubCategory.sortOrder,
                isActive: editingSubCategory.isActive,
              }
            : undefined
        }
        onSubmit={handleSubmit}
      />
    </div>
  );
}
