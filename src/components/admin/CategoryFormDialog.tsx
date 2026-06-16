"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryRequest } from "@/services/adminCategoryService";

export interface CategoryFormInitialValues {
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialValues?: CategoryFormInitialValues;
  onSubmit: (data: CategoryRequest, image?: File) => Promise<void>;
}

const EMPTY_VALUES: CategoryFormInitialValues = { name: "", description: "", sortOrder: 0, isActive: true };

/**
 * Shared create/edit form for categories and sub-categories.
 */
export function CategoryFormDialog({ open, onOpenChange, title, initialValues, onSubmit }: CategoryFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState<File | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const values = initialValues ?? EMPTY_VALUES;
      setName(values.name);
      setDescription(values.description ?? "");
      setSortOrder(String(values.sortOrder));
      setIsActive(values.isActive);
      setImage(undefined);
    }
  }, [open, initialValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          sortOrder: sortOrder ? Number(sortOrder) : undefined,
          isActive,
        },
        image
      );
      onOpenChange(false);
    } catch {
      // keep dialog open so the user can retry; caller already showed a toast
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-name">Name *</Label>
            <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category-description">Description</Label>
            <textarea
              id="category-description"
              className="min-h-20 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category-sort-order">Sort Order</Label>
            <Input
              id="category-sort-order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category-image">Image</Label>
            <Input
              id="category-image"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0])}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="category-is-active"
              type="checkbox"
              className="size-4 rounded border-input"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <Label htmlFor="category-is-active">Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
