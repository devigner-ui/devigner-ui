"use client";

import { useEffect, useRef, useState } from "react";
import {
  MotionConfig,
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { IconArrowLeft, IconArrowRight, IconChevronRight, IconDocumentCode } from "@devigner-ui/icons";
import { CopyButton, DeleteButton, GooSwitch, StardustSlider, type DeleteButtonStatus } from "devignerui";
import { EASE_IN_OUT, SPRING_LAYOUT } from "devignerui/motion";
import { cn } from "cn";
import type { CatalogEntry } from "@/lib/catalog-query";
import { demos } from "../../demos";
import { FitToStage } from "./canvas-frame";
import { useSelection } from "./selection";

/* The "Every state" bento. The callbacks cell logs what live components
   report as you use them, the theme split sweeps once to show it drags, and
   the confirm cell shows when the next step is coming. */

function Cell({
  title,
  text,
  className,
  children,
}: {
  title: string;
  text: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative flex min-h-90 flex-col overflow-hidden bg-background", className)}>
      <div className="relative z-10 px-7 pt-7">
        <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-foreground">{title}</h3>
        <p className="mt-1.5 max-w-sm text-[14.5px]/6 text-text-secondary">{text}</p>
      </div>
      {children}
    </div>
  );
}

/** A framed stage with a mono readout in its corner. */
function Stage({ readout, className, children }: { readout: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("frame-surface relative mx-7 mt-6 mb-7 flex flex-1 items-center justify-center ring-1 ring-border ring-inset", className)}>
      <span aria-hidden className="absolute top-3 left-3.5 z-10 font-mono text-[11px] text-text-muted">
        {readout}
      </span>
      {children}
    </div>
  );
}

/* ─── Callbacks ─── */

type Call = { id: number; name: string; arg: string; n: number };

function WiringCell() {
  const reduce = useReducedMotion();
  const [log, setLog] = useState<Call[]>([]);
  const next = useRef(0);
  const emit = (name: string, arg: unknown) =>
    setLog((l) => {
      const shown = JSON.stringify(arg);
      // A drag calls onValueChange every frame: fold a run into one line.
      if (name === "onValueChange" && l[0]?.name === name) return [{ ...l[0], arg: shown, n: l[0].n + 1 }, ...l.slice(1)];
      return [{ id: next.current++, name, arg: shown, n: 1 }, ...l].slice(0, 6);
    });

  return (
    <Cell
      title="Wires into your state"
      text="Every change comes out through a typed callback, ready for your store or your server. Use them and read the log."
      className="lg:col-span-7"
    >
      <Stage
        readout="props in, callbacks out"
        className="grid min-h-84 grid-cols-1 items-stretch sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
      >
        <div className="flex flex-col justify-center gap-6 px-6 pt-11 pb-6">
          <StardustSlider
            variant="bare"
            size="sm"
            defaultValue={42}
            aria-label="Volume"
            onValueChange={(v) => emit("onValueChange", v)}
            onValueCommit={(v) => emit("onValueCommit", v)}
          />
          <div className="flex items-center justify-between gap-4">
            <span id="wire-switch" className="text-[13.5px] font-medium text-foreground">
              Notifications
            </span>
            <GooSwitch size="sm" defaultChecked aria-labelledby="wire-switch" onCheckedChange={(c) => emit("onCheckedChange", c)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <code className="truncate text-[12.5px] text-text-secondary">npx devignerui init</code>
            <CopyButton size="sm" value="npx devignerui init" onCopy={(v) => emit("onCopy", v)} />
          </div>
        </div>
        <ol
          role="log"
          aria-label="Callback log"
          className="flex flex-col gap-1.5 border-t border-border p-5 font-mono text-[12px] sm:border-t-0 sm:border-l"
        >
          {log.length === 0 && <li className="m-auto text-[11.5px] text-text-muted">Drag, flip or copy. The calls land here.</li>}
          {log.map((c, i) => (
            <motion.li
              key={c.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1 - i * 0.14, y: 0 }}
              transition={SPRING_LAYOUT}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-1.5",
                i === 0 ? "bg-brand/8 ring-1 ring-brand/25" : "ring-1 ring-border",
              )}
            >
              <span className="min-w-0 truncate">
                <span className="text-brand">{c.name}</span>
                <span className="text-text-muted">(</span>
                <span className="text-foreground">{c.arg}</span>
                <span className="text-text-muted">)</span>
              </span>
              {c.n > 1 && <span className="ml-auto shrink-0 text-[10.5px] text-text-muted tabular-nums">{c.n} calls</span>}
            </motion.li>
          ))}
        </ol>
      </Stage>
    </Cell>
  );
}

