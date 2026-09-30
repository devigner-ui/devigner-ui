"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MenuDock, type MenuDockItem } from "devignerui";
import {
  EASE_IN_OUT,
  EASE_OUT,
  SPRING_LAYOUT,
  SPRING_PANEL,
  SPRING_PRESS,
  SPRING_SWAP,
} from "devignerui/motion";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook2,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCode,
  IconCopy,
  IconDashboardGrid,
  IconDownloadMinimalistic,
  IconMagicStick3,
  IconRestart,
  IconSearchNormal,
  IconSettings,
  IconShare,
  IconSpinner,
  IconVolumeCross,
  IconVolumeHigh,
} from "@devigner-ui/icons";
import { cn } from "cn";
import type { ComponentData } from "@/lib/registry";
import { SOUND_KEY, cue, play, setEnabled } from "@/lib/sound";
import { PROMPT_TARGETS, buildPrompt, openTarget } from "@/lib/prompt";
import {
  LogoBluesky,
  LogoClaude,
  LogoFacebook,
  LogoLinkedIn,
  LogoOpenAI,
  LogoReddit,
  LogoV0,
  LogoWhatsApp,
  LogoX,
} from "../brand-logos";
import {
  countLines,
  groupByCategory,
  neighbors,
  searchEntries,
  type CatalogEntry,
} from "@/lib/catalog-query";
import { CodeBlock, whenIdle } from "../code-block";
import { ProgressiveBlur } from "../landing/hero-window";
import { Wordmark } from "../landing/navbar";
import { ThemeIcon, useTheme } from "../theme-provider";
import { Inspector, type RequestCredit } from "./inspector";
import { usePlayground } from "./playgrounds";

const INSPECTOR_W = 460;
/** The dock shell's own padding either side, taken off the Settings content
 *  so the open panel comes out exactly as wide as the closed dock. */
const SETTINGS_INSET = 16;

/** Space kept between the floating Docs/code panels and the viewport edges. */
const PANEL_GAP = 12;
const DRAWER_H = 320;

function useMedia(query: string, server: boolean) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => server,
  );
}
const useIsLg = () => useMedia("(min-width: 1024px)", true);
/** Below Tailwind's `sm`: the dock folds Sound and Share into one row. */
const useIsPhone = () => useMedia("(max-width: 639.98px)", false);

/** Up and down chevrons stacked: the "more" row that opens a short menu. */
function UpDownGlyph() {
  return (
    <span className="flex flex-col items-center [&_svg]:size-3.5!">
      <IconChevronUp strokeWidth={2.5} className="-mb-1" />
      <IconChevronDown strokeWidth={2.5} className="-mt-1" />
    </span>
  );
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  !!el.closest("input, textarea, select, [contenteditable='true']");

/** The panel's key hints, one look for both: a hairline outline reads the
 *  same on the panel and inside the search field. */
const KBD =
  "grid h-5 min-w-5 place-items-center rounded-md border border-border px-1.5 font-mono text-[10.5px] leading-none text-text-muted";

/** Single-key shortcuts for the dock, by item id. Holding Alt shows each one
 *  as a keycap over its button. */
const DOCK_KEYS: Record<string, React.ReactNode> = {
  prev: <IconArrowLeft className="size-3" />,
  components: "/",
  docs: "D",
  source: "C",
  prompt: "P",
  theme: "T",
  sound: "M",
  settings: "S",
  next: <IconArrowRight className="size-3" />,
};

/* ─── Chrome ─── */

/** The floating glass pill: wordmark, then the crumb. */
function Pill({ name }: { name: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex h-12 items-center gap-3.5 rounded-full border border-border bg-background/72 px-4.5 whitespace-nowrap shadow-subtle backdrop-blur-xl"
    >
      <Link href="/" aria-label="Devigner UI home" className="rounded-md">
        <Wordmark className="text-[19px]" />
      </Link>
      <span aria-hidden className="h-4.5 w-px bg-border" />
      <span className="flex min-w-0 items-center gap-1.5 text-[13.5px] text-text-muted">
        <Link
          href="/components"
          className="max-sm:hidden transition-colors duration-200 ease-out hover:text-foreground"
        >
          Components
        </Link>
        <IconChevronRight
          aria-hidden
          className="size-3.5 text-text-muted/60 max-sm:hidden"
        />
        <span
          aria-current="page"
          className="truncate font-medium text-foreground"
        >
          {name}
        </span>
      </span>
    </nav>
  );
}

/** The stage's ground: square, stage light from the top. */
function StageGround() {
  return <div aria-hidden className="frame-surface absolute inset-0" />;
}

/** A dock icon's own active pill - the row itself only tints text on
 *  `active`, so a toggle that needs the filled background draws it here,
 *  inset to the row's full tap target rather than the icon's glyph box. */
function DockGlyph({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={SPRING_SWAP}
            className="pointer-events-none absolute inset-0 rounded-full bg-surface"
          />
        )}
      </AnimatePresence>
      <span className="relative z-10 grid place-items-center">{children}</span>
    </>
  );
}

/** The dock tooltip. `instant` skips the entrance: once one tooltip has
 *  shown, the next row's opens with no delay and no animation, so sweeping
 *  the dock reads as one tooltip following the cursor. */
type Hint = { id: string; rect: DOMRect; instant: boolean } | null;
/** Hover before the first tooltip opens, so passing over the dock on the way
 *  somewhere else never flashes one. */
const HINT_DELAY = 400;
/** How long after a tooltip closes the next one still opens instantly. */
const HINT_WARM = 300;
/** Grace before closing, long enough to cross the gap to the next row
 *  without the tooltip unmounting in between. */
const HINT_GRACE = 80;
/** Dock ids without the press/release knock. */
const QUIET_PRESS = new Set([
  "components",
  "prompt",
  "theme",
  "settings",
  "more",
]);

const MotionSpinner = motion.create(IconSpinner);

/** Whether the last details page's dock had a Settings button. Each page
 *  mounts a fresh dock, so this is how the next one knows Settings is new to
 *  it. null on a first visit, where nothing should animate in. */
let lastHadSettings: boolean | null = null;

/** The Settings glyph. Arriving from a dock without it, it pops in while the
 *  shell glides wider; its own AnimatePresence, because the dock's one runs
 *  with initial={false} and would swallow the entrance. */
function SettingsGlyph({ enter }: { enter: boolean }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={enter}>
      <motion.span
        className="grid place-items-center"
        initial={
          reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4, rotate: -90 }
        }
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={reduce ? { duration: 0.12 } : SPRING_SWAP}
      >
        <IconSettings strokeWidth={2} />
      </motion.span>
    </AnimatePresence>
  );
}

/** Prev / next glyph: one chevron. Now and then it nudges a few px the way
 *  it points, then settles: a quiet hint of where it leads, never a loop
 *  that begs for attention. */
