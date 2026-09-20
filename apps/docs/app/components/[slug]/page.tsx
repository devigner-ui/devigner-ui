"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ChartCard,
  DeleteButton,
  MagneticButton,
  MenuDock,
  Timeline,
  Toaster,
  toast,
  type MenuDockItem,
} from "@devignerui/ui";
import { CodeBlock } from "../../../components/code-block";
import { IconButton } from "../../../components/icon-button";
import { RangeSlider } from "../../../components/range-slider";
import { useTheme } from "../../../components/theme-provider";
import { components } from "@/lib/registry";
import { COMPONENT_CATEGORIES } from "@devignerui/shared";
import {
  EASE_OUT,
  SPRING_PRESS,
  SPRING_PANEL,
  SPRING_LAYOUT,
} from "@devignerui/ui/lib/easing";
import {
  IconArchive,
  IconBrush,
  IconCode,
  IconBookmark,
  IconHeart,
  IconArrowUpDown,
  IconHistory,
  IconHomeAngle2,
  IconInbox,
  IconLamp,
  IconLibrary,
  IconLogout,
  IconMaximize,
  IconMinimize,
  IconMoon,
  IconRestart,
  IconSearchNormal,
  IconSettings,
  IconSun2,
  IconUser,
  IconComponent,
} from "@devigner-ui/icons";
import { cn } from "cn";
const categoryLabel = (key: string) =>
  COMPONENT_CATEGORIES[key as keyof typeof COMPONENT_CATEGORIES] ?? key;

/** Bare npm packages the copy-paste source imports - the manual install's step 1. */
const npmDeps = (code: string) =>
  Array.from(
    new Set(
      [...code.matchAll(/ from "([^".][^"]*)"/g)]
        .map(([, spec]) =>
          spec.startsWith("@")
            ? spec.split("/").slice(0, 2).join("/")
            : spec.split("/")[0],
        )
        .filter((pkg) => pkg !== "react"),
    ),
  );

/* ─── Live previews (one per component) ─── */

const MAGNETIC_DEFAULTS = {
  strength: 3,
  labelStrength: 4,
  field: 40,
  tilt: 15,
};
type MagneticConfig = typeof MAGNETIC_DEFAULTS;

const MAGNETIC_KNOBS: {
  key: keyof MagneticConfig;
  min: number;
  max: number;
  step: number;
  hint: string;
}[] = [
  { key: "strength", min: 0, max: 10, step: 0.5, hint: "pill travel" },
  { key: "labelStrength", min: 0, max: 6, step: 0.5, hint: "label travel" },
  { key: "field", min: 0, max: 100, step: 4, hint: "px" },
  { key: "tilt", min: 0, max: 45, step: 1, hint: "deg" },
];

/** The Usage section's snippet, written from whatever the knobs currently say
 *  - copying it gives you the button you are looking at, not a fixed example. */
const magneticUsage = (
  c: MagneticConfig,
) => `import { MagneticButton } from "@/components/ui/magnetic-button";

export function Example() {
  return (
    <MagneticButton
      strength={${c.strength}}
      labelStrength={${c.labelStrength}}
      field={${c.field}}
      tilt={${c.tilt}}
      className="bg-linear-to-b from-brand-secondary to-brand text-brand-foreground uppercase"
    >
      Get started
    </MagneticButton>
  );
}`;

const DELETE_DEFAULTS = {
  side: "right" as "left" | "right",
  async: true,
  resetAfter: 1400,
  disabled: false,
};
type DeleteConfig = typeof DELETE_DEFAULTS;

const deleteUsage = (c: DeleteConfig) => {
  const props = [
    c.side === "left" ? "left" : null,
    `resetAfter={${c.resetAfter}}`,
    c.disabled ? "disabled" : null,
    `onConfirm={${
      c.async
        ? '() => fetch("/api/rows/7", { method: "DELETE" })'
        : '() => console.log("deleted")'
    }}`,
  ]
    .filter(Boolean)
    .map((line) => `      ${line}`)
    .join("\n");

  return `import { DeleteButton } from "@/components/ui/delete-button";

export function Example() {
  return (
    <DeleteButton
${props}
    />
  );
}`;
};

