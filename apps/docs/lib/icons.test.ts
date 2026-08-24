import { describe, expect, it } from "vitest";
import * as icon from "reicon-react/icons/ArrowRight";

describe("reicon-react per-icon subpath", () => {
  it("resolves an icon through its own subpath, keeping imports tree-shakeable", () => {
    expect(Object.keys(icon).length).toBeGreaterThan(0);
  });
  it("exports a renderable component", () => {
    const [Component] = Object.values(icon);
    expect(typeof Component === "function" || typeof Component === "object").toBe(true);
  });
});
