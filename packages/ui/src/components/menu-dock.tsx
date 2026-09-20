"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "cn";
import { SPRING_LAYOUT, SPRING_PRESS, SPRING_SWAP } from "../lib/easing";
import { backFocusIndex, menuAt, type MenuNode } from "../lib/menu-path";
import { IconChevronRight } from "@devigner-ui/icons";

/** Dock button, px. The dock's height is this plus the shell's padding either
 *  side, and DOCK_RADIUS is half of that - which is what makes the closed
 *  state read as a pill rather than a rounded box. */
const TAP = 40;
const PAD = 8;
const DOCK_RADIUS = (TAP + PAD * 2) / 2;
/** The shell's own border and the gap between dock buttons. Both live here
 *  rather than only in the classes because the closed footprint is computed
 *  from them. */
const BORDER = 1;
const GAP = 4;
/** The closed dock's outer height. The wrapper is fixed to exactly this, so
 *  the dock reserves its own footprint and a panel grows up out of it rather
 *  than pushing the page around. */
const CLOSED_H = BORDER * 2 + PAD * 2 + TAP;
/** The closed dock's outer width, from the item count alone - every dock
 *  button is TAP wide with GAP between, so this needs no measuring. */
const closedWidth = (count: number) =>
  BORDER * 2 + PAD * 2 + count * TAP + Math.max(0, count - 1) * GAP;
/** Panel corners. Close to DOCK_RADIUS on purpose: the two states share a
 *  corner, so the morph reads as one surface growing rather than a box
 *  swapping in. Pull them apart and the radius becomes the effect. */
const PANEL_RADIUS = 26;

/** How far a row slides in from, px. Enough to read as coming from the side:
 *  the surface is still settling underneath, and a timid throw gets lost in
 *  it. Much more than this and the rows read as a carousel. */
const SLIDE = 32;
/** How far the dock's own icons rise into place, px. Much smaller than SLIDE:
 *  the dock is the resting state, and it should settle rather than arrive. */
const DOCK_RISE = 10;
/** Held back until the surface has all but finished growing.
 *
 *  The surface grows upward, and motion fakes that growth with a projection
 *  transform on the shell - which drags everything inside it. Rows mounted
 *  during the growth ride that drag upward, and the level reads as rising from
 *  the bottom however hard the rows themselves slide sideways. Measured on the
 *  Account menu, a row visible from the start travels 22px vertically against
 *  32px of slide: 1.5x, not enough to read as horizontal. Waiting until the
 *  projection is near identity leaves 6px against the same 32px - 5.3x, and
 *  the slide is the only motion left to see.
 *
 *  Later still keeps trimming that residue (0.28 measures 8.9x) but buys less
 *  than it costs in latency. The alternative to the whole delay is animating
 *  the shell's width and height directly instead of by projection, which drags
 *  nothing - but that needs the content measured, and this is two lines. */
const ENTER_DELAY = 0.24;
/** Gap between consecutive rows arriving. Six rows at 28ms is under a fifth of
 *  a second all told, so the level still lands as one gesture. */
const STAGGER = 0.028;
/** Rows leave faster than they arrive. The outgoing level is not worth
 *  waiting for, and a slow exit is what makes a menu feel sticky. */
const EXIT = 0.11;

export interface MenuDockItem extends MenuNode {
  /** Row glyph. Optional, so a text-only menu row costs nothing. */
  icon?: React.ReactNode;
  /** Swapped in while this item is the active one. Without it the icon never
   *  changes, so an item opts into the state by supplying the second glyph. */
  activeIcon?: React.ReactNode;
  label: string;
  /** Children turn this item into a submenu, and its label becomes that
   *  menu's title. An item with both `items` and `onSelect` opens the menu -
   *  a row cannot both descend and act. */
  items?: MenuDockItem[];
  /** Makes the surface morph into this instead of into a menu - a search
   *  field, a grid, anything. The dock never learns what it is. Content is
   *  terminal, nothing nests below it, and it wins over `items` if both are
   *  given. The Back row above it carries the item's label, same as a menu. */
  content?: React.ReactNode;
  href?: string;
  onSelect?: () => void;
  /** What `active` is matched against. Falls back to `label`, so two items in
   *  one level that share a label need ids to be told apart. */
  id?: string;
  /** Renders the row in the destructive colour - Sign out, Delete. */
  destructive?: boolean;
}