function ArrowGlyph({
  dir,
  busy,
}: {
  dir: "Previous" | "Next";
  /** Navigation to this neighbour is under way: the chevron morphs into a
   *  spinner, the same hand-off as Delete Button's pending state. */
  busy: boolean;
}) {
  const reduce = useReducedMotion();
  const back = dir === "Previous";
  const Icon = back ? IconChevronLeft : IconChevronRight;
  const swap = reduce ? { duration: 0 } : SPRING_SWAP;
  const chevron = (
    <motion.span
      className="grid place-items-center"
      animate={reduce ? undefined : { x: [0, back ? -3 : 3, 0] }}
      transition={{
        duration: 1.4,
        ease: EASE_IN_OUT,
        repeat: Infinity,
        repeatDelay: 1.6,
      }}
    >
      <Icon strokeWidth={2.5} />
    </motion.span>
  );
  return (
    <>
      <span className="grid place-items-center">
        <motion.span
          className="col-start-1 row-start-1 flex items-center"
          initial={false}
          animate={{ opacity: busy ? 0 : 1, scale: busy && !reduce ? 0.5 : 1 }}
          transition={swap}
        >
          {chevron}
        </motion.span>
        <MotionSpinner
          aria-hidden
          strokeWidth={2}
          className="col-start-1 row-start-1"
          style={{ transformOrigin: "50% 50%" }}
          initial={false}
          animate={{ rotate: busy ? 360 : 0, opacity: busy ? 1 : 0 }}
          transition={{
            rotate: busy
              ? { duration: 0.9, ease: "linear", repeat: Infinity }
              : { duration: 0 },
            opacity: swap,
          }}
        />
      </span>
    </>
  );
}

/** Prev / next, floating at the middle of the stage's left and right edges
 *  with no surface of their own. They step aside while a panel is open. */
function SideArrow({
  dir,
  name,
  busy,
  hidden,
  onGo,
  onHint,
  onUnhint,
  ref,
}: {
  dir: "Previous" | "Next";
  name: string;
  busy: boolean;
  hidden: boolean;
  onGo: () => void;
  onHint: (el: HTMLElement) => void;
  onUnhint: (now?: boolean) => void;
  ref: React.Ref<HTMLButtonElement>;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={`${dir}: ${name}`}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
      onClick={onGo}
      onPointerEnter={(e) =>
        e.pointerType === "mouse" && onHint(e.currentTarget)
      }
      onPointerLeave={() => onUnhint()}
      onPointerDown={() => {
        play("tap");
        onUnhint(true);
      }}
      initial={false}
      animate={{
        opacity: hidden ? 0 : 1,
        scale: hidden && !reduce ? 0.85 : 1,
      }}
      whileTap={{ scale: 0.96 }}
      transition={
        reduce
          ? { duration: 0 }
          : {
              ...SPRING_PRESS,
              opacity: {
                duration: 0.16,
                ease: EASE_OUT,
                delay: hidden ? 0 : 0.22,
              },
            }
      }
      className={cn(
        "absolute top-1/2 z-20 grid size-14 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-foreground outline-none transition-colors duration-200 ease-out hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-ring [&_svg]:size-6",
        dir === "Previous" ? "left-3 sm:left-5" : "right-3 sm:right-5",
        hidden && "pointer-events-none",
      )}
    >
      <ArrowGlyph dir={dir} busy={busy} />
    </motion.button>
  );
}

/** The Components panel the dock morphs into: search, then the grouped list
 *  in the hero window's order. */
