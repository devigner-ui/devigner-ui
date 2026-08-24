import { describe, expect, it } from "vitest";
import { components, getCategories } from "./registry";

describe("gallery route params", () => {
  it("every component resolves to a category that exists on its own surface", () => {
    for (const c of Object.values(components)) {
      const found = getCategories(c.kind).find((cat) => cat.slug === c.category);
      expect(found, `${c.slug} has no category on the ${c.kind} surface`).toBeTruthy();
    }
  });

  it("category and slug together are unique per surface", () => {
    const seen = new Set<string>();
    for (const c of Object.values(components)) {
      const key = `${c.kind}/${c.category}/${c.slug}`;
      expect(seen.has(key), `duplicate route ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("static params cover every design, so no gallery route renders dynamically", () => {
    for (const kind of ["component", "block"] as const) {
      const params = getCategories(kind).flatMap((cat) =>
        cat.components.map((c) => ({ category: cat.slug, slug: c.slug })),
      );
      const expected = Object.values(components).filter((c) => c.kind === kind);
      expect(params.length).toBe(expected.length);
    }
  });
});