function Knob({
  name,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: {
  name: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 font-mono text-[11px]">
        <span className="text-foreground/60">{name}</span>
        <span className="tabular-nums text-foreground/70">
          {/* Stepping by 0.05 lands on 0.35000000000000003 - round for display
              only, so the value handed to the component stays exact. */}
          {+value.toFixed(2)} <span className="text-foreground/30">{hint}</span>
        </span>
      </div>
      <RangeSlider
        aria-label={name}
        value={value}
        min={min}
        max={max}
        step={step}
        showTicks={false}
        onValueChange={onChange}
        className="h-7"
      />
    </div>
  );
}

/** Props dropdown, pinned to the stage's top-right corner. */
function ConfigMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: globalThis.PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="absolute right-4 top-4 z-30 flex flex-col items-end gap-2"
    >
      <IconButton
        active={open}
        onClick={() => setOpen((v) => !v)}
        aria-label="Configure props"
        aria-expanded={open}
        title="Props"
      >
        <IconSettings className="size-5" variant={open ? "Bulk" : "Outline"} />
      </IconButton>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={SPRING_PANEL}
            className="w-64 origin-top-right rounded-2xl border border-border/60 bg-background/80 p-3 backdrop-blur-xl"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Sample series for the Chart Card preview - same numbers as its Usage snippet. */
const CHART_CARD_SALES = [
  { label: "Feb", value: 6420 },
  { label: "Mar", value: 9180 },
  { label: "Apr", value: 12340 },
  { label: "May", value: 8760 },
  { label: "Jun", value: 16520 },
  { label: "Jul", value: 13070 },
  { label: "Aug", value: 15960 },
];

/** Sample rail for the Timeline preview - same steps as its Usage snippet. */
const TIMELINE_STEPS = [
  {
    title: "Project Kickoff",
    description: "Define goals and gather requirements.",
  },
  { title: "Planning", description: "Create the roadmap and strategy." },
  { title: "Design & Build", description: "Design, develop, and iterate." },
  { title: "Launch", description: "Test, deploy, and provide support." },
];

/** The MenuDock's search panel, passed to its Search item as `content`. It is
 *  ordinary markup with its own state - the dock morphs into whatever this
 *  renders and never learns that it is a search box.
 *
 *  It searches this registry, so the results are real components. Capped,
 *  because the surface animates to fit its content: an uncapped list would
 *  have the panel lurching a row taller on every keystroke. */
const SEARCH_LIMIT = 4;

function MenuDockSearch() {
  const [query, setQuery] = useState("");
  const all = Object.values(components);
  const q = query.trim().toLowerCase();
  const hits = (
    q ? all.filter((c) => c.name.toLowerCase().includes(q)) : all
  ).slice(0, SEARCH_LIMIT);

  return (
    <div className="flex w-72 flex-col gap-1">
      <div className="flex h-10 items-center gap-3 rounded-full bg-surface2 px-3">
        <IconSearchNormal className="size-5 shrink-0 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search components"
          aria-label="Search components"
          className="w-full bg-transparent text-[15px] text-foreground outline-none! placeholder:text-text-muted"
        />
      </div>

      {hits.length === 0 ? (
        <p className="px-3 py-2 text-[15px] text-text-muted">
          Nothing matches “{query.trim()}”.
        </p>
      ) : (
        // Capped once, by SEARCH_LIMIT above. A second slice here just means
        // two numbers to keep in agreement.
        hits.map((c) => (
          <Link
            key={c.slug}
            href={`/components/${c.slug}`}
            className="flex h-10 items-center gap-3 rounded-2xl px-3 text-[15px] text-foreground transition-colors hover:bg-surface-hover"
          >
            <IconComponent className="size-5 shrink-0 text-text-muted" />
            <span className="flex-1 truncate">{c.name}</span>
          </Link>
        ))
      )}
    </div>
  );
}

/** Sample dock for the MenuDock preview - same items as its Usage snippet.
 *  Account nests two deep, which is what shows the stack is not capped. */
const MENU_DOCK_ITEMS: MenuDockItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <IconHomeAngle2 strokeWidth={2} />,
    activeIcon: <IconHomeAngle2 variant="Bold" />,
  },
  {
    id: "search",
    label: "Search",
    icon: <IconSearchNormal strokeWidth={2} />,
    activeIcon: <IconSearchNormal variant="Bold" />,
    content: <MenuDockSearch />,
  },
  {
    id: "saved",
    label: "Saved",
    icon: <IconHeart strokeWidth={2} />,
    activeIcon: <IconHeart variant="Bold" />,
  },
  {
    id: "library",
    label: "Library",
    icon: <IconLibrary strokeWidth={2} />,
    activeIcon: <IconLibrary variant="Bold" />,
    items: [
      { label: "Recently viewed", icon: <IconHistory /> },
      { label: "Bookmarked", icon: <IconBookmark /> },
      { label: "Downloads", icon: <IconArchive /> },
    ],
  },
  {
    id: "account",
    label: "Account",
    icon: <IconArrowUpDown className="size-3.5!" strokeWidth={2} />,
    items: [
      {
        label: "Profile",
        icon: <IconUser />,
        items: [
          { label: "Personal", icon: <IconUser /> },
          { label: "Work", icon: <IconArchive /> },
          { label: "Ideas", icon: <IconLamp /> },
        ],
      },
      { label: "Appearance", icon: <IconBrush /> },
      { label: "Invite a friend", icon: <IconInbox /> },
      { label: "Sign out", icon: <IconLogout />, destructive: true },
    ],
  },
];

/** The dock, with `active` wired to the last leaf picked - without state the
 *  outline/solid swap has nothing to swap on. */
function MenuDockPreview() {
  const [active, setActive] = useState("home");

  return (
    <MenuDock
      active={active}
      items={MENU_DOCK_ITEMS.map((item) =>
        item.items ? item : { ...item, onSelect: () => setActive(item.id!) },
      )}
    />
  );
}

/** Buttons that fire the three ways a notch appears - a plain status, and a
 *  promise that morphs the same surface from loading into success or error
 *  rather than replacing it. There is no timeout/retract button: the auto
 *  dismiss after DEFAULT_DURATION already exercises that path. The viscosity
 *  knob is here, not on the Toaster itself, so the bridge's neck length can
 *  be compared without editing code.
 *
 *  The Toaster itself is fixed to the real viewport top, not to this stage -
 *  it has no idea it is being previewed inside a boxed card. So the notch
 *  renders pinned above the whole docs page rather than inside the dotted
 *  preview box, which is expected and not a bug in this preview. */
