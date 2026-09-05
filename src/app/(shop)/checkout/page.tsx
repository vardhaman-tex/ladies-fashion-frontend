"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import {
  MapPin, Package, ChevronRight, AlertCircle,
  Plus, ShoppingBag, Loader2, RefreshCw, User, Banknote, CreditCard,
} from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/hooks/useCart";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAddresses } from "@/hooks/useAddresses";
import { useAuthStore } from "@/stores/authStore";
import { useGuestCartStore } from "@/stores/cartStore";
import { AddressFormDialog } from "@/components/address/AddressFormDialog";
import { AddressCardSkeleton } from "@/components/common/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { CheckoutSection } from "@/components/checkout/CheckoutSection";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { GuestAddressFields, guestFieldId } from "@/components/checkout/GuestAddressFields";
import { cn } from "@/lib/utils";
import type { AddressData } from "@/types/address";
import {
  createRazorpayOrder,
  verifyPayment,
  createGuestRazorpayOrder,
  verifyGuestPayment,
} from "@/services/paymentService";
import { cancelOrder } from "@/services/orderService";
import { getCodAvailability, amountPayableNow, type CodAvailability } from "@/lib/cod";
import {
  canonicalState,
  firstErrorField,
  formatGuestAddress,
  isGuestAddressComplete,
  normalisePhone,
  validateGuestAddress,
  type GuestAddressErrors,
  type GuestAddressField,
  type GuestAddressForm,
} from "@/lib/checkoutAddress";
import type { PaymentMethod } from "@/types/payment";

/**
 * Sends the customer to the thing that is wrong with their order.
 *
 * Deferred by a tick because the handler that calls this may have just expanded
 * a collapsed section, and the field it wants to focus is not in the DOM until
 * React has committed that render.
 */
function focusAfterRender(elementId: string) {
  window.setTimeout(() => {
    const element = document.getElementById(elementId);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (element instanceof HTMLElement) element.focus({ preventScroll: true });
  }, 0);
}

function formatAddress(a: AddressData) {
  return [a.addressLine1, a.addressLine2, a.city, a.state, a.pincode]
    .filter(Boolean)
    .join(", ");
}

/**
 * How the customer wants to pay.
 *
 * COD is shown even when it is unavailable, with the reason, rather than being
 * hidden: "why can't I pay on delivery?" is a question people otherwise ask
 * support, and the answer is usually something they can act on by adding an
 * item or removing one.
 */
