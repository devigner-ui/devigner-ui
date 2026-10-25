// Pure catalog logic: sorting, filtering, search, category counts and the
// "new" window. Type imports only, so the client islands and
// scripts/catalog.check.mts share one copy.

import type { ComponentSlug } from "./registry";

export interface CatalogEntry {
  slug: ComponentSlug;
  name: string;
  description: string;
  /** Category key. */
  category: string;
  /** From COMPONENT_CATEGORIES. */
  categoryLabel: string;
  /** YYYY-MM-DD. */
  addedAt: string;
  tryIt?: string;
  stageAlign: "center" | "end";
  /** As the CLI prints them. */
  dependencies: string[];
  /** Registry code, trailing newline excluded. */
  lines: number;
  /** addedAt falls inside NEW_WINDOW_DAYS of the build date. */
  isNew: boolean;
  /** Not new, but a changelog entry inside NEW_WINDOW_DAYS marks it UPDATED. */
  isUpdated: boolean;
}

export type CatalogSort = "newest" | "az";

export const NEW_WINDOW_DAYS = 14;
const DAY_MS = 86_400_000;

/** True when `addedAt` is within the last NEW_WINDOW_DAYS days of `now`. */
export function isNew(addedAt: string, now: Date) {
  const added = Date.parse(`${addedAt}T00:00:00Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return today - added < NEW_WINDOW_DAYS * DAY_MS;
}

/** The latest date each component got an `- UPDATED slug:` line, from
 *  changelog files named YYYY-MM-DD.md (or YYYY-MM-DD-2.md). */
export function updatedDates(files: readonly { name: string; text: string }[]) {
  const dates = new Map<string, string>();
  for (const { name, text } of files) {
    const date = /^(\d{4}-\d{2}-\d{2})(?:-\d+)?\.md$/.exec(name)?.[1];
    if (!date) continue;
    for (const [, slug] of text.matchAll(/^- UPDATED ([a-z0-9-]+):/gm)) {
      if (date > (dates.get(slug) ?? "")) dates.set(slug, date);
    }
  }
  return dates;
}

/** Newest first (ties by name), or A to Z. Returns a new array. */
export function sortEntries<T extends Pick<CatalogEntry, "name" | "addedAt">>(
  entries: readonly T[],
  sort: CatalogSort,
): T[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name);
  return [...entries].sort(
    sort === "az"
      ? byName
      : (a, b) => (a.addedAt === b.addedAt ? byName(a, b) : a.addedAt < b.addedAt ? 1 : -1),
  );
}

/** Case-insensitive match on name, description and category label. */
export function searchEntries<
  T extends Pick<CatalogEntry, "name" | "description" | "categoryLabel">,
>(entries: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...entries];
  return entries.filter((e) =>
    [e.name, e.description, e.categoryLabel].some((field) => field.toLowerCase().includes(q)),
  );
}

/** "all" keeps everything. */
export function filterByCategory<T extends Pick<CatalogEntry, "category">>(
  entries: readonly T[],
  category: string,
): T[] {
  return category === "all" ? [...entries] : entries.filter((e) => e.category === category);
}

/** Every non-empty category with its count, largest first, then by label. */
export function categoryCounts(
  entries: readonly Pick<CatalogEntry, "category" | "categoryLabel">[],
) {
  const counts = new Map<string, { key: string; label: string; count: number }>();
  for (const e of entries) {
    const hit = counts.get(e.category);
    if (hit) hit.count++;
    else counts.set(e.category, { key: e.category, label: e.categoryLabel, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Lines in a source file, not counting one trailing newline. */
export function countLines(code: string) {
  if (!code) return 0;
  return code.replace(/\r?\n$/, "").split(/\r?\n/).length;
}

/** Grouped by category, keeping the incoming order inside each group, so
 *  newest-first entries give groups ordered by their newest member. */
export function groupByCategory<T extends Pick<CatalogEntry, "category" | "categoryLabel">>(
  entries: readonly T[],
) {
  const groups = new Map<string, { label: string; items: T[] }>();
  for (const e of entries) {
    const g = groups.get(e.category) ?? { label: e.categoryLabel, items: [] };
    g.items.push(e);
    groups.set(e.category, g);
  }
  return [...groups.values()];
}

/** The entries either side of `slug`, wrapping at both ends. */
export function neighbors<T extends { slug: string }>(list: readonly T[], slug: string) {
  const i = Math.max(0, list.findIndex((e) => e.slug === slug));
  const n = list.length;
  return { prev: list[(i - 1 + n) % n], next: list[(i + 1) % n] };
}