function NotchPreview() {
  const [viscosity, setViscosity] = useState(5);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Toaster viscosity={viscosity} />
      <button
        type="button"
        onClick={() => toast.success("Deployed")}
        className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity duration-200 hover:opacity-90"
      >
        Success
      </button>
      <button
        type="button"
        onClick={() => toast.error("Deploy failed")}
        className="cursor-pointer rounded-full border border-border px-4 py-2 text-[13px] font-medium text-foreground transition-colors duration-200 hover:bg-surface-hover"
      >
        Error
      </button>
      <button
        type="button"
        onClick={() =>
          toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
            loading: "Deploying...",
            success: "Live",
            error: "Failed",
          })
        }
        className="cursor-pointer rounded-full border border-border px-4 py-2 text-[13px] font-medium text-foreground transition-colors duration-200 hover:bg-surface-hover"
      >
        Promise
      </button>

      <ConfigMenu>
        <Knob
          name="viscosity"
          hint="0-10"
          min={0}
          max={10}
          step={1}
          value={viscosity}
          onChange={setViscosity}
        />
      </ConfigMenu>
    </div>
  );
}

/** Live prop playground. The config is the page's, not its own: the Usage
 *  section renders from the same state, so the snippet tracks the knobs. */
function MagneticPlayground({
  cfg,
  setCfg,
}: {
  cfg: MagneticConfig;
  setCfg: React.Dispatch<React.SetStateAction<MagneticConfig>>;
}) {
  const [showField, setShowField] = useState(true);

  return (
    // Fills the stage so the config button can sit in its top-right corner
    // while the button itself stays centred.
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative inline-flex">
        {/* The field is padding cancelled by margin, so the button's own box is
            just the pill - a negative inset of `field` traces the real edge of
            the pull without adding any layout of its own. */}
        <span
          aria-hidden
          style={{ inset: -cfg.field }}
          className={`pointer-events-none absolute rounded-full border border-dashed transition-colors duration-200 ${
            showField ? "border-primary/15" : "border-transparent"
          }`}
        />
        <MagneticButton
          {...cfg}
          className="bg-linear-to-b from-brand-hover to-brand text-brand-foreground uppercase"
        >
          Get started
        </MagneticButton>
      </div>

      <ConfigMenu>
        <div className="flex flex-col gap-3">
          {MAGNETIC_KNOBS.map((k) => (
            <Knob
              key={k.key}
              name={k.key}
              hint={k.hint}
              min={k.min}
              max={k.max}
              step={k.step}
              value={cfg[k.key]}
              onChange={(v) => setCfg((c) => ({ ...c, [k.key]: v }))}
            />
          ))}
          <label className="flex items-center gap-2 font-mono text-[11px] text-foreground/60">
            <input
              type="checkbox"
              checked={showField}
              onChange={(e) => setShowField(e.target.checked)}
              className="accent-primary"
            />
            show field
          </label>
        </div>
      </ConfigMenu>
    </div>
  );
}

/** Reads as tabs, behaves as a radio group - each press swaps a prop on the
 *  same button rather than revealing a different panel. */
function SideTabs({
  value,
  onChange,
}: {
  value: DeleteConfig["side"];
  onChange: (side: DeleteConfig["side"]) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Actions position"
      className="inline-flex rounded-full border border-border/60 bg-surface/60 p-0.5"
    >
      {(["left", "right"] as const).map((side) => (
        <button
          key={side}
          type="button"
          role="radio"
          aria-checked={value === side}
          onClick={() => onChange(side)}
          className={`relative rounded-full px-3 py-1 font-mono text-[11px] transition-colors cursor-pointer ${
            value === side ? "text-foreground" : "text-foreground/50"
          }`}
        >
          {value === side && (
            <motion.span
              layoutId="delete-side-tab"
              transition={SPRING_PANEL}
              className="absolute inset-0 rounded-full bg-background shadow-elevated"
            />
          )}
          <span className="relative">{side}</span>
        </button>
      ))}
    </div>
  );
}

function DeleteButtonPlayground({
  cfg,
  setCfg,
}: {
  cfg: DeleteConfig;
  setCfg: React.Dispatch<React.SetStateAction<DeleteConfig>>;
}) {
  const set = <K extends keyof DeleteConfig>(k: K, v: DeleteConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <DeleteButton
        left={cfg.side === "left"}
        resetAfter={cfg.resetAfter}
        disabled={cfg.disabled}
        // Without a promise a synchronous confirm skips the spinner and cuts
        // straight to the tick, so the pending phase never plays.
        onConfirm={
          cfg.async
            ? () => new Promise((resolve) => setTimeout(resolve, 900))
            : () => undefined
        }
      />

      <ConfigMenu>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-foreground/60">
              actions
            </span>
            <SideTabs value={cfg.side} onChange={(v) => set("side", v)} />
          </div>
          <Knob
            name="resetAfter"
            hint="ms, 0 keeps the tick"
            min={0}
            max={4000}
            step={200}
            value={cfg.resetAfter}
            onChange={(v) => set("resetAfter", v)}
          />
          {(["async", "disabled"] as const).map((k) => (
            <label
              key={k}
              className="flex items-center gap-2 font-mono text-[11px] text-foreground/60"
            >
              <input
                type="checkbox"
                checked={cfg[k]}
                onChange={(e) => set(k, e.target.checked)}
                className="accent-primary"
              />
              {k === "async" ? "async confirm" : k}
            </label>
          ))}
        </div>
      </ConfigMenu>
    </div>
  );
}

const dotGrid: React.CSSProperties = {
  backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
};

/* ─── Icons (15px stroke icons, lucide paths) ─── */

