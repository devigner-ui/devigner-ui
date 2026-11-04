"use client";

// Liquid Glass, shared by the components drawn in it (Liquid Glass's menu,
// Morphing Popover): the lens that bends the page behind a shape, the shape
// math, the press wobble and the zoom text uses to arrive on the glass.

import * as React from "react";
import {
  animate,
  frame,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "cn";
import { EASE_OUT, TWEEN_MAGNET, TWEEN_MAGNET_RELEASE } from "./easing";

/** Height of the closed pill in px, and its corner radius. */
export const H = 48;
export const R = H / 2;
/** Width of the curved bevel along the rim, in px: the band that bends what
 *  is behind the glass. Inside it the glass is flat and clear. */
const BEZEL = R * 0.5;
/** Peak lens shift at the very edge, in px: the rim shows what sits this far
 *  inward, so content bends along the curve. Kept under BEZEL / 1.5 so the
 *  bend squeezes content toward the edge without folding it back, which
 *  tears into jagged blobs. */
const SHIFT = BEZEL * 0.6;
/** How much less green and blue bend than red: the thin rainbow fringe real
 *  glass leaves along its rim. */
const DISPERSION = [1, 0.97, 0.94];
export const GLOW =
  "radial-gradient(closest-side, rgb(255 255 255 / 0.55), rgb(255 255 255 / 0.18))";
/** Color matrices keeping only red, only green, only blue. */
const CHANNELS = [
  "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
  "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
  "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
];

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const n = (v: number) => +v.toFixed(2);

/** Corner curves, in CSS's terms: `corner-shape: superellipse(c)` draws
 *  |x|ⁿ + |y|ⁿ = rⁿ with n = 2^c, so 1 is round and 2 is `squircle`. A full
 *  squircle on a pill reads as a rounded box, so the closed pill keeps a
 *  gentle one and the open panel firms up as it swells. */
export const PILL_CURVE = 1.1;
export const PANEL_CURVE = 1.3;
/** PILL_CURVE on the CSS-drawn parts, round where it is unsupported. */
export const PILL_CSS =
  "supports-[corner-shape:superellipse(1.1)]:[corner-shape:superellipse(1.1)]";

/** How far a corner's cubic handles reach toward the corner, as a share of
 *  the radius, so the cubic passes through the curve's midpoint. It strays
 *  under 1% of the radius anywhere else. */
const handle = (c: number) => (0.5 ** (1 / 2 ** c) - 0.5) / 0.375;

/** A rectangle from (0, 0) with superellipse corners of curve c. With the
 *  radius at half the height it is a pill. */
function roundRect(w: number, h: number, r: number, c: number) {
  const k = Math.min(r, w / 2, h / 2);
  const s = k * handle(c);
  const pt = (x: number, y: number) => `${n(x)} ${n(y)}`;
  return (
    `M${pt(k, h)}L${pt(w - k, h)}` +
    `C${pt(w - k + s, h)} ${pt(w, h - k + s)} ${pt(w, h - k)}L${pt(w, k)}` +
    `C${pt(w, k - s)} ${pt(w - k + s, 0)} ${pt(w - k, 0)}L${pt(k, 0)}` +
    `C${pt(k - s, 0)} ${pt(0, k - s)} ${pt(0, k)}L${pt(0, h - k)}` +
    `C${pt(0, h - k + s)} ${pt(k - s, h)} ${pt(k, h)}Z`
  );
}

/** A signed distance field, negative inside. `inner` is a box (x0, x1, y0,
 *  y1 in CSS px) where every point is known to lie deeper than the bevel,
 *  so the lens map can skip it. */
type Field = ((u: number, v: number) => number) & {
  inner?: [number, number, number, number];
};

/** Signed distance to that shape. The corners measure with the n-norm
 *  instead of the round one, so their level lines share the corner's curve
 *  and the lens bends along the real corner. Built once per map: the shape's
 *  constants are worked out up front, and each branch below returns exactly
 *  what the full formula would, just without the powers it doesn't need. */
function rectField(w: number, h: number, r: number, c: number): Field {
  const k = Math.min(r, w / 2, h / 2);
  const e = 2 ** c;
  const ie = 1 / e;
  const hw = w / 2;
  const hh = h / 2;
  const ax = hw - k;
  const ay = hh - k;
  const xs = new Map<number, number>();
  const ys = new Map<number, number>();
  const sd: Field = (px, py) => {
    const qx = Math.abs(px - hw) - ax;
    const qy = Math.abs(py - hh) - ay;
    // Within both straight spans the norm term is exactly 0, so d is just
    // minus the distance to the nearest side.
    if (qx <= 0 && qy <= 0) return Math.max(qx, qy) - k;
    // Along a straight side only one span pokes out, so d depends on that
    // coordinate alone and the same few values recur row after row.
    if (qy <= 0) {
      let d = xs.get(px);
      if (d === undefined) xs.set(px, (d = (qx ** e + 0) ** ie + 0 - k));
      return d;
    }
    if (qx <= 0) {
      let d = ys.get(py);
      if (d === undefined) ys.set(py, (d = (0 + qy ** e) ** ie + 0 - k));
      return d;
    }
    return (qx ** e + qy ** e) ** ie + 0 - k;
  };
  // Where both spans are straight and the sides are more than the bevel
  // away, no pixel can bend. The extra px keeps rounding at its border out.
  const B = BEZEL + 1;
  sd.inner = [
    Math.max(k, B),
    Math.min(w - k, w - B),
    Math.max(k, B),
    Math.min(h - k, h - B),
  ];
  return sd;
}

/** The superellipse-cornered rectangle's shape: the menu's pill and panel. */
export function useRectShape(
  w: MotionValue<number>,
  h: MotionValue<number>,
  r: MotionValue<number>,
  c: MotionValue<number>,
): GlassShape {
  const d = useTransform([w, h, r, c], ([a, b, k, e]: number[]) =>
    roundRect(a, b, k, e),
  );
  const field = React.useCallback(
    () => rectField(w.get(), h.get(), r.get(), c.get()),
    [w, h, r, c],
  );
  return React.useMemo(
    () => ({ d, width: w, height: h, field }),
    [d, w, h, field],
  );
}

/** A shape the glass can take: its outline, its size, and a signed distance
 *  field for the lens map, read at paint time. */
export interface GlassShape {
  d: MotionValue<string>;
  width: MotionValue<number>;
  height: MotionValue<number>;
  field: () => Field;
}

/** One pixel at rest: r 128 (no x shift), g 0, b 128 (no y shift), a 255,
 *  packed in the platform's byte order for a whole-buffer fill. */
const STILL = new Uint32Array(new Uint8Array([128, 0, 128, 255]).buffer)[0];

/** The canvas a lens map is drawn on, with its context and pixel buffer,
 *  kept from one map to the next: a fresh buffer every frame is over 100 KB
 *  of garbage for a panel. The fill below resets every byte of it. */
interface MapCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  img: ImageData | null;
}

