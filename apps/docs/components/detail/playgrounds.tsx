"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  ChartCard,
  DateRangePicker,
  DeleteButton,
  MagneticButton,
  Timeline,
} from "devignerui";
import { SPRING_PANEL, SPRING_PRESS } from "devignerui/motion";
import { cn } from "cn";
import { MenuDockPreview } from "../../demos/menu-dock";
import { RangeSlider } from "../range-slider";

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
        onValueChange={onChange}
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
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-10 shrink-0 cursor-pointer rounded-full border transition-colors",
        checked ? "border-brand bg-brand" : "border-border bg-surface2",
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
function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-[13px] font-medium text-foreground">{label}</span>
      {children}
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
      className="inline-flex rounded-full border border-border bg-surface/60 p-0.5"
    >
      {(["left", "right"] as const).map((side) => (
        <button
          key={side}
          type="button"
          role="radio"
          aria-checked={value === side}
          onClick={() => onChange(side)}
          className={cn(
            "relative cursor-pointer rounded-full px-3 py-1 font-mono text-[11px] transition-colors",
            value === side ? "text-foreground" : "text-text-muted",
          )}
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

/** Sample rail for the Timeline preview - same steps as its Usage snippet. */
const TIMELINE_STEPS = [
  { title: "Project Kickoff", description: "Define goals and gather requirements." },
  { title: "Planning", description: "Create the roadmap and strategy." },
  { title: "Design & Build", description: "Design, develop, and iterate." },
  { title: "Launch", description: "Test, deploy, and provide support." },
];

function MagneticPlayground({ cfg, showField }: { cfg: MagneticConfig; showField: boolean }) {
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
          showField ? "border-brand/25" : "border-transparent",
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
        cfg.async ? () => new Promise((resolve) => setTimeout(resolve, 900)) : () => undefined
      }
    />
  );
}

/** Everything the page needs from a slug's playground: the live preview, the
 *  Usage snippet (tracking the knobs where there are any), the Settings panel
 *  (undefined when the preview has no props to tune) and a reset. */
export function usePlayground(slug: string, fallbackUsage: string) {
  const [cfg, setCfg] = useState<MagneticConfig>(MAGNETIC_DEFAULTS);
  const [showField, setShowField] = useState(true);
  const [deleteCfg, setDeleteCfg] = useState<DeleteConfig>(DELETE_DEFAULTS);

  const reset = () => {
    setCfg(MAGNETIC_DEFAULTS);
    setShowField(true);
    setDeleteCfg(DELETE_DEFAULTS);
  };

  if (slug === "magnetic-button") {
    return {
      reset,
      preview: <MagneticPlayground cfg={cfg} showField={showField} />,
      usage: magneticUsage(cfg),
      settings: (
        <div className="flex w-72 flex-col divide-y divide-border">
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
              <Switch checked={showField} onChange={setShowField} label="Show field" />
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
        <div className="flex w-72 flex-col divide-y divide-border px-3">
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
      ),
    };
  }

  const preview =
    slug === "chart-card" ? (
      <ChartCard total={90744} data={CHART_CARD_SALES} defaultActive={4} />
    ) : slug === "timeline" ? (
      <Timeline steps={TIMELINE_STEPS} className="w-full max-w-md" />
    ) : slug === "menu-dock" ? (
      <MenuDockPreview className="border-none! shadow-none!" />
    ) : slug === "date-range-picker" ? (
      // Past days are disabled, as in the reference recording.
      <DateRangePicker minDate={new Date()} />
    ) : undefined;

  return { reset, preview, usage: fallbackUsage, settings: undefined };
}
