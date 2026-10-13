"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
  IconBox,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconDocument,
  IconDocumentCode,
  IconFolder,
  IconFolderOpen,
  IconRestart,
} from "@devigner-ui/icons";
import { cn } from "cn";
import { EASE_OUT, SPRING_LAYOUT, SPRING_PANEL } from "devignerui/motion";
import type { CatalogEntry } from "@/lib/catalog-query";
import { trackCommandCopy } from "@/lib/analytics";
import { CopyCommand } from "./copy-command";
import { useSelection } from "./selection";

/* The install section. Both commands are
   runnable tabs with their real output (init included), the file tree shows
   what each one changed, the component picker is a single scrolling rail
   that follows the window, and the CLI's tick and package lines are icons. */

const TYPE_MS = 30;
const ENTER_PAUSE_MS = 320;
const LINE_MS = 120;

type Tab = "init" | "add";
type Line = { text: string; tone?: "dim" | "bright"; kind?: "check" | "npm" | "pkg" };

/** packages/cli/src/commands, line for line, with icons for its symbols. */
function transcript(tab: Tab, entry: CatalogEntry): Line[] {
  if (tab === "init")
    return [
      { text: "Created components/ui", kind: "check" },
      { text: "Created components.json", kind: "check" },
      { text: "" },
      { text: "Devigner UI initialized!", tone: "bright" },
      { text: "" },
      { text: "Next steps:", tone: "dim" },
      { text: `  1. Add a component: npx devignerui add ${entry.slug}`, tone: "dim" },
      { text: "  2. List components:  npx devignerui list", tone: "dim" },
    ];
  return [
    { text: "Adding components...", tone: "dim" },
    { text: "" },
    { text: entry.slug, kind: "pkg" },
    { text: `components/ui/${entry.slug}.tsx`, kind: "check" },
    { text: "" },
    { text: "  Install dependencies:", tone: "dim" },
    { text: `  npm i ${entry.dependencies.join(" ")}`, kind: "npm" },
    { text: "" },
    { text: "Done!", tone: "bright" },
  ];
}

/** The line that announces the write the tree shows. */
const WRITE_LINE: Record<Tab, number> = { init: 1, add: 3 };

function Prompt() {
  return (
    <>
      <span className="text-brand-tertiary">~/your-app</span>
      <span className="text-terminal-muted"> $ </span>
    </>
  );
}

function InlineCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : `Copy: ${text}`}
      onClick={() =>
        navigator.clipboard.writeText(text).then(
          () => {
            trackCommandCopy(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          },
          () => {},
        )
      }
      className={cn(
        "ml-3 inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 align-middle font-sans text-[11px] font-medium transition-colors duration-200 ease-out",
        copied
          ? "border-success/30 bg-success/10 text-success"
          : "border-terminal-foreground/15 text-terminal-muted hover:bg-terminal-foreground/8 hover:text-terminal-foreground",
      )}
    >
      {copied ? <IconCheck aria-hidden className="size-3" /> : <IconCopy aria-hidden className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

type Row = { name: string; depth: number; kind: "dir" | "tsx" | "json"; open?: boolean; fresh?: Tab };

const TREE: Row[] = [
  { name: "app/", depth: 0, kind: "dir" },
  { name: "components/", depth: 0, kind: "dir", open: true },
  { name: "ui/", depth: 1, kind: "dir", open: true, fresh: "init" },
  { name: "", depth: 2, kind: "tsx", fresh: "add" },
  { name: "components.json", depth: 0, kind: "json", fresh: "init" },
  { name: "package.json", depth: 0, kind: "json" },
];

const ICON = {
  dir: { Icon: IconFolder, tone: "text-text-muted" },
  tsx: { Icon: IconDocumentCode, tone: "text-brand" },
  json: { Icon: IconDocument, tone: "text-warning" },
} as const;

export function Install({ entries }: { entries: CatalogEntry[] }) {
  const reduce = useReducedMotion();
  const { slug, setSlug } = useSelection();
  const entry = entries.find((e) => e.slug === slug) ?? entries[0];
  const [tab, setTab] = useState<Tab>("add");
  const command = tab === "init" ? "npx devignerui init" : `npx devignerui add ${entry.slug}`;
  const head = tab === "init" ? command.length - 4 : command.length - entry.slug.length;
  const lines = transcript(tab, entry);

  const stage = useRef<HTMLDivElement>(null);
  const writeRef = useRef<HTMLSpanElement>(null);
  const rowRef = useRef<HTMLLIElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const inView = useInView(stage, { once: true, amount: 0.5 });

  const [typed, setTyped] = useState(0);
  const [printed, setPrinted] = useState(0);
  const [run, setRun] = useState(0);
  const [path, setPath] = useState<{ d: string; start: [number, number]; end: [number, number] } | null>(null);

  useEffect(() => {
    if (reduce) {
      setTyped(command.length);
      setPrinted(lines.length);
      return;
    }
    setTyped(0);
    setPrinted(0);
    if (!inView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= command.length; i++) timers.push(setTimeout(() => setTyped(i), 250 + i * TYPE_MS));
    const enterAt = 250 + command.length * TYPE_MS + ENTER_PAUSE_MS;
    lines.forEach((_, i) => timers.push(setTimeout(() => setPrinted(i + 1), enterAt + i * LINE_MS)));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce, command, run, lines.length]);

  // Keep the picked component in view on the rail, without moving the page.
  useEffect(() => {
    const r = rail.current;
    const chip = r?.querySelector<HTMLElement>(`[data-slug="${entry.slug}"]`);
    if (!r || !chip) return;
    const left = chip.offsetLeft - r.clientWidth / 2 + chip.clientWidth / 2;
    r.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  }, [entry.slug, reduce]);

  const written = printed > WRITE_LINE[tab];
  const done = printed === lines.length;
  const typing = typed < command.length;
  const progress = (typed / command.length) * 0.4 + (printed / lines.length) * 0.6;

  const measure = useCallback(() => {
    const box = stage.current?.getBoundingClientRect();
    const a = writeRef.current?.getBoundingClientRect();
    const b = rowRef.current?.getBoundingClientRect();
    if (!box || !a || !b) return setPath(null);
    const [sx, sy] = [a.right - box.left + 10, a.top - box.top + a.height / 2];
    const [ex, ey] = [b.left - box.left + 6, b.top - box.top + b.height / 2];
    const elbow = Math.max(sx + 24, ex - 44);
    const dir = Math.sign(ey - sy) || 1;
    const r = Math.max(0, Math.min(16, Math.abs(ey - sy) / 2, (elbow - sx) / 2, (ex - elbow) / 2));
    setPath({
      d: `M${sx} ${sy} H${elbow - r} Q${elbow} ${sy} ${elbow} ${sy + dir * r} V${ey - dir * r} Q${elbow} ${ey} ${elbow + r} ${ey} H${ex}`,
      start: [sx, sy],
      end: [ex, ey],
    });
  }, []);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, [measure, entry.slug, tab, printed > WRITE_LINE[tab]]);

  return (
    <section id="install" aria-labelledby="install-title" className="scroll-mt-24 border-t border-border py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <h2 id="install-title" className="text-[clamp(2rem,3.6vw,2.875rem)] leading-[1.04] font-semibold tracking-tighter text-balance text-foreground">
          Two <span className="accent-word">commands</span>, then it&apos;s your code
        </h2>

        <p className="mt-4 max-w-xl text-[16px]/[1.65] text-pretty text-text-secondary">
          No package to keep in sync. The CLI copies the source into your project, and from then on it&apos;s{" "}
          <span className="text-foreground">a normal file in your repo</span>.
        </p>

        {/* The two commands and what they leave behind, read left to right. */}
        <div className="mt-9 flex flex-wrap items-end gap-x-3 gap-y-5">
          <div>
            <span className="mb-2 block text-[12.5px] font-medium text-text-muted">Once per project</span>
            <CopyCommand command="npx devignerui init" highlight="init" variant="tile" step={1} />
          </div>
          <IconChevronRight aria-hidden className="mb-3.5 size-4 shrink-0 text-text-muted max-sm:hidden" />
          <div className="min-w-0 max-w-full">
            <span className="mb-2 block text-[12.5px] font-medium text-text-muted">Then, per component</span>
            <CopyCommand command={`npx devignerui add ${entry.slug}`} highlight={entry.slug} variant="tile" step={2} className="max-w-full" />
          </div>
          <IconChevronRight aria-hidden className="mb-3.5 size-4 shrink-0 text-text-muted max-sm:hidden" />
          <div>
            <span className="mb-2 block text-[12.5px] font-medium text-text-muted">Lands in components/ui</span>
            <span
              className={cn(
                "inline-flex h-11 items-center gap-2.5 rounded-xl border pr-3.5 pl-1.5 font-mono text-[13px] transition-[background-color,border-color,color] duration-300 ease-out",
                tab === "add" && written
                  ? "border-success/30 bg-success/8 text-foreground"
                  : "border-dashed border-border-hover text-text-muted",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-7 place-items-center rounded-lg transition-colors duration-300 ease-out",
                  tab === "add" && written ? "bg-success/15 text-success" : "bg-surface-hover text-text-muted",
                )}
              >
                <IconDocumentCode className="size-4" />
              </span>
              {entry.slug}.tsx
              <span className={cn("text-[12px] transition-opacity duration-300 ease-out", tab === "add" && written ? "text-success" : "opacity-0")}>
                +{entry.lines}
              </span>
            </span>
          </div>
        </div>

        {/* One rail, not a wall of chips. It follows the window above. */}
        <div className="mt-7 flex items-center gap-4 border-t border-border pt-5">
          <span className="shrink-0 text-[13px] font-medium text-text-muted">Try it with</span>
          <div
            ref={rail}
            role="group"
            aria-label="Component to add"
            className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto mask-r-from-90% py-1 pr-10"
          >
            {entries.map((e) => {
              const on = e.slug === entry.slug;
              return (
                <button
                  key={e.slug}
                  type="button"
                  data-slug={e.slug}
                  aria-pressed={on}
                  onClick={() => {
                    setSlug(e.slug);
                    setTab("add");
                  }}
                  className={cn(
                    "relative h-8 shrink-0 cursor-pointer rounded-full px-3.5 text-[13px] font-medium whitespace-nowrap outline-none transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-brand",
                    on ? "text-foreground" : "text-text-muted hover:text-text-secondary",
                  )}
                >
                  {on && (
                    <motion.span
                      aria-hidden
                      layoutId="d-install-pick"
                      transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                      className="absolute inset-0 rounded-full border border-border-hover bg-background-200 shadow-subtle"
                    />
                  )}
                  <span className="relative">{e.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div ref={stage} className="relative mt-12 sm:pb-24">
          {/* Terminal: dark in both themes. */}
          <div className="overflow-hidden rounded-[20px] bg-terminal shadow-elevated ring-1 ring-border sm:w-[72%]">
            <div className="relative flex items-center gap-1.5 border-b border-terminal-foreground/10 py-2.5 pr-2.5 pl-4">
              <span aria-hidden className="mr-3 flex gap-1.5">
                <span className="size-2.5 rounded-full bg-terminal-foreground/15" />
                <span className="size-2.5 rounded-full bg-terminal-foreground/15" />
                <span className="size-2.5 rounded-full bg-terminal-foreground/15" />
              </span>
              <div role="tablist" aria-label="Command" className="flex min-w-0 gap-1">
                {(["init", "add"] as const).map((t, i) => {
                  const on = tab === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => {
                        setTab(t);
                        setRun((r) => r + 1);
                      }}
                      className={cn(
                        "relative inline-flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2.5 font-mono text-[12.5px] transition-colors duration-200 ease-out",
                        on ? "text-terminal-foreground" : "text-terminal-muted hover:text-terminal-foreground",
                      )}
                    >
                      {on && (
                        <motion.span
                          aria-hidden
                          layoutId="d-terminal-tab"
                          transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                          className="absolute inset-0 rounded-lg bg-terminal-foreground/8 ring-1 ring-terminal-foreground/10"
                        />
                      )}
                      <span
                        aria-hidden
                        className={cn(
                          "relative grid size-4.5 place-items-center rounded-[5px] text-[10.5px] leading-none",
                          on ? "bg-brand text-brand-foreground" : "bg-terminal-foreground/10",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="relative truncate">{t === "init" ? "init" : `add ${entry.slug}`}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setRun((r) => r + 1)}
                className="ml-auto inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-terminal-foreground/10 px-3 text-[12px] font-medium text-terminal-muted transition-colors duration-200 ease-out hover:bg-terminal-foreground/8 hover:text-terminal-foreground"
              >
                <IconRestart aria-hidden className="size-3.5" />
                <span className="max-sm:sr-only">Run it again</span>
              </button>
              {/* How far the run has got. */}
              <motion.span
                aria-hidden
                initial={false}
                animate={{ scaleX: progress, opacity: done ? 0 : 1 }}
                transition={reduce ? { duration: 0 } : { duration: 0.25, ease: EASE_OUT }}
                className="absolute inset-x-0 -bottom-px h-px origin-left bg-brand"
              />
            </div>

            <div className="min-h-88 overflow-x-auto px-5 py-6 font-mono text-[14px]/7 text-terminal-foreground">
              <p className="sr-only">
                {command}. {lines.map((l) => l.text.trim()).filter(Boolean).join(". ")}
              </p>
              <div aria-hidden className="whitespace-pre">
                <Prompt />
                <span className="font-medium">
                  {command.slice(0, Math.min(typed, head))}
                  <span className="text-brand-secondary">{command.slice(head, typed)}</span>
                </span>
                {typing && <span className="caret-blink ml-px inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-terminal-foreground" />}
              </div>
              {lines.map((line, i) => (
                <div
                  key={`${tab}-${i}`}
                  aria-hidden
                  className={cn(
                    "flex min-h-7 items-center whitespace-pre",
                    i >= printed && "invisible",
                    line.tone === "dim" && "text-terminal-muted",
                    line.tone === "bright" && "font-medium",
                    !line.tone && !line.kind && "text-terminal-foreground/85",
                  )}
                >
                  {line.kind === "check" ? (
                    <span
                      ref={i === WRITE_LINE[tab] ? writeRef : undefined}
                      className="-mx-2.5 inline-flex items-center gap-2 rounded-md bg-success/12 px-2.5 text-success ring-1 ring-success/25 ring-inset"
                    >
                      <IconCheck className="size-3.5" />
                      {line.text}
                    </span>
                  ) : line.kind === "pkg" ? (
                    <span className="inline-flex items-center gap-2 font-medium">
                      <IconBox className="size-4 text-brand-secondary" />
                      {line.text}
                    </span>
                  ) : line.kind === "npm" ? (
                    <>
                      <span>
                        <span className="text-terminal-muted">{line.text.slice(0, line.text.indexOf("npm i") + 5)}</span>
                        <span className="font-medium">{line.text.slice(line.text.indexOf("npm i") + 5)}</span>
                      </span>
                      <InlineCopy text={line.text.trim()} />
                    </>
                  ) : (
                    line.text
                  )}
                </div>
              ))}
              <div aria-hidden className={cn("whitespace-pre", !done && "invisible")}>
                <Prompt />
                <span className="caret-blink inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-terminal-foreground" />
              </div>
            </div>
          </div>

          {/* The file tree, over the terminal's right edge. */}
          <div className="relative mt-4 overflow-hidden rounded-[20px] border border-border-hover bg-linear-to-b from-background-200/95 to-background-100/95 shadow-elevated backdrop-blur-xl sm:absolute sm:top-24 sm:right-0 sm:mt-0 sm:w-[38%] sm:min-w-72 lg:w-[31%]">
            <div className="flex items-center gap-2.5 border-b border-border py-3 pr-3 pl-3.5">
              <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-surface-hover text-text-secondary">
                <IconFolderOpen className="size-4" />
              </span>
              <span className="font-mono text-[13px] font-medium text-foreground">your-app</span>
              <span
                className={cn(
                  "ml-auto inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-medium ring-1 transition-colors duration-300 ease-out ring-inset",
                  written ? "bg-success/12 text-success ring-success/25" : "bg-surface-hover text-text-muted ring-border",
                )}
              >
                <span aria-hidden className={cn("size-1.5 rounded-full", written ? "bg-success" : "bg-text-muted")} />
                {written ? (tab === "init" ? "2 new" : "1 new file") : "no changes"}
              </span>
            </div>
            <ul className="p-2 font-mono text-[13px]">
              {TREE.map((row, i) => {
                const fresh = row.fresh === tab && written;
                // The new component file only exists once add has written it.
                if (row.fresh === "add" && tab !== "add") return null;
                const Chevron = row.open ? IconChevronDown : IconChevronRight;
                const RowIcon = row.kind === "dir" && row.open ? IconFolderOpen : ICON[row.kind].Icon;
                return (
                  <li
                    key={i}
                    // init writes two rows; the trace lands on components.json.
                    ref={row.fresh === tab && (tab === "add" || row.kind === "json") ? rowRef : undefined}
                    className={cn(
                      "relative flex h-8.5 items-center gap-2 rounded-lg pr-2 transition-[opacity,background-color,box-shadow] duration-300 ease-out",
                      fresh && "bg-linear-to-r from-brand/16 to-brand/3 ring-1 ring-brand/30 ring-inset",
                      !fresh && written && "opacity-60",
                    )}
                    style={{ paddingLeft: 8 + row.depth * 18 }}
                  >
                    {Array.from({ length: row.depth }, (_, d) => (
                      <span key={d} aria-hidden className="absolute inset-y-0 w-px bg-border" style={{ left: 13 + d * 18 }} />
                    ))}
                    {row.fresh === "add" ? (
                      <motion.span
                        initial={false}
                        animate={written ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                        transition={reduce ? { duration: 0 } : SPRING_PANEL}
                        className="flex min-w-0 flex-1 items-center gap-2 text-foreground"
                      >
                        <span aria-hidden className="w-3 shrink-0" />
                        <IconDocumentCode aria-hidden className="size-4 shrink-0 text-brand" />
                        <span className="truncate font-medium">{entry.slug}.tsx</span>
                        <span className="shrink-0 rounded-[5px] bg-brand px-1.5 font-sans text-[10px]/4.5 font-semibold text-brand-foreground">new</span>
                        <span className="ml-auto shrink-0 text-[11.5px] text-success">+{entry.lines}</span>
                      </motion.span>
                    ) : (
                      <>
                        {row.kind === "dir" ? (
                          <Chevron aria-hidden className="size-3 shrink-0 text-text-muted" />
                        ) : (
                          <span aria-hidden className="w-3 shrink-0" />
                        )}
                        <RowIcon aria-hidden className={cn("size-4 shrink-0", ICON[row.kind].tone)} />
                        <span className={row.kind === "dir" ? "text-text-muted" : "text-text-secondary"}>{row.name}</span>
                        {fresh && (
                          <span className="ml-auto shrink-0 rounded-[5px] bg-brand px-1.5 font-sans text-[10px]/4.5 font-semibold text-brand-foreground">new</span>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between gap-3 border-t border-border bg-background/40 px-4 py-3 text-[12px] text-text-muted">
              {written ? (
                <>
                  <span>
                    <span className="font-mono font-medium text-success">+{tab === "init" ? 2 : 1}</span> {tab === "init" ? "added" : "file added"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <IconCheck aria-hidden className="size-3.5" />
                    nothing else changed
                  </span>
                </>
              ) : (
                <span>Waiting for the {tab} command</span>
              )}
            </div>
          </div>

          {/* The trace from the write line to the row it wrote. */}
          {path && written && (
            <svg aria-hidden className="pointer-events-none absolute inset-0 hidden size-full overflow-visible sm:block">
              <defs>
                <linearGradient id="d-install-trace" gradientUnits="userSpaceOnUse" x1={path.start[0]} y1={0} x2={path.end[0]} y2={0}>
                  <stop offset="0" stopColor="var(--success)" />
                  <stop offset="0.6" stopColor="var(--brand)" />
                </linearGradient>
              </defs>
              <g fill="none" stroke="url(#d-install-trace)" strokeLinecap="round" strokeLinejoin="round">
                <motion.path
                  key={`${tab}-${run}-${entry.slug}`}
                  d={path.d}
                  strokeWidth={1.5}
                  initial={{ pathLength: reduce ? 1 : 0, opacity: 0.85 }}
                  animate={{ pathLength: 1 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.8, ease: EASE_OUT }}
                />
                <path d={path.d} strokeWidth={6} opacity={0.12} />
                {!reduce && (
                  <path
                    d={path.d}
                    pathLength={1}
                    stroke="white"
                    strokeWidth={2}
                    strokeDasharray="0.1 1"
                    className="trace-pulse"
                  />
                )}
              </g>
              <circle cx={path.start[0]} cy={path.start[1]} r={3} className="fill-success" />
              <circle cx={path.end[0]} cy={path.end[1]} r={7} className="fill-brand/20" />
              <circle cx={path.end[0]} cy={path.end[1]} r={3} className="fill-brand" />
            </svg>
          )}
        </div>
      </div>
    </section>
  );
}
