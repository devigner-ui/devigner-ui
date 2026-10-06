"use client";

import * as React from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { IconArrowUp } from "@devigner-ui/icons";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";
import { cn } from "cn";
import {
  EASE_OUT,
  EASE_OVERSHOOT,
  SPRING_LAYOUT,
  SPRING_SWAP,
} from "../lib/easing";

// A growth curve with one point in focus: a dot riding the line and a card
// with the change since the first point. The dot, the coloured stretch of the
// line and the card all hang off one motion value (the focus x), so the dot
// stays on the curve while it travels instead of cutting corners between
// points.

/** viewBox size. The plot div has the same aspect, so percentages line up. */
const W = 300;
const H = 200;
/** Side padding, so the first and last dots aren't cut by the plot edge. */
const PAD_X = 14;
/** Highest value sits this far down, just clear of the top edge. */
const TOP = 0.1 * H;
/** Lowest value sits here. */
const BOTTOM = 0.9 * H;
/** Most month labels and grid lines drawn; longer series show every nth.
 *  ponytail: a fixed count, measure the plot and label widths if long labels
 *  still collide on narrow cards. */
const MAX_LABELS = 8;

export interface KpiChartPoint {
  /** Stable key. Defaults to the point index. */
  id?: React.Key;
  label: string;
  value: number;
}

export interface KpiChartClassNames {
  /** The chart grid. Its text color is the accent of the line, dot and focused label. */
  chart?: string;
  tooltip?: string;
}

export interface KpiChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: KpiChartPoint[];
  /** Small title at the top of the card, and the chart's accessible name. */
  label: string;
  /** Locale for the default number format and the currency's placement.
   *  Defaults to en-US. */
  locale?: string;
  /** Formats axis ticks and spoken values, without the currency. Defaults to
   *  compact numbers in the locale (20K). */
  formatValue?: (value: number) => string;
  /** The line under the change in the card. Gets the point and its value
   *  already formatted with the currency. Defaults to "21K in Nov". */
  formatPoint?: (point: KpiChartPoint, value: string) => string;
  /** Selected point, controlled. Pair with onIndexChange. */
  index?: number;
  /** Called with the point a click, tap or arrow key picks. */
  onIndexChange?: (index: number) => void;
  /** Point selected until one is picked. Defaults to the last, so a live
   *  series keeps following its newest point. */
  defaultIndex?: number;
  /** ISO 4217 code (USD, EUR, SEK, XOF). The locale decides the symbol, its
   *  side and its spacing ($20K, 20K €, F CFA 20K). */
  currency?: string;
  classNames?: KpiChartClassNames;
}

const isNumberPart = (type: string) =>
  type === "integer" ||
  type === "group" ||
  type === "decimal" ||
  type === "fraction";

/** What the currency puts around a number in this locale ("$" before for
 *  en-US, " €" after for de-DE) and its symbol alone, for the axis. The
 *  digits still come from formatValue, so a custom formatter keeps working.
 *  An invalid code throws, the same as Intl. */
function currencyParts(locale: string, currency: string) {
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).formatToParts(1);
  const nums = parts.map((p) => isNumberPart(p.type));
  const text = (ps: Intl.NumberFormatPart[]) => ps.map((p) => p.value).join("");
  return {
    before: text(parts.slice(0, nums.indexOf(true))),
    after: text(parts.slice(nums.lastIndexOf(true) + 1)),
    symbol: parts.find((p) => p.type === "currency")?.value ?? currency,
  };
}

const longest = (texts: string[]) =>
  texts.reduce((a, b) => (b.length > a.length ? b : a), "");

/** Change since the first point in whole percent. */
const percent = (value: number, first: number) =>
  Math.round(((value - first) / Math.abs(first)) * 100);

/** Change since the first point, "+320%". From 1000% it reads in thousands
 *  ("+1K%", "+1.1K%", "+12K%"), so the figure stays short. Falls back to the
 *  value when the first point is 0, where a percentage means nothing. */
