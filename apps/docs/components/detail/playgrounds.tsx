"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ChartCard,
  ContactLens,
  CopyButton,
  DateRangePicker,
  DeleteButton,
  GlassMenu,
  GooSwitch,
  ImageGeneration,
  Slider,
  StardustSlider,
  InlineTimeEdit,
  KpiChart,
  MagneticButton,
  NavNotch,
  ExpandTabs,
  FlipButton,
  Badge,
  // The page keeps its own Tabs for the Settings panel (sounds, a wrapping
  // grid); the library one is the preview.
  Tabs as LibTabs,
  Timeline,
  type FileUploadStatus,
  type ImageGenerationStatus,
} from "devignerui";
import { SPRING_PANEL } from "devignerui/motion";
import { cn } from "cn";
import {
  IconAdd,
  IconArrowRight,
  IconBell,
  IconChatRoundDots,
  IconHeart,
  IconClock,
  IconHomeSmileAngle,
  IconMenuDots,
  IconMusicLibrary2,
  IconSetting2,
  IconStarCircle,
  IconTickCircle,
} from "@devigner-ui/icons";
import { MenuDockPreview } from "../../demos/menu-dock";
import { DateRangePickerTrigger } from "../../demos/date-range-picker";
import { NAV_NOTCH_ITEMS } from "../../demos/nav-notch";
import { EXPAND_TABS_ITEMS } from "../../demos/expand-tabs";
import { KPI_FALLING, KPI_REVENUE } from "../../demos/kpi-chart";
import BadgeDemo from "../../demos/badge";
import {
  IMAGE_GENERATION_PROMPT,
  IMAGE_GENERATION_FOCUS,
  IMAGE_GENERATION_SRC,
  useGenerationRun,
} from "../../demos/image-generation";
import { CONTACT_LENS_ITEMS } from "../../demos/contact-lens";
import FileUploadDemo, {
  ACCEPT,
  CARD_DEFAULTS,
  FILE_STATUSES,
  FileUploadCardDemo,
  UPLOADER_DEFAULTS,
  type CardConfig,
  type UploaderConfig,
} from "../../demos/file-upload";
import { RangeSlider } from "../range-slider";
import { cue } from "@/lib/sound";

/** Fastest a dragged slider ticks, ms. A quick drag crosses many steps a
 *  frame; past this the ticks blur into a buzz. */
const TICK_GAP = 45;
let lastTick = 0;
/** A detent per step crossed, quiet: it repeats on every drag. */
const tick = () => {
  const now = performance.now();
  if (now - lastTick > TICK_GAP) {
    lastTick = now;
    cue("tick", { volume: 0.5 });
  }
};

/* ─── Magnetic Button ─── */

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

/** The Usage snippet, written from whatever the knobs currently say - copying
 *  it gives you the button you are looking at, not a fixed example. */
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

/* ─── Delete Button ─── */

/* ─── Copy Button ─── */

const COPY_SIZES = ["sm", "md", "lg"] as const;
const COPY_DEFAULTS = {
  size: "md" as (typeof COPY_SIZES)[number],
  iconOnly: false,
  async: false,
  fail: false,
  resetAfter: 1000,
};
type CopyConfig = typeof COPY_DEFAULTS;

const copyValue = (c: CopyConfig) =>
  c.fail
    ? () => Promise.reject(new Error("Copy failed"))
    : c.async
      ? () =>
          new Promise<string>((r) =>
            setTimeout(() => r("pnpm add devignerui"), 900),
          )
      : "pnpm add devignerui";

const copyUsage = (c: CopyConfig) => {
  const props = [
    c.fail
      ? 'value={() => Promise.reject(new Error("Copy failed"))}'
      : c.async
        ? 'value={() => fetch("/api/command").then((r) => r.text())}'
        : 'value="pnpm add devignerui"',
    c.size !== "md" ? `size="${c.size}"` : null,
    c.iconOnly ? "iconOnly" : null,
    c.resetAfter !== 1000 ? `resetAfter={${c.resetAfter}}` : null,
  ]
    .filter(Boolean)
    .map((line) => `      ${line}`)
    .join("\n");

  return `import { CopyButton } from "@/components/ui/copy-button";

export function Example() {
  return (
    <CopyButton
${props}
    />
  );
}`;
};

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

/* ─── Inline Time Edit ─── */

const TIME_DEFAULTS = {
  maxHours: 99,
  shortTime: true,
  disabled: false,
};
type TimeConfig = typeof TIME_DEFAULTS;

const timeUsage = (c: TimeConfig) => {
  const props = [
    "value={minutes}",
    "onValueChange={setMinutes}",
    c.maxHours !== TIME_DEFAULTS.maxHours ? `maxHours={${c.maxHours}}` : null,
    c.shortTime ? null : "shortTime={false}",
    c.disabled ? "disabled" : null,
  ]
    .filter(Boolean)
    .map((line) => `      ${line}`)
    .join("\n");

  return `import { useState } from "react";
import { InlineTimeEdit } from "@/components/ui/inline-time-edit";

export function Example() {
  const [minutes, setMinutes] = useState(150);
  return (
    <InlineTimeEdit
${props}
    />
  );
}`;
};

/* ─── Goo Switch ─── */

const GOO_SIZES = ["sm", "md", "lg"] as const;
const GOO_DEFAULTS = {
  size: 2,
  inset: 4,
  stretch: true,
  sling: 0.5,
  trail: 3.2,
  disabled: false,
};
type GooConfig = typeof GOO_DEFAULTS;

const gooUsage = (c: GooConfig) => {
  const props = [
    "checked={on}",
    "onCheckedChange={setOn}",
    'aria-label="Wi-Fi"',
    GOO_SIZES[c.size] !== "md" ? `size="${GOO_SIZES[c.size]}"` : null,
    c.inset !== 4 ? `inset={${c.inset}}` : null,
    c.stretch ? null : "stretch={false}",
    c.stretch && c.sling !== 0.5
      ? `sling={${c.sling >= 1 ? "false" : c.sling}}`
      : null,
    c.trail !== 3.2 ? `trail={${c.trail}}` : null,
    c.disabled ? "disabled" : null,
  ]
    .filter(Boolean)
    .map((line) => `      ${line}`)
    .join("\n");

  return `import { useState } from "react";
import { GooSwitch } from "@/components/ui/goo-switch";

export function Example() {
  const [on, setOn] = useState(true);
  return (
    <GooSwitch
${props}
    />
  );
}`;
};

/* ─── Liquid Glass ─── */

const GLASS_DEFAULTS = {
  transparency: 0.05,
  disabled: false,
};
type GlassConfig = typeof GLASS_DEFAULTS;

type NotchConfig = { vertical: boolean; left: boolean };
const NOTCH_DEFAULTS: NotchConfig = { vertical: false, left: false };

const notchUsage = (c: NotchConfig) => {
  const props = [
    "items={items}",
    'defaultValue="Link 5"',
    c.vertical ? 'orientation="vertical"' : null,
    c.vertical && c.left ? 'side="left"' : null,
  ]
    .filter(Boolean)
    .map((line) => `      ${line}`)
    .join("\n");

  return `import { NavNotch } from "@/components/ui/nav-notch";

const items = Array.from({ length: 10 }, (_, i) => ({ label: \`Link \${i + 1}\` }));

export function Example() {
  return (
    <NavNotch
${props}
    />
  );
}`;
};

/* ─── Expand Tabs ─── */

const TABS_DEFAULTS = { badge: true };
type TabsConfig = typeof TABS_DEFAULTS;

const tabsUsage = (c: TabsConfig) => `import {
  IconBriefcase,
  IconKeyboard,
  IconProfile,
  IconTerminalAlt,
} from "@devigner-ui/icons";
import { ExpandTabs } from "@/components/ui/expand-tabs";

const items = [
  { label: "Commands", icon: <IconTerminalAlt variant="Bulk" />${c.badge ? ', badge: "New"' : ""} },
  { label: "About", icon: <IconProfile variant="Bulk" /> },
  { label: "Portfolio", icon: <IconBriefcase variant="Bulk" /> },
  { label: "Shortcuts", icon: <IconKeyboard variant="Bulk" /> },
];

export function Example() {
  return <ExpandTabs items={items} />;
}`;

/* ─── Flip Button ─── */

