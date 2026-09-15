import { describe, it, expect } from "vitest";
import { getCodAvailability, quotePayment } from "./cod";

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

describe("quotePayment", () => {
  it("charges the whole total when prepaid, and adds no fee", () => {
    expect(quotePayment("PREPAID", 1500, 100, 40)).toEqual({
      fee: 0,
      total: 1500,
      payableNow: 1500,
      dueOnDelivery: 0,
      isPlaceOnly: false,
    });
  });

  it("charges only the advance on partial COD, fee included in the total", () => {
    expect(quotePayment("COD_PARTIAL", 1500, 100, 40)).toEqual({
      fee: 40,
      total: 1540,
      payableNow: 100,
      dueOnDelivery: 1440,
      isPlaceOnly: false,
    });
  });

  it("collects nothing online under full COD", () => {
    // The whole point of the zero advance: no payment step at all.
    expect(quotePayment("COD_FULL", 1500, 0, 40)).toEqual({
      fee: 40,
      total: 1540,
      payableNow: 0,
      dueOnDelivery: 1540,
      isPlaceOnly: true,
    });
  });

  it("treats a zero advance as place-only whichever COD label it is given", () => {
    // The server decides the model; a stale COD_PARTIAL from the client must
    // not resurrect a payment step the settings have switched off.
    expect(quotePayment("COD_PARTIAL", 1500, 0, 0).isPlaceOnly).toBe(true);
  });

  it("never charges more than the order is worth", () => {
    const quote = quotePayment("COD_PARTIAL", 80, 100, 0);
    expect(quote.payableNow).toBe(80);
    expect(quote.dueOnDelivery).toBe(0);
  });

  it("ignores a negative fee or advance rather than crediting the customer", () => {
    expect(quotePayment("COD_FULL", 1500, -50, -40)).toEqual({
      fee: 0,
      total: 1500,
      payableNow: 0,
      dueOnDelivery: 1500,
      isPlaceOnly: true,
    });
  });
});
