import { describe, expect, it } from "vitest";
import { dependenciesFor, getRegistryComponent, getRegistryIndex } from "./registry";

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