const FLIP_VARIANTS = [
  "primary",
  "secondary",
  "outline",
  "glass",
  "inverse",
  "ghost",
] as const;
const FLIP_SIZES = ["sm", "md", "lg", "xl"] as const;
/** The badge icon, and with it how it moves: an arrow slides, a plus turns. */
const FLIP_ICONS = ["arrow", "plus", "none"] as const;
const FLIP_DIRECTIONS = ["up", "down"] as const;
/** What rolls in (`flipLabel`): a copy of the label, or a second one. */
const FLIP_BACKS = ["same", "Let's go"] as const;
/** What rolls it (`flipped`): hover and focus, or a held state ("Copied")
 *  that hover no longer touches. */
const FLIP_TRIGGERS = ["hover", "state"] as const;
const FLIP_DEFAULTS = {
  variant: "primary" as (typeof FLIP_VARIANTS)[number],
  size: "xl" as (typeof FLIP_SIZES)[number],
  icon: "arrow" as (typeof FLIP_ICONS)[number],
  direction: "up" as (typeof FLIP_DIRECTIONS)[number],
  back: "same" as (typeof FLIP_BACKS)[number],
  trigger: "hover" as (typeof FLIP_TRIGGERS)[number],
  flipped: false,
  loading: false,
};
type FlipConfig = typeof FLIP_DEFAULTS;

const FLIP_ICON_JSX = { arrow: "<IconArrowRight />", plus: "<IconAdd />" };

const flipUsage = (c: FlipConfig) => {
  const props = [
    c.variant !== "primary" ? `variant="${c.variant}"` : null,
    c.size !== "md" ? `size="${c.size}"` : null,
    c.icon !== "none" ? `iconRight={${FLIP_ICON_JSX[c.icon]}}` : null,
    c.icon === "plus" ? 'iconMotion="rotate"' : null,
    c.direction !== "up" ? `flipDirection="${c.direction}"` : null,
    c.back !== "same" ? `flipLabel="${c.back}"` : null,
    c.trigger === "state" ? `flipped={${c.flipped}}` : null,
    c.loading ? "loading" : null,
  ].filter(Boolean);
  const icons = [
    c.icon === "plus" ? "IconAdd" : null,
    c.icon === "arrow" ? "IconArrowRight" : null,
  ].filter(Boolean);
  const imports = [
    icons.length
      ? `import { ${icons.join(", ")} } from "@devigner-ui/icons";`
      : null,
    'import { FlipButton } from "@/components/ui/flip-button";',
  ].filter(Boolean);
  const button =
    props.length > 2
      ? `(
    <FlipButton
${props.map((p) => `      ${p}`).join("\n")}
    >
      Get started
    </FlipButton>
  )`
      : `<FlipButton${props.length ? " " + props.join(" ") : ""}>Get started</FlipButton>`;
  return `${imports.join("\n")}

export function Example() {
  return ${button};
}`;
};

/* ─── Tabs ─── */

const SEG_SIZES = ["sm", "md", "lg"] as const;
const SEG_DEFAULTS = {
  size: "lg" as (typeof SEG_SIZES)[number],
  fill: false,
  icons: true,
  disabled: false,
};
type SegConfig = typeof SEG_DEFAULTS;

const segUsage = (c: SegConfig) => {
  const options = c.icons
    ? `[
        { value: "Playlist", icon: <IconMusicLibrary2 />, activeIcon: <IconMusicLibrary2 variant="Bulk" /> },
        { value: "History", icon: <IconClock />, activeIcon: <IconClock variant="Bulk" /> },
        { value: "Settings", icon: <IconSetting2 />, activeIcon: <IconSetting2 variant="Bulk" /> },
      ]`
    : `["Playlist", "History", "Settings"]`;
  const props = [
    'label="Section"',
    c.size !== "md" ? `size="${c.size}"` : null,
    c.fill ? "fill" : null,
    c.disabled ? "disabled" : null,
    `options={${options}}`,
  ].filter(Boolean);
  return `${c.icons ? 'import { IconClock, IconMusicLibrary2, IconSetting2 } from "@devigner-ui/icons";\n' : ""}import { Tabs } from "@/components/ui/tabs";

export function Example() {
  return (
    <Tabs
${props.map((p) => `      ${p}`).join("\n")}
    />
  );
}`;
};

/* ─── Badge ─── */

const BADGE_TONES = [
  "neutral",
  "success",
  "warning",
  "danger",
  "info",
] as const;
const BADGE_SIZES = ["sm", "md", "lg"] as const;
const BADGE_DEFAULTS = {
  tone: "success" as (typeof BADGE_TONES)[number],
  size: "md" as (typeof BADGE_SIZES)[number],
  icon: true,
  count: false,
  dashed: false,
  removable: false,
};
type BadgeConfig = typeof BADGE_DEFAULTS;

const badgeUsage = (c: BadgeConfig) => {
  const props = [
    c.tone !== "neutral" ? `tone="${c.tone}"` : null,
    c.size !== "md" ? `size="${c.size}"` : null,
    c.icon ? "icon={<IconTickCircle />}" : null,
    c.count ? "count={3}" : null,
    c.dashed ? "dashed" : null,
    c.removable ? "onRemove={() => setShown(false)}" : null,
  ].filter(Boolean);
  // Short badges stay on one line; longer ones get a prop per line.
  const badge =
    props.length > 2
      ? `(
    <Badge
${props.map((p) => `      ${p}`).join("\n")}
    >
      Approved
    </Badge>
  )`
      : `<Badge${props.length ? " " + props.join(" ") : ""}>Approved</Badge>`;
  const state = [
    c.removable ? "  const [shown, setShown] = useState(true);" : null,
    c.removable ? "  if (!shown) return null;" : null,
  ].filter(Boolean);
  const imports = [
    state.length ? 'import { useState } from "react";' : null,
    c.icon ? 'import { IconTickCircle } from "@devigner-ui/icons";' : null,
    'import { Badge } from "@/components/ui/badge";',
  ].filter(Boolean);
  return `${imports.join("\n")}

export function Example() {
${state.length ? state.join("\n") + "\n" : ""}  return ${badge};
}`;
};

/* ─── KPI Chart ─── */

/** "none" leaves currency off; the rest are ISO codes the locale places. */
const KPI_CURRENCIES = ["none", "USD", "EUR", "SEK", "XOF"] as const;
const KPI_LOCALES = ["en-US", "de-DE", "fr-FR", "ja-JP"] as const;

const KPI_DEFAULTS = {
  defaultIndex: 4,
  currency: "none" as (typeof KPI_CURRENCIES)[number],
  locale: "en-US" as (typeof KPI_LOCALES)[number],
  falling: false,
};
type KpiConfig = typeof KPI_DEFAULTS;

const kpiUsage = (c: KpiConfig) => {
  const props = [
    "data={revenue}",
    'label="Monthly revenue"',
    c.defaultIndex !== KPI_DEFAULTS.defaultIndex
      ? `defaultIndex={${c.defaultIndex}}`
      : null,
    c.currency !== "none" ? `currency="${c.currency}"` : null,
    c.locale !== KPI_DEFAULTS.locale ? `locale="${c.locale}"` : null,
  ]
    .filter(Boolean)
    .map((line) => `      ${line}`)
    .join("\n");

  const rows = (c.falling ? KPI_FALLING : KPI_REVENUE)
    .map((p) => `  { label: "${p.label}", value: ${p.value} },`)
    .join("\n");

  return `import { KpiChart } from "@/components/ui/kpi-chart";

const revenue = [
${rows}
];

export function Example() {
  return (
    <KpiChart
${props}
    />
  );
}`;
};

/* ─── Image Generation ─── */

const GEN_STATUSES = [
  "auto",
  "queued",
  "generating",
  "refining",
  "complete",
  "error",
] as const;

/** Each ratio with a preview width that keeps the tall ones from towering
 *  over the stage. */
const GEN_RATIOS = {
  "1:1": { width: "w-72" },
  "4:5": { width: "w-64" },
  "3:4": { width: "w-60" },
  "9:16": { width: "w-48" },
  "16:9": { width: "w-md" },
} as const;
type GenRatio = keyof typeof GEN_RATIOS;
const GEN_RATIO_KEYS = Object.keys(GEN_RATIOS) as GenRatio[];
const genAspect = (r: GenRatio) => r.replace(":", " / ");

const GEN_DEFAULTS = {
  status: "auto" as (typeof GEN_STATUSES)[number],
  ratio: "1:1" as GenRatio,
  interactive: true,
  showStatus: true,
  download: true,
};
type GenConfig = typeof GEN_DEFAULTS;

