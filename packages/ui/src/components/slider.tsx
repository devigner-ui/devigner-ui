"use client";

import * as React from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  type MotionValue,
  type Transition,
} from "motion/react";
import { cn } from "cn";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";
import {
  SPRING_LAYOUT,
  SPRING_MOUSE,
  SPRING_PRESS,
  SPRING_RETRACT,
  SPRING_SWAP,
} from "../lib/easing";
import { useControllableState } from "../lib/hooks/use-controllable-state";

/** Track thickness in px. The length comes from className (h-* or w-*). */
const SIZES = { sm: 32, md: 44, lg: 56 } as const;
/** Open thumb, as multiples of the thickness: a touch longer than the track
 *  is thick along it, and half again as wide across, so it overhangs. */
const OPEN_ALONG = 1.04;
const OPEN_ACROSS = 1.55;
/** Past this many marks they sit a few px apart: unreadable, so none.
 *  ponytail: a count, not px; measure the track if long sliders need more. */
const MAX_MARKS = 40;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

/** Decimal places of a step, so 0.1 steps don't show 0.30000000000000004. */
const decimals = (step: number) => {
  const s = String(step);
  const i = s.indexOf(".");
  return i < 0 ? 0 : s.length - i - 1;
};

/** Where the marks go, as 0 to 1 ratios of the whole track: one per step,
 *  spread evenly end to end. The thumb's centre can't reach the very ends,
 *  so it lands exactly on a mark mid-track and up to half a thumb off near
 *  the ends. */
function markRatios(span: number, step: number) {
  const out: number[] = [];
  if (span / step > MAX_MARKS + 1) return out;
  for (let j = 1; j * step < span - 1e-9; j++) out.push((j * step) / span);
  return out;
}

const SLIDE = {
  enter: (dir: number) => ({ y: `${dir * 100}%`, opacity: 0 }),
  center: { y: "0%", opacity: 1 },
  exit: (dir: number) => ({ y: `${dir * -100}%`, opacity: 0 }),
};

export interface SliderClassNames {
  root?: string;
  track?: string;
  fill?: string;
  mark?: string;
  thumb?: string;
  value?: string;
}

export interface SliderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** Controlled value. */
  value?: number;
  /** Initial value when uncontrolled. */
  defaultValue?: number;
  /** Fires with the new value while dragging and on every key press. */
  onValueChange?: (value: number) => void;
  /** Fires once when the user lets go of the thumb, and on each key press
   *  that changes the value. For work too heavy to run on every move. */
  onValueCommit?: (value: number) => void;
  min?: number;
  max?: number;
  /** The arrow key step, the gap between marks, and the snap grid. */
  step?: number;
  /** Snap to multiples of step from min, the thumb jumping stop to stop.
   *  Off (the default), the value is continuous (rounded to the step's
   *  decimals) and the thumb glides after the pointer. */
  snap?: boolean;
  /** Horizontal (the default) fills left to right, vertical bottom to top. */
  orientation?: "vertical" | "horizontal";
  /** Fills from the other end: top to bottom, or right to left (use it in
   *  right-to-left layouts). */
  inverted?: boolean;
  /** Track thickness: sm 32px, md 44px, lg 56px, or a number of px. The
   *  length follows className (h-56 vertical, w-72 horizontal by default). */
  size?: keyof typeof SIZES | number;
  /** Marks along the track, one per step, spread evenly end to end. */
  marks?: boolean;
  /** Text shown in the thumb and read out as aria-valuetext. */
  format?: (value: number) => string;
  disabled?: boolean;
  /** Submitted with a form, like an input. */
  name?: string;
  classNames?: SliderClassNames;
}

