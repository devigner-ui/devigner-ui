"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import {
  IconArrowRight,
  IconMaximize,
  IconMinimize,
  IconMoon,
  IconSearchNormal,
  IconSun,
} from "@devigner-ui/icons";
import { cn } from "cn";
import { SPRING_LAYOUT, SPRING_PANEL, SPRING_RETRACT } from "devignerui/motion";
import { searchEntries, type CatalogEntry } from "@/lib/catalog-query";
import type { ComponentSlug } from "@/lib/registry";
import { demos } from "../../demos";
import { useTheme } from "../theme-provider";
import { FitToStage, LazyMount, SelectionMarks } from "./canvas-frame";
import { CopyCommand } from "./copy-command";
import { LogoMark } from "../logo-mark";
import { useSelection } from "./selection";
import { NewBadge } from "../new-badge";

// Frames sit on the board in rows of three, newest first.
const FRAME_W = 360;
const FRAME_H = 270;
const LABEL_H = 28;
const GAP = 56;
const PAD = 120;
const COLS = 3;
// The floating toolbar, its progressive blur (h-36) and the size badge under a
// selected frame: keep this much of the canvas bottom clear of any frame we
// bring into view.
const TOOLBAR_CLEAR = 152;

function framePosition(i: number) {
  return {
    left: PAD + (i % COLS) * (FRAME_W + GAP),
    top: PAD + Math.floor(i / COLS) * (FRAME_H + LABEL_H + GAP),
  };
}

/** Stacked backdrop blurs, each stronger and starting lower than the last,
 *  so the blur ramps up toward the bottom edge instead of switching on. Each
 *  layer also lifts saturation a touch; stacked, the bottom edge ends ~1.34x. */
const BLUR_STEPS = [1, 2, 4, 8, 16];