const genUsage = (c: GenConfig) => {
  const props = [
    c.status === "auto" ? "status={status}" : `status="${c.status}"`,
    "src={url}",
    `prompt="${IMAGE_GENERATION_PROMPT}"`,
    c.ratio === "1:1" ? null : `aspectRatio="${genAspect(c.ratio)}"`,
    `focus={{ x: ${IMAGE_GENERATION_FOCUS.x}, y: ${IMAGE_GENERATION_FOCUS.y} }}`,
    c.interactive ? null : "interactive={false}",
    c.showStatus ? null : "showStatus={false}",
    c.status === "error" ? "onRetry={retry}" : null,
    c.download ? 'download="rooftop.jpg"' : null,
  ]
    .filter(Boolean)
    .map((line) => `      ${line}`)
    .join("\n");

  return `import { ImageGeneration } from "@/components/ui/image-generation";

export function Example() {
  return (
    <ImageGeneration
${props}
    />
  );
}`;
};

const LENS_DEFAULTS = { resetAfter: 1200 };
type LensConfig = typeof LENS_DEFAULTS;

const lensUsage = (
  c: LensConfig,
) => `import { IconGlobal, IconSms, IconUser } from "@devigner-ui/icons";
import { ContactLens } from "@/components/ui/contact-lens";

const items = [
  { label: "Email", icon: <IconSms /> },
  { label: "Website", icon: <IconGlobal />, text: "devigner.cc", copy: "https://devigner.cc" },
  { label: "Name", icon: <IconUser />, text: "hello" },
];

export function Example() {
  return <ContactLens value="hello@devigner.cc" items={items}${
    c.resetAfter === LENS_DEFAULTS.resetAfter
      ? ""
      : ` resetAfter={${c.resetAfter}}`
  } />;
}`;

const GLASS_MENU = [
  {
    id: "feed",
    label: "Feed",
    icon: <IconHomeSmileAngle className="size-5" variant="Bulk" />,
  },
  {
    id: "star",
    label: "Star",
    icon: <IconStarCircle className="size-5" variant="Bulk" />,
  },
  {
    id: "messages",
    label: "Messages",
    icon: <IconChatRoundDots className="size-5" variant="Bulk" />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <IconSetting2 className="size-5" variant="Bulk" />,
  },
];

const glassUsage = (c: GlassConfig) => {
  const props = [
    "items={items}",
    c.transparency !== GLASS_DEFAULTS.transparency
      ? `transparency={${c.transparency}}`
      : null,
    c.disabled ? "disabled" : null,
    "onSelect={(id) => console.log(id)}",
  ]
    .filter(Boolean)
    .map((line) => `      ${line}`)
    .join("\n");

  return `import { GlassMenu } from "@/components/ui/liquid-glass";
import {
  IconChatRoundDots,
  IconHeart,
  IconHomeSmileAngle,
  IconSetting2,
} from "@devigner-ui/icons";

const items = [
  { id: "feed", label: "Feed", icon: <IconHomeSmileAngle className="size-6" /> },
  { id: "star", label: "Star", icon: <IconHeart className="size-6" /> },
  { id: "messages", label: "Messages", icon: <IconChatRoundDots className="size-6" /> },
  { id: "settings", label: "Settings", icon: <IconSetting2 className="size-6" /> },
];

export function Example() {
  return (
    <GlassMenu
${props}
    />
  );
}`;
};

/* ─── Slider ─── */

const SLIDER_SIZES = ["sm", "md", "lg"] as const;
const SLIDER_DEFAULTS = {
  size: "md" as (typeof SLIDER_SIZES)[number],
  step: 10,
  marks: true,
  snap: false,
  horizontal: true,
  inverted: false,
  disabled: false,
};
type SliderConfig = typeof SLIDER_DEFAULTS;

const sliderUsage = (c: SliderConfig) => {
  const props = [
    "value={value}",
    "onValueChange={setValue}",
    'aria-label="Heat"',
    c.horizontal ? null : 'orientation="vertical"',
    c.size !== "md" ? `size="${c.size}"` : null,
    c.step !== 10 ? `step={${c.step}}` : null,
    c.snap ? "snap" : null,
    c.marks ? null : "marks={false}",
    c.inverted ? "inverted" : null,
    c.disabled ? "disabled" : null,
  ]
    .filter(Boolean)
    .map((line) => `      ${line}`)
    .join("\n");

  return `import { useState } from "react";
import { Slider } from "@/components/ui/slider";

export function Example() {
  const [value, setValue] = useState(40);
  return (
    <Slider
${props}
    />
  );
}`;
};

/* ─── Stardust Slider ─── */

const DUST_COLORS = {
  blue: "#365ee9",
  violet: "#8b2be2",
  emerald: "#10b981",
  rose: "#f43f5e",
} as const;
const DUST_COLOR_NAMES = ["blue", "violet", "emerald", "rose"] as const;
const DUST_SIZES = ["sm", "md", "lg"] as const;
/** Labelled marks for the detent demo, pulled onto while dragging. */
const DUST_DETENTS = [
  { value: 25, label: "25" },
  { value: 50, label: "ATM" },
  { value: 75, label: "75" },
];
const DUST_DEFAULTS = {
  color: "blue" as (typeof DUST_COLOR_NAMES)[number],
  size: "md" as (typeof DUST_SIZES)[number],
  step: 1,
  marks: true,
  detents: false,
  vertical: false,
  bare: false,
  rtl: false,
  disabled: false,
};
type DustConfig = typeof DUST_DEFAULTS;

const dustUsage = (c: DustConfig) => {
  const props = [
    c.bare ? 'aria-label="Strike"' : 'label="Select strike:"',
    "value={value}",
    "onValueChange={setValue}",
    c.color !== "blue" ? `color="${DUST_COLORS[c.color]}"` : null,
    c.size !== "md" ? `size="${c.size}"` : null,
    c.step !== 1 ? `step={${c.step}}` : null,
    c.detents
      ? 'snap="marks"\n      marks={[\n        { value: 25, label: "25" },\n        { value: 50, label: "ATM" },\n        { value: 75, label: "75" },\n      ]}'
      : c.marks
        ? null
        : "marks={[]}",
    c.vertical ? 'orientation="vertical"' : null,
    c.bare ? 'variant="bare"' : null,
    c.rtl && !c.vertical ? 'dir="rtl"' : null,
    c.disabled ? "disabled" : null,
  ]
    .filter(Boolean)
    .map((line) => `      ${line}`)
    .join("\n");

  return `import { useState } from "react";
import { StardustSlider } from "@/components/ui/stardust-slider";

export function Example() {
  const [value, setValue] = useState(28);
  return (
    <StardustSlider
${props}
    />
  );
}`;
};

/* ─── Date Range Picker ─── */

const PICKER_MODES = ["inline", "trigger"] as const;
type PickerMode = (typeof PICKER_MODES)[number];

const pickerUsage = (mode: PickerMode) =>
  mode === "inline"
    ? `import { DateRangePicker } from "@/components/ui/date-range-picker";

export function Example() {
  return <DateRangePicker minDate={new Date()} />;
}`
    : `import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SPRING_RETRACT } from "devignerui/motion";
import {
  DateRangePicker,
  type DateRange,
} from "@/components/ui/date-range-picker";

export function Example() {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | null>(null);
  return (
    <div className="relative">
      <button aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {range ? "Change dates" : "Add dates"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={SPRING_RETRACT}
            className="absolute top-12 origin-top"
          >
            <DateRangePicker appear value={range} onValueChange={setRange} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}`;

/* ─── File Upload ─── */

const UPLOAD_MODES = ["uploader", "card"] as const;
type UploadMode = (typeof UPLOAD_MODES)[number];

const uploaderUsage = (c: UploaderConfig) => {
  const props = [
    "upload={upload}",
    `accept="${ACCEPT}"`,
    `maxSize={${c.maxSize} * 1024 * 1024}`,
    `maxFiles={${c.maxFiles}}`,
    c.concurrency !== 2 ? `concurrency={${c.concurrency}}` : null,
    c.multiple ? null : "multiple={false}",
    c.resumable ? "resumable" : null,
    c.disabled ? "disabled" : null,
    "onCancel={close}",
    "onSubmit={save}",
  ]
    .filter(Boolean)
    .map((line) => `      ${line}`)
    .join("\n");

  return `import {
  FileUploader,
  type FileUploaderContext,
} from "@/components/ui/file-upload";

async function upload(file: File, { onProgress, signal }: FileUploaderContext) {
  // Send the file, calling onProgress(0 to 1) as bytes go out.
}

export function Example({ close, save }: { close: () => void; save: (files: File[]) => void }) {
  return (
    <FileUploader
${props}
    />
  );
}`;
};

