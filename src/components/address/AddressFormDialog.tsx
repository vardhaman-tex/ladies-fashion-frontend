"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddAddress, useUpdateAddress } from "@/hooks/useAddresses";
import type { AddressData, AddressRequest } from "@/types/address";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: AddressData | null;
}

const EMPTY: AddressRequest = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

export function AddressFormDialog({ open, onClose, editing }: Props) {
  const [form, setForm] = useState<AddressRequest>(EMPTY);
  const { mutate: addAddress, isPending: adding } = useAddAddress();
  const { mutate: updateAddress, isPending: updating } = useUpdateAddress();
  const isPending = adding || updating;

  useEffect(() => {
    if (editing) {
      setForm({
        fullName: editing.fullName,
        phone: editing.phone,
        addressLine1: editing.addressLine1,
        addressLine2: editing.addressLine2 ?? "",
        city: editing.city,
        state: editing.state,
        pincode: editing.pincode,
        isDefault: editing.isDefault,
      });
    } else {
      setForm(EMPTY);
    }
  }, [editing, open]);

  if (!open) return null;

  const set = (field: keyof AddressRequest, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, addressLine2: form.addressLine2 || undefined };
    if (editing) {
      updateAddress({ id: editing.id, request: payload }, { onSuccess: onClose });
    } else {
      addAddress(payload, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl bg-background shadow-xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background px-6 pt-6 pb-2">
          <h2 className="font-heading text-lg font-bold">
            {editing ? "Edit Address" : "Add New Address"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground -mr-1">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-6 pb-6">

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
              <input
                className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                required
                maxLength={100}
                placeholder="Jane Doe"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Phone *</label>
              <input
                className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
                pattern="^[6-9]\d{9}$"
                maxLength={10}
                placeholder="9876543210"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Address Line 1 *</label>
            <input
              className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={form.addressLine1}
              onChange={(e) => set("addressLine1", e.target.value)}
              required
              maxLength={255}
              placeholder="House no., Street, Area"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Address Line 2</label>
            <input
              className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={form.addressLine2}
              onChange={(e) => set("addressLine2", e.target.value)}
              maxLength={255}
              placeholder="Landmark, etc. (optional)"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">City *</label>
              <input
                className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                required
                maxLength={100}
                placeholder="Mumbai"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">State *</label>
              <select
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                required
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Pincode *</label>
              <input
                className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={form.pincode}
                onChange={(e) => set("pincode", e.target.value)}
                required
                pattern="^[1-9][0-9]{5}$"
                maxLength={6}
                placeholder="400001"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="size-4 rounded"
            />
            Set as default address
          </label>

          <div className="mt-2 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Saving…" : editing ? "Save Changes" : "Add Address"}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