export function ProgressiveBlur({
  className,
  toward = "bottom",
  visible = true,
}: {
  className?: string;
  /** The edge the blur ramps up toward. */
  toward?: "top" | "bottom";
  /** Fades the blur in and out. Each layer fades its own opacity, never a
   *  wrapper's: an ancestor below full opacity cuts a backdrop filter off
   *  from the page behind it, so the blur vanishes for the whole fade and
   *  then pops in at the end. The blur radius stays fixed; ramping it
   *  instead flashed a bright halo around text mid-way. */
  visible?: boolean;
}) {
  return (
    <div aria-hidden className={className}>
      {BLUR_STEPS.map((px, i) => {
        const from = (i / BLUR_STEPS.length) * 100;
        const to = ((i + 1) / BLUR_STEPS.length) * 100;
        const mask = `linear-gradient(to ${toward}, transparent ${from}%, #000 ${to}%)`;
        const filter = `blur(${px}px) saturate(1.1)`;
        return (
          <div
            key={px}
            className="absolute inset-0 transition-opacity duration-300 ease-out motion-reduce:transition-none"
            style={{
              backdropFilter: filter,
              WebkitBackdropFilter: filter,
              opacity: visible ? 1 : 0,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
}

function Frame({
  entry,
  index,
  selected,
  onSelect,
  root,
}: {
  entry: CatalogEntry;
  index: number;
  selected: boolean;
  onSelect: () => void;
  root: React.RefObject<HTMLDivElement | null>;
}) {
  const Demo = demos[entry.slug];
  return (
    <div
      data-frame={entry.slug}
      className="absolute"
      style={{ ...framePosition(index), width: FRAME_W }}
      // Pressing anywhere in a frame, including on the demo, selects it.
      onPointerDownCapture={onSelect}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`${entry.name}, select`}
        aria-pressed={selected}
        className={cn(
          "mb-2 flex h-5 items-center gap-2 rounded-sm text-[12px] whitespace-nowrap transition-colors duration-200 ease-out",
          selected
            ? "font-medium text-brand"
            : "text-text-tertiary hover:text-foreground",
        )}
      >
        {entry.name}
        {/* <span className="font-mono text-[11px] font-normal text-text-muted">
          {entry.categoryLabel.toLowerCase()}
        </span> */}
      </button>
      <div
        className="frame-surface relative ring-1 ring-border ring-inset"
        style={{ height: FRAME_H }}
      >
        <LazyMount root={root}>
          <FitToStage align={entry.stageAlign}>
            <Demo />
          </FitToStage>
        </LazyMount>
        {selected && (
          <motion.div
            layoutId="hero-selection"
            transition={SPRING_LAYOUT}
            // Covers the demo, so it must let pointers through to it.
            className="pointer-events-none absolute inset-0"
          >
            <SelectionMarks />
          </motion.div>
        )}
      </div>
    </div>
  );
}

/** The hero's product window: a small design tool that runs every component. */
export function HeroWindow({ entries }: { entries: CatalogEntry[] }) {
  const reduce = useReducedMotion();
  const { theme } = useTheme();
  const { slug, setSlug } = useSelection();
  const entry = entries.find((e) => e.slug === slug) ?? entries[0];

  // null follows the page, so the server render never paints the wrong theme.
  const [dark, setDark] = useState<boolean | null>(null);
  const isDark = dark ?? theme === "dark";
  const [query, setQuery] = useState("");
  const matches = useMemo(
    () => searchEntries(entries, query),
    [entries, query],
  );

  // Fully tilted back at the top of the page, flat once the window's top edge
  // reaches 30% down the viewport. Driven by page scroll from 0, not by the
  // window's own entry: it already peeks into view on load, which would
  // start it part-way flattened.
  const wrap = useRef<HTMLDivElement>(null);
  const flatAt = useRef(600);
  useEffect(() => {
    const measure = () => {
      // offsetTop, not getBoundingClientRect: ignores the hero's rise transform.
      let top = 0;
      for (
        let el: HTMLElement | null = wrap.current;
        el;
        el = el.offsetParent as HTMLElement | null
      )
        top += el.offsetTop;
      flatAt.current = Math.max(1, top - window.innerHeight * 0.3);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const { scrollY } = useScroll();
  const tilt = useTransform(
    scrollY,
    (y) => 24 * Math.max(0, 1 - y / flatAt.current),
  );
  // Backdrop blur under a 3D-rotated ancestor samples the wrong pixels in
  // Chrome and paints a hard-edged block, so the toolbar's progressive blur
  // only mounts once the window has settled flat.
  const [flat, setFlat] = useState(false);
  useMotionValueEvent(tilt, "change", (deg) => setFlat(deg < 0.01));
  useEffect(() => setFlat(tilt.get() < 0.01), [tilt]);

  const canvas = useRef<HTMLDivElement>(null);
  const boardRows = Math.ceil(entries.length / COLS);
  const board = {
    width: PAD * 2 + COLS * FRAME_W + (COLS - 1) * GAP,
    // Extra room under the last row so it can scroll clear of the toolbar.
    height:
      PAD * 2 +
      TOOLBAR_CLEAR +
      boardRows * (FRAME_H + LABEL_H) +
      (boardRows - 1) * GAP,
  };

  const center = (target: ComponentSlug, smooth: boolean) => {
    const el = canvas.current;
    const i = entries.findIndex((e) => e.slug === target);
    if (!el || i < 0) return;
    const { left, top } = framePosition(i);
    el.scrollTo({
      left: left + FRAME_W / 2 - el.clientWidth / 2,
      // Leave room for the toolbar under the frame.
      top: top + (FRAME_H + LABEL_H) / 2 - el.clientHeight / 2 + 40,
      behavior: smooth && !reduce ? "smooth" : "auto",
    });
  };

  // Start with the selected frame in view. Runs once: later moves are the
  // list's job, since a frame you press is already in view.
  const first = useRef(slug);
  useLayoutEffect(() => center(first.current, false), []);
  // Whoever changes the selection (a frame, the list, the install section
  // below), the chosen frame must not sit under the toolbar or past the top
  // edge. Frames already in clear view stay put.
  const hidden = (target: ComponentSlug) => {
    const el = canvas.current;
    const i = entries.findIndex((e) => e.slug === target);
    if (!el || i < 0) return false;
    const top = framePosition(i).top - el.scrollTop;
    return top < 0 || top + LABEL_H + FRAME_H > el.clientHeight - TOOLBAR_CLEAR;
  };
  const select = (next: ComponentSlug, recenter: boolean) => {
    if (next === slug) return;
    setSlug(next);
    if (recenter) center(next, true);
  };
  useEffect(() => {
    if (hidden(slug)) center(slug, true);
  }, [slug]);

  // Drag empty board with a mouse to pan; wheels and trackpads scroll natively.
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const [panning, setPanning] = useState(false);
  const onPointerDown = (e: React.PointerEvent) => {
    const el = canvas.current;
    if (
      !el ||
      e.pointerType !== "mouse" ||
      (e.target as HTMLElement).closest("[data-frame]")
    )
      return;
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      left: el.scrollLeft,
      top: el.scrollTop,
    };
    el.setPointerCapture(e.pointerId);
    setPanning(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = canvas.current;
    const d = drag.current;
    if (!el || !d) return;
    el.scrollLeft = d.left - (e.clientX - d.x);
    el.scrollTop = d.top - (e.clientY - d.y);
  };
  const endDrag = () => {
    drag.current = null;
    setPanning(false);
  };

  // Arrow keys walk the component list.
  const list = useRef<HTMLDivElement>(null);
  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const items = [
      ...(list.current?.querySelectorAll<HTMLButtonElement>(
        "button[data-slug]",
      ) ?? []),
    ];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      items[
        (at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length
      ];
    if (!next) return;
    e.preventDefault();
    next.focus();
  };

  // Maximize: the selected frame grows to fill the canvas; Escape restores.
  const [max, setMax] = useState(false);
  useEffect(() => {
    if (!max) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMax(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [max]);

  const [announce, setAnnounce] = useState("");
  useEffect(() => setAnnounce(`Showing ${entry.name}`), [entry.name]);

  const Demo = demos[entry.slug];
  const themeScope = dark === null ? undefined : dark ? "dark" : "light";

  return (
    <div
      ref={wrap}
      className="relative mx-auto w-full max-w-300 perspective-[2200px]"
    >
      {/* Cobalt light behind the window's top edge. */}
      <div
        aria-hidden
        className="absolute inset-x-[10%] -top-16 h-40 rounded-full bg-glow blur-3xl"
      />

      <motion.section
        aria-label="Component preview"
        style={{ rotateX: reduce ? 0 : tilt, transformOrigin: "50% 0%" }}
        className="relative overflow-hidden rounded-[18px] bg-background smooth-shadow-ring-xl"
      >
        {/* Keeps the outline in order: the demos' own headings (Chart Card's
            h3) sit under this, not straight under the page h1. */}
        <h2 className="sr-only">Component preview</h2>
        {/* The light catching the top edge. */}
        <div
          aria-hidden
          className="absolute inset-x-[10%] top-0 z-20 h-px bg-linear-to-r from-transparent via-foreground/50 to-transparent"
        />

        {/* Top bar */}
        <div className="flex h-12 items-center justify-between gap-3 border-b border-border bg-background-100 pr-3 pl-4">
          <div className="flex min-w-0 items-center gap-2.5 text-[13px] text-text-muted">
            <LogoMark className="h-5.5 w-auto shrink-0" />
            <span className="hidden sm:inline">Components</span>
            <span aria-hidden className="hidden text-border-hover sm:inline">
              /
            </span>
            <span className="truncate font-medium text-foreground">
              {entry.name}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div
              role="group"
              aria-label="Preview theme"
              className="flex rounded-full border border-border bg-background p-0.5"
            >
              {[
                { label: "Light", on: !isDark, icon: IconSun, set: false },
                { label: "Dark", on: isDark, icon: IconMoon, set: true },
              ].map((t) => (
                <button
                  key={t.label}
                  type="button"
                  aria-pressed={t.on}
                  onClick={() => setDark(t.set)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-colors duration-200 ease-out cursor-pointer",
                    t.on
                      ? "bg-surface-hover text-foreground"
                      : "text-text-muted hover:text-foreground",
                  )}
                >
                  <t.icon aria-hidden className="size-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
            <Link
              href={`/components/${entry.slug}`}
              className="hidden h-8 items-center gap-1.5 rounded-full border border-border px-3 text-[12.5px] font-medium text-text-secondary transition-colors duration-200 ease-out hover:text-foreground sm:inline-flex"
            >
              Docs
              <IconArrowRight aria-hidden className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-[240px_minmax(0,1fr)]">
          {/* Component list (a row of chips below md) */}
          <div className="min-w-0 border-b border-border bg-background-100 md:border-r md:border-b-0">
            <div className="hidden p-2.5 md:block">
              <label className="flex h-8.5 items-center gap-2 rounded-[10px] border border-border bg-background px-2.5 text-[12.5px] focus-within:ring-2 focus-within:ring-brand">
                <IconSearchNormal
                  aria-hidden
                  className="size-3.5 shrink-0 text-text-muted"
                />
                <span className="sr-only">Search components</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search components"
                  style={{ outline: "none" }}
                  className="min-w-0 flex-1 bg-transparent text-foreground placeholder:text-text-muted"
                />
              </label>
            </div>
            <div
              ref={list}
              onKeyDown={onListKey}
              className="no-scrollbar flex gap-1 overflow-x-auto p-2 md:max-h-150 md:flex-col md:gap-0.5 md:overflow-y-auto md:px-2.5 md:pt-1"
            >
              {matches.map((e) => {
                const on = e.slug === entry.slug;
                return (
                  <button
                    key={e.slug}
                    type="button"
                    data-slug={e.slug}
                    aria-pressed={on}
                    onClick={() => select(e.slug, true)}
                    className={cn(
                      "group relative flex h-9 shrink-0 items-center gap-2.5 rounded-[10px] px-3 text-[13px] whitespace-nowrap transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-brand md:w-full cursor-pointer",
                      on
                        ? "text-foreground"
                        : "text-text-secondary hover:bg-surface-hover/60 hover:text-foreground",
                    )}
                  >
                    {/* One highlight that glides to whichever item is picked. */}
                    {on && (
                      <motion.span
                        aria-hidden
                        layoutId="hero-list-pill"
                        transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                        className="absolute inset-0 rounded-[10px] bg-surface-hover shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_6%,transparent)]"
                      />
                    )}
                    <span className="relative min-w-0 truncate">{e.name}</span>
                    {(e.isNew || e.isUpdated) && (
                      <NewBadge size="sm" updated={!e.isNew} className="relative ml-auto" />
                    )}
                  </button>
                );
              })}
              {matches.length === 0 && (
                <p className="px-2 py-3 text-[12.5px] text-text-muted">
                  No component called &ldquo;{query.trim()}&rdquo; yet.
                </p>
              )}
              <Link
                href="/components"
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-[13px] whitespace-nowrap text-text-muted transition-colors duration-200 ease-out outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand md:w-full"
              >
                All components
                <IconArrowRight aria-hidden className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Canvas */}
          <div className={cn("relative min-w-0", themeScope)}>
            <div
              ref={canvas}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className={cn(
                "no-scrollbar relative isolate hidden h-150 overflow-auto bg-[radial-gradient(60%_60%_at_45%_40%,var(--background-200),var(--background)_80%)] md:block",
                panning ? "cursor-grabbing select-none" : "cursor-grab",
              )}
            >
              <div className="relative" style={board}>
                {entries.map((e, i) => (
                  <Frame
                    key={e.slug}
                    entry={e}
                    index={i}
                    selected={e.slug === entry.slug}
                    onSelect={() => select(e.slug, false)}
                    root={canvas}
                  />
                ))}
              </div>
            </div>

            {/* The maximized frame covers the board, leaving the toolbar clear. */}
            <AnimatePresence>
              {max && (
                <motion.div
                  key="max"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1, transition: SPRING_PANEL }}
                  exit={{ opacity: 0, scale: 0.96, transition: SPRING_RETRACT }}
                  className="absolute inset-0 hidden flex-col bg-[radial-gradient(60%_60%_at_45%_40%,var(--background-200),var(--background)_80%)] px-8 pt-6 pb-38 md:flex"
                >
                  {/* Same 4:3 as the board frames (FRAME_W x FRAME_H), as large
                      as fits once the 28px label is taken off the height. */}
                  <div
                    className="flex min-h-0 flex-1 items-center justify-center"
                    style={{ containerType: "size" }}
                  >
                    <div className="w-[min(100cqw,calc((100cqh-28px)*4/3))]">
                      <p className="mb-2 flex h-5 items-center text-[12px] font-medium text-brand">
                        {entry.name}
                      </p>
                      <div className="frame-surface relative aspect-4/3 ring-1 ring-border ring-inset">
                        <LazyMount key={entry.slug}>
                          <FitToStage align={entry.stageAlign}>
                            <Demo />
                          </FitToStage>
                        </LazyMount>
                        <SelectionMarks />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Below md: just the selected frame, no panning. */}
            <div className="p-4 md:hidden">
              <div className="frame-surface relative h-85 ring-1 ring-border ring-inset">
                <LazyMount key={entry.slug}>
                  {/* Phones shrink the wide demos to ~60%, too small to tap. */}
                  <FitToStage align={entry.stageAlign} viewOnlyBelow={0.85}>
                    <Demo />
                  </FitToStage>
                </LazyMount>
                <SelectionMarks label="inside" />
              </div>
            </div>

            {/* Progressive blur under the toolbar: whatever is dragged or
                scrolled down there goes soft instead of colliding with it. */}
            {(flat || reduce) && (
              <ProgressiveBlur className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-36 md:block" />
            )}

            {/* Floating toolbar */}
            <div className="flex justify-center px-4 pb-4 md:absolute md:inset-x-0 md:bottom-4 md:p-0">
              <div className="flex max-w-full items-center gap-1 rounded-2xl bg-background-100/90 p-0.5 border border-border/60 backdrop-blur-xl">
                <button
                  type="button"
                  aria-label={
                    max
                      ? "Restore the board"
                      : "Maximize the selected component"
                  }
                  aria-pressed={max}
                  title={max ? "Restore" : "Maximize"}
                  onClick={() => setMax((m) => !m)}
                  className="hidden size-9 shrink-0 cursor-pointer place-items-center rounded-xl text-text-secondary transition-colors duration-200 ease-out hover:bg-surface-hover hover:text-foreground md:grid"
                >
                  {max ? (
                    <IconMinimize aria-hidden className="size-4" />
                  ) : (
                    <IconMaximize aria-hidden className="size-4" />
                  )}
                </button>
                <span
                  aria-hidden
                  className="mx-1 hidden h-5 w-px bg-border md:block"
                />
                <CopyCommand
                  command={`npx devignerui add ${entry.slug}`}
                  highlight={entry.slug}
                  size="compact"
                  className="min-w-0 border-0 bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.section>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  );
}