/** Only the handlers the chosen status shows a button for. */
const CARD_HANDLERS: Record<FileUploadStatus, string[]> = {
  queued: ["onResume={start}", "onCancel={cancel}"],
  uploading: ["onPause={pause}", "onCancel={cancel}"],
  paused: ["onResume={resume}", "onCancel={cancel}"],
  completed: [
    "onRemove={remove}",
    "onChange={replace}",
    "onDownload={download}",
  ],
  error: ["onRetry={retry}", "onCancel={cancel}"],
};

const cardUsage = (c: CardConfig) => {
  const status = FILE_STATUSES[c.status];
  const props = [
    `name="${c.preview ? "moodboard.png" : "brand-assets.zip"}"`,
    `size={${c.preview ? 1.6 : 2.4} * 1024 * 1024}`,
    `status="${status}"`,
    status === "uploading" || status === "paused"
      ? `progress={${+(c.progress / 100).toFixed(2)}}`
      : null,
    status === "error" ? 'error="Connection lost, try again"' : null,
    c.preview ? "preview={URL.createObjectURL(file)}" : null,
    ...(c.actions ? CARD_HANDLERS[status] : []),
  ]
    .filter(Boolean)
    .map((line) => `      ${line}`)
    .join("\n");

  return `import { FileUpload } from "@/components/ui/file-upload";

export function Example() {
  return (
    <FileUpload
${props}
    />
  );
}`;
};

/* ─── Settings panel controls ─── */

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
        {/* A prop name, not a label, so it reads as code beside the rows. */}
        <span className="font-mono text-[12px] text-foreground">{name}</span>
        <span className="font-mono text-[12px] tabular-nums text-text-secondary">
          {/* Stepping by 0.05 lands on 0.35000000000000003 - round for display
              only, so the value handed to the component stays exact. */}
          {+value.toFixed(2)} <span className="text-text-muted">{hint}</span>
        </span>
      </div>
      <RangeSlider
        aria-label={name}
        value={value}
        min={min}
        max={max}
        step={step}
        showTicks={false}
        onValueChange={(v) => {
          if (v !== value) tick();
          onChange(v);
        }}
        className="h-7"
      />
    </div>
  );
}

/** Small pill switch for the settings panel's on/off rows. */
function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <GooSwitch
      size="sm"
      checked={checked}
      disabled={disabled}
      onCheckedChange={(v) => {
        cue(v ? "toggleOn" : "toggleOff");
        onChange(v);
      }}
      aria-label={label}
    />
  );
}

/** A settings-panel row: label on the left, control on the right. */
function SettingsRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-[13px] font-medium text-foreground">{label}</span>
      {children}
    </div>
  );
}

/** Short rows (switches, tabs, buttons) two across once the panel is as
 *  wide as the full dock, one per line below that. Rows are ruled off like
 *  the panel's other sections: every one after the first, or after the
 *  first pair in two columns. */
function SettingsRows({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid fade-divide [&>*:nth-child(n+2)]:border-t @md:grid-cols-2 @md:gap-x-6 @md:[&>*:nth-child(2)]:border-t-0">
      {children}
    </div>
  );
}

/** Knobs two across on a full-width panel, stacked below that. */
const KNOB_GRID = "grid gap-x-6 @md:grid-cols-2";

/** Reads as tabs, behaves as a radio group - each press swaps a prop on the
 *  same preview rather than revealing a different panel. */