const icon = {
  copy: (
    <>
      <rect width="14" height="14" x="8" y="8" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  download: (
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  ),
  sidebar: (
    <>
      <rect width="18" height="18" x="3" y="3" rx="5" />
      <path d="M9.5 3v18" />
    </>
  ),
} as const;

function Icon({ d, size = 18 }: { d: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d}
    </svg>
  );
}

/* ─── Stage: pill toolbar, code drawer panel, fullscreen ─── */

type StageProps = {
  preview: React.ReactNode;
  previewKey: number;
  code: string;
  fileName: string;
  showCode: boolean;
  setShowCode: (v: boolean) => void;
  onReset: () => void;
  onFullscreen: () => void;
  isFullscreen?: boolean;
  /** Overrides STAGE_MIN for a preview that needs more room than the default. */
  stageMin?: number;
};

function PillToolbar({
  showCode,
  setShowCode,
  onReset,
  onFullscreen,
  isFullscreen,
}: Pick<
  StageProps,
  "showCode" | "setShowCode" | "onReset" | "onFullscreen" | "isFullscreen"
>) {
  const { theme, toggleTheme } = useTheme();
  const [resetSpins, setResetSpins] = useState(0);
  const reduce = useReducedMotion();
  return (
    <div className="flex items-center gap-1 rounded-3xl bg-background p-1.5">
      <IconButton
        label="Collapse"
        active={isFullscreen}
        onClick={onFullscreen}
        iconKey={isFullscreen ? "min" : "max"}
        aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen preview"}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? (
          <IconMinimize className="size-4" strokeWidth={2} />
        ) : (
          <IconMaximize className="size-4" strokeWidth={2} />
        )}
      </IconButton>
      <IconButton
        onClick={() => {
          setResetSpins((n) => n + 1);
          onReset();
        }}
        aria-label="Reset preview"
        title="Reset"
      >
        <motion.span
          key={resetSpins}
          className="inline-flex"
          initial={{ rotate: 0 }}
          animate={{ rotate: reduce ? 0 : 360 }}
          transition={{ duration: 1, ease: EASE_OUT }}
        >
          <IconRestart className="size-4" strokeWidth={2} />
        </motion.span>
      </IconButton>
      <IconButton
        onClick={toggleTheme}
        iconKey={theme}
        aria-label="Toggle theme"
        title="Theme"
      >
        {theme === "dark" ? (
          <IconSun2 className="size-4" strokeWidth={2} />
        ) : (
          <IconMoon className="size-4" strokeWidth={2} />
        )}
      </IconButton>
      <IconButton
        active={showCode}
        label="Source Code"
        onClick={() => setShowCode(!showCode)}
        aria-label="Toggle code"
        aria-pressed={showCode}
        title="View code"
      >
        <IconCode className="size-4" strokeWidth={2} />
      </IconButton>
    </div>
  );
}

/** Copy-to-clipboard in the toolbar's icon style. Pass `text` for the labelled
 *  variant - it drops the icon's rotate-swap, which would spin the word too. */
function IconCopy({ code, text }: { code: string; text?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      size="sm"
      iconKey={text ? undefined : copied ? "check" : "copy"}
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      aria-label="Copy code"
      // Locked while the check shows, so a second click can't re-arm the
      // timeout and leave the button stuck confirming.
      disabled={copied}
      className={cn(
        "text-foreground/60! hover:text-foreground! disabled:cursor-default",
        text
          ? copied
            ? "h-7 w-auto! pl-3 pr-2 rounded-full!"
            : "h-7 w-auto! pl-2 pr-3 rounded-full!"
          : "",
      )}
    >
      {text && (
        // Both words stack in one grid cell, so the box is always as wide as
        // the longer of them and the button never resizes mid-copy.
        <span className="mr-1 grid justify-items-center text-center text-xs font-medium">
          <span aria-hidden className="invisible col-start-1 row-start-1">
            {copied ? text : "Copied"}
          </span>
          <span className="col-start-1 row-start-1">
            {copied ? "Copied" : text}
          </span>
        </span>
      )}
      <Icon d={copied ? icon.check : icon.copy} size={13} />
    </IconButton>
  );
}

function DrawerHeader({ code, fileName }: { code: string; fileName: string }) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 px-4">
      <span className="flex-1 truncate font-mono text-xs font-medium text-text-muted">
        {fileName}
      </span>
      <IconCopy code={code} />
      <IconButton size="sm" onClick={download} aria-label="Download file">
        <Icon d={icon.download} size={13} />
      </IconButton>
    </div>
  );
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Height changes follow the pointer 1:1 while dragging - a spring here would
 *  trail the cursor and feel like lag. */
const INSTANT = { duration: 0 } as const;

/** Height of the resize grip between stage and drawer (`h-2`). */
const HANDLE_H = 8;

/** Floor for the stage so its preview never clips: the tallest preview box
 *  (a pill inside its 40px magnet field) centred, with the floating toolbar
 *  clearing it top and bottom, plus breathing room. Previews mount as
 *  `absolute inset-0` fillers, so nothing here is measurable from the stage -
 *  ponytail: one constant beats a ref that reads 0. A preview that outgrows it
 *  passes its own `stageMin` rather than raising the floor for every page. */
const STAGE_MIN = 280;

