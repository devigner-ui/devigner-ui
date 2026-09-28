"use client";

import { useCallback, useState } from "react";
import { motion } from "motion/react";
import {
  ChartCard,
  DateRangePicker,
  DeleteButton,
  GooSwitch,
  InlineTimeEdit,
  MagneticButton,
  Timeline,
  type FileUploadStatus,
} from "devignerui";
import { SPRING_PANEL } from "devignerui/motion";
import { cn } from "cn";
import { IconBell, IconMenuDots } from "@devigner-ui/icons";
import { MenuDockPreview } from "../../demos/menu-dock";
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
  completed: ["onRemove={remove}", "onChange={replace}", "onDownload={download}"],
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
        <span className="text-[13px] font-medium text-foreground">{name}</span>
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
          // A detent per step crossed, quiet: it repeats on every drag.
          const now = performance.now();
          if (v !== value && now - lastTick > TICK_GAP) {
            lastTick = now;
            cue("tick", { volume: 0.5 });
          }
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
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <GooSwitch
      size="sm"
      checked={checked}
      onCheckedChange={(v) => {
        cue("toggle");
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
    <div className="grid [&>*:nth-child(n+2)]:border-t [&>*:nth-child(n+2)]:border-border @md:grid-cols-2 @md:gap-x-6 @md:[&>*:nth-child(2)]:border-t-0">
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
  id,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  label: string;
  /** Shared-layout id for the sliding pill, unique per tab group. */
  id: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-full border border-border bg-surface/60 p-0.5"
    >
      {options.map((side) => (
        <button
          key={side}
          type="button"
          role="radio"
          aria-checked={value === side}
          onClick={() => {
            if (side !== value) cue("toggle");
            onChange(side);
          }}
          className={cn(
            "relative cursor-pointer rounded-full px-3 py-1 font-mono text-[11px] transition-colors",
            value === side ? "text-foreground" : "text-text-muted",
          )}
        >
          {value === side && (
            <motion.span
              layoutId={id}
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
}

export function usePlayground(slug: string, fallbackUsage: string): Playground {
  const [cfg, setCfg] = useState<MagneticConfig>(MAGNETIC_DEFAULTS);
  const [showField, setShowField] = useState(true);
  const [deleteCfg, setDeleteCfg] = useState<DeleteConfig>(DELETE_DEFAULTS);
  const [timeCfg, setTimeCfg] = useState<TimeConfig>(TIME_DEFAULTS);
  const [gooCfg, setGooCfg] = useState<GooConfig>(GOO_DEFAULTS);
  const [uploadMode, setUploadMode] = useState<UploadMode>("uploader");
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
    setUploadMode("uploader");
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
        <div className="flex w-full flex-col divide-y divide-border">
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

  if (slug === "delete-button") {
    return {
      reset,
      preview: <DeleteButtonPlayground cfg={deleteCfg} />,
      usage: deleteUsage(deleteCfg),
      settings: (
        <div className="flex w-full flex-col divide-y divide-border px-3">
          <SettingsRow label="Actions">
            <Tabs
              id="delete-side-tab"
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
        <div className="flex w-full flex-col divide-y divide-border px-3">
          <div className={`${KNOB_GRID} gap-y-5 py-3`}>
            {knob("size", GOO_SIZES[gooCfg.size], 0, 2, 1)}
            {knob("inset", "of 32", 1, 10, 1)}
            {knob("sling", gooCfg.sling >= 1 ? "never" : "of the stretch", 0.1, 1, 0.05)}
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
        <div className="flex w-full flex-col divide-y divide-border px-3">
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
        <div className="flex w-full flex-col divide-y divide-border px-3">
          <SettingsRow label="Preview">
            <Tabs
              id="file-upload-mode-tab"
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
                      cue("toggle");
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
    ) : slug === "date-range-picker" ? (
      // Past days are disabled, as in the reference recording.
      <DateRangePicker minDate={new Date()} />
    ) : undefined;

  return { reset, preview, usage: fallbackUsage, settings: undefined };
}
