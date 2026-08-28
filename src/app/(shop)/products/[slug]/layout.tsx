/**
 * Pass-through.
 *
 * This layout used to own `generateMetadata` for product pages. That now
 * lives in `page.tsx`, alongside the server render that fetches the same
 * product — React's `cache()` in `lib/server-api.ts` collapses the two calls
 * into one request, which a split across layout and page could not do.
 */
export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
