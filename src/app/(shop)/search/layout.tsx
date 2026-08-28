import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";

/**
 * Internal search results are `noindex, follow`.
 *
 * Search-results pages are infinite, thin and near-duplicate — Google's own
 * guidelines call them out as something not to index. `follow` is deliberate:
 * crawlers should still traverse the result links to discover product pages,
 * which is why /search is left crawlable in robots.txt rather than blocked.
 */
export const metadata: Metadata = {
  title: "Search",
  description: `Search the ${SITE_NAME} catalogue of ethnic and contemporary ladies fashion.`,
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
