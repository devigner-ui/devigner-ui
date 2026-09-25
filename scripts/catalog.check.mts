// Self-check for the catalog query module. No framework: `pnpm test`, or
// `node scripts/catalog.check.mts` - Node strips the types itself.
import assert from "node:assert/strict";
import {
  categoryCounts,
  countLines,
  filterByCategory,
  groupByCategory,
  neighbors,
  isNew,
  searchEntries,
  sortEntries,
} from "../apps/docs/lib/catalog-query.ts";

const entries = [
  { name: "Timeline", description: "The active step slides off the rail.", category: "data", categoryLabel: "Data Display", addedAt: "2026-09-21" },
  { name: "Chart Card", description: "A stats card with bars.", category: "data", categoryLabel: "Data Display", addedAt: "2026-09-21" },
  { name: "Date Range Picker", description: "A calendar with presets.", category: "forms", categoryLabel: "Forms", addedAt: "2026-09-23" },
  { name: "Magnetic Button", description: "Leans toward your cursor.", category: "animation", categoryLabel: "Animation", addedAt: "2026-09-14" },
];

// Search: name, description and category label, case-insensitive, trimmed.
assert.deepEqual(searchEntries(entries, "  CHART ").map((e) => e.name), ["Chart Card"]);
assert.deepEqual(searchEntries(entries, "cursor").map((e) => e.name), ["Magnetic Button"]);
assert.deepEqual(searchEntries(entries, "data display").map((e) => e.name), ["Timeline", "Chart Card"]);
assert.equal(searchEntries(entries, "").length, 4);
assert.equal(searchEntries(entries, "accordion").length, 0);

// Category filter and counts: non-empty only, largest first, then label.
assert.equal(filterByCategory(entries, "all").length, 4);
assert.deepEqual(filterByCategory(entries, "forms").map((e) => e.name), ["Date Range Picker"]);
assert.deepEqual(categoryCounts(entries), [
  { key: "data", label: "Data Display", count: 2 },
  { key: "animation", label: "Animation", count: 1 },
  { key: "forms", label: "Forms", count: 1 },
]);
assert.deepEqual(categoryCounts([]), []);

// Sorts: newest by date, ties by name; A to Z by name. Input is not mutated.
assert.deepEqual(sortEntries(entries, "newest").map((e) => e.name), [
  "Date Range Picker",
  "Chart Card",
  "Timeline",
  "Magnetic Button",
]);
assert.deepEqual(sortEntries(entries, "az").map((e) => e.name), [
  "Chart Card",
  "Date Range Picker",
  "Magnetic Button",
  "Timeline",
]);
assert.equal(entries[0].name, "Timeline");

// The 14-day window, counted in whole UTC days from the build date.
const now = new Date("2026-09-24T18:00:00Z");
assert.equal(isNew("2026-09-24", now), true);
assert.equal(isNew("2026-09-11", now), true);
assert.equal(isNew("2026-09-10", now), false);
assert.equal(isNew("2025-01-01", now), false);

// Line counting ignores one trailing newline, handles CRLF, and empty code.
assert.equal(countLines("a\nb\nc\n"), 3);
assert.equal(countLines("a\r\nb"), 2);
assert.equal(countLines("a\n\n"), 2);
assert.equal(countLines(""), 0);

// Groups follow the incoming order; members keep theirs.
const newest = sortEntries(entries, "newest");
assert.deepEqual(
  groupByCategory(newest).map((g) => [g.label, g.items.map((e) => e.name)]),
  [
    ["Forms", ["Date Range Picker"]],
    ["Data Display", ["Chart Card", "Timeline"]],
    ["Animation", ["Magnetic Button"]],
  ],
);

// Neighbours wrap at both ends; an unknown slug counts as the first.
const list = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];
assert.deepEqual(neighbors(list, "b"), { prev: { slug: "a" }, next: { slug: "c" } });
assert.deepEqual(neighbors(list, "a"), { prev: { slug: "c" }, next: { slug: "b" } });
assert.deepEqual(neighbors(list, "c"), { prev: { slug: "b" }, next: { slug: "a" } });
assert.deepEqual(neighbors([{ slug: "a" }], "a"), { prev: { slug: "a" }, next: { slug: "a" } });

console.log("catalog: ok");
