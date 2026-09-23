"use client";

// The six shipped components, rendered live - the home catalog and the
// /components rack both read from here, so the two pages can never show
// different claims about the same piece.
// ponytail: name/pitch/features hand-kept rather than read from lib/registry.ts;
// importing the registry would ship every component's source string to the
// home page for a few labels. Every feature listed must be a real prop or
// behaviour of the component - keep them in step with its source.

import { useState } from "react";
import {
  ChartCard,
  DateRangePicker,
  DeleteButton,
  MagneticButton,
  MenuDock,
  Timeline,
} from "@devignerui/ui";
import {
  IconBrush,
  IconHeart,
  IconHomeAngle2,
  IconLogout,
  IconSearchNormal,
  IconSettings,
  IconUser,
} from "@devigner-ui/icons";

function MagneticPreview() {
  return (
    <MagneticButton className="bg-linear-to-b from-brand-hover to-brand text-brand-foreground">
      Pull me around
    </MagneticButton>
  );
}

const SALES = [
  { label: "Feb", value: 6420 },
  { label: "Mar", value: 9180 },
  { label: "Apr", value: 12340 },
  { label: "May", value: 8760 },
  { label: "Jun", value: 16520 },
  { label: "Jul", value: 13070 },
  { label: "Aug", value: 15960 },
];

function ChartPreview() {
  return <ChartCard total={90744} data={SALES} defaultActive={4} />;
}

export function DeletePreview() {
  // A promise, so the pending phase plays too - a synchronous confirm cuts
  // straight from the question to the tick.
  return (
    <DeleteButton
      onConfirm={() => new Promise((resolve) => setTimeout(resolve, 900))}
    />
  );
}

const STEPS = [
  { title: "Kickoff", description: "Agree on scope and the first milestone." },
  { title: "Prototype", description: "Wire the flow with real data." },
  { title: "Polish", description: "Tune motion, states and edge cases." },
  { title: "Ship", description: "Release, measure, iterate." },
];

function TimelinePreview() {
  return <Timeline steps={STEPS} className="w-full max-w-sm" />;
}

export function DockPreview() {
  const [active, setActive] = useState("home");
  const pick = (id: string) => () => setActive(id);
  return (
    <MenuDock
      active={active}
      items={[
        {
          id: "home",
          label: "Home",
          icon: <IconHomeAngle2 strokeWidth={2} />,
          activeIcon: <IconHomeAngle2 variant="Bold" />,
          onSelect: pick("home"),
        },
        {
          id: "search",
          label: "Search",
          icon: <IconSearchNormal strokeWidth={2} />,
          activeIcon: <IconSearchNormal variant="Bold" />,
          onSelect: pick("search"),
        },
        {
          id: "saved",
          label: "Saved",
          icon: <IconHeart strokeWidth={2} />,
          activeIcon: <IconHeart variant="Bold" />,
          onSelect: pick("saved"),
        },
        {
          id: "account",
          label: "Account",
          icon: <IconSettings strokeWidth={2} />,
          items: [
            { label: "Profile", icon: <IconUser /> },
            { label: "Appearance", icon: <IconBrush /> },
            { label: "Sign out", icon: <IconLogout />, destructive: true },
          ],
        },
      ]}
    />
  );
}

function DateRangePreview() {
  return <DateRangePicker minDate={new Date()} />;
}

export interface LiveComponent {
  slug: string;
  name: string;
  /** One line, written for the home catalog. */
  pitch: string;
  /** What to try - the preview is live, so say how to poke it. */
  tryIt: string;
  features: string[];
  Preview: () => React.ReactNode;
}

export const LIVE_COMPONENTS: LiveComponent[] = [
  {
    slug: "date-range-picker",
    name: "Date Range Picker",
    pitch: "Hover to see the range before you click. A preset lights up when your dates match it.",
    tryIt: "Pick two days, then hover around",
    features: ["Hover preview", "Presets", "Keyboard navigation", "Disabled days"],
    Preview: DateRangePreview,
  },
  {
    slug: "menu-dock",
    name: "Menu Dock",
    pitch: "A dock that grows into its own menus, nested as deep as you need.",
    tryIt: "Open Account",
    features: ["Nested menus", "Custom panels", "Keyboard navigation", "Active icons"],
    Preview: DockPreview,
  },
  {
    slug: "delete-button",
    name: "Delete Button",
    pitch: "Asks before it deletes, waits for your API call, then shows a tick. No modal.",
    tryIt: "Press it, then confirm",
    features: ["Inline confirm", "Async states", "Auto reset", "Escape to cancel"],
    Preview: DeletePreview,
  },
  {
    slug: "chart-card",
    name: "Chart Card",
    pitch: "A stats card whose bars show their value as you move across them.",
    tryIt: "Sweep across the bars",
    features: ["Pointer tooltip", "Controlled point", "Header actions", "Slot styling"],
    Preview: ChartPreview,
  },
  {
    slug: "timeline",
    name: "Timeline",
    pitch: "The active step slides off the rail, and the line bends to follow it.",
    tryIt: "Click a step",
    features: ["Bending rail", "Controlled step", "Custom step render"],
    Preview: TimelinePreview,
  },
  {
    slug: "magnetic-button",
    name: "Magnetic Button",
    pitch: "Leans toward your cursor before you reach it, then lets go with a wobble.",
    tryIt: "Circle it slowly",
    features: ["Magnetic field", "Label parallax", "Tilt", "Link or button"],
    Preview: MagneticPreview,
  },
];