export function Slider({
  value,
  defaultValue = 0,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 10,
  snap = false,
  orientation = "horizontal",
  inverted = false,
  size = "md",
  marks = true,
  format = String,
  disabled = false,
  name,
  classNames,
  className,
  style,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ...rest
}: SliderProps) {
  const vertical = orientation === "vertical";
  const span = max > min ? max - min : 1;
  const hi = Math.max(min, max);
  const inc = step > 0 ? step : 1;
  const places = decimals(inc);
  // The highest step at or below max. When step doesn't divide the range
  // (step 3 of 100 ends on 99), max is a stop of its own, so the far end is
  // always reachable.
  const top = min + Math.floor(span / inc + 1e-9) * inc;
  const fit = (v: number) => {
    if (!snap) return +clamp(v, min, hi).toFixed(places);
    const g = clamp(min + Math.round((v - min) / inc) * inc, min, top);
    return +(max - v < Math.abs(v - g) ? max : g).toFixed(places);
  };

  const [raw, setRaw] = useControllableState({
    value,
    defaultValue,
    onValueChange,
  });
  const current = clamp(raw, min, hi);
  const ratio = (current - min) / span;
  const markClass = classNames?.mark;
  // Memoized as elements: a value change re-renders the thumb, not the marks.
  const markEls = React.useMemo(
    () =>
      (marks ? markRatios(span, inc) : []).map((r) => {
        const at = `${r * 100}%`;
        return (
          <span
            key={r}
            aria-hidden
            // Fades out at both ends, like a hairline divider.
            className={cn(
              "absolute from-transparent via-white/45 to-transparent",
              vertical
                ? "left-1/2 h-px w-1/2 -translate-x-1/2 translate-y-1/2 bg-linear-to-r"
                : "top-1/2 h-1/2 w-px -translate-1/2 bg-linear-to-b",
              markClass,
            )}
            style={vertical ? { bottom: at } : { left: at }}
          />
        );
      }),
    [marks, span, inc, vertical, markClass],
  );

  const reduced = useReducedMotionPreference();
  const [pressed, setPressed] = React.useState(false);
  const [keyboard, setKeyboard] = React.useState(false);
  const open = pressed || keyboard;

  const fill = React.useRef<HTMLDivElement>(null);
  const rail = React.useRef<HTMLDivElement>(null);
  const thumb = React.useRef<HTMLDivElement>(null);
  const input = React.useRef<HTMLInputElement>(null);
  /** The pointer that owns the drag, the pointer ratio minus the thumb ratio
   *  at grab (so a thumb doesn't jump), the root's box read once per press,
   *  and the value at the start and now, for onValueCommit.
   *  ponytail: a wheel scroll mid-drag leaves the box stale until the next
   *  press; re-read it on scroll if that ever matters. */
  const drag = React.useRef<{
    id: number;
    offset: number;
    glide: boolean;
    box: DOMRect;
    start: number;
    latest: number;
  } | null>(null);

  const T = typeof size === "number" ? size : SIZES[size];
  /** Width of the gap around the idle thumb, and of the ring of fill around
   *  that gap: the thumb takes what is left of the track's thickness. */
  const gap = Math.max(2, Math.round(T * 0.07));

  // One value drives the fill and the rail. The fill reads it as --p (it has
  // no children). The rail gets its translate written out: a custom property
  // there would inherit into the thumb and restyle every digit each frame.
  // Inverted, the rail is mirrored, so its travel flips sign.
  const pos = useMotionValue(ratio);
  const paint = React.useCallback(
    (p: number) => {
      fill.current?.style.setProperty("--p", String(p));
      const r = rail.current;
      if (!r) return;
      const k = inverted ? -p : p;
      r.style.translate = vertical
        ? `0 calc(${k} * (${T}px - 100%))`
        : `calc(${k} * (100% - ${T}px)) 0`;
    },
    [inverted, vertical, T],
  );
  React.useLayoutEffect(() => paint(pos.get()), [pos, paint]);
  useMotionValueEvent(pos, "change", paint);
  const to = React.useCallback(
    (mv: MotionValue<number>, target: number, transition: Transition) => {
      if (reduced) mv.jump(target);
      else animate(mv, target, transition);
    },
    [reduced],
  );
  // A layout effect, so the thumb moves in the same frame the new digits
  // paint, not one behind them.
  React.useLayoutEffect(() => {
    const d = drag.current;
    // Under the finger it jumps stop to stop (free drags are painted from
    // the pointer itself); a click on the track, a key or a new controlled
    // value glides there.
    if (d && !d.glide) {
      if (snap) pos.jump(ratio);
    } else to(pos, ratio, SPRING_LAYOUT);
    if (d) d.glide = false;
  }, [ratio, pos, to, snap]);

  // Which way the digits slide: up when the value rises.
  const last = React.useRef(current);
  const dir = current >= last.current ? 1 : -1;
  React.useEffect(() => {
    last.current = current;
  }, [current]);

  // A form reset returns the slider to its initial value, like an input.
  React.useEffect(() => {
    const owner = input.current?.form;
    if (!owner) return;
    const reset = () => setRaw(defaultValue);
    owner.addEventListener("reset", reset);
    return () => owner.removeEventListener("reset", reset);
  }, [defaultValue, setRaw, name]);

  /** Pointer position as a 0 to 1 ratio of the thumb's travel. */
  const ratioAt = (e: React.PointerEvent, box: DOMRect) => {
    const len = vertical ? box.height : box.width;
    const along = vertical ? box.bottom - e.clientY : e.clientX - box.left;
    const r = len > T ? (along - T / 2) / (len - T) : 0;
    return inverted ? 1 - r : r;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setPressed(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (d.latest !== d.start) onValueCommit?.(d.latest);
  };

  const page = Math.max(inc, span / 10);
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    // Snapped, the neighbouring stops, so 99 steps up to max and max back
    // down to 99 even when step doesn't divide the range. Free, one step
    // from wherever it is.
    const at = (current - min) / inc;
    const up = snap
      ? Math.min(max, min + (Math.floor(at + 1e-9) + 1) * inc)
      : current + inc;
    const down = snap
      ? Math.max(min, min + (Math.ceil(at - 1e-9) - 1) * inc)
      : current - inc;
    // Arrows follow the thumb on screen, so they swap when inverted.
    const flipV = vertical && inverted;
    const flipH = !vertical && inverted;
    const next = {
      ArrowUp: flipV ? down : up,
      ArrowDown: flipV ? up : down,
      ArrowRight: flipH ? down : up,
      ArrowLeft: flipH ? up : down,
      PageUp: current + page,
      PageDown: current - page,
      Home: min,
      End: max,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setKeyboard(true);
    const v = fit(next);
    setRaw(v);
    if (v !== current) onValueCommit?.(v);
  };

  const text = format(current);
  const along = vertical ? "height" : "width";
  const across = vertical ? "width" : "height";
  const idle = T - gap * 4;
  // Inverted mirrors the track and the rail, so the fill, its gradient, the
  // marks and the thumb all run from the other end with no geometry of their
  // own. The thumb is mirrored back, so its rim and digits read right.
  const mirror = inverted ? (vertical ? "1 -1" : "-1 1") : undefined;
  // The fill's end: a soft, rounded fade that runs out exactly at the
  // thumb's far edge. A circle mask of radius T/2 solid, `soft` px feathered,
  // sits `reach` behind that edge; a line mask keeps everything behind the
  // circle's centre. A mask rather than a blur filter, so it never bleeds
  // outside the track.
  const soft = Math.round(T * 0.6);
  const reach = T / 2 + soft;
  /** How far the thumb's far edge sits in from the fill's rounded cap. */
  const edge = T / 2 - idle / 2;
  const feather = vertical
    ? `linear-gradient(to bottom, transparent ${reach}px, black ${reach}px), radial-gradient(circle at 50% ${reach}px, black ${T / 2}px, transparent ${reach}px)`
    : `linear-gradient(to left, transparent ${reach}px, black ${reach}px), radial-gradient(circle at calc(100% - ${reach}px) 50%, black ${T / 2}px, transparent ${reach}px)`;

  return (
    <div
      {...rest}
      style={
        { "--t": `${T}px`, [across]: T, ...style } as React.CSSProperties
      }
      onPointerDown={(e) => {
        onPointerDown?.(e);
        // One pointer at a time: a second finger doesn't take over the drag.
        if (e.button !== 0 || disabled || drag.current) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        // Keep focus on the thumb, so arrow keys work after a drag.
        e.preventDefault();
        // focusVisible: false, or Chrome rings a script focus like a Tab.
        thumb.current?.focus({ preventScroll: true, focusVisible: false });
        const onThumb = thumb.current?.contains(e.target as Node) ?? false;
        const box = e.currentTarget.getBoundingClientRect();
        const r = ratioAt(e, box);
        const latest = onThumb ? current : fit(min + clamp(r, 0, 1) * span);
        drag.current = {
          id: e.pointerId,
          offset: onThumb ? r - ratio : 0,
          glide: !onThumb,
          box,
          start: current,
          latest,
        };
        setPressed(true);
        setKeyboard(false);
        if (!onThumb) setRaw(latest);
      }}
      onPointerMove={(e) => {
        onPointerMove?.(e);
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const r = clamp(ratioAt(e, d.box) - d.offset, 0, 1);
        // Free, the thumb chases the pointer on a follow spring: it keeps
        // its speed between moves, so a flick reads as one fluid glide.
        if (!snap) to(pos, r, SPRING_MOUSE);
        d.latest = fit(min + r * span);
        setRaw(d.latest);
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e);
        endDrag(e);
      }}
      onPointerCancel={(e) => {
        onPointerCancel?.(e);
        endDrag(e);
      }}
      className={cn(
        "relative inline-block shrink-0 touch-none select-none",
        vertical ? "h-56" : "w-72",
        disabled
          ? "pointer-events-none opacity-50"
          : pressed
            ? "cursor-grabbing"
            : "cursor-grab",
        className,
        classNames?.root,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 overflow-hidden rounded-full bg-foreground/15",
          classNames?.track,
        )}
        style={{ scale: mirror }}
      >
        {/* A full-length gradient slid along the track, so the colors ride
            the fill's end: a short fill only ever shows yellow, and red only
            comes into view as it nears full. Its soft rounded end is centred
            on the thumb. */}
        <div
          ref={fill}
          aria-hidden
          className={cn(
            "absolute inset-0 from-red-600 via-orange-500 via-45% to-yellow-400 to-80%",
            vertical ? "bg-linear-to-t" : "bg-linear-to-r",
            classNames?.fill,
          )}
          style={
            vertical
              ? {
                  translate: `0 calc((1 - var(--p)) * (100% - var(--t)) + ${edge}px)`,
                  maskImage: feather,
                }
              : {
                  translate: `calc((var(--p) - 1) * (100% - var(--t)) - ${edge}px) 0`,
                  maskImage: feather,
                }
          }
        />
        {markEls}
      </div>

      {/* Track-sized and slid by paint, so the thumb moves on transforms only. */}
      <div
        ref={rail}
        className="pointer-events-none absolute inset-0"
        style={{ scale: mirror }}
      >
        <motion.div
          ref={thumb}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current}
          aria-valuetext={text}
          aria-orientation={orientation}
          aria-disabled={disabled || undefined}
          onKeyDown={onKeyDown}
          onFocus={(e) => {
            if (e.currentTarget.matches(":focus-visible")) setKeyboard(true);
          }}
          onBlur={() => setKeyboard(false)}
          initial={false}
          // ponytail: width/height, not scale: scale would stretch the rim and
          // the digits. One small element, so the layout cost is nothing.
          animate={{
            [along]: open ? T * OPEN_ALONG : idle,
            [across]: open ? T * OPEN_ACROSS : idle,
          }}
          transition={reduced ? { duration: 0 } : open ? SPRING_PRESS : SPRING_RETRACT}
          style={{
            [vertical ? "bottom" : "left"]: T / 2,
            translate: vertical ? "-50% 50%" : "-50% -50%",
            fontSize: T * 0.4,
            ...(inverted && (vertical ? { scaleY: -1 } : { scaleX: -1 })),
          }}
          className={cn(
            "pointer-events-auto absolute rounded-full outline-none",
            vertical ? "left-1/2" : "top-1/2",
            // Frosted glass: blurs the fill under it, with a bright rim
            // on top and a soft drop below.
            "bg-background/35 backdrop-blur-xs backdrop-saturate-150",
            "shadow-[inset_0_1px_1px_rgb(255_255_255/0.7),inset_0_0_0_1px_rgb(255_255_255/0.35),0_6px_16px_-6px_rgb(0_0_0/0.3)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            classNames?.thumb,
          )}
        >
          <motion.span
            aria-hidden
            initial={false}
            animate={
              open
                ? { opacity: 1, filter: "blur(0px)" }
                : { opacity: 0, filter: reduced ? "blur(0px)" : "blur(4px)" }
            }
            transition={reduced ? { duration: 0 } : SPRING_SWAP}
            className={cn(
              "absolute inset-0 flex items-center justify-center font-light text-foreground/75 tabular-nums",
              classNames?.value,
            )}
          >
            {/* One slot per character, counted from the right so the ones
                digit keeps its slot when a digit is added in front. */}
            {[...text].map((ch, i, all) => (
              <span
                key={all.length - i}
                className="relative inline-flex h-[1.2em] justify-center overflow-hidden"
              >
                <AnimatePresence initial={false} mode="popLayout" custom={dir}>
                  <motion.span
                    key={ch}
                    custom={dir}
                    variants={SLIDE}
                    initial={reduced ? false : "enter"}
                    animate="center"
                    exit={reduced ? undefined : "exit"}
                    transition={SPRING_SWAP}
                    className="leading-[1.2em]"
                  >
                    {ch}
                  </motion.span>
                </AnimatePresence>
              </span>
            ))}
          </motion.span>
        </motion.div>
      </div>

      {name !== undefined && (
        <input
          ref={input}
          type="hidden"
          name={name}
          value={current}
          disabled={disabled}
        />
      )}
    </div>
  );
}
