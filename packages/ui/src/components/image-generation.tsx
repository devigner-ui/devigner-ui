"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  IconAlertCircle,
  IconDownloadMinimalistic,
  IconRefresh,
  IconTickCircle,
} from "@devigner-ui/icons";
import { cn } from "cn";
import { ThinkingOrb, type OrbState } from "thinking-orbs";
import {
  EASE_OUT,
  SPRING_PRESS,
  SPRING_SWAP,
  SPRING_SWARM,
  SPRING_WANDER,
} from "../lib/easing";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";

// A frame for an image that is still being made. A swarm of dots on a canvas
// stands in for it: a faint, still grid of tiny dots that swell and part
// around one halftone lens. The pointer holds the lens; while generating and
// refining it drifts across the frame on its own, tinted with the real
// picture's colors while refining. Then grown into each other and faded as the
// sharp image comes in. Every dot keeps one home on a hex grid snapped to
// whole pixels and only a push ever moves it off.

export type ImageGenerationStatus =
  | "queued"
  | "generating"
  | "refining"
  | "complete"
  | "error";

export interface ImageGenerationClassNames {
  /** The image frame: rounded, bg-muted, holds the dots and the media. */
  frame?: string;
  /** The media layer around src or children. */
  media?: string;
  /** The status line under the frame. */
  status?: string;
}

export interface ImageGenerationProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** Where the generation is. Defaults to "generating". */
  status?: ImageGenerationStatus;
  /** The generated image. Its colors tint the dots while refining. */
  src?: string;
  /** Custom media (Next Image, video, canvas) shown instead of an img of src. */
  children?: React.ReactNode;
  /** Image the dots read their colors from, when it isn't src: a small
   *  thumbnail saves downloading the full image just for its colors, which
   *  matters with children, since then src isn't shown and is fetched only
   *  for this. Defaults to src. */
  tintSrc?: string;
  /** CORS mode of the img of src and of the color read, kept the same so the
   *  browser fetches the image once. Set "anonymous" for an image on another
   *  domain served with CORS headers, or its colors can't be read. */
  crossOrigin?: "anonymous" | "use-credentials";
  /** The prompt, shown under the status line. */
  prompt?: string;
  /** Accessible name of the frame. Defaults to the status text and prompt. */
  label?: string;
  /** Shape of the frame before any media exists. Defaults to "1 / 1". */
  aspectRatio?: React.CSSProperties["aspectRatio"];
  /** The point of the image kept in view when the frame crops it, in percent
   *  like object-position. Defaults to the center, { x: 50, y: 50 }. */
  focus?: { x: number; y: number };
  /** Lets a mouse push the dots and a press send a ripple through them. */
  interactive?: boolean;
  /** Replaces the built-in status text, per status: { generating: "Drawing" }.
   *  Statuses left out keep the English default. */
  statusText?: Partial<Record<ImageGenerationStatus, string>>;
  /** Shows the status line under the frame. */
  showStatus?: boolean;
  /** Shows a Try again button when status is "error". */
  onRetry?: () => void;
  /** Text of the retry button. Defaults to "Try again". */
  retryLabel?: string;
  /** Shows a download icon button in the frame's top-right corner when
   *  status is "complete". A string is
   *  the file name; true takes it from the end of src. */
  download?: boolean | string;
  /** Accessible name and tooltip of the download button. Defaults to
   *  "Download". */
  downloadLabel?: string;
  classNames?: ImageGenerationClassNames;
}

const STATUS_TEXT: Record<ImageGenerationStatus, string> = {
  queued: "Waiting to generate",
  generating: "Generating image",
  refining: "Refining details",
  complete: "Image ready",
  error: "Generation failed",
};

/** The media under the dots. Same filter functions in every state, so they
 *  interpolate. Hidden until refining, faint behind the tinted dots then. */
