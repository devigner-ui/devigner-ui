// Single source of truth for the component docs (grid + [slug] page).
// The `code`/`usage` per component come from apps/docs/registry/<slug>/ —
// real, type-checked .tsx files, deliberately distinct from the internal
// packages/ui source (different import paths, tokens, forwardRef). One style
// per component; each installs as components/ui/<slug>.tsx. Run
// `pnpm generate:registry` after editing anything under registry/.

export interface PropDef {
  name: string;
  type: string;
  default: string;
  description: string;
}

export interface ComponentData {
  slug: string;
  name: string;
  description: string;
  category: string;
  /** Which surface this ships on: a primitive, or a composed section. */
  kind: "component" | "block";
  variants: string[];
  props: PropDef[];
  code: string;
  /** Example shown in the Code tab. */
  usage: string;
  notes?: string[];
  /** Entitlement tier. Absent means "free". Pro components are gated behind a license. */
  access?: "free" | "pro";
}

export interface CategoryData {
  slug: string;
  name: string;
  kind: "component" | "block";
  order: number;
  description: string;
}

import { components, categories, UTIL_CODE } from "./registry.data.generated";
export { components, categories };

/** Ordered categories for one surface, each with the components it holds. */
export function getCategories(kind: "component" | "block") {
  return Object.values(categories)
    .filter((c) => c.kind === kind)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      ...c,
      components: Object.values(components).filter(
        (component) => component.category === c.slug
      ),
    }))
    .filter((c) => c.components.length > 0);
}

/* ─── CLI-facing registry (served by /api/registry → consumed by the CLI) ─── */

/** npm dependencies a component needs, derived from what its source imports. */
export function dependenciesFor(code: string): string[] {
  const deps = ["clsx", "tailwind-merge"];
  if (code.includes("class-variance-authority"))
    deps.push("class-variance-authority");
  if (code.includes("motion/react")) deps.push("motion");
  return deps;
}

const fileFor = (slug: string) => `components/ui/${slug}.tsx`;

/** Index served at GET /api/registry. */
export function getRegistryIndex() {
  return {
    version: "0.2.0",
    components: Object.values(components).map((c) => ({
      slug: c.slug,
      kind: c.kind,
      name: c.name,
      description: c.description,
      category: c.category,
      variantCount: c.variants.length,
      dependencies: dependenciesFor(c.code),
      access: c.access ?? "free",
    })),
  };
}

/** Full component served at GET /api/registry/[slug]; null when unknown. */
export function getRegistryComponent(slug: string) {
  const c = components[slug];
  if (!c) return null;

  const file = fileFor(slug);
  return {
    slug: c.slug,
    name: c.name,
    description: c.description,
    category: c.category,
    variants: c.variants,
    props: c.props,
    file,
    dependencies: dependenciesFor(c.code),
    files: { "lib/utils.ts": UTIL_CODE, [file]: c.code },
  };
}
