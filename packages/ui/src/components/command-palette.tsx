"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "cn";
import {
  IconArrowUpDown,
  IconBackspace,
  IconChevronLeft,
  IconChevronRight,
  IconMagnifierGap,
} from "@devigner-ui/icons";
import {
  SPRING_HOVER,
  SPRING_LAYOUT,
  SPRING_SWAP,
  TWEEN_HOVER_FADE,
  TWEEN_HOVER_OUT,
} from "../lib/easing";
import { useControllableState } from "../lib/hooks/use-controllable-state";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";
import { menuAt, type MenuNode } from "../lib/menu-path";

/** How far a page slides in from, px. Enough to read as sideways travel,
 *  short enough that the list never looks like a carousel. */
const SLIDE = 24;

export interface CommandPaletteItem extends MenuNode {
  label: string;
  /** What `onSelect` and the keys are matched by. Falls back to `label`. */
  id?: string;
  icon?: React.ReactNode;
  /** A muted second line under the label. The search matches it too. */
  description?: string;
  /** The word shown at the end of the row while it's active, such as
   *  "Search" or "Play". Falls back to `messages.run`; a row with a
   *  `shortcut` shows its keys instead. */
  action?: string;
  /** Section heading. Rows sharing one sit together under it, in the order
   *  the first of each appears. Ignored while searching. */
  group?: string;
  /** Extra words the search matches, such as "dark mode" for a theme row. */
  keywords?: string[];
  /** Keys shown at the row's end, one cap each: ["⌘", "D"]. Display only;
   *  binding them is yours. */
  shortcut?: string[];
  /** Children turn the row into a page: Enter opens it, and its label
   *  becomes the crumb in the field. */
  items?: CommandPaletteItem[];
  onSelect?: () => void;
  disabled?: boolean;
}

/** Every built-in string. Override any of them through `messages`. */
export interface CommandPaletteMessages {
  placeholder: string;
  /** Shown when nothing matches the search. */
  empty: (query: string) => string;
  /** Shown on a page with no rows. */
  emptyPage: string;
  /** Accessible name of the crumb button that goes back a page. */
  back: (title: string) => string;
  move: string;
  open: string;
  goBack: string;
  /** The active row's action word when the item sets no `action`. */
  run: string;
}

export const COMMAND_PALETTE_MESSAGES: CommandPaletteMessages = {
  placeholder: "Search or jump to...",
  empty: (query) => `No commands match "${query}"`,
  emptyPage: "Nothing here yet",
  back: (title) => `Back from ${title}`,
  move: "Move",
  open: "Open",
  goBack: "Back",
  run: "Run",
};

export interface CommandPaletteGroupAction {
  label: string;
  onSelect: () => void;
}

export interface CommandPaletteClassNames {
  root?: string;
  field?: string;
  list?: string;
  item?: string;
  /** The pill that glides behind the active row. */
  indicator?: string;
  footer?: string;
}

export interface CommandPaletteProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  /** The rows, and every page nested under them. */
  items: CommandPaletteItem[];
  /** Fires for every chosen row that isn't a page, after its own
   *  `onSelect`. */
  onSelect?: (item: CommandPaletteItem) => void;
  /** Controlled search text. */
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Controlled page, as an index path: [] is the top, [3] the page row 3
   *  opened. */
  path?: number[];
  defaultPath?: number[];
  onPathChange?: (path: number[]) => void;
  /** After a row runs, clears the search and returns to the top. Turn off
   *  for a palette that stays where it was, such as a settings page. */
  resetOnSelect?: boolean;
  /** Shows the key hints under the list. */
  hints?: boolean;
  /** Accessible name of the search field. */
  label?: string;
  /** Moves focus into the field on mount, for a palette opened in a dialog. */
  autoFocus?: boolean;
  /** Fires on an Escape with nothing left to undo (no search, no page), and
   *  shows an Esc cap in the field. Close a dialog from here. */
  onEscape?: () => void;
  /** A button at the end of a group's heading, keyed by the group's name,
   *  such as `{ Recent: { label: "Clear", onSelect } }`. */
  groupActions?: Record<string, CommandPaletteGroupAction>;
  /** Replaces any built-in string; see COMMAND_PALETTE_MESSAGES. */
  messages?: Partial<CommandPaletteMessages>;
  classNames?: CommandPaletteClassNames;
}