const MEDIA = {
  queued: { opacity: 0, filter: "blur(12px) saturate(0.6)", scale: 1.04 },
  generating: { opacity: 0, filter: "blur(12px) saturate(0.6)", scale: 1.04 },
  refining: { opacity: 0.35, filter: "blur(8px) saturate(0.8)", scale: 1.02 },
  complete: { opacity: 1, filter: "blur(0px) saturate(1)", scale: 1 },
  // Scaled a little, like the other blurred states, so the blur doesn't pull
  // the frame's background in at the edges.
  error: { opacity: 0.2, filter: "blur(6px) saturate(0.4)", scale: 1.03 },
} as const;

const CENTER = { x: 50, y: 50 };

/** Saves src as a file. A download attribute is ignored on another origin,
 *  so the image is fetched into a blob first; if that's blocked (no CORS),
 *  it opens in a new tab instead. */
async function saveImage(
  src: string,
  name: string,
  crossOrigin?: "anonymous" | "use-credentials",
) {
  try {
    const res = await fetch(src, {
      credentials:
        crossOrigin === "use-credentials" ? "include" : "same-origin",
    });
    if (!res.ok) throw new Error(String(res.status));
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    // Revoked a moment later: some browsers start the save after click returns.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    window.open(src, "_blank", "noopener");
  }
}

const isActive = (s: ImageGenerationStatus) =>
  s === "queued" || s === "generating" || s === "refining";

/* ─── The swarm ─── */

/** Distance between neighbouring dots, px. */
const GAP = 12;
/** Resting dot radius, px. */
const DOT = 1;
/** Dot radius at the lens's center, px. */
const PEAK = GAP * 0.3;
/** Opacity steps the dots are drawn in. */
const LEVELS = 64;

interface SwarmInput {
  status: ImageGenerationStatus;
  reduce: boolean;
  /** Something sharp will replace the dots once complete. */
  hasMedia: boolean;
}

/** One rAF loop for every frame on the page, so a grid of nine generations
 *  costs one callback a frame, not nine. A loop returns whether it wants
 *  another frame. */
const loops = new Set<(now: number) => boolean>();
let loopRaf = 0;
const runLoops = (now: number) => {
  loopRaf = 0;
  for (const f of loops) if (!f(now)) loops.delete(f);
  // A loop woken during this pass may already have asked for the frame.
  if (loops.size && !loopRaf) loopRaf = requestAnimationFrame(runLoops);
};
const startLoop = (f: (now: number) => boolean) => {
  loops.add(f);
  if (!loopRaf) loopRaf = requestAnimationFrame(runLoops);
};

/** One theme watcher for every frame: the class or data-theme on <html> (a
 *  theme toggle) and the system color scheme (themes that only use the media
 *  query). Not the style attribute, which scroll locks and the like rewrite
 *  all the time. */
const restylers = new Set<() => void>();
let unwatchTheme: (() => void) | null = null;
const watchTheme = (f: () => void) => {
  restylers.add(f);
  if (!unwatchTheme) {
    const all = () => restylers.forEach((r) => r());
    const mo = new MutationObserver(all);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", all);
    unwatchTheme = () => {
      mo.disconnect();
      mq.removeEventListener("change", all);
    };
  }
  return () => {
    restylers.delete(f);
    if (restylers.size) return;
    unwatchTheme?.();
    unwatchTheme = null;
  };
};

/** A value that settles on the same spring as the dots. */
interface Scalar {
  v: number;
  s: number;
}

