import { describe, expect, it } from "vitest";
import {
  categories,
  dependenciesFor,
  getCategories,
  getRegistryComponent,
  getRegistryIndex,
} from "./registry";

describe("dependenciesFor", () => {
  it("always includes the base utils", () => {
    expect(dependenciesFor("")).toEqual(["clsx", "tailwind-merge"]);
  });
  it("adds cva and motion when their imports appear", () => {
    const deps = dependenciesFor(`import "class-variance-authority"; import "motion/react"`);
    expect(deps).toContain("class-variance-authority");
    expect(deps).toContain("motion");
  });
});

describe("registry API shape", () => {
  it("index lists every component", () => {
    const index = getRegistryIndex();
    expect(index.components.length).toBeGreaterThan(0);
    // full component resolves and echoes the file map the CLI writes
    const first = getRegistryComponent(index.components[0].slug)!;
    expect(first.files["lib/utils.ts"]).toBeTruthy();
    expect(first.file in first.files).toBe(true);
  });
  it("returns null for an unknown slug (drives the route 404)", () => {
    expect(getRegistryComponent("does-not-exist")).toBeNull();
  });
  it("index carries an access tier the paid route gates on", () => {
    const bySlug = Object.fromEntries(
      getRegistryIndex().components.map((c) => [c.slug, c.access])
    );
    // Every component is either free or pro, never undefined.
    for (const access of Object.values(bySlug)) {
      expect(access === "free" || access === "pro").toBe(true);
    }
    // hero-section is the gated one; button stays free.
    expect(bySlug["hero-section"]).toBe("pro");
    expect(bySlug["button"]).toBe("free");
  });
});

describe("kind axis", () => {
  it("every entry declares a kind", () => {
    for (const c of getRegistryIndex().components) {
      expect(c.kind === "component" || c.kind === "block").toBe(true);
    }
  });
  it("hero-section is a block, button is a component", () => {
    const bySlug = Object.fromEntries(
      getRegistryIndex().components.map((c) => [c.slug, c.kind])
    );
    expect(bySlug["hero-section"]).toBe("block");
    expect(bySlug["button"]).toBe("component");
  });
});

describe("categories", () => {
  it("every component's category exists in the manifest", () => {
    for (const c of getRegistryIndex().components) {
      expect(categories[c.category]).toBeTruthy();
    }
  });
  it("a category's kind matches the components in it", () => {
    for (const c of getRegistryIndex().components) {
      expect(categories[c.category].kind).toBe(c.kind);
    }
  });
  it("getCategories returns ordered, non-empty categories for a kind", () => {
    const result = getCategories("component");
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(entry.kind).toBe("component");
      expect(entry.components.length).toBeGreaterThan(0);
    }
    const orders = result.map((entry) => entry.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });
  it("buttons is a component category and heroes is a block category", () => {
    expect(categories["buttons"].kind).toBe("component");
    expect(categories["heroes"].kind).toBe("block");
  });
});