export interface MenuDockProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  /** The dock, and every menu hanging off it. */
  items: MenuDockItem[];
  /** `id` (or `label`) of the current item, which renders its `activeIcon`. */
  active?: string;
  /** Pins the dock to the bottom centre of the viewport. Off by default: the
   *  parent owns the position, the way the other components here behave. */
  floating?: boolean;
  /** Fires on every level change, with the new index path. [] is the dock.
   *  Also fires for the automatic correction when `items` changes under an
   *  open level, which is the one change the dock makes on its own. */
  onNavigate?: (path: number[]) => void;
  /** Controlled navigation path - `[]` is the dock, `[4]` the level item 4
   *  opened. Omit it and the dock keeps its own; pass it, with `onNavigate`,
   *  to drive the dock from outside: closing it on a route change, deep
   *  linking to a level, restoring where someone left off.
   *
   *  While it is passed the dock renders this and nothing else, so a level
   *  only changes when you change it. That includes the corrections the dock
   *  would otherwise make for itself - it still reports them through
   *  `onNavigate`, but applying them is yours. */
  path?: number[];
  /** Accessible name for the dock itself. */
  label?: string;
  /** Classes for the footprint wrapper - the box that holds the closed dock's
   *  place in the page. Positioning belongs here; the surface inside it is
   *  taken out of flow so it can grow upward. */
  className?: string;
}

/** The shell clips its overflow, and focusing something the clip is hiding
 *  makes the browser scroll that hidden box to reveal it - which shifts the
 *  whole panel and never scrolls back. Rows are mid-transition when focus
 *  moves to them, so every focus this component performs opts out. */
const NO_SCROLL = { preventScroll: true } as const;

const keyOf = (item: MenuDockItem) => item.id ?? item.label;

/** Shared chrome for the two inline glyphs, and for whatever icon comes in. */
const GLYPH = "grid size-5 shrink-0 place-items-center [&_svg]:size-5";

const stroke = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Outline/solid icon swap. Only mounts the machinery when an item actually
 *  supplies both glyphs, so the common row stays a plain span. */