function delta(value: number, first: number, format: (n: number) => string) {
  if (first === 0) return format(value);
  const pct = percent(value, first);
  const sign = pct > 0 ? "+" : pct < 0 ? "-" : "";
  const abs = Math.abs(pct);
  if (abs < 1000) return `${sign}${abs}%`;
  const k = abs / 1000;
  // One decimal below 10K, whole thousands above; 9.96K rounds up to 10K.
  const short =
    k < 9.95 ? String(Math.round(k * 10) / 10) : String(Math.round(k));
  return `${sign}${short}K%`;
}

/** Stacks the widest text, invisible, under the shown one in one grid cell,
 *  so the cell keeps that width whichever point is shown. */
function Reserve({
  room,
  children,
}: {
  room: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-grid">
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {room}
      </span>
      <span className="col-start-1 row-start-1">{children}</span>
    </span>
  );
}

/** Round axis steps: 1, 2, 2.5 or 5 times a power of ten, about three gaps
 *  across the range. The axis starts on a step at or below the lowest value
 *  and the top tick is the last step at or below the highest, so the scale
 *  ends at the data and leaves no empty band above it. */
function niceTicks(min: number, max: number) {
  if (max === min) return { lo: min, hi: max, ticks: [min] };
  const rough = (max - min) / 3;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = mag * ([1, 2, 2.5, 5, 10].find((m) => m * mag >= rough) ?? 10);
  const lo = Math.floor(min / step) * step;
  const ticks: number[] = [];
  // Rounded, so float steps (0.1 + 0.2) don't print 0.30000000000000004.
  for (let t = lo; t <= max + step * 1e-9; t += step)
    ticks.push(Number(t.toPrecision(12)));
  return { lo, hi: max, ticks };
}

/** Monotone cubic tangents (Fritsch-Carlson, as d3's curveMonotoneX) for
 *  evenly spaced points: the curve never overshoots a point, so growth data
 *  never dips on screen. */
function tangents(ys: number[], h: number) {
  const n = ys.length;
  const s = ys.slice(1).map((y, i) => (y - ys[i]!) / h);
  const m = ys.map((_, i) => {
    if (i === 0 || i === n - 1) return 0;
    const a = s[i - 1]!;
    const b = s[i]!;
    return (
      (Math.sign(a) + Math.sign(b)) *
      Math.min(Math.abs(a), Math.abs(b), 0.25 * Math.abs(a + b))
    );
  });
  if (n > 1) {
    m[0] = (3 * s[0]! - m[1]!) / 2;
    m[n - 1] = (3 * s[n - 2]! - m[n - 2]!) / 2;
    if (n === 2) m[0] = m[1] = s[0]!;
  }
  return m;
}

/** One odometer wheel: the digits 0 to 9 stacked in a column one line tall,
 *  slid so the wanted digit shows. Tabular figures keep every wheel the same
 *  width, so nothing beside it shifts while it turns. */
function Wheel({ digit, reduced }: { digit: number; reduced: boolean }) {
  return (
    <span className="relative inline-block overflow-hidden">
      <span className="invisible">0</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={reduced ? false : { y: "0%" }}
        animate={{ y: `${-digit * 10}%` }}
        transition={reduced ? { duration: 0 } : SPRING_SWAP}
      >
        {Array.from({ length: 10 }, (_, d) => (
          <span key={d}>{d}</span>
        ))}
      </motion.span>
    </span>
  );
}

/** A figure whose digits roll like an odometer. Everything else (the sign,
 *  %, separators, a K) holds still. Wheels are keyed by their place from the
 *  right, so the ones digit stays the ones digit when the figure grows. */
function Rolling({ text, reduced }: { text: string; reduced: boolean }) {
  const chars = [...text];
  let place = chars.filter((c) => /\d/.test(c)).length;
  return (
    <span className="inline-flex">
      {chars.map((c) =>
        /\d/.test(c) ? (
          <Wheel key={`d${place--}`} digit={Number(c)} reduced={reduced} />
        ) : (
          <span key={`s${place}${c}`}>{c}</span>
        ),
      )}
    </span>
  );
}

