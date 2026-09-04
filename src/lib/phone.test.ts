import { describe, expect, it } from "vitest";

import { formatMobile, isIndianMobile, normalisePhone } from "./phone";

describe("normalisePhone", () => {
  it("collapses every spelling of one number", () => {
    for (const spelling of [
      "9876543210",
      "+91 98765 43210",
      "+919876543210",
      "919876543210",
      "098765-43210",
      "0919876543210",
      "(98765) 43210",
    ]) {
      expect(normalisePhone(spelling)).toBe("9876543210");
    }
  });

  it("leaves a number that is simply too short alone", () => {
    expect(normalisePhone("98765")).toBe("98765");
  });
});

describe("isIndianMobile", () => {
  it("accepts the whole 6-9 opening range", () => {
    for (const prefix of ["6", "7", "8", "9"]) {
      expect(isIndianMobile(`${prefix}123456789`)).toBe(true);
    }
  });

  it("rejects landlines, short numbers and junk", () => {
    for (const value of ["0221234567", "1234567890", "98765", "", "abcdefghij"]) {
      expect(isIndianMobile(value)).toBe(false);
    }
  });
});

describe("formatMobile", () => {
  it("splits a full number into two readable halves", () => {
    expect(formatMobile("+919876543210")).toBe("98765 43210");
  });

  it("leaves a partial number unformatted", () => {
    expect(formatMobile("98765")).toBe("98765");
  });
});