function Glyph({
  item,
  on,
  reduced,
}: {
  item: MenuDockItem;
  on: boolean;
  reduced: boolean;
}) {
  if (!item.icon || !item.activeIcon) return <>{item.icon ?? null}</>;

  const away = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.55 };

  return (
    <span className="relative grid place-items-center">
      {/* popLayout takes the outgoing glyph out of flow, so the incoming one
          lands exactly where it sat without either being positioned by hand. */}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={on ? "on" : "off"}
          initial={away}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={away}
          transition={reduced ? { duration: 0.12 } : SPRING_SWAP}
          className="grid place-items-center"
        >
          {on ? item.activeIcon : item.icon}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** One row - a link when it carries an href, a button otherwise. The
 *  `data-dock-row` hook is what the arrow keys walk. */
function Row({
  href,
  className,
  children,
  onActivate,
  onFocus,
  /** What opening this row produces, for `aria-haspopup`. A content row opens
   *  a panel, not a menu, and saying "menu" there misdescribes it. */
  haspopup = false,
  /** Passed explicitly rather than defaulted: a content level omits it, and a
   *  default would swallow that - `role={undefined}` takes the default. */
  role,
  tabIndex = 0,
  ...rest
}: {
  href?: string;
  className?: string;
  children: React.ReactNode;
  onActivate: () => void;
  onFocus?: () => void;
  haspopup?: "menu" | "dialog" | false;
  role?: "menuitem";
  tabIndex?: number;
  /* Narrowed to what a row actually passes rather than all of
     HTMLAttributes: that carries React's own onDrag, whose signature
     contradicts the gesture one motion puts on the same prop. */
} & React.AriaAttributes & { style?: React.CSSProperties; title?: string }) {
  const shared = {
    "data-dock-row": "",
    role,
    tabIndex,
    onClick: onActivate,
    onFocus,
    whileTap: { scale: 0.96 },
    transition: SPRING_PRESS,
    className: cn(
      "relative flex cursor-pointer items-center outline-none",
      "focus-visible:ring-2 focus-visible:ring-accent/60",
      className,
    ),
    /* No aria-expanded anywhere, deliberately. Expanding replaces the trigger
       with the level it opened, so the row never exists in an expanded state -
       the attribute could only ever read "false", which is worse than absent. */
    ...(haspopup ? { "aria-haspopup": haspopup } : {}),
    ...rest,
  } as const;

  // A row that opens something is never a link: it navigates the dock, not
  // the document.
  return href && !haspopup ? (
    <motion.a href={href} {...shared}>
      {children}
    </motion.a>
  ) : (
    <motion.button type="button" {...shared}>
      {children}
    </motion.button>
  );
}

export function MenuDock({
  items,
  active,
  floating = false,
  onNavigate,
  label = "Menu",
  className,
  style,
  path: controlledPath,
  ...rest
}: MenuDockProps) {
  const reduced = useReducedMotion() ?? false;
  /** The dock's own path, used only while `path` is not passed. */
  const [ownPath, setOwnPath] = React.useState<number[]>([]);
  const controlled = controlledPath !== undefined;
  const path = controlled ? controlledPath : ownPath;
  /** 1 descending, -1 coming back. Rows slide in from the side you came from,
   *  which gives the stack a direction instead of a generic fade. */
  const [dir, setDir] = React.useState(1);
  const shell = React.useRef<HTMLDivElement>(null);
  /** Row to focus once the next level has mounted. null leaves focus alone,
   *  which is what stops the first render from stealing it. `soft` means "only
   *  if the close dropped focus on the floor" - see the effect below. */
  const wants = React.useRef<{ index: number; soft: boolean } | null>(null);
  /** The one tab stop in the level. A menu is a single stop with the arrows
   *  moving inside it, not one stop per row - so every other row is -1. */
  const [focusIndex, setFocusIndex] = React.useState(0);

  const level = menuAt(items, path);
  const open = path.length > 0 && !level.truncated;
  /** What the level renders in place of rows. Cast once, here: the path module
   *  types it `unknown` so it can stay free of React. */
  const content = level.content as React.ReactNode | undefined;
  const isContent = content !== undefined;

  /** Always the current render's values, for listeners that must not
   *  resubscribe to read them. onNavigate is usually an inline arrow, so an
   *  effect depending on it directly would tear down and rebind every render. */
  const latest = React.useRef({ path, onNavigate, controlled });
  latest.current = { path, onNavigate, controlled };

  /** The one way a level changes. Controlled, it only reports; uncontrolled,
   *  it reports and applies. Everything that moves the dock goes through
   *  here, so there is a single place where that distinction lives. */
  const go = React.useCallback(
    (
      next: number[],
      direction: number,
      focus: { index: number; soft: boolean } | null,
    ) => {
      setDir(direction);
      if (!latest.current.controlled) setOwnPath(next);
      if (focus) wants.current = focus;
      latest.current.onNavigate?.(next);
    },
    [],
  );

  /** A path gone stale under an open menu resolves to its nearest valid
   *  ancestor; correcting the state keeps Back counting real levels. The
   *  consumer hears about it too - it is a real level change, and staying
   *  quiet would leave any mirror of the path pointing at a level that is no
   *  longer open. */
  React.useEffect(() => {
    if (!level.truncated) return;
    // No focus move: nobody asked to go anywhere, the level just stopped
    // existing. Controlled, this only reports - applying it is the caller's.
    go(latest.current.path.slice(0, -1), -1, null);
  }, [level.truncated, go]);

  const levelKey = path.join(".") || "dock";

  /** Rows of the live level only. The scoping matters: popLayout keeps the
   *  outgoing level mounted while it fades, so a query across the whole shell
   *  returns both levels' rows - and focusing one of the outgoing set drops
   *  focus to the body the moment it unmounts, which takes Escape and the
   *  arrow keys with it. */
  const rows = React.useCallback(
    (key: string) =>
      Array.from(
        shell.current?.querySelectorAll<HTMLElement>(
          `[data-dock-level="${key}"] [data-dock-row]`,
        ) ?? [],
      ),
    [],
  );

  const back = React.useCallback(() => {
    if (!path.length) return;
    go(path.slice(0, -1), -1, { index: backFocusIndex(path), soft: false });
  }, [go, path]);

  // Focus follows the level, but only where a navigation asked for it.
  React.useEffect(() => {
    const target = wants.current;
    wants.current = null;
    // Every level starts its tab stop at the top, whether or not focus moves.
    setFocusIndex(target?.index ?? 0);
    if (!target) return;

    /* A soft request has to wait a frame. It comes from a pointerdown, and
       the browser does its own focusing for that gesture after the handler
       runs - claiming focus now just gets overwritten, landing on <body>
       anyway. A frame later the gesture has settled, so we can see whether
       anything actually took focus and only step in if nothing did. */
    if (target.soft) {
      const index = target.index;
      const frame = requestAnimationFrame(() => {
        const held = document.activeElement;
        if (held && held !== document.body) return;
        const all = rows(levelKey);
        all[Math.min(index, all.length - 1)]?.focus(NO_SCROLL);
      });
      return () => cancelAnimationFrame(frame);
    }

    // On a content level the field is the point of opening it - landing on the
    // Back row instead would mean tabbing into your own search box.
    const field = shell.current?.querySelector<HTMLElement>(
      `[data-dock-level="${levelKey}"] :is(input, textarea, select, [contenteditable="true"])`,
    );
    if (field) {
      field.focus(NO_SCROLL);
      return;
    }

    const all = rows(levelKey);
    all[Math.min(target.index, all.length - 1)]?.focus(NO_SCROLL);
  }, [levelKey, rows]);

  /** Outside click closes all the way to the dock. It matters most for a
   *  content level: a text field has no row to press to get back out. The
   *  opening click's own pointerdown has already fired by the time this
   *  listener attaches, so it never closes what it just opened. */
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (shell.current?.contains(e.target as Node)) return;
      /* Soft: the row holding focus is about to unmount, and if the click
         landed on nothing focusable that leaves focus on <body> and the dock
         has to be tabbed into again from the top of the page. But clicking a
         focusable thing outside should let it keep focus, so this only
         reclaims focus if nothing else took it. */
      go([], -1, { index: latest.current.path[0] ?? 0, soft: true });
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, go]);

  function onKeyDown(e: React.KeyboardEvent) {
    // Escape still pops, but the arrows belong to whatever the content is -
    // in a text field they move the caret, and stealing them breaks typing.
    if (isContent) {
      if (e.key === "Escape") {
        e.preventDefault();
        back();
      }
      return;
    }

    const all = rows(levelKey);
    if (!all.length) return;
    const at = all.indexOf(document.activeElement as HTMLElement);
    // The dock is a row and its menus are columns, so the arrows that walk
    // them differ; the other axis is left to the browser.
    const next = open ? "ArrowDown" : "ArrowRight";
    const prev = open ? "ArrowUp" : "ArrowLeft";

    const move = (to: number) => {
      e.preventDefault();
      all[(to + all.length) % all.length]?.focus(NO_SCROLL);
    };

    if (e.key === next) move(at + 1);
    else if (e.key === prev) move(at - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(all.length - 1);
    else if (e.key === "Escape" && open) {
      e.preventDefault();
      back();
    }
  }

  // Rows carry the slide and the level only fades. Both on one element would
  // double every row's travel.
  const levelFade = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: reduced ? 0 : STAGGER,
        delayChildren: reduced ? 0 : ENTER_DELAY,
      },
    },
    exit: { opacity: 0, transition: { duration: EXIT } },
  };
  const row = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0, transition: { duration: EXIT } },
      }
    : open
      ? {
          initial: { opacity: 0, x: dir * SLIDE },
          animate: { opacity: 1, x: 0, transition: SPRING_SWAP },
          exit: { opacity: 0, x: dir * -SLIDE, transition: { duration: EXIT } },
        }
      : {
          // The dock is a row of icons, not a list of rows, so it does not
          // arrive the way a level does. Sliding it in from the side reads as
          // a sixth menu level; rising a little into place reads as the panel
          // collapsing back into the pill it came from.
          initial: { opacity: 0, y: DOCK_RISE },
          animate: { opacity: 1, y: 0, transition: SPRING_SWAP },
          exit: { opacity: 0, y: DOCK_RISE, transition: { duration: EXIT } },
        };

  return (
    /* Three layers, and each one earns its place. The wrapper holds the closed
       dock's footprint so opening a menu never moves the page. The anchor is
       pinned to the wrapper's bottom edge, which is what makes the panel grow
       upward only - left to itself the shell is centred by whatever contains
       it, and it grows both ways. The anchor also owns the centring transform,
       because a transform on the layout-animated shell gets overwritten by
       motion's own projection partway through the morph. */
    <div
      {...rest}
      className={cn(
        "relative",
        floating && "fixed bottom-6 left-1/2 z-50 -translate-x-1/2",
        className,
      )}
      /* max-width, because the footprint is a hard pixel width: closedWidth
         grows 44px an item, so nine of them is 410px and would force the page
         to scroll sideways on a phone. Capping here keeps the dock inside its
         parent; the row itself scrolls when it no longer fits. */
      style={{
        width: closedWidth(items.length),
        maxWidth: "100%",
        height: CLOSED_H,
        ...style,
      }}
    >
      {/* w-fit, so the anchor tracks the shell's width and its own -50% keeps
          the surface centred on the dock at every size. No max-width here: it
          would resolve against the wrapper, which is the closed pill, and a
          panel is meant to be wider than the pill it grew out of. */}
      <div className="absolute bottom-0 left-1/2 w-fit -translate-x-1/2">
        <motion.div
          ref={shell}
          layout
          /* motion corrects borderRadius through a layout animation, which is
             why the corner can animate on the very element being measured - a
             plain class swap would snap partway. */
          style={{ borderRadius: open ? PANEL_RADIUS : DOCK_RADIUS }}
          transition={reduced ? { duration: 0 } : SPRING_LAYOUT}
          onKeyDown={onKeyDown}
          /* A content level is not a menu. `menu` permits only menuitem,
             group and separator as children, so the moment the surface holds
             a text field the role is a lie and screen readers mis-report what
             is inside it. Dialog is what an arbitrary panel actually is. */
          role={isContent ? "dialog" : "menu"}
          aria-label={open && level.title ? level.title : label}
          aria-orientation={
            isContent ? undefined : open ? "vertical" : "horizontal"
          }
          /* Clamped to the viewport, not to the wrapper. The wrapper is the
             closed pill's footprint and a panel is meant to outgrow it, while
             `max-w-full` here would resolve against the anchor - which is
             sized by this element, so it would constrain nothing at all. The
             screen edge is the real limit.
             overflow-hidden because rows enter on x: coming back up a level
             they start SLIDE to the left of where they land, which is 23px
             outside the panel, and without clipping they are simply drawn on
             the page beside it. The clip belongs on this element rather than
             on the level inside: rows sit within the p-2, so their focus ring
             has room and survives, where clipping the level would cut it. */
          className="w-fit max-w-[calc(100vw-2rem)] overflow-hidden border border-border bg-background p-2 shadow-elevated"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {/* Keyed by the path, so descending and coming back are both one level
                swapping for another rather than a reconciliation of rows. */}
            <motion.div
              key={levelKey}
              data-dock-level={levelKey}
              variants={levelFade}
              initial="initial"
              animate="animate"
              exit="exit"
              /* Position-only. This is motion's scale correction: the shell is
                 mid-projection around this, and without it the level is scaled
                 by whatever the shell's box is doing - on close that measures a
                 3.9x stretch, 40px rows rendering 156px tall. The catch is that
                 it also animates the block between its old and new layout
                 positions, ~160px vertically on a dock-to-menu change, which is
                 what used to make the level read as rising from the bottom.
                 ENTER_DELAY is what makes it safe: the rows are still invisible
                 while that travel happens. */
              layout="position"
              className={cn(
                open
                  ? "flex min-w-60 flex-col gap-0.5"
                  : // The dock scrolls rather than overflowing once there are
                    // more icons than the parent is wide.
                    "flex max-w-full items-center gap-1 overflow-x-auto",
              )}
              /* Room for the rise, and then taken straight back out of the
                 layout. `overflow-x: auto` drags overflow-y to `auto` with it
                 - CSS will not let one axis scroll while the other stays
                 visible - so the DOCK_RISE the icons enter on counts as 10px
                 of scrollable height and puts a vertical scrollbar across the
                 dock for the whole entrance. Padding makes that 10px part of
                 the scrollable box instead of overflow; the negative margin
                 means the pill is not 20px taller for it. */
              style={
                open
                  ? undefined
                  : { paddingBlock: DOCK_RISE, marginBlock: -DOCK_RISE }
              }
            >
              {open && (
                <motion.div variants={row}>
                  <Row
                    onActivate={back}
                    onFocus={() => setFocusIndex(0)}
                    role={isContent ? undefined : "menuitem"}
                    tabIndex={isContent || focusIndex === 0 ? 0 : -1}
                    className={cn(
                      "h-10 w-full gap-3 rounded-2xl px-3 text-left text-[15px]",
                      "font-medium text-foreground transition-colors hover:bg-surface-hover",
                    )}
                  >
                    <span className={GLYPH} aria-hidden>
                      <svg {...stroke}>
                        <path d="M19 12H5M11 18l-6-6 6-6" />
                      </svg>
                    </span>
                    {/* The title doubles as the Back label: one row says both where
                        you are and what leaving it costs. Spoken, the title alone
                        is indistinguishable from the row that opened it, so the
                        direction is said out loud - and kept as a prefix rather
                        than an aria-label, so the accessible name still contains
                        the visible one. */}
                    <span className="sr-only">Back to </span>
                    <span className="truncate">{level.title}</span>
                  </Row>
                </motion.div>
              )}

              {/* A content level renders this in place of rows. It rides the
                  same row variant, so it arrives with the Back row above it
                  rather than appearing separately. */}
              {isContent && <motion.div variants={row}>{content}</motion.div>}

              {level.items.map((item, i) => {
                // Both kinds descend a level; content wins, matching menuAt.
                // A content row opens a panel, so it says so - calling that a
                // menu misdescribes what the row is about to produce.
                const expands =
                  item.content !== undefined
                    ? ("dialog" as const)
                    : item.items?.length
                      ? ("menu" as const)
                      : false;
                const on = active !== undefined && keyOf(item) === active;
                // Rows sit below the Back row once a level is open.
                const rowIndex = open ? i + 1 : i;

                return (
                  /* Keyed by position, not by label. Two items in one level
                     can legitimately share a label, and a duplicate React key
                     silently drops one of them - the level is already keyed by
                     its path, so identity across levels is not at stake. */
                  <motion.div key={rowIndex} variants={row}>
                    <Row
                      href={item.href}
                      role="menuitem"
                      haspopup={expands}
                      onActivate={() =>
                        expands
                          ? go([...path, i], 1, { index: 1, soft: false })
                          : item.onSelect?.()
                      }
                      onFocus={() => setFocusIndex(rowIndex)}
                      tabIndex={isContent || focusIndex === rowIndex ? 0 : -1}
                      aria-current={on ? "page" : undefined}
                      {...(open ? {} : { "aria-label": item.label })}
                      title={open ? undefined : item.label}
                      style={open ? undefined : { width: TAP, height: TAP }}
                      className={cn(
                        "transition-colors hover:bg-surface-hover",
                        open
                          ? "h-10 w-full gap-3 rounded-2xl px-3 text-left text-[15px]"
                          : // shrink-0 or the flex row squashes the icons to
                            // fit instead of letting the dock scroll.
                            "shrink-0 justify-center rounded-full",
                        open && item.destructive && "text-destructive",
                        open && !item.destructive && "text-foreground",
                        !open &&
                          (on
                            ? "text-foreground"
                            : "text-text-secondary hover:text-foreground"),
                      )}
                    >
                      <span className={GLYPH}>
                        <Glyph item={item} on={on} reduced={reduced} />
                      </span>
                      {open && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {open && expands && (
                        <IconChevronRight
                          className={cn(GLYPH, "text-text-muted size-4")}
                          strokeWidth={2.5}
                          aria-hidden
                        />
                      )}
                    </Row>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
