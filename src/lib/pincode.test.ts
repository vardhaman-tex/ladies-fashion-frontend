import { describe, it, expect } from "vitest";
import { estimateDelivery, formatDeliveryWindow, isPincode } from "./pincode";

describe("estimateDelivery", () => {
  it("counts business days only", () => {
    // Monday 5 Oct 2026: 5 business days is Monday 12 Oct, 9 is Friday 16 Oct.
    const { earliest, latest } = estimateDelivery(new Date(2026, 9, 5));
    expect(earliest.getDate()).toBe(12);
    expect(latest.getDate()).toBe(16);
  });

  it("skips the weekend when an order lands on a Friday", () => {
    const { earliest } = estimateDelivery(new Date(2026, 9, 9));
    expect(earliest.getDay()).toBe(5);
  });
});

describe("formatDeliveryWindow", () => {
  it("names both months when the window crosses one", () => {
    expect(
      formatDeliveryWindow({ earliest: new Date(2026, 9, 29), latest: new Date(2026, 10, 4) })
    ).toBe("29 Oct – 4 Nov");
  });
  it("collapses to one month otherwise", () => {
    expect(
      formatDeliveryWindow({ earliest: new Date(2026, 9, 12), latest: new Date(2026, 9, 15) })
    ).toBe("12–15 Oct");
  });
});

describe("isPincode", () => {
  it("rejects a leading zero and wrong lengths", () => {
    expect(isPincode("395007")).toBe(true);
    expect(isPincode("095007")).toBe(false);
    expect(isPincode("39500")).toBe(false);
  });
});
