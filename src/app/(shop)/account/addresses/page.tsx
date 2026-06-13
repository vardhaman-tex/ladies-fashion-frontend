"use client";

import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddressFormDialog } from "@/components/address/AddressFormDialog";
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from "@/hooks/useAddresses";
import type { AddressData } from "@/types/address";

export default function AddressesPage() {
  const { data: addresses = [], isLoading: loadingAddresses } = useAddresses();
  const { mutate: deleteAddr, isPending: deleting } = useDeleteAddress();
  const { mutate: setDefault, isPending: settingDefault } = useSetDefaultAddress();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AddressData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (addr: AddressData) => { setEditing(addr); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  if (loadingAddresses) {
    return (
      <div className="mx-auto max-w-2xl flex flex-col gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted shimmer-base" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Saved Addresses</h1>
        <Button size="sm" onClick={openAdd} disabled={addresses.length >= 10}>
          <Plus className="size-4 mr-1" />
          Add New
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
          <MapPin className="size-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium">No saved addresses</p>
            <p className="text-sm text-muted-foreground">Add a delivery address to speed up checkout.</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="size-4 mr-1" />
            Add Address
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative rounded-xl border p-4 ${
                addr.isDefault ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{addr.fullName}</span>
                    {addr.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="size-3 mr-0.5 fill-current" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{addr.phone}</span>
                  <p className="text-sm text-foreground mt-1">
                    {addr.addressLine1}
                    {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                  </p>
                  <p className="text-sm text-foreground">
                    {addr.city}, {addr.state} – {addr.pincode}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(addr)}
                    aria-label="Edit address"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete(addr.id)}
                    aria-label="Delete address"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {!addr.isDefault && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 h-auto p-0 text-xs text-muted-foreground"
                  onClick={() => setDefault(addr.id)}
                  disabled={settingDefault}
                >
                  Set as default
                </Button>
              )}
            </div>
          ))}

          {addresses.length >= 10 && (
            <p className="text-center text-xs text-muted-foreground">
              Maximum of 10 addresses reached.
            </p>
          )}
        </div>
      )}

      <AddressFormDialog open={dialogOpen} onClose={closeDialog} editing={editing} />

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl mx-4">
            <h3 className="font-heading text-lg font-bold">Delete Address?</h3>
            <p className="mt-1 text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleting}
                onClick={() => {
                  deleteAddr(confirmDelete, { onSuccess: () => setConfirmDelete(null) });
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
