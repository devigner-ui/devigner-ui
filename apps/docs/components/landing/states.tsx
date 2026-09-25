"use client";

import { useEffect, useRef, useState } from "react";
import {
  MotionConfig,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconChevronRight,
  IconDocumentCode,
} from "@devigner-ui/icons";
import { DeleteButton, type DeleteButtonStatus } from "devignerui";
import { SPRING_LAYOUT } from "devignerui/motion";
import { cn } from "cn";
import type { CatalogEntry } from "@/lib/catalog-query";
import type { BENTO } from "@/lib/catalog";
import { demos } from "../../demos";
import { MenuDockPreview } from "../../demos/menu-dock";
import { FitToStage } from "./canvas-frame";
import { useSelection } from "./selection";

type Bento = { [K in keyof typeof BENTO]: CatalogEntry };

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
    <div
      className={cn(
        "relative flex min-h-95 flex-col overflow-hidden bg-background",
        className,
      )}
    >
      <div className="relative z-10 px-7 pt-7">
        <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-foreground">
          {title}
        </h3>
        <p className="mt-1.5 max-w-sm text-[14.5px]/6 text-text-secondary">
          {text}
        </p>
      </div>
      {children}
    </div>
  );
}

/* ─── Keyboard ─── */

// A small keyboard cluster: Esc over Tab, the arrows as an inverted T, a tall Enter.
const KEYS: {
  key: string;
  label: string;
  icon?: typeof IconArrowUp;
  at: string;
}[] = [
  { key: "Escape", label: "Esc", at: "col-start-1 row-start-1" },
  { key: "Tab", label: "Tab", at: "col-start-1 row-start-2" },
  {
    key: "ArrowUp",
    label: "Up",
    icon: IconArrowUp,
    at: "col-start-3 row-start-1",
  },
  {
    key: "ArrowLeft",
    label: "Left",
    icon: IconArrowLeft,
    at: "col-start-2 row-start-2",
  },
  {
    key: "ArrowDown",
    label: "Down",
    icon: IconArrowDown,
    at: "col-start-3 row-start-2",
  },
  {
    key: "ArrowRight",
    label: "Right",
    icon: IconArrowRight,
    at: "col-start-4 row-start-2",
  },
  { key: "Enter", label: "Enter", at: "col-start-5 row-span-2 row-start-1" },
];