/* ─── Themes ─── */

function ThemesCell({ entry }: { entry: CatalogEntry }) {
  const Demo = demos[entry.slug];
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { once: true, amount: 0.6 });
  const split = useMotionValue(50);
  const [now, setNow] = useState(50);
  const touched = useRef(false);
  const dragging = useRef(false);
  useMotionValueEvent(split, "change", (v) => Math.round(v) !== now && setNow(Math.round(v)));
  const lightClip = useTransform(split, (v) => `inset(0 ${100 - v}% 0 0)`);
  const darkClip = useTransform(split, (v) => `inset(0 0 0 ${v}%)`);
  const handle = useTransform(split, (v) => `${v}%`);

  // One slow sweep the first time it is seen, so the handle reads as a handle.
  useEffect(() => {
    if (!inView || reduce) return;
    const run = animate(split, [50, 24, 76, 50], { duration: 2.6, ease: EASE_IN_OUT, delay: 0.4 });
    return () => run.stop();
  }, [inView, reduce, split]);

  const take = (v: number) => {
    touched.current = true;
    split.stop();
    split.set(Math.min(95, Math.max(5, v)));
  };
  const moveTo = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (r) take(((clientX - r.left) / r.width) * 100);
  };

  return (
    <Cell
      title="Right in both themes"
      text="Drag across it. Colors come from CSS variables, with no dark: classes in the file."
      className="lg:col-span-5"
    >
      <div ref={box} className="relative mt-6 min-h-80 flex-1">
        {(["light", "dark"] as const).map((scope) => (
          <motion.div
            key={scope}
            inert
            className={cn(scope, "frame-surface absolute inset-0")}
            style={{ clipPath: scope === "dark" ? darkClip : lightClip }}
          >
            <span
              className={cn(
                "absolute top-3 z-10 rounded-full bg-background-100 px-2 py-0.5 font-mono text-[10.5px] text-text-muted ring-1 ring-border",
                scope === "light" ? "left-3.5" : "right-3.5",
              )}
            >
              .{scope}
            </span>
            <FitToStage align={entry.stageAlign}>
              <Demo />
            </FitToStage>
          </motion.div>
        ))}
        <motion.div
          role="slider"
          tabIndex={0}
          aria-label="Light and dark divider"
          aria-valuemin={5}
          aria-valuemax={95}
          aria-valuenow={now}
          aria-valuetext={`${now}% light`}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            moveTo(e.clientX);
          }}
          onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") take(split.get() - 5);
            if (e.key === "ArrowRight") take(split.get() + 5);
          }}
          style={{ left: handle }}
          className="absolute inset-y-0 z-10 flex w-10 -translate-x-1/2 cursor-ew-resize touch-none justify-center outline-none focus-visible:[&>span:last-child]:ring-2 focus-visible:[&>span:last-child]:ring-brand"
        >
          <span aria-hidden className="h-full w-px bg-foreground/80" />
          <span
            aria-hidden
            className="absolute top-1/2 grid size-9 -translate-y-1/2 grid-flow-col place-items-center rounded-full bg-foreground text-background shadow-elevated"
          >
            <IconArrowLeft className="-mr-1 size-3" />
            <IconArrowRight className="-ml-1 size-3" />
          </span>
        </motion.div>
      </div>
    </Cell>
  );
}

/* ─── Reduced motion ─── */

