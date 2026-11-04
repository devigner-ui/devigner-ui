"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "cn";
import { IconChevronRight } from "@devigner-ui/icons";
import { EASE_OUT, SPRING_HOVER, SPRING_PANEL } from "../lib/easing";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";

/** Space kept between a menu and the viewport's edge, px. */
const EDGE = 8;
/** The menu's own padding, px. A submenu rises by this much so its first row
 *  lines up with the row that opened it. */
const PAD = 6;
/** How long the pointer rests on a row before its submenu opens, and how
 *  long a held finger takes to count as a long press, ms. */
const HOVER_OPEN = 110;
const LONG_PRESS = 500;
/** A finger drifting further than this while held is a scroll, not a press. */
const PRESS_SLOP = 10;

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  /** Keys shown at the row's end, one cap each: ["⌘", "D"]. Display only;
   *  binding them is yours. */
  shortcut?: string[];
  /** Children turn the row into a submenu. */
  items?: ContextMenuEntry[];
  onSelect?: () => void;
  /** Renders the row in the destructive color: Delete, Remove. */
  destructive?: boolean;
  disabled?: boolean;
}

/** A row, or "separator" for a dividing line between groups of rows. */
export type ContextMenuEntry = ContextMenuItem | "separator";

export interface ContextMenuClassNames {
  /** Every menu surface, the submenus included. */
  menu?: string;
  item?: string;
  /** The pill that glides behind the highlighted row. */
  indicator?: string;
}

export interface ContextMenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** The rows, and every submenu under them. */
  items: ContextMenuEntry[];
  /** The area that opens the menu on right-click or long press. */
  children: React.ReactNode;
  /** Fires for every chosen row that isn't a submenu, after its own
   *  `onSelect`. */
  onSelect?: (item: ContextMenuItem) => void;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name of the menu. */
  label?: string;
  /** Leaves the browser's own menu in place. */
  disabled?: boolean;
  classNames?: ContextMenuClassNames;
}

const isItem = (e: ContextMenuEntry): e is ContextMenuItem => e !== "separator";

const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-grid h-5 min-w-5 place-items-center rounded-md border border-border bg-background/40 px-1.5 font-mono text-[11px] leading-none text-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_5%,transparent)]">
    {children}
  </kbd>
);

interface Anchor {
  /** A point for the top level, a row's box for a submenu. */
  x: number;
  y: number;
  row?: DOMRect;
}

interface ListProps {
  entries: ContextMenuEntry[];
  anchor: Anchor;
  label: string;
  depth: number;
  /** Highlight the first row as soon as it opens: keyboard openings. */
  focusFirst: boolean;
  reduced: boolean;
  classNames?: ContextMenuClassNames;
  /** Run a row and close every level. */
  choose: (item: ContextMenuItem) => void;
  /** Close every level, putting focus back where it was. */
  closeAll: () => void;
  /** Close this level only, back to the row that opened it. */
  back?: () => void;
}