/** Displacement map for the lens: red carries the x shift and blue the y
 *  shift, 50% is still. Across the bevel the shift points inward and grows
 *  toward the edge on a convex curve, so the rim bends what is behind it and
 *  the middle stays clear. s is pixels per CSS px. The map starts still,
 *  and the field's inner box, which can't bend, is never visited.
 *  It is drawn in slices: the returned step draws rows until `late()` says
 *  its time is up, and returns true once the map is on the canvas. A sharp
 *  map of a big panel is several frames of work, and in one piece it
 *  blocked the page. Null when there is no canvas context. */
function lensMap(
  target: MapCanvas,
  width: number,
  height: number,
  sd: Field,
  s: number,
): ((late: () => boolean) => boolean) | null {
  const cw = Math.ceil(width * s);
  const ch = Math.ceil(height * s);
  const { canvas } = target;
  // putImageData replaces every pixel, so an unchanged size needs no reset.
  if (canvas.width !== cw) canvas.width = cw;
  if (canvas.height !== ch) canvas.height = ch;
  // Kept in memory, not on the GPU: the map is read back to encode it every
  // frame, and a GPU canvas stalls the main thread on each read.
  target.ctx ??= canvas.getContext("2d", { willReadFrequently: true });
  const ctx = target.ctx;
  if (!ctx) return null;
  if (target.img?.width !== cw || target.img.height !== ch)
    target.img = ctx.createImageData(cw, ch);
  const img = target.img;
  const px = img.data;
  new Uint32Array(px.buffer, px.byteOffset, cw * ch).fill(STILL);
  const [x0, x1, y0, y1] = sd.inner ?? [0, -1, 0, -1];
  const i0 = Math.ceil(x0 * s - 0.5);
  const i1 = Math.floor(x1 * s - 0.5);
  const j0 = Math.ceil(y0 * s - 0.5);
  const j1 = Math.floor(y1 * s - 0.5);
  let j = 0;
  return (late) => {
    for (; j < ch; j++) {
      if (late()) return false;
      row(j);
    }
    ctx.putImageData(img, 0, 0);
    return true;
  };

  function row(j: number) {
    const v = (j + 0.5) / s;
    const skip = j >= j0 && j <= j1 && i1 >= i0;
    for (let i = 0; i < cw; i++) {
      if (skip && i === i0) {
        i = i1;
        continue;
      }
      const u = (i + 0.5) / s;
      const d = sd(u, v);
      if (d < 0 && d > -BEZEL) {
        const gx = sd(u + 0.5, v) - sd(u - 0.5, v);
        const gy = sd(u, v + 0.5) - sd(u, v - 0.5);
        const len = Math.hypot(gx, gy) || 1;
        // Steep at the edge, flat by the inner edge of the bevel: the slope
        // of a rounded glass rim.
        const k = (1 + d / BEZEL) ** 1.5 / 2;
        const o = (j * cw + i) * 4;
        px[o] = 128 - (gx / len) * k * 255;
        px[o + 2] = 128 - (gy / len) * k * 255;
      }
    }
  }
}