/** The gap between stage and drawer, doubling as the drag grip. */
function ResizeHandle({
  disabled,
  dragging,
  pct,
  onStart,
  onMove,
  onEnd,
  onNudge,
}: {
  disabled: boolean;
  dragging: boolean;
  pct: number;
  onStart: () => void;
  onMove: (clientY: number) => void;
  onEnd: () => void;
  onNudge: (delta: number) => void;
}) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize code panel"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={15}
      aria-valuemax={85}
      tabIndex={disabled ? -1 : 0}
      className={`group relative z-20 flex h-2 shrink-0 touch-none items-center justify-center outline-none ${
        disabled ? "pointer-events-none" : "cursor-ns-resize"
      }`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onStart();
      }}
      onPointerMove={(e) => dragging && onMove(e.clientY)}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") onNudge(5);
        else if (e.key === "ArrowDown") onNudge(-5);
        else return;
        e.preventDefault();
      }}
    >
      {/* Padded hit area - 8px of gap is too thin to grab reliably. */}
      <span className="absolute inset-x-0 -inset-y-1.5" />
      <span
        className={`pointer-events-none relative flex gap-1 transition-opacity ${
          disabled ? "opacity-0" : dragging ? "opacity-100" : "opacity-40"
        } group-hover:opacity-100 group-focus-visible:opacity-100`}
      >
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1 rounded-full bg-text-muted" />
        ))}
      </span>
    </div>
  );
}

/** Desktop right panel: floating stage card + code drawer that expands below it.
 * In fullscreen the same element goes `fixed inset-0` and Motion's layout
 * animation morphs it there - no separate overlay. */
