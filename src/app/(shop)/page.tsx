import type { Metadata } from "next";
import Link from "next/link";
import HomeClient from "./HomeClient";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbSchema,
  categoryListSchema,
  faqSchema,
  itemListSchema,
  organizationSchema,
  websiteSchema,
  type FaqEntry,
} from "@/lib/schema";
import {
  getCategoriesServer,
  getFeaturedServer,
  getNewArrivalsServer,
  getSaleProductsServer,
  getSiteSettingsServer,
  getSocialLinksServer,
  getTrendingServer,
} from "@/lib/server-api";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/seo";

export const metadata: Metadata = {
  // Home page overrides the "%s | Vardhman Textile" template — the brand name
  // belongs at the front of the home page title, not appended to it.
  title: {
    absolute: `${SITE_NAME} — Ethnic & Contemporary Ladies Fashion Online`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — Ethnic & Contemporary Ladies Fashion Online`,
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website",
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Ethnic & Contemporary Ladies Fashion Online`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
};

/**
 * Answer-engine content.
 *
 * Each answer is self-contained and sits in the 40-60 word band that featured
 * snippets, People Also Ask panels and voice assistants extract cleanly. The
 * same strings back the FAQPage markup below, so the visible copy and the
 * structured data never drift apart — Google penalises FAQ markup that has no
 * on-page counterpart.
 *
 * Every claim here restates something the store already commits to elsewhere
 * on the site (the trust strip, the checkout flow, the policy pages). Keep it
 * that way: an invented delivery window or returns figure is a support ticket
 * and a trust problem, not an SEO win.
 */
const FAQS: FaqEntry[] = [
  {
    question: "What does Vardhman Textile sell?",
    answer:
      "Vardhman Textile is an online ladies fashion store specialising in ethnic and contemporary womenswear. The catalogue covers festive and occasion wear alongside everyday styles, organised by category, fabric, colour and occasion so you can shop for a specific function or browse the new season collection.",
  },
  {
    question: "Does Vardhman Textile offer free shipping?",
    answer:
      "Yes. Free shipping is included on orders placed through the Vardhman Textile store, and delivery is available across India. Shipping is confirmed at checkout before payment, so you can see exactly what applies to your order before you pay.",
  },
  {
    question: "How do I track my Vardhman Textile order?",
    answer:
      "Use the Track Order page and enter your order details to see the current status. If you placed the order while signed in, the same information appears under My Orders in your account, along with the full item list and delivery address for that order.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "Checkout is handled through an encrypted payment gateway that accepts credit cards, debit cards, UPI and net banking. Card and bank details are entered on the payment provider's secure form and are never stored by the store itself.",
  },
  {
    question: "Can I order without creating an account?",
    answer:
      "Yes. Vardhman Textile supports guest checkout, so you can add items to your cart and complete an order without registering. Creating an account is optional and adds saved addresses, a wishlist and order history to your next visit.",
  },
  {
    question: "How do returns and exchanges work?",
    answer:
      "Returns and exchanges are governed by the store's Return Policy, which sets out which items are eligible, the window to raise a request and how refunds are issued. Read the current terms on the Return Policy page before placing an order.",
  },
];

export default async function HomePage() {
  // Fetched in parallel; each helper degrades to null rather than throwing, so
  // a slow backend costs the page its seed data, never the render itself.
  const [categories, featured, trending, newArrivals, sale, settings, socialLinks] =
    await Promise.all([
      getCategoriesServer(),
      getFeaturedServer(8),
      getTrendingServer(8),
      getNewArrivalsServer(8),
      getSaleProductsServer(8),
      getSiteSettingsServer(),
      getSocialLinksServer(),
    ]);

  const sameAs = (socialLinks ?? [])
    .filter((link) => link.enabled && link.url)
    .map((link) => link.url);

  const graph: object[] = [
    organizationSchema({ logoUrl: settings?.logoUrl, sameAs }),
    websiteSchema(),
    breadcrumbSchema([{ name: "Home" }]),
    faqSchema(FAQS),
  ];

  if (categories?.length) {
    graph.push(categoryListSchema(categories));
  }

  if (featured?.content?.length) {
    graph.push(
      itemListSchema({
        products: featured.content,
        name: "Featured picks",
        path: "/",
      })
    );
  }

  return (
    <>
      <JsonLd data={graph} />

      <HomeClient
        initialCategories={categories ?? undefined}
        initialFeatured={featured ?? undefined}
        initialTrending={trending ?? undefined}
        initialNewArrivals={newArrivals ?? undefined}
        initialSale={sale ?? undefined}
      />

      {/* Server-rendered answer block. This is the only substantial prose on
          the home page, and because it is server-rendered it is visible to
          crawlers that never run JavaScript — which is how most AI answer
          engines see the site. */}
      <section
        aria-labelledby="faq-heading"
        className="mx-auto w-full max-w-3xl px-4 pb-16"
      >
        <p className="text-xs font-semibold tracking-[0.2em] text-rose-600 uppercase">
          Good to know
        </p>
        <h2
          id="faq-heading"
          className="mt-1 font-heading text-2xl font-bold text-foreground sm:text-3xl"
        >
          Frequently asked questions
        </h2>

        <dl className="mt-6 flex flex-col divide-y divide-border border-t border-border">
          {FAQS.map((faq) => (
            <div key={faq.question} className="py-5">
              <dt className="text-base font-semibold text-foreground">
                {faq.question}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 text-sm text-muted-foreground">
          Still deciding?{" "}
          <Link href="/products" className="font-medium text-rose-600 hover:underline">
            Browse the full collection
          </Link>{" "}
          or read our{" "}
          <Link
            href="/policies/return-policy"
            className="font-medium text-rose-600 hover:underline"
          >
            return policy
          </Link>
          .
        </p>
      </section>
    </>
  );
}
