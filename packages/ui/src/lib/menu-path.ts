// The MenuDock navigation stack, kept apart from the component so it stays
// pure - and runnable. A dock level is addressed by a path of indices: [] is
// the dock itself, [4] the menu item 4 opened, [4, 1] the menu item 1 of that
// opened. Push to descend, pop to go back, and arbitrary depth needs no
// special case per level.

/** The shape the stack needs. The component's own item type extends this.
 *  `content` is deliberately `unknown`: the stack only asks whether an item
 *  has some, never what it is, so this module stays free of React. */
export interface MenuNode {
  label: string;
  items?: MenuNode[];
  content?: unknown;
}

export interface Level<T extends MenuNode> {
  /** Rows to render, the dock's own items at the root. Empty on a content
   *  level, which renders its content in place of rows. */
  items: T[];
  /** Label of the item that opened this level - the panel's title. Undefined
   *  at the root, which is the dock and has no title. */
  title?: string;
  /** Set when the path landed on an item carrying content. The component
   *  renders this instead of `items`. */
  content?: unknown;
  /** True when the path pointed past a leaf, so `items` is the deepest level
   *  that did resolve. A path only goes stale if `items` changes underneath an
   *  open menu; resolving to the nearest valid ancestor beats rendering blank. */
  truncated: boolean;
}

/** Walks `path` into `items`, stopping at the last level that exists.
 *
 *  Content is terminal: an item carrying it is a level in its own right, and
 *  nothing can sit below it. A path that tries to descend past one is as stale
 *  as a path past a leaf, and truncates the same way. */
export function menuAt<T extends MenuNode>(
  items: T[],
  path: number[],
): Level<T> {
  let level = items;
  let title: string | undefined;

  for (let step = 0; step < path.length; step++) {
    const next = level[path[step]];

    if (next?.content !== undefined) {
      // Terminal, so only the last segment may land here.
      return step === path.length - 1
        ? { items: [], title: next.label, content: next.content, truncated: false }
        : { items: level, title, truncated: true };
    }

    if (!next?.items?.length) return { items: level, title, truncated: true };
    level = next.items as T[];
    title = next.label;
  }

  return { items: level, title, truncated: false };
}

/** Row to focus after going back: the trigger the menu came out of, so the
 *  pointer lands where it left. Menu levels carry a Back row at index 0 and
 *  the dock does not, hence the shift on all but the root. */
export function backFocusIndex(path: number[]): number {
  const trigger = path[path.length - 1] ?? 0;
  return path.length > 1 ? trigger + 1 : trigger;
}
