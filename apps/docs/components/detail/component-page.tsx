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
  IconChevronLeft,
  IconChevronRight,
  IconCode,
  IconCopy,
  IconDashboardGrid,
  IconDownloadMinimalistic,
  IconRestart,
  IconSearchNormal,
  IconSettings,
  IconSpinner,
  IconVolumeCross,
  IconVolumeHigh,
} from "@devigner-ui/icons";
import { cn } from "cn";
import type { ComponentData } from "@/lib/registry";
import { SOUND_KEY, cue, play, setEnabled } from "@/lib/sound";
import { DISCORD_URL, LogoDiscord } from "../brand-logos";
import {
  countLines,
  groupByCategory,
  neighbors,
  searchEntries,
  type CatalogEntry,
} from "@/lib/catalog-query";
import { CodeBlock } from "../code-block";
import { ProgressiveBlur } from "../landing/hero-window";
import { Wordmark } from "../landing/navbar";
import { ThemeIcon, useTheme } from "../theme-provider";
import { Inspector, type RequestCredit } from "./inspector";
import { usePlayground } from "./playgrounds";

const INSPECTOR_W = 460;
/** Space kept between the floating Docs/code panels and the viewport edges. */
const PANEL_GAP = 12;
const DRAWER_H = 320;

const lgQuery = "(min-width: 1024px)";
function useIsLg() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(lgQuery);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(lgQuery).matches,
    () => true,
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
const QUIET_PRESS = new Set(["components", "theme", "settings"]);

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

/** Prev / next glyph. */
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
  const Icon = dir === "Previous" ? IconChevronLeft : IconChevronRight;
  const swap = reduce ? { duration: 0 } : SPRING_SWAP;
  return (
    <>
      <span className="grid place-items-center">
        <motion.span
          className="col-start-1 row-start-1 grid place-items-center"
          initial={false}
          animate={{ opacity: busy ? 0 : 1, scale: busy && !reduce ? 0.5 : 1 }}
          transition={swap}
        >
          <Icon strokeWidth={2} />
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
  const { theme, toggleTheme } = useTheme();

  const [docsOpen, setDocsOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
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
    if (on) cue("toggle");
  };
  // A panel growing out of the dock swells in; folding back falls away.
  const panelOpen = path.length > 0;
  const panelSeen = useRef(panelOpen);
  useEffect(() => {
    if (panelSeen.current === panelOpen) return;
    panelSeen.current = panelOpen;
    cue(panelOpen ? "bloom" : "droplet");
  }, [panelOpen]);
  // ponytail: never reset by hand - the page is keyed by slug, so arriving
  // at the neighbour remounts it with this back at null.
  const [going, setGoing] = useState<"Previous" | "Next" | null>(null);
  const dock = useRef<HTMLDivElement>(null);
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
      if (!instant) play("whisper");
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

  const playground = usePlayground(slug, meta.usage);
  const [settingsIsNew] = useState(() => lastHadSettings === false);
  const hasSettings = !!playground.settings;
  useEffect(() => {
    lastHadSettings = hasSettings;
  }, [hasSettings]);
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
    cue("pulse");
    setResetSpins((n) => n + 1);
    setPreviewKey((k) => k + 1);
    playground.reset();
  };

  const items: MenuDockItem[] = [
    {
      id: "prev",
      label: `Previous: ${prev.name}`,
      icon: <ArrowGlyph dir="Previous" busy={going === "Previous"} />,
      onSelect: () => go("Previous"),
    },
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
        cue("toggle");
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
        cue("toggle");
        setSourceOpen((v) => !v);
      },
    },
    {
      id: "theme",
      label: "Toggle theme",
      icon: (
        <>
          <span
            aria-hidden
            className="dock-sep pointer-events-none absolute top-1/2 left-[-6.5px] h-5 w-px -translate-y-1/2 bg-border"
          />
          <span
            className="group grid place-items-center"
            data-dark={theme === "dark"}
          >
            <ThemeIcon />
          </span>
        </>
      ),
      onSelect: () => {
        cue("toggle");
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
    },
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
      id: "discord",
      label: "Join the Discord",
      icon: <LogoDiscord />,
      onSelect: () => window.open(DISCORD_URL, "_blank", "noopener"),
    },
    ...(playground.settings
      ? [
          {
            id: "settings",
            label: "Settings",
            icon: <SettingsGlyph enter={settingsIsNew} />,
            content: (
              <div className="flex flex-col">
                {playground.settings}
                <div className="mt-1 border-t border-border px-3 pt-3">
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
    {
      id: "next",
      label: `Next: ${next.name}`,
      icon: <ArrowGlyph dir="Next" busy={going === "Next"} />,
      onSelect: () => go("Next"),
    },
  ];

  // Read by the key listener without rebinding it on every render.
  const live = useRef({ path, docsOpen, going, go, items, reset, hasSettings });
  live.current = { path, docsOpen, going, go, items, reset, hasSettings };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const { path, docsOpen, go, items, reset, hasSettings } = live.current;
      const typing = isTyping(e.target);

      if (e.key === "/" && !typing) {
        e.preventDefault();
        setPath([1]);
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
        const at = items.findIndex((i) => i.id === id);
        if (at < 0) return;
        e.preventDefault();
        if (items[at].content) setPath([at]);
        else items[at].onSelect?.();
        return;
      }
      // Arrows belong to whatever has focus (the live component, sliders,
      // tabs, the dock). Only with nothing focused do they change component.
      if (
        (e.key === "ArrowLeft" || e.key === "ArrowRight") &&
        !e.shiftKey &&
        !e.defaultPrevented &&
        path.length === 0 &&
        (document.activeElement === document.body ||
          document.activeElement === null)
      ) {
        e.preventDefault();
        go(e.key === "ArrowLeft" ? "Previous" : "Next");
        return;
      }
      if (e.key === "Escape" && !typing) {
        if (path.length) setPath([]);
        else if (docsOpen) setDocsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const panel = reduce ? { duration: 0 } : SPRING_PANEL;
  const hintItem = hint && items.find((i) => i.id === hint.id);
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

          <div
            ref={dock}
            className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2"
          >
            <MenuDock
              items={items}
              path={path}
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
                        if (knocks) play("press");
                        hideHint(true);
                      }}
                      onPointerUp={() => knocks && play("release")}
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

        <motion.div
          initial={false}
          animate={{ height: sourceOpen ? DRAWER_H + PANEL_GAP : 0 }}
          transition={panel}
          className="shrink-0 overflow-hidden"
          aria-hidden={!sourceOpen}
        >
          {sourceOpen && (
            // Fixed height, not h-full: the drawer clips it while it grows
            // instead of the code block re-laying out every frame.
            <div
              style={{ height: DRAWER_H }}
              className="mx-3 flex flex-col overflow-hidden rounded-2xl bg-background-100"
            >
              <DrawerHeader code={meta.code} fileName={`${slug}.tsx`} />
              <div className="code-scroll min-h-0 flex-1 overflow-y-auto">
                <CodeBlock code={meta.code} lang="tsx" />
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
        ids={items.map((i) => i.id ?? "")}
        rows={dockRows}
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
            className="pointer-events-none fixed z-50 origin-bottom -translate-x-1/2 -translate-y-full"
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
              <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 rounded-[1px] bg-foreground" />
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