function Tabs<T extends string>({
  value,
  options,
  onChange,
  label,
  fill = false,
  wrap = false,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  label: string;
  /** Spans the row and splits it evenly, for a group too wide to sit beside
   *  a label (five tones). */
  fill?: boolean;
  /** Two rows of three on a narrow panel, one row of six on a full-width
   *  one, for a group too wide even to fill a row (six statuses). */
  wrap?: boolean;
}) {
  // The pill is placed from the active button's offset inside this list, not
  // with a layoutId: shared layout measures against the page, so a scrolling
  // or resizing ancestor (the Settings panel) made every pill glide in from
  // where it used to sit on screen. Offsets in here only move when the tabs
  // themselves do. Glides on a new value, jumps on a resize.
  const list = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [pill, setPill] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    glide: boolean;
  } | null>(null);
  const placed = useRef(false);
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const place = (glide: boolean) => {
      const on = el.querySelector<HTMLElement>('[aria-checked="true"]');
      if (!on) return;
      setPill({
        x: on.offsetLeft,
        y: on.offsetTop,
        width: on.offsetWidth,
        height: on.offsetHeight,
        glide,
      });
    };
    place(placed.current);
    placed.current = true;
    const ro = new ResizeObserver(() => place(false));
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);

  return (
    <div
      ref={list}
      role="radiogroup"
      aria-label={label}
      className={cn(
        "relative border border-border p-1",
        wrap
          ? "grid w-full grid-cols-3 gap-0.5 rounded-2xl @md:grid-cols-6"
          : "rounded-full",
        !wrap && (fill ? "flex w-full" : "inline-flex"),
      )}
    >
      {pill && (
        <motion.span
          aria-hidden
          initial={false}
          animate={{
            x: pill.x,
            y: pill.y,
            width: pill.width,
            height: pill.height,
          }}
          transition={pill.glide && !reduce ? SPRING_PANEL : { duration: 0 }}
          className={cn(
            "absolute top-0 left-0 bg-surface2",
            wrap ? "rounded-[11px]" : "rounded-full",
          )}
        />
      )}
      {options.map((side) => (
        <button
          key={side}
          type="button"
          role="radio"
          aria-checked={value === side}
          onClick={() => {
            if (side !== value) cue("toggleOn");
            onChange(side);
          }}
          className={cn(
            "relative cursor-pointer py-1 font-mono text-[12px] whitespace-nowrap transition-colors duration-150 ease-out",
            wrap ? "rounded-[11px] px-2 py-1.5" : "rounded-full",
            // Grows from its own width, so the gaps match and long labels get room.
            !wrap && (fill ? "flex-auto px-1 text-[11px]" : "px-3"),
            value === side
              ? "text-foreground"
              : "text-text-muted hover:text-text-secondary",
          )}
        >
          <span className="relative">{side}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Previews ─── */

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

// ponytail: no-op handlers, the preview has nothing to notify or open. They
// still count as actionable, so the card renders the buttons.
const CHART_CARD_ACTIONS = [
  {
    id: "notifications",
    label: "Notifications",
    icon: <IconBell aria-hidden className="size-6" variant="Bulk" />,
    onSelect: () => {},
    badge: 3,
  },
  {
    id: "more",
    label: "More options",
    icon: <IconMenuDots aria-hidden className="size-6" variant="Bold" />,
    onSelect: () => {},
  },
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

function MagneticPlayground({
  cfg,
  showField,
}: {
  cfg: MagneticConfig;
  showField: boolean;
}) {
  return (
    <div className="relative inline-flex">
      {/* The field is padding cancelled by margin, so the button's own box is
          just the pill - a negative inset of `field` traces the real edge of
          the pull without adding any layout of its own. */}
      <span
        aria-hidden
        style={{ inset: -cfg.field }}
        className={cn(
          "pointer-events-none absolute rounded-full border border-dashed transition-colors duration-200",
          showField ? "border-border" : "border-transparent",
        )}
      />
      <MagneticButton
        {...cfg}
        className="bg-linear-to-b from-brand-hover to-brand text-brand-foreground uppercase"
      >
        Get started
      </MagneticButton>
    </div>
  );
}

function DeleteButtonPlayground({ cfg }: { cfg: DeleteConfig }) {
  return (
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
  );
}

/** Everything the page needs from a slug's playground: the live preview, the
 *  Usage snippet (tracking the knobs where there are any), the Settings panel
 *  (undefined when the preview has no props to tune) and a reset. */
export interface Playground {
  reset: () => void;
  preview: React.ReactNode;
  usage: string;
  settings: React.ReactNode;
  /** A long panel (6+ controls): opens as wide as the dock, two columns.
   *  Shorter ones keep the narrow single column. */
  wide?: boolean;
  /** Lays the catalog card's dot field behind the preview. */
  dots?: boolean;
  /** Fades the dot field out toward the stage's edges. */
  vignette?: boolean;
}

export function usePlayground(slug: string, fallbackUsage: string): Playground {
  const [cfg, setCfg] = useState<MagneticConfig>(MAGNETIC_DEFAULTS);
  const [showField, setShowField] = useState(true);
  const [deleteCfg, setDeleteCfg] = useState<DeleteConfig>(DELETE_DEFAULTS);
  const [copyCfg, setCopyCfg] = useState<CopyConfig>(COPY_DEFAULTS);
  const [timeCfg, setTimeCfg] = useState<TimeConfig>(TIME_DEFAULTS);
  const [gooCfg, setGooCfg] = useState<GooConfig>(GOO_DEFAULTS);
  const [sliderCfg, setSliderCfg] = useState<SliderConfig>(SLIDER_DEFAULTS);
  const [dustCfg, setDustCfg] = useState<DustConfig>(DUST_DEFAULTS);
  const [glassCfg, setGlassCfg] = useState<GlassConfig>(GLASS_DEFAULTS);
  const [notchCfg, setNotchCfg] = useState<NotchConfig>(NOTCH_DEFAULTS);
  const [tabsCfg, setTabsCfg] = useState<TabsConfig>(TABS_DEFAULTS);
  const [flipCfg, setFlipCfg] = useState<FlipConfig>(FLIP_DEFAULTS);
  const [segCfg, setSegCfg] = useState<SegConfig>(SEG_DEFAULTS);
  const [lensCfg, setLensCfg] = useState<LensConfig>(LENS_DEFAULTS);
  const [kpiCfg, setKpiCfg] = useState<KpiConfig>(KPI_DEFAULTS);
  const [badgeCfg, setBadgeCfg] = useState<BadgeConfig>(BADGE_DEFAULTS);
  const [badgeRun, setBadgeRun] = useState(0);
  const [genCfg, setGenCfg] = useState<GenConfig>(GEN_DEFAULTS);
  const genRun = useGenerationRun(
    slug === "image-generation" && genCfg.status === "auto",
  );
  const [uploadMode, setUploadMode] = useState<UploadMode>("uploader");
  const [pickerMode, setPickerMode] = useState<PickerMode>("inline");
  const [uploaderCfg, setUploaderCfg] =
    useState<UploaderConfig>(UPLOADER_DEFAULTS);
  const [seed, setSeed] = useState(0);
  const [cardCfg, setCardCfg] = useState<CardConfig>(CARD_DEFAULTS);
  // Stable, so the card's autoplay timer doesn't restart on every tick.
  const patchCard = useCallback(
    (next: Partial<CardConfig>) => setCardCfg((c) => ({ ...c, ...next })),
    [],
  );

  const reset = () => {
    setCfg(MAGNETIC_DEFAULTS);
    setShowField(true);
    setDeleteCfg(DELETE_DEFAULTS);
    setTimeCfg(TIME_DEFAULTS);
    setGooCfg(GOO_DEFAULTS);
    setSliderCfg(SLIDER_DEFAULTS);
    setDustCfg(DUST_DEFAULTS);
    setGlassCfg(GLASS_DEFAULTS);
    setNotchCfg(NOTCH_DEFAULTS);
    setTabsCfg(TABS_DEFAULTS);
    setFlipCfg(FLIP_DEFAULTS);
    setSegCfg(SEG_DEFAULTS);
    setLensCfg(LENS_DEFAULTS);
    setKpiCfg(KPI_DEFAULTS);
    setBadgeCfg(BADGE_DEFAULTS);
    setGenCfg(GEN_DEFAULTS);
    setCopyCfg(COPY_DEFAULTS);
    setUploadMode("uploader");
    setPickerMode("inline");
    setUploaderCfg(UPLOADER_DEFAULTS);
    setSeed(0);
    setCardCfg(CARD_DEFAULTS);
  };

  if (slug === "magnetic-button") {
    return {
      reset,
      preview: <MagneticPlayground cfg={cfg} showField={showField} />,
      usage: magneticUsage(cfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y">
          <div className={`${KNOB_GRID} gap-y-4 px-3 pb-3`}>
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
      ),
    };
  }

  if (slug === "copy-button") {
    const patch = (next: Partial<CopyConfig>) =>
      setCopyCfg((c) => ({ ...c, ...next }));
    return {
      reset,
      preview: (
        <CopyButton
          value={copyValue(copyCfg)}
          size={copyCfg.size}
          iconOnly={copyCfg.iconOnly}
          resetAfter={copyCfg.resetAfter}
        />
      ),
      usage: copyUsage(copyCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <SettingsRow label="Size">
            <Tabs
              label="Size"
              options={COPY_SIZES}
              value={copyCfg.size}
              onChange={(v) => patch({ size: v })}
            />
          </SettingsRow>
          <div className="py-3">
            <Knob
              name="resetAfter"
              hint="ms, 0 keeps the state"
              min={0}
              max={4000}
              step={200}
              value={copyCfg.resetAfter}
              onChange={(v) => patch({ resetAfter: v })}
            />
          </div>
          <SettingsRows>
            <SettingsRow label="Icon only">
              <Switch
                checked={copyCfg.iconOnly}
                onChange={(v) => patch({ iconOnly: v })}
                label="Icon only"
              />
            </SettingsRow>
            <SettingsRow label="Async value">
              <Switch
                checked={copyCfg.async}
                onChange={(v) => patch({ async: v, fail: false })}
                label="Async value"
              />
            </SettingsRow>
            <SettingsRow label="Simulate failure">
              <Switch
                checked={copyCfg.fail}
                onChange={(v) => patch({ fail: v, async: false })}
                label="Simulate failure"
              />
            </SettingsRow>
          </SettingsRows>
        </div>
      ),
    };
  }

  if (slug === "delete-button") {
    return {
      reset,
      preview: <DeleteButtonPlayground cfg={deleteCfg} />,
      usage: deleteUsage(deleteCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <SettingsRow label="Actions">
            <Tabs
              label="Actions position"
              options={["left", "right"] as const}
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
          <SettingsRows>
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
          </SettingsRows>
        </div>
      ),
    };
  }

  if (slug === "goo-switch") {
    const knob = (
      key: "size" | "inset" | "sling" | "trail",
      hint: string,
      min: number,
      max: number,
      step: number,
    ) => (
      <Knob
        name={key}
        hint={hint}
        min={min}
        max={max}
        step={step}
        value={gooCfg[key]}
        onChange={(v) => setGooCfg((c) => ({ ...c, [key]: v }))}
      />
    );
    return {
      reset,
      wide: true,
      preview: (
        <GooSwitch
          defaultChecked
          aria-label="Wi-Fi"
          size={GOO_SIZES[gooCfg.size]}
          inset={gooCfg.inset}
          stretch={gooCfg.stretch}
          // The top of the range stands for "never sling".
          sling={gooCfg.sling >= 1 ? false : gooCfg.sling}
          trail={gooCfg.trail}
          disabled={gooCfg.disabled}
        />
      ),
      usage: gooUsage(gooCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <div className={`${KNOB_GRID} gap-y-5 py-3`}>
            {knob("size", GOO_SIZES[gooCfg.size], 0, 2, 1)}
            {knob("inset", "of 32", 1, 10, 1)}
            {knob(
              "sling",
              gooCfg.sling >= 1 ? "never" : "of the stretch",
              0.1,
              1,
              0.05,
            )}
            {knob("trail", "x the lag, 0 hides it", 0, 6, 0.2)}
          </div>
          <SettingsRows>
            <SettingsRow label="Stretch">
              <Switch
                checked={gooCfg.stretch}
                onChange={(v) => setGooCfg((c) => ({ ...c, stretch: v }))}
                label="Stretch"
              />
            </SettingsRow>
            <SettingsRow label="Disabled">
              <Switch
                checked={gooCfg.disabled}
                onChange={(v) => setGooCfg((c) => ({ ...c, disabled: v }))}
                label="Disabled"
              />
            </SettingsRow>
          </SettingsRows>
        </div>
      ),
    };
  }

  if (slug === "nav-notch") {
    return {
      reset,
      preview: (
        <NavNotch
          items={NAV_NOTCH_ITEMS}
          defaultValue="Link 5"
          orientation={notchCfg.vertical ? "vertical" : "horizontal"}
          side={notchCfg.left ? "left" : "right"}
        />
      ),
      usage: notchUsage(notchCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <SettingsRows>
            <SettingsRow label="Vertical">
              <Switch
                checked={notchCfg.vertical}
                onChange={(v) => setNotchCfg((c) => ({ ...c, vertical: v }))}
                label="Vertical"
              />
            </SettingsRow>
            <SettingsRow label="Chip on the left">
              <Switch
                checked={notchCfg.left}
                onChange={(v) => setNotchCfg((c) => ({ ...c, left: v }))}
                label="Chip on the left"
              />
            </SettingsRow>
          </SettingsRows>
        </div>
      ),
    };
  }

  if (slug === "expand-tabs") {
    return {
      reset,
      preview: (
        <ExpandTabs
          items={EXPAND_TABS_ITEMS.map((item) =>
            tabsCfg.badge ? item : { ...item, badge: undefined },
          )}
          classNames={{ tab: "bg-foreground/8" }}
        />
      ),
      usage: tabsUsage(tabsCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <SettingsRows>
            <SettingsRow label="Badge">
              <Switch
                checked={tabsCfg.badge}
                onChange={(v) => setTabsCfg({ badge: v })}
                label="Badge"
              />
            </SettingsRow>
          </SettingsRows>
        </div>
      ),
    };
  }

  if (slug === "flip-button") {
    const icon =
      flipCfg.icon === "arrow" ? (
        <IconArrowRight strokeWidth={2} />
      ) : flipCfg.icon === "plus" ? (
        <IconAdd strokeWidth={2.5} />
      ) : undefined;
    return {
      reset,
      preview: (
        <FlipButton
          variant={flipCfg.variant}
          size={flipCfg.size}
          iconRight={icon}
          iconMotion={flipCfg.icon === "plus" ? "rotate" : "slide"}
          flipDirection={flipCfg.direction}
          flipLabel={flipCfg.back === "same" ? undefined : flipCfg.back}
          flipped={flipCfg.trigger === "state" ? flipCfg.flipped : undefined}
          loading={flipCfg.loading}
        >
          Get started
        </FlipButton>
      ),
      usage: flipUsage(flipCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <div className="flex flex-col gap-2 py-3">
            <span className="text-[13px] font-medium text-foreground">
              Variant
            </span>
            <Tabs
              label="Variant"
              wrap
              options={FLIP_VARIANTS}
              value={flipCfg.variant}
              onChange={(v) => setFlipCfg((c) => ({ ...c, variant: v }))}
            />
          </div>
          <SettingsRow label="Size">
            <Tabs
              label="Size"
              options={FLIP_SIZES}
              value={flipCfg.size}
              onChange={(v) => setFlipCfg((c) => ({ ...c, size: v }))}
            />
          </SettingsRow>
          <SettingsRow label="Icon">
            <Tabs
              label="Icon"
              options={FLIP_ICONS}
              value={flipCfg.icon}
              onChange={(v) => setFlipCfg((c) => ({ ...c, icon: v }))}
            />
          </SettingsRow>
          <SettingsRow label="Direction">
            <Tabs
              label="Direction"
              options={FLIP_DIRECTIONS}
              value={flipCfg.direction}
              onChange={(v) => setFlipCfg((c) => ({ ...c, direction: v }))}
            />
          </SettingsRow>
          <SettingsRow label="Back label">
            <Tabs
              label="Back label"
              options={FLIP_BACKS}
              value={flipCfg.back}
              onChange={(v) => setFlipCfg((c) => ({ ...c, back: v }))}
            />
          </SettingsRow>
          <SettingsRow label="Flips on">
            <Tabs
              label="Flips on"
              options={FLIP_TRIGGERS}
              value={flipCfg.trigger}
              onChange={(v) => setFlipCfg((c) => ({ ...c, trigger: v }))}
            />
          </SettingsRow>
          {flipCfg.trigger === "state" && (
            <SettingsRow label="Flipped">
              <Switch
                checked={flipCfg.flipped}
                onChange={(v) => setFlipCfg((c) => ({ ...c, flipped: v }))}
                label="Flipped"
              />
            </SettingsRow>
          )}
          <SettingsRow label="Loading">
            <Switch
              checked={flipCfg.loading}
              onChange={(v) => setFlipCfg((c) => ({ ...c, loading: v }))}
              label="Loading"
            />
          </SettingsRow>
        </div>
      ),
    };
  }

  if (slug === "tabs") {
    const flag = (key: "fill" | "icons" | "disabled", label: string) => (
      <SettingsRow label={label}>
        <Switch
          checked={segCfg[key]}
          onChange={(v) => setSegCfg((c) => ({ ...c, [key]: v }))}
          label={label}
        />
      </SettingsRow>
    );
    return {
      reset,
      preview: (
        <div className={cn(segCfg.fill && "w-80")}>
          <LibTabs
            label="Section"
            size={segCfg.size}
            fill={segCfg.fill}
            disabled={segCfg.disabled}
            options={
              segCfg.icons
                ? (
                    [
                      ["Playlist", IconMusicLibrary2],
                      ["History", IconClock],
                      ["Settings", IconSetting2],
                    ] as const
                  ).map(([value, Icon]) => ({
                    value,
                    icon: <Icon strokeWidth={2} />,
                    activeIcon: <Icon variant="Bulk" strokeWidth={2} />,
                  }))
                : ["Playlist", "History", "Settings"]
            }
          />
        </div>
      ),
      usage: segUsage(segCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <SettingsRow label="Size">
            <Tabs
              label="Size"
              options={SEG_SIZES}
              value={segCfg.size}
              onChange={(v) => setSegCfg((c) => ({ ...c, size: v }))}
            />
          </SettingsRow>
          <SettingsRows>
            {flag("icons", "Icons")}
            {flag("fill", "Fill")}
            {flag("disabled", "Disabled")}
          </SettingsRows>
        </div>
      ),
    };
  }

  if (slug === "badge") {
    const flag = (
      key: "icon" | "count" | "dashed" | "removable",
      label: string,
    ) => (
      <SettingsRow label={label}>
        <Switch
          checked={badgeCfg[key]}
          onChange={(v) => setBadgeCfg((c) => ({ ...c, [key]: v }))}
          label={label}
        />
      </SettingsRow>
    );
    return {
      reset,
      preview: (
        <div className="flex flex-col items-center gap-6">
          {/* The badge the settings tune, above every kind of badge. */}
          {/* Removing folds it away; a new key brings it straight back. */}
          <Badge
            key={badgeRun}
            tone={badgeCfg.tone}
            size={badgeCfg.size}
            icon={badgeCfg.icon ? <IconTickCircle variant="Bold" /> : undefined}
            count={badgeCfg.count ? 3 : undefined}
            dashed={badgeCfg.dashed}
            onRemove={
              badgeCfg.removable ? () => setBadgeRun((n) => n + 1) : undefined
            }
          >
            Approved
          </Badge>
          <div aria-hidden className="h-px w-40 bg-border" />
          <BadgeDemo />
        </div>
      ),
      usage: badgeUsage(badgeCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <div className="flex flex-col gap-2 py-3">
            <span className="text-[13px] font-medium text-foreground">
              Tone
            </span>
            <Tabs
              label="Tone"
              fill
              options={BADGE_TONES}
              value={badgeCfg.tone}
              onChange={(v) => setBadgeCfg((c) => ({ ...c, tone: v }))}
            />
          </div>
          <SettingsRow label="Size">
            <Tabs
              label="Size"
              options={BADGE_SIZES}
              value={badgeCfg.size}
              onChange={(v) => setBadgeCfg((c) => ({ ...c, size: v }))}
            />
          </SettingsRow>
          <SettingsRows>
            {flag("icon", "Icon")}
            {flag("count", "Count")}
            {flag("dashed", "Dashed")}
            {flag("removable", "Removable")}
          </SettingsRows>
        </div>
      ),
    };
  }

  if (slug === "image-generation") {
    const status: ImageGenerationStatus =
      genCfg.status === "auto" ? genRun : genCfg.status;
    const flag = (
      key: "interactive" | "showStatus" | "download",
      label: string,
    ) => (
      <SettingsRow label={label}>
        <Switch
          checked={genCfg[key]}
          onChange={(v) => setGenCfg((c) => ({ ...c, [key]: v }))}
          label={label}
        />
      </SettingsRow>
    );
    return {
      reset,
      preview: (
        <ImageGeneration
          status={status}
          src={IMAGE_GENERATION_SRC}
          prompt={IMAGE_GENERATION_PROMPT}
          focus={IMAGE_GENERATION_FOCUS}
          aspectRatio={genAspect(genCfg.ratio)}
          interactive={genCfg.interactive}
          showStatus={genCfg.showStatus}
          download={genCfg.download ? "rooftop.jpg" : undefined}
          onRetry={() => setGenCfg((c) => ({ ...c, status: "auto" }))}
          className={cn(GEN_RATIOS[genCfg.ratio].width, "max-w-full")}
        />
      ),
      usage: genUsage(genCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <div className="flex flex-col gap-2.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium text-foreground">
                Status
              </span>
              {/* Auto cycles on its own; name the stage it is on. */}
              {genCfg.status === "auto" && (
                <span className="font-mono text-[11px] text-text-muted">
                  {genRun}
                </span>
              )}
            </div>
            <Tabs
              label="Status"
              wrap
              options={GEN_STATUSES}
              value={genCfg.status}
              onChange={(v) => setGenCfg((c) => ({ ...c, status: v }))}
            />
          </div>
          <div className="flex flex-col gap-2.5 py-3">
            <span className="text-[13px] font-medium text-foreground">
              Aspect ratio
            </span>
            <Tabs
              label="Aspect ratio"
              fill
              options={GEN_RATIO_KEYS}
              value={genCfg.ratio}
              onChange={(v) => setGenCfg((c) => ({ ...c, ratio: v }))}
            />
          </div>
          <SettingsRows>
            {flag("interactive", "Interactive")}
            {flag("showStatus", "Status line")}
            {flag("download", "Download")}
          </SettingsRows>
        </div>
      ),
    };
  }

  if (slug === "kpi-chart") {
    return {
      reset,
      preview: (
        <KpiChart
          data={kpiCfg.falling ? KPI_FALLING : KPI_REVENUE}
          label="Monthly revenue"
          defaultIndex={kpiCfg.defaultIndex}
          currency={kpiCfg.currency === "none" ? undefined : kpiCfg.currency}
          locale={kpiCfg.locale}
          className="w-lg max-w-full"
        />
      ),
      usage: kpiUsage(kpiCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <div className="py-3">
            <Knob
              name="defaultIndex"
              hint={KPI_REVENUE[kpiCfg.defaultIndex]?.label ?? ""}
              min={0}
              max={KPI_REVENUE.length - 1}
              step={1}
              value={kpiCfg.defaultIndex}
              onChange={(v) => setKpiCfg((c) => ({ ...c, defaultIndex: v }))}
            />
          </div>
          <div className="flex flex-col gap-2.5 py-3">
            <span className="text-[13px] font-medium text-foreground">
              Currency
            </span>
            <Tabs
              label="Currency"
              fill
              options={KPI_CURRENCIES}
              value={kpiCfg.currency}
              onChange={(v) => setKpiCfg((c) => ({ ...c, currency: v }))}
            />
          </div>
          <div className="flex flex-col gap-2.5 py-3">
            <span className="text-[13px] font-medium text-foreground">
              Locale
            </span>
            <Tabs
              label="Locale"
              fill
              options={KPI_LOCALES}
              value={kpiCfg.locale}
              onChange={(v) => setKpiCfg((c) => ({ ...c, locale: v }))}
            />
          </div>
          <SettingsRows>
            <SettingsRow label="Peak and drop">
              <Switch
                checked={kpiCfg.falling}
                onChange={(v) => setKpiCfg((c) => ({ ...c, falling: v }))}
                label="Peak and drop"
              />
            </SettingsRow>
          </SettingsRows>
        </div>
      ),
    };
  }

  if (slug === "contact-lens") {
    return {
      reset,
      preview: (
        <ContactLens
          value="hello@devigner.cc"
          items={CONTACT_LENS_ITEMS}
          resetAfter={lensCfg.resetAfter}
        />
      ),
      usage: lensUsage(lensCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <div className={`${KNOB_GRID} gap-y-5 py-3`}>
            <Knob
              name="resetAfter"
              hint="ms the Copied pill holds"
              min={400}
              max={4000}
              step={100}
              value={lensCfg.resetAfter}
              onChange={(v) => setLensCfg({ resetAfter: v })}
            />
          </div>
        </div>
      ),
    };
  }

  if (slug === "liquid-glass") {
    return {
      reset,
      dots: true,
      vignette: true,
      preview: (
        <GlassMenu
          items={GLASS_MENU}
          transparency={glassCfg.transparency}
          disabled={glassCfg.disabled}
        />
      ),
      usage: glassUsage(glassCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <div className={`${KNOB_GRID} gap-y-5 py-3`}>
            <Knob
              name="transparency"
              hint="0 ultra clear, 1 tinted"
              min={0}
              max={1}
              step={0.05}
              value={glassCfg.transparency}
              onChange={(v) => setGlassCfg((c) => ({ ...c, transparency: v }))}
            />
          </div>
          <SettingsRows>
            <SettingsRow label="Disabled">
              <Switch
                checked={glassCfg.disabled}
                onChange={(v) => setGlassCfg((c) => ({ ...c, disabled: v }))}
                label="Disabled"
              />
            </SettingsRow>
          </SettingsRows>
        </div>
      ),
    };
  }

  if (slug === "slider") {
    const knob = (
      key: "step",
      hint: string,
      min: number,
      max: number,
      step: number,
    ) => (
      <Knob
        name={key}
        hint={hint}
        min={min}
        max={max}
        step={step}
        value={sliderCfg[key]}
        onChange={(v) => setSliderCfg((c) => ({ ...c, [key]: v }))}
      />
    );
    return {
      reset,
      preview: (
        <Slider
          // Remount on orientation, so the thumb doesn't glide across axes.
          key={sliderCfg.horizontal ? "h" : "v"}
          defaultValue={40}
          aria-label="Heat"
          orientation={sliderCfg.horizontal ? "horizontal" : "vertical"}
          size={sliderCfg.size}
          step={sliderCfg.step}
          snap={sliderCfg.snap}
          marks={sliderCfg.marks}
          inverted={sliderCfg.inverted}
          disabled={sliderCfg.disabled}
          // Fires only when the value changes, so each call is a step crossed.
          onValueChange={tick}
        />
      ),
      usage: sliderUsage(sliderCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <SettingsRow label="Size">
            <Tabs
              label="Size"
              options={SLIDER_SIZES}
              value={sliderCfg.size}
              onChange={(v) => setSliderCfg((c) => ({ ...c, size: v }))}
            />
          </SettingsRow>
          <div className="py-3">{knob("step", "of 100", 1, 25, 1)}</div>
          <SettingsRows>
            <SettingsRow label="Marks">
              <Switch
                checked={sliderCfg.marks}
                onChange={(v) => setSliderCfg((c) => ({ ...c, marks: v }))}
                label="Marks"
              />
            </SettingsRow>
            <SettingsRow label="Snap">
              <Switch
                checked={sliderCfg.snap}
                onChange={(v) => setSliderCfg((c) => ({ ...c, snap: v }))}
                label="Snap"
              />
            </SettingsRow>
            <SettingsRow label="Horizontal">
              <Switch
                checked={sliderCfg.horizontal}
                onChange={(v) => setSliderCfg((c) => ({ ...c, horizontal: v }))}
                label="Horizontal"
              />
            </SettingsRow>
            <SettingsRow label="Inverted">
              <Switch
                checked={sliderCfg.inverted}
                onChange={(v) => setSliderCfg((c) => ({ ...c, inverted: v }))}
                label="Inverted"
              />
            </SettingsRow>{" "}
            <SettingsRow label="Disabled">
              <Switch
                checked={sliderCfg.disabled}
                onChange={(v) => setSliderCfg((c) => ({ ...c, disabled: v }))}
                label="Disabled"
              />
            </SettingsRow>
          </SettingsRows>
        </div>
      ),
    };
  }

  if (slug === "stardust-slider") {
    return {
      reset,
      wide: true,
      preview: (
        <StardustSlider
          // Remount on orientation, so the fill doesn't glide across axes.
          key={dustCfg.vertical ? "v" : "h"}
          label="Select strike:"
          aria-label={dustCfg.bare ? "Strike" : undefined}
          defaultValue={28}
          color={DUST_COLORS[dustCfg.color]}
          size={dustCfg.size}
          step={dustCfg.step}
          snap={dustCfg.detents ? "marks" : false}
          marks={
            dustCfg.detents ? DUST_DETENTS : dustCfg.marks ? undefined : []
          }
          orientation={dustCfg.vertical ? "vertical" : "horizontal"}
          variant={dustCfg.bare ? "bare" : "card"}
          dir={dustCfg.rtl ? "rtl" : "ltr"}
          disabled={dustCfg.disabled}
          onValueChange={tick}
        />
      ),
      usage: dustUsage(dustCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <div className={KNOB_GRID}>
            <div className="flex flex-col gap-2.5 py-3">
              <span className="text-[13px] font-medium text-foreground">
                Color
              </span>
              <Tabs
                label="Color"
                fill
                options={DUST_COLOR_NAMES}
                value={dustCfg.color}
                onChange={(v) => setDustCfg((c) => ({ ...c, color: v }))}
              />
            </div>
            <div className="flex flex-col gap-2.5 py-3">
              <span className="text-[13px] font-medium text-foreground">
                Size
              </span>
              <Tabs
                label="Size"
                fill
                options={DUST_SIZES}
                value={dustCfg.size}
                onChange={(v) => setDustCfg((c) => ({ ...c, size: v }))}
              />
            </div>
          </div>
          <div className="py-3">
            <Knob
              name="step"
              hint="of 100"
              min={1}
              max={25}
              step={1}
              value={dustCfg.step}
              onChange={(v) => setDustCfg((c) => ({ ...c, step: v }))}
            />
          </div>
          <SettingsRows>
            <SettingsRow label="Marks">
              <Switch
                checked={dustCfg.marks}
                onChange={(v) => setDustCfg((c) => ({ ...c, marks: v }))}
                label="Marks"
              />
            </SettingsRow>
            <SettingsRow label="Detents">
              <Switch
                checked={dustCfg.detents}
                onChange={(v) => setDustCfg((c) => ({ ...c, detents: v }))}
                label="Detents"
              />
            </SettingsRow>
            <SettingsRow label="Vertical">
              <Switch
                checked={dustCfg.vertical}
                onChange={(v) =>
                  setDustCfg((c) => ({
                    ...c,
                    vertical: v,
                    rtl: v ? false : c.rtl,
                  }))
                }
                label="Vertical"
              />
            </SettingsRow>
            <SettingsRow label="Bare">
              <Switch
                checked={dustCfg.bare}
                onChange={(v) => setDustCfg((c) => ({ ...c, bare: v }))}
                label="Bare"
              />
            </SettingsRow>
            <SettingsRow label="Right to left">
              {/* Vertical has no left or right: the switch turns off and
                  locks while it is on. */}
              <Switch
                checked={dustCfg.rtl && !dustCfg.vertical}
                onChange={(v) => setDustCfg((c) => ({ ...c, rtl: v }))}
                label="Right to left"
                disabled={dustCfg.vertical}
              />
            </SettingsRow>
            <SettingsRow label="Disabled">
              <Switch
                checked={dustCfg.disabled}
                onChange={(v) => setDustCfg((c) => ({ ...c, disabled: v }))}
                label="Disabled"
              />
            </SettingsRow>
          </SettingsRows>
        </div>
      ),
    };
  }

  if (slug === "inline-time-edit") {
    return {
      reset,
      preview: (
        <InlineTimeEdit
          maxHours={timeCfg.maxHours}
          shortTime={timeCfg.shortTime}
          disabled={timeCfg.disabled}
        />
      ),
      usage: timeUsage(timeCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <div className="py-3">
            <Knob
              name="maxHours"
              hint="h, clamps on save"
              min={1}
              max={99}
              step={1}
              value={timeCfg.maxHours}
              onChange={(v) => setTimeCfg((c) => ({ ...c, maxHours: v }))}
            />
          </div>
          <SettingsRows>
            <SettingsRow label="Short time">
              <Switch
                checked={timeCfg.shortTime}
                onChange={(v) => setTimeCfg((c) => ({ ...c, shortTime: v }))}
                label="Short time"
              />
            </SettingsRow>
            <SettingsRow label="Disabled">
              <Switch
                checked={timeCfg.disabled}
                onChange={(v) => setTimeCfg((c) => ({ ...c, disabled: v }))}
                label="Disabled"
              />
            </SettingsRow>
          </SettingsRows>
        </div>
      ),
    };
  }

  if (slug === "date-range-picker") {
    return {
      reset,
      // A fixed height below the tabs, so neither the tabs nor the trigger
      // move when the mode changes or the picker opens.
      preview: (
        <div className="flex h-[40rem] flex-col items-center gap-6">
          <LibTabs
            label="Preview"
            size="sm"
            options={PICKER_MODES}
            value={pickerMode}
            onValueChange={setPickerMode}
          />
          {pickerMode === "inline" ? (
            // Past days are disabled, as in the reference recording.
            <DateRangePicker minDate={new Date()} />
          ) : (
            <DateRangePickerTrigger />
          )}
        </div>
      ),
      usage: pickerUsage(pickerMode),
      settings: undefined,
    };
  }

  if (slug === "file-upload") {
    const card = uploadMode === "card";
    const upKnob = (
      key: "seconds" | "failEvery" | "concurrency" | "maxFiles" | "maxSize",
      hint: string,
      min: number,
      max: number,
      step: number,
    ) => (
      <Knob
        name={key}
        hint={hint}
        min={min}
        max={max}
        step={step}
        value={uploaderCfg[key]}
        onChange={(v) => setUploaderCfg((c) => ({ ...c, [key]: v }))}
      />
    );
    const upSwitch = (key: "resumable" | "multiple" | "disabled") => (
      <SettingsRow label={key}>
        <Switch
          checked={uploaderCfg[key]}
          onChange={(v) => setUploaderCfg((c) => ({ ...c, [key]: v }))}
          label={key}
        />
      </SettingsRow>
    );
    const cardSwitch = (key: "autoplay" | "preview" | "actions") => (
      <SettingsRow label={key}>
        <Switch
          checked={cardCfg[key]}
          onChange={(v) => patchCard({ [key]: v })}
          label={key}
        />
      </SettingsRow>
    );

    return {
      reset,
      // Past the mode tabs, the uploader has nine controls, the card five.
      wide: !card,
      preview: card ? (
        <FileUploadCardDemo config={cardCfg} onConfig={patchCard} />
      ) : (
        <FileUploadDemo config={uploaderCfg} seed={seed} />
      ),
      usage: card ? cardUsage(cardCfg) : uploaderUsage(uploaderCfg),
      settings: (
        <div className="flex w-full flex-col fade-divide divide-y px-3">
          <SettingsRow label="Preview">
            <Tabs
              label="Preview"
              options={UPLOAD_MODES}
              value={uploadMode}
              onChange={setUploadMode}
            />
          </SettingsRow>
          {card ? (
            <>
              <div className={`${KNOB_GRID} gap-y-5 py-3`}>
                <Knob
                  name="status"
                  hint={FILE_STATUSES[cardCfg.status]}
                  min={0}
                  max={FILE_STATUSES.length - 1}
                  step={1}
                  value={cardCfg.status}
                  onChange={(v) => patchCard({ status: v })}
                />
                <Knob
                  name="progress"
                  hint="%"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(cardCfg.progress)}
                  onChange={(v) => patchCard({ progress: v })}
                />
              </div>
              <SettingsRows>
                {cardSwitch("autoplay")}
                {cardSwitch("preview")}
                {cardSwitch("actions")}
              </SettingsRows>
            </>
          ) : (
            <>
              <div className={`${KNOB_GRID} gap-y-5 py-3`}>
                {upKnob("seconds", "per file", 1, 12, 0.5)}
                {upKnob(
                  "failEvery",
                  uploaderCfg.failEvery ? "uploads, one fails" : "never fails",
                  0,
                  6,
                  1,
                )}
                {upKnob("concurrency", "at once", 1, 5, 1)}
                {upKnob("maxFiles", "in the list", 1, 10, 1)}
                {upKnob("maxSize", "MB", 1, 50, 1)}
              </div>
              <SettingsRows>
                {upSwitch("resumable")}
                {upSwitch("multiple")}
                {upSwitch("disabled")}
                <SettingsRow label="Sample files">
                  <button
                    type="button"
                    onClick={() => {
                      cue("toggleOn");
                      // Never reused, so a load after Reset still drops.
                      setSeed(Date.now());
                    }}
                    className="cursor-pointer rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] text-foreground transition-colors duration-200 ease-out hover:bg-surface"
                  >
                    load
                  </button>
                </SettingsRow>
              </SettingsRows>
            </>
          )}
        </div>
      ),
    };
  }

  const preview =
    slug === "chart-card" ? (
      <ChartCard
        total={90744}
        data={CHART_CARD_SALES}
        defaultActiveId={4}
        actions={CHART_CARD_ACTIONS}
      />
    ) : slug === "timeline" ? (
      <Timeline steps={TIMELINE_STEPS} className="w-full max-w-md" />
    ) : slug === "menu-dock" ? (
      <MenuDockPreview />
    ) : undefined;

  return { reset, preview, usage: fallbackUsage, settings: undefined };
}