interface Row {
  item: CommandPaletteItem;
  /** Index path from the top to this row. */
  path: number[];
  /** Pages between the current one and this row, shown on search results. */
  trail: string[];
}

const keyOf = (path: number[]) => path.join(".");

const words = (item: CommandPaletteItem) =>
  [item.label, item.description ?? "", ...(item.keywords ?? [])].map((w) => w.toLowerCase());

/** 3 when the label starts with the query, 2 when a word in it does, 1 for
 *  any other hit in the label or keywords, 0 for none. */
function score(item: CommandPaletteItem, q: string) {
  const label = item.label.toLowerCase();
  if (label.startsWith(q)) return 3;
  if (label.split(/\s+/).some((w) => w.startsWith(q))) return 2;
  return words(item).some((w) => w.includes(q)) ? 1 : 0;
}

/** The rows to show: the page as it is, or with a query, every match on it
 *  and below it, best first. */
function rowsFor(
  items: CommandPaletteItem[],
  path: number[],
  query: string,
): Row[] {
  const level = menuAt(items, path).items;
  const q = query.trim().toLowerCase();
  if (!q) return level.map((item, i) => ({ item, path: [...path, i], trail: [] }));
  const hits: (Row & { s: number })[] = [];
  const walk = (list: CommandPaletteItem[], at: number[], trail: string[]) =>
    list.forEach((item, i) => {
      const here = [...at, i];
      const s = score(item, q);
      if (s) hits.push({ item, path: here, trail, s });
      if (item.items?.length) walk(item.items, here, [...trail, item.label]);
    });
  walk(level, path, []);
  // Array.prototype.sort is stable, so equal scores keep their order.
  return hits.sort((a, b) => b.s - a.s);
}

/** The label with the first hit of the query set apart. */
function Highlight({ text, query, className }: { text: string; query: string; className?: string }) {
  const q = query.trim();
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className={cn("bg-transparent font-semibold text-primary", className)}>
        {text.slice(at, at + q.length)}
      </mark>
      {text.slice(at + q.length)}
    </>
  );
}

const Key = ({ children }: { children: React.ReactNode }) => (
  // A small inset well. leading-none: with the inherited line height the
  // glyphs sat low in the cap.
  <kbd className="inline-grid h-5 min-w-5 place-items-center rounded-md border border-border bg-background/40 px-1.5 font-mono text-[11px] leading-none text-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_5%,transparent)] [&_svg]:size-3">
    {children}
  </kbd>
);