function KeyboardCell() {
  const [pressed, setPressed] = useState<Set<string>>(() => new Set());
  const [last, setLast] = useState<string | null>(null);
  const press = (key: string, down: boolean) => {
    if (down) setLast(key);
    setPressed((prev) => {
      if (prev.has(key) === down) return prev;
      const next = new Set(prev);
      if (down) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  return (
    <Cell
      title="Works from the keyboard"
      text="Click into the dock and put the mouse away. Every key you press lights up below."
      className="lg:col-span-7"
    >
      <div
        onKeyDownCapture={(e) => press(e.key, true)}
        onKeyUpCapture={(e) => press(e.key, false)}
        // Focus moving between the dock's own buttons isn't leaving.
        onBlurCapture={(e) =>
          !e.currentTarget.contains(e.relatedTarget as Node | null) &&
          setPressed(new Set())
        }
        className="flex flex-1 flex-col"
      >
        <Stage
          prop="event.key"
          value={last}
          lit={pressed.size > 0}
          controls={
            <div aria-hidden className="flex justify-center px-2 py-5">
              <div className="grid grid-cols-[repeat(5,auto)] gap-1.5 sm:gap-2">
                {KEYS.map(({ key, label, icon: Icon, at }) => {
                  const on = pressed.has(key);
                  return (
                    <span
                      key={key}
                      className={cn(
                        at,
                        "flex rounded-[9px] border font-mono text-[11.5px] transition-[translate,background-color,border-color,color,box-shadow] duration-150 ease-out",
                        Icon
                          ? "size-9 items-center justify-center sm:size-10"
                          : "min-h-9 w-14 items-end px-2.5 pb-1.5 sm:min-h-10 sm:w-16",
                        on
                          ? "translate-y-0.5 border-brand bg-brand/15 text-foreground shadow-[0_0_22px_-4px_var(--brand)]"
                          : "border-border-hover border-b-[3px] bg-linear-to-b from-background-200 to-background-100 text-text-tertiary shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_7%,transparent)]",
                      )}
                    >
                      {Icon ? <Icon className="size-4" /> : label}
                    </span>
                  );
                })}
              </div>
            </div>
          }
        >
          {/* Room above the dock for its menus and search panel to open into. */}
          <div className="relative h-84 w-full">
            <FitToStage align="end" className="inset-0">
              <MenuDockPreview />
            </FitToStage>
          </div>
        </Stage>
      </div>
    </Cell>
  );
}

/* ─── Themes ─── */

function ThemesCell({ entry }: { entry: CatalogEntry }) {
  const Demo = demos[entry.slug];
  const [split, setSplit] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const moveTo = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setSplit(Math.min(95, Math.max(5, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <Cell
      title="Right in both themes"
      text="Drag across it. Colors come from CSS variables, with no dark: classes in the file."
      className="lg:col-span-5"
    >
      <div ref={box} className="relative mt-6 flex-1">
        {(["light", "dark"] as const).map((scope) => (
          <div
            key={scope}
            className={cn(scope, "frame-surface absolute inset-0")}
            // Clip both halves: a full-width light layer underneath bleeds a
            // bright hairline through the dark layer's anti-aliased edges
            // whenever the cell lands on a fractional pixel.
            style={{
              clipPath:
                scope === "dark"
                  ? `inset(0 0 0 ${split}%)`
                  : `inset(0 ${100 - split}% 0 0)`,
            }}
          >
            <FitToStage align={entry.stageAlign}>
              <Demo />
            </FitToStage>
          </div>
        ))}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Light and dark divider"
          aria-valuemin={5}
          aria-valuemax={95}
          aria-valuenow={Math.round(split)}
          aria-valuetext={`${Math.round(split)}% light`}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setSplit((s) => Math.max(5, s - 5));
            if (e.key === "ArrowRight") setSplit((s) => Math.min(95, s + 5));
          }}
          className="absolute inset-y-0 z-10 flex w-10 -translate-x-1/2 cursor-ew-resize touch-none justify-center"
          style={{ left: `${split}%` }}
        >
          <span aria-hidden className="h-full w-0.5 bg-foreground" />
          <span
            aria-hidden
            className="absolute top-1/2 grid size-9 -translate-y-1/2 grid-flow-col place-items-center rounded-full bg-foreground text-background shadow-elevated"
          >
            <IconArrowLeft className="-mr-1 size-3" />
            <IconArrowRight className="-ml-1 size-3" />
          </span>
        </div>
      </div>
    </Cell>
  );
}

/* ─── Live stage ─── */

/** A square frame for one live component, a readout of the prop it's set
 *  to, and the control that changes it. */
function Stage({
  prop,
  value,
  lit,
  controls,
  children,
}: {
  prop: string;
  /** Null before anything has set it. */
  value: string | null;
  lit: boolean;
  controls: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-7 mt-6 mb-7 flex flex-1 flex-col border border-border">
      <div className="frame-surface relative flex min-h-52 flex-1 items-center justify-center px-6 pt-10 pb-6">
        <span
          aria-hidden
          className="absolute top-3 left-3.5 font-mono text-[11px] text-text-muted"
        >
          {prop}=
          <span
            className={cn(
              "transition-colors duration-200 ease-out",
              lit ? "text-brand" : "text-text-secondary",
            )}
          >
            {value === null ? "null" : `"${value}"`}
          </span>
        </span>
        {children}
      </div>
      <div className="border-t border-border bg-background-100 p-1.5">
        {controls}
      </div>
    </div>
  );
}

/* ─── Reduced motion ─── */

function MotionCell({ entry }: { entry: CatalogEntry }) {
  const Demo = demos[entry.slug];
  const [still, setStill] = useState(false);
  return (
    <Cell
      title="Still when you ask"
      text="Turn on reduced motion and the springs stop. Everything still works."
      className="lg:col-span-4"
    >
      <Stage
        prop="reducedMotion"
        value={still ? "always" : "user"}
        lit={still}
        controls={
          <button
            type="button"
            role="switch"
            aria-checked={still}
            onClick={() => setStill((v) => !v)}
            className="flex h-11 w-full items-center justify-between rounded-[10px] px-3 text-[14px] font-medium text-foreground transition-colors duration-200 ease-out outline-none hover:bg-background-200 focus-visible:ring-2 focus-visible:ring-brand"
          >
            Reduce motion
            <span
              aria-hidden
              className={cn(
                "relative h-6 w-10 rounded-full transition-colors duration-200 ease-out",
                still ? "bg-brand" : "bg-border-hover",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.75 left-0.75 size-4.5 rounded-full bg-white shadow-subtle transition-transform duration-200 ease-out",
                  still && "translate-x-4",
                )}
              />
            </span>
          </button>
        }
      >
        <MotionConfig reducedMotion={still ? "always" : "user"}>
          <Demo key={String(still)} />
        </MotionConfig>
      </Stage>
    </Cell>
  );
}

/* ─── Loading and confirm ─── */

const STATES: { status: DeleteButtonStatus; label: string }[] = [
  { status: "idle", label: "Idle" },
  { status: "armed", label: "Confirm" },
  { status: "pending", label: "Waiting" },
  { status: "done", label: "Done" },
];

function StatesCell() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [status, setStatus] = useState<DeleteButtonStatus>("idle");
  // Steps through on its own until someone uses the button or the steps.
  const [auto, setAuto] = useState(true);
  const take = (next: DeleteButtonStatus) => {
    setAuto(false);
    setStatus(next);
  };

  useEffect(() => {
    if (!auto || reduce || !inView) return;
    const i = STATES.findIndex((s) => s.status === status);
    const id = setTimeout(
      () => setStatus(STATES[(i + 1) % STATES.length].status),
      1600,
    );
    return () => clearTimeout(id);
  }, [auto, reduce, inView, status]);

  return (
    <Cell
      title="Loading and confirm"
      text="Delete Button asks first, waits for your request, then shows a tick."
      className="lg:col-span-4"
    >
      <div ref={ref} className="flex flex-1 flex-col">
        <Stage
          prop="status"
          value={status}
          lit={status !== "idle"}
          controls={
            <ol
              aria-label="Delete Button states"
              className="grid grid-cols-4 gap-1"
            >
              {STATES.map((s, i) => {
                const on = s.status === status;
                return (
                  <li key={s.status}>
                    <button
                      type="button"
                      aria-current={on ? "step" : undefined}
                      onClick={() => take(s.status)}
                      className={cn(
                        "relative flex h-11 w-full flex-col items-center justify-center rounded-[10px] text-[12.5px] font-medium transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-brand",
                        on
                          ? "text-foreground"
                          : "text-text-muted hover:text-text-secondary",
                      )}
                    >
                      {on && (
                        <motion.span
                          aria-hidden
                          layoutId="bento-step"
                          transition={SPRING_LAYOUT}
                          className="absolute inset-0 rounded-[10px] bg-background-200"
                        />
                      )}
                      <span
                        className={cn(
                          "relative font-mono text-[10px] leading-none",
                          on ? "text-brand" : "text-text-muted/70",
                        )}
                      >
                        0{i + 1}
                      </span>
                      <span className="relative mt-1 leading-none">
                        {s.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          }
        >
          <DeleteButton
            status={status}
            onStatusChange={take}
            onConfirm={() => new Promise((resolve) => setTimeout(resolve, 900))}
            // Its own reset would count as a visitor's click and stop the loop.
            resetAfter={auto ? 0 : undefined}
          />
        </Stage>
      </div>
    </Cell>
  );
}

/* ─── One file ─── */

/** Tints the string literals on lines that set classes. */
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

/** A window of the file around its first className= in JSX, the part the cell's copy
 *  is about, with real line numbers and the class lines flagged. */
function excerpt(code: string) {
  const lines = code.split("\n");
  const first = lines.findIndex((l) => l.includes("className="));
  const start = first < 0 ? 0 : Math.max(0, first - 3);
  return lines.slice(start, start + 16).map((text, i) => ({
    n: start + i + 1,
    text,
    classes: /className=|cn\(/.test(text),
  }));
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
      .then(
        (json: { files: { content: string }[] }) =>
          json.files[0]?.content ?? null,
      )
      .catch(() => null)
      .then(
        (text) => alive && setSource((s) => ({ ...s, [entry.slug]: text })),
      );
    return () => {
      alive = false;
    };
  }, [entry.slug, code]);

  return (
    <Cell
      title="One file you own"
      text="A plain .tsx file in your repo. The CLI prints the few packages it needs, and every class name is there for you to change."
      className="min-h-105 bg-background-100 lg:col-span-4"
    >
      <div className="relative mt-6 flex-1">
        {/* An editor window bleeding off the cell's corner. */}
        <div className="absolute top-0 -right-10 -bottom-5 left-7 flex flex-col overflow-hidden rounded-tl-xl border border-border-hover bg-background shadow-elevated">
          <div className="flex h-10 shrink-0 items-stretch border-b border-border bg-background-100">
            <span className="flex items-center gap-2 border-r border-border bg-background px-3.5 font-mono text-[12px] text-foreground shadow-[inset_0_2px_0_var(--brand)]">
              <IconDocumentCode aria-hidden className="size-3.5 text-brand" />
              {entry.slug}.tsx
            </span>
            <span className="flex items-center px-3.5 font-mono text-[11.5px] text-text-muted">
              {entry.lines} lines
            </span>
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
              <p className="px-4">Loading the source...</p>
            ) : code === null ? (
              <p className="px-4">
                Couldn&apos;t load the source. It&apos;s on the component&apos;s
                page.
              </p>
            ) : (
              excerpt(code).map(({ n, text, classes }) => (
                <div
                  key={n}
                  className={cn(
                    "flex whitespace-pre",
                    classes && "bg-brand/8 shadow-[inset_2px_0_0_var(--brand)]",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "w-11 shrink-0 pr-4 text-right select-none",
                      classes ? "text-brand" : "text-text-muted/60",
                    )}
                  >
                    {n}
                  </span>
                  <span className={classes ? "text-text-secondary" : undefined}>
                    {tint(text)}
                  </span>
                </div>
              ))
            )}
            {/* The file keeps going. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent"
            />
          </div>
        </div>
      </div>
    </Cell>
  );
}

/* ─── Section ─── */

export function States({
  bento,
  entries,
}: {
  bento: Bento;
  entries: CatalogEntry[];
}) {
  return (
    <section aria-labelledby="states-title" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <h2
          id="states-title"
          className="text-[clamp(2rem,3.6vw,2.875rem)] leading-[1.04] font-semibold tracking-tighter text-balance text-foreground"
        >
          Every <span className="accent-word">state</span>, already handled.
        </h2>
        <p className="mt-4 max-w-xl text-[17px]/7 text-pretty text-text-secondary">
          Focus, loading, confirmation, reduced motion and both themes are part
          of each component, so the part you paste in is the finished part.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-px border border-border bg-border bg-clip-padding lg:grid-cols-12">
          <KeyboardCell />
          <ThemesCell entry={bento.themes} />
          <MotionCell entry={bento.motion} />
          <StatesCell />
          <CodeCell entries={entries} />
        </div>
      </div>
    </section>
  );
}
