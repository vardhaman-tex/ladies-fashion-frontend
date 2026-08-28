import { getCategoriesServer, getPoliciesServer } from "@/lib/server-api";
import { SITE_LONG_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

/**
 * /llms.txt
 *
 * An emerging convention (llmstxt.org) for handing large language models a
 * clean, plain-text map of a site instead of making them infer one from
 * JavaScript-heavy HTML. Costs nothing, is ignored by engines that don't read
 * it, and gives the ones that do an unambiguous statement of what this store
 * is and where its content lives.
 */
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const [categories, policies] = await Promise.all([
    getCategoriesServer(),
    getPoliciesServer(),
  ]);

  const categoryLines = (categories ?? [])
    .filter((category) => category.isActive)
    .map(
      (category) =>
        `- [${category.name}](${SITE_URL}/products?categorySlug=${category.slug}): ` +
        `${category.description?.trim() || `Shop ${category.name.toLowerCase()} at ${SITE_NAME}.`}`
    );

  const policyLines = (policies ?? [])
    .filter((policy) => policy.visible)
    .map((policy) => `- [${policy.title}](${SITE_URL}/policies/${policy.slug})`);

  const body = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_LONG_DESCRIPTION}`,
    "",
    "## Key pages",
    "",
    `- [Home](${SITE_URL}/): Featured picks, new arrivals, trending styles and current sale items.`,
    `- [All products](${SITE_URL}/products): The full catalogue, filterable by category, colour, fabric, occasion and price.`,
    `- [Search](${SITE_URL}/search?q=): Keyword search across the catalogue.`,
    `- [Track an order](${SITE_URL}/track-order): Order status lookup for shoppers.`,
    "",
    ...(categoryLines.length > 0 ? ["## Categories", "", ...categoryLines, ""] : []),
    ...(policyLines.length > 0 ? ["## Policies", "", ...policyLines, ""] : []),
    "## Notes",
    "",
    `- Product pages live at ${SITE_URL}/products/{slug} and carry schema.org Product markup with current price and stock status.`,
    `- A full URL list is available at ${SITE_URL}/sitemap.xml.`,
    "- Prices are in Indian Rupees (INR) and shipping is within India.",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
