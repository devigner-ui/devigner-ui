// Client only: next/dynamic with ssr: false is not allowed in a server
// component. Typed against ComponentSlug, so a component without a demo
// fails the build.

import dynamic from "next/dynamic";
import { createElement, type ComponentType } from "react";
import type { ComponentSlug } from "@/lib/registry";

// Sized so the stage doesn't jump when the chunk lands.
const loading = () =>
  createElement("div", { "aria-hidden": true, "data-demo-loading": "", className: "h-24 w-56 rounded-2xl bg-surface2/60" });

export const demos: Record<ComponentSlug, ComponentType> = {
  "magnetic-button": dynamic(() => import("./magnetic-button"), { ssr: false, loading }),
  "chart-card": dynamic(() => import("./chart-card"), { ssr: false, loading }),
  "contact-lens": dynamic(() => import("./contact-lens"), { ssr: false, loading }),
  "copy-button": dynamic(() => import("./copy-button"), { ssr: false, loading }),
  "delete-button": dynamic(() => import("./delete-button"), { ssr: false, loading }),
  timeline: dynamic(() => import("./timeline"), { ssr: false, loading }),
  "menu-dock": dynamic(() => import("./menu-dock"), { ssr: false, loading }),
  "date-range-picker": dynamic(() => import("./date-range-picker"), { ssr: false, loading }),
  "inline-time-edit": dynamic(() => import("./inline-time-edit"), { ssr: false, loading }),
  "goo-switch": dynamic(() => import("./goo-switch"), { ssr: false, loading }),
  "file-upload": dynamic(() => import("./file-upload"), { ssr: false, loading }),
  "slider": dynamic(() => import("./slider"), { ssr: false, loading }),
  "liquid-glass": dynamic(() => import("./liquid-glass"), { ssr: false, loading }),
  "nav-notch": dynamic(() => import("./nav-notch"), { ssr: false, loading }),
  "kpi-chart": dynamic(() => import("./kpi-chart"), { ssr: false, loading }),
  badge: dynamic(() => import("./badge"), { ssr: false, loading }),
  "image-generation": dynamic(() => import("./image-generation"), { ssr: false, loading }),
  "stardust-slider": dynamic(() => import("./stardust-slider"), { ssr: false, loading }),
  "expand-tabs": dynamic(() => import("./expand-tabs"), { ssr: false, loading }),
  "flip-button": dynamic(() => import("./flip-button"), { ssr: false, loading }),
  tabs: dynamic(() => import("./tabs"), { ssr: false, loading }),
};
