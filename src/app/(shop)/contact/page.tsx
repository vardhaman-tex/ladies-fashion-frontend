import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MessageCircle, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/seo";
import { SUPPORT_HOURS, SUPPORT_WHATSAPP_DISPLAY, whatsAppLink } from "@/lib/support";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Questions about sizing, delivery or an order? Message ${SITE_NAME} on WhatsApp at ${SUPPORT_WHATSAPP_DISPLAY}. ${SUPPORT_HOURS}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold tracking-[0.2em] text-rose-600 uppercase">
        We&apos;re here to help
      </p>
      <h1 className="mt-1 font-heading text-3xl font-bold text-foreground sm:text-4xl">
        Contact us
      </h1>
      <p className="mt-3 text-muted-foreground">
        Not sure about a size, a fabric or when your order will arrive? Message us and a person
        will reply.
      </p>

      <div className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <MessageCircle className="mt-0.5 size-5 shrink-0 text-green-600" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold">WhatsApp</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The fastest way to reach us. Send a photo of the piece you&apos;re looking at and
              we&apos;ll help from there.
            </p>
            <Button
              className="mt-4"
              size="lg"
              render={<a href={whatsAppLink()} target="_blank" rel="noopener noreferrer" />}
            >
              Chat on {SUPPORT_WHATSAPP_DISPLAY}
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 border-t pt-5">
          <Clock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold">Support hours</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {SUPPORT_HOURS}. Messages sent outside these hours are answered the next working day.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 border-t pt-5">
          <PackageSearch className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold">Where is my order?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <Link href="/track-order" className="font-medium text-rose-600 hover:underline">
                Track your order
              </Link>{" "}
              with your order number and phone number, or read the{" "}
              <Link
                href="/policies/return-policy"
                className="font-medium text-rose-600 hover:underline"
              >
                return policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