function createSwarm(
  canvas: HTMLCanvasElement,
  input: { current: SwarmInput },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let n = 0;
  // Home on the grid, live position and velocity, and this frame's radius.
  let hx = new Float32Array(0);
  let hy = hx;
  let x = hx;
  let y = hx;
  let vx = hx;
  let vy = hx;
  let rr = hx;
  /** This frame's opacity per dot, in 64ths: one fill per level. */
  let al = new Uint8Array(0);
  /** Where object-cover anchors the image, 0 to 1 per axis. */
  let fx = 0.5;
  let fy = 0.5;
  /** Dots grouped by the image color under their home, one fill per group.
   *  A null fill is the ink, for dots over transparent pixels. */
  let tints: { fill: string | null; dots: Int32Array }[] = [];
  let ink = "";
  let image: HTMLImageElement | null = null;
  let pointer: { x: number; y: number } | null = null;
  /** The one halftone lens: chases the pointer, else drifts toward a goal
   *  while generating, else stays put so the swell shrinks in place. */
  let lx = 0;
  let ly = 0;
  let lvx = 0;
  let lvy = 0;
  let gx = 0;
  let gy = 0;
  let visible = true;
  let prev = 0;
  /** Dots bucketed by opacity level for one fill: counts, then each level's
   *  start, then the dot indices in level order. */
  const counts = new Int32Array(LEVELS + 1);
  const starts = new Int32Array(LEVELS + 1);
  let order = new Int32Array(0);
  /** Matches only the current pixel ratio, so it fires when the window moves
   *  to a screen with another one. */
  let dprQuery: MediaQueryList | null = null;

  /** Resting dot radius, px: tiny until complete grows the dots together. */
  const size: Scalar = { v: DOT, s: 0 };
  const tint: Scalar = { v: 0, s: 0 };
  /** Starts out, so the first paint fades in instead of flashing full. */
  const fade: Scalar = { v: 0, s: 0 };
  /** 1 while the pointer is over the frame: the swell around it. */
  const hover: Scalar = { v: 0, s: 0 };
  /** 1 while the pointer holds the lens: only then does its center brighten. */
  const held: Scalar = { v: 0, s: 0 };

  const step = (
    o: Scalar,
    to: number,
    dt: number,
    keep: number,
    snap = false,
  ) => {
    if (input.current.reduce || snap) {
      o.v = to;
      o.s = 0;
      return false;
    }
    o.s = (o.s + (to - o.v) * SPRING_SWARM.stiffness * dt) * keep;
    o.v += o.s * dt;
    if (Math.abs(to - o.v) < 0.002 && Math.abs(o.s) < 0.002) {
      o.v = to;
      o.s = 0;
      return false;
    }
    return true;
  };

  /** A fresh spot for the drifting lens, kept off the edges. */
  const aim = () => {
    const m = Math.min(w, h) * 0.15;
    gx = m + Math.random() * (w - m * 2);
    gy = m + Math.random() * (h - m * 2);
  };

  const layout = (width: number, height: number) => {
    w = width;
    h = height;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    dprQuery?.removeEventListener("change", onDpr);
    dprQuery = window.matchMedia(
      `(resolution: ${window.devicePixelRatio || 1}dppx)`,
    );
    dprQuery.addEventListener("change", onDpr);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (!n) {
      lx = w / 2;
      ly = h / 2;
      aim();
    }
    // A hex grid with every home rounded to a whole pixel: columns exactly GAP
    // apart and centered, rows spread from the top edge to the bottom one
    // (about 10 or 11px apart) so no empty band is left above or below.
    const rows = Math.max(2, Math.round(h / ((GAP * Math.sqrt(3)) / 2)) + 1);
    const row = (h - DOT * 2) / (rows - 1);
    const top = DOT;
    const cols = Math.max(1, Math.floor(w / GAP));
    const left = (w - (cols - 1) * GAP - GAP / 2) / 2;
    const pts: number[] = [];
    for (let k = 0; k < rows; k++) {
      const py = Math.round(top + k * row);
      for (let c = 0; c < cols; c++) {
        pts.push(Math.round(left + (k % 2) * (GAP / 2) + c * GAP), py);
      }
    }
    n = pts.length / 2;
    const make = () => new Float32Array(n);
    hx = make();
    hy = make();
    x = make();
    y = make();
    vx = make();
    vy = make();
    rr = make();
    order = new Int32Array(n);
    al = new Uint8Array(n).fill(Math.round(fade.v * LEVELS));
    for (let i = 0; i < n; i++) {
      x[i] = hx[i] = pts[i * 2]!;
      y[i] = hy[i] = pts[i * 2 + 1]!;
    }
    sample();
  };

  /** Reads the image color under every dot's home, once per image and size. */
  const sample = () => {
    tints = [];
    // Not loaded yet: its size is 0 and every pixel would read black.
    if (!image || !n || !image.complete || !image.naturalWidth) return;
    const cols = Math.max(1, Math.round(w / GAP));
    const rows = Math.max(1, Math.round(h / GAP));
    const off = document.createElement("canvas");
    off.width = cols;
    off.height = rows;
    const g = off.getContext("2d", { willReadFrequently: true });
    if (!g) return;
    // object-cover at the focus point, the way the img itself is drawn.
    const k = Math.max(cols / image.naturalWidth, rows / image.naturalHeight);
    const dw = image.naturalWidth * k;
    const dh = image.naturalHeight * k;
    g.imageSmoothingQuality = "high";
    g.drawImage(image, (cols - dw) * fx, (rows - dh) * fy, dw, dh);
    let data: Uint8ClampedArray;
    try {
      data = g.getImageData(0, 0, cols, rows).data;
    } catch {
      // Another domain without CORS (or no crossOrigin): the canvas is
      // tainted and can't be read. Dots stay ink.
      return;
    }
    // 4 bits a channel: a few hundred fills at most, one path each.
    const groups = new Map<number, number[]>();
    for (let i = 0; i < n; i++) {
      const px = Math.min(cols - 1, Math.floor((hx[i]! / w) * cols));
      const py = Math.min(rows - 1, Math.floor((hy[i]! / h) * rows));
      const o = (py * cols + px) * 4;
      // Mostly transparent: no color to take, so the dot keeps the ink.
      const key =
        data[o + 3]! < 128
          ? -1
          : ((data[o]! >> 4) << 8) |
            ((data[o + 1]! >> 4) << 4) |
            (data[o + 2]! >> 4);
      const list = groups.get(key);
      if (list) list.push(i);
      else groups.set(key, [i]);
    }
    tints = [...groups].map(([key, list]) => ({
      fill:
        key < 0
          ? null
          : `rgb(${(key >> 8) * 17} ${((key >> 4) & 15) * 17} ${(key & 15) * 17})`,
      dots: Int32Array.from(list),
    }));
  };

  const dot = (i: number) => {
    const r = rr[i]!;
    ctx.moveTo(x[i]! + r, y[i]!);
    ctx.arc(x[i]!, y[i]!, r, 0, Math.PI * 2);
  };

  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (fade.v <= 0.003) return;
    // One path per opacity level the dots actually use; outside the lens
    // every dot shares one. The dots are bucketed by level first (a counting
    // sort), so a tint group pays only for the levels it has, never an empty
    // fill per level.
    const fill = (style: string, dots: Int32Array | null, k: number) => {
      const m = dots ? dots.length : n;
      counts.fill(0);
      for (let j = 0; j < m; j++) counts[al[dots ? dots[j]! : j]!] += 1;
      let sum = 0;
      for (let lv = 0; lv <= LEVELS; lv++) {
        starts[lv] = sum;
        sum += counts[lv]!;
      }
      for (let j = 0; j < m; j++) {
        const i = dots ? dots[j]! : j;
        const lv = al[i]!;
        order[starts[lv]!] = i;
        starts[lv] += 1;
      }
      ctx.fillStyle = style;
      // Level 0 is fully transparent: skipped.
      let j = counts[0]!;
      for (let lv = 1; lv <= LEVELS; lv++) {
        const c = counts[lv]!;
        if (!c) continue;
        ctx.globalAlpha = (lv / LEVELS) * k;
        ctx.beginPath();
        for (const end = j + c; j < end; j++) dot(order[j]!);
        ctx.fill();
      }
    };
    const colored = tints.length ? tint.v : 0;
    // A true crossfade: the ink fades out as the image colors fade in. Ink
    // left at full strength under them showed its antialiased edge around
    // every tinted dot, so mid-switch the swollen dots read as hollow rings.
    if (colored < 0.999) fill(ink, null, 1 - colored);
    if (colored > 0.001)
      for (const group of tints) fill(group.fill ?? ink, group.dots, colored);
    ctx.globalAlpha = 1;
  };

  const tick = (now: number) => {
    const dt = prev ? Math.min(2.5, Math.max(0, (now - prev) / 16.67)) : 1;
    prev = now;
    const { status, reduce, hasMedia } = input.current;
    const keep = SPRING_SWARM.damping ** dt;
    const toned = tints.length > 0;

    // While nothing shows, size and tint jump to where they belong: a run
    // restarting after complete would otherwise fade in the grown, merged
    // dots as a bright sheet before they shrink back.
    const hidden = fade.v <= 0.003;
    // Complete grows past the hex grid's covering radius (GAP / sqrt 3).
    let busy = step(
      size,
      status === "complete" && hasMedia ? GAP * 0.6 : DOT,
      dt,
      keep,
      hidden,
    );
    busy =
      step(
        tint,
        (status === "refining" || status === "complete") && toned ? 1 : 0,
        dt,
        keep,
        hidden,
      ) || busy;
    busy =
      step(
        fade,
        status === "complete" && hasMedia
          ? 0
          : status === "queued" || status === "generating"
            ? 0.25
            : status === "error"
              ? 0.45
              : 1,
        dt,
        keep,
      ) || busy;
    const wander =
      (status === "generating" || status === "refining") && !reduce;
    busy = step(hover, pointer || wander ? 1 : 0, dt, keep) || busy;
    busy = step(held, pointer ? 1 : 0, dt, keep) || busy;

    const short = Math.min(w, h);
    if (pointer && reduce) {
      lx = pointer.x;
      ly = pointer.y;
    } else if (pointer) {
      // Glides onto the pointer, so a lens already drifting doesn't teleport.
      lvx = (lvx + (pointer.x - lx) * SPRING_SWARM.stiffness * dt) * keep;
      lvy = (lvy + (pointer.y - ly) * SPRING_SWARM.stiffness * dt) * keep;
      lx += lvx * dt;
      ly += lvy * dt;
      if (Math.hypot(pointer.x - lx, pointer.y - ly) > 0.1) busy = true;
    } else if (wander) {
      // Steers toward the goal and takes a new one before arriving, so the
      // path keeps curving and never stops.
      const dx = gx - lx;
      const dy = gy - ly;
      const d = Math.hypot(dx, dy);
      if (d < short * 0.12) aim();
      else {
        const speed = short * SPRING_WANDER.speed;
        lvx += ((dx / d) * speed - lvx) * SPRING_WANDER.steer * dt;
        lvy += ((dy / d) * speed - lvy) * SPRING_WANDER.steer * dt;
      }
      lx += lvx * dt;
      ly += lvy * dt;
      busy = true;
    } else {
      lvx = 0;
      lvy = 0;
    }

    const base = size.v;
    const swell = short * 0.294;
    const lit = hover.v > 0.001;
    for (let i = 0; i < n; i++) {
      const tx = hx[i]!;
      const ty = hy[i]!;
      let grow = 0;
      if (lit) {
        // Measured from the home, so a pushed dot keeps its size.
        const d = Math.hypot(tx - lx, ty - ly);
        // Linear, so the size stays visible as far out as the brightness.
        if (d < swell) grow = (1 - d / swell) * hover.v;
      }
      // Swells to a set size, so dots already grown for complete stay put.
      rr[i] = Math.max(base, DOT + grow * (PEAK - DOT));
      // Brightens toward the center, never dims a dot. Squared: a grown dot
      // already reads brighter by its area, so on the size's linear falloff
      // the whole lens looked evenly lit; this keeps a visible gradient that
      // still lands on the default opacity at the edge.
      al[i] = Math.round(
        (fade.v + grow * grow * Math.max(0, held.v - fade.v)) * LEVELS,
      );
      if (reduce) {
        x[i] = tx;
        y[i] = ty;
        vx[i] = 0;
        vy[i] = 0;
        continue;
      }
      if (lit) {
        const dx = x[i]! - lx;
        const dy = y[i]! - ly;
        const dd = Math.hypot(dx, dy);
        if (dd < swell && dd > 0.01) {
          // The click's burst held open, strongest at the center, so the
          // lens hollows out and fans the dots around it, adrift or held.
          const f = (1 - dd / swell) * 0.8 * hover.v;
          vx[i] += (dx / dd) * f * dt;
          vy[i] += (dy / dd) * f * dt;
        }
      }
      vx[i] = (vx[i]! + (tx - x[i]!) * SPRING_SWARM.stiffness * dt) * keep;
      vy[i] = (vy[i]! + (ty - y[i]!) * SPRING_SWARM.stiffness * dt) * keep;
      x[i] += vx[i]! * dt;
      y[i] += vy[i]! * dt;
      if (
        Math.abs(tx - x[i]!) < 0.05 &&
        Math.abs(ty - y[i]!) < 0.05 &&
        Math.abs(vx[i]!) < 0.02 &&
        Math.abs(vy[i]!) < 0.02
      ) {
        x[i] = tx;
        y[i] = ty;
        vx[i] = 0;
        vy[i] = 0;
      } else busy = true;
    }
    draw();
    // Parks once everything has settled, or while scrolled out of view.
    const more = busy && visible;
    if (!more) prev = 0;
    return more;
  };

  const wake = () => {
    if (visible && n) startLoop(tick);
  };

  /** A new pixel ratio: lay the grid out again at the new resolution. */
  const onDpr = () => {
    if (!w || !h) return;
    layout(w, h);
    draw();
    wake();
  };

  const resizer = new ResizeObserver(([entry]) => {
    const { width, height } = entry!.contentRect;
    if (!width || !height || (width === w && height === h)) return;
    layout(width, height);
    draw();
    wake();
  });
  resizer.observe(canvas);

  const viewer = new IntersectionObserver(([entry]) => {
    visible = entry!.isIntersecting;
    if (visible) wake();
  });
  viewer.observe(canvas);

  // The ink is the canvas's own text color; a theme switch changes it.
  const restyle = () => {
    ink = getComputedStyle(canvas).color;
    draw();
    wake();
  };
  const unwatch = watchTheme(restyle);

  return {
    restyle,
    wake,
    setImage(
      src: string | undefined,
      focus: { x: number; y: number },
      crossOrigin: string | undefined,
    ) {
      fx = focus.x / 100;
      fy = focus.y / 100;
      image = null;
      tints = [];
      if (!src) return;
      const img = new Image();
      // The same mode as the visible img, so this is a cache hit, not a
      // second download. Without one, a cross-origin image taints the read.
      if (crossOrigin) img.crossOrigin = crossOrigin;
      img.decoding = "async";
      img.onload = () => {
        if (image !== img) return;
        sample();
        wake();
      };
      image = img;
      img.src = src;
    },
    /** Pulls the lens onto a point; null lets go. */
    point(p: { x: number; y: number } | null) {
      pointer = p;
      wake();
    },
    /** A ripple out from a point that throws the dots, then they come home. */
    shock(px: number, py: number, power: number) {
      const far = Math.min(w, h) * 0.45;
      for (let i = 0; i < n; i++) {
        const dx = x[i]! - px;
        const dy = y[i]! - py;
        const dd = Math.hypot(dx, dy);
        if (dd > far || dd < 0.01) continue;
        const f = (1 - dd / far) * power;
        vx[i] += (dx / dd) * f;
        vy[i] += (dy / dd) * f;
      }
      wake();
    },
    center: () => ({ x: w / 2, y: h / 2 }),
    destroy() {
      loops.delete(tick);
      image = null;
      resizer.disconnect();
      viewer.disconnect();
      dprQuery?.removeEventListener("change", onDpr);
      unwatch();
    },
  };
}

