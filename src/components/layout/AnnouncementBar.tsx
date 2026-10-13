"use client";

import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * A scrolling ticker of the three things a first-time visitor wants settled:
 * shipping, paying on delivery, and returns.
 *
 * Deliberately names no fee and no phone number. The COD fee is stated where it
 * is charged (product page, cart, checkout), and WhatsApp has its own button.
 * The returns line says what the published policy actually covers; widen it
 * only if the policy is widened.
 */
export function AnnouncementBar() {
  const { data: settings } = useSiteSettings();
  const codOn = settings?.codEnabled === true;

  const messages = [
    "Free shipping across India",
    ...(codOn ? ["Cash on delivery available"] : []),
    "Easy returns on damaged or wrong items",
  ];

  const row = (hidden: boolean) => (
    <ul
      className="marquee-copy flex shrink-0 items-center"
      aria-hidden={hidden || undefined}
    >
      {messages.map((message) => (
        <li key={message} className="flex items-center whitespace-nowrap px-6 text-xs font-medium">
          {message}
          <span aria-hidden="true" className="ml-12 opacity-50">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee-viewport overflow-hidden bg-rose-600 py-2 text-white">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