/** Runs `work` in slices of idle time until it returns true, handing it a
 *  `late()` that says the slice is used up. A slice is at least 4 ms, so the
 *  map lands even when the page is never idle. */
function inSlices(work: (late: () => boolean) => boolean, then: () => void) {
  const slice = (budget: number) => {
    const end = performance.now() + Math.max(budget, 4);
    if (work(() => performance.now() > end)) then();
    else next();
  };
  const next = () => {
    if (typeof requestIdleCallback === "function")
      requestIdleCallback((idle) => slice(idle.timeRemaining()), {
        timeout: 50,
      });
    else setTimeout(() => slice(8), 0);
  };
  next();
}

/** The lens handing over to the frost as the shape starts to move, and back
 *  once the new map has landed. Short, so the bend is gone before the shape
 *  has moved far from the map it was drawn for. */
const LENS_FADE = { duration: 0.15, ease: EASE_OUT } as const;

/** How far the glass swells under a finger. The release overshoots a
 *  fraction of this, so the wobble stays around a percent. */
const SWELL = 1.04;

/** Elastic press feedback: the glass swells on press, and on release it
 *  springs back past rest once and settles, the way liquid does. kick is the
 *  same release without a press, for keyboard clicks and opening. Bind scale
 *  to the element's style. */
export function useJelly(off: boolean) {
  const scale = useMotionValue(1);
  const held = React.useRef(false);

  // Turning off mid-wobble (disabled, reduced motion) drops it at rest.
  React.useEffect(() => {
    if (!off) return;
    held.current = false;
    scale.jump(1);
  }, [off, scale]);

  return React.useMemo(
    () => ({
      scale,
      press() {
        if (off) return;
        held.current = true;
        animate(scale, SWELL, TWEEN_MAGNET);
      },
      release() {
        if (off || !held.current) return;
        held.current = false;
        animate(scale, 1, TWEEN_MAGNET_RELEASE);
      },
      kick() {
        if (off) return;
        held.current = false;
        animate(scale, [SWELL, 1], TWEEN_MAGNET_RELEASE);
      },
    }),
    [off, scale],
  );
}

/** Only Chromium renders an SVG filter inside backdrop-filter. Safari and
 *  Firefox parse it and draw nothing, so they get the frosted glass alone. */
function canRefract() {
  const brands = (
    navigator as Navigator & {
      userAgentData?: { brands?: { brand: string }[] };
    }
  ).userAgentData?.brands;
  return !!brands?.some((b) => b.brand === "Chromium");
}

/** Text arriving on the glass: it starts zoomed in and a little blurred, as
 *  if still under the lens, then settles to size and sharpens. Leaving, it
 *  runs back out the same way. */
export function zoomIn(show: boolean, reduced: boolean) {
  return {
    opacity: show ? 1 : 0,
    filter: show || reduced ? "blur(0px)" : "blur(4px)",
    scale: show || reduced ? 1 : 1.55,
  };
}

/** The glass itself, drawn to a shape's outline: the lens that bends the
 *  page behind it, the tint, the rim light and the shadow. children render
 *  inside the glass, clipped to it. It fills its parent, which sets the
 *  height. */