type Swarm = NonNullable<ReturnType<typeof createSwarm>>;

function SwarmCanvas({
  status,
  src,
  crossOrigin,
  focus,
  hasMedia,
  interactive,
  reduce,
}: SwarmInput & {
  src?: string;
  crossOrigin?: string;
  focus: { x: number; y: number };
  interactive: boolean;
}) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const swarm = React.useRef<Swarm | null>(null);
  const input = React.useRef<SwarmInput>({ status, reduce, hasMedia });
  // Read by the loop between renders, so updated on commit, not in render.
  React.useLayoutEffect(() => {
    input.current = { status, reduce, hasMedia };
  });
  const last = React.useRef(status);

  React.useEffect(() => {
    const s = ref.current && createSwarm(ref.current, input);
    swarm.current = s;
    s?.restyle();
    return () => {
      s?.destroy();
      swarm.current = null;
    };
  }, []);

  // By value, so an inline { x, y } doesn't reload the image every render.
  const { x: fx, y: fy } = focus;
  React.useEffect(() => {
    swarm.current?.setImage(src, { x: fx, y: fy }, crossOrigin);
  }, [src, fx, fy, crossOrigin]);

  React.useEffect(() => {
    const s = swarm.current;
    if (!s) return;
    // A failure lands as a ripple from the middle before the dots sag.
    if (status === "error" && last.current !== "error" && !reduce) {
      const c = s.center();
      s.shock(c.x, c.y, 6);
    }
    last.current = status;
    s.restyle();
  }, [status, reduce, hasMedia]);

  const live = interactive && !reduce && isActive(status);
  // Once the dots stop reacting, a lens the pointer was holding lets go:
  // the canvas no longer gets the pointerleave that would have released it.
  React.useEffect(() => {
    if (!live) swarm.current?.point(null);
  }, [live]);
  const at = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cn(
        "absolute inset-0 size-full",
        status === "error" ? "text-destructive" : "text-foreground",
        // Out of the way when it doesn't react, so a right-click, long-press
        // or drag reaches the finished image under it.
        !live && "pointer-events-none",
      )}
      onPointerMove={(e) => {
        // A finger drags the page; only a mouse or pen pushes the dots.
        if (live && e.pointerType !== "touch") swarm.current?.point(at(e));
      }}
      onPointerLeave={() => swarm.current?.point(null)}
      onPointerDown={(e) => {
        if (!live) return;
        const p = at(e);
        swarm.current?.shock(p.x, p.y, 6);
      }}
    />
  );
}

