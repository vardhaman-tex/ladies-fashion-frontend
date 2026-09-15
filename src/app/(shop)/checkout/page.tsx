"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Package, ChevronRight, AlertCircle,
  Plus, ShoppingBag, Loader2, RefreshCw, User, Banknote, CreditCard, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/hooks/useCart";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAddresses, ADDRESSES_KEY } from "@/hooks/useAddresses";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useAuthStore } from "@/stores/authStore";
import { useGuestCartStore } from "@/stores/cartStore";
import { AddressFormDialog } from "@/components/address/AddressFormDialog";
import { AddressCardSkeleton } from "@/components/common/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { CheckoutSection } from "@/components/checkout/CheckoutSection";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { GuestAddressFields, guestFieldId } from "@/components/checkout/GuestAddressFields";
import { CheckoutSignIn } from "@/components/checkout/CheckoutSignIn";
import { cn } from "@/lib/utils";
import { ACCOUNT_EXISTS_EMAIL, ACCOUNT_EXISTS_PHONE, ApiError } from "@/lib/apiError";
import { addAddress } from "@/services/addressService";
import { getMe } from "@/services/authService";
import type { AuthResponse } from "@/types/auth";
import type { AddressData } from "@/types/address";
import {
  createRazorpayOrder,
  verifyPayment,
  createGuestRazorpayOrder,
  verifyGuestPayment,
} from "@/services/paymentService";
import { cancelOrder } from "@/services/orderService";
import { formatSizeLabel, formatVariantSummary } from "@/lib/catalogueDisplay";
import {
  getCodAvailability,
  quotePayment,
  type CodAvailability,
  type PaymentQuote,
} from "@/lib/cod";
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
import { trackInitiateCheckout, trackPurchase } from "@/lib/pixel";
import { gaAddPaymentInfo, gaBeginCheckout, gaPurchase } from "@/lib/ga";
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
 * "Pay on delivery", either flavour of it.
 *
 * The customer makes one choice — online or on delivery — and which COD model
 * that becomes depends on whether the store is asking for an advance. Every
 * check that cares about the choice rather than the model goes through here, so
 * turning the advance off does not quietly unselect a customer's COD radio.
 */
function isCod(method: PaymentMethod) {
  return method === "COD_PARTIAL" || method === "COD_FULL";
}