function MenuList({ entries, anchor, label, depth, focusFirst, reduced, classNames, choose, closeAll, back }: ListProps) {
  const uid = React.useId();
  const menu = React.useRef<HTMLDivElement>(null);
  const rows = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = React.useState<number | null>(null);
  // n counts openings: reopening while the last one still fades out mounts
  // a fresh submenu instead of reviving the leaving one.
  const [sub, setSub] = React.useState<{ index: number; focusFirst: boolean; n: number } | null>(null);
  const opened = React.useRef(0);
  const [pos, setPos] = React.useState<{ left: number; top: number; origin: string } | null>(null);
  const hover = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  // Placed once its size is known, flipped to stay inside the viewport.
  React.useLayoutEffect(() => {
    const el = menu.current;
    if (!el) return;
    const { offsetWidth: w, offsetHeight: h } = el;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left: number;
    let top: number;
    let ox = "left";
    let oy = "top";
    if (anchor.row) {
      left = anchor.row.right - 2;
      if (left + w > vw - EDGE) {
        left = anchor.row.left - w + 2;
        ox = "right";
      }
      top = anchor.row.top - PAD;
    } else {
      left = anchor.x;
      top = anchor.y;
      if (left + w > vw - EDGE) {
        left = anchor.x - w;
        ox = "right";
      }
      if (top + h > vh - EDGE) {
        top = anchor.y - h;
        oy = "bottom";
      }
    }
    setPos({
      left: Math.max(EDGE, Math.min(left, vw - w - EDGE)),
      top: Math.max(EDGE, Math.min(top, vh - h - EDGE)),
      origin: `${oy} ${ox}`,
    });
  }, [anchor]);

  const enabled = entries
    .map((e, i) => (isItem(e) && !e.disabled ? i : -1))
    .filter((i) => i >= 0);

  const focusRow = (i: number) => {
    setActive(i);
    rows.current[i]?.focus({ preventScroll: true });
  };

  React.useEffect(() => {
    if (!pos) return;
    if (focusFirst && enabled.length) focusRow(enabled[0]);
    else menu.current?.focus({ preventScroll: true });
    // Only once it has been placed.
  }, [pos === null]);

  React.useEffect(() => () => clearTimeout(hover.current), []);

  const openSub = (i: number, viaKeys: boolean) => {
    const entry = entries[i];
    if (!isItem(entry) || !entry.items?.length || entry.disabled) return;
    // Already open: the keys still need to step into it, the pointer doesn't.
    if (sub?.index === i && (!viaKeys || sub.focusFirst)) return;
    setSub({ index: i, focusFirst: viaKeys, n: ++opened.current });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // A submenu handles its own keys; they bubble here through the portal's
    // React tree, so ignore what isn't this level's.
    if (!menu.current?.contains(e.target as Node)) return;
    const at = active === null ? -1 : enabled.indexOf(active);
    const move = (to: number) => {
      e.preventDefault();
      if (enabled.length) focusRow(enabled[(to + enabled.length) % enabled.length]);
    };
    switch (e.key) {
      case "ArrowDown":
        return move(at + 1);
      case "ArrowUp":
        return move(at < 0 ? -1 : at - 1);
      case "Home":
        return move(0);
      case "End":
        return move(enabled.length - 1);
      case "ArrowRight":
        if (active !== null) {
          e.preventDefault();
          openSub(active, true);
        }
        return;
      case "ArrowLeft":
        if (back) {
          e.preventDefault();
          back();
        }
        return;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        return back ? back() : closeAll();
      case "Tab":
        e.preventDefault();
        return closeAll();
    }
    // Type a letter to jump to the next row starting with it.
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const ch = e.key.toLowerCase();
      const order = [...enabled.slice(at + 1), ...enabled.slice(0, at + 1)];
      const hit = order.find((i) => (entries[i] as ContextMenuItem).label.toLowerCase().startsWith(ch));
      if (hit !== undefined) {
        e.preventDefault();
        focusRow(hit);
      }
    }
  };

  const subEntry = sub ? entries[sub.index] : null;
  const subRow = sub ? rows.current[sub.index] : null;

  return (
    <>
      <motion.div
        ref={menu}
        role="menu"
        aria-label={label}
        aria-orientation="vertical"
        tabIndex={-1}
        data-context-menu=""
        onKeyDown={onKeyDown}
        onContextMenu={(e) => e.preventDefault()}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, ...(reduced ? {} : { scale: 0.98 }), transition: { duration: 0.12, ease: EASE_OUT } }}
        transition={reduced ? { duration: 0.12 } : SPRING_PANEL}
        className={cn(
          // The shared interface surface (see AGENTS.md, Interface surfaces).
          // Nested radius: the rows' 12px plus the 6px side padding. The top
          // and bottom get 2px more: the lit top edge reads as a harder line
          // than the sides, and an even 6px looked tighter there.
          "fixed z-50 min-w-56 rounded-[18px] border border-foreground/4 bg-(--panel,var(--background)) px-1.5 py-2 text-foreground outline-none",
          "shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_5%,transparent),0_1px_2px_oklch(19%_0.03_260/0.06),0_18px_44px_-18px_oklch(19%_0.03_260/0.22)]",
          "dark:shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_5%,transparent),0_1px_2px_oklch(0%_0_0/0.4),0_22px_52px_-18px_oklch(0%_0_0/0.7)]",
          classNames?.menu,
        )}
        style={{
          left: pos?.left ?? 0,
          top: pos?.top ?? 0,
          transformOrigin: pos?.origin,
          visibility: pos ? "visible" : "hidden",
          zIndex: 50 + depth,
        }}
      >
        {entries.map((entry, i) => {
          if (!isItem(entry))
            return <div key={`sep-${i}`} role="separator" className="-mx-1.5 my-1 h-px bg-foreground/6" />;
          const on = active === i;
          const hasSub = !!entry.items?.length;
          const expanded = sub?.index === i;
          return (
            <button
              key={`${i}-${entry.label}`}
              ref={(el) => {
                rows.current[i] = el;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={entry.disabled}
              aria-haspopup={hasSub ? "menu" : undefined}
              aria-expanded={hasSub ? expanded : undefined}
              onPointerMove={() => {
                if (entry.disabled || active === i) return;
                focusRow(i);
                clearTimeout(hover.current);
                if (sub && sub.index !== i) setSub(null);
                if (hasSub) hover.current = setTimeout(() => openSub(i, false), HOVER_OPEN);
              }}
              onClick={() => (hasSub ? openSub(i, true) : choose(entry))}
              className={cn(
                // px-2: in a 36px row the caps and icons sit 8px from its top and
                // bottom, so 8px at the sides keeps the content equally inset.
                "relative flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 text-left text-[13px] tracking-[-0.01em] outline-none transition-colors duration-150 ease-out select-none disabled:cursor-not-allowed disabled:opacity-45",
                entry.destructive ? "text-destructive" : on || expanded ? "text-foreground" : "text-muted-foreground",
                classNames?.item,
              )}
            >
              {(on || expanded) && (
                <motion.span
                  aria-hidden
                  layoutId={reduced ? undefined : `${uid}-active`}
                  transition={SPRING_HOVER}
                  className={cn(
                    "absolute inset-0 rounded-xl",
                    entry.destructive ? "bg-destructive/10" : "bg-foreground/4.5 dark:bg-foreground/7",
                    classNames?.indicator,
                  )}
                />
              )}
              {entry.icon && (
                <span
                  aria-hidden
                  className={cn(
                    "relative grid size-5 shrink-0 place-items-center transition-colors duration-150 ease-out [&_svg]:size-4.5",
                    !entry.destructive && (on || expanded ? "text-foreground" : "text-muted-foreground"),
                  )}
                >
                  {entry.icon}
                </span>
              )}
              <span className="relative min-w-0 flex-1 truncate">{entry.label}</span>
              {entry.shortcut && !hasSub && (
                <span aria-hidden className="relative ml-4 flex shrink-0 gap-1">
                  {entry.shortcut.map((k, n) => (
                    <Key key={n}>{k}</Key>
                  ))}
                </span>
              )}
              {hasSub && (
                <IconChevronRight aria-hidden className="relative ml-4 size-3.5 shrink-0 text-muted-foreground" strokeWidth={2.5} />
              )}
            </button>
          );
        })}
      </motion.div>
      <AnimatePresence>
        {sub && subRow && isItem(subEntry!) && (
          <MenuList
            key={sub.n}
            entries={subEntry.items ?? []}
            anchor={{ x: 0, y: 0, row: subRow.getBoundingClientRect() }}
            label={subEntry.label}
            depth={depth + 1}
            focusFirst={sub.focusFirst}
            reduced={reduced}
            classNames={classNames}
            choose={choose}
            closeAll={closeAll}
            back={() => {
              const i = sub.index;
              setSub(null);
              focusRow(i);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export const ContextMenu = React.forwardRef<HTMLDivElement, ContextMenuProps>(function ContextMenu(
  { items, children, onSelect, onOpenChange, label = "Actions", disabled = false, classNames, className, ...rest },
  ref,
) {
  const reduced = useReducedMotionPreference();
  const [menu, setMenu] = React.useState<{ anchor: Anchor; focusFirst: boolean; n: number } | null>(null);
  const [mounted, setMounted] = React.useState(false);
  /** Where focus was before the menu opened, to give it back. */
  const restore = React.useRef<HTMLElement | null>(null);
  const press = React.useRef<{ x: number; y: number; t: ReturnType<typeof setTimeout> } | null>(null);
  const report = React.useRef(onOpenChange);
  report.current = onOpenChange;

  React.useEffect(() => setMounted(true), []);

  const openAt = (x: number, y: number, focusFirst: boolean) => {
    if (!menu) restore.current = document.activeElement as HTMLElement | null;
    // A new count remounts the menu, so opening again elsewhere replays the
    // entrance from the new spot.
    setMenu((m) => ({ anchor: { x, y }, focusFirst, n: (m?.n ?? 0) + 1 }));
  };

  const close = React.useCallback((giveBack: boolean) => {
    setMenu(null);
    if (giveBack) restore.current?.focus?.({ preventScroll: true });
  }, []);

  const isOpen = menu !== null;
  React.useEffect(() => {
    report.current?.(isOpen);
  }, [isOpen]);

  // Anything that moves the page under the menu, or a press elsewhere,
  // closes it without taking focus anywhere.
  React.useEffect(() => {
    if (!isOpen) return;
    const away = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.("[data-context-menu]")) close(false);
    };
    const shut = () => close(false);
    document.addEventListener("pointerdown", away, true);
    window.addEventListener("resize", shut);
    window.addEventListener("blur", shut);
    document.addEventListener("scroll", shut, true);
    return () => {
      document.removeEventListener("pointerdown", away, true);
      window.removeEventListener("resize", shut);
      window.removeEventListener("blur", shut);
      document.removeEventListener("scroll", shut, true);
    };
  }, [isOpen, close]);

  const cancelPress = () => {
    if (press.current) clearTimeout(press.current.t);
    press.current = null;
  };
  React.useEffect(() => cancelPress, []);

  const choose = (item: ContextMenuItem) => {
    item.onSelect?.();
    onSelect?.(item);
    close(true);
  };

  return (
    <div
      ref={ref}
      {...rest}
      className={className}
      onContextMenu={(e) => {
        rest.onContextMenu?.(e);
        if (disabled || e.defaultPrevented) return;
        e.preventDefault();
        cancelPress();
        openAt(e.clientX, e.clientY, false);
      }}
      onKeyDown={(e) => {
        rest.onKeyDown?.(e);
        if (disabled) return;
        if (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) {
          e.preventDefault();
          const box = (e.target as HTMLElement).getBoundingClientRect();
          openAt(box.left + 8, box.bottom + 4, true);
        }
      }}
      // iOS never fires contextmenu, so a held finger opens it too.
      onPointerDown={(e) => {
        rest.onPointerDown?.(e);
        if (disabled || e.pointerType !== "touch") return;
        // Presses inside the open menu reach here through the portal.
        if ((e.target as Element).closest("[data-context-menu]")) return;
        const { clientX: x, clientY: y } = e;
        cancelPress();
        press.current = { x, y, t: setTimeout(() => openAt(x, y, false), LONG_PRESS) };
      }}
      onPointerMove={(e) => {
        rest.onPointerMove?.(e);
        const p = press.current;
        if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > PRESS_SLOP) cancelPress();
      }}
      onPointerUp={(e) => {
        rest.onPointerUp?.(e);
        cancelPress();
      }}
      onPointerCancel={(e) => {
        rest.onPointerCancel?.(e);
        cancelPress();
      }}
    >
      {children}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {menu && (
              <MenuList
                key={menu.n}
                entries={items}
                anchor={menu.anchor}
                label={label}
                depth={0}
                focusFirst={menu.focusFirst}
                reduced={reduced}
                classNames={classNames}
                choose={choose}
                closeAll={() => close(true)}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
});

ContextMenu.displayName = "ContextMenu";
