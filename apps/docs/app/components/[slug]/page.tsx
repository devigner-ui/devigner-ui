"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ChartCard,
  DateRangePicker,
  DeleteButton,
  MagneticButton,
  MenuDock,
  Timeline,
  type MenuDockItem,
} from "@devignerui/ui";
import { CodeBlock } from "../../../components/code-block";
import { IconButton } from "../../../components/icon-button";
import { RangeSlider } from "../../../components/range-slider";
import { SidebarToggleIcon } from "../../../components/sidebar-toggle-icon";
import { useTheme } from "../../../components/theme-provider";
import { components, type ComponentData } from "@/lib/registry";
import { COMPONENT_CATEGORIES } from "@devignerui/shared";
import {
  EASE_OUT,
  SPRING_PRESS,
  SPRING_PANEL,
  SPRING_LAYOUT,
  SPRING_SWAP,
} from "@devignerui/ui/motion";
import {
  IconArchive,
  IconBook2,
  IconBrush,
  IconCode,
  IconHeart,
  IconArrowUpDown,
  IconHistory,
  IconHomeAngle2,
  IconInbox,
  IconLamp,
  IconLibrary,
  IconLogout,
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

/** The Usage drawer's snippet, written from whatever the knobs currently say
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
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-foreground">{name}</span>
        <span className="font-mono text-[12px] tabular-nums text-foreground/70">
          {/* Stepping by 0.05 lands on 0.35000000000000003 - round for display
              only, so the value handed to the component stays exact. */}
          {+value.toFixed(2)} <span className="text-foreground/35">{hint}</span>
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

/** Small pill switch for the settings panel's on/off rows - kept local since
 *  it is only ever paired with a Knob stack in this one panel. */
function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-10 shrink-0 cursor-pointer rounded-full border transition-colors",
        checked ? "border-primary bg-primary" : "border-border bg-surface2",
      )}
    >
      <motion.span
        animate={{ x: checked ? 16 : 0 }}
        transition={SPRING_PRESS}
        className="absolute left-0.5 top-0.5 size-5 rounded-full bg-background shadow-elevated"
      />
    </button>
  );
}

/** A settings-panel row: label on the left, control on the right. */
function SettingsRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-[13px] font-medium text-foreground">{label}</span>
      {children}
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

/** Past days are disabled, as in the reference recording; presets, badge and
 *  Clear are the component's defaults. */
function DateRangePickerPreview() {
  return <DateRangePicker minDate={new Date()} />;
}

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
      { label: "Bookmarked", icon: <IconBook2 /> },
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
      className="border-none! shadow-none!"
    />
  );
}

/** Live prop playground. The config (and the "show field" toggle below it)
 *  live in the page, not here: the settings panel and the Usage drawer
 *  both render from the same state, so everything tracks the knobs. */
