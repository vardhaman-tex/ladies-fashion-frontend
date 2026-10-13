"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { estimateDelivery, formatDeliveryWindow, isPincode, lookupPincode } from "@/lib/pincode";

/**
 * "When will it get to me?", answered on the product page instead of at the
 * end of checkout.
 *
 * Without a pincode it shows the standard window; with one it names the place,
 * which is the shopper's confirmation that we know where they are. It does not
 * claim a courier serves the pincode — that needs a courier's own coverage
 * data, and until there is one, saying so would be a guess dressed as a fact.
 */
export function DeliveryCheck() {
  const [pin, setPin] = useState("");
  const valid = isPincode(pin);

  const { data: place, isFetching } = useQuery({
    queryKey: ["pincode", pin],
    queryFn: () => lookupPincode(pin),
    enabled: valid,
    staleTime: Infinity,
  });

  // The date depends on "today" in the browser's timezone, which differs from
  // the server's around midnight; the hydration warning is suppressed for it
  // because the client's value is the right one.
  const deliveryWindow = formatDeliveryWindow(estimateDelivery());

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2.5 text-sm">
        <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          Estimated delivery{" "}
          <span className="font-medium" suppressHydrationWarning>
            {deliveryWindow}
          </span>
          {valid && place ? (
            <>
              {" "}
              to <span className="font-medium">{place.city ? `${place.city}, ` : ""}{place.state}</span>
            </>
          ) : null}
        </span>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="shrink-0">Check your pincode</span>
        <Input
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="6 digits"
          aria-label="Delivery pincode"
          className="h-9 w-28"
        />
        {valid && isFetching && <span aria-live="polite">Checking…</span>}
      </label>
    </div>
  );
}