/* ─── Status line ─── */

/** One orb per busy state: idle in the queue, building the shape, plaiting
 *  the details together. */
const ORB: Record<"queued" | "generating" | "refining", OrbState> = {
  queued: "working",
  generating: "shaping",
  refining: "connecting",
};

function StatusMark({ status }: { status: ImageGenerationStatus }) {
  if (status === "complete")
    return <IconTickCircle variant="Bold" aria-hidden className="size-6" />;
  if (status === "error")
    return <IconAlertCircle variant="Bold" aria-hidden className="size-6" />;
  // Nearly fills the 36px tile, on no background of its own, at its tuned 32
  // size so it stays crisp. The orb handles reduced motion itself (one still
  // frame).
  return (
    <ThinkingOrb
      state={ORB[status]}
      size={32}
      aria-hidden
      className="shrink-0"
    />
  );
}

/* ─── Image Generation ─── */

/** The retry button under the frame. */
const ACTION =
  "mt-2 inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-medium text-foreground outline-none transition-colors duration-200 ease-out hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring";

export const ImageGeneration = React.forwardRef<
  HTMLDivElement,
  ImageGenerationProps
>(
  (
    {
      status = "generating",
      src,
      children,
      tintSrc,
      crossOrigin,
      prompt,
      label,
      aspectRatio = "4 / 5",
      focus = CENTER,
      interactive = true,
      statusText,
      showStatus = true,
      onRetry,
      retryLabel = "Try again",
      download,
      downloadLabel = "Download",
      classNames,
      className,
      ...props
    },
    ref,
  ) => {
    const reduce = useReducedMotionPreference();
    const active = isActive(status);
    const text = statusText?.[status] ?? STATUS_TEXT[status];
    const name = label ?? (prompt ? `${text}: ${prompt}` : text);
    const media =
      children ??
      (src ? (
        <img
          src={src}
          alt=""
          crossOrigin={crossOrigin}
          decoding="async"
          style={{ objectPosition: `${focus.x}% ${focus.y}%` }}
        />
      ) : null);
    // children of false or null (a {ready && <Image />}) render nothing, so
    // they count as no media: the dots must not fade out over an empty frame.
    const hasMedia = media != null && media !== false;
    const look = MEDIA[status];

    return (
      <div
        ref={ref}
        data-state={status}
        aria-busy={active}
        className={cn("w-full max-w-xs", className)}
        {...props}
      >
        {/* The download button sits over the frame, not in it: role="img"
            hides whatever is inside it from assistive tech. */}
        <div className="relative">
          <div
            role="img"
            aria-label={name}
            style={{ aspectRatio }}
            className={cn(
              "relative isolate w-full overflow-hidden rounded-xl bg-muted",
              classNames?.frame,
            )}
          >
            {hasMedia ? (
              <motion.div
                aria-hidden
                initial={false}
                animate={reduce ? { ...look, scale: 1 } : look}
                transition={{ duration: 0.6, ease: EASE_OUT }}
                className={cn(
                  "absolute inset-0 *:size-full *:object-cover",
                  classNames?.media,
                )}
              >
                {media}
              </motion.div>
            ) : null}

            <SwarmCanvas
              status={status}
              src={tintSrc ?? src}
              crossOrigin={crossOrigin}
              focus={focus}
              hasMedia={hasMedia}
              interactive={interactive}
              reduce={reduce}
            />
          </div>

          {/* Like retry, it shows up without taking focus. */}
          {status === "complete" && download && src ? (
            <motion.button
              type="button"
              aria-label={downloadLabel}
              title={downloadLabel}
              onClick={() =>
                saveImage(
                  src,
                  typeof download === "string"
                    ? download
                    : src.split(/[?#]/)[0].split("/").pop() || "image",
                  crossOrigin,
                )
              }
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={reduce ? undefined : { scale: 0.92 }}
              transition={SPRING_PRESS}
              className="absolute top-2 right-2 grid size-9 cursor-pointer place-items-center rounded-full bg-background/80 text-foreground outline-none backdrop-blur-sm transition-colors duration-200 ease-out hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <IconDownloadMinimalistic aria-hidden className="size-5" />
            </motion.button>
          ) : null}
        </div>

        {/* Always present, so the status is announced even with the visible
            line hidden; the visible line is aria-hidden to avoid reading it
            twice. */}
        <span aria-live="polite" className="sr-only">
          {text}
        </span>

        {showStatus || prompt ? (
          <div className="mt-3 flex items-center gap-3 text-left">
            {showStatus ? (
              // One tile as tall as both lines, so the mark centers on the
              // pair instead of riding the first one. Marks trade places in
              // the same cell.
              <span
                aria-hidden
                className={cn(
                  "grid size-9 shrink-0 place-items-center text-foreground transition-colors duration-300 ease-out",
                  // Every mark stands on its own, with no tile behind it.
                  status === "error" && "text-destructive",
                )}
              >
                <AnimatePresence initial={false}>
                  <motion.span
                    // Keyed by status, so each busy state crossfades to its
                    // own orb instead of cutting from one to the next.
                    key={status}
                    initial={
                      reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                    transition={SPRING_SWAP}
                    className="grid place-items-center [grid-area:1/1]"
                  >
                    <StatusMark status={status} />
                  </motion.span>
                </AnimatePresence>
              </span>
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col">
              {showStatus ? (
                <div
                  aria-hidden
                  className={cn(
                    "grid text-sm/5 font-medium text-foreground",
                    status === "error" && "text-destructive",
                    classNames?.status,
                  )}
                >
                  <AnimatePresence initial={false}>
                    <motion.span
                      key={text}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                      transition={SPRING_SWAP}
                      className="truncate [grid-area:1/1]"
                    >
                      {text}
                    </motion.span>
                  </AnimatePresence>
                </div>
              ) : null}
              {prompt ? (
                <p
                  title={prompt}
                  className="truncate text-xs/4 text-muted-foreground"
                >
                  {prompt}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* It appears without taking focus, on purpose: a failure arrives on
            its own, and pulling focus to it would yank a keyboard user away
            from wherever they are. The live region already announces it. */}
        {status === "error" && onRetry ? (
          <motion.button
            type="button"
            onClick={onRetry}
            whileTap={reduce ? undefined : { scale: 0.96 }}
            transition={SPRING_PRESS}
            className={ACTION}
          >
            <IconRefresh aria-hidden className="size-4" />
            {retryLabel}
          </motion.button>
        ) : null}
      </div>
    );
  },
);
ImageGeneration.displayName = "ImageGeneration";
