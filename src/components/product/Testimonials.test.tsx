import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Testimonials } from "./Testimonials";
import type { Testimonial } from "@/services/testimonialService";

function render(data: Testimonial[], props: { productSlug?: string; limit?: number } = {}) {
  const client = new QueryClient();
  client.setQueryData(["testimonials", props.productSlug ?? "all", props.limit ?? 6], data);
  // React separates adjacent text nodes with comment markers; drop them so
  // assertions read like the sentence a shopper sees.
  return renderToString(
    <QueryClientProvider client={client}>
      <Testimonials {...props} />
    </QueryClientProvider>
  ).replace(/<!-- -->/g, "");
}

const item = (over: Partial<Testimonial> = {}): Testimonial => ({
  id: "1",
  customerName: "Test A.",
  location: "Jaipur",
  productSlug: null,
  body: "Placeholder text for the test.",
  rating: 5,
  source: "WhatsApp",
  receivedOn: "2026-06-12",
  ...over,
});

describe("Testimonials", () => {
  it("renders nothing at all when there is no feedback", () => {
    expect(render([])).toBe("");
  });

  it("says where feedback came from and never calls it a verified purchase", () => {
    const html = render([item()]);
    expect(html).toContain("What customers say");
    expect(html).toContain("Via WhatsApp");
    expect(html).toContain("used with their permission");
    expect(html).not.toMatch(/verified/i);
  });

  it("shows stars only when the customer gave a rating", () => {
    expect(render([item({ rating: 4 })])).toContain("4.0 out of 5 stars");
    expect(render([item({ rating: null })])).not.toContain("out of 5 stars");
  });

  it("omits the location when there is none", () => {
    expect(render([item({ location: null })])).not.toContain(" · Jaipur");
  });
});
