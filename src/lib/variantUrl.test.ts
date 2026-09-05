import { describe, expect, it } from "vitest";

import { colourSlug, findVariantByColourSlug, productPathWithColour } from "./variantUrl";

const VARIANTS = [
  { color: "Light Green" },
  { color: "Off White" },
  { color: "Rani" },
  { color: null },
];

describe("colourSlug", () => {
  it("handles the colour names actually in the catalogue", () => {
    expect(colourSlug("Light Green")).toBe("light-green");
    expect(colourSlug("Off White")).toBe("off-white");
    expect(colourSlug("white")).toBe("white");
    expect(colourSlug("Rani")).toBe("rani");
  });

  it("never returns an empty fragment", () => {
    // An empty fragment would produce `?color=` and match nothing, which is
    // worse than a placeholder that visibly fails to resolve.
    expect(colourSlug("###")).toBe("na");
    expect(colourSlug("")).toBe("na");
  });
});

describe("findVariantByColourSlug", () => {
  it("resolves a slug back to its variant", () => {
    expect(findVariantByColourSlug(VARIANTS, "off-white")).toEqual({ color: "Off White" });
  });

  it("accepts the colour name as well as the slug", () => {
    expect(findVariantByColourSlug(VARIANTS, "Off White")).toEqual({ color: "Off White" });
  });

  it("returns null for a colour that no longer exists", () => {
    // A stale link from an old ad must fall through to the default variant
    // rather than silently showing an arbitrary one as though it were chosen.
    expect(findVariantByColourSlug(VARIANTS, "maroon")).toBeNull();
  });

  it("returns null when no colour was asked for", () => {
    expect(findVariantByColourSlug(VARIANTS, null)).toBeNull();
    expect(findVariantByColourSlug(VARIANTS, undefined)).toBeNull();
    expect(findVariantByColourSlug(VARIANTS, "")).toBeNull();
  });

  it("never matches a variant that has no colour", () => {
    expect(findVariantByColourSlug([{ color: null }], "na")).toBeNull();
  });
});

describe("productPathWithColour", () => {
  it("addresses one colourway", () => {
    expect(productPathWithColour("jaipuri-suit", "Off White")).toBe(
      "/products/jaipuri-suit?color=off-white"
    );
  });

  it("leaves a colourless product at its bare path", () => {
    expect(productPathWithColour("chiffon-saree", null)).toBe("/products/chiffon-saree");
    expect(productPathWithColour("chiffon-saree", undefined)).toBe("/products/chiffon-saree");
  });

  it("round-trips through the resolver", () => {
    const path = productPathWithColour("x", "Light Green");
    const slug = new URLSearchParams(path.split("?")[1]).get("color");
    expect(findVariantByColourSlug(VARIANTS, slug)).toEqual({ color: "Light Green" });
  });
});
