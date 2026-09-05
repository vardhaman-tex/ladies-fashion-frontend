/**
 * Colour as part of the address, not just as component state.
 *
 * A product page can show three colourways, and until now all three were the
 * same URL. That costs in three places at once:
 *
 *   - The Meta catalog feed splits items by colour and size, but every one of
 *     them linked to the bare product URL. A dynamic ad showing the rani
 *     colourway landed the shopper on whichever variant happened to be first,
 *     so the ad and the page disagreed at the moment of arrival.
 *   - Sharing a product over WhatsApp — the way most of this store's traffic
 *     actually travels — sent the colour the sender was not looking at.
 *   - Going back from the cart, or reloading, silently reset the choice.
 *
 * The colour lives in a query parameter rather than a path segment on purpose.
 * With ~20 products, giving every colourway its own indexable URL would create
 * more thin, near-identical pages than ranking value, so the product page keeps
 * one canonical address and the parameter only steers what is selected.
 */

/**
 * Builds a stable, URL-safe fragment from a colour name.
 *
 * Deliberately identical to the fragment builder in `meta-feed.ts`, which is
 * baked into every `g:id` in the catalog. If these two ever disagree, a feed
 * item's link points at a colour the page cannot resolve — so meta-feed imports
 * this rather than keeping its own copy.
 */
export function colourSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "na"
  );
}

/**
 * Resolves `?color=off-white` back to a variant.
 *
 * Returns null rather than guessing when nothing matches: a stale link from an
 * old ad, or a colour since renamed, should fall through to the product's
 * default variant instead of showing an arbitrary one as though it were chosen.
 */
export function findVariantByColourSlug<T extends { color: string | null }>(
  variants: readonly T[],
  slug: string | null | undefined
): T | null {
  if (!slug) return null;
  const wanted = colourSlug(slug);
  return variants.find((v) => v.color && colourSlug(v.color) === wanted) ?? null;
}

/** The shareable address of one colourway. */
export function productPathWithColour(
  productSlug: string,
  colour: string | null | undefined
): string {
  const base = `/products/${productSlug}`;
  return colour ? `${base}?color=${encodeURIComponent(colourSlug(colour))}` : base;
}