export function GlassSurface({
  shape: { d, width, height, field },
  transparency,
  hidden = false,
  children,
}: {
  shape: GlassShape;
  transparency: number;
  /** Hides the glass while its shape still holds a guessed size. */
  hidden?: boolean;
  children?: React.ReactNode;
}) {
  const uid = React.useId().replace(/:/g, "");
  const glass = React.useRef<HTMLDivElement>(null);
  const lenses = React.useRef<(SVGFilterElement | null)[]>([]);
  /** The twin filter the glass shows. */
  const active = React.useRef(0);
  /** A map is between drawing and showing, and another was asked for
   *  meanwhile, drawn from the shape as it is once the first lands. */
  const busy = React.useRef(false);
  const queued = React.useRef(false);
  /** The outline is changing: the lens is faded out for the frost. */
  const moving = React.useRef(false);
  /** The lens layer's opacity, and whether the frost layer shows. */
  const lensFade = useMotionValue(1);
  const lensShown = useTransform(lensFade, (v) =>
    v > 0 ? "visible" : "hidden",
  );
  const frostShown = useMotionValue<"visible" | "hidden">("hidden");
  const map = React.useRef<MapCanvas | null>(null);
  /** Each twin's map, freed once replaced. */
  const urls = React.useRef<string[]>([]);
  const settle = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const [refract, setRefract] = React.useState(false);
  const [solid, setSolid] = React.useState(false);

  React.useEffect(() => {
    setRefract(canRefract());
    // iOS swaps glass for a solid tint under Reduce Transparency; so do we.
    const query = matchMedia("(prefers-reduced-transparency: reduce)");
    const sync = () => setSolid(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const clip = useTransform(d, (v) => `path("${v}")`);

  // Even clear glass softens what is behind it a little; the tint and blur
  // build up toward the fully tinted end.
  const t = solid ? 1 : clamp(transparency, 0, 1);
  const blur = n(lerp(1.6, 10, t * t));
  const tint = `color-mix(in oklab, var(--background) ${n(lerp(3, 85, t))}%, transparent)`;
  const lensOn = refract && !solid;

  // The lens is drawn for the shape at rest only. Rebuilding its map every
  // frame of a morph (draw, encode, decode, then the whole filter chain over
  // the glass) cost more than a frame, so while the outline moves the lens
  // fades out over a plain frosted layer, and once it has settled a map is
  // drawn for the new shape and the lens fades back in.
  // The map is written straight to the DOM so a frame never waits on a React
  // render. Chromium decodes a new map after the frame that set it and never
  // repaints the backdrop when it lands, so the glass would keep an old map.
  // Instead the map goes into whichever of two twin filters is idle, and the
  // lens switches to it once the image has decoded. The PNG encodes off the
  // main thread (toBlob), at 2 pixels per CSS px, since the rim squeezes
  // content hard and a coarse map shows its steps.
  // Only one map is ever on its way. A request while one is drawing, encoding
  // or decoding is held and drawn from the shape as it stands when the first
  // lands, so a map that would be replaced before it could show is never
  // drawn at all.
  const paint = React.useCallback(
    function paint() {
      const el = glass.current;
      if (!el) return;
      if (busy.current) {
        queued.current = true;
        return;
      }
      busy.current = true;
      const done = () => {
        busy.current = false;
        if (!queued.current) return;
        queued.current = false;
        paint();
      };
      map.current ??= {
        canvas: document.createElement("canvas"),
        ctx: null,
        img: null,
      };
      const w = Math.max(width.get(), 1);
      const h = Math.max(height.get(), 1);
      const draw = lensMap(map.current, w, h, field(), 2);
      if (!draw) return done();
      const { canvas } = map.current;
      const encode = () =>
        canvas.toBlob((blob) => {
          const i = 1 - active.current;
          const f = lenses.current[i];
          const img = f?.querySelector("feImage");
          // Unmounted meanwhile: nothing to show it on.
          if (!blob || !f || !img || !glass.current) return done();
          const url = URL.createObjectURL(blob);
          const old = urls.current[i];
          urls.current[i] = url;
          f.setAttribute("width", `${w}`);
          f.setAttribute("height", `${h}`);
          img.setAttribute("width", `${w}`);
          img.setAttribute("height", `${h}`);
          img.setAttribute("href", url);
          if (old) URL.revokeObjectURL(old);
          const probe = new Image();
          probe.src = url;
          probe
            .decode()
            .catch(() => undefined)
            .then(() => {
              active.current = i;
              el.style.backdropFilter = `url(#${f.id})`;
              el.style.setProperty("-webkit-backdrop-filter", `url(#${f.id})`);
              // Settled, with no newer map on its way: this one fits, so the
              // lens comes back and the frost goes once it is covered.
              if (!moving.current && !queued.current)
                animate(lensFade, 1, LENS_FADE).then(() => {
                  if (!moving.current) frostShown.set("hidden");
                });
              done();
            });
        });
      // The shape starting to move again makes this map stale before it can
      // show, so it is dropped; the next rest draws a fresh one.
      let dropped = false;
      inSlices(
        (late) => (dropped = moving.current) || draw(late),
        () => (dropped || !glass.current ? done() : encode()),
      );
    },
    [width, height, field, lensFade, frostShown],
  );
  // Every input of the outline fires its own change, several a frame; the
  // scheduler keeps one callback per step, so this runs once per frame.
  const moved = React.useCallback(() => {
    if (!moving.current) {
      moving.current = true;
      frostShown.set("visible");
      animate(lensFade, 0, LENS_FADE);
    }
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      moving.current = false;
      paint();
    }, 120);
  }, [paint, lensFade, frostShown]);
  useMotionValueEvent(d, "change", () => {
    if (lensOn) frame.postRender(moved);
  });
  React.useLayoutEffect(() => {
    if (lensOn) paint();
  }, [lensOn, blur, paint]);
  React.useEffect(
    () => () => {
      clearTimeout(settle.current);
      urls.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );
  // The rim and shadow filters re-render with every frame the outline moves,
  // over their whole filter region, so each region is kept as small as its
  // effect. They used to be a share of the shape (10% round the rims, 50%
  // round the shadow), which on the open panel is mostly empty pixels. Each
  // pad is now the smaller of that share and what the effect reaches: the
  // rims reach at most 1px past the outline (the dilate), the shadow's blur
  // about 3 sigma (27px). On the small closed pill the share is already the
  // smaller one, so it is kept exactly; where it was bigger, it only ever
  // held transparent pixels.
  const rimFilters = React.useRef<(SVGFilterElement | null)[]>([]);
  const shadowFilter = React.useRef<SVGFilterElement | null>(null);
  const region = (pad: (side: number) => number) => {
    const w = width.get();
    const h = height.get();
    const px = pad(w);
    const py = pad(h);
    return { x: -px, y: -py, width: w + 2 * px, height: h + 2 * py };
  };
  const rimPad = (side: number) => Math.min(side * 0.1, 4);
  const shadowPad = (side: number) => Math.min(side * 0.5, 36);
  const fit = (el: SVGFilterElement | null, pad: (side: number) => number) => {
    if (!el) return;
    const r = region(pad);
    el.setAttribute("x", `${r.x}`);
    el.setAttribute("y", `${r.y}`);
    el.setAttribute("width", `${r.width}`);
    el.setAttribute("height", `${r.height}`);
  };
  // Straight to the DOM, in the same frame as the outline they surround.
  const refit = () => {
    rimFilters.current.forEach((el) => fit(el, rimPad));
    fit(shadowFilter.current, shadowPad);
  };
  useMotionValueEvent(width, "change", refit);
  useMotionValueEvent(height, "change", refit);
  const rimRegion = (slot: number) => ({
    ref: (el: SVGFilterElement | null) => {
      rimFilters.current[slot] = el;
    },
    filterUnits: "userSpaceOnUse",
    ...region(rimPad),
  });
  const shadowRegion = {
    ref: shadowFilter,
    filterUnits: "userSpaceOnUse",
    ...region(shadowPad),
  };

  // Frosted glass: the whole look where there is no lens, and what shows
  // through while the lens is faded out.
  const frost = `blur(${blur}px) saturate(1.2)`;

  return (
    <>
      <svg aria-hidden className="pointer-events-none absolute size-0">
        {/* Chromium's lens, twice (see paint): soften the backdrop as the
            tint builds, bend it along the rim by the map, red a little
            further than green and blue so the rim picks up a thin rainbow,
            then recombine the channels. */}
        {[0, 1].map((slot) => (
          <filter
            key={slot}
            ref={(el) => {
              lenses.current[slot] = el;
            }}
            id={`${uid}-lens-${slot}`}
            x="0"
            y="0"
            width={H}
            height={H}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={blur / 2}
              result="soft"
            />
            <feImage
              x="0"
              y="0"
              width={H}
              height={H}
              preserveAspectRatio="none"
              result="map"
            />
            {DISPERSION.map((k, i) => (
              <React.Fragment key={i}>
                <feDisplacementMap
                  in="soft"
                  in2="map"
                  scale={SHIFT * 2 * k}
                  xChannelSelector="R"
                  yChannelSelector="B"
                />
                <feColorMatrix
                  type="matrix"
                  values={CHANNELS[i]}
                  result={`c${i}`}
                />
              </React.Fragment>
            ))}
            <feBlend in="c0" in2="c1" mode="screen" result="rg" />
            <feBlend in="rg" in2="c2" mode="screen" result="rgb" />
            <feColorMatrix in="rgb" type="saturate" values="1.2" />
            {/* The bend samples the nearest pixel, so a squeezed rim steps
                on 1x screens; a hair of blur melts the steps into a
                smooth curve. */}
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        ))}
      </svg>

      {/* Every layer is as wide as the drawn shape, which can run past the
          layout box: a backdrop filter only reaches as far as its own
          element. Chromium aliases the prefixed backdrop property, so both
          carry one value. */}
      {lensOn && (
        <>
          {/* The frost the lens fades over while the shape moves; hidden at
              rest, so it costs nothing then. */}
          <motion.div
            aria-hidden
            className="absolute top-0 left-0 h-full"
            style={{
              width,
              clipPath: clip,
              WebkitClipPath: clip,
              backdropFilter: frost,
              WebkitBackdropFilter: frost,
              visibility: hidden ? "hidden" : frostShown,
            }}
          />
          {/* The lens; paint owns its backdrop filter. */}
          <motion.div
            ref={glass}
            aria-hidden
            className="absolute top-0 left-0 h-full"
            style={{
              width,
              clipPath: clip,
              WebkitClipPath: clip,
              opacity: lensFade,
              visibility: hidden ? "hidden" : lensShown,
            }}
          />
        </>
      )}
      <motion.div
        aria-hidden
        className={cn("absolute top-0 left-0 h-full", hidden && "invisible")}
        style={{
          width,
          clipPath: clip,
          WebkitClipPath: clip,
          background: tint,
          backdropFilter: lensOn ? undefined : frost,
          WebkitBackdropFilter: lensOn ? undefined : frost,
        }}
      >
        {children}
      </motion.div>

      <motion.svg
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-0 left-0 h-full overflow-visible",
          hidden && "invisible",
        )}
        style={{ width }}
      >
        <defs>
          <mask
            id={`${uid}-out`}
            maskUnits="userSpaceOnUse"
            x={-40}
            y={-40}
            width={4000}
            height={4000}
          >
            <rect x={-40} y={-40} width={4000} height={4000} fill="white" />
            <motion.path d={d} fill="black" />
          </mask>
          {/* Rims cut from the filled outline with morphology, so they
              follow the shape exactly as it morphs. */}
          <filter id={`${uid}-rim-in`} {...rimRegion(0)}>
            <feMorphology
              in="SourceAlpha"
              operator="erode"
              radius="1.25"
              result="core"
            />
            <feComposite in="SourceGraphic" in2="core" operator="out" />
          </filter>
          <filter id={`${uid}-rim-out`} {...rimRegion(1)}>
            <feMorphology
              in="SourceGraphic"
              operator="dilate"
              radius="1"
              result="grown"
            />
            <feComposite in="grown" in2="SourceGraphic" operator="out" />
          </filter>
          {/* Soft glow just inside the edge: the thickness of the rim
              catching light. */}
          <filter id={`${uid}-rim-glow`} {...rimRegion(2)}>
            <feMorphology
              in="SourceAlpha"
              operator="erode"
              radius="3"
              result="core"
            />
            <feGaussianBlur in="core" stdDeviation="3" result="soft" />
            <feComposite in="SourceGraphic" in2="soft" operator="out" />
          </filter>
          {/* Light from the top left: bright there, a second glint at the
              bottom right where it leaves the glass, dim between. */}
          <linearGradient id={`${uid}-spec`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="white" stopOpacity="1" />
            <stop offset="0.32" stopColor="white" stopOpacity="0.28" />
            <stop offset="0.68" stopColor="white" stopOpacity="0.28" />
            <stop offset="1" stopColor="white" stopOpacity="0.85" />
          </linearGradient>
          <mask
            id={`${uid}-spec-mask`}
            maskContentUnits="objectBoundingBox"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <rect width="1" height="1" fill={`url(#${uid}-spec)`} />
          </mask>
          <filter id={`${uid}-soft`} {...shadowRegion}>
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        {/* Shadow, kept outside the glass so it never muddies it. Black and
            white are light, not theme: a shadow is dark and a glint is
            bright in either theme. The mask sits on a group around the
            offset: a mask on the moved path would move with it and cut a
            shifted hole, leaking shadow into the glass. */}
        <g mask={`url(#${uid}-out)`}>
          <motion.path
            d={d}
            fill="black"
            opacity={0.12}
            transform="translate(0 6)"
            filter={`url(#${uid}-soft)`}
          />
        </g>
        {/* A faint dark line just outside the rim, so the edge holds on
            light backgrounds. Filled opaque so the cut is clean; the
            element's opacity sets the strength. */}
        <motion.path
          d={d}
          fill="var(--foreground)"
          opacity={0.08}
          filter={`url(#${uid}-rim-out)`}
        />
        <motion.path
          d={d}
          fill="white"
          opacity={0.35}
          filter={`url(#${uid}-rim-glow)`}
          mask={`url(#${uid}-spec-mask)`}
        />
        {/* The crisp specular line along the edge. */}
        <motion.path
          d={d}
          fill="white"
          filter={`url(#${uid}-rim-in)`}
          mask={`url(#${uid}-spec-mask)`}
        />
      </motion.svg>
    </>
  );
}

/* ─── Shader glass ─── */
// The other way to draw the glass: a WebGL lens over an image instead of
// the SVG lens over the page. A shader can't read the page, so it samples
// the image at the glass's spot on the element it fills. The rim masks, the
// 9 by 9 blur, the edge magnification and the top light follow the
// reference shader term for term, with its squircle (|x|^6 + |y|^6) grown
// into a rounded rectangle so it fits any size: q is how far into the
// corner band a pixel sits, 1 on the rim. rb is the reference's roundedBox
// times 10000, which keeps the math inside mediump range.

/** What the shader glass bends: an image and the element it fills. */
export interface GlassBackdrop {
  /** The image. Same origin, or served with CORS. Left out, the glass
   *  bends the solid color behind the area instead, so it still shows its
   *  rim and light over a plain background. */
  src?: string;
  /** The element the image fills, drawn like `object-fit: cover`, so the
   *  glass bends the part of it right under the glass. */
  area: React.RefObject<HTMLElement | null>;
}

const SHADER_VERTEX = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const SHADER_FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uSize;
uniform vec4 uBox;
uniform vec4 uImg;
uniform float uRadius;
uniform float uBlur;
uniform sampler2D uTex;
vec2 tex(vec2 p) { return (p - uImg.xy) / uImg.zw; }
void main() {
  vec2 f = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y) / uSize;
  vec2 h = uBox.zw * 0.5;
  vec2 c = uBox.xy + h;
  vec2 d = uBox.xy + f * uBox.zw - c;
  vec2 q = max(abs(d) - (h - uRadius), 0.0) / uRadius;
  float rb = pow(q.x, 6.0) + pow(q.y, 6.0);
  float rb1 = clamp((1.0 - rb) * 8.0, 0.0, 1.0);
  float rb2 = clamp((0.95 - rb * 0.95) * 16.0, 0.0, 1.0)
    - clamp((0.9 - rb * 0.95) * 16.0, 0.0, 1.0);
  float rb3 = clamp((1.5 - rb * 1.1) * 2.0, 0.0, 1.0)
    - clamp((1.0 - rb * 1.1) * 2.0, 0.0, 1.0);
  vec4 base = texture2D(uTex, tex(c + d));
  float transition = smoothstep(0.0, 1.0, rb1 + rb2);
  if (transition <= 0.0) { gl_FragColor = base; return; }
  vec2 lens = tex(c + d * (1.0 - rb * 0.5));
  vec2 px = uBlur / 8.0 / uImg.zw;
  vec4 col = vec4(0.0);
  for (float x = -4.0; x <= 4.0; x++) {
    for (float y = -4.0; y <= 4.0; y++) {
      col += texture2D(uTex, lens + vec2(x, y) * px);
    }
  }
  col /= 81.0;
  float my = -d.y / h.y * 0.2154;
  float g = clamp((clamp(my, 0.0, 0.2) + 0.1) / 2.0, 0.0, 1.0)
    + clamp((clamp(-my, -1000.0, 0.2) * rb3 + 0.1) / 2.0, 0.0, 1.0);
  vec4 lit = clamp(col + vec4(rb1) * g + vec4(rb2) * 0.3, 0.0, 1.0);
  gl_FragColor = mix(base, lit, transition);
}`;

/** The glass drawn by the shader, clipped to the shape's outline. It draws
 *  every frame it is on screen and follows its own box as the shape
 *  springs. Without WebGL, or before the image loads, it shows the image
 *  plainly through the clip. children render on the glass. */
export function ShaderSurface({
  backdrop: { src, area },
  transparency,
  blur = 4,
  radius,
  clip,
  hidden = false,
  children,
}: {
  backdrop: GlassBackdrop;
  /** 0 clear to 1 fully tinted, the same scale as GlassSurface: the theme
   *  background mixed over the shader, so text keeps its contrast. */
  transparency: number;
  /** How far the blur spreads, in px. 4, the reference shader's, by
   *  default. */
  blur?: number;
  /** The shape's corner radius in px, read every frame. */
  radius: MotionValue<number>;
  /** The shape's outline as a CSS clip-path. */
  clip: MotionValue<string>;
  hidden?: boolean;
  children?: React.ReactNode;
}) {
  const canvas = React.useRef<HTMLCanvasElement>(null);
  // Read by the draw loop, so changing it doesn't rebuild the context.
  const blurRef = React.useRef(blur);
  blurRef.current = Math.max(0, blur);

  React.useEffect(() => {
    const el = canvas.current;
    const gl = el?.getContext("webgl", { antialias: false });
    if (!el || !gl) return;
    const shader = (type: number, code: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, code);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, SHADER_VERTEX));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, SHADER_FRAGMENT));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const at = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(at);
    gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
    const uSize = gl.getUniformLocation(prog, "uSize");
    const uBox = gl.getUniformLocation(prog, "uBox");
    const uImg = gl.getUniformLocation(prog, "uImg");
    const uRadius = gl.getUniformLocation(prog, "uRadius");
    const uBlur = gl.getUniformLocation(prog, "uBlur");

    let ready = false;
    const upload = (source: TexImageSource) => {
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      ready = true;
    };
    const img = new Image();
    if (src) {
      img.crossOrigin = "anonymous";
      img.onload = () => upload(img);
      img.src = src;
    }
    // No image: a one pixel texture of the first solid background behind
    // the area, painted through a 2D canvas so any CSS color resolves.
    // Checked every half second, so a theme change follows.
    const swatch = document.createElement("canvas");
    swatch.width = swatch.height = 1;
    let color = "";
    let frames = 0;
    const solid = () => {
      let node: Element | null = area.current;
      let next = "";
      while (node) {
        const c = getComputedStyle(node).backgroundColor;
        if (c && c !== "transparent" && !/rgba\(.*,\s*0\)$/.test(c)) {
          next = c;
          break;
        }
        node = node.parentElement;
      }
      if (!next || next === color) return;
      color = next;
      const ctx = swatch.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      upload(swatch);
    };

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!src && frames++ % 30 === 0) solid();
      const box = el.getBoundingClientRect();
      const a = area.current?.getBoundingClientRect();
      if (!ready || !a || !box.width || !box.height) return;
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(box.width * dpr);
      const h = Math.round(box.height * dpr);
      if (el.width !== w || el.height !== h) {
        el.width = w;
        el.height = h;
      }
      const nw = src ? img.width : 1;
      const nh = src ? img.height : 1;
      const s = Math.max(a.width / nw, a.height / nh);
      const iw = nw * s;
      const ih = nh * s;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uSize, w, h);
      gl.uniform4f(uBox, box.x, box.y, box.width, box.height);
      gl.uniform4f(
        uImg,
        a.x + (a.width - iw) / 2,
        a.y + (a.height - ih) / 2,
        iw,
        ih,
      );
      gl.uniform1f(
        uRadius,
        Math.min(radius.get(), box.height / 2, box.width / 2),
      );
      gl.uniform1f(uBlur, blurRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      img.onload = null;
    };
  }, [src, area, radius]);

  return (
    <motion.div
      className={cn("absolute inset-0", hidden && "invisible")}
      style={{ clipPath: clip, WebkitClipPath: clip }}
    >
      <canvas
        ref={canvas}
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `color-mix(in oklab, var(--background) ${n(lerp(3, 85, clamp(transparency, 0, 1)))}%, transparent)`,
        }}
      />
      {children}
    </motion.div>
  );
}
