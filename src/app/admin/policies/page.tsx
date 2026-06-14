"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  adminGetAllPolicies,
  adminCreatePolicy,
  adminUpdatePolicy,
  adminDeletePolicy,
  type Policy,
  type PolicyRequest,
} from "@/services/policyService";

const QUERY_KEY = ["admin", "policies"];

function PolicyForm({
  initial,
  onSubmit,
  isPending,
}: {
  initial?: Policy;
  onSubmit: (data: PolicyRequest) => void;
  isPending: boolean;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [visible, setVisible] = useState(initial?.visible ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim() || !title.trim() || !content.trim()) {
      toast.error("All fields are required");
      return;
    }
    onSubmit({ slug: slug.trim(), title: title.trim(), content: content.trim(), visible });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Terms and Conditions"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug (URL key)</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="terms-and-conditions"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="content">Content (supports plain text or HTML)</Label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          placeholder="Enter policy content here..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring resize-y"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
          className="accent-rose-600"
        />
        Visible to customers
      </label>
      <Button type="submit" disabled={isPending} className="self-end">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {initial ? "Save Changes" : "Create Policy"}
      </Button>
    </form>
  );
}

export default function AdminPoliciesPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Policy | null>(null);

  const { data: policies = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: adminGetAllPolicies,
  });

  const createMut = useMutation({
    mutationFn: adminCreatePolicy,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEY }); setDialogOpen(false); toast.success("Policy created"); },
    onError: () => toast.error("Failed to create policy"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PolicyRequest }) => adminUpdatePolicy(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEY }); setDialogOpen(false); setEditing(null); toast.success("Policy saved"); },
    onError: () => toast.error("Failed to save policy"),
  });

  const deleteMut = useMutation({
    mutationFn: adminDeletePolicy,
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEY }); toast.success("Policy deleted"); },
    onError: () => toast.error("Failed to delete policy"),
  });

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(p: Policy) { setEditing(p); setDialogOpen(true); }

  function handleSubmit(data: PolicyRequest) {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  }

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Policies & Terms</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage customer-facing policy pages (Privacy Policy, T&C, etc.)
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" />
          New Policy
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : policies.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <p className="mb-3">No policies yet.</p>
          <Button size="sm" onClick={openCreate}>Create your first policy</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {policies.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-semibold">{p.title}</p>
                <p className="text-sm text-muted-foreground">
                  /policies/{p.slug} · {p.visible ? "Visible" : "Hidden"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  p.visible
                    ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {p.visible ? <Eye className="inline size-3 mr-1" /> : <EyeOff className="inline size-3 mr-1" />}
                  {p.visible ? "Live" : "Hidden"}
                </span>
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label="Edit">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => { if (confirm("Delete this policy?")) deleteMut.mutate(p.id); }}
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o: boolean) => { if (!o) { setDialogOpen(false); setEditing(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Policy" : "New Policy"}</DialogTitle>
          </DialogHeader>
          <PolicyForm key={editing?.id ?? "new"} initial={editing ?? undefined} onSubmit={handleSubmit} isPending={isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