function rupees(amount: number) {
  return amount.toLocaleString("en-IN");
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
  codMethod,
  merchandiseTotal,
  codQuote,
  availability,
  disabled,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  /** Which COD model picking this option would produce, per the store's settings. */
  codMethod: PaymentMethod;
  merchandiseTotal: number;
  /**
   * What COD would cost, whether or not it is the current choice. An option has
   * to describe the thing it offers, so this is the COD quote and not the quote
   * for whatever is selected.
   */
  codQuote: PaymentQuote;
  availability: CodAvailability;
  disabled?: boolean;
}) {
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
              Pay ₹{rupees(merchandiseTotal)} online and you are done.
            </span>
          </span>
        </label>

        <label
          className={cn(
            "flex items-start gap-3 rounded-lg border p-3 transition-colors",
            !availability.available
              ? "cursor-not-allowed opacity-60"
              : isCod(value)
                ? "cursor-pointer border-rose-600 bg-rose-50/50 dark:bg-rose-950/20"
                : "cursor-pointer hover:border-rose-300"
          )}
        >
          <input
            type="radio"
            name="paymentMethod"
            checked={isCod(value)}
            onChange={() => onChange(codMethod)}
            disabled={disabled || !availability.available}
            className="mt-0.5 size-4 shrink-0 accent-rose-600"
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Banknote className="size-4 shrink-0 text-muted-foreground" />
              Cash on delivery
            </span>
            {availability.available ? (
              <span className="block text-xs text-muted-foreground">
                {/* With no advance configured there is nothing to pay now, and
                    saying "₹0 advance payment required" made the option read
                    like a broken one. */}
                {codQuote.isPlaceOnly
                  ? ""
                  : `₹${rupees(codQuote.payableNow)} advance payment required to confirm and process the COD order. The remaining ₹${rupees(codQuote.dueOnDelivery)} is payable at the time of delivery.`}
                {codQuote.fee > 0
                  ? ` Includes a ₹${rupees(codQuote.fee)} cash-on-delivery charge.`
                  : ""}
              </span>
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
  const queryClient = useQueryClient();
  const { cart, isLoading: cartLoading, isMerging } = useCart();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const setUser = useAuthStore((state) => state.setUser);
  const clearGuestCart = useGuestCartStore((state) => state.clearCart);
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const [isProcessing, setIsProcessing] = useState(false);
  const { state: scriptState, retry: retryScript, ensureReady } = useRazorpay();
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
  /**
   * The number the server told us already has an account, which turns the
   * checkout into a sign-in rather than a dead end. Null the rest of the time.
   */
  const [signInPhone, setSignInPhone] = useState<string | null>(null);
  /** The optional email belongs to an account. Dropping it is a way through. */
  const [emailTaken, setEmailTaken] = useState(false);
  /**
   * They signed in from this page rather than arriving signed in. The screen
   * changes under them when that happens, so it owes them a sentence saying
   * what became of the details they had already filled in.
   */
  const [resumedFromSignIn, setResumedFromSignIn] = useState(false);
  const { data: siteSettings } = useSiteSettings();
  const codAdvance = siteSettings?.codAdvanceAmount ?? 0;
  const codFee = siteSettings?.codFeeAmount ?? 0;
  /**
   * Which COD model the store is running, read from the same two settings the
   * server reads. The server still decides — this is what lets the page label
   * the button "Place order" instead of "Pay ₹0 now" before it has asked.
   */
  const codMethod: PaymentMethod = codAdvance > 0 ? "COD_PARTIAL" : "COD_FULL";

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
    // Both collisions are about a specific value, so editing that value takes
    // the question away: a corrected number is not the number with an account,
    // and the sign-in panel would be offering a code to the wrong phone.
    if (field === "phone") setSignInPhone(null);
    if (field === "email") setEmailTaken(false);
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
      isCod(paymentMethod) && guestCodAvailability.available ? codMethod : "PREPAID";
    // Every figure on this page comes from one of these two: the quote for what
    // is selected, and the quote for COD so the COD option can describe itself.
    const guestQuote = quotePayment(guestMethod, guestTotal, codAdvance, codFee);
    const guestCodQuote = quotePayment(codMethod, guestTotal, codAdvance, codFee);

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
      // Wait for checkout.js rather than turning the customer away. They have
      // filled the form in and pressed pay, and telling them to try again in
      // a moment is the worst thing to say at that point in the funnel.
      // Under full COD nothing is collected online, so checkout.js is beside
      // the point and an ad blocker holding it up must not stop the order.
      if (!guestQuote.isPlaceOnly && !window.Razorpay) {
        setIsProcessing(true);
        const scriptReady = await ensureReady();
        setIsProcessing(false);
        if (!scriptReady) {
          toast.error("Payment could not load. Disable any ad blocker and retry.");
          return;
        }
      }

      // Fired on the attempt, not on page load: reaching /checkout is not
      // intent, filling it in and pressing pay is. A pageview-based funnel
      // counted every abandoned tab as an initiated checkout.
      // Built once and reused by the purchase event below, so initiate and
      // purchase are reporting the same basket by construction.
      const pixelGuestItems = guestItems.map((item) => ({
        id: item.productId,
        name: item.productName,
        value: item.finalPrice,
        quantity: item.quantity,
      }));
      // The order's value, COD charge included — that is what the customer
      // pays and what the campaign should be optimising toward.
      trackInitiateCheckout(pixelGuestItems, guestQuote.total);

      // The same moment, reported for GA4's funnel. add_payment_info carries
      // the method, which is the dimension worth having in this business: it is
      // how the COD share of checkouts, and the COD-versus-prepaid drop-off,
      // become readable at all.
      const gaGuestItems = guestItems.map((item) => ({
        item_id: item.productId,
        item_name: item.productName,
        price: item.finalPrice,
        quantity: item.quantity,
      }));
      gaBeginCheckout(gaGuestItems, guestQuote.total);
      gaAddPaymentInfo(gaGuestItems, guestQuote.total, guestMethod);

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

        // Full cash on delivery: the server has already placed the order, and
        // there is no ₹0 payment for the gateway to take. A null razorpayOrderId
        // with zero paise is the agreed signal, so go straight to the
        // confirmation rather than opening a sheet that cannot open.
        if (!orderData.razorpayOrderId || !orderData.keyId || orderData.amountPaise === 0) {
          trackPurchase(orderData.internalOrderId, orderData.orderTotal, pixelGuestItems);
          gaPurchase(
            orderData.internalOrderId,
            orderData.orderTotal,
            gaGuestItems,
            orderData.paymentMethod
          );
          clearGuestCart();
          toast.success(
            `Order placed — ₹${rupees(orderData.amountDueOnDelivery)} to pay on delivery.`
          );
          // The order number, not the UUID: it is what the confirmation page
          // shows and what tracking looks an order up by.
          router.push(`/guest-order-confirmed?orderRef=${orderData.orderNumber}`);
          return;
        }

        // Re-read after the awaits above: the guard that made this safe ran
        // before them, and a type that admits checkout.js might not be there
        // is the honest one.
        const RazorpayCtor = window.Razorpay;
        if (!RazorpayCtor) throw new Error("Payment could not load. Please retry.");
        const rzp = new RazorpayCtor({
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
              // Reports the full order value, not the ₹100 taken now, because
              // that is the revenue the campaign should be optimising toward.
              // Worth revisiting once the RTO rate on COD is known — if refused
              // deliveries are common this systematically overstates ROAS.
              trackPurchase(confirmed.id, guestQuote.total, pixelGuestItems);
              gaPurchase(confirmed.id, guestQuote.total, gaGuestItems, guestMethod);
              clearGuestCart();
              toast.success(
                isCod(guestMethod)
                  ? `Order confirmed — ₹${rupees(guestQuote.dueOnDelivery)} to pay on delivery.`
                  : "Payment successful!"
              );
              // The order number, not the UUID: it is what the confirmation
              // page shows and what tracking looks an order up by.
              router.push(`/guest-order-confirmed?orderRef=${orderData.orderNumber}`);
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
        // Guest checkout keys a customer by their phone number, so one that
        // belongs to a registered account cannot be one. That is not a mistake
        // the customer can fix by trying again, and printing it at them was a
        // dead end at the end of a filled-in form — so offer the way through.
        if (err instanceof ApiError && err.code === ACCOUNT_EXISTS_PHONE) {
          setSignInPhone(normalisePhone(guestForm.phone));
          setIsProcessing(false);
          focusAfterRender("checkout-signin");
          return;
        }
        // The email is optional, and the phone here owns no account, so a code
        // sent to it would sign them into nothing. Dropping the email is the
        // way through, and the panel below offers exactly that.
        if (err instanceof ApiError && err.code === ACCOUNT_EXISTS_EMAIL) {
          setEmailTaken(true);
          setIsProcessing(false);
          focusAfterRender("checkout-email-taken");
          return;
        }
        toast.error(err instanceof Error ? err.message : "Failed to initiate payment.");
        setIsProcessing(false);
      }
    }

    /**
     * The code checked out, so the session cookies are already set.
     *
     * The address goes across before the session is adopted, deliberately: the
     * moment this page knows it is signed in it renders the authenticated
     * checkout, and that screen asks for an address. Saving first means the one
     * they just typed is already there and already selected, so signing in
     * costs a code and nothing else. The cart follows on its own — CartProvider
     * merges it as soon as the session lands.
     */
    async function handleVerified(user: AuthResponse) {
      try {
        const saved = await addAddress({
          fullName: guestForm.fullName.trim(),
          phone: normalisePhone(guestForm.phone),
          addressLine1: guestForm.addressLine1.trim(),
          addressLine2: guestForm.addressLine2.trim() || undefined,
          city: guestForm.city.trim(),
          state: canonicalState(guestForm),
          pincode: guestForm.pincode.trim(),
          isDefault: true,
        });
        // Seeded rather than refetched so the authenticated screen has it on
        // its first render, with no gap where the customer is told they have
        // no saved addresses.
        queryClient.setQueryData<AddressData[]>(ADDRESSES_KEY, (old = []) => [
          saved,
          ...old.filter((a) => a.id !== saved.id).map((a) => ({ ...a, isDefault: false })),
        ]);
        setSelectedAddressId(saved.id);
      } catch {
        // Not fatal: they land on the authenticated checkout with their own
        // saved addresses, and can pick or add one there.
      }

      setSignInPhone(null);
      setResumedFromSignIn(true);
      // Read the profile back rather than believing the auth response, which
      // carries no verification flags — and those are the whole point of having
      // just proven the number.
      try {
        setUser(await getMe());
      } catch {
        setUser({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isEmailVerified: false,
          isMobileVerified: true,
          roles: user.roles,
        });
      }
      toast.success("Signed in — your cart and address came with you.");
    }

    return (
      <>
        {/* checkout.js is loaded by useRazorpay, which asks whether
            window.Razorpay exists rather than trusting a one-shot onLoad. */}
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

          {/*
          minmax(0, …) on both tracks, not a bare 1fr.

          A grid track sized `auto` or `1fr` refuses to go below its content's
          min-content width, and the product title in the order summary is
          `truncate` — which is white-space: nowrap, so its min-content is the
          whole untruncated name. A long product name therefore pushed the
          track to 388px inside a 343px column and the entire page scrolled
          sideways. minmax(0, …) lets the track shrink; the title still
          ellipsises, which was the point of truncate in the first place.
        */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
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
                {/* Solid, not outlined. As an outline button it read as part
                    of the form's chrome and people did not see it as the thing
                    to press. Deliberately not rose: that is reserved for Pay,
                    and two identical-looking primary buttons on one screen is
                    its own kind of confusing. */}
                <Button
                  type="button"
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
                          {formatVariantSummary(item.size, item.color)} × {item.quantity}
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
                  {/* The COD charge is part of the order, so it belongs above
                      the total and inside it — the summary used to show a total
                      with no charge in it while the server charged one. */}
                  {guestQuote.fee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cash on delivery charge</span>
                      <span>₹{rupees(guestQuote.fee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-base font-bold">
                    <span>Total</span>
                    <span>₹{rupees(guestQuote.total)}</span>
                  </div>
                  {isCod(guestMethod) && (
                    <div className="space-y-1 border-t pt-2">
                      {guestQuote.isPlaceOnly ? (
                        <div className="flex justify-between font-medium">
                          <span>Pay on delivery</span>
                          <span>₹{rupees(guestQuote.dueOnDelivery)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between font-medium">
                            <span>Paying now</span>
                            <span>₹{rupees(guestQuote.payableNow)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Cash on delivery</span>
                            <span>₹{rupees(guestQuote.dueOnDelivery)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <PaymentMethodChoice
                value={guestMethod}
                onChange={setPaymentMethod}
                codMethod={codMethod}
                merchandiseTotal={guestTotal}
                codQuote={guestCodQuote}
                availability={guestCodAvailability}
                disabled={isProcessing}
              />

              {/* Silent under full COD: there is no gateway in that flow, so a
                  failed checkout.js is not the customer's problem. */}
              {!guestQuote.isPlaceOnly && scriptState === "error" && (
                <div className="flex items-start justify-between gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>Payment gateway failed to load. Disable any ad blockers and retry.</span>
                  </div>
                  <button
                    onClick={retryScript}
                    className="shrink-0 rounded p-1 hover:bg-red-100"
                    title="Retry loading payment"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>
                </div>
              )}

              {signInPhone && (
                <div id="checkout-signin" tabIndex={-1}>
                  <CheckoutSignIn
                    phone={signInPhone}
                    onVerified={handleVerified}
                    disabled={isProcessing}
                  />
                </div>
              )}

              {emailTaken && (
                <div
                  id="checkout-email-taken"
                  tabIndex={-1}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"
                >
                  <p className="font-semibold">That email belongs to an account</p>
                  <p className="mt-0.5 text-xs">
                    The email is optional here. Remove it to carry on as a guest, or{" "}
                    <Link href="/login?redirect=/checkout" className="font-medium underline">
                      sign in
                    </Link>{" "}
                    to use the account it belongs to.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setField("email", "")}
                  >
                    Remove email and continue
                  </Button>
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
                // While the sign-in panel is up, the code is the next step and
                // pressing this again would only earn the same refusal.
                disabled={
                  isProcessing ||
                  signInPhone !== null ||
                  (!guestQuote.isPlaceOnly && scriptState === "error")
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    {/* Nothing is being collected, so there is nothing to call
                        a payment. "Pay ₹0 now" was the button asking for money
                        the order does not owe. */}
                    {guestQuote.isPlaceOnly
                      ? "Place order"
                      : isCod(guestMethod)
                        ? `Pay ₹${rupees(guestQuote.payableNow)} now`
                        : `Pay ₹${rupees(guestQuote.payableNow)}`}
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
                {guestQuote.isPlaceOnly
                  ? "Pay in cash when your order is delivered"
                  : "Secured by Razorpay · 256-bit SSL encryption"}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Authenticated checkout path ─────────────────────────────────────────────

  /*
    Nothing is known about the cart yet, so say nothing about it.

    The server cart is fetched the moment a session exists, and when that
    session was just created by signing in, the guest cart is still being merged
    into it. Both gaps are a few hundred milliseconds in which the cart is
    legitimately empty — and the branch below read that as "your cart is empty"
    and offered to send the customer shopping, seconds after they filled in a
    checkout. The one case that matters is the one this page now creates.
  */
  if (cartLoading || isMerging) {
    return (
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Getting your cart…</p>
      </div>
    );
  }

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
    isCod(paymentMethod) && codAvailability.available ? codMethod : "PREPAID";
  const quote = quotePayment(activeMethod, cart.total, codAdvance, codFee);
  const codQuote = quotePayment(codMethod, cart.total, codAdvance, codFee);

  // Captured here, where the early return above still has `cart` narrowed to
  // non-null. The Razorpay callbacks further down are closures, and inside
  // them TypeScript no longer knows that.
  const pixelItems = cart.items.map((item) => ({
    id: item.productId,
    name: item.productName,
    value: item.finalPrice,
    quantity: item.quantity,
  }));
  // The order's value, COD charge included — the same figure the summary and
  // the server put on the order.
  const pixelTotal = quote.total;
  // GA4's item shape, which is not the pixel's. Built once here rather than at
  // each event, so begin_checkout, add_payment_info and purchase are reporting
  // the same basket by construction.
  const gaItems = cart.items.map((item) => ({
    item_id: item.productId,
    item_name: item.productName,
    price: item.finalPrice,
    quantity: item.quantity,
  }));

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
    // Wait for checkout.js rather than turning the customer away. They have
    // filled the form in and pressed pay, and telling them to try again in
    // a moment is the worst thing to say at that point in the funnel.
    // Under full COD nothing is collected online, so checkout.js is beside
    // the point and an ad blocker holding it up must not stop the order.
    if (!quote.isPlaceOnly && !window.Razorpay) {
      setIsProcessing(true);
      const scriptReady = await ensureReady();
      setIsProcessing(false);
      if (!scriptReady) {
        toast.error("Payment could not load. Disable any ad blocker and retry.");
        return;
      }
    }

    trackInitiateCheckout(pixelItems, pixelTotal);
    gaBeginCheckout(gaItems, pixelTotal);
    // activeMethod, not the raw radio state: what is reported has to be what
    // the order is actually placed as.
    gaAddPaymentInfo(gaItems, pixelTotal, activeMethod);

    setIsProcessing(true);
    try {
      const orderData = await createRazorpayOrder({
        addressId: activeAddressId,
        paymentMethod: activeMethod,
      });

      // Full cash on delivery: the server has already placed the order, and
      // there is no ₹0 payment for the gateway to take. A null razorpayOrderId
      // with zero paise is the agreed signal, so go straight to the order
      // rather than opening a sheet that cannot open.
      if (!orderData.razorpayOrderId || !orderData.keyId || orderData.amountPaise === 0) {
        trackPurchase(orderData.internalOrderId, orderData.orderTotal, pixelItems);
        gaPurchase(orderData.internalOrderId, orderData.orderTotal, gaItems, orderData.paymentMethod);
        clearGuestCart();
        toast.success(
          `Order placed — ₹${rupees(orderData.amountDueOnDelivery)} to pay on delivery.`
        );
        router.push(`/orders/${orderData.internalOrderId}?confirmed=true`);
        return;
      }

      // Re-read after the awaits above: the guard that made this safe ran
      // before them, and a type that admits checkout.js might not be there
      // is the honest one.
      const RazorpayCtor = window.Razorpay;
      if (!RazorpayCtor) throw new Error("Payment could not load. Please retry.");
      const rzp = new RazorpayCtor({
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
            trackPurchase(confirmedOrder.id, pixelTotal, pixelItems);
            gaPurchase(confirmedOrder.id, pixelTotal, gaItems, activeMethod);
            clearGuestCart();
            toast.success(
              isCod(activeMethod)
                ? `Order confirmed — ₹${rupees(quote.dueOnDelivery)} to pay on delivery.`
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
      {/* checkout.js is loaded by useRazorpay, which asks whether
          window.Razorpay exists rather than trusting a one-shot onLoad. */}
      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <h1 className="mb-6 text-xl font-bold sm:text-2xl">Checkout</h1>

        <CheckoutSteps current={isProcessing ? 3 : activeAddress ? 2 : 1} />

        {/*
          minmax(0, …) on both tracks, not a bare 1fr.

          A grid track sized `auto` or `1fr` refuses to go below its content's
          min-content width, and the product title in the order summary is
          `truncate` — which is white-space: nowrap, so its min-content is the
          whole untruncated name. A long product name therefore pushed the
          track to 388px inside a 343px column and the entire page scrolled
          sideways. minmax(0, …) lets the track shrink; the title still
          ellipsises, which was the point of truncate in the first place.
        */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
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
                        {formatVariantSummary(item.size, item.color)} × {item.quantity}
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
                {/* The COD charge is part of the order, so it belongs above the
                    total and inside it — the summary used to show a total with
                    no charge in it while the server charged one. */}
                {quote.fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cash on delivery charge</span>
                    <span>₹{rupees(quote.fee)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>₹{rupees(quote.total)}</span>
                </div>
                {isCod(activeMethod) && (
                  <div className="space-y-1 border-t pt-2">
                    {quote.isPlaceOnly ? (
                      <div className="flex justify-between font-medium">
                        <span>Pay on delivery</span>
                        <span>₹{rupees(quote.dueOnDelivery)}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between font-medium">
                          <span>Paying now</span>
                          <span>₹{rupees(quote.payableNow)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Cash on delivery</span>
                          <span>₹{rupees(quote.dueOnDelivery)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <PaymentMethodChoice
              value={activeMethod}
              onChange={setPaymentMethod}
              codMethod={codMethod}
              merchandiseTotal={cart.total}
              codQuote={codQuote}
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
                      {item.productName}{item.size ? ` (${formatSizeLabel(item.size)})` : ""} — only {item.availableQty} left, you have {item.quantity} in cart.
                    </p>
                  ))}
                  <p className="mt-1">Please update quantities in your cart before proceeding.</p>
                </div>
              </div>
            )}

            {/* Silent under full COD: there is no gateway in that flow, so a
                failed checkout.js is not the customer's problem. */}
            {!quote.isPlaceOnly && scriptState === "error" && (
              <div className="flex items-start justify-between gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>Payment gateway failed to load. Disable any ad blockers and retry.</span>
                </div>
                <button
                  onClick={retryScript}
                  className="shrink-0 rounded p-1 hover:bg-red-100"
                  title="Retry loading payment"
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

            {resumedFromSignIn && (
              <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-200">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <span>You&apos;re signed in — check your order and place it.</span>
              </div>
            )}

            <Button
              className="w-full gap-2 bg-rose-600 hover:bg-rose-700"
              size="lg"
              onClick={handlePlaceOrder}
              disabled={isProcessing || (!quote.isPlaceOnly && scriptState === "error")}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  {/* Nothing is being collected, so there is nothing to call a
                      payment. "Pay ₹0 now" was the button asking for money the
                      order does not owe. */}
                  {quote.isPlaceOnly
                    ? "Place order"
                    : isCod(activeMethod)
                      ? `Pay ₹${rupees(quote.payableNow)} now`
                      : `Pay ₹${rupees(quote.payableNow)}`}
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
              {quote.isPlaceOnly
                ? "Pay in cash when your order is delivered"
                : "Secured by Razorpay · 256-bit SSL encryption"}
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
