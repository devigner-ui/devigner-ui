"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import {
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
import { CopyCommand } from "./copy-command";
import { trackCommandCopy } from "@/lib/analytics";
import { useSelection } from "./selection";

const TYPE_MS = 32;
const ENTER_PAUSE_MS = 360;
const LINE_MS = 130;
const PROMPT = "~/your-app $";

type Line = { text: string; tone?: "dim" | "bright"; kind?: "check" | "npm" };

/** packages/cli/src/commands/add.ts, line for line. Keep in step with it. */
function transcript(entry: CatalogEntry): Line[] {
  return [
    { text: "Adding components...", tone: "dim" },
    { text: "" },
    { text: `📦 ${entry.slug}`, tone: "bright" },
    { text: `  ✓ components/ui/${entry.slug}.tsx`, kind: "check" },
    { text: "" },
    { text: "  Install dependencies:", tone: "dim" },
    { text: `  npm i ${entry.dependencies.join(" ")}`, kind: "npm" },
    { text: "" },
    { text: "Done!", tone: "bright" },
  ];
}

const CHECK_LINE = 3;

function Prompt() {
  return (
    <>
      <span className="text-brand-tertiary">~/your-app</span>
      <span className="text-terminal-muted"> $ </span>
    </>
  );
}

function TreeIcon({ kind, open }: { kind: keyof typeof ICON; open?: boolean }) {
  const { Icon, tone } = ICON[kind];
  const Chevron = open ? IconChevronDown : IconChevronRight;
  return (
    <>
      {kind === "dir" ? (
        <Chevron aria-hidden className="size-3 shrink-0 text-text-muted" />
      ) : (
        <span aria-hidden className="w-3 shrink-0" />
      )}
      {kind === "dir" && open ? (
        <IconFolderOpen aria-hidden className={cn("size-4 shrink-0", tone)} />
      ) : (
        <Icon aria-hidden className={cn("size-4 shrink-0", tone)} />
      )}
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
        "ml-3 inline-flex h-6 items-center gap-1.5 rounded-md border px-2 align-middle font-sans text-[11px] font-medium transition-colors duration-200 ease-out",
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

const TREE: { name: string; depth: number; kind: "dir" | "tsx" | "json"; open?: boolean; fresh?: boolean }[] = [
  { name: "app/", depth: 0, kind: "dir" },
  { name: "components/", depth: 0, kind: "dir", open: true },
  { name: "ui/", depth: 1, kind: "dir", open: true },
  { name: "button.tsx", depth: 2, kind: "tsx" },
  { name: "", depth: 2, kind: "tsx", fresh: true },
  { name: "components.json", depth: 0, kind: "json" },
  { name: "package.json", depth: 0, kind: "json" },
];

const ICON = {
  dir: { Icon: IconFolder, tone: "text-text-muted" },
  tsx: { Icon: IconDocument, tone: "text-brand" },
  json: { Icon: IconDocument, tone: "text-warning" },
} as const;

export function Install({ entries }: { entries: CatalogEntry[] }) {
  const reduce = useReducedMotion();
  const { slug, setSlug } = useSelection();
  const entry = entries.find((e) => e.slug === slug) ?? entries[0];
  const command = `npx devignerui add ${entry.slug}`;
  const head = command.length - entry.slug.length;
  const lines = transcript(entry);

  const stage = useRef<HTMLDivElement>(null);
  const checkRef = useRef<HTMLSpanElement>(null);
  const rowRef = useRef<HTMLLIElement>(null);
  const inView = useInView(stage, { once: true, amount: 0.5 });

  // Two counters drive the whole transcript: characters typed, lines printed.
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
    for (let i = 1; i <= command.length; i++) {
      timers.push(setTimeout(() => setTyped(i), 250 + i * TYPE_MS));
    }
    const enterAt = 250 + command.length * TYPE_MS + ENTER_PAUSE_MS;
    lines.forEach((_, i) => timers.push(setTimeout(() => setPrinted(i + 1), enterAt + i * LINE_MS)));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce, command, run, lines.length]);

  // The connector runs from the end of the check line to the new tree row, in
  // the composition's own coordinates. Measured, so it follows wraps and
  // resizes. Routed like a circuit trace: along the check line's row, down
  // just short of the tree, then in, so it never crosses the transcript.
  const measure = useCallback(() => {
    const box = stage.current?.getBoundingClientRect();
    const a = checkRef.current?.getBoundingClientRect();
    const b = rowRef.current?.getBoundingClientRect();
    if (!box || !a || !b) return;
    const [sx, sy] = [a.right - box.left + 10, a.top - box.top + a.height / 2];
    const [ex, ey] = [b.left - box.left + 6, b.top - box.top + b.height / 2];
    const elbow = Math.max(sx + 24, ex - 44);
    const dir = Math.sign(ey - sy) || 1;
    const r = Math.min(16, Math.abs(ey - sy) / 2, (elbow - sx) / 2, (ex - elbow) / 2);
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
  }, [measure, entry.slug]);

  const checked = printed > CHECK_LINE;
  const done = printed === lines.length;
  const typing = typed < command.length;

  return (
    <section id="install" aria-labelledby="install-title" className="scroll-mt-24 border-t border-border py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <h2
          id="install-title"
          className="text-[clamp(2rem,3.6vw,2.875rem)] leading-[1.04] font-semibold tracking-tighter text-balance text-foreground"
        >
          Two <span className="accent-word">commands</span>, then it&apos;s your code
        </h2>

        <div className="mt-8 max-w-5xl text-[clamp(1.35rem,2.5vw,1.875rem)] leading-[1.8] font-semibold tracking-[-0.035em] text-text-tertiary">
          Run{" "}
          <CopyCommand
            command="npx devignerui init"
            highlight="init"
            variant="tile"
            step={1}
            className="-translate-y-1 align-middle"
          />{" "}
          <span className="text-foreground">once</span> in your project. After that,{" "}
          <CopyCommand
            command={command}
            highlight={entry.slug}
            variant="tile"
            step={2}
            className="max-w-full -translate-y-1 align-middle"
          />{" "}
          writes{" "}
          {/* Waits in outline until the terminal below prints the write. */}
          <span
            className={cn(
              "inline-flex h-11 -translate-y-1 items-center gap-2.5 rounded-xl border pr-3.5 pl-1.5 align-middle font-mono text-[13px] font-normal tracking-normal transition-[background-color,border-color,color,box-shadow] duration-300 ease-out",
              checked
                ? "border-success/30 bg-linear-to-b from-success/10 to-background-100 text-foreground shadow-[0_0_28px_-12px_var(--success)]"
                : "border-dashed border-border-hover text-text-muted",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "grid size-7 place-items-center rounded-lg transition-colors duration-300 ease-out",
                checked ? "bg-success/15 text-success" : "bg-surface-hover text-text-muted",
              )}
            >
              <IconDocumentCode className="size-4" />
            </span>
            {entry.slug}.tsx
            <span className={cn("text-[12px] transition-opacity duration-300 ease-out", checked ? "text-success" : "opacity-0")}>
              +{entry.lines}
            </span>
          </span>{" "}
          into components/ui, and from then on it&apos;s{" "}
          <span className="text-foreground">a normal file in your repo</span>.
        </div>

        {/* The sentence is live: pick another component and both commands,
            the terminal and the tree all follow. */}
        <div role="group" aria-label="Component to add" className="mt-7 flex flex-wrap items-center gap-1.5">
          <span className="mr-2 text-[13px] font-medium text-text-muted">Try it with</span>
          {entries.map((e) => {
            const on = e.slug === entry.slug;
            return (
              <button
                key={e.slug}
                type="button"
                aria-pressed={on}
                onClick={() => setSlug(e.slug)}
                className={cn(
                  "relative h-8 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  on ? "text-foreground" : "text-text-muted hover:text-text-secondary",
                )}
              >
                {on && (
                  <motion.span
                    aria-hidden
                    layoutId="install-pick"
                    transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                    className="absolute inset-0 rounded-full border border-border-hover bg-background-200 shadow-subtle"
                  />
                )}
                <span className="relative">{e.name}</span>
              </button>
            );
          })}
        </div>

        <div ref={stage} className="relative mt-14 sm:pb-24">
          {/* Terminal: dark in both themes, the way a terminal is. */}
          <div className="overflow-hidden rounded-[20px] bg-terminal bg-[radial-gradient(80%_50%_at_30%_0%,var(--glow),transparent_70%)] shadow-elevated ring-1 ring-border sm:w-[74%]">
            <div className="flex items-center gap-1.5 border-b border-terminal-foreground/10 py-2.5 pr-2.5 pl-4">
              <span aria-hidden className="mr-3 flex gap-1.5">
                <span className="size-2.5 rounded-full bg-terminal-foreground/15" />
                <span className="size-2.5 rounded-full bg-terminal-foreground/15" />
                <span className="size-2.5 rounded-full bg-terminal-foreground/15" />
              </span>
              <span className="inline-flex h-8 items-center gap-2 rounded-lg px-2.5 font-mono text-[12.5px] text-terminal-muted">
                <span aria-hidden className="grid size-4.5 place-items-center rounded-[5px] bg-success/20 text-success">
                  <IconCheck className="size-3" />
                </span>
                init
              </span>
              <span className="inline-flex h-8 min-w-0 items-center gap-2 rounded-lg bg-terminal-foreground/8 px-2.5 font-mono text-[12.5px] text-terminal-foreground ring-1 ring-terminal-foreground/10">
                <span aria-hidden className="grid size-4.5 place-items-center rounded-[5px] bg-brand text-[10.5px] leading-none text-brand-foreground">
                  2
                </span>
                <span className="truncate">add {entry.slug}</span>
              </span>
              <button
                type="button"
                onClick={() => setRun((r) => r + 1)}
                className="ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-terminal-foreground/10 px-3 text-[12px] font-medium text-terminal-muted transition-colors duration-200 ease-out hover:bg-terminal-foreground/8 hover:text-terminal-foreground"
              >
                <IconRestart aria-hidden className="size-3.5" />
                {/* Icon only on phones, so the add tab keeps its name. */}
                <span className="max-sm:sr-only">Run it again</span>
              </button>
            </div>

            <div className="overflow-x-auto px-5 py-6 font-mono text-[14px]/7 text-terminal-foreground">
              <p className="sr-only">
                {PROMPT} {command}. {lines.map((l) => l.text.trim()).filter(Boolean).join(". ")}
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
                  key={i}
                  className={cn(
                    "min-h-7 whitespace-pre",
                    i >= printed && "invisible",
                    line.tone === "dim" && "text-terminal-muted",
                    line.tone === "bright" && "font-medium",
                    line.kind === "check" &&
                      "-mx-2.5 w-fit rounded-md bg-success/12 px-2.5 text-success ring-1 ring-success/25 ring-inset",
                    line.kind === "npm" && "font-medium",
                    !line.tone && !line.kind && "text-terminal-foreground/85",
                  )}
                >
                  {line.kind === "check" ? (
                    <span ref={checkRef} aria-hidden>
                      {line.text}
                    </span>
                  ) : line.kind === "npm" ? (
                    // The command stays quiet so the package names read first.
                    <span aria-hidden>
                      <span className="text-terminal-muted">{line.text.slice(0, line.text.indexOf("npm i") + 5)}</span>
                      {line.text.slice(line.text.indexOf("npm i") + 5)}
                    </span>
                  ) : (
                    <span aria-hidden>{line.text}</span>
                  )}
                  {line.kind === "npm" && <InlineCopy text={line.text.trim()} />}
                </div>
              ))}
              <div aria-hidden className={cn("whitespace-pre", !done && "invisible")}>
                <Prompt />
                <span className="caret-blink inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-terminal-foreground" />
              </div>
            </div>
          </div>

          {/* The file tree, overlapping the terminal's right edge. */}
          <div className="relative mt-4 overflow-hidden rounded-[20px] border border-border-hover bg-linear-to-b from-background-200/95 to-background-100/95 shadow-elevated backdrop-blur-xl sm:absolute sm:top-28 sm:right-0 sm:mt-0 sm:w-[38%] sm:min-w-72 lg:w-[30%]">
            <span
              aria-hidden
              className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-foreground/20 to-transparent"
            />
            <div className="flex items-center gap-2.5 border-b border-border py-3 pr-3 pl-3.5">
              <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-surface-hover text-text-secondary">
                <IconFolderOpen className="size-4" />
              </span>
              <span className="font-mono text-[13px] font-medium text-foreground">your-app</span>
              <span
                className={cn(
                  "ml-auto inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-medium ring-1 transition-colors duration-300 ease-out ring-inset",
                  checked
                    ? "bg-success/12 text-success ring-success/25"
                    : "bg-surface-hover text-text-muted ring-border",
                )}
              >
                <span aria-hidden className={cn("size-1.5 rounded-full", checked ? "bg-success" : "bg-text-muted")} />
                {checked ? "1 new file" : "no changes"}
              </span>
            </div>
            <ul className="p-2 font-mono text-[13px]">
              {TREE.map((row, i) => (
                <li
                  key={i}
                  ref={row.fresh ? rowRef : undefined}
                  className={cn(
                    "relative flex h-8.5 items-center gap-2 rounded-lg pr-2 transition-[opacity,background-color,box-shadow] duration-300 ease-out",
                    row.fresh &&
                      checked &&
                      "bg-linear-to-r from-brand/18 to-brand/4 shadow-[0_0_30px_-10px_var(--brand)] ring-1 ring-brand/30 ring-inset",
                    // Once the file lands, the rows it didn't touch step back.
                    !row.fresh && checked && "opacity-65",
                  )}
                  style={{ paddingLeft: 8 + row.depth * 18 }}
                >
                  {Array.from({ length: row.depth }, (_, d) => (
                    <span
                      key={d}
                      aria-hidden
                      className="absolute inset-y-0 w-px bg-border"
                      style={{ left: 13 + d * 18 }}
                    />
                  ))}
                  {row.fresh ? (
                    <motion.span
                      initial={false}
                      animate={checked ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                      transition={reduce ? { duration: 0 } : SPRING_PANEL}
                      className="flex min-w-0 flex-1 items-center gap-2 text-foreground"
                    >
                      <span aria-hidden className="w-3 shrink-0" />
                      <IconDocument aria-hidden className={cn("size-4 shrink-0", ICON.tsx.tone)} />
                      <span className="truncate font-medium">{entry.slug}.tsx</span>
                      <span className="shrink-0 rounded-[5px] bg-brand px-1.5 font-sans text-[10px]/4.5 font-semibold text-brand-foreground">
                        new
                      </span>
                      <span className="ml-auto shrink-0 text-[11.5px] text-success">+{entry.lines}</span>
                    </motion.span>
                  ) : (
                    <>
                      <TreeIcon kind={row.kind} open={row.open} />
                      <span className={row.kind === "dir" ? "text-text-muted" : "text-text-secondary"}>
                        {row.name}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-3 border-t border-border bg-background/40 px-4 py-3 text-[12px] text-text-muted">
              {checked ? (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-mono font-medium text-success">+1</span>
                    file added
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <IconCheck aria-hidden className="size-3.5" />
                    nothing else changed
                  </span>
                </>
              ) : (
                <span>Waiting for the add command</span>
              )}
            </div>
          </div>

          {/* Connector from the check line to the new row: green where the CLI
              reports the write, cobalt where the file lands. */}
          {path && (
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden size-full overflow-visible sm:block"
            >
              <defs>
                <linearGradient
                  id="install-trace"
                  gradientUnits="userSpaceOnUse"
                  x1={path.start[0]}
                  y1={0}
                  x2={path.end[0]}
                  y2={0}
                >
                  <stop offset="0" stopColor="var(--success)" />
                  <stop offset="0.6" stopColor="var(--brand)" />
                </linearGradient>
                <mask id="install-connector" maskUnits="userSpaceOnUse">
                  <motion.path
                    d={path.d}
                    fill="none"
                    stroke="white"
                    strokeWidth={10}
                    initial={false}
                    animate={{ pathLength: checked ? 1 : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.8, ease: EASE_OUT }}
                  />
                </mask>
              </defs>
              <g
                mask="url(#install-connector)"
                fill="none"
                stroke="url(#install-trace)"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* A soft underglow, then the trace itself. */}
                <path d={path.d} strokeWidth={6} opacity={0.14} />
                <path d={path.d} strokeWidth={1.5} opacity={0.8} />
                {checked && !reduce && (
                  <path
                    d={path.d}
                    pathLength={1}
                    // A white core reads as light moving; the glow tints it.
                    // The path sits over the terminal, dark in both themes.
                    stroke="white"
                    strokeWidth={2}
                    strokeDasharray="0.1 1"
                    className="trace-pulse"
                  />
                )}
              </g>
              <motion.g
                initial={false}
                animate={{ opacity: checked ? 1 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.3, ease: EASE_OUT }}
              >
                <circle cx={path.start[0]} cy={path.start[1]} r={7} className="fill-success/15" />
                <circle cx={path.start[0]} cy={path.start[1]} r={3} className="fill-success" />
                <circle cx={path.end[0]} cy={path.end[1]} r={7} className="fill-brand/20" />
                <circle cx={path.end[0]} cy={path.end[1]} r={3} className="fill-brand" />
              </motion.g>
            </svg>
          )}
        </div>
      </div>
    </section>
  );
}
