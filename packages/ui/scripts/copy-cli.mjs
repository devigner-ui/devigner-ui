import { copyFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { components } from "../../../apps/docs/lib/registry.ts";

const source = fileURLToPath(new URL("../../cli/dist/index.js", import.meta.url));
const destination = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
copyFileSync(source, destination);

const entries = Object.values(components);
const registry = {
  index: entries.map((component) => ({
    slug: component.slug,
    name: component.name,
    description: component.description,
    category: component.category,
    variantCount: component.variants.length,
    dependencies: component.dependencies,
  })),
  components: Object.fromEntries(entries.map((component) => {
    const file = `components/ui/${component.slug}.tsx`;
    return [component.slug, {
      slug: component.slug,
      name: component.name,
      description: component.description,
      category: component.category,
      variants: component.variants,
      file,
      dependencies: component.dependencies,
      files: { [file]: component.code },
    }];
  })),
};
writeFileSync(new URL("../dist/registry.json", import.meta.url), JSON.stringify(registry));