function MotionCell({ entry }: { entry: CatalogEntry }) {
  const Demo = demos[entry.slug];
  const [still, setStill] = useState(false);
  return (
    <Cell title="Still when you ask" text="Turn on reduced motion and the springs stop. Everything still works." className="lg:col-span-4">
      <Stage
        readout={
          <>
            reducedMotion=<span className={still ? "text-brand" : "text-text-secondary"}>&quot;{still ? "always" : "user"}&quot;</span>
          </>
        }
        className="min-h-56 flex-col justify-between pt-10"
      >
        <div className="relative w-full flex-1">
          <MotionConfig reducedMotion={still ? "always" : "user"}>
            <FitToStage align="center" className="inset-x-4 inset-y-2">
              <Demo key={String(still)} />
            </FitToStage>
          </MotionConfig>
        </div>
        <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-full border border-border bg-background-100 py-1.5 pr-1.5 pl-4 text-[13px] font-medium text-foreground">
          <span id="d-reduce">Reduce motion</span>
          <GooSwitch size="sm" checked={still} onCheckedChange={setStill} aria-labelledby="d-reduce" />
        </label>
      </Stage>
    </Cell>
  );
}

/* ─── Loading and confirm ─── */

const STEPS: { status: DeleteButtonStatus; label: string }[] = [
  { status: "idle", label: "Idle" },
  { status: "armed", label: "Confirm" },
  { status: "pending", label: "Waiting" },
  { status: "done", label: "Done" },
];
const STEP_MS = 1600;

