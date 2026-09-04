import { describe, it, expect } from "vitest";
import { getCodAvailability, amountPayableNow } from "./cod";

const settings = (over: Partial<{
  codEnabled: boolean;
  codAdvanceAmount: number;
  codMinOrderValue: number | null;
  codMaxOrderValue: number | null;
}> = {}) => ({
  codEnabled: true,
  codAdvanceAmount: 100,
  codMinOrderValue: null,
  codMaxOrderValue: null,
  ...over,
});

describe("getCodAvailability", () => {
  it("offers COD on an ordinary order", () => {
    expect(getCodAvailability(settings(), 1500)).toEqual({ available: true });
  });

  it("hides COD when the store has it switched off", () => {
    expect(getCodAvailability(settings({ codEnabled: false }), 1500).available).toBe(false);
  });

  it("hides COD while settings are still loading", () => {
    // Never let a slow network surface an option the store has switched off.
    expect(getCodAvailability(undefined, 1500).available).toBe(false);
  });

  it("refuses an order worth exactly the advance — nothing left to collect", () => {
    expect(getCodAvailability(settings(), 100).available).toBe(false);
  });

  it("allows a penny above the advance", () => {
    expect(getCodAvailability(settings(), 100.01).available).toBe(true);
  });

  it("treats the floor and the cap as inclusive, matching the server", () => {
    const banded = settings({ codMinOrderValue: 500, codMaxOrderValue: 5000 });
    expect(getCodAvailability(banded, 499.99).available).toBe(false);
    expect(getCodAvailability(banded, 500).available).toBe(true);
    expect(getCodAvailability(banded, 5000).available).toBe(true);
    expect(getCodAvailability(banded, 5000.01).available).toBe(false);
  });

  it("quotes the limit so the shopper knows what would qualify", () => {
    const banded = settings({ codMinOrderValue: 500, codMaxOrderValue: 5000 });

    const tooSmall = getCodAvailability(banded, 300);
    expect(tooSmall.available).toBe(false);
    if (!tooSmall.available) expect(tooSmall.reason).toContain("500");

    const tooBig = getCodAvailability(banded, 9000);
    expect(tooBig.available).toBe(false);
    if (!tooBig.available) expect(tooBig.reason).toContain("5,000");
  });
});

describe("amountPayableNow", () => {
  it("charges the whole total when prepaid", () => {
    expect(amountPayableNow("PREPAID", 1500, 100)).toBe(1500);
  });

  it("charges only the advance on COD", () => {
    expect(amountPayableNow("COD_PARTIAL", 1500, 100)).toBe(100);
  });

  it("never charges more than the order is worth", () => {
    expect(amountPayableNow("COD_PARTIAL", 80, 100)).toBe(80);
  });
});
