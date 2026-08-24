import { describe, expect, it } from "vitest";
import { getCategories } from "./registry";

describe("category rail data", () => {
  it("offers at least one category per surface", () => {
    expect(getCategories("component").length).toBeGreaterThan(0);
    expect(getCategories("block").length).toBeGreaterThan(0);
  });
  it("never yields an empty category, so the rail always has something to show", () => {
    for (const kind of ["component", "block"] as const) {
      for (const category of getCategories(kind)) {
        expect(category.components.length).toBeGreaterThan(0);
      }
    }
  });
  it("exposes the design count the rail lays out", () => {
    for (const category of getCategories("component")) {
      expect(Number.isInteger(category.components.length)).toBe(true);
    }
  });
});