function StatesCell() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [status, setStatus] = useState<DeleteButtonStatus>("idle");
  const [auto, setAuto] = useState(true);
  const playing = auto && !reduce && inView;
  const take = (next: DeleteButtonStatus) => {
    setAuto(false);
    setStatus(next);
  };

  useEffect(() => {
    if (!playing) return;
    const i = STEPS.findIndex((s) => s.status === status);
    const id = setTimeout(() => setStatus(STEPS[(i + 1) % STEPS.length].status), STEP_MS);
    return () => clearTimeout(id);
  }, [playing, status]);

  return (
    <Cell title="Loading and confirm" text="Delete Button asks first, waits for your request, then shows a tick." className="lg:col-span-4">
      <div ref={ref} className="flex flex-1 flex-col">
        <Stage
          readout={
            <>
              status=<span className={status === "idle" ? "text-text-secondary" : "text-brand"}>&quot;{status}&quot;</span>
            </>
          }
          className="mb-0 min-h-44"
        >
          <DeleteButton
            status={status}
            onStatusChange={take}
            onConfirm={() => new Promise((resolve) => setTimeout(resolve, 900))}
            resetAfter={auto ? 0 : undefined}
          />
        </Stage>
        <ol aria-label="Delete Button states" className="mx-7 mt-3 mb-7 grid grid-cols-4 gap-1">
          {STEPS.map((s, i) => {
            const on = s.status === status;
            return (
              <li key={s.status}>
                <button
                  type="button"
                  aria-current={on ? "step" : undefined}
                  onClick={() => take(s.status)}
                  className={cn(
                    "relative flex h-12 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[10px] text-[12.5px] font-medium outline-none transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-brand",
                    on ? "text-foreground" : "text-text-muted hover:text-text-secondary",
                  )}
                >
                  {on && (
                    <motion.span
                      aria-hidden
                      layoutId="d-bento-step"
                      transition={SPRING_LAYOUT}
                      className="absolute inset-0 rounded-[10px] bg-background-200 ring-1 ring-border"
                    />
                  )}
                  {/* How long until the next step, while it plays itself. */}
                  {on && playing && (
                    <motion.span
                      key={status}
                      aria-hidden
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: STEP_MS / 1000, ease: EASE_IN_OUT }}
                      className="absolute inset-x-2 bottom-1 h-0.5 origin-left rounded-full bg-brand"
                    />
                  )}
                  <span className={cn("relative font-mono text-[10px] leading-none", on ? "text-brand" : "text-text-muted")}>0{i + 1}</span>
                  <span className="relative mt-1 leading-none">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </Cell>
  );
}

/* ─── One file ─── */

function tint(line: string) {
  if (!/className|classNames|cn\(/.test(line)) return line;
  return line.split(/("[^"]*")/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="text-brand">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function excerpt(code: string) {
  const lines = code.split("\n");
  const first = lines.findIndex((l) => l.includes("className="));
  const start = first < 0 ? 0 : Math.max(0, first - 3);
  return lines.slice(start, start + 16).map((text, i) => ({ n: start + i + 1, text, classes: /className=|cn\(/.test(text) }));
}

function CodeCell({ entries }: { entries: CatalogEntry[] }) {
  const { slug } = useSelection();
  const entry = entries.find((e) => e.slug === slug) ?? entries[0];
  const [source, setSource] = useState<Record<string, string | null>>({});
  const code = source[entry.slug];

  useEffect(() => {
    if (code !== undefined) return;
    let alive = true;
    fetch(`/api/registry/${entry.slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((json: { files: { content: string }[] }) => json.files[0]?.content ?? null)
      .catch(() => null)
      .then((text) => alive && setSource((s) => ({ ...s, [entry.slug]: text })));
    return () => {
      alive = false;
    };
  }, [entry.slug, code]);

  return (
    <Cell
      title="One file you own"
      text="A plain .tsx file in your repo. It follows the window above, and every class name is there to change."
      className="min-h-100 bg-background-100 lg:col-span-4"
    >
      <div className="relative mt-6 flex-1">
        <div className="absolute top-0 -right-10 -bottom-5 left-7 flex flex-col overflow-hidden rounded-tl-xl border border-border-hover bg-background shadow-elevated">
          <div className="flex h-10 shrink-0 items-stretch border-b border-border bg-background-100">
            <span className="flex items-center gap-2 border-r border-border bg-background px-3.5 font-mono text-[12px] text-foreground shadow-[inset_0_2px_0_var(--brand)]">
              <IconDocumentCode aria-hidden className="size-3.5 text-brand" />
              {entry.slug}.tsx
            </span>
            <span className="flex items-center px-3.5 font-mono text-[11.5px] text-text-muted">{entry.lines} lines</span>
          </div>
          <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-border px-4 font-mono text-[11px] text-text-muted">
            components
            <IconChevronRight aria-hidden className="size-3" />
            ui
            <IconChevronRight aria-hidden className="size-3" />
            <span className="text-text-secondary">{entry.slug}.tsx</span>
          </div>
          <div
            role="figure"
            aria-label={`The first className lines of components/ui/${entry.slug}.tsx`}
            className="relative flex-1 overflow-hidden py-3 font-mono text-[12px]/[1.9] text-text-tertiary"
          >
            {code === undefined ? (
              <div aria-hidden className="space-y-2.5 px-4 pt-1">
                {[70, 45, 85, 60, 75, 40].map((w, i) => (
                  <div key={i} className="h-2.5 animate-pulse rounded-full bg-surface-hover" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : code === null ? (
              <p className="px-4">Couldn&apos;t load the source. It&apos;s on the component&apos;s page.</p>
            ) : (
              excerpt(code).map(({ n, text, classes }) => (
                <div key={n} className={cn("flex whitespace-pre", classes && "bg-brand/8 shadow-[inset_2px_0_0_var(--brand)]")}>
                  <span aria-hidden className={cn("w-11 shrink-0 pr-4 text-right select-none", classes ? "text-brand" : "text-text-muted")}>
                    {n}
                  </span>
                  <span className={classes ? "text-text-secondary" : undefined}>{tint(text)}</span>
                </div>
              ))
            )}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent" />
          </div>
        </div>
      </div>
    </Cell>
  );
}

/* ─── Section ─── */

export function States({ themes, motionEntry, entries }: { themes: CatalogEntry; motionEntry: CatalogEntry; entries: CatalogEntry[] }) {
  return (
    <section aria-labelledby="states-title" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <h2 id="states-title" className="text-[clamp(2rem,3.6vw,2.875rem)] leading-[1.04] font-semibold tracking-tighter text-balance text-foreground">
          Every <span className="accent-word">state</span>, already handled.
        </h2>
        <p className="mt-4 max-w-xl text-[17px]/7 text-pretty text-text-secondary">
          Focus, loading, confirmation, reduced motion and both themes are part of each component, so the part you paste in
          is the finished part.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-[22px] border border-border bg-border bg-clip-padding lg:grid-cols-12">
          <WiringCell />
          <ThemesCell entry={themes} />
          <MotionCell entry={motionEntry} />
          <StatesCell />
          <CodeCell entries={entries} />
        </div>
      </div>
    </section>
  );
}
