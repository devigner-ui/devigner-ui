// Self-check for the MenuDock navigation stack. No framework: `npm test`, or
// `node scripts/menu-path.check.mts` - Node strips the types itself.
import assert from "node:assert/strict";
import { menuAt, backFocusIndex, type MenuNode } from "../packages/ui/src/lib/menu-path.ts";

const tree: MenuNode[] = [
  { label: "Home" },
  { label: "Search", content: "<search panel>" },
  {
    label: "Settings",
    items: [
      { label: "Profile" },
      { label: "Appearance", items: [{ label: "Light" }, { label: "Dark" }] },
      { label: "Sign out" },
    ],
  },
];

// Root is the dock: the items as given, and no title.
const root = menuAt(tree, []);
assert.deepEqual(root.items, tree);
assert.equal(root.title, undefined);
assert.equal(root.truncated, false);

// One level down takes the trigger's label as its title.
const settings = menuAt(tree, [2]);
assert.equal(settings.title, "Settings");
assert.deepEqual(
  settings.items.map((i) => i.label),
  ["Profile", "Appearance", "Sign out"],
);

// Depth 3 works the same way - the point of the index path.
const appearance = menuAt(tree, [2, 1]);
assert.equal(appearance.title, "Appearance");
assert.deepEqual(
  appearance.items.map((i) => i.label),
  ["Light", "Dark"],
);

// Past a leaf, and out of range, both fall back to the deepest valid level.
const pastLeaf = menuAt(tree, [2, 0, 5]);
assert.equal(pastLeaf.truncated, true);
assert.equal(pastLeaf.title, "Settings");
assert.equal(menuAt(tree, [9]).truncated, true);
assert.deepEqual(menuAt(tree, [9]).items, tree);

// A content item is a level of its own: it carries the title, renders no rows,
// and hands back exactly what was put on it.
const search = menuAt(tree, [1]);
assert.equal(search.truncated, false);
assert.equal(search.title, "Search");
assert.equal(search.content, "<search panel>");
assert.deepEqual(search.items, []);

// Content is terminal - nothing sits below it, so descending past one is as
// stale as descending past a leaf.
const pastContent = menuAt(tree, [1, 0]);
assert.equal(pastContent.truncated, true);
assert.deepEqual(pastContent.items, tree);
assert.equal(pastContent.title, undefined);

// An item with neither content nor items is still a plain leaf, not a content
// level - `content: undefined` must not read as "has content".
assert.equal(menuAt([{ label: "Home" }], [0]).truncated, true);
assert.equal(menuAt([{ label: "Home", content: undefined }], [0]).truncated, true);

// Content wins over items, so an item carrying both never opens as a menu.
const both = menuAt([{ label: "Both", content: "panel", items: [{ label: "Row" }] }], [0]);
assert.equal(both.content, "panel");
assert.deepEqual(both.items, []);

// Back focus: to the dock, the trigger's own index; deeper, one row later
// because the menu it lands in carries a Back row above its items.
assert.equal(backFocusIndex([2]), 2);
assert.equal(backFocusIndex([2, 1]), 2);
assert.equal(backFocusIndex([]), 0);

console.log("menu-path: ok");
