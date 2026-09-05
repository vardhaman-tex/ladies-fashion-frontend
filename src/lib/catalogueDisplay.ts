/**
 * Display-layer tidying for catalogue values that were typed by hand.
 *
 * Everything here is presentation only. The underlying strings are what the
 * cart, the order and the Meta catalog feed are keyed on, so they are never
 * rewritten — only relabelled on screen. That means a data cleanup later
 * changes what is stored without changing what anyone sees, and until then a
 * shopper is not asked to read the admin's typing.
 */

/** `XXX` and `XXXL` were both entered for the same 46, so they fold together. */
const SIZE_ALIASES: Record<string, string> = {
  XXX: "XXXL",
  XXXXL: "4XL",
};

const ONE_SIZE = /^(one[\s_-]?size|free[\s_-]?size|os)$/i;

/**
 * Turns `L(40)`, `M (38)`, `XXX (46)` and `ONE_SIZE` into one house style.
 *
 * The catalogue has the same size written several ways — with and without the
 * space before the bracket, and `XXX` alongside `XXXL` for the same 46. On a
 * row of buttons those sit side by side, and inconsistent spacing reads as
 * carelessness at exactly the moment someone is deciding whether to trust the
 * store with a garment they cannot return.
 *
 * An unrecognised shape is returned trimmed rather than mangled: a size this
 * function does not understand should still be selectable.
 */
export function formatSizeLabel(raw: string): string {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!value) return raw;
  if (ONE_SIZE.test(value)) return "One Size";

  const match = /^([A-Za-z]+)\s*\(\s*(\d+)\s*\)$/.exec(value);
  if (match) {
    const letters = match[1].toUpperCase();
    return `${SIZE_ALIASES[letters] ?? letters} (${match[2]})`;
  }

  const lettersOnly = /^[A-Za-z]+$/.exec(value);
  if (lettersOnly) {
    const letters = value.toUpperCase();
    return SIZE_ALIASES[letters] ?? letters;
  }

  return value;
}

/**
 * Drops sizes that are the same size twice.
 *
 * A guard, not a fix for a bug in today's data: no variant currently carries a
 * duplicate. But `L (40)` and `L(40)` both exist in the catalogue — on
 * different variants of the same product — and once the two spellings are
 * relabelled to one, anyone adding a size to a variant that already has its
 * twin would put two identical buttons in front of a shopper. There is no
 * difference between them to explain, so we do not offer the choice.
 *
 * The survivor is chosen rather than assumed: an in-stock SKU beats an
 * out-of-stock twin, so a duplicate can never be the reason a size looks
 * unavailable. Order is otherwise preserved.
 */
export function dedupeSizes<T extends { size: string; inStock?: boolean }>(
  skus: readonly T[]
): T[] {
  const byLabel = new Map<string, T>();
  for (const sku of skus) {
    const label = formatSizeLabel(sku.size);
    const existing = byLabel.get(label);
    if (!existing || (!existing.inStock && sku.inStock)) {
      byLabel.set(label, sku);
    }
  }
  return [...byLabel.values()];
}

/**
 * The "L (40) · Rani" line under a cart or order line item.
 *
 * Shares `formatSizeLabel` with the size buttons deliberately: someone who
 * picked a size written one way on the product page should not find it written
 * another way in their cart, where they are checking they chose correctly.
 */
export function formatVariantSummary(
  size?: string | null,
  color?: string | null
): string {
  return [size ? formatSizeLabel(size) : null, color].filter(Boolean).join(" · ");
}

/**
 * Tidies the fabric string without inventing anything.
 *
 * `Cotton60.60` sits directly under the price and reads as a rendering bug,
 * though it is a real weave count — 60s yarn in both warp and weft. It is
 * spelled three ways across the catalogue (`Cotton60.60`, `Cotton 60.60`, and
 * with a trailing space), which is three ways of looking broken.
 *
 * Only spacing and the `×` are touched. Spelling is left exactly as typed:
 * silently "correcting" a fabric name would be guessing at a fact about the
 * garment, and the place to fix a typo is the record, not the renderer.
 */
export function formatFabric(raw: string): string {
  const value = raw.trim().replace(/\s+/g, " ");
  // A trailing weave count, with or without the space the admin sometimes omits.
  return value.replace(/\s*(\d{2})\.(\d{2})$/, " $1×$2");
}