function ComponentsPanel({
  entries,
  current,
  onGo,
}: {
  entries: CatalogEntry[];
  current: string;
  onGo: () => void;
}) {
  const [query, setQuery] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const groups = groupByCategory(searchEntries(entries, query));
  const first = groups[0]?.items[0];
  /** Whether rows are hidden below the list, for the bottom blur. */
  const [more, setMore] = useState(false);
  const measure = () => {
    const box = list.current;
    if (box) setMore(box.scrollTop + box.clientHeight < box.scrollHeight - 1);
  };
  // A new query changes the list's height without a scroll event.
  useEffect(measure, [query]);

  // The dock focuses the field when it opens the panel itself; opening from
  // "/" drives the dock's path from outside, so focus is taken here too.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      input.current?.focus({ preventScroll: true });
      // Scrolled by hand: scrollIntoView would also scroll the dock's
      // clipped shell and shift the whole panel.
      const box = list.current;
      const row = box?.querySelector<HTMLElement>("[aria-current]");
      if (box && row && row.offsetTop + row.offsetHeight > box.clientHeight)
        box.scrollTop = row.offsetTop + row.offsetHeight - box.clientHeight + 8;
      measure();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // "/" jumps back to the search from anywhere in the panel (a row, the Back
  // row); typed inside the field it is just a slash.
  useEffect(() => {
    const onSlash = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.activeElement === input.current) return;
      e.preventDefault();
      input.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onSlash);
    return () => window.removeEventListener("keydown", onSlash);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const rows = Array.from(
      list.current?.querySelectorAll<HTMLElement>("a") ?? [],
    );
    if (!rows.length) return;
    e.preventDefault();
    const at = rows.indexOf(document.activeElement as HTMLElement);
    const to =
      e.key === "ArrowDown"
        ? (at + 1) % rows.length
        : at <= 0
          ? rows.length - 1
          : at - 1;
    rows[to]?.focus({ preventScroll: true });
  };

  return (
    <div
      className="relative flex w-72 flex-col px-1 pb-1"
      onKeyDown={onKeyDown}
    >
      <kbd
        aria-hidden
        className={cn(KBD, "pointer-events-none absolute -top-8.5 right-3")}
      >
        esc
      </kbd>

      {/* Below the list, not in it: always in reach, and the arrow keys keep
          walking components only. A search that found nothing carries over. */}
      <Link
        href={
          groups.length === 0 && query.trim()
            ? `/requests?new&name=${encodeURIComponent(query.trim())}`
            : "/requests?new"
        }
        onClick={onGo}
        className="group mb-1 flex h-10 items-center gap-2 px-3 text-[13px] text-text-secondary transition-colors duration-200 ease-out hover:text-foreground"
      >
        {groups.length === 0 && query.trim() ? (
          <span className="truncate">Request &ldquo;{query.trim()}&rdquo;</span>
        ) : (
          "Request a component"
        )}
        <IconArrowRight
          aria-hidden
          className="ml-auto size-3.5 shrink-0 text-brand transition-transform duration-200 ease-out group-hover:translate-x-0.5"
        />
      </Link>
      <label className="flex h-10 items-center gap-2.5 rounded-xl bg-surface px-3 text-[13.5px] text-text-muted transition-colors duration-200 ease-out focus-within:bg-surface-hover">
        <IconSearchNormal aria-hidden className="size-4 shrink-0" />
        <input
          ref={input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && first) {
              e.preventDefault();
              onGo();
              router.push(`/components/${first.slug}`);
            }
          }}
          placeholder="Search components"
          aria-label="Search components"
          className="min-w-0 flex-1 bg-transparent text-foreground outline-none! placeholder:text-text-muted"
        />
        <kbd aria-hidden className={KBD}>
          /
        </kbd>
      </label>
      <div className="relative mt-1">
        <div
          ref={list}
          onScroll={measure}
          onPointerLeave={() => setHovered(null)}
          // Only the list scrolls; the search above it stays put. Capped by the
          // viewport too, so the panel never grows up under the top pill.
          className="relative max-h-[clamp(8rem,calc(100dvh-13rem),400px)] overflow-y-auto overscroll-contain"
        >
          {groups.map((g) => (
            <div key={g.label} role="group" aria-label={g.label}>
              <p className="mx-3 mt-4 mb-1.5 flex items-baseline justify-between text-[11.5px] font-medium text-text-muted">
                <span>{g.label}</span>
                <span className="font-mono text-[10.5px] font-normal tabular-nums">
                  {g.items.length}
                </span>
              </p>
              {g.items.map((e) => {
                const on = e.slug === current;
                return (
                  <Link
                    key={e.slug}
                    href={`/components/${e.slug}`}
                    onClick={onGo}
                    onPointerEnter={() => setHovered(e.slug)}
                    onFocus={() => setHovered(e.slug)}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "relative flex h-9 items-center gap-3 rounded-xl pr-2 text-[13.5px] whitespace-nowrap outline-none! transition-colors duration-200 ease-out",
                      // The current row's label clears its brand bar.
                      on
                        ? "bg-surface-hover pl-5 font-medium text-foreground"
                        : "pl-3 text-text-secondary hover:text-foreground focus-visible:text-foreground",
                    )}
                  >
                    {/* One highlight that glides between rows instead of each
                      row lighting up on its own. */}
                    {hovered === e.slug && !on && (
                      <motion.span
                        layoutId="components-panel-hover"
                        transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                        className="absolute inset-0 rounded-xl bg-surface"
                      />
                    )}
                    {/* The current row carries a short brand bar on its edge,
                      a nod to the ruler-tick sidebar this panel replaced. */}
                    {on && (
                      <span
                        aria-hidden
                        className="absolute top-1/2 left-1.5 h-4 w-0.75 -translate-y-1/2 rounded-full bg-brand shadow-[0_0_8px_var(--brand)]"
                      />
                    )}
                    <span className="relative truncate">{e.name}</span>
                    {e.isNew && (
                      <span className="relative ml-auto rounded-full bg-brand/12 px-1.75 text-[10.5px] font-medium text-brand leading-loose">
                        New
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
          {groups.length === 0 && (
            <p className="px-3 py-6 text-center text-[13px] text-text-muted">
              Nothing matches &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
        {/* Blur the rows sliding under the bottom edge, only while there are
          rows past it. Bottom only: the search field above already ends the
          list cleanly. It bleeds out to the dock's own edges (its padding plus
          the panel's, 12px) so no sharp band of unblurred rows shows at the
          sides or underneath; the shell's rounded clip trims it. */}
        <ProgressiveBlur
          className={cn(
            "pointer-events-none absolute -inset-x-3 -bottom-3 h-13 transition-opacity duration-200 ease-out",
            !more && "opacity-0",
          )}
        />
      </div>
    </div>
  );
}

/** The Code drawer's header: file, line count, Copy, Download. */
function DrawerHeader({ code, fileName }: { code: string; fileName: string }) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      cue("success");
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable - the code is still selectable */
    }
  };
  const download = () => {
    cue("success");
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-border pr-3 pl-4.5 font-mono text-[12.5px]">
      <span className="truncate font-medium text-foreground">{fileName}</span>
      <span className="text-text-muted">{countLines(code)} lines</span>
      <span className="flex-1" />
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 font-sans text-[12.5px] font-medium text-text-secondary transition-colors duration-200 ease-out hover:border-border-hover hover:text-foreground"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? "done" : "copy"}
            initial={reduce ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduce ? undefined : { scale: 0.5, opacity: 0 }}
            transition={SPRING_SWAP}
            className="grid place-items-center"
          >
            {copied ? (
              <IconCheck aria-hidden className="size-3.5 text-success" />
            ) : (
              <IconCopy aria-hidden className="size-3.5" />
            )}
          </motion.span>
        </AnimatePresence>
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={download}
        aria-label="Download file"
        className="grid size-8 cursor-pointer place-items-center rounded-full border border-border text-text-secondary transition-colors duration-200 ease-out hover:border-border-hover hover:text-foreground"
      >
        <IconDownloadMinimalistic aria-hidden className="size-3.5" />
      </button>
    </div>
  );
}

/** `inline code` inside a prompt line, as mono chips. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text
        .replace(/\*\*/g, "")
        .split(/`([^`]+)`/)
        .map((part, i) =>
          i % 2 ? (
            <code
              key={i}
              className="rounded-[5px] bg-foreground/[0.06] px-1 py-px font-mono text-[10.5px] text-foreground"
            >
              {part}
            </code>
          ) : (
            part
          ),
        )}
    </>
  );
}

/** The sheet's colour, shared by its sticky headings and the frost at its
 *  foot so both melt into it. */
const SHEET_BG = "bg-surface dark:bg-surface-hover";
const SHEET_FROM = "from-surface dark:from-surface-hover";

/** The prompt drawn as a page instead of raw markdown: steps as pinned
 *  numbered headings, props as rows, defaults in brand, commands as code. */
function PromptPreview({ prompt, props }: { prompt: string; props: number }) {
  const out: React.ReactNode[] = [];
  const lines = prompt.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.startsWith("```")) {
      const shell = line === "```sh";
      const code: string[] = [];
      while (++i < lines.length && !lines[i].startsWith("```"))
        code.push(lines[i]);
      out.push(
        <pre
          key={i}
          className="no-scrollbar my-1.5 overflow-x-auto rounded-[9px] bg-foreground px-2.75 py-2.25 font-mono text-[10.5px]/[1.65] text-background/85 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] dark:bg-background dark:text-text-secondary"
        >
          {code.map((l, j) => {
            const [cmd, note] = shell ? l.split(/\s+(?=#)/) : [l];
            return (
              <span key={j} className="block">
                {shell && <span className="opacity-50">$ </span>}
                {cmd}
                {note && <span className="opacity-50"> {note}</span>}
              </span>
            );
          })}
        </pre>,
      );
      continue;
    }
    const step = line.match(/^## Step (\d+): (.*)/);
    if (step) {
      out.push(
        <h4
          key={i}
          className={cn(
            "sticky -top-3.5 z-10 -mx-4.5 mt-3.5 mb-0.5 flex items-center gap-2 bg-linear-to-b via-75% to-transparent px-4.5 pt-3 pb-2 text-[12px] font-medium text-foreground",
            SHEET_FROM,
            "via-surface dark:via-surface-hover",
          )}
        >
          <span className="grid size-4.25 place-items-center rounded-full bg-foreground font-mono text-[9.5px] text-background">
            {step[1]}
          </span>
          {step[2]}
          {step[1] === "2" && (
            <span className="ml-auto font-mono text-[10px] font-normal text-text-muted">
              {props}
            </span>
          )}
        </h4>,
      );
      continue;
    }
    if (line.startsWith("### ")) {
      // A prop: its name, then description, default and options lines.
      const name = line.slice(4).replace(/`/g, "");
      const desc = lines[i + 1] ?? "";
      const def = (lines[i + 2] ?? "")
        .match(/Default: `?([^`*(]+)/)?.[1]
        ?.trim();
      const opts = (lines[i + 3] ?? "")
        .replace(/^- Other options: /, "")
        .replace(/`/g, "");
      i += 3;
      out.push(
        <div
          key={i}
          className="border-t border-dashed border-foreground/10 py-1.75"
        >
          <div className="flex items-baseline gap-2">
            <code className="font-mono text-[11px] font-medium text-foreground">
              {name}
            </code>
            <span className="rounded-full bg-brand/12 px-1.75 font-mono text-[10px] font-medium whitespace-nowrap text-brand">
              {def && !def.startsWith("none") ? def : "none"}
            </span>
            <span className="ml-auto truncate pl-2 text-right font-mono text-[10px] text-text-muted">
              {opts}
            </span>
          </div>
          <p className="mt-0.5 text-[10.5px]/snug text-text-muted">{desc}</p>
        </div>,
      );
      continue;
    }
    const word = line.match(/^- "(.+?)" (.*)/);
    if (word) {
      out.push(
        <p key={i} className="mt-1 flex items-baseline gap-2">
          <kbd className="rounded-md border border-foreground/10 bg-foreground/[0.04] px-1.5 font-mono text-[10px] text-text-secondary">
            {word[1]}
          </kbd>
          <span className="text-text-muted">{word[2]}</span>
        </p>,
      );
      continue;
    }
    if (line.startsWith("- ")) {
      out.push(
        <p key={i} className="relative mt-0.5 pl-3 text-pretty">
          <span
            aria-hidden
            className="absolute top-[0.6em] left-0.5 size-1 rounded-full bg-text-muted/60"
          />
          <Inline text={line.slice(2)} />
        </p>,
      );
      continue;
    }
    out.push(
      <p
        key={i}
        className={cn(
          "mt-1.5 text-pretty",
          i === 0 && "text-text-muted",
          line.endsWith(":") && "mt-2.5 font-medium text-foreground",
        )}
      >
        <Inline text={line} />
      </p>,
    );
  }
  return <>{out}</>;
}

/** A pill link on the Prompt and Share panels. */
const CHIP =
  "flex h-10 items-center justify-center gap-2 rounded-full bg-background-100 text-[12.5px] font-medium whitespace-nowrap text-text-secondary shadow-[0_1px_2px_rgb(0_0_0/0.06),0_0_0_1px_rgb(0_0_0/0.04)] transition-[color,background-color,box-shadow] duration-200 ease-out hover:text-foreground hover:shadow-[0_2px_6px_-1px_rgb(0_0_0/0.1),0_0_0_1px_rgb(0_0_0/0.07)] dark:bg-surface dark:shadow-[0_0_0_1px_transparent] dark:hover:bg-surface-hover dark:hover:shadow-[0_0_0_1px_var(--border)]";

/** A "── label ──" rule whose lines fade out toward the edges. */
function FadeRule({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1 flex items-center gap-3 px-2">
      <span
        aria-hidden
        className="h-px flex-1 bg-linear-to-r from-transparent to-border"
      />
      <span className="text-[11px] text-text-muted">{children}</span>
      <span
        aria-hidden
        className="h-px flex-1 bg-linear-to-l from-transparent to-border"
      />
    </div>
  );
}

const TARGET_LOGOS: Record<
  (typeof PROMPT_TARGETS)[number]["name"],
  (p: { className?: string }) => React.ReactNode
> = { Claude: LogoClaude, Codex: LogoOpenAI, v0: LogoV0 };

/** The Prompt panel: the prompt as a page resting on a small stack, Copy
 *  floating over its frosted foot, then the chat apps that open with it
 *  already typed in. */
function PromptPanel({
  prompt,
  props,
  name,
  slug,
}: {
  prompt: string;
  props: number;
  name: string;
  slug: string;
}) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      cue("success");
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable - the Open in links still carry it */
    }
  };

  return (
    <div className="relative flex w-84 max-w-full flex-col gap-2.5 px-1 pb-1">
      <kbd
        aria-hidden
        className={cn(KBD, "pointer-events-none absolute -top-8 right-3")}
      >
        esc
      </kbd>

      <p className="px-2 text-[12.5px]/relaxed text-pretty text-text-muted">
        Paste it into your AI. It installs {name}, asks about its{" "}
        <span className="text-text-secondary">{props} props</span>, then writes
        the code.
      </p>

      {/* The stack: two sheets peeking out under the page, each a little
          narrower. At rest the page leans back; hovered it stands up and
          the sheets drop a touch further out. */}
      <div className="group/stack relative mt-0.5 mb-1.5 h-73 perspective-[900px]">
        <div
          aria-hidden
          className="absolute inset-x-6 top-4 bottom-0 rounded-2xl bg-surface-hover shadow-[0_1px_2px_rgb(0_0_0/0.05),0_6px_14px_-6px_rgb(0_0_0/0.12)] dark:shadow-[0_1px_2px_rgb(0_0_0/0.3),0_6px_14px_-6px_rgb(0_0_0/0.5)] transition-transform duration-700 ease-out group-hover/stack:translate-y-1 dark:bg-background-100"
        />
        <div
          aria-hidden
          className="absolute inset-x-3.5 top-2 bottom-1.5 rounded-2xl bg-background-200 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_6px_14px_-6px_rgb(0_0_0/0.12)] dark:shadow-[0_1px_2px_rgb(0_0_0/0.3),0_6px_14px_-6px_rgb(0_0_0/0.5)] transition-transform duration-700 ease-out group-hover/stack:translate-y-0.5"
        />
        {/* Copying lifts the page once, like it was just picked up. */}
        <motion.div
          className="absolute inset-x-1.5 top-0 bottom-3"
          animate={{ y: copied && !reduce ? [0, -10, 0] : 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          {/* The drop shadow lives out here: the page below clips itself
              (for the blur), which would clip its own shadow too. */}
          <div className="h-full origin-bottom rotate-x-5 rounded-2xl shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_28px_-12px_rgb(0_0_0/0.22)] transition-transform duration-700 ease-out group-hover/stack:-translate-y-0.5 group-hover/stack:rotate-x-0 dark:shadow-[0_1px_2px_rgb(0_0_0/0.35),0_14px_32px_-12px_rgb(0_0_0/0.7)]">
            <div
              className={cn(
                "relative isolate h-full overflow-hidden rounded-2xl text-text-secondary shadow-[inset_0_1px_0_white] [clip-path:inset(0_round_var(--radius-2xl))] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]",
                SHEET_BG,
              )}
            >
              <div
                aria-label="Prompt preview"
                tabIndex={0}
                // isolate: keeps the sticky step headings' z-10 inside the
                // scroller, so the blur and Copy below still paint over them.
                className="isolate h-full overflow-y-auto no-scrollbar overscroll-contain px-4.5 pt-3.5 pb-24 text-[11.5px]/[1.6] outline-none!"
              >
                <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.06em] text-text-muted uppercase">
                  <span>
                    prompt.md &middot; {(prompt.length / 1000).toFixed(1)}k
                    chars
                  </span>
                  <motion.span
                    animate={{ scale: copied && !reduce ? 1.08 : 1 }}
                    transition={SPRING_SWAP}
                    className={cn(
                      "-rotate-4 rounded-md border px-1.5 transition-colors duration-200 ease-out",
                      copied
                        ? "border-success/45 text-success"
                        : "border-brand/40 text-brand",
                    )}
                  >
                    {copied ? "copied" : slug}
                  </motion.span>
                </div>
                <p className="mt-3 mb-1 text-base/tight font-semibold tracking-tight text-foreground">
                  Add {name} to my app
                </p>
                <PromptPreview prompt={prompt} props={props} />
              </div>

              {/* The page's foot dissolves under Copy: the hero window's
                progressive blur, with a thin frost of the sheet's own
                colour so it reads as glass the text sits behind. */}
              <ProgressiveBlur className="pointer-events-none absolute inset-x-0 bottom-0 h-30" />
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 h-30 bg-linear-to-t to-transparent opacity-60",
                  SHEET_FROM,
                )}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-3">
                <button
                  type="button"
                  onClick={copy}
                  className="pointer-events-auto flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-foreground text-[13px] font-medium text-background shadow-[inset_0_1px_0_rgb(255_255_255/0.15),0_8px_20px_-8px_rgb(0_0_0/0.35),0_1px_3px_rgb(0_0_0/0.12)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.15),0_10px_24px_-8px_rgb(0_0_0/0.55),0_2px_6px_rgb(0_0_0/0.2)] transition-transform duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.98]"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={copied ? "done" : "copy"}
                      initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={reduce ? undefined : { scale: 0.5, opacity: 0 }}
                      transition={SPRING_SWAP}
                      className="grid place-items-center"
                    >
                      {copied ? (
                        <IconCheck aria-hidden className="size-4" />
                      ) : (
                        <IconCopy aria-hidden className="size-4" />
                      )}
                    </motion.span>
                  </AnimatePresence>
                  {copied ? "Copied to clipboard" : "Copy prompt"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <FadeRule>or send it straight to</FadeRule>
      <div className="grid grid-cols-3 gap-1.5">
        {PROMPT_TARGETS.map((t) => (
          <a
            key={t.name}
            href={t.url(prompt)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              // Left clicks try the desktop app first; a modifier click or
              // middle click still follows the plain web link.
              if (e.metaKey || e.ctrlKey || e.shiftKey) return;
              e.preventDefault();
              cue("success");
              openTarget(t, prompt);
            }}
            aria-label={`Open in ${t.name}`}
            className={CHIP}
          >
            {/* v0's mark is its name, so it stands alone and a little larger. */}
            {t.name === "v0" ? (
              <LogoV0 className="h-4.5 w-6 text-foreground" />
            ) : (
              <>
                {TARGET_LOGOS[t.name]({
                  className: "size-4 shrink-0 text-foreground",
                })}
                {t.name}
              </>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

/** Where a component page can be posted. Each builds the platform's own
 *  share link from the page URL and a line of text. */
const q = encodeURIComponent;

const SHARE_TARGETS = [
  {
    name: "X",
    Logo: LogoX,
    url: (u: string, t: string) =>
      `https://x.com/intent/post?text=${q(t)}&url=${q(u)}`,
  },
  {
    name: "LinkedIn",
    Logo: LogoLinkedIn,
    url: (u: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${q(u)}`,
  },
  {
    name: "Reddit",
    Logo: LogoReddit,
    url: (u: string, t: string) =>
      `https://www.reddit.com/submit?url=${q(u)}&title=${q(t)}`,
  },
  {
    name: "Bluesky",
    Logo: LogoBluesky,
    url: (u: string, t: string) =>
      `https://bsky.app/intent/compose?text=${q(`${t} ${u}`)}`,
  },
  {
    name: "Facebook",
    Logo: LogoFacebook,
    url: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${q(u)}`,
  },
  {
    name: "WhatsApp",
    Logo: LogoWhatsApp,
    url: (u: string, t: string) => `https://wa.me/?text=${q(`${t} ${u}`)}`,
  },
] as const;

/** The Share panel: the page's link to the usual places, and a copy row. */
function SharePanel({ name, slug }: { name: string; slug: string }) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  // The panel only renders once the dock opens it, so window is there.
  const url =
    typeof window === "undefined"
      ? `/components/${slug}`
      : `${window.location.origin}/components/${slug}`;
  const text = `${name}, a React component from Devigner UI`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      cue("success");
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable - the link is on screen to copy by hand */
    }
  };

  return (
    <div className="flex w-84 max-w-full flex-col gap-2.5 px-1 pb-1">
      <p className="px-2 text-[12.5px]/relaxed text-pretty text-text-muted">
        Send {name} to someone who&apos;d build with it.
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {SHARE_TARGETS.map((t) => (
          <a
            key={t.name}
            href={t.url(url, text)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => cue("success")}
            aria-label={`Share on ${t.name}`}
            className={CHIP}
          >
            <t.Logo className="size-3.5 shrink-0 text-foreground" />
            {t.name}
          </a>
        ))}
      </div>
      <FadeRule>or copy the link</FadeRule>
      <button
        type="button"
        onClick={copy}
        className={cn(CHIP, "justify-between gap-3 pr-2 pl-4")}
      >
        <span className="truncate font-mono text-[11.5px] font-normal text-text-muted">
          {url.replace(/^https?:\/\//, "")}
        </span>
        <span className="flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3 text-[12px] text-background">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={copied ? "done" : "copy"}
              initial={reduce ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduce ? undefined : { scale: 0.5, opacity: 0 }}
              transition={SPRING_SWAP}
              className="grid place-items-center"
            >
              {copied ? (
                <IconCheck aria-hidden className="size-3.5" />
              ) : (
                <IconCopy aria-hidden className="size-3.5" />
              )}
            </motion.span>
          </AnimatePresence>
          {copied ? "Copied" : "Copy"}
        </span>
      </button>
    </div>
  );
}

/** The keycaps over the dock while Alt is held. Its own component so holding
 *  Alt re-renders these chips, not the whole page (measured: at 4x CPU the
 *  page re-render cost ~250ms of long tasks per press). */
function DockKeycaps({
  ids,
  rows,
  open,
}: {
  ids: string[];
  rows: () => HTMLElement[];
  open: boolean;
}) {
  const reduce = useReducedMotion();
  /** The closed dock's button rects while Alt is held. */
  const [rects, setRects] = useState<DOMRect[] | null>(null);
  const live = useRef({ rows, open });
  live.current = { rows, open };

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      // ctrlKey too: AltGr arrives as Ctrl+Alt and is just typing.
      if (e.key !== "Alt" || e.ctrlKey || e.repeat || live.current.open) return;
      setRects(live.current.rows().map((r) => r.getBoundingClientRect()));
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key !== "Alt") return;
      // Stops Firefox and Windows from focusing the browser's menu bar.
      e.preventDefault();
      setRects(null);
    };
    const hide = () => setRects(null);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", hide);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", hide);
    };
  }, []);

  return (
    <AnimatePresence>
      {rects &&
        !open &&
        ids.map((id, i) => {
          const rect = rects[i];
          const key = DOCK_KEYS[id];
          if (!rect || !key) return null;
          return (
            <motion.kbd
              key={id}
              aria-hidden
              // A short throw and a tight stagger: these are a glance while a
              // key is held, so they land almost at once.
              initial={{ opacity: 0, y: 2, scale: reduce ? 1 : 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 2, scale: reduce ? 1 : 0.85 }}
              transition={
                reduce
                  ? { duration: 0.08 }
                  : { ...SPRING_PRESS, delay: i * 0.008 }
              }
              style={{ left: rect.left + rect.width / 2, top: rect.top - 14 }}
              className={cn(
                KBD,
                "pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full bg-background text-foreground shadow-subtle",
              )}
            >
              {key}
            </motion.kbd>
          );
        })}
    </AnimatePresence>
  );
}

/* ─── Page ─── */

export function ComponentPage({
  meta,
  entries,
  request,
}: {
  meta: ComponentData;
  entries: CatalogEntry[];
  /** The community request this component was built for, if any. */
  request?: RequestCredit | null;
}) {
  const slug = meta.slug;
  const router = useRouter();
  const reduce = useReducedMotion();
  const isLg = useIsLg();
  const isPhone = useIsPhone();
  const { theme, toggleTheme } = useTheme();

  const [docsOpen, setDocsOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  // The code drawer's contents are built while the page is idle and kept,
  // closed and clipped to nothing: a whole file of highlighted code is
  // thousands of nodes, and building them on the click held the drawer back.
  const [sourceBuilt, setSourceBuilt] = useState(false);
  useEffect(() => whenIdle(() => setSourceBuilt(true)), []);
  const [previewKey, setPreviewKey] = useState(0);
  const [resetSpins, setResetSpins] = useState(0);
  const [path, setPath] = useState<number[]>([]);
  const [hint, setHint] = useState<Hint>(null);
  // On unless the visitor turned it off. Read after mount: the server has no
  // storage, and a mismatch would flash the wrong icon anyway.
  const [sound, setSound] = useState(true);
  useEffect(() => {
    let on = true;
    try {
      on = localStorage.getItem(SOUND_KEY) !== "off";
    } catch {}
    setSound(on);
    setEnabled(on);
    return () => setEnabled(false);
  }, []);
  const toggleSound = () => {
    const on = !sound;
    setSound(on);
    setEnabled(on);
    try {
      localStorage.setItem(SOUND_KEY, on ? "on" : "off");
    } catch {}
    // Turning it on answers with the sound it just allowed.
    if (on) cue("toggleOn");
  };
  // A panel growing out of the dock swells in; folding back falls away.
  const panelOpen = path.length > 0;
  const panelSeen = useRef(panelOpen);
  useEffect(() => {
    if (panelSeen.current === panelOpen) return;
    panelSeen.current = panelOpen;
    cue(panelOpen ? "open" : "close");
  }, [panelOpen]);
  // ponytail: never reset by hand - the page is keyed by slug, so arriving
  // at the neighbour remounts it with this back at null.
  const [going, setGoing] = useState<"Previous" | "Next" | null>(null);
  const dock = useRef<HTMLDivElement>(null);
  /** The dock's bar along the stage's bottom. */
  const bar = useRef<HTMLDivElement>(null);
  const prevArrow = useRef<HTMLButtonElement>(null);
  const nextArrow = useRef<HTMLButtonElement>(null);
  // One timer for both the open delay and the close grace: entering a row
  // cancels a pending close, leaving one cancels a pending open.
  const hintTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Until when the next tooltip opens instantly. Infinity while one is showing.
  const hintWarm = useRef(0);
  const showHint = (id: string, el: HTMLElement) => {
    clearTimeout(hintTimer.current);
    const instant = performance.now() < hintWarm.current;
    const open = () => {
      hintWarm.current = Infinity;
      setHint({ id, rect: el.getBoundingClientRect(), instant });
      // Only the first of a sweep: the instant ones would chatter.
      if (!instant) play("swoosh");
    };
    if (instant) open();
    else hintTimer.current = setTimeout(open, HINT_DELAY);
  };
  // `now` is a press: close at once and go cold, so the tooltip does not
  // pop straight back over the row that was just used.
  const hideHint = (now = false) => {
    clearTimeout(hintTimer.current);
    const close = () => {
      if (hintWarm.current === Infinity)
        hintWarm.current = now ? 0 : performance.now() + HINT_WARM;
      setHint(null);
    };
    if (now) close();
    else hintTimer.current = setTimeout(close, HINT_GRACE);
  };
  const dockRows = () =>
    Array.from(
      dock.current?.querySelectorAll<HTMLElement>("[data-dock-row]") ?? [],
    );
  // The closed dock's width, so Settings opens exactly as wide as the dock
  // it grows out of. Only read while closed: open, the dock is the panel.
  const [dockWidth, setDockWidth] = useState<number>();
  useEffect(() => {
    const el = dock.current?.firstElementChild as
      | HTMLElement
      | null
      | undefined;
    if (!el || panelOpen) return;
    const ro = new ResizeObserver(() => setDockWidth(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [panelOpen]);

  const playground = usePlayground(slug, meta.usage);
  const [settingsIsNew] = useState(() => lastHadSettings === false);
  const hasSettings = !!playground.settings;
  useEffect(() => {
    lastHadSettings = hasSettings;
  }, [hasSettings]);
  const prompt = useMemo(() => buildPrompt(meta), [meta]);
  const entry = entries.find((e) => e.slug === slug);
  const order = useMemo(
    () => groupByCategory(entries).flatMap((g) => g.items),
    [entries],
  );
  const { prev, next } = neighbors(order, slug);

  const go = (dir: "Previous" | "Next") => {
    if (live.current.going) return;
    hideHint(true);
    setGoing(dir);
    const to = dir === "Previous" ? prev : next;
    router.push(`/components/${to.slug}`);
  };

  const reset = () => {
    cue("notification");
    setResetSpins((n) => n + 1);
    setPreviewKey((k) => k + 1);
    playground.reset();
  };

  // The hairline before Theme, parting page tools from site ones.
  const sep = (
    <span
      aria-hidden
      className="dock-sep pointer-events-none absolute top-1/2 left-[-6.5px] h-5 w-px -translate-y-1/2 bg-border"
    />
  );
  const themeItem: MenuDockItem = {
    id: "theme",
    label: "Toggle theme",
    icon: (
      <>
        {sep}
        <span
          className="group grid place-items-center"
          data-dark={theme === "dark"}
        >
          <ThemeIcon />
        </span>
      </>
    ),
    onSelect: () => {
      cue("toggleOn");
      // The dock's own button, so the "T" shortcut ripples from it too.
      const rect = path.length
        ? undefined
        : dockRows()[
            items.findIndex((i) => i.id === "theme")
          ]?.getBoundingClientRect();
      toggleTheme(
        rect && {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        },
      );
    },
  };
  // Sound and Share: in the dock on wider screens, one level down behind a
  // single row at the end on a phone.
  const utility: MenuDockItem[] = [
    {
      id: "sound",
      label: sound ? "Mute sounds" : "Turn sounds on",
      icon: (
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={sound ? "on" : "off"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.55 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.55 }}
            transition={reduce ? { duration: 0.12 } : SPRING_SWAP}
            className="grid place-items-center"
          >
            {sound ? (
              <IconVolumeHigh strokeWidth={2} />
            ) : (
              <IconVolumeCross strokeWidth={2} />
            )}
          </motion.span>
        </AnimatePresence>
      ),
      onSelect: toggleSound,
    },
    {
      id: "share",
      label: "Share",
      icon: <IconShare strokeWidth={2} />,
      content: <SharePanel name={meta.name} slug={slug} />,
    },
  ];

  const items: MenuDockItem[] = [
    {
      id: "components",
      label: "Components",
      showLabel: isLg,
      icon: <IconDashboardGrid strokeWidth={2} />,
      content: (
        <ComponentsPanel
          entries={entries}
          current={slug}
          onGo={() => setPath([])}
        />
      ),
    },
    {
      id: "docs",
      label: "Docs",
      showLabel: isLg,
      icon: (
        <DockGlyph active={docsOpen}>
          <IconBook2 strokeWidth={2} />
        </DockGlyph>
      ),
      onSelect: () => {
        setDocsOpen((v) => !v);
      },
    },
    {
      id: "source",
      label: "Code",
      showLabel: isLg,
      icon: (
        <DockGlyph active={sourceOpen}>
          <IconCode strokeWidth={2} />
        </DockGlyph>
      ),
      onSelect: () => {
        setSourceOpen((v) => !v);
      },
    },
    {
      id: "prompt",
      label: "Prompt",
      icon: <IconMagicStick3 strokeWidth={2} />,
      content: (
        <PromptPanel
          prompt={prompt}
          props={meta.props.length}
          name={meta.name}
          slug={slug}
        />
      ),
    },
    themeItem,
    ...(isPhone ? [] : utility),
    ...(playground.settings
      ? [
          {
            id: "settings",
            label: "Settings",
            icon: <SettingsGlyph enter={settingsIsNew} />,
            content: (
              <div
                style={{
                  width:
                    playground.wide && dockWidth
                      ? dockWidth - SETTINGS_INSET
                      : undefined,
                }}
                // A container, so the rows inside go two across only when
                // the panel is as wide as the full dock.
                className="@container flex w-72 max-w-full flex-col"
              >
                {/* Capped like the Components list: only the knobs scroll,
                    Reset stays in reach below them. */}
                <div className="code-scroll max-h-[clamp(8rem,calc(100dvh-13rem),400px)] overflow-y-auto overscroll-contain">
                  {playground.settings}
                </div>
                <div className="fade-border mt-1 border-t px-3 pt-3">
                  <button
                    type="button"
                    onClick={reset}
                    className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-surface text-[13px] font-medium text-foreground transition-colors duration-200 ease-out hover:bg-surface/70"
                  >
                    <motion.span
                      key={resetSpins}
                      className="inline-flex"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: reduce ? 0 : 360 }}
                      transition={{ duration: 1, ease: EASE_OUT }}
                    >
                      <IconRestart strokeWidth={2} className="size-4" />
                    </motion.span>
                    Reset
                    <kbd className={cn(KBD, "ml-1")}>R</kbd>
                  </button>
                </div>
              </div>
            ),
          },
        ]
      : []),
    ...(isPhone
      ? [
          {
            id: "more",
            label: "More",
            icon: <UpDownGlyph />,
            items: utility,
          },
        ]
      : []),
  ];
  // Every action by id, wherever it sits (on a phone some are one level down),
  // for the letter shortcuts.
  const actions = items.flatMap((i) => [i, ...(i.items ?? [])]);
  // Read by the key listener without rebinding it on every render.
  const live = useRef({
    path,
    docsOpen,
    going,
    go,
    items,
    actions,
    reset,
    hasSettings,
  });
  live.current = {
    path,
    docsOpen,
    going,
    go,
    items,
    actions,
    reset,
    hasSettings,
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const { path, docsOpen, items, actions, reset, hasSettings } =
        live.current;
      const typing = isTyping(e.target);

      if (e.key === "/" && !typing) {
        e.preventDefault();
        setPath([items.findIndex((i) => i.id === "components")]);
        return;
      }
      // Reset lives in the Settings panel, but its key works from anywhere.
      if (
        e.key.toUpperCase() === "R" &&
        hasSettings &&
        !typing &&
        !e.defaultPrevented
      ) {
        e.preventDefault();
        reset();
        return;
      }
      const id = Object.keys(DOCK_KEYS).find(
        (k) => DOCK_KEYS[k] === e.key.toUpperCase(),
      );
      if (id && id !== "components" && !typing && !e.defaultPrevented) {
        const action = actions.find((i) => i.id === id);
        if (!action) return;
        e.preventDefault();
        if (action.content) setPath([items.indexOf(action)]);
        else action.onSelect?.();
        return;
      }
      if (e.key === "Escape" && !typing) {
        if (path.length) setPath([]);
        else if (docsOpen) setDocsOpen(false);
      }
    };
    // ←/→ change component whenever nothing else owns them: nothing focused,
    // or focus left on the dock or an arrow (closing a panel hands it back to
    // the dock). Captured before the dock sees them, so they never walk its
    // rows and light a focus ring. The live component, sliders and tabs keep
    // their arrows.
    const onArrow = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const { path, go } = live.current;
      const at = document.activeElement;
      const free =
        !at ||
        at === document.body ||
        !!bar.current?.contains(at) ||
        at === prevArrow.current ||
        at === nextArrow.current;
      if (path.length || !free) return;
      e.preventDefault();
      e.stopPropagation();
      go(e.key === "ArrowLeft" ? "Previous" : "Next");
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keydown", onArrow, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keydown", onArrow, true);
    };
  }, [router]);

  const panel = reduce ? { duration: 0 } : SPRING_PANEL;
  // Prev / next sit outside the dock, so they aren't items; their tooltip
  // builds its own label below.
  const hintItem =
    hint &&
    (hint.id === "prev" || hint.id === "next"
      ? { label: "" }
      : items.find((i) => i.id === hint.id));
  const hintAway = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 };
  const layout = reduce ? { duration: 0 } : SPRING_LAYOUT;

  const inspector = (
    <Inspector
      meta={meta}
      request={request}
      isNew={entry?.isNew ?? false}
      usage={playground.usage}
      onOpenCode={() => setSourceOpen(true)}
    />
  );

  return (
    <div className="relative flex h-dvh overflow-hidden bg-background">
      {/* Under the whole page, so the Docs panel floats on the stage too. */}
      <StageGround />
      <main className="relative flex min-w-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">
          {/* The catalog card's dot field, for previews that want detail
              behind them (glass has something to bend). */}
          {playground.dots && (
            <div
              aria-hidden
              className={cn(
                "frame-dots pointer-events-none absolute inset-0",
                playground.vignette && "frame-vignette",
              )}
            />
          )}
          <div
            key={previewKey}
            className="absolute inset-0 flex items-center justify-center px-6"
          >
            {playground.preview ?? (
              <p className="text-[13px] text-text-muted">
                Preview coming soon for this component.
              </p>
            )}
          </div>

          <SideArrow
            ref={prevArrow}
            dir="Previous"
            name={prev.name}
            busy={going === "Previous"}
            hidden={panelOpen}
            onGo={() => go("Previous")}
            onHint={(el) => showHint("prev", el)}
            onUnhint={hideHint}
          />
          <SideArrow
            ref={nextArrow}
            dir="Next"
            name={next.name}
            busy={going === "Next"}
            hidden={panelOpen}
            onGo={() => go("Next")}
            onHint={(el) => showHint("next", el)}
            onUnhint={hideHint}
          />

          <div
            ref={bar}
            className="absolute inset-x-0 bottom-5 z-20 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center"
          >
            {/* min-w-0 lets the dock give way on a narrow screen; its row then
              scrolls sideways instead. */}
            <div ref={dock} className="min-w-0">
              <MenuDock
                items={items}
                path={path}
                // The closed shell stops at the page gutter; open, a panel may
                // use the full width.
                classNames={{
                  shell: panelOpen ? undefined : "max-w-[calc(100vw-2rem)]",
                }}
                onNavigate={setPath}
                label="Preview actions"
                layoutId="detail-dock"
                // A cover over each row's whole tap target reports hover for
                // the tooltip; its empty title keeps the row's native one from
                // stacking on top. Rows showing their label need no tooltip.
                // Buttons with a sound of their own (a panel's swell, the theme
                // cue) skip the press knock rather than stack on it.
                renderIcon={({ item, defaultIcon }) => {
                  const knocks = !QUIET_PRESS.has(item.id!);
                  return (
                    <>
                      {defaultIcon}
                      <span
                        aria-hidden
                        title=""
                        className="absolute inset-0 z-20 rounded-full"
                        onPointerEnter={(e) =>
                          e.pointerType === "mouse" &&
                          !item.showLabel &&
                          showHint(item.id!, e.currentTarget)
                        }
                        onPointerLeave={() => hideHint()}
                        onPointerDown={() => {
                          if (knocks) play("tap");
                          hideHint(true);
                        }}
                      />
                    </>
                  );
                }}
                // Room either side of the separator before Theme: the dock's
                // 4px gap plus this 8px, with the line centred in the 12px.
                className="[&_[data-dock-row]:has(.dock-sep)]:ml-2"
              />
            </div>
          </div>
        </div>

        <motion.div
          initial={false}
          animate={{ height: sourceOpen ? DRAWER_H + PANEL_GAP : 0 }}
          transition={panel}
          className="shrink-0 overflow-hidden"
          aria-hidden={!sourceOpen}
          // Built ahead of time, so keep its buttons out of the tab order
          // while it is closed.
          inert={!sourceOpen}
        >
          {(sourceOpen || sourceBuilt) && (
            // Fixed height, not h-full: the drawer clips it while it grows
            // instead of the code block re-laying out every frame.
            <div
              style={{ height: DRAWER_H }}
              className="mx-3 flex flex-col overflow-hidden rounded-2xl bg-background-100"
            >
              <DrawerHeader code={meta.code} fileName={`${slug}.tsx`} />
              <div className="code-scroll min-h-0 flex-1 overflow-y-auto">
                <CodeBlock code={meta.code} />
              </div>
            </div>
          )}
        </motion.div>

        <div className="absolute top-3.5 left-1/2 z-30 -translate-x-1/2">
          <Pill name={meta.name} />
        </div>
      </main>

      {isLg ? (
        <motion.div
          initial={false}
          animate={{ width: docsOpen ? INSPECTOR_W + PANEL_GAP : 0 }}
          transition={layout}
          className="relative shrink-0 overflow-hidden"
        >
          <aside
            aria-label="Documentation"
            hidden={!docsOpen}
            style={{ width: INSPECTOR_W }}
            className="code-scroll mt-3 h-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl bg-background px-7 pt-7"
          >
            {inspector}
          </aside>
        </motion.div>
      ) : (
        <AnimatePresence>
          {docsOpen && (
            <motion.aside
              aria-label="Documentation"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={panel}
              className="absolute inset-x-0 top-19 bottom-0 z-10 overflow-y-auto bg-background px-5 pt-4"
            >
              {inspector}
            </motion.aside>
          )}
        </AnimatePresence>
      )}

      <DockKeycaps
        ids={["prev", ...items.map((i) => i.id ?? ""), "next"]}
        rows={() =>
          [prevArrow.current, ...dockRows(), nextArrow.current].filter(
            (el): el is HTMLElement => !!el,
          )
        }
        open={path.length > 0}
      />

      <AnimatePresence>
        {hint && hintItem && path.length === 0 && (
          <motion.div
            aria-hidden
            // Grows out of its arrow, which points at the row.
            initial={hint.instant ? false : hintAway}
            animate={{ opacity: 1, scale: 1 }}
            exit={hintAway}
            transition={
              reduce ? { duration: 0.1 } : { duration: 0.125, ease: EASE_OUT }
            }
            style={{
              left: hint.rect.left + hint.rect.width / 2,
              top: hint.rect.top - 10,
            }}
            // Prev and next sit at the stage's edges, so their tooltips run
            // inward from the arrow instead of centering on it and spilling
            // off screen.
            className={cn(
              "pointer-events-none fixed z-50 -translate-y-full",
              hint.id === "prev"
                ? "origin-bottom-left -translate-x-6"
                : hint.id === "next"
                  ? "origin-bottom-right -translate-x-[calc(100%-1.5rem)]"
                  : "origin-bottom -translate-x-1/2",
            )}
          >
            <div className="relative flex h-7.5 items-center gap-1.5 rounded-[9px] bg-foreground px-2.5 text-[12.5px] font-medium whitespace-nowrap text-background shadow-elevated">
              {hint.id === "prev" || hint.id === "next" ? (
                <>
                  <span className="font-normal opacity-60">
                    {hint.id === "prev" ? "Previous" : "Next"}
                  </span>
                  {hint.id === "prev" ? prev.name : next.name}
                </>
              ) : (
                hintItem.label
              )}
              {DOCK_KEYS[hint.id] && (
                <kbd className="-mr-1 ml-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-[5px] bg-background/15 px-1 font-mono text-[10.5px] leading-none text-background/70">
                  {DOCK_KEYS[hint.id]}
                </kbd>
              )}
              <span
                className={cn(
                  "absolute -bottom-1 size-2 rotate-45 rounded-[1px] bg-foreground",
                  hint.id === "prev"
                    ? "left-6 -translate-x-1/2"
                    : hint.id === "next"
                      ? "right-6 translate-x-1/2"
                      : "left-1/2 -translate-x-1/2",
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Unknown slug: the same shell, a message and a way back. */
export function ComponentNotFound({ slug }: { slug: string }) {
  return (
    <main className="relative flex h-dvh items-center justify-center overflow-hidden bg-background px-5">
      <StageGround />
      <div className="absolute top-3.5 left-1/2 z-30 -translate-x-1/2">
        <Pill name="Not found" />
      </div>
      <div className="relative text-center">
        <p className="font-mono text-[12px] text-text-muted">404</p>
        <h1 className="mt-3 text-[clamp(2rem,3.6vw,2.875rem)] leading-[1.04] font-semibold tracking-tighter text-balance text-foreground">
          Component <span className="accent-word">not found</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px]/relaxed text-text-secondary">
          <span className="font-mono text-foreground">{slug}</span> isn&apos;t
          in the registry yet.
        </p>
        <Link
          href="/components"
          className="group mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-[14.5px] font-medium text-brand-foreground shadow-[inset_0_1px_0_var(--stage-light)] ring-1 ring-brand-hover transition-transform duration-200 ease-out active:scale-[0.97]"
        >
          Browse components
          <IconArrowRight
            aria-hidden
            className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </main>
  );
}
