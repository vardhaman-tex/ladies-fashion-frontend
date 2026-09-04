import { describe, expect, it } from "vitest";

import {
  firstErrorField,
  formatGuestAddress,
  isGuestAddressComplete,
  normalisePhone,
  validateGuestAddress,
  type GuestAddressForm,
} from "./checkoutAddress";

function form(overrides: Partial<GuestAddressForm> = {}): GuestAddressForm {
  return {
    fullName: "Priya Sharma",
    phone: "9876543210",
    email: "",
    addressLine1: "12, MG Road",
    addressLine2: "",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    ...overrides,
  };
}

describe("normalisePhone", () => {
  it("strips a +91 country code", () => {
    expect(normalisePhone("+91 98765 43210")).toBe("9876543210");
  });

  it("strips a leading zero", () => {
    expect(normalisePhone("098765-43210")).toBe("9876543210");
  });

  it("leaves a bare ten-digit number alone", () => {
    expect(normalisePhone("9876543210")).toBe("9876543210");
  });

  it("does not mangle a number that is simply too short", () => {
    expect(normalisePhone("98765")).toBe("98765");
  });
});

describe("validateGuestAddress", () => {
  it("accepts a complete address", () => {
    expect(validateGuestAddress(form())).toEqual({});
    expect(isGuestAddressComplete(form())).toBe(true);
  });

  it("reports every missing required field at once", () => {
    const errors = validateGuestAddress(
      form({ fullName: "", phone: "", addressLine1: "", city: "", state: "", pincode: "" })
    );
    expect(Object.keys(errors).sort()).toEqual(
      ["addressLine1", "city", "fullName", "phone", "pincode", "state"].sort()
    );
  });

  it("rejects a landline-style number", () => {
    expect(validateGuestAddress(form({ phone: "0221234567" })).phone).toBeDefined();
  });

  it("accepts a number written with a country code", () => {
    expect(validateGuestAddress(form({ phone: "+91 98765 43210" })).phone).toBeUndefined();
  });

  it("rejects a pincode starting with zero", () => {
    expect(validateGuestAddress(form({ pincode: "012345" })).pincode).toBeDefined();
  });

  it("rejects a pincode that is not six digits", () => {
    expect(validateGuestAddress(form({ pincode: "40001" })).pincode).toBeDefined();
  });

  it("treats a blank email as valid, since email is optional", () => {
    expect(validateGuestAddress(form({ email: "   " })).email).toBeUndefined();
  });

  it("rejects a malformed email when one is given", () => {
    expect(validateGuestAddress(form({ email: "priya@gmail" })).email).toBeDefined();
  });

  it("accepts a well-formed email", () => {
    expect(validateGuestAddress(form({ email: "priya@gmail.com" })).email).toBeUndefined();
  });

  it("rejects a single-character name", () => {
    expect(validateGuestAddress(form({ fullName: "P" })).fullName).toBeDefined();
  });

  it("does not require address line 2", () => {
    expect(validateGuestAddress(form({ addressLine2: "" }))).toEqual({});
  });
});

describe("firstErrorField", () => {
  it("returns the earliest failing field in reading order, not key order", () => {
    const errors = validateGuestAddress(form({ pincode: "", fullName: "" }));
    expect(firstErrorField(errors)).toBe("fullName");
  });

  it("returns null when nothing is wrong", () => {
    expect(firstErrorField({})).toBeNull();
  });
});

describe("formatGuestAddress", () => {
  it("joins the parts that are present and skips the ones that are not", () => {
    expect(formatGuestAddress(form({ addressLine2: "Near Fort" }))).toBe(
      "12, MG Road, Near Fort, Mumbai, Maharashtra, 400001"
    );
    expect(formatGuestAddress(form())).toBe("12, MG Road, Mumbai, Maharashtra, 400001");
  });
});