function PaymentMethodChoice({
  value,
  onChange,
  orderTotal,
  advanceAmount,
  availability,
  disabled,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  orderTotal: number;
  advanceAmount: number;
  availability: CodAvailability;
  disabled?: boolean;
}) {
  const dueOnDelivery = Math.max(orderTotal - Math.min(advanceAmount, orderTotal), 0);

  return (
    <div className="rounded-xl border p-4">
      <h2 className="mb-3 text-sm font-semibold">Payment method</h2>
      <div className="space-y-2">
        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
            value === "PREPAID" ? "border-rose-600 bg-rose-50/50 dark:bg-rose-950/20" : "hover:border-rose-300"
          )}
        >
          <input
            type="radio"
            name="paymentMethod"
            checked={value === "PREPAID"}
            onChange={() => onChange("PREPAID")}
            disabled={disabled}
            className="mt-0.5 size-4 shrink-0 accent-rose-600"
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <CreditCard className="size-4 shrink-0 text-muted-foreground" />
              Pay now
            </span>
            <span className="block text-xs text-muted-foreground">
              Pay ₹{orderTotal.toLocaleString("en-IN")} online and you are done.
            </span>
          </span>
        </label>

        <label
          className={cn(
            "flex items-start gap-3 rounded-lg border p-3 transition-colors",
            !availability.available
              ? "cursor-not-allowed opacity-60"
              : value === "COD_PARTIAL"
                ? "cursor-pointer border-rose-600 bg-rose-50/50 dark:bg-rose-950/20"
                : "cursor-pointer hover:border-rose-300"
          )}
        >
          <input
            type="radio"
            name="paymentMethod"
            checked={value === "COD_PARTIAL"}
            onChange={() => onChange("COD_PARTIAL")}
            disabled={disabled || !availability.available}
            className="mt-0.5 size-4 shrink-0 accent-rose-600"
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Banknote className="size-4 shrink-0 text-muted-foreground" />
              Cash on delivery
            </span>
            {availability.available ? (
              <>
                <span className="block text-xs text-muted-foreground">
                  ₹{Math.min(advanceAmount, orderTotal).toLocaleString("en-IN")} advance payment required to
                  confirm and process the COD order. The remaining
                  ₹{dueOnDelivery.toLocaleString("en-IN")} is payable at the time of delivery.
                </span>
              </>
            ) : (
              <span className="block text-xs text-muted-foreground">{availability.reason}</span>
            )}
          </span>
        </label>
      </div>
    </div>
  );
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PREPAID");
  // Whether the address step is expanded. null means "not decided yet", which
  // each path resolves for itself: a guest starts open on an empty form, a
  // returning customer starts collapsed on the address they already saved.
  const [addressOpen, setAddressOpen] = useState<boolean | null>(null);
  // Errors stay hidden until the customer has actually tried to pay. Turning a
  // form red before they have typed anything is its own kind of friction.
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<GuestAddressErrors>({});
  const [policyError, setPolicyError] = useState(false);
  const { data: siteSettings } = useSiteSettings();
  const codAdvance = siteSettings?.codAdvanceAmount ?? 0;

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addAddrOpen, setAddAddrOpen] = useState(false);

  const activeAddressId = selectedAddressId ?? defaultAddress?.id ?? null;
  const activeAddress = addresses.find((a) => a.id === activeAddressId) ?? null;

  // Guest form state — only used when !isAuthenticated
  const [guestForm, setGuestForm] = useState<GuestAddressForm>({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  function setField(field: GuestAddressField, value: string) {
    const next = { ...guestForm, [field]: value };
    setGuestForm(next);
    // After a failed attempt, errors clear as the customer fixes them rather
    // than waiting for them to fail again.
    if (hasSubmitted) setFieldErrors(validateGuestAddress(next));
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
    const guestCodAvailability = getCodAvailability(siteSettings, guestTotal);
    // If the cart changed after the choice was made and COD no longer qualifies,
    // fall back rather than sending the server a choice it will refuse.
    const guestMethod: PaymentMethod =
      paymentMethod === "COD_PARTIAL" && guestCodAvailability.available ? "COD_PARTIAL" : "PREPAID";
    const guestPayableNow = amountPayableNow(guestMethod, guestTotal, codAdvance);
    const guestDueOnDelivery = guestTotal - guestPayableNow;

    // Starts closed on the dashed placeholder, so the first screenful is the
    // order rather than eight empty fields. One extra tap before a guest can
    // type — worth watching in the funnel once events are wired.
    const guestAddressOpen = addressOpen ?? false;
    // No summary until the address is actually usable, which is also what stops
    // the section folding away into a half-answer.
    const guestSummary = isGuestAddressComplete(guestForm) ? (
      <>
        <p className="font-medium text-foreground">{guestForm.fullName.trim()}</p>
        <p>
          {normalisePhone(guestForm.phone)}
          {guestForm.email.trim() ? ` · ${guestForm.email.trim()}` : ""}
        </p>
        <p>{formatGuestAddress(guestForm)}</p>
      </>
    ) : undefined;

    /**
     * Why the order cannot be placed yet, in the order the customer would hit
     * the problems. Shown under the pay button so the answer is readable
     * without clicking; the click itself still jumps to the offending field.
     */
    const guestBlockReason = !isGuestAddressComplete(guestForm)
      ? "Add your delivery address above to continue."
      : !policyAgreed
        ? "Tick the policy checkbox above to continue."
        : null;

    /** Validates, and sends the customer to the first problem. True when clean. */
    function checkGuestAddress(): boolean {
      const errors = validateGuestAddress(guestForm);
      setHasSubmitted(true);
      setFieldErrors(errors);
      const firstBad = firstErrorField(errors);
      if (!firstBad) return true;
      setAddressOpen(true);
      focusAfterRender(guestFieldId(firstBad));
      return false;
    }

    async function handleGuestPlaceOrder() {
      if (!checkGuestAddress()) {
        toast.error("Please complete your delivery details.");
        return;
      }
      if (!policyAgreed) {
        setPolicyError(true);
        focusAfterRender("checkout-policy");
        return;
      }
      setPolicyError(false);
      if (!window.Razorpay) {
        toast.error("Payment is still loading \u2014 please try again in a moment.");
        return;
      }

      // `state` is deliberately absent: it goes through canonicalState below
      // rather than being sent as typed.
      const { fullName, phone, email, addressLine1, city, pincode } = guestForm;

      setIsProcessing(true);
      try {
        const orderData = await createGuestRazorpayOrder({
          fullName: fullName.trim(),
          // Stored as bare digits so "+91 98765 43210" and "9876543210" are not
          // two different customers.
          phone: normalisePhone(phone),
          // email is optional — only include it when the user provided one
          ...(email.trim() && { email: email.trim() }),
          addressLine1: addressLine1.trim(),
          addressLine2: guestForm.addressLine2.trim() || undefined,
          city: city.trim(),
          // Canonical spelling, not whatever shorthand was typed — the courier
          // manifest is downstream of this.
          state: canonicalState(guestForm),
          pincode: pincode.trim(),
          items: guestItems.map((item) => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
          paymentMethod: guestMethod,
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
              toast.success(
                guestMethod === "COD_PARTIAL"
                  ? `Order confirmed — ₹${guestDueOnDelivery.toLocaleString("en-IN")} to pay on delivery.`
                  : "Payment successful!"
              );
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
          <h1 className="mb-6 text-xl font-bold sm:text-2xl">Checkout</h1>

          <CheckoutSteps
            current={isProcessing ? 3 : isGuestAddressComplete(guestForm) ? 2 : 1}
          />

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
            <div className="space-y-6">
              <CheckoutSection
                title="Delivery Details"
                icon={<MapPin className="size-5" />}
                open={guestAddressOpen}
                onOpenChange={setAddressOpen}
                summary={guestSummary}
                placeholder="Add delivery address"
              >
                <GuestAddressFields
                  form={guestForm}
                  errors={fieldErrors}
                  onChange={setField}
                  disabled={isProcessing}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full"
                  disabled={isProcessing}
                  onClick={() => {
                    if (checkGuestAddress()) setAddressOpen(false);
                  }}
                >
                  Confirm address
                </Button>
              </CheckoutSection>
            </div>

            {/* Right: Order Summary */}
            <div className="space-y-4">
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
                  {guestMethod === "COD_PARTIAL" && (
                    <div className="space-y-1 border-t pt-2">
                      <div className="flex justify-between font-medium">
                        <span>Paying now</span>
                        <span>₹{guestPayableNow.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Cash on delivery</span>
                        <span>₹{guestDueOnDelivery.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <PaymentMethodChoice
                value={guestMethod}
                onChange={setPaymentMethod}
                orderTotal={guestTotal}
                advanceAmount={codAdvance}
                availability={guestCodAvailability}
                disabled={isProcessing}
              />

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

              <div>
                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <input
                    id="checkout-policy"
                    type="checkbox"
                    checked={policyAgreed}
                    onChange={(e) => {
                      setPolicyAgreed(e.target.checked);
                      if (e.target.checked) setPolicyError(false);
                    }}
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
                {policyError && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                    Please accept the policy to place your order.
                  </p>
                )}
              </div>

              <Button
                className="w-full gap-2 bg-rose-600 hover:bg-rose-700"
                size="lg"
                onClick={handleGuestPlaceOrder}
                disabled={isProcessing || scriptState === "error"}
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
                    {guestMethod === "COD_PARTIAL"
                      ? `Pay ₹${guestPayableNow.toLocaleString("en-IN")} now`
                      : `Pay ₹${guestPayableNow.toLocaleString("en-IN")}`}
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>

              {guestBlockReason && (
                <p className="text-center text-sm font-medium text-rose-700 dark:text-rose-400">
                  {guestBlockReason}
                </p>
              )}

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

  const codAvailability = getCodAvailability(siteSettings, cart.total);
  // Same fallback as the guest path: never send a choice the server will refuse.
  const activeMethod: PaymentMethod =
    paymentMethod === "COD_PARTIAL" && codAvailability.available ? "COD_PARTIAL" : "PREPAID";
  const payableNow = amountPayableNow(activeMethod, cart.total, codAdvance);
  const dueOnDelivery = cart.total - payableNow;

  // A returning customer has already answered this step, so it opens collapsed
  // on their default address and gets out of the way of the pay button.
  const authAddressOpen = addressOpen ?? !defaultAddress;
  // Same three reasons the click handler checks, in the same order, so the
  // line under the button and the jump-to-problem never disagree.
  const authBlockReason = !activeAddressId
    ? "Add your delivery address above to continue."
    : stockIssues.length > 0
      ? "Update the quantities in your cart to continue."
      : !policyAgreed
        ? "Tick the policy checkbox above to continue."
        : null;

  const authSummary = activeAddress ? (
    <>
      <p className="font-medium text-foreground">{activeAddress.fullName}</p>
      <p>{activeAddress.phone}</p>
      <p>{formatAddress(activeAddress)}</p>
    </>
  ) : undefined;

  async function handlePlaceOrder() {
    if (!activeAddressId) {
      setAddressOpen(true);
      focusAfterRender("checkout-address");
      toast.error("Please select a delivery address.");
      return;
    }
    if (stockIssues.length > 0) {
      focusAfterRender("checkout-stock-issues");
      toast.error("Some items exceed available stock. Please update your cart.");
      return;
    }
    if (!policyAgreed) {
      setPolicyError(true);
      focusAfterRender("checkout-policy");
      return;
    }
    setPolicyError(false);
    if (!window.Razorpay) {
      toast.error("Payment is still loading \u2014 please try again in a moment.");
      return;
    }

    setIsProcessing(true);
    try {
      const orderData = await createRazorpayOrder({
        addressId: activeAddressId,
        paymentMethod: activeMethod,
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
            const confirmedOrder = await verifyPayment({
              internalOrderId: orderData.internalOrderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearGuestCart();
            toast.success(
              activeMethod === "COD_PARTIAL"
                ? `Order confirmed — ₹${dueOnDelivery.toLocaleString("en-IN")} to pay on delivery.`
                : "Payment successful!"
            );
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
        <h1 className="mb-6 text-xl font-bold sm:text-2xl">Checkout</h1>

        <CheckoutSteps current={isProcessing ? 3 : activeAddress ? 2 : 1} />

        <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
          {/* Left: Delivery Address */}
          <div className="space-y-6">
            <CheckoutSection
              id="checkout-address"
              title="Delivery Address"
              icon={<MapPin className="size-5" />}
              open={authAddressOpen}
              onOpenChange={setAddressOpen}
              summary={authSummary}
              placeholder="Add delivery address"
              editLabel="Change"
              headerAction={
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-rose-600"
                  onClick={() => setAddAddrOpen(true)}
                >
                  <Plus className="size-3.5" /> Add New
                </Button>
              }
            >
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
                        onClick={() => {
                          setSelectedAddressId(address.id);
                          // Picking an address answers the step, so fold it away
                          // rather than making them scroll past the list again.
                          setAddressOpen(false);
                        }}
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
            </CheckoutSection>
          </div>

          {/* Right: Order Summary */}
          <div className="space-y-4">
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
                {activeMethod === "COD_PARTIAL" && (
                  <div className="space-y-1 border-t pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Paying now</span>
                      <span>₹{payableNow.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Cash on delivery</span>
                      <span>₹{dueOnDelivery.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <PaymentMethodChoice
              value={activeMethod}
              onChange={setPaymentMethod}
              orderTotal={cart.total}
              advanceAmount={codAdvance}
              availability={codAvailability}
              disabled={isProcessing}
            />

            {stockIssues.length > 0 && (
              <div
                id="checkout-stock-issues"
                className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400"
              >
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

            <div>
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  id="checkout-policy"
                  type="checkbox"
                  checked={policyAgreed}
                  onChange={(e) => {
                    setPolicyAgreed(e.target.checked);
                    if (e.target.checked) setPolicyError(false);
                  }}
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
              {policyError && (
                <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                  Please accept the policy to place your order.
                </p>
              )}
            </div>

            <Button
              className="w-full gap-2 bg-rose-600 hover:bg-rose-700"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={isProcessing || scriptState === "error"}
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
                  {activeMethod === "COD_PARTIAL"
                    ? `Pay ₹${payableNow.toLocaleString("en-IN")} now`
                    : `Pay ₹${payableNow.toLocaleString("en-IN")}`}
                  <ChevronRight className="size-4" />
                </>
              )}
            </Button>

            {authBlockReason && (
              <p className="text-center text-sm font-medium text-rose-700 dark:text-rose-400">
                {authBlockReason}
              </p>
            )}

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