export function KpiChart({
  data,
  label,
  locale = "en-US",
  formatValue: formatValueProp,
  formatPoint = (point, value) => `${value} in ${point.label}`,
  index: indexProp,
  onIndexChange,
  defaultIndex,
  currency,
  classNames,
  className,
  ...rest
}: KpiChartProps) {
  const reduced = useReducedMotionPreference();
  const compact = React.useMemo(
    () => new Intl.NumberFormat(locale, { notation: "compact" }),
    [locale],
  );
  const formatValue = formatValueProp ?? compact.format;
  const affix = React.useMemo(
    () => (currency ? currencyParts(locale, currency) : null),
    [locale, currency],
  );
  const symbol = affix?.symbol ?? "";
  const money = (n: number) =>
    affix ? `${affix.before}${formatValue(n)}${affix.after}` : formatValue(n);
  const uid = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
  const n = data.length;
  // Clicking (or the arrow keys) picks the point the dot sits on; hovering
  // only marks a point, so the dot never wanders under the pointer. Until
  // something is picked the rest point holds, live as data grows.
  const [picked, setPicked] = React.useState<number | null>(null);
  const [hover, setHover] = React.useState<number | null>(null);
  const index = Math.min(
    Math.max(indexProp ?? picked ?? defaultIndex ?? n - 1, 0),
    Math.max(n - 1, 0),
  );
  const select = (i: number) => {
    if (i === index) return;
    setPicked(i);
    onIndexChange?.(i);
  };

  const values = data.map((d) => d.value);
  const { lo, hi, ticks } = niceTicks(Math.min(...values), Math.max(...values));
  const step = n > 1 ? (W - 2 * PAD_X) / (n - 1) : 0;
  const xs = data.map((_, i) => (n > 1 ? PAD_X + i * step : W / 2));
  // A flat series sits mid-band instead of dividing by zero.
  const yOf = (v: number) =>
    hi === lo
      ? (TOP + BOTTOM) / 2
      : BOTTOM - ((v - lo) / (hi - lo)) * (BOTTOM - TOP);
  const ys = values.map(yOf);
  // Every stride-th point gets a label and a grid line, counted back from the
  // last so the latest point is always named.
  const stride = Math.max(1, Math.ceil(n / MAX_LABELS));
  const ticked = (i: number) => (n - 1 - i) % stride === 0;
  const ms = tangents(ys, step);

  const d = xs
    .map((x, i) =>
      i === 0
        ? `M${x},${ys[0]}`
        : `C${xs[i - 1]! + step / 3},${ys[i - 1]! + (ms[i - 1]! * step) / 3} ${x - step / 3},${ys[i]! - (ms[i]! * step) / 3} ${x},${ys[i]}`,
    )
    .join("");
  // The same curve closed down to the bottom edge, for the fill under it.
  const area = n > 1 ? `${d}L${xs[n - 1]},${H}L${xs[0]},${H}Z` : "";

  // The curve as y(x), read by the dot every frame. A plain closure is
  // enough: useTransform recomputes during render and resubscribes on each
  // commit, so it always calls this render's version.
  const yAt = (x: number) => {
    if (n < 2) return ys[0] ?? H / 2;
    const i = Math.min(Math.max(Math.floor((x - xs[0]!) / step), 0), n - 2);
    // Cubic Hermite on segment i: the same curve the path draws.
    const t = Math.min(Math.max((x - xs[i]!) / step, 0), 1);
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i]! +
      (t3 - 2 * t2 + t) * step * ms[i]! +
      (-2 * t3 + 3 * t2) * ys[i + 1]! +
      (t3 - t2) * step * ms[i + 1]!
    );
  };

  const target = xs[index] ?? W / 2;
  const x = useMotionValue(reduced ? target : (xs[0] ?? W / 2));
  // The dot and the hover ring move by transform, in pixels of the plot's
  // measured size. Animating left/top instead re-runs layout every frame
  // and snaps each step to a whole pixel, so the circles stair-step beside
  // a line that moves smoothly: the jitter.
  const plotW = useMotionValue(0);
  const plotH = useMotionValue(0);
  const toPx = (v: number, w: number, h: number) => [
    (v / W) * w,
    (yAt(v) / H) * h,
  ];
  const dotX = useTransform(
    [x, plotW, plotH],
    ([v, w, h]) => toPx(v as number, w as number, h as number)[0]!,
  );
  const dotY = useTransform(
    [x, plotW, plotH],
    ([v, w, h]) => toPx(v as number, w as number, h as number)[1]!,
  );
  // Hidden until the plot is measured, so server HTML doesn't paint the dot
  // in the top-left corner.
  const dotVisibility = useTransform(plotW, (w) => (w ? "visible" : "hidden"));
  const clipWidth = useTransform(x, (v) => v + PAD_X);

  // The hover ring rides the curve the same way the dot does: one x value,
  // y read off the curve, so gliding between months it follows the line
  // instead of cutting straight across.
  const hx = useMotionValue(0);
  const hoverX = useTransform(
    [hx, plotW, plotH],
    ([v, w, h]) => toPx(v as number, w as number, h as number)[0]!,
  );
  const hoverY = useTransform(
    [hx, plotW, plotH],
    ([v, w, h]) => toPx(v as number, w as number, h as number)[1]!,
  );
  const hoverShown = React.useRef(false);
  const hoverTo = hover === null ? null : (xs[hover] ?? null);
  // A layout effect, so a ring that appears is placed before its first paint.
  React.useLayoutEffect(() => {
    if (hoverTo === null) {
      hoverShown.current = false;
      return;
    }
    // Appearing: start on the point. Already showing: glide to it.
    if (!hoverShown.current || reduced) {
      hx.set(hoverTo);
      hoverShown.current = true;
      return;
    }
    const controls = animate(hx, hoverTo, SPRING_LAYOUT);
    return () => controls.stop();
  }, [hoverTo, reduced, hx]);

  const [drawn, setDrawn] = React.useState(reduced);
  const drawing = React.useRef(!reduced);
  React.useEffect(() => {
    if (reduced) {
      drawing.current = false;
      x.set(target);
      setDrawn(true);
      return;
    }
    // First run draws the line in; every move after that glides.
    const controls = animate(
      x,
      target,
      drawing.current
        ? {
            duration: 1.4,
            ease: EASE_OUT,
            onComplete: () => {
              drawing.current = false;
              setDrawn(true);
            },
          }
        : SPRING_LAYOUT,
    );
    return () => controls.stop();
  }, [target, reduced, x]);

  const plot = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = plot.current;
    if (!el) return;
    const measure = () => {
      plotW.set(el.offsetWidth);
      plotH.set(el.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [plotW, plotH]);
  const indexAt = (clientX: number) => {
    const rect = plot.current!.getBoundingClientRect();
    const vx = ((clientX - rect.left) / rect.width) * W;
    return n > 1
      ? Math.min(Math.max(Math.round((vx - PAD_X) / step), 0), n - 1)
      : 0;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const next =
      e.key === "ArrowLeft" || e.key === "ArrowDown"
        ? index - 1
        : e.key === "ArrowRight" || e.key === "ArrowUp"
          ? index + 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : null;
    if (next === null) return;
    e.preventDefault();
    select(Math.min(Math.max(next, 0), n - 1));
  };

  // The blank on the right mirrors the blank left of the y labels: the
  // 3rem column minus the widest label. The sizer sits in flow, so a label
  // wider than 3rem grows the column instead of spilling past it, and the
  // blank drops to 0. Eased, so a new formatValue that
  // changes the label length glides the plot instead of snapping it.
  const longestTick = longest(ticks.map(formatValue));
  const tickSizer = React.useRef<HTMLSpanElement>(null);
  const padRight = useMotionValue(0);
  const padReady = React.useRef(false);
  React.useLayoutEffect(() => {
    const el = tickSizer.current;
    if (!el) return;
    let controls: ReturnType<typeof animate> | undefined;
    const measure = () => {
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      const next = Math.max(0, 3 * rem - el.offsetWidth);
      if (!padReady.current || reduced) {
        padReady.current = true;
        padRight.set(next);
        return;
      }
      if (next === padRight.get()) return;
      controls?.stop();
      controls = animate(padRight, next, SPRING_LAYOUT);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
      controls?.stop();
    };
  }, [reduced, padRight, longestTick]);
  const point = data[index];
  const first = values[0] ?? 0;
  const change = point ? delta(point.value, first, money) : "";
  // From the rounded figure, so "0%" never shows beside an arrow.
  const trend = !point
    ? 0
    : first === 0
      ? Math.sign(point.value)
      : Math.sign(percent(point.value, first));

  // Room for the widest figure and value line across the whole series, so
  // the card keeps one width whichever point is picked. By character count:
  // the figures are tabular, so the longest is close enough to the widest.
  const figureRoom = longest(data.map((p) => delta(p.value, first, money)));
  const valueRoom = longest(data.map((p) => formatPoint(p, money(p.value))));

  // The card stays put, so a high point in the middle can pass under it; the
  // card fades back while the dot is beneath it. Its box is measured relative
  // to the plot only when either resizes, so the check on every frame of a
  // glide is plain arithmetic, with no layout reads.
  const card = React.useRef<HTMLDivElement>(null);
  const cardBox = React.useRef<DOMRect | null>(null);
  const [covered, setCovered] = React.useState(false);
  const coveredRef = React.useRef(false);
  const checkCover = () => {
    const box = cardBox.current;
    const w = plotW.get();
    if (!box || !w) return;
    const v = x.get();
    const dx = (v / W) * w;
    const dy = (yAt(v) / H) * plotH.get();
    // A ring around the card, so the dot's halo never touches it.
    const r = 16;
    const next =
      dx > box.left - r &&
      dx < box.right + r &&
      dy > box.top - r &&
      dy < box.bottom + r;
    // Only re-render when it flips, not on every frame of a glide.
    if (next !== coveredRef.current) {
      coveredRef.current = next;
      setCovered(next);
    }
  };
  // The latest check, for the listeners below; also run after every commit,
  // which covers a new index, new data and the end of the draw-in.
  const check = React.useRef(checkCover);
  React.useLayoutEffect(() => {
    check.current = checkCover;
    checkCover();
  });
  React.useEffect(() => x.on("change", () => check.current()), [x]);
  const hasCard = !!point;
  React.useLayoutEffect(() => {
    const el = card.current;
    const frame = plot.current;
    if (!el || !frame) return;
    const measure = () => {
      const b = el.getBoundingClientRect();
      const f = frame.getBoundingClientRect();
      cardBox.current = new DOMRect(
        b.left - f.left,
        b.top - f.top,
        b.width,
        b.height,
      );
      check.current();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(frame);
    return () => ro.disconnect();
  }, [hasCard]);
  return (
    <div
      className={cn(
        "w-full max-w-xl rounded-4xl bg-background p-6 text-foreground smooth-shadow-ring-lg dark:bg-[color-mix(in_oklab,var(--foreground)_9%,var(--background))]",
        className,
      )}
      {...rest}
    >
      <motion.div
        className={cn(
          "relative grid grid-cols-[minmax(3rem,auto)_1fr] gap-x-4 pt-10 text-primary",
          classNames?.chart,
        )}
        style={{ paddingRight: padRight }}
      >
        <div
          aria-hidden
          className="relative text-sm text-muted-foreground tabular-nums"
        >
          {symbol && (
            <span className="absolute right-4 bottom-full mb-3 text-xs whitespace-nowrap">
              {symbol}
            </span>
          )}
          <span
            ref={tickSizer}
            className="invisible flex w-max items-center gap-2 whitespace-nowrap"
          >
            {longestTick}
            <span className="w-2" />
          </span>
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap"
              style={{ top: `${(yOf(t) / H) * 100}%` }}
            >
              {formatValue(t)}
              <span className="h-px w-2 bg-muted-foreground/50" />
            </span>
          ))}
        </div>

        <div
          ref={plot}
          role="slider"
          tabIndex={n ? 0 : -1}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={Math.max(n - 1, 0)}
          aria-valuenow={index}
          aria-valuetext={
            point
              ? `${point.label}: ${money(point.value)}, ${change}`
              : undefined
          }
          onKeyDown={onKeyDown}
          onClick={(e) => n && select(indexAt(e.clientX))}
          // A mouse marks the point under it; a finger or pen dragging along
          // the line picks it, since there is no hover to come back to.
          onPointerMove={(e) => {
            if (!n) return;
            if (e.pointerType === "mouse") setHover(indexAt(e.clientX));
            else if (e.buttons) select(indexAt(e.clientX));
          }}
          onPointerLeave={() => setHover(null)}
          className="relative aspect-3/2 cursor-pointer touch-pan-y rounded-2xl outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <svg
            aria-hidden
            viewBox={`0 0 ${W} ${H}`}
            className="absolute inset-0 size-full overflow-visible"
          >
            <defs>
              <linearGradient
                id={`${uid}-fade`}
                gradientUnits="userSpaceOnUse"
                x1={xs[0]}
                x2={xs[n - 1]}
              >
                {/* The line rises out of nothing at the first point, but is
                    near full strength by a quarter of the way, so the early
                    points still read. */}
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.12" stopColor="#fff" stopOpacity="0.45" />
                <stop offset="0.3" stopColor="#fff" stopOpacity="0.85" />
                <stop offset="0.45" stopColor="#fff" />
              </linearGradient>
              <mask
                id={`${uid}-mask`}
                maskUnits="userSpaceOnUse"
                x={-W}
                y={-H}
                width={3 * W}
                height={3 * H}
              >
                <rect
                  x={-W}
                  y={-H}
                  width={3 * W}
                  height={3 * H}
                  fill={`url(#${uid}-fade)`}
                />
              </mask>
              <linearGradient
                id={`${uid}-vfade`}
                gradientUnits="userSpaceOnUse"
                x1={0}
                x2={0}
                y1={0}
                y2={H}
              >
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#fff" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <mask
                id={`${uid}-grid`}
                maskUnits="userSpaceOnUse"
                x={-W}
                y={-H}
                width={3 * W}
                height={3 * H}
              >
                <rect
                  x={-W}
                  y={-H}
                  width={3 * W}
                  height={3 * H}
                  fill={`url(#${uid}-vfade)`}
                />
              </mask>
              {/* The fill under the line: a wash of the accent that fades
                  out toward the bottom. */}
              <linearGradient
                id={`${uid}-area`}
                gradientUnits="userSpaceOnUse"
                x1={0}
                x2={0}
                y1={TOP}
                y2={H}
              >
                <stop offset="0" stopColor="currentColor" stopOpacity="0.16" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
              <clipPath id={`${uid}-clip`}>
                <motion.rect
                  x={-PAD_X}
                  y={-H}
                  height={3 * H}
                  width={clipWidth}
                />
              </clipPath>
            </defs>
            <g mask={`url(#${uid}-grid)`}>
              {xs.map((gx, i) =>
                ticked(i) ? (
                  <line
                    key={data[i]!.id ?? i}
                    x1={gx}
                    x2={gx}
                    y1={0}
                    y2={H}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    className="stroke-border"
                  />
                ) : null,
              )}
            </g>
            <g mask={`url(#${uid}-mask)`}>
              <path
                d={area}
                fill={`url(#${uid}-area)`}
                clipPath={`url(#${uid}-clip)`}
              />
              {/* The rest of the line, past the focused point, stays faint. */}
              <motion.path
                d={d}
                fill="none"
                strokeWidth={3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="stroke-current/12"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: drawn ? 1 : 0 }}
                transition={
                  reduced ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT }
                }
              />
              <path
                d={d}
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                clipPath={`url(#${uid}-clip)`}
              />
            </g>
          </svg>

          {n > 0 && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute top-0 left-0"
              style={{ x: dotX, y: dotY, visibility: dotVisibility }}
            >
              <span className="absolute size-14 -translate-1/2 rounded-full bg-current/15 backdrop-blur-[2.5px]" />

              <span className="absolute size-5 -translate-1/2 rounded-full bg-current shadow-md ring-3 ring-accent" />
            </motion.div>
          )}

          {/* Hover marks a point with a small ring on the curve; a click
              sends the dot there. */}
          <AnimatePresence>
            {hover !== null && hover !== index && (
              <motion.span
                key="hover"
                aria-hidden
                className="pointer-events-none absolute top-0 left-0 size-3 -translate-1/2 rounded-full border-2 border-current bg-accent"
                style={{ x: hoverX, y: hoverY }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={
                  reduced ? { duration: 0 } : { duration: 0.15, ease: EASE_OUT }
                }
              />
            )}
          </AnimatePresence>
        </div>

        {n > 0 && point && (
          <motion.div
            ref={card}
            aria-hidden
            animate={{ opacity: covered ? 0.25 : 1 }}
            transition={{ duration: 0.1, ease: EASE_OUT }}
            className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2"
          >
            <motion.div
              // Hydration renders with reduced false (the server can't know
              // it), so a reduced-motion user would get the entrance and the
              // wheels rolling in. Remounting once the preference lands snaps
              // the whole card to rest.
              key={String(reduced)}
              initial={reduced ? false : { opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE_OVERSHOOT }}
              className={cn(
                "origin-bottom overflow-hidden rounded-3xl bg-surface smooth-shadow-ring-lg",
                classNames?.tooltip,
              )}
            >
              <div className="w-max px-4 py-3 whitespace-nowrap">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                    <Reserve room={figureRoom}>
                      <Rolling text={change} reduced={reduced} />
                    </Reserve>
                  </span>
                  <motion.span
                    initial={false}
                    animate={{
                      opacity: trend === 0 ? 0 : 1,
                      scale: trend === 0 ? 0.6 : 1,
                    }}
                    transition={reduced ? { duration: 0 } : SPRING_SWAP}
                    className={cn(
                      "grid size-6 place-items-center overflow-hidden rounded-full transition-colors duration-200 ease-out",
                      trend < 0
                        ? "bg-destructive/12 text-destructive"
                        : "bg-current/12",
                    )}
                  >
                    <motion.span
                      initial={false}
                      animate={{ rotate: trend < 0 ? 180 : 0 }}
                      transition={reduced ? { duration: 0 } : SPRING_SWAP}
                      className="grid place-items-center"
                    >
                      <motion.span
                        key={trend}
                        initial={reduced ? false : { y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={SPRING_SWAP}
                        className="grid place-items-center"
                      >
                        <IconArrowUp className="size-3.5" />
                      </motion.span>
                    </motion.span>
                  </motion.span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                  <Reserve room={valueRoom}>
                    {formatPoint(point, money(point.value))}
                  </Reserve>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        <div />
        <div aria-hidden className="relative mt-3 h-6 text-sm">
          {data.map((p, i) =>
            // The focused point is always named; thinned labels too close
            // to it step aside so the two don't overlap.
            i === index || (ticked(i) && Math.abs(i - index) >= stride) ? (
              <span
                key={p.id ?? i}
                className={cn(
                  "absolute -translate-x-1/2 transition-colors ease-out",
                  i === index
                    ? "text-current"
                    : i === hover
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
                style={{ left: `${(xs[i]! / W) * 100}%` }}
              >
                {p.label}
              </span>
            ) : null,
          )}
        </div>
      </motion.div>
    </div>
  );
}
