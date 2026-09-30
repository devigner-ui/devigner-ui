// Server only. The registry carries every component's source; this reduces it
// to the metadata the pages and islands need, so source never reaches the
// browser. Import it from server components and route files, never from a
// "use client" module.

import { COMPONENT_CATEGORIES } from "@devignerui/shared";
import { components, type ComponentSlug } from "./registry";
import { countLines, isNew, sortEntries, type CatalogEntry } from "./catalog-query";

export type { CatalogEntry } from "./catalog-query";

export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ui.devigner.cc";

/** The hero's default component. Set by hand, not the newest. */
export const FEATURED: ComponentSlug = "slider";

/** Which component each "Every state" cell runs. The keyboard cell is always
 *  the details page's Menu Dock (its search panel and nested menus are what
 *  the keys drive), the states cell is always Delete Button (its copy names
 *  it), and the code cell follows the hero. */
export const BENTO = {
  themes: "date-range-picker",
  motion: "magnetic-button",
} as const satisfies Record<string, ComponentSlug>;

/** Newest first. "new" is judged against the build date: pages are static
 *  and every deploy rebuilds them. */
export function getCatalog(now = new Date()): CatalogEntry[] {
  return sortEntries(
    Object.values(components).map((c) => ({
      slug: c.slug as ComponentSlug,
      name: c.name,
      description: c.description,
      category: c.category,
      categoryLabel:
        COMPONENT_CATEGORIES[c.category as keyof typeof COMPONENT_CATEGORIES] ?? c.category,
      addedAt: c.addedAt,
      tryIt: c.tryIt,
      stageAlign: c.stageAlign,
      dependencies: [...c.dependencies],
      lines: countLines(c.code),
      isNew: isNew(c.addedAt, now),
    })),
    "newest",
  );
}