function MagneticPlayground({
  cfg,
  showField,
}: {
  cfg: MagneticConfig;
  showField: boolean;
}) {
  return (
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

function DeleteButtonPlayground({ cfg }: { cfg: DeleteConfig }) {
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
    </div>
  );
}

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

/* ─── Stage: full-page preview, labelled toolbar, source drawer ─── */

type StageProps = {
  preview: React.ReactNode;
  previewKey: number;
  sourceCode: string;
  sourceFileName: string;
  sourceOpen: boolean;
  setSourceOpen: (v: boolean) => void;
  docsOpen: boolean;
  setDocsOpen: (v: boolean) => void;
  onReset: () => void;
  /** Props panel for this preview, if it has one. Opens as a small floating
   *  panel above the toolbar's Settings button. */
  configContent?: React.ReactNode;
};

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

/** A labelled pill button - icon and text always visible, unlike the plain
 *  icon-only toolbar buttons. Used for the two top-level toggles: Source
 *  Code and Docs. */
/** A dock icon's own active pill, matching the old IconButton's - the row
 *  itself only tints text on `active`, so a toggle that needs the filled
 *  background back draws it here, inset to the row's full tap target rather
 *  than the icon's small glyph box. */
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

/** The preview's action dock. This is the actual `<MenuDock>` component
 *  used everywhere else in the library (see the Menu Dock preview above) -
 *  not a lookalike, so it gets the same closed/open behaviour, the same
 *  Settings panel morph, and the same springs for free. */
function Toolbar({
  sourceOpen,
  setSourceOpen,
  docsOpen,
  setDocsOpen,
  onReset,
  configContent,
}: Pick<
  StageProps,
  | "sourceOpen"
  | "setSourceOpen"
  | "docsOpen"
  | "setDocsOpen"
  | "onReset"
  | "configContent"
>) {
  const { theme, toggleTheme } = useTheme();
  const [resetSpins, setResetSpins] = useState(0);
  const reduce = useReducedMotion();

  const items: MenuDockItem[] = [
    {
      id: "docs",
      label: "Docs",
      showLabel: true,
      icon: (
        <DockGlyph active={docsOpen}>
          <IconBook2 strokeWidth={2} />
        </DockGlyph>
      ),
      onSelect: () => setDocsOpen(!docsOpen),
    },
    {
      id: "reset",
      label: "Reset",
      // Keyed by the click count, so every press remounts the span and
      // replays the spin from 0 rather than skipping it on an odd click.
      icon: (
        <motion.span
          key={resetSpins}
          className="inline-flex"
          initial={{ rotate: 0 }}
          animate={{ rotate: reduce ? 0 : 360 }}
          transition={{ duration: 1, ease: EASE_OUT }}
        >
          <IconRestart strokeWidth={2} />
        </motion.span>
      ),
      onSelect: () => {
        setResetSpins((n) => n + 1);
        onReset();
      },
    },
    {
      id: "theme",
      label: "Toggle theme",
      icon:
        theme === "dark" ? (
          <IconSun2 strokeWidth={2} />
        ) : (
          <IconMoon strokeWidth={2} />
        ),
      // MenuDock rows don't forward the click event to `onSelect`, so the
      // clicked button (still focused from the click) is read back off
      // `document.activeElement` instead - that's what lets the circle-blur
      // reveal expand from this row rather than the viewport centre.
      onSelect: () => {
        const el = document.activeElement;
        const rect =
          el instanceof HTMLElement ? el.getBoundingClientRect() : undefined;
        toggleTheme(
          rect && {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          },
        );
      },
    },
    // Only a preview with props to tune gets a Settings row - the dock
    // never shows a panel with nothing in it.
    ...(configContent
      ? [
          {
            id: "settings",
            label: "Settings",
            icon: <IconSettings strokeWidth={2} />,
            content: configContent,
          },
        ]
      : []),
    {
      id: "source",
      label: "Code",
      showLabel: true,
      icon: (
        <DockGlyph active={sourceOpen}>
          <IconCode strokeWidth={2} />
        </DockGlyph>
      ),
      onSelect: () => setSourceOpen(!sourceOpen),
    },
  ];

  return (
    <MenuDock
      items={items}
      label="Preview actions"
      className="border-none! shadow-none!"
    />
  );
}

/** Full-bleed preview stage with the floating toolbar and a bottom drawer
 *  for the component's Source Code. The Usage snippet lives in the Docs
 *  panel instead of a second drawer - one toggle less to fit on the pill. */
function Stage(props: StageProps) {
  return (
    <motion.div
      layout
      transition={SPRING_LAYOUT}
      className="flex h-full min-h-0 flex-1 flex-col gap-2 p-3"
    >
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl bg-surface2">
          <div
            key={props.previewKey}
            className="flex w-full justify-center px-6"
          >
            {props.preview ?? (
              <p className="text-[13px] text-text-muted">
                Preview coming soon for this component.
              </p>
            )}
          </div>
        </div>
        <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2">
          <Toolbar {...props} />
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{
          height: props.sourceOpen ? 320 : 0,
          opacity: props.sourceOpen ? 1 : 0,
        }}
        transition={SPRING_PANEL}
        className="shrink-0 overflow-hidden rounded-2xl bg-surface2"
        aria-hidden={!props.sourceOpen}
      >
        {props.sourceOpen && (
          <div className="flex h-full flex-col">
            <DrawerHeader
              code={props.sourceCode}
              fileName={props.sourceFileName}
            />
            <div className="code-scroll min-h-0 flex-1 overflow-y-auto">
              <CodeBlock code={props.sourceCode} lang="tsx" />
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Docs panel pieces ─── */

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

/** The docs previously shown beside the preview, now behind the "Docs"
 *  toggle. Installation and API Reference only - the Usage section moved to
 *  the toolbar's Usage drawer, so the snippet isn't shown twice. */
function DocsContent({
  meta,
  deps,
  installCmd,
  fileName,
  slug,
  usage,
}: {
  meta: ComponentData;
  deps: readonly string[];
  installCmd: string;
  fileName: string;
  slug: string;
  usage: string;
}) {
  const customUsage = meta.customUsage;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl tracking-tighter text-foreground sm:text-4xl">
          {meta.name}
        </h1>
        <p className="mt-1 text-base/relaxed text-foreground/50">
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
            A <InlineCode>components.json</InlineCode> at the project root -{" "}
            <InlineCode>npx devignerui init</InlineCode> writes one and creates{" "}
            <InlineCode>components/ui</InlineCode>.
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
          Writes <InlineCode>components/ui/{fileName}</InlineCode> into your
          project and prints the dependencies it needs.
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
              Create <InlineCode>components/ui/{fileName}</InlineCode> and paste
              the source from the preview's <InlineCode>Source Code</InlineCode>{" "}
              panel.
            </p>
          </li>
          <li>
            <p className="text-sm/relaxed text-foreground/50">
              Import it from <InlineCode>@/components/ui/{slug}</InlineCode> -
              see Usage below.
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

      {customUsage && (
        <section id="custom-composition">
          <SectionTitle>Custom composition</SectionTitle>
          <figure className="relative overflow-hidden rounded-xl border border-border/60">
            <div className="absolute right-2 top-2 z-10">
              <IconCopy code={customUsage} text="Copy" />
            </div>
            <div className="p-1.5">
              <div className="overflow-hidden rounded-lg">
                <CodeBlock code={customUsage} lang="tsx" />
              </div>
            </div>
          </figure>
        </section>
      )}

      <section id="api-reference">
        <SectionTitle>API Reference</SectionTitle>
        <div className="overflow-hidden rounded-xl border border-border/60">
          {meta.props.map((p, i) => (
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
          Every component here is meant to be copied into your project and owned
          by you - edit the source freely. If a component breaks in your setup,{" "}
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
  );
}

/* ─── Sidebar (overlay panel with ruler-tick nav) ─── */

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
          className="pointer-events-none absolute top-1/2 z-40 h-[1.8px] -translate-y-1/2 rounded-full bg-brand"
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
      <div className="absolute inset-0 bg-linear-to-r from-surface2 via-surface2/80 to-transparent" />
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

/** Square "D" mark, matching the landing navbar's brand. Sits beside the
 *  sidebar toggle at all times - see the top bar's z-index note for how the
 *  two read as part of the sidebar once it opens. */
function BrandMark() {
  return (
    <Link
      href="/"
      aria-label="Devigner"
      className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-foreground text-[13px] font-bold text-background"
    >
      D
    </Link>
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
      <SidebarToggleIcon isOpen={open} className="size-4.75" />
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

const CUSTOM_COMPOSITION_USAGE: Record<string, string> = {
  "chart-card": `import { ChartCard } from "@devignerui/ui";

<ChartCard data={sales} classNames={{ point: "rounded-sm" }} renderTooltip={({ point }) => <strong>{point.value}</strong>} />`,
  timeline: `import { Timeline } from "@devignerui/ui";

<Timeline steps={steps} renderStep={({ step, active }) => <span data-active={active}>{step.title}</span>} />`,
  "delete-button": `import { DeleteButton } from "@devignerui/ui";

<DeleteButton onConfirm={remove} renderConfirmation={({ status }) => <span>{status}</span>} />`,
  "menu-dock": `import { MenuDock } from "@devignerui/ui";

<MenuDock items={items} renderIcon={({ defaultIcon }) => <span className="text-brand">{defaultIcon}</span>} />`,
  "date-range-picker": `import { DateRangePicker } from "@devignerui/ui";

<DateRangePicker title="Stay" presets={presets} classNames={{ day: "text-base" }} renderBadge={(range) => (range ? "Booked" : "Add dates")} />`,
};

function ComponentPageInner({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [cfg, setCfg] = useState<MagneticConfig>(MAGNETIC_DEFAULTS);
  const [showField, setShowField] = useState(true);
  const [deleteCfg, setDeleteCfg] = useState<DeleteConfig>(DELETE_DEFAULTS);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

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
  const isDeleteButton = slug === "delete-button";
  const preview = isMagnetic ? (
    <MagneticPlayground cfg={cfg} showField={showField} />
  ) : slug === "chart-card" ? (
    <ChartCard total={90744} data={CHART_CARD_SALES} defaultActive={4} />
  ) : isDeleteButton ? (
    <DeleteButtonPlayground cfg={deleteCfg} />
  ) : slug === "timeline" ? (
    <Timeline steps={TIMELINE_STEPS} className="w-full max-w-md" />
  ) : slug === "menu-dock" ? (
    <MenuDockPreview />
  ) : slug === "date-range-picker" ? (
    <DateRangePickerPreview />
  ) : undefined;
  const usage = isMagnetic
    ? magneticUsage(cfg)
    : isDeleteButton
      ? deleteUsage(deleteCfg)
      : meta.usage;
  const installCmd = `npx devignerui add ${slug}`;
  const deps = meta.dependencies;
  const fileName = `${slug}.tsx`;

  // The Settings panel, per preview - undefined leaves the toolbar's
  // Settings button off entirely rather than opening onto an empty panel.
  const configContent = isMagnetic ? (
    <div className="flex w-72 flex-col divide-y divide-border/60">
      <div className="flex flex-col gap-4 px-3 pb-3">
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
      </div>
      <div className="px-3">
        <SettingsRow label="Show field">
          <Switch
            checked={showField}
            onChange={setShowField}
            label="Show field"
          />
        </SettingsRow>
      </div>
    </div>
  ) : isDeleteButton ? (
    <div className="flex w-72 flex-col divide-y divide-border/60 px-3">
      <SettingsRow label="Actions">
        <SideTabs
          value={deleteCfg.side}
          onChange={(v) => setDeleteCfg((c) => ({ ...c, side: v }))}
        />
      </SettingsRow>
      <div className="py-3">
        <Knob
          name="resetAfter"
          hint="ms, 0 keeps the tick"
          min={0}
          max={4000}
          step={200}
          value={deleteCfg.resetAfter}
          onChange={(v) => setDeleteCfg((c) => ({ ...c, resetAfter: v }))}
        />
      </div>
      <SettingsRow label="Async confirm">
        <Switch
          checked={deleteCfg.async}
          onChange={(v) => setDeleteCfg((c) => ({ ...c, async: v }))}
          label="Async confirm"
        />
      </SettingsRow>
      <SettingsRow label="Disabled">
        <Switch
          checked={deleteCfg.disabled}
          onChange={(v) => setDeleteCfg((c) => ({ ...c, disabled: v }))}
          label="Disabled"
        />
      </SettingsRow>
    </div>
  ) : undefined;

  const stageProps: StageProps = {
    preview,
    previewKey,
    sourceCode: meta.code,
    sourceFileName: fileName,
    sourceOpen,
    setSourceOpen,
    docsOpen,
    setDocsOpen,
    onReset: () => {
      setPreviewKey((k) => k + 1);
      setCfg(MAGNETIC_DEFAULTS);
      setShowField(true);
      setDeleteCfg(DELETE_DEFAULTS);
    },
    configContent,
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
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      <div className="grain-overlay" />

      {/* Top bar: logo + sidebar toggle + breadcrumb. z-index above the
          sidebar overlay (z-90) so this row stays on top of it rather than
          being covered - the logo and toggle end up sitting exactly where
          the opened sidebar's own header would be, reading as part of it
          without actually moving into its DOM. Breadcrumb hides once the
          sidebar covers that space. */}
      <div className="relative z-100 flex shrink-0 items-center gap-2 p-4">
        <BrandMark />
        <SidebarToggle open={sidebarOpen} onToggle={toggleSidebar} />
        <AnimatePresence initial={false}>
          {!sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={SPRING_PANEL}
            >
              {breadcrumb}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar: fixed overlay panel */}
      <DocSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        activeSlug={slug}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Docs panel: hidden by default, slides in beside the preview */}
        <div
          className={cn(
            "min-h-0",
            docsOpen
              ? "flex-1 overflow-y-auto lg:w-[min(46%,640px)] lg:shrink-0 lg:flex-none"
              : "hidden lg:block lg:w-0 lg:shrink-0 lg:overflow-hidden",
          )}
        >
          {docsOpen && (
            <div className="px-6 py-8 md:px-10 lg:py-14">
              <DocsContent
                meta={meta}
                deps={deps}
                installCmd={installCmd}
                fileName={fileName}
                slug={slug}
                usage={usage}
              />
            </div>
          )}
        </div>

        {/* Preview stage: full page, hidden on mobile while docs are open */}
        <div className={cn("min-h-0 flex-1", docsOpen && "hidden lg:flex")}>
          <Stage {...stageProps} />
        </div>
      </div>
    </div>
  );
}
