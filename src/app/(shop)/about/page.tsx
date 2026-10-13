import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SITE_LONG_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About Us",
  description: SITE_LONG_DESCRIPTION,
  alternates: { canonical: "/about" },
};

/**
 * Only states what the store already commits to elsewhere (shipping, COD,
 * guest checkout, the dispatch window). Add the founding story, location and
 * team here once the owner has written them; an invented one is worse than none.
 */
const PROMISES = [
  {
    title: "Free shipping across India",
    body: "Every order ships free. Orders are dispatched in 1–2 days and usually arrive in 4–7.",
  },
  {
    title: "Pay the way you prefer",
    body: "Pay online by card, UPI or net banking, or choose cash on delivery on eligible orders.",
  },
  {
    title: "No account needed",
    body: "Check out as a guest. Create an account only if you want saved addresses and order history.",
  },
  {
    title: "A person to ask",
    body: "Questions about size, fabric or delivery go to a real person on WhatsApp.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold tracking-[0.2em] text-rose-600 uppercase">Our story</p>
      <h1 className="mt-1 font-heading text-3xl font-bold text-foreground sm:text-4xl">
        About {SITE_NAME}
      </h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">{SITE_LONG_DESCRIPTION}</p>

      <h2 className="mt-10 font-heading text-2xl font-bold text-foreground">
        How we shop with you
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {PROMISES.map((item) => (
          <div key={item.title} className="rounded-xl border bg-card p-4">
            <dt className="text-sm font-semibold text-foreground">{item.title}</dt>
            <dd className="mt-1 text-sm text-muted-foreground">{item.body}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button size="lg" render={<Link href="/products" />}>
          Shop the collection
        </Button>
        <Button size="lg" variant="outline" render={<Link href="/contact" />}>
          Contact us
        </Button>
      </div>
    </div>
  );
}
