import { describe, expect, it } from "vitest";

import {
  INDIAN_STATES,
  isKnownState,
  matchState,
  suggestStates,
} from "./indianStates";

describe("matchState", () => {
  it("accepts every canonical name unchanged", () => {
    for (const state of INDIAN_STATES) {
      expect(matchState(state)).toBe(state);
    }
  });

  it("ignores case and punctuation", () => {
    expect(matchState("maharashtra")).toBe("Maharashtra");
    expect(matchState("  TAMIL NADU  ")).toBe("Tamil Nadu");
    expect(matchState("jammu & kashmir")).toBe("Jammu and Kashmir");
    expect(matchState("Jammu-and-Kashmir")).toBe("Jammu and Kashmir");
  });

  it("resolves the official two-letter codes", () => {
    expect(matchState("MH")).toBe("Maharashtra");
    expect(matchState("up")).toBe("Uttar Pradesh");
    expect(matchState("TN")).toBe("Tamil Nadu");
    expect(matchState("DL")).toBe("Delhi");
  });

  it("resolves names that were renamed but are still in use", () => {
    expect(matchState("Orissa")).toBe("Odisha");
    expect(matchState("Pondicherry")).toBe("Puducherry");
    expect(matchState("Uttaranchal")).toBe("Uttarakhand");
    expect(matchState("New Delhi")).toBe("Delhi");
  });

  it("resolves the halves of the merged union territory", () => {
    expect(matchState("Daman and Diu")).toBe("Dadra and Nagar Haveli and Daman and Diu");
    expect(matchState("Dadra & Nagar Haveli")).toBe("Dadra and Nagar Haveli and Daman and Diu");
  });

  it("refuses a typo rather than guessing at it", () => {
    // The whole point: this is what used to reach a courier.
    expect(matchState("Maharastra")).toBeNull();
    expect(matchState("Tamilnad")).toBeNull();
    expect(matchState("Bangaluru")).toBeNull();
  });

  it("refuses somewhere we do not ship", () => {
    expect(matchState("California")).toBeNull();
    expect(matchState("Dubai")).toBeNull();
  });

  it("treats blank input as no answer", () => {
    expect(matchState("")).toBeNull();
    expect(matchState("   ")).toBeNull();
    expect(matchState(null)).toBeNull();
    expect(matchState(undefined)).toBeNull();
  });
});

describe("isKnownState", () => {
  it("agrees with matchState", () => {
    expect(isKnownState("mh")).toBe(true);
    expect(isKnownState("Maharastra")).toBe(false);
  });
});

describe("suggestStates", () => {
  it("puts prefix matches ahead of ones that merely contain the text", () => {
    const suggestions = suggestStates("ma");
    expect(suggestions[0]).toBe("Madhya Pradesh");
    expect(suggestions).toContain("Maharashtra");
    // "Himachal Pradesh" contains "ma", so it may appear — but never first.
    expect(suggestions.indexOf("Himachal Pradesh")).toBeGreaterThan(
      suggestions.indexOf("Maharashtra")
    );
  });

  it("offers what a code resolves to, which no substring search would find", () => {
    expect(suggestStates("mh")[0]).toBe("Maharashtra");
    expect(suggestStates("wb")[0]).toBe("West Bengal");
  });

  it("matches across punctuation the customer did not type", () => {
    expect(suggestStates("jammuand")).toContain("Jammu and Kashmir");
  });

  it("offers something to start from when nothing is typed", () => {
    expect(suggestStates("").length).toBeGreaterThan(0);
  });

  it("returns nothing for text that matches nowhere", () => {
    expect(suggestStates("zzzz")).toEqual([]);
  });

  it("respects the limit", () => {
    expect(suggestStates("a", 3).length).toBeLessThanOrEqual(3);
  });
});
