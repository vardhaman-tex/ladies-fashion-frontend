import { describe, expect, it } from "vitest";

import {
  dedupeSizes,
  formatFabric,
  formatSizeLabel,
  formatVariantSummary,
} from "./catalogueDisplay";
import { inr } from "./money";

/**
 * Every input below is a real value taken from the live catalogue, not an
 * invented one. That is the point of the tests: the shapes the admin actually
 * typed are the shapes these functions have to survive.
 */

describe("formatSizeLabel", () => {
  it("gives the bracketed sizes one spelling", () => {
    expect(formatSizeLabel("M (38)")).toBe("M (38)");
    expect(formatSizeLabel("L(40)")).toBe("L (40)");
    expect(formatSizeLabel("L (40)")).toBe("L (40)");
    expect(formatSizeLabel("XL (42)")).toBe("XL (42)");
  });

  it("folds XXX into XXXL, which is the same 46", () => {
    expect(formatSizeLabel("XXX (46)")).toBe("XXXL (46)");
    expect(formatSizeLabel("XXXL(46)")).toBe("XXXL (46)");
  });

  it("writes the one-size sarees in words", () => {
    expect(formatSizeLabel("ONE_SIZE")).toBe("One Size");
    expect(formatSizeLabel("one size")).toBe("One Size");
  });

  it("returns anything it does not recognise, trimmed rather than mangled", () => {
    // A size this function cannot parse must still be selectable.
    expect(formatSizeLabel("  Free / 44-46  ")).toBe("Free / 44-46");
    expect(formatSizeLabel("")).toBe("");
  });
});

describe("dedupeSizes", () => {
  it("collapses the same size entered twice", () => {
    const result = dedupeSizes([
      { size: "L (40)", inStock: true },
      { size: "M (38)", inStock: true },
      { size: "L(40)", inStock: true },
    ]);
    expect(result.map((s) => s.size)).toEqual(["L (40)", "M (38)"]);
  });

  it("keeps the in-stock twin, so a duplicate never hides an available size", () => {
    const result = dedupeSizes([
      { size: "L (40)", inStock: false },
      { size: "L(40)", inStock: true },
    ]);
    expect(result).toEqual([{ size: "L(40)", inStock: true }]);
  });

  it("leaves genuinely different sizes alone, in order", () => {
    const result = dedupeSizes([
      { size: "M (38)", inStock: true },
      { size: "L(40)", inStock: true },
      { size: "XL (42)", inStock: false },
    ]);
    expect(result).toHaveLength(3);
  });
});

describe("formatFabric", () => {
  it("makes the weave count read as a weave count", () => {
    expect(formatFabric("Cotton60.60")).toBe("Cotton 60×60");
    expect(formatFabric("Cotton 60.60")).toBe("Cotton 60×60");
  });

  it("trims the trailing spaces the admin left behind", () => {
    expect(formatFabric("Shimmer Chiffon ")).toBe("Shimmer Chiffon");
    expect(formatFabric("Chiffon ")).toBe("Chiffon");
  });

  it("does not correct spelling, because that would be guessing", () => {
    // "Fandy fabric" is probably meant to be "Fancy", but the renderer is not
    // the place to decide that — the record is.
    expect(formatFabric("Fandy fabric ")).toBe("Fandy fabric");
  });
});

describe("the whole live catalogue", () => {
  // Every distinct size and fabric string in the store on 5 Sep 2026, pulled
  // from /api/v1/products. If someone adds a shape these functions mishandle,
  // this is where it should show up rather than on the product page.
  it("has a sensible label for every size that exists", () => {
    const everySize = [
      "M (38)",
      "L(40)",
      "L (40)",
      "XL (42)",
      "XXL (44)",
      "XXX (46)",
      "XXXL(46)",
      "ONE_SIZE",
    ];
    expect(everySize.map(formatSizeLabel)).toEqual([
      "M (38)",
      "L (40)",
      "L (40)",
      "XL (42)",
      "XXL (44)",
      "XXXL (46)",
      "XXXL (46)",
      "One Size",
    ]);
  });

  it("has a sensible label for every fabric that exists", () => {
    const everyFabric = [
      "Cotton60.60",
      "Cotton 60.60",
      "Georgette",
      "Shimmer Chiffon ",
      "Chiffon ",
      "Chanderi Cotton ",
      "Fandy fabric ",
      "Cotton Flex",
      "Premium Cotton",
    ];
    expect(everyFabric.map(formatFabric)).toEqual([
      "Cotton 60×60",
      "Cotton 60×60",
      "Georgette",
      "Shimmer Chiffon",
      "Chiffon",
      "Chanderi Cotton",
      "Fandy fabric",
      "Cotton Flex",
      "Premium Cotton",
    ]);
  });
});

describe("formatVariantSummary", () => {
  it("uses the same size spelling the product page showed", () => {
    expect(formatVariantSummary("L(40)", "Rani")).toBe("L (40) · Rani");
  });

  it("omits whichever half is missing", () => {
    expect(formatVariantSummary("L(40)", null)).toBe("L (40)");
    expect(formatVariantSummary(null, "Rani")).toBe("Rani");
    expect(formatVariantSummary(null, null)).toBe("");
  });
});

describe("inr", () => {
  it("drops the paise from whole rupees", () => {
    expect(inr(1500)).toBe("₹1,500");
    expect(inr(899)).toBe("₹899");
  });

  it("groups the Indian way", () => {
    expect(inr(150000)).toBe("₹1,50,000");
  });

  it("keeps both decimals rather than rounding a real fraction", () => {
    expect(inr(1399.5)).toBe("₹1,399.50");
  });
});
