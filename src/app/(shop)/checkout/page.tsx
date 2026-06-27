"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import {
  MapPin, Package, ChevronRight, AlertCircle,
  Plus, ShoppingBag, Loader2, RefreshCw, User,
} from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/hooks/useCart";
import { useAddresses } from "@/hooks/useAddresses";
import { useAuthStore } from "@/stores/authStore";
import { useGuestCartStore } from "@/stores/cartStore";
import { AddressFormDialog } from "@/components/address/AddressFormDialog";
import { AddressCardSkeleton } from "@/components/common/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AddressData } from "@/types/address";
import {
  createRazorpayOrder,
  verifyPayment,
  createGuestRazorpayOrder,
  verifyGuestPayment,
} from "@/services/paymentService";
import { cancelOrder } from "@/services/orderService";

function formatAddress(a: AddressData) {
  return [a.addressLine1, a.addressLine2, a.city, a.state, a.pincode]
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const clearGuestCart = useGuestCartStore((state) => state.clearCart);
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptState, setScriptState] = useState<null | "ready" | "error">(null);
  const [policyAgreed, setPolicyAgreed] = useState(false);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addAddrOpen, setAddAddrOpen] = useState(false);

  const activeAddressId = selectedAddressId ?? defaultAddress?.id ?? null;
  const activeAddress = addresses.find((a) => a.id === activeAddressId) ?? null;

  // Guest form state — only used when !isAuthenticated
  const [guestForm, setGuestForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  function setField(field: keyof typeof guestForm, value: string) {
    setGuestForm((prev) => ({ ...prev, [field]: value }));
  }

  // ─── Auth loading ───────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Guest checkout path ─────────────────────────────────────────────────────
  if (!isAuthenticated) {
    const guestItems = cart?.items ?? [];

    if (guestItems.length === 0) {
      return (
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="mx-auto mb-4 size-16 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Your cart is empty</h2>
          <p className="mb-6 text-muted-foreground">Add some items before checking out.</p>
          <Button render={<Link href="/products" />}>Continue Shopping</Button>
        </div>
      );
    }

    const guestSubtotal = cart!.subtotal;
    const guestDiscount = cart!.totalDiscount;
    const guestTotal = cart!.total;

    const guestAddressValid =
      guestForm.fullName.trim() !== "" &&
      guestForm.phone.trim() !== "" &&
      guestForm.addressLine1.trim() !== "" &&
      guestForm.city.trim() !== "" &&
      guestForm.state.trim() !== "" &&
      guestForm.pincode.trim() !== "";

    async function handleGuestPlaceOrder() {
      const { fullName, phone, email, addressLine1, city, state, pincode } = guestForm;
      if (!fullName.trim() || !phone.trim() || !addressLine1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (!policyAgreed) {
        toast.error("Please agree to the Cancellation, Return, Refund & Exchange Policy");
        return;
      }
      if (!window.Razorpay) {
        toast.error("Payment gateway not ready. Please refresh the page.");
        return;
      }

      setIsProcessing(true);
      try {
        const orderData = await createGuestRazorpayOrder({
          fullName: fullName.trim(),
          phone: phone.trim(),
          // email is optional — only include it when the user provided one
          ...(email.trim() && { email: email.trim() }),
          addressLine1: addressLine1.trim(),
          addressLine2: guestForm.addressLine2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          items: guestItems.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
        });

        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.amountPaise,
          currency: orderData.currency,
          name: "Vardhman Textile",
          description: "Order Payment",
          order_id: orderData.razorpayOrderId,
          prefill: {
            name: orderData.customerName,
            email: orderData.customerEmail,
            contact: orderData.customerPhone,
          },
          theme: { color: "#e11d48" },
          handler: async (response) => {
            try {
              const confirmed = await verifyGuestPayment({
                internalOrderId: orderData.internalOrderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              clearGuestCart();
              toast.success("Payment successful!");
              // orderRef: swap confirmed.id → confirmed.orderNumber once backend ships that field
              const orderRef = confirmed.id;
              router.push(`/guest-order-confirmed?orderRef=${orderRef}`);
            } catch {
              toast.error("Payment verification failed. Contact support.");
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              toast("Payment cancelled.");
              setIsProcessing(false);
            },
          },
        });
        rzp.open();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to initiate payment.");
        setIsProcessing(false);
      }
    }

    return (
      <>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
          onLoad={() => setScriptState("ready")}
          onError={() => setScriptState("error")}
        />

        <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
          <h1 className="mb-6 text-xl font-bold sm:mb-8 sm:text-2xl">Checkout</h1>

          <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300">
            <User className="size-4 shrink-0" />
            <span>
              Checking out as guest.{" "}
              <Link href="/login?redirect=/checkout" className="font-medium underline">
                Sign in
              </Link>{" "}
              for faster checkout and order history.
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
            {/* Left: Guest delivery details form */}
            <div className="order-2 space-y-6 lg:order-1">
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="size-5 text-rose-600" />
                  Delivery Details
                </h2>

                <div className="space-y-4 rounded-xl border p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="g-fullName">Full Name *</Label>
                      <Input
                        id="g-fullName"
                        placeholder="Jane Doe"
                        value={guestForm.fullName}
                        onChange={(e) => setField("fullName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="g-phone">Phone *</Label>
                      <Input
                        id="g-phone"
                        type="tel"
                        placeholder="9876543210"
                        value={guestForm.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="g-email">
                      Email{" "}
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="g-email"
                      type="email"
                      placeholder="you@example.com"
                      value={guestForm.email}
                      onChange={(e) => setField("email", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="g-addr1">Address Line 1 *</Label>
                    <Input
                      id="g-addr1"
                      placeholder="House / Flat no., Street"
                      value={guestForm.addressLine1}
                      onChange={(e) => setField("addressLine1", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="g-addr2">
                      Address Line 2{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="g-addr2"
                      placeholder="Landmark, Area"
                      value={guestForm.addressLine2}
                      onChange={(e) => setField("addressLine2", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="g-city">City *</Label>
                      <Input
                        id="g-city"
                        placeholder="Mumbai"
                        value={guestForm.city}
                        onChange={(e) => setField("city", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="g-state">State *</Label>
                      <Input
                        id="g-state"
                        placeholder="Maharashtra"
                        value={guestForm.state}
                        onChange={(e) => setField("state", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="g-pincode">Pincode *</Label>
                      <Input
                        id="g-pincode"
                        placeholder="400001"
                        maxLength={6}
                        value={guestForm.pincode}
                        onChange={(e) => setField("pincode", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right: Order Summary */}
            <div className="order-1 space-y-4 lg:order-2">
              <div className="rounded-xl border p-5">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Package className="size-5 text-rose-600" />
                  Order Summary
                </h2>

                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {guestItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
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
                        <p className="truncate text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {[item.size, item.color].filter(Boolean).join(" · ")} × {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-rose-600">
                          ₹{(item.finalPrice * item.quantity).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{guestSubtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {guestDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>−₹{guestDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-base font-bold">
                    <span>Total</span>
                    <span>₹{guestTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {scriptState === "error" && (
                <div className="flex items-start justify-between gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>Payment gateway failed to load. Disable any ad blockers and retry.</span>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="shrink-0 rounded p-1 hover:bg-red-100"
                    title="Reload page"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>
                </div>
              )}

              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={policyAgreed}
                  onChange={(e) => setPolicyAgreed(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-rose-600"
                />
                <span>
                  I have read and agree to the{" "}
                  <Link
                    href="/policies/return-policy"
                    target="_blank"
                    className="font-medium text-rose-600 underline hover:text-rose-700"
                  >
                    Cancellation, Return, Refund &amp; Exchange Policy
                  </Link>
                  .
                </span>
              </label>

              <Button
                className="w-full gap-2 bg-rose-600 hover:bg-rose-700"
                size="lg"
                onClick={handleGuestPlaceOrder}
                disabled={isProcessing || scriptState === "error" || !guestAddressValid || !policyAgreed}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing…
                  </>
                ) : scriptState === null ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Loading payment…
                  </>
                ) : (
                  <>
                    Pay ₹{guestTotal.toLocaleString("en-IN")}
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Secured by Razorpay · 256-bit SSL encryption
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Authenticated checkout path (unchanged) ─────────────────────────────────

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto mb-4 size-16 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">Your cart is empty</h2>
        <p className="mb-6 text-muted-foreground">Add some items before checking out.</p>
        <Button render={<Link href="/products" />}>Continue Shopping</Button>
      </div>
    );
  }

  // Items where the ordered qty exceeds available stock
  const stockIssues = cart?.items.filter(
    (item) => item.availableQty !== undefined && item.quantity > item.availableQty
  ) ?? [];

  async function handlePlaceOrder() {
    if (!activeAddressId) {
      toast.error("Please select a delivery address");
      return;
    }
    if (stockIssues.length > 0) {
      toast.error("Some items exceed available stock. Please update your cart.");
      return;
    }
    if (!policyAgreed) {
      toast.error("Please agree to the Cancellation, Return, Refund & Exchange Policy");
      return;
    }
    if (!window.Razorpay) {
      toast.error("Payment gateway not ready. Please refresh the page.");
      return;
    }

    setIsProcessing(true);
    try {
      const orderData = await createRazorpayOrder({ addressId: activeAddressId });

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency,
        name: "Vardhman Textile",
        description: "Order Payment",
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          contact: orderData.customerPhone,
        },
        theme: { color: "#e11d48" },
        handler: async (response) => {
          try {
            const confirmedOrder = await verifyPayment({
              internalOrderId: orderData.internalOrderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearGuestCart();
            toast.success("Payment successful!");
            router.push(`/orders/${confirmedOrder.id}?confirmed=true`);
          } catch {
            toast.error("Payment verification failed. Contact support.");
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            // The order (and its stock deduction) was already created by
            // createRazorpayOrder above — cancel it now so the stock is
            // released immediately instead of being stuck against an
            // abandoned PENDING order indefinitely.
            cancelOrder(orderData.internalOrderId).catch(() => {
              /* best-effort cleanup — order just stays PENDING if this fails */
            });
            toast("Payment cancelled.");
            setIsProcessing(false);
          },
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to initiate payment.");
      setIsProcessing(false);
    }
  }

  return (
    <>
      {/* Load Razorpay checkout.js via Next.js Script — more reliable than dynamic DOM insert */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptState("ready")}
        onError={() => setScriptState("error")}
      />

      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <h1 className="mb-6 text-xl font-bold sm:mb-8 sm:text-2xl">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
          {/* Left: Delivery Address */}
          <div className="order-2 space-y-6 lg:order-1">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <MapPin className="size-5 text-rose-600" />
                  Delivery Address
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-rose-600"
                  onClick={() => setAddAddrOpen(true)}
                >
                  <Plus className="size-3.5" /> Add New
                </Button>
              </div>

              {addressesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <AddressCardSkeleton key={i} />
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                  <p className="mb-3">No saved addresses.</p>
                  <Button size="sm" onClick={() => setAddAddrOpen(true)}>
                    Add Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => {
                    const isSelected = address.id === activeAddressId;
                    return (
                      <button
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition-colors",
                          isSelected
                            ? "border-rose-600 bg-rose-50 dark:bg-rose-950/20"
                            : "border-border hover:border-muted-foreground/40"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{address.fullName}</span>
                              {address.isDefault && (
                                <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-400">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatAddress(address)}
                            </p>
                            <p className="mt-0.5 text-sm text-muted-foreground">{address.phone}</p>
                          </div>
                          <div
                            className={cn(
                              "mt-1 size-4 shrink-0 rounded-full border-2 transition-colors",
                              isSelected
                                ? "border-rose-600 bg-rose-600"
                                : "border-muted-foreground/40"
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right: Order Summary */}
          <div className="order-1 space-y-4 lg:order-2">
            <div className="rounded-xl border p-5">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Package className="size-5 text-rose-600" />
                Order Summary
              </h2>

              <div className="max-h-64 space-y-3 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
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
                      <p className="truncate text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {[item.size, item.color].filter(Boolean).join(" · ")} × {item.quantity}
                      </p>
                      {item.availableQty !== undefined && item.quantity > item.availableQty && (
                        <p className="text-xs font-medium text-red-600">
                          Only {item.availableQty} left
                        </p>
                      )}
                      <p className="text-sm font-semibold text-rose-600">
                        ₹{(item.finalPrice * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{cart.subtotal.toLocaleString("en-IN")}</span>
                </div>
                {cart.totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>−₹{cart.totalDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>₹{cart.total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {!activeAddress && addresses.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>Please select a delivery address.</span>
              </div>
            )}

            {stockIssues.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-semibold">Insufficient stock:</p>
                  {stockIssues.map((item) => (
                    <p key={item.id}>
                      {item.productName}{item.size ? ` (${item.size})` : ""} — only {item.availableQty} left, you have {item.quantity} in cart.
                    </p>
                  ))}
                  <p className="mt-1">Please update quantities in your cart before proceeding.</p>
                </div>
              </div>
            )}

            {scriptState === "error" && (
              <div className="flex items-start justify-between gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>Payment gateway failed to load. Disable any ad blockers and retry.</span>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="shrink-0 rounded p-1 hover:bg-red-100"
                  title="Reload page"
                >
                  <RefreshCw className="size-3.5" />
                </button>
              </div>
            )}

            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={policyAgreed}
                onChange={(e) => setPolicyAgreed(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-rose-600"
              />
              <span>
                I have read and agree to the{" "}
                <Link
                  href="/policies/return-policy"
                  target="_blank"
                  className="font-medium text-rose-600 underline hover:text-rose-700"
                >
                  Cancellation, Return, Refund &amp; Exchange Policy
                </Link>
                .
              </span>
            </label>

            <Button
              className="w-full gap-2 bg-rose-600 hover:bg-rose-700"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={isProcessing || !activeAddressId || scriptState === "error" || stockIssues.length > 0 || !policyAgreed}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing…
                </>
              ) : scriptState === null ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Loading payment…
                </>
              ) : (
                <>
                  Pay ₹{cart.total.toLocaleString("en-IN")}
                  <ChevronRight className="size-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Secured by Razorpay · 256-bit SSL encryption
            </p>
          </div>
        </div>

        <AddressFormDialog
          open={addAddrOpen}
          onClose={() => setAddAddrOpen(false)}
        />
      </div>
    </>
  );
}