export const CommandPalette = React.forwardRef<HTMLDivElement, CommandPaletteProps>(
  function CommandPalette(
    {
      items,
      onSelect,
      query: queryProp,
      defaultQuery = "",
      onQueryChange,
      path: pathProp,
      defaultPath = [],
      onPathChange,
      resetOnSelect = true,
      hints = true,
      label = "Command palette",
      autoFocus = false,
      onEscape,
      groupActions,
      messages,
      classNames,
      className,
      ...rest
    },
    ref,
  ) {
    const m = { ...COMMAND_PALETTE_MESSAGES, ...messages };
    const reduced = useReducedMotionPreference();
    const uid = React.useId();
    const [query, setQuery] = useControllableState({
      value: queryProp,
      defaultValue: defaultQuery,
      onValueChange: onQueryChange,
    });
    const [path, setPath] = useControllableState<number[]>({
      value: pathProp,
      defaultValue: defaultPath,
      onValueChange: onPathChange,
    });
    const level = menuAt(items, path);
    const rows = React.useMemo(() => rowsFor(items, path, query), [items, path, query]);
    const searching = query.trim() !== "";

    // The active row, kept by its path so a search or a page change can
    // put it back on the same item.
    const [activeKey, setActiveKey] = React.useState<string | null>(null);
    const firstEnabled = rows.findIndex((r) => !r.item.disabled);
    const found = rows.findIndex((r) => keyOf(r.path) === activeKey && !r.item.disabled);
    const active = found >= 0 ? found : firstEnabled;

    const dir = React.useRef(1);
    const input = React.useRef<HTMLInputElement>(null);
    const list = React.useRef<HTMLDivElement>(null);
    const pageKey = keyOf(path);
    // Per page: the outgoing page lingers while it slides out, and its ids
    // must not collide with the incoming one's.
    const listId = `${uid}-list-${pageKey}`;
    const optionId = (i: number) => `${uid}-${pageKey}-o${i}`;

    React.useEffect(() => {
      if (autoFocus) input.current?.focus({ preventScroll: true });
    }, [autoFocus]);

    // Keep the active row in view inside the list, never by scrolling the
    // page around it.
    React.useEffect(() => {
      const box = list.current;
      const el = box?.querySelector<HTMLElement>(`[data-index="${active}"]`);
      if (!box || !el) return;
      if (el.offsetTop < box.scrollTop) box.scrollTop = el.offsetTop - 6;
      else if (el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight)
        box.scrollTop = el.offsetTop + el.offsetHeight - box.clientHeight + 6;
    }, [active, pageKey, query]);

    // One highlight per page, placed from the active row's box in the list.
    // It steps between rows, but fades in where the pointer is on each new
    // entry (the session), instead of sliding over from the keyboard's row.
    const [box, setBox] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [session, setSession] = React.useState(0);
    const entered = React.useRef(false);
    React.useLayoutEffect(() => {
      const el = list.current;
      if (!el) return;
      const place = () => {
        const row = el.querySelector<HTMLElement>(`[data-index="${active}"]`);
        const next = row && {
          x: row.offsetLeft,
          y: row.offsetTop,
          width: row.offsetWidth,
          height: row.offsetHeight,
        };
        setBox((b) =>
          b && next && b.x === next.x && b.y === next.y && b.width === next.width && b.height === next.height
            ? b
            : next,
        );
      };
      place();
      if (typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(place);
      ro.observe(el);
      return () => ro.disconnect();
    }, [active, rows, pageKey]);

    // The row nearest the pointer, so a heading or the gap between rows
    // still lights one. Resting on a disabled row lights nothing new.
    const pointAt = (e: React.PointerEvent<HTMLElement>) => {
      const all = e.currentTarget.querySelectorAll<HTMLElement>("[data-index]");
      let best = -1;
      let dist = Infinity;
      for (const el of all) {
        const r = el.getBoundingClientRect();
        const i = Number(el.dataset.index);
        const inside = e.clientY >= r.top && e.clientY <= r.bottom;
        if (rows[i]?.item.disabled) {
          if (inside) return;
          continue;
        }
        const d = inside ? -1 : Math.abs(e.clientY - (r.top + r.height / 2));
        if (d < dist) {
          dist = d;
          best = i;
        }
      }
      if (best < 0 || best === active) return;
      if (entered.current) {
        entered.current = false;
        setSession((s) => s + 1);
      }
      setActiveKey(keyOf(rows[best].path));
    };

    // The panel glides to each page's height instead of snapping.
    const body = React.useRef<HTMLDivElement>(null);
    const [height, setHeight] = React.useState<number | "auto">("auto");
    React.useLayoutEffect(() => {
      const el = body.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const navigate = (next: number[], restore?: number[]) => {
      dir.current = next.length >= path.length ? 1 : -1;
      setQuery("");
      setPath(next);
      setActiveKey(restore ? keyOf(restore) : null);
    };
    const back = () => {
      if (path.length) navigate(path.slice(0, -1), path);
    };

    const choose = (i: number) => {
      const row = rows[i];
      if (!row || row.item.disabled) return;
      if (row.item.items?.length) return navigate(row.path);
      row.item.onSelect?.();
      onSelect?.(row.item);
      if (resetOnSelect) {
        if (path.length) dir.current = -1;
        setQuery("");
        setPath([]);
        setActiveKey(null);
      }
    };

    const step = (by: 1 | -1) => {
      if (firstEnabled < 0) return;
      let i = active;
      for (let n = 0; n < rows.length; n++) {
        i = (i + by + rows.length) % rows.length;
        if (!rows[i].item.disabled) break;
      }
      setActiveKey(keyOf(rows[i].path));
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.nativeEvent.isComposing) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        step(e.key === "ArrowDown" ? 1 : -1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        choose(active);
      } else if (e.key === "Backspace" && !query && path.length) {
        e.preventDefault();
        back();
      } else if (e.key === "Escape" && (query || path.length)) {
        // Handled here, so a dialog around the palette only closes on an
        // Escape with nothing left to undo.
        e.preventDefault();
        e.stopPropagation();
        if (query) setQuery("");
        else back();
      } else if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
      }
    };

    // Rows in their groups, groups in the order they first appear. Searching
    // shows one flat list, best match first.
    const sections: { group?: string; rows: { row: Row; index: number }[] }[] = [];
    rows.forEach((row, index) => {
      const group = searching ? undefined : row.item.group;
      const last = sections[sections.length - 1];
      const section = searching
        ? last
        : sections.find((s) => s.group === group);
      if (section) section.rows.push({ row, index });
      else sections.push({ group, rows: [{ row, index }] });
    });

    const slide = reduced
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
      : {
          initial: { opacity: 0, x: SLIDE * dir.current },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -SLIDE * dir.current },
        };

    return (
      <div
        ref={ref}
        className={cn(
          // A floating panel: a --panel surface where the app defines one, a
          // faint rim, a lit top edge and a soft lift.
          "w-full max-w-md overflow-hidden rounded-3xl border border-foreground/4 bg-(--panel,var(--background)) text-foreground",
          "shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_5%,transparent),0_1px_2px_oklch(19%_0.03_260/0.06),0_18px_44px_-18px_oklch(19%_0.03_260/0.22)]",
          "dark:shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_5%,transparent),0_1px_2px_oklch(0%_0_0/0.4),0_22px_52px_-18px_oklch(0%_0_0/0.7)]",
          className,
          classNames?.root,
        )}
        {...rest}
      >
        <div className={cn("flex h-13 items-center gap-2.5 border-b border-border px-4", classNames?.field)}>
          <IconMagnifierGap aria-hidden className="size-4.5 shrink-0 text-muted-foreground" strokeWidth={2} />
          <AnimatePresence initial={false} mode="popLayout">
            {level.title && (
              <motion.button
                key={pageKey}
                type="button"
                onClick={back}
                aria-label={m.back(level.title)}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, filter: "blur(4px)" }}
                transition={SPRING_SWAP}
                className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-0.5 rounded-lg bg-primary/12 pr-2 pl-1 text-[13px] font-medium whitespace-nowrap text-primary outline-none hover:bg-primary/18 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <IconChevronLeft aria-hidden className="size-3.5" strokeWidth={2.5} />
                {level.title}
              </motion.button>
            )}
          </AnimatePresence>
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveKey(null);
            }}
            onKeyDown={onKeyDown}
            placeholder={m.placeholder}
            aria-label={label}
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? optionId(active) : undefined}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            // Inline, so a page's global :focus-visible outline can't win.
            // The caret is the focus cue; the field fills the whole bar.
            style={{ outline: "none" }}
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          {/* Esc only does something with a search to clear, a page to leave,
              or an onEscape to call, so the cap shows only then. */}
          {(onEscape || query || path.length > 0) && (
            <span aria-hidden className="shrink-0">
              <Key>Esc</Key>
            </span>
          )}
        </div>

        <motion.div
          animate={{ height }}
          transition={reduced ? { duration: 0 } : SPRING_LAYOUT}
          className="relative overflow-hidden"
        >
          <div ref={body}>
            <AnimatePresence initial={false} mode="popLayout">
              <motion.div
                key={pageKey}
                {...slide}
                transition={reduced ? { duration: 0.12 } : SPRING_SWAP}
              >
                <motion.div
                  // Never cleared: the outgoing page unmounts after the new one
                  // mounted, and would otherwise null the ref under it.
                  ref={(el) => {
                    if (el) list.current = el;
                  }}
                  layoutScroll
                  id={listId}
                  role="listbox"
                  aria-label={level.title ?? label}
                  onPointerEnter={() => (entered.current = true)}
                  onPointerMove={pointAt}
                  className={cn("relative max-h-96 overflow-y-auto overscroll-contain p-2", classNames?.list)}
                >
                  <AnimatePresence>
                    {box && (
                      <motion.span
                        key={session}
                        aria-hidden
                        initial={{ opacity: 0, ...box }}
                        animate={{ opacity: 1, ...box }}
                        exit={{ opacity: 0, transition: TWEEN_HOVER_OUT }}
                        transition={{ ...(reduced ? { duration: 0 } : SPRING_HOVER), opacity: TWEEN_HOVER_FADE }}
                        className={cn(
                          "pointer-events-none absolute top-0 left-0 rounded-xl bg-foreground/4.5 dark:bg-foreground/7",
                          classNames?.indicator,
                        )}
                      />
                    )}
                  </AnimatePresence>
                  {rows.length === 0 && (
                    <p role="status" className="px-3 py-7 text-center text-sm text-muted-foreground">
                      {searching ? m.empty(query.trim()) : m.emptyPage}
                    </p>
                  )}
                  {sections.map((section, s) => {
                    const headingId = `${uid}-g${s}`;
                    return (
                      <div
                        key={section.group ?? `s${s}`}
                        role={section.group ? "group" : undefined}
                        aria-labelledby={section.group ? headingId : undefined}
                      >
                        {section.group && (
                          <div className="flex items-center justify-between px-3 pt-3 pb-1">
                            <span
                              id={headingId}
                              className="font-mono text-[11.5px] text-muted-foreground"
                            >
                              {section.group}
                            </span>
                            {groupActions?.[section.group] && (
                              <button
                                type="button"
                                // Keeps focus in the field, where the keys work.
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={groupActions[section.group].onSelect}
                                className="-mr-1.5 cursor-pointer rounded-md px-1.5 font-mono text-[11.5px] text-muted-foreground transition-colors duration-150 ease-out outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {groupActions[section.group].label}
                              </button>
                            )}
                          </div>
                        )}
                        {section.rows.map(({ row, index }) => {
                          const on = index === active;
                          const page = !!row.item.items?.length;
                          return (
                            <div
                              key={keyOf(row.path)}
                              id={optionId(index)}
                              data-index={index}
                              role="option"
                              aria-selected={on}
                              aria-disabled={row.item.disabled || undefined}
                              aria-haspopup={page ? "listbox" : undefined}
                              // Keeps focus in the field, where the keys work.
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => choose(index)}
                              className={cn(
                                "relative flex min-h-11 cursor-pointer items-center gap-3 rounded-xl py-1.5 pr-3.5 pl-2 text-[13px] tracking-[-0.01em] transition-colors duration-150 ease-out select-none",
                                on ? "text-foreground" : "text-muted-foreground",
                                !row.item.icon && "pl-3",
                                row.item.disabled && "cursor-not-allowed opacity-45",
                                classNames?.item,
                              )}
                            >
                              {row.item.icon && (
                                <span
                                  aria-hidden
                                  className={cn(
                                    // An inset well, like the knob tracks it sits beside in a settings panel.
                                    "relative grid size-8 shrink-0 place-items-center rounded-[10px] border border-border bg-background/40 shadow-[inset_0_1px_2px_oklch(0%_0_0/0.08)] transition-colors duration-150 ease-out [&_svg]:size-4",
                                    on ? "text-foreground" : "text-muted-foreground",
                                  )}
                                >
                                  {row.item.icon}
                                </span>
                              )}
                              <span className="relative flex min-w-0 flex-1 flex-col">
                                <span className="truncate leading-4.5 font-medium">
                                  <Highlight text={row.item.label} query={query} />
                                  {row.trail.length > 0 && (
                                    <span className="ml-2 text-[12.5px] font-normal text-muted-foreground">
                                      {row.trail.join(" / ")}
                                    </span>
                                  )}
                                </span>
                                {row.item.description && (
                                  <span className="truncate text-[12px]/4 tracking-normal text-muted-foreground">
                                    {row.item.description}
                                  </span>
                                )}
                              </span>
                              {row.item.shortcut && !page ? (
                                <span aria-hidden className="relative flex shrink-0 gap-1">
                                  {row.item.shortcut.map((k, n) => (
                                    <Key key={n}>{k}</Key>
                                  ))}
                                </span>
                              ) : (
                                on &&
                                !page && (
                                  <span aria-hidden className="relative shrink-0 text-[12.5px] font-medium text-primary">
                                    {row.item.action ?? m.run}
                                  </span>
                                )
                              )}
                              {page && (
                                <IconChevronRight
                                  aria-hidden
                                  className="relative size-4 shrink-0 text-muted-foreground"
                                  strokeWidth={2.5}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {hints && (
          <div
            aria-hidden
            className={cn(
              "flex items-center gap-4 border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground",
              classNames?.footer,
            )}
          >
            <span className="flex items-center gap-1.5">
              <Key><IconArrowUpDown strokeWidth={2.5} /></Key>
              {m.move}
            </span>
            <span className="flex items-center gap-1.5">
              <Key>Enter</Key>
              {m.open}
            </span>
            {path.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Key><IconBackspace strokeWidth={2} /></Key>
                {m.goBack}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);

CommandPalette.displayName = "CommandPalette";
