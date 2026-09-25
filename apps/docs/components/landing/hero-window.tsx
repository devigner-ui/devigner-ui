"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import {
  IconArrowRight,
  IconMaximize,
  IconMoon,
  IconSearchNormal,
  IconSun,
} from "@devigner-ui/icons";
import { cn } from "cn";
import { SPRING_LAYOUT } from "devignerui/motion";
import { groupByCategory, searchEntries, type CatalogEntry } from "@/lib/catalog-query";
import type { ComponentSlug } from "@/lib/registry";
import { demos } from "../../demos";
import { useTheme } from "../theme-provider";
import { FitToStage, LazyMount, SelectionMarks } from "./canvas-frame";
import { CopyCommand } from "./copy-command";
import { LogoMark } from "../logo-mark";
import { useSelection } from "./selection";

// Frames sit on the board in rows of three, newest first.
const FRAME_W = 360;
const FRAME_H = 270;
const LABEL_H = 28;
const GAP = 56;
const PAD = 120;
const COLS = 3;

function framePosition(i: number) {
  return {
    left: PAD + (i % COLS) * (FRAME_W + GAP),
    top: PAD + Math.floor(i / COLS) * (FRAME_H + LABEL_H + GAP),
  };
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
          selected ? "font-medium text-brand" : "text-text-tertiary hover:text-foreground",
        )}
      >
        {entry.name}
        <span className="font-mono text-[11px] font-normal text-text-muted">
          {entry.categoryLabel.toLowerCase()}
        </span>
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
          <motion.div layoutId="hero-selection" transition={SPRING_LAYOUT} className="absolute inset-0">
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
  const groups = useMemo(() => groupByCategory(searchEntries(entries, query)), [entries, query]);

  // Tilted back at first, flat once it has scrolled into place.
  const wrap = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start end", "start 25%"] });
  const tilt = useTransform(scrollYProgress, [0, 1], [9, 0]);

  const canvas = useRef<HTMLDivElement>(null);
  const boardRows = Math.ceil(entries.length / COLS);
  const board = {
    width: PAD * 2 + COLS * FRAME_W + (COLS - 1) * GAP,
    height: PAD * 2 + boardRows * (FRAME_H + LABEL_H) + (boardRows - 1) * GAP,
  };

  const center = (target: ComponentSlug, smooth: boolean) => {
    const el = canvas.current;
    const i = entries.findIndex((e) => e.slug === target);
    if (!el || i < 0) return;
    const { left, top } = framePosition(i);
    el.scrollTo({
      left: left + FRAME_W / 2 - el.clientWidth / 2,
      // Leave room for the toolbar under the frame.
      top: top + (FRAME_H + LABEL_H) / 2 - el.clientHeight / 2 + 28,
      behavior: smooth && !reduce ? "smooth" : "auto",
    });
  };

  // Start with the selected frame in view. Runs once: later moves are the
  // list's job, since a frame you press is already in view.
  const first = useRef(slug);
  useLayoutEffect(() => center(first.current, false), []);
  const select = (next: ComponentSlug, recenter: boolean) => {
    if (next === slug) return;
    setSlug(next);
    if (recenter) center(next, true);
  };

  // Drag empty board with a mouse to pan; wheels and trackpads scroll natively.
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [panning, setPanning] = useState(false);
  const onPointerDown = (e: React.PointerEvent) => {
    const el = canvas.current;
    if (!el || e.pointerType !== "mouse" || (e.target as HTMLElement).closest("[data-frame]")) return;
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
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
    const items = [...(list.current?.querySelectorAll<HTMLButtonElement>("button[data-slug]") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = items[(at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length];
    if (!next) return;
    e.preventDefault();
    next.focus();
  };

  const [announce, setAnnounce] = useState("");
  useEffect(() => setAnnounce(`Showing ${entry.name}`), [entry.name]);

  const Demo = demos[entry.slug];
  const themeScope = dark === null ? undefined : dark ? "dark" : "light";

  return (
    <div ref={wrap} className="relative mx-auto w-full max-w-270 perspective-[2200px]">
      {/* Cobalt light behind the window's top edge. */}
      <div aria-hidden className="absolute inset-x-[10%] -top-16 h-40 rounded-full bg-glow blur-3xl" />

      <motion.section
        aria-label="Component preview"
        style={{ rotateX: reduce ? 0 : tilt, transformOrigin: "50% 0%" }}
        className="relative overflow-hidden rounded-[18px] bg-background smooth-shadow-ring-lg"
      >
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
            <span className="truncate font-medium text-foreground">{entry.name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div role="group" aria-label="Preview theme" className="flex rounded-full border border-border bg-background p-0.5">
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
                    "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-colors duration-200 ease-out",
                    t.on ? "bg-surface-hover text-foreground ring-1 ring-border-hover" : "text-text-muted hover:text-foreground",
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

        <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
          {/* Component list (a row of chips below md) */}
          <div className="min-w-0 border-b border-border bg-background-100 md:border-r md:border-b-0">
            <div className="hidden p-2.5 md:block">
              <label className="flex h-8.5 items-center gap-2 rounded-[10px] border border-border bg-background px-2.5 text-[12.5px] focus-within:ring-2 focus-within:ring-brand">
                <IconSearchNormal aria-hidden className="size-3.5 shrink-0 text-text-muted" />
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
              className="no-scrollbar flex gap-1 overflow-x-auto p-2 md:max-h-117.5 md:flex-col md:gap-0 md:overflow-y-auto md:px-2.5 md:pt-0"
            >
              {groups.map((g) => (
                <div key={g.label} className="contents md:block">
                  <p className="mx-2 mt-3 mb-1 hidden justify-between font-mono text-[10.5px] text-text-muted lowercase md:flex">
                    {g.label}
                    <span>{g.items.length}</span>
                  </p>
                  {g.items.map((e) => (
                    <button
                      key={e.slug}
                      type="button"
                      data-slug={e.slug}
                      aria-pressed={e.slug === entry.slug}
                      onClick={() => select(e.slug, true)}
                      className={cn(
                        "flex h-8 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-[13px] whitespace-nowrap transition-colors duration-200 ease-out md:w-full",
                        e.slug === entry.slug
                          ? "bg-brand/15 text-foreground ring-1 ring-brand/30 ring-inset"
                          : "text-text-secondary hover:bg-surface-hover hover:text-foreground",
                      )}
                    >
                      <span aria-hidden className="hidden font-mono text-[11px] text-text-muted md:inline">
                        #
                      </span>
                      {e.name}
                      {e.isNew && (
                        <span className="ml-auto text-[10px] font-medium text-brand">New</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
              {groups.length === 0 && (
                <p className="px-2 py-3 text-[12.5px] text-text-muted">No component called &ldquo;{query.trim()}&rdquo; yet.</p>
              )}
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
                "no-scrollbar relative hidden h-117.5 overflow-auto bg-[radial-gradient(60%_60%_at_45%_40%,var(--background-200),var(--background)_80%)] md:block",
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

            {/* Below md: just the selected frame, no panning. */}
            <div className="p-4 md:hidden">
              <div className="frame-surface relative h-85 ring-1 ring-border ring-inset">
                <LazyMount key={entry.slug}>
                  <FitToStage align={entry.stageAlign}>
                    <Demo />
                  </FitToStage>
                </LazyMount>
                <SelectionMarks label="inside" />
              </div>
            </div>

            {/* Floating toolbar */}
            <div className="flex justify-center px-4 pb-4 md:absolute md:inset-x-0 md:bottom-4 md:p-0">
              <div className="flex max-w-full items-center gap-1 rounded-2xl bg-background-100/90 p-1.5 smooth-shadow-ring-md backdrop-blur-xl">
                <button
                  type="button"
                  aria-label="Recenter the selected component"
                  title="Recenter"
                  onClick={() => center(entry.slug, true)}
                  className="hidden size-9 shrink-0 place-items-center rounded-xl text-text-secondary transition-colors duration-200 ease-out hover:bg-surface-hover hover:text-foreground md:grid"
                >
                  <IconMaximize aria-hidden className="size-4" />
                </button>
                <span aria-hidden className="mx-1 hidden h-5 w-px bg-border md:block" />
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