function StagePanel(props: StageProps) {
  const colRef = useRef<HTMLDivElement>(null);
  // The drawer owns a percentage of the column; the stage flexes into the rest,
  // so shrinking one always hands the space straight to the other.
  const [codePct, setCodePct] = useState(46);
  const [dragging, setDragging] = useState(false);
  /** Column content box - the drawer's % height resolves against it, so the
   *  column's own padding has to come off both ends or the grip drifts from
   *  the cursor. */
  const columnBox = () => {
    const el = colRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const bottom = parseFloat(cs.paddingBottom);
    return {
      bottom: r.bottom - bottom,
      height: r.height - parseFloat(cs.paddingTop) - bottom,
    };
  };

  const stageMin = props.stageMin ?? STAGE_MIN;

  /** How far the drawer may grow before the stage starts clipping. */
  const maxPct = (columnHeight: number) =>
    Math.max(15, ((columnHeight - HANDLE_H - stageMin) / columnHeight) * 100);

  const setPct = (
    pctFor: (box: { bottom: number; height: number }) => number,
  ) => {
    const box = columnBox();
    if (!box) return;
    setCodePct(clamp(pctFor(box), 15, maxPct(box.height)));
  };

  const resize = (clientY: number) =>
    setPct((box) => ((box.bottom - clientY) / box.height) * 100);

  return (
    <motion.div
      ref={colRef}
      layout
      transition={SPRING_LAYOUT}
      className={`${
        props.isFullscreen
          ? "fixed inset-0 z-100 flex flex-col bg-background p-3"
          : "flex h-full flex-col p-3 pl-0"
      } ${dragging ? "cursor-ns-resize select-none" : ""}`}
    >
      <motion.div
        layout
        transition={dragging ? INSTANT : SPRING_LAYOUT}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-surface2 py-6"
        // style={dotGrid}
      >
        <div key={props.previewKey} className="flex w-full justify-center px-6">
          {props.preview ?? (
            <p className="text-[13px] text-text-muted">
              Preview coming soon for this component.
            </p>
          )}
        </div>
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
          <PillToolbar {...props} />
        </div>
      </motion.div>
      <ResizeHandle
        disabled={!props.showCode}
        dragging={dragging}
        pct={codePct}
        onStart={() => setDragging(true)}
        onMove={resize}
        onEnd={() => setDragging(false)}
        onNudge={(d) => setPct(() => codePct + d)}
      />
      <motion.div
        initial={false}
        animate={{
          height: props.showCode ? `${codePct}%` : 0,
          opacity: props.showCode ? 1 : 0,
        }}
        transition={dragging ? INSTANT : SPRING_PANEL}
        // The drag clamps itself, but the untouched default percentage never
        // passed through maxPct - so the floor is enforced in CSS instead,
        // where it also survives a window resize with nothing to re-run.
        style={{ maxHeight: `calc(100% - ${stageMin + HANDLE_H}px)` }}
        className="shrink-0 overflow-hidden rounded-2xl bg-surface2"
        aria-hidden={!props.showCode}
      >
        <div className="flex h-full flex-col">
          <DrawerHeader code={props.code} fileName={props.fileName} />
          <div className="code-scroll min-h-0 flex-1 overflow-y-auto">
            <CodeBlock code={props.code} lang="tsx" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Mobile inline stage: same card + toolbar + drawer, fixed height.
 * Fullscreen expands this same card to the viewport via layout animation. */
function PreviewCard(props: StageProps) {
  return (
    <motion.div
      layout
      transition={SPRING_LAYOUT}
      className={
        props.isFullscreen
          ? "fixed inset-0 z-100 flex flex-col gap-2 bg-background p-3"
          : "flex flex-col gap-2"
      }
    >
      <motion.div
        layout
        transition={SPRING_LAYOUT}
        className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-background p-6 ${
          props.isFullscreen ? "min-h-0 flex-1" : "min-h-80"
        }`}
        style={dotGrid}
      >
        <div key={props.previewKey} className="flex w-full justify-center">
          {props.preview ?? (
            <p className="text-[13px] text-text-muted">
              Preview coming soon for this component.
            </p>
          )}
        </div>
        <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
          <PillToolbar {...props} />
        </div>
      </motion.div>
      <motion.div
        initial={false}
        animate={{ height: props.showCode ? 320 : 0 }}
        transition={SPRING_PANEL}
        className="shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-(--code-bg)"
        aria-hidden={!props.showCode}
      >
        <div className="flex h-full flex-col">
          <DrawerHeader code={props.code} fileName={props.fileName} />
          <div className="code-scroll min-h-0 flex-1 overflow-y-auto">
            <CodeBlock code={props.code} lang="tsx" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Docs column pieces ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-5 text-3xl tracking-tight text-foreground md:text-4xl">
      {children}
    </h2>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[13px] text-foreground/70">
      {children}
    </code>
  );
}

function StepLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-8 mb-4 text-xs tracking-[0.18em] text-foreground/35 uppercase">
      {children}
    </h3>
  );
}

/** A single shell command with its copy button. */
function CommandRow({ command }: { command: string }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/60 p-1.5">
      <div className="flex items-center justify-between gap-2 rounded-lg bg-surface2 px-4 py-3 font-mono text-[13px] text-text-secondary">
        <span className="truncate">
          <span className="text-text-muted">$</span> {command}
        </span>
        <IconCopy code={command} />
      </div>
    </div>
  );
}

/* ─── Sidebar (overlay panel with ruler-tick nav, after the reference) ─── */

function SidebarItem({
  item,
  isActive,
  anyHovered,
  isHovered,
  onEnter,
  onLeave,
}: {
  item: { slug: string; name: string };
  isActive: boolean;
  anyHovered: boolean;
  isHovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="relative">
      {/* accent active bar, springs between items */}
      {isActive && (
        <motion.span
          layoutId="doc-sidebar-active-bar"
          className="pointer-events-none absolute top-1/2 z-40 h-[1.8px] -translate-y-1/2 rounded-full bg-primary"
          animate={{ width: 30 }}
          transition={SPRING_LAYOUT}
        />
      )}
      {/* animated dash: idle 18 → hover 26 → active 0 */}
      <motion.span
        className="pointer-events-none absolute left-0 top-1/2 h-px -translate-y-1/2 bg-foreground/50"
        animate={{ width: isActive ? 0 : isHovered ? 26 : 18 }}
        transition={SPRING_PRESS}
      />
      {/* static ruler ticks */}
      <span className="pointer-events-none absolute left-0 top-0 h-px w-4 bg-foreground/30" />
      <span className="pointer-events-none absolute left-0 top-1/4 h-px w-3.25 bg-foreground/30" />
      <span className="pointer-events-none absolute left-0 top-3/4 h-px w-3.25 bg-foreground/30" />
      <motion.div
        animate={{
          opacity: isActive ? 1 : anyHovered ? (isHovered ? 1 : 0.3) : 0.55,
          x: isActive ? 8 : isHovered ? 6 : 0,
        }}
        transition={SPRING_PRESS}
        style={{ transformOrigin: "left center" }}
      >
        <Link
          href={`/components/${item.slug}`}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          aria-current={isActive ? "page" : undefined}
          className={`relative flex select-none items-center py-0.5 pl-8 pr-3 ${
            isActive ? "text-primary" : "text-foreground"
          }`}
        >
          <span className="truncate text-base">{item.name}</span>
        </Link>
      </motion.div>
    </div>
  );
}

/** Frosted left panel: stacked backdrop-blur layers fading out to the right. */
function SidebarBlur() {
  const layers = [
    { blur: 32, to: 35 },
    { blur: 16, to: 55 },
    { blur: 8, to: 75 },
    { blur: 4, to: 100 },
  ];
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {layers.map(({ blur, to }) => (
        <div
          key={blur}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            maskImage: `linear-gradient(to right, black ${Math.max(0, to - 35)}%, transparent ${to}%)`,
            WebkitMaskImage: `linear-gradient(to right, black ${Math.max(0, to - 35)}%, transparent ${to}%)`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-linear-to-r from-background/85 via-background/40 to-transparent" />
    </div>
  );
}

function DocSidebar({
  open,
  setOpen,
  activeSlug,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  activeSlug: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // "s" toggles; left screen edge held for 500ms opens.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable
      )
        return;
      if (e.key === "s") setOpen(!open);
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onMove = (e: MouseEvent) => {
      if (!open && e.clientX <= 16) {
        timer ??= setTimeout(() => setOpen(true), 500);
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (timer) clearTimeout(timer);
    };
  }, [open, setOpen]);

  // Close on scroll or pointerdown outside (the toggle button opts out).
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("[data-sidebar-toggle]")) return;
      if (panelRef.current && !panelRef.current.contains(t)) close();
    };
    window.addEventListener("scroll", close, { passive: true, capture: true });
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, setOpen]);

  const groups = Object.values(components).reduce<
    Record<string, { slug: string; name: string }[]>
  >((acc, c) => {
    (acc[c.category] ??= []).push({ slug: c.slug, name: c.name });
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          exit={{ x: "-100%" }}
          transition={SPRING_PANEL}
          className="fixed left-0 top-0 z-90 h-full w-72"
        >
          <SidebarBlur />
          <nav
            aria-label="Components"
            className="no-scrollbar relative z-10 flex h-full flex-col gap-1 overflow-y-auto px-3 pb-32 pt-24"
          >
            {Object.entries(groups).map(([cat, items]) => (
              <div key={cat} className="mb-2 flex flex-col">
                <span className="flex items-baseline gap-2 py-4 text-base font-medium text-foreground/35">
                  {categoryLabel(cat)}
                  <span className="text-xs font-normal tabular-nums text-foreground/25">
                    {items.length}
                  </span>
                </span>
                {items.map((it) => (
                  <SidebarItem
                    key={it.slug}
                    item={it}
                    isActive={it.slug === activeSlug}
                    anyHovered={hovered !== null}
                    isHovered={hovered === it.slug}
                    onEnter={() => setHovered(it.slug)}
                    onLeave={() => setHovered(null)}
                  />
                ))}
              </div>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SidebarToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <IconButton
      size="round"
      onClick={onToggle}
      data-sidebar-toggle="true"
      aria-label="Toggle sidebar"
      aria-expanded={open}
      title="Toggle sidebar (s)"
    >
      <Icon d={icon.sidebar} size={17} />
    </IconButton>
  );
}

/* ─── Page ─── */

export default function ComponentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <ComponentPageInner params={params} />;
}

function ComponentPageInner({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("");
  const [showCode, setShowCode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [cfg, setCfg] = useState<MagneticConfig>(MAGNETIC_DEFAULTS);
  const [deleteCfg, setDeleteCfg] = useState<DeleteConfig>(DELETE_DEFAULTS);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Escape exits the expanded (fullscreen) preview.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setFullscreen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const meta = components[slug];

  // slug is empty until params resolve; only then can we tell "loading" from "unknown".
  if (!slug) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="grain-overlay" />
        <div className="flex items-center gap-2.5 text-text-muted">
          <span className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm">Loading component…</p>
        </div>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="grain-overlay" />
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-5 pt-40 pb-20 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            404
          </p>
          <h1 className="mt-3 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-[-0.03em] text-foreground">
            Component not found
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-text-secondary">
            <span className="font-mono text-foreground">{slug}</span> isn’t in
            the registry yet. It may still be on the way.
          </p>
          <Link
            href="/components"
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors duration-200 hover:bg-foreground/90"
          >
            Browse components
          </Link>
        </div>
      </div>
    );
  }

  const isMagnetic = slug === "magnetic-button";
  const preview = isMagnetic ? (
    <MagneticPlayground cfg={cfg} setCfg={setCfg} />
  ) : slug === "chart-card" ? (
    <ChartCard
      total={90744}
      data={CHART_CARD_SALES}
      defaultActive={4}
      notifications={3}
    />
  ) : slug === "delete-button" ? (
    <DeleteButtonPlayground cfg={deleteCfg} setCfg={setDeleteCfg} />
  ) : slug === "timeline" ? (
    <Timeline steps={TIMELINE_STEPS} className="w-full max-w-md" />
  ) : slug === "menu-dock" ? (
    <MenuDockPreview />
  ) : slug === "notch" ? (
    <NotchPreview />
  ) : undefined;
  const props = meta.props;
  const usage = isMagnetic
    ? magneticUsage(cfg)
    : slug === "delete-button"
      ? deleteUsage(deleteCfg)
      : meta.usage;
  const installCmd = `npx devignerui add ${slug}`;
  const deps = npmDeps(meta.code);
  const fileName = `${slug}.tsx`;

  const stageProps: StageProps = {
    preview,
    previewKey,
    code: meta.code,
    fileName,
    showCode,
    setShowCode,
    onReset: () => {
      setPreviewKey((k) => k + 1);
      setCfg(MAGNETIC_DEFAULTS);
      setDeleteCfg(DELETE_DEFAULTS);
    },
    onFullscreen: () => setFullscreen((v) => !v),
    isFullscreen: fullscreen,
    // The rail is the one preview taller than the default floor. The dock
    // needs headroom too, or the panel's own growth fights the stage's.
    stageMin:
      slug === "timeline" ? 560 : slug === "menu-dock" ? 420 : undefined,
  };

  const breadcrumb = (
    <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm">
      <Link
        href="/components"
        className="text-foreground/50 transition-colors duration-200 hover:text-foreground"
      >
        Components
      </Link>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground/30"
        role="presentation"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
      <span className="font-medium text-foreground">{meta.name}</span>
    </nav>
  );

  return (
    <div className="relative bg-background lg:h-dvh lg:overflow-hidden">
      <div className="grain-overlay" />

      {/* Fixed top bar: sidebar toggle + breadcrumb, desktop only */}
      <div className="absolute left-4 top-4 z-50 hidden items-center gap-2 lg:flex">
        <SidebarToggle open={sidebarOpen} onToggle={toggleSidebar} />
        {breadcrumb}
      </div>

      {/* Sidebar: fixed overlay panel, all breakpoints */}
      <DocSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        activeSlug={slug}
      />

      <div className="flex flex-col lg:h-dvh lg:flex-row gap-2">
        {/* Left: docs (only scroller on desktop) */}
        <div className="relative min-w-0 flex-1 lg:h-dvh">
          {/* Top fade under the fixed bar, desktop only */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 hidden h-16 bg-linear-to-b from-background via-background/70 to-transparent lg:block" />

          {/* Nudges the docs right while the sidebar overlay is open (desktop only) */}
          <div
            className={`transition-[padding-left] duration-500 ease-out lg:h-full lg:overflow-y-auto ${
              sidebarOpen ? "lg:pl-40" : "lg:pl-0"
            }`}
          >
            <div className="mx-auto flex w-full flex-col px-6 py-8 md:px-12 md:py-14 lg:pt-16">
              {/* Mobile-only breadcrumb + inline preview (desktop uses the fixed stage) */}
              <div className="mb-6 flex items-center gap-2 lg:hidden">
                <SidebarToggle open={sidebarOpen} onToggle={toggleSidebar} />
                {breadcrumb}
              </div>
              <div className="mb-10 lg:hidden">
                <PreviewCard {...stageProps} />
              </div>

              <div className="flex flex-col gap-1.5">
                <h1 className="text-3xl tracking-tighter text-foreground sm:text-4xl md:text-5xl">
                  {meta.name}
                </h1>
                <p className="mt-1 text-base/relaxed text-foreground/50 md:text-lg">
                  {meta.description}
                </p>
                <p className="text-sm text-foreground/35">
                  {categoryLabel(meta.category)}
                </p>
              </div>

              <section id="installation" className="mt-6">
                <SectionTitle>Installation</SectionTitle>

                <StepLabel>Requirements</StepLabel>
                <ul className="flex list-disc flex-col gap-2 pl-5 text-sm/relaxed text-foreground/50 marker:text-foreground/30">
                  <li>React 18+ with Tailwind CSS v4.</li>
                  <li>
                    A <InlineCode>components.json</InlineCode> at the project
                    root - <InlineCode>npx devignerui init</InlineCode> writes
                    one and creates <InlineCode>components/ui</InlineCode>.
                  </li>
                  {deps.length > 0 && (
                    <li>
                      npm packages:{" "}
                      {deps.map((dep, i) => (
                        <span key={dep}>
                          {i > 0 && ", "}
                          <InlineCode>{dep}</InlineCode>
                        </span>
                      ))}
                      .
                    </li>
                  )}
                </ul>

                <StepLabel>With the CLI</StepLabel>
                <CommandRow command={installCmd} />
                <p className="mt-3 text-sm/relaxed text-foreground/40">
                  Writes <InlineCode>components/ui/{fileName}</InlineCode> into
                  your project and prints the dependencies it needs.
                </p>

                <StepLabel>Manually</StepLabel>
                <ol className="flex list-decimal flex-col gap-6 pl-5 marker:text-sm marker:text-foreground/30">
                  {deps.length > 0 && (
                    <li>
                      <p className="mb-3 text-sm/relaxed text-foreground/50">
                        Install the dependencies.
                      </p>
                      <CommandRow command={`npm i ${deps.join(" ")}`} />
                    </li>
                  )}
                  <li>
                    <p className="text-sm/relaxed text-foreground/50">
                      Create <InlineCode>components/ui/{fileName}</InlineCode>{" "}
                      and paste the source from the preview's{" "}
                      <InlineCode>Source Code</InlineCode> panel.
                    </p>
                  </li>
                  <li>
                    <p className="text-sm/relaxed text-foreground/50">
                      Import it from{" "}
                      <InlineCode>@/components/ui/{slug}</InlineCode> - see
                      Usage below.
                    </p>
                  </li>
                </ol>
              </section>

              <section id="usage">
                <SectionTitle>Usage</SectionTitle>
                <figure className="relative overflow-hidden rounded-xl border border-border/60">
                  <div className="absolute right-2 top-2 z-10">
                    <IconCopy code={usage} text="Copy" />
                  </div>
                  <div className="p-1.5">
                    <div className="overflow-hidden rounded-lg">
                      <CodeBlock code={usage} lang="tsx" />
                    </div>
                  </div>
                </figure>
              </section>

              <section id="api-reference">
                <SectionTitle>API Reference</SectionTitle>
                <div className="overflow-hidden rounded-xl border border-border/60">
                  {props.map((p, i) => (
                    <div
                      key={p.name}
                      className={`flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:gap-4 ${
                        i > 0 ? "border-t border-border/60" : ""
                      }`}
                    >
                      <div className="w-44 shrink-0">
                        <code className="whitespace-nowrap rounded-lg bg-surface px-2 py-1 text-sm text-foreground">
                          {p.name}
                        </code>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <code className="whitespace-nowrap rounded-md bg-surface/60 px-2 py-0.5 font-mono text-sm text-foreground/60">
                            {p.type}
                          </code>
                          <div className="flex-1" />
                          {p.default && p.default !== "-" ? (
                            <code className="max-w-48 shrink-0 overflow-x-auto whitespace-nowrap rounded-md bg-surface/60 px-2 py-0.5 font-mono text-sm text-foreground">
                              {p.default}
                            </code>
                          ) : (
                            <span className="shrink-0 text-sm text-foreground/30">
                              -
                            </span>
                          )}
                        </div>
                        <p className="text-sm/relaxed text-foreground/40">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {Array.isArray(meta.notes) && meta.notes.length > 0 && (
                <section id="notes">
                  <SectionTitle>Notes</SectionTitle>
                  <ul className="flex max-w-prose list-disc flex-col gap-4 pl-5 text-[17px]/[1.7] text-foreground/75 marker:text-foreground/25">
                    {meta.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="mt-16 border-t border-border pb-24 pt-8">
                <p className="mb-3 text-3xl tracking-tight text-foreground">
                  Keep in mind
                </p>
                <p className="max-w-prose text-lg/relaxed text-foreground/80">
                  Every component here is meant to be copied into your project
                  and owned by you - edit the source freely. If a component
                  breaks in your setup,{" "}
                  <Link
                    href="/components"
                    className="underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground/60 hover:decoration-foreground/40"
                  >
                    browse the registry
                  </Link>{" "}
                  for an updated version.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: floating live-preview stage + code drawer (desktop only) */}
        <div className="hidden lg:block lg:h-dvh lg:w-1/2">
          <StagePanel {...stageProps} />
        </div>
      </div>
    </div>
  );
}
