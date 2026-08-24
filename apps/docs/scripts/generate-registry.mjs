// Regenerates lib/registry.data.generated.ts from the canonical, type-checked
// sources under registry/<slug>/{code.tsx,usage.tsx,meta.mjs}. Run via
// `pnpm generate:registry`; `--check` verifies the committed file is current
// without writing (used in CI to catch hand-edits or forgotten regeneration).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const docsRoot = fileURLToPath(new URL("..", import.meta.url));
const registryDir = path.join(docsRoot, "registry");
const outFile = path.join(docsRoot, "lib", "registry.data.generated.ts");

const slugs = readdirSync(registryDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "utils")
  .map((d) => d.name)
  .sort();

const components = {};
for (const slug of slugs) {
  const dir = path.join(registryDir, slug);
  const code = readFileSync(path.join(dir, "code.tsx"), "utf8").trim();
  const usage = readFileSync(path.join(dir, "usage.tsx"), "utf8").trim();
  const metaModule = await import(pathToFileURL(path.join(dir, "meta.mjs")).href);
  const meta = metaModule.default;
  components[slug] = { slug, ...meta, code, usage };
}

const utilCode = readFileSync(path.join(registryDir, "utils", "code.ts"), "utf8").trim();

const categoriesModule = await import(
  pathToFileURL(path.join(registryDir, "categories.mjs")).href
);
const categories = Object.fromEntries(
  categoriesModule.default.map((c) => [c.slug, c])
);

const output = `// GENERATED FILE — do not edit by hand.
// Source of truth: apps/docs/registry/<slug>/{code.tsx,usage.tsx,meta.mjs}
// Regenerate with: pnpm --filter @devignerui/docs generate:registry

import type { ComponentData, CategoryData } from "./registry";

export const components: Record<string, ComponentData> = ${JSON.stringify(components, null, 2)};

export const categories: Record<string, CategoryData> = ${JSON.stringify(categories, null, 2)};

export const UTIL_CODE = ${JSON.stringify(utilCode)};
`;

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(outFile, "utf8");
  } catch {
    // file missing counts as stale
  }
  if (current !== output) {
    console.error(
      `✗ ${path.relative(docsRoot, outFile)} is stale. Run: pnpm --filter @devignerui/docs generate:registry`
    );
    process.exit(1);
  }
  console.log("✓ registry.data.generated.ts is up to date");
} else {
  writeFileSync(outFile, output);
  console.log(`✓ wrote ${path.relative(docsRoot, outFile)} (${slugs.length} components)`);
}
