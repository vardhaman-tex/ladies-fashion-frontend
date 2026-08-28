import { headers } from "next/headers";

/**
 * Renders a schema.org JSON-LD block into the document.
 *
 * Two details matter here:
 *
 * 1. **The nonce.** `src/proxy.ts` sets a strict, nonce-based CSP with
 *    `script-src 'self' 'nonce-…'`. Browsers apply that policy to every
 *    `<script>` element, data blocks included, so an un-nonced JSON-LD tag can
 *    be dropped before a crawler ever parses it. The per-request nonce is read
 *    back off the `x-nonce` request header the proxy forwards.
 *
 * 2. **Escaping.** `<` is escaped to `<` so a stray `</script>` inside an
 *    admin-authored product description cannot break out of the block.
 *
 * This is a server component, so the markup lands in the initial HTML where
 * non-JavaScript-executing crawlers (most AI answer engines) can read it.
 */
export async function JsonLd({
  data,
  id,
}: {
  /** A single schema node, or several to emit as an array. */
  data: object | object[];
  id?: string;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const payload = Array.isArray(data) && data.length === 1 ? data[0] : data;
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      {...(id ? { id } : {})}
      {...(nonce ? { nonce } : {})}
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
