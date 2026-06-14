"use client";

import { use, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { useAdminOrder, useUpdateOrderStatus, useEditAdminOrder } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { cn } from "@/lib/utils";
import type { OrderData, OrderStatus } from "@/types/order";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:   "bg-amber-100 text-amber-800",
  PAID:      "bg-purple-100 text-purple-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED:   "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:   ["CANCELLED"],
  PAID:      ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED:   ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

/* ── Edit Order Modal ───────────────────────────────────────────────────── */
function EditOrderModal({
  order,
  onClose,
}: {
  order: OrderData;
  onClose: () => void;
}) {
  const editOrder = useEditAdminOrder(order.id);

  // Item quantities (id → qty; 0 = remove)
  const [itemQtys, setItemQtys] = useState<Record<string, number>>(
    Object.fromEntries(order.items.map((i) => [i.id, i.quantity]))
  );
  const [adminDiscount, setAdminDiscount] = useState(order.adminDiscount ?? 0);
  const [adminNotes, setAdminNotes] = useState(order.adminNotes ?? "");
  // Address overrides
  const [addr, setAddr] = useState({
    addrFullName: order.addrFullName,
    addrPhone: order.addrPhone,
    addrLine1: order.addrLine1,
    addrLine2: order.addrLine2 ?? "",
    addrCity: order.addrCity,
    addrState: order.addrState,
    addrPincode: order.addrPincode,
  });

  async function handleSave() {
    const items = order.items
      .map((i) => ({ itemId: i.id, quantity: itemQtys[i.id] ?? i.quantity }))
      .filter((i) => i.quantity !== order.items.find((x) => x.id === i.itemId)?.quantity || i.quantity === 0);

    try {
      await editOrder.mutateAsync({
        items: items.length > 0 ? items : undefined,
        adminDiscount: adminDiscount !== (order.adminDiscount ?? 0) ? adminDiscount : undefined,
        adminNotes,
        ...addr,
      });
      toast.success("Order updated");
      onClose();
    } catch {
      toast.error("Failed to update order");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Edit Order #{order.id.slice(0, 8).toUpperCase()}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 p-5">
          {/* Items */}
          <div>
            <p className="mb-2 text-sm font-semibold">Items</p>
            <div className="divide-y rounded-lg border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                    {item.thumbnail && (
                      <Image src={item.thumbnail} alt={item.productName} fill className="object-cover" sizes="40px" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium">{item.productName}</p>
                    {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="size-6 rounded border text-center text-sm leading-none hover:bg-muted disabled:opacity-40"
                      disabled={(itemQtys[item.id] ?? 1) <= 0}
                      onClick={() => setItemQtys((prev) => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] ?? item.quantity) - 1) }))}
                    >
                      −
                    </button>
                    <span className={cn("w-8 text-center text-sm font-medium", (itemQtys[item.id] ?? item.quantity) === 0 && "text-red-500 line-through")}>
                      {itemQtys[item.id] ?? item.quantity}
                    </span>
                    <button
                      className="size-6 rounded border text-center text-sm leading-none hover:bg-muted"
                      onClick={() => setItemQtys((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? item.quantity) + 1 }))}
                    >
                      +
                    </button>
                  </div>
                  {(itemQtys[item.id] ?? item.quantity) === 0 && (
                    <span className="text-xs text-red-500 font-medium">Remove</span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Set quantity to 0 to remove an item.</p>
          </div>

          {/* Admin discount */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Admin Discount (₹)</label>
            <input
              type="number"
              min={0}
              value={adminDiscount}
              onChange={(e) => setAdminDiscount(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Admin notes */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Admin Notes</label>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes visible only to admins..."
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Delivery address */}
          <div>
            <p className="mb-2 text-sm font-semibold">Delivery Address</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(["addrFullName", "addrPhone", "addrLine1", "addrLine2", "addrCity", "addrState", "addrPincode"] as const).map((key) => (
                <div key={key} className={key === "addrLine1" ? "sm:col-span-2" : ""}>
                  <label className="mb-0.5 block text-xs text-muted-foreground capitalize">
                    {key.replace("addr", "").replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <input
                    value={addr[key]}
                    onChange={(e) => setAddr((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={editOrder.isPending}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {editOrder.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: order, isLoading } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const [editOpen, setEditOpen] = useState(false);

  async function handleStatus(next: OrderStatus) {
    try {
      await updateStatus.mutateAsync({ id, status: next });
      toast.success(`Order marked as ${next.toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 lg:p-8">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Order not found.{" "}
        <Link href="/admin/orders" className="text-rose-600 hover:underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const transitions = STATUS_TRANSITIONS[order.status];

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {editOpen && <EditOrderModal order={order} onClose={() => setEditOpen(false)} />}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/orders"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Orders
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-mono text-sm font-semibold">
          #{order.id.slice(0, 8).toUpperCase()}
        </span>
        <span
          className={cn(
            "ml-auto rounded-full px-3 py-1 text-xs font-semibold",
            STATUS_STYLES[order.status]
          )}
        >
          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
        </span>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
        >
          <Pencil className="size-3.5" /> Edit Order
        </button>
      </div>

      {/* Status actions */}
      {transitions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-4">
          <span className="mr-2 self-center text-sm font-medium">Move to:</span>
          {transitions.map((next) => (
            <button
              key={next}
              onClick={() => handleStatus(next)}
              disabled={updateStatus.isPending}
              className="rounded-lg border border-rose-200 bg-white px-4 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
            >
              {next.charAt(0) + next.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order items */}
        <div className="rounded-xl border lg:col-span-2">
          <div className="border-b px-4 py-3 font-semibold">
            Items ({order.itemCount})
          </div>
          <div className="divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-4">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.thumbnail && (
                    <Image
                      src={item.thumbnail}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.productSlug}`}
                    target="_blank"
                    className="line-clamp-1 font-medium hover:text-rose-600"
                  >
                    {item.productName}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {item.color && <span>Color: {item.color}</span>}
                    {item.size && <span>Size: {item.size}</span>}
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-rose-600">
                    ₹{item.lineTotal.toLocaleString("en-IN")}
                  </p>
                  {item.discountAmount > 0 && (
                    <p className="text-xs text-muted-foreground line-through">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Totals */}
          <div className="space-y-1.5 border-t p-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
            </div>
            {order.totalDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Item Discounts</span>
                <span>−₹{order.totalDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}
            {(order.adminDiscount ?? 0) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Admin Discount</span>
                <span>−₹{order.adminDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Delivery Address */}
          <div className="rounded-xl border p-4">
            <h3 className="mb-3 font-semibold">Delivery Address</h3>
            <div className="space-y-0.5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{order.addrFullName}</p>
              <p>{order.addrLine1}</p>
              {order.addrLine2 && <p>{order.addrLine2}</p>}
              <p>
                {order.addrCity}, {order.addrState} – {order.addrPincode}
              </p>
              <a
                href={`tel:${order.addrPhone}`}
                className="flex items-center gap-1 hover:text-rose-600 transition-colors w-fit"
              >
                📞 {order.addrPhone}
              </a>
            </div>
          </div>

          {/* Payment Info */}
          {(order.razorpayOrderId || order.razorpayPaymentId) && (
            <div className="rounded-xl border p-4 text-sm">
              <h3 className="mb-3 font-semibold">Payment Info</h3>
              <div className="space-y-1.5 text-muted-foreground">
                {order.razorpayOrderId && (
                  <div>
                    <p className="text-xs font-medium text-foreground">Razorpay Order ID</p>
                    <p className="font-mono text-xs break-all">{order.razorpayOrderId}</p>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div>
                    <p className="text-xs font-medium text-foreground">Payment ID</p>
                    <p className="font-mono text-xs break-all">{order.razorpayPaymentId}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Info */}
          <div className="rounded-xl border p-4 text-sm">
            <h3 className="mb-3 font-semibold">Order Info</h3>
            <div className="space-y-1.5 text-muted-foreground">
              <div className="flex justify-between">
                <span>Order ID</span>
                <span className="font-mono text-xs">
                  {order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Placed on</span>
                <span>
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>
                  {new Date(order.updatedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          {order.adminNotes && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
              <h3 className="mb-1 font-semibold text-amber-800 dark:text-amber-400">Admin Notes</h3>
              <p className="text-amber-700 dark:text-amber-300 whitespace-pre-wrap">{order.adminNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
