"use client";

import * as React from "react";
import {
  motion,
  transform,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "cn";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";
import { SPRING_MOUSE, SPRING_TRAVEL } from "../lib/easing";
import { useControllableState } from "../lib/hooks/use-controllable-state";

/** The lens, sampled by distance from its centre in notches. 0 is the chip
 *  itself (its length comes from the label), then the neighbours either side,
 *  then every notch from 3 out. Interpolated between samples, so the lens
 *  slides through the bar instead of stepping from notch to notch. */
const LENS = [0, 1, 2, 3];
/** Bar length, across the row. */
const HEIGHT = [40, 34, 28, 22];
/** Bar thickness, along the row. */
const WIDTH = [6, 10, 8, 6];
const OPACITY = [1, 0.7, 0.45, 0.25];
/** Distance from the lens centre at which a notch is fully a chip, and fully
 *  a bar again. Between the two the chip morphs, which is what two notches
 *  trading places mid-glide look like. */
const CHIP_FULL = 0.15;
const CHIP_GONE = 0.85;

const REST = { height: HEIGHT[3], width: WIDTH[3], opacity: OPACITY[3] };
/** Resting distance between bar centres, px. */
const SLOT = 40;
/** Track padding at either end, px. Half a slot, so the first and last bars
 *  sit a full slot in from the track's ends, the same as the spacing. */
const TRACK_PAD = SLOT / 2;
/** Track thickness (height, or width when vertical), px. */
const TRACK_H = 70;
/** How far an open chip at either end sits from the track's round end, px:
 *  the same as its gap above and below, so it nests evenly into the end. */
const END_GAP = (TRACK_H - HEIGHT[0]) / 2;
/** The tightest the gap between two notches may get while a chip is open. */
const MIN_GAP = 6;
/** How much thicker than resting bars the lens makes the notches either side
 *  of the chip, summed over both sides. */
const LENS_SPREAD = 2 * (WIDTH[1] - REST.width + WIDTH[2] - REST.width);

/** A faint lit rim along the top, a shaded lip along the bottom and a hairline
 *  border, so the track reads as a shallow groove rather than a flat fill. */
const TRACK_SHADOW = [
  "inset 0 1px 0 color-mix(in oklab, var(--foreground) 10%, transparent)",
  "inset 0 -2px 3px color-mix(in oklab, var(--background) 45%, transparent)",
  "inset 0 0 0 1px color-mix(in oklab, var(--foreground) 6%, transparent)",
  "0 1px 2px color-mix(in oklab, var(--background) 60%, transparent)",
].join(", ");
/** Shades each bar's left and upper edge so the lit right edge stands out, the
 *  way a bevelled key catches light from the bottom right. */
const NOTCH_SHADOW = [
  "inset 1.5px 1px 0 color-mix(in oklab, var(--background) 22%, transparent)",
  "inset -1px -1px 0 color-mix(in oklab, var(--foreground) 12%, transparent)",
].join(", ");

export interface NavNotchItem {
  label: string;
  href?: string;
  /** What `value` is matched against. Falls back to `label`. */
  id?: string;
  onSelect?: () => void;
}

export interface NavNotchClassNames {
  track?: string;
  notch?: string;
  label?: string;
}

export interface NavNotchProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "onSelect" | "defaultValue"
> {
  items: NavNotchItem[];
  /** `id` (or `label`) of the current item. Its notch is drawn at full
   *  strength; it does not open or grow. `null` marks nothing current. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  /** Accessible name for the nav landmark. */
  label?: string;
  /** Lays the notches out in a row or a column. */
  orientation?: "horizontal" | "vertical";
  /** Vertical only: which way the open chip grows out of the track. */
  side?: "left" | "right";
  classNames?: NavNotchClassNames;
}

const keyOf = (item: NavNotchItem) => item.id ?? item.label;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lens = (stops: number[]) => transform(LENS, stops);
const lensHeight = lens(HEIGHT);
const lensWidth = lens(WIDTH);
const lensOpacity = lens(OPACITY);
const chipness = transform([CHIP_FULL, CHIP_GONE], [1, 0]);

type Shape = {
  /** 0 a resting bar, 1 a fully open chip. */
  open: number;
  /** Size along the row (or column). */
  along: number;
  /** Size across it. */
  across: number;
  opacity: number;
  /** Where the pill is drawn, from its resting centre, along the row. */
  offset: number;
};

/** Lays the row out for one frame, from the lens centre `c` (in notches) and
 *  its strength `s` (0 resting, 1 fully applied).
 *
 *  The hit areas never move (each is one resting slot), so this only decides
 *  where each pill is drawn. Pills are packed with one even gap between all
 *  of them. The margins at the ends start where the resting slots put them
 *  and shrink to END_GAP as an end notch opens, so an end chip nests into
 *  the track's round end and the gap beside it matches every other gap. */
function layout(
  c: number,
  s: number,
  labels: number[],
  count: number,
  slot: number,
  vertical: boolean,
): Shape[] {
  const shapes = Array.from({ length: count }, (_, i) => {
    const d = Math.abs(i - c);
    const open = chipness(d) * s;
    const thick = lerp(REST.width, lensWidth(d), s);
    const length = lerp(REST.height, lensHeight(d), s);
    const label = labels[i] ?? 0;
    return {
      open,
      // A horizontal chip grows along the row to fit its label; a vertical
      // one grows along the column to the chip height and across to the label.
      along: lerp(thick, vertical ? HEIGHT[0] : label, open),
      across: vertical ? lerp(length, label, open) : length,
      opacity: lerp(REST.opacity, lensOpacity(d), s),
      offset: 0,
    };
  });
  if (count === 0) return shapes;

  const total = TRACK_PAD * 2 + slot * count;
  const margin = (p: Shape) =>
    lerp(TRACK_PAD + (slot - p.along) / 2, END_GAP, p.open);
  const sum = shapes.reduce((n, p) => n + p.along, 0);
  const first = count > 1 ? margin(shapes[0]) : (total - sum) / 2;
  const last = count > 1 ? margin(shapes[count - 1]) : first;
  const gap = count > 1 ? (total - first - last - sum) / (count - 1) : 0;

  let cursor = first;
  for (let i = 0; i < count; i++) {
    const p = shapes[i];
    p.offset = cursor + p.along / 2 - (TRACK_PAD + (i + 0.5) * slot);
    cursor += p.along + gap;
  }
  return shapes;
}

function Notch({
  item,
  index,
  edge,
  frame,
  active,
  vertical,
  side,
  current,
  tabStop,
  classNames,
  setRef,
  onMeasure,
  onEnter,
  onFocus,
  onBlur,
  onKeyDown,
  onPick,
}: {
  item: NavNotchItem;
  index: number;
  /** Which end of the bar this notch sits at, if any. */
  edge?: "start" | "end";
  frame: MotionValue<Shape[]>;
  /** The current item's highlight, as a gliding position in notches and how
   *  present it is (0 when nothing is current). */
  active: { at: MotionValue<number>; on: MotionValue<number> };
  vertical: boolean;
  side: "left" | "right";
  current: boolean;
  tabStop: boolean;
  classNames?: NavNotchClassNames;
  setRef: (el: HTMLElement | null) => void;
  onMeasure: (width: number) => void;
  onEnter: () => void;
  onFocus: (event: React.FocusEvent<HTMLElement>) => void;
  onBlur: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onPick: () => void;
}) {
  const labelRef = React.useRef<HTMLSpanElement>(null);
  /** The label's own width, for clipping it to the chip while it morphs. */
  const labelWidth = React.useRef(0);

  /** The chip's open length is the label's own width, measured rather than
   *  animated to "auto", so the lens can blend it frame by frame. */
  const report = React.useRef(onMeasure);
  report.current = onMeasure;
  React.useLayoutEffect(() => {
    const el = labelRef.current;
    if (!el) return;
    const measure = () => {
      labelWidth.current = el.offsetWidth;
      report.current(el.offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const at = (f: Shape[]) => f[index] ?? f[f.length - 1];
  const along = useTransform(frame, (f) => at(f).along);
  const across = useTransform(frame, (f) => at(f).across);
  const open = useTransform(frame, (f) => at(f).open);
  const opacity = useTransform(() =>
    Math.max(
      // The highlight lights whichever notches it is passing over, fading
      // linearly across one slot, so it travels instead of jumping.
      active.on.get() * Math.max(0, 1 - Math.abs(index - active.at.get())),
      at(frame.get()).opacity,
    ),
  );
  /** One transform string rather than the x/y shorthands, so it stays on
   *  the compositor. The -50% terms centre the element on its slot, whatever
   *  its size, then the packing offset moves it; a vertical chip also pops
   *  out across the track toward `side`, keeping END_GAP on the inside edge.
   *  The pill and its label share it, so the label rides the chip's centre.
   *  Not rounded: half-pixel snapping made the label step while it moved. */
  const move = useTransform(frame, (f) => {
    const p = at(f);
    if (!vertical) return `translate3d(calc(-50% + ${p.offset}px), -50%, 0)`;
    const pop =
      (side === "right" ? 1 : -1) * p.open * (END_GAP - (TRACK_H - p.across) / 2);
    return `translate3d(calc(-50% + ${pop}px), calc(-50% + ${p.offset}px), 0)`;
  });
  /** Trims the label to the chip's current width while it morphs. A clip,
   *  not overflow on a resizing box, so the text itself never relayouts. */
  const labelClip = useTransform(frame, (f) => {
    const p = at(f);
    const chip = vertical ? p.across : p.along;
    return `inset(0 ${Math.max(0, (labelWidth.current - chip) / 2)}px)`;
  });
  /** Every bar stays a full pill at whatever thickness the lens gives it;
   *  only the chip firms up into rounded corners. At either end of the bar
   *  the outer side stays a pill, nesting into the track's round end. */
  const radius = useTransform(frame, (f) => {
    const p = at(f);
    return lerp(Math.min(p.along, p.across) / 2, 10, p.open);
  });
  const pill = useTransform(frame, (f) => {
    const p = at(f);
    return Math.min(p.along, p.across) / 2;
  });
  const start = edge === "start" ? pill : radius;
  const end = edge === "end" ? pill : radius;
  const labelOpacity = useTransform(open, (o) => o * o);
  // "none" once settled: even blur(0) keeps the text on its own rasterized
  // layer, which renders softer than plain text.
  const labelFilter = useTransform(open, (o) =>
    o > 0.98 ? "none" : `blur(${(1 - o) * 4}px)`,
  );

  const Tag = item.href ? "a" : "button";

  return (
    <li className="relative flex min-h-0 min-w-0 flex-1">
      <Tag
        ref={setRef}
        {...(item.href ? { href: item.href } : { type: "button" as const })}
        tabIndex={tabStop ? 0 : -1}
        aria-current={current ? "page" : undefined}
        onPointerEnter={onEnter}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onClick={onPick}
        // Inline, so a page-wide :focus-visible outline can't outrank it; the
        // focus ring is drawn on the pill instead, hugging the chip.
        style={{ outline: "none" }}
        className="group relative size-full cursor-pointer outline-none"
      >
        {/* Out of flow and deaf to the pointer: the pill is drawn wider than
            its slot and away from it, and neither ever moves a hit area,
            which is what keeps the lens from chasing its own layout. */}
        <motion.span
          style={{
            width: vertical ? across : along,
            height: vertical ? along : across,
            opacity,
            transform: move,
            borderTopLeftRadius: start,
            borderBottomLeftRadius: vertical ? end : start,
            borderTopRightRadius: vertical ? start : end,
            borderBottomRightRadius: end,
            boxShadow: NOTCH_SHADOW,
          }}
          className={cn(
            "pointer-events-none absolute top-1/2 left-1/2 bg-foreground",
            "group-focus-visible:ring-2 group-focus-visible:ring-ring/60 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
            classNames?.notch,
          )}
        />
        {/* The label is a sibling on its own layer, not a child of the pill.
            Inside the pill it was centred by layout in a box that changed
            width every frame, so the browser re-snapped the glyphs to the
            pixel grid each frame and the text twitched against the chip.
            Here its box never changes size; it only moves by transform. */}
        <motion.span
          ref={labelRef}
          style={{
            opacity: labelOpacity,
            filter: labelFilter,
            clipPath: labelClip,
            transform: move,
          }}
          className={cn(
            "pointer-events-none absolute top-1/2 left-1/2 whitespace-nowrap px-3.5 text-sm font-medium uppercase tracking-wide text-background will-change-transform",
            classNames?.label,
          )}
        >
          {item.label}
        </motion.span>
      </Tag>
    </li>
  );
}

export function NavNotch({
  items,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  label = "Navigation",
  orientation = "horizontal",
  side = "right",
  className,
  classNames,
  ...rest
}: NavNotchProps) {
  const reduced = useReducedMotionPreference();
  const [value, setValue] = useControllableState<string | null>({
    value: valueProp,
    defaultValue,
    onValueChange: onValueChange as ((v: string | null) => void) | undefined,
  });
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [focused, setFocused] = React.useState<number | null>(null);
  const refs = React.useRef<(HTMLElement | null)[]>([]);
  const vertical = orientation === "vertical";
  const count = items.length;

  const labels = React.useRef<number[]>([]);
  const [widest, setWidest] = React.useState(0);
  /** Bumped whenever something the layout reads from a ref changes, so the
   *  frame recomputes even while the springs are at rest. */
  const version = useMotionValue(0);
  const measured = (index: number, width: number) => {
    labels.current[index] = width;
    version.set(version.get() + 1);
    setWidest(Math.max(0, ...labels.current.slice(0, count)));
  };

  /** The track never changes size and the hit areas are its resting slots.
   *  If either moved with the lens, a notch would slide under a still
   *  pointer, the pointer would land on its neighbour, the lens would
   *  retarget and move things again: that loop was the jitter. The slots
   *  only grow past SLOT when a short bar needs the room for its chip. */
  const chipExtra =
    Math.max(0, (vertical ? HEIGHT[0] : widest) - REST.width) + LENS_SPREAD;
  const inner = Math.max(
    count * SLOT,
    count * (REST.width + MIN_GAP) + chipExtra,
  );
  const slot = count ? inner / count : SLOT;
  const trackLength = inner + TRACK_PAD * 2;

  const geometry = React.useRef({ count, slot, vertical });
  geometry.current = { count, slot, vertical };
  React.useEffect(() => {
    version.set(version.get() + 1);
  }, [count, slot, vertical, version]);

  /** Where the lens sits, in notches, and how strongly it is applied. Both
   *  spring, so the lens glides between notches and swells in and out
   *  instead of snapping. */
  const center = useSpring(0, SPRING_MOUSE);
  const strength = useSpring(0, SPRING_MOUSE);
  /** One layout pass per frame for the whole row; every notch reads its own
   *  entry. */
  const frame = useTransform([center, strength, version], ([c, s]) => {
    const g = geometry.current;
    return layout(
      c as number,
      s as number,
      labels.current,
      g.count,
      g.slot,
      g.vertical,
    );
  });

  const selected = items.findIndex((item) => keyOf(item) === value);
  /** The current-item highlight travels to a newly picked notch, unhurried
   *  enough that a jump across the whole row can be followed by eye. */
  const activeAt = useSpring(Math.max(0, selected), SPRING_TRAVEL);
  const activeOn = useSpring(selected >= 0 ? 1 : 0, SPRING_TRAVEL);
  const active = React.useMemo(
    () => ({ at: activeAt, on: activeOn }),
    [activeAt, activeOn],
  );
  React.useEffect(() => {
    if (selected < 0) {
      if (reduced) activeOn.jump(0);
      else activeOn.set(0);
      return;
    }
    // From nothing current, the highlight fades in where it lands rather
    // than sliding over from wherever it last was.
    if (reduced || activeOn.get() < 0.05) activeAt.jump(selected);
    else activeAt.set(selected);
    if (reduced) activeOn.jump(1);
    else activeOn.set(1);
  }, [selected, reduced, activeAt, activeOn]);
  const target = hovered ?? focused;
  /** The single tab stop; arrows move between notches inside it. */
  const tabStop = focused ?? (selected >= 0 ? selected : 0);

  React.useEffect(() => {
    if (target === null) {
      if (reduced) strength.jump(0);
      else strength.set(0);
      return;
    }
    // Arriving from rest, the lens appears where the pointer came in rather
    // than gliding over from wherever it was last.
    if (reduced || strength.get() < 0.05) center.jump(target);
    else center.set(target);
    if (reduced) strength.jump(1);
    else strength.set(1);
  }, [target, reduced, center, strength]);

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = count - 1;
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? Math.min(index + 1, last)
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? Math.max(index - 1, 0)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    refs.current[next]?.focus();
  };

  return (
    <nav aria-label={label} className={cn("inline-flex", className)} {...rest}>
      <ul
        onPointerLeave={() => setHovered(null)}
        className={cn(
          "flex items-stretch rounded-full",
          vertical && "flex-col",
          classNames?.track,
        )}
        style={{
          width: vertical ? TRACK_H : trackLength,
          height: vertical ? trackLength : TRACK_H,
          boxShadow: TRACK_SHADOW,
          [vertical ? "paddingBlock" : "paddingInline"]: TRACK_PAD,
          background:
            "color-mix(in oklab, var(--foreground) 9%, var(--background))",
        }}
      >
        {items.map((item, index) => (
          <Notch
            key={keyOf(item)}
            item={item}
            index={index}
            edge={
              index === 0 ? "start" : index === count - 1 ? "end" : undefined
            }
            frame={frame}
            active={active}
            vertical={vertical}
            side={side}
            current={index === selected}
            tabStop={index === tabStop}
            classNames={classNames}
            setRef={(el) => {
              refs.current[index] = el;
            }}
            onMeasure={(width) => measured(index, width)}
            onEnter={() => setHovered(index)}
            onFocus={(event) => {
              // Only keyboard focus opens the lens. A click focuses the notch
              // too, and that focus would hold the chip open after the
              // pointer leaves.
              if (event.currentTarget.matches(":focus-visible"))
                setFocused(index);
            }}
            onBlur={() => setFocused(null)}
            onKeyDown={(event) => onKeyDown(event, index)}
            onPick={() => {
              setValue(keyOf(item));
              item.onSelect?.();
            }}
          />
        ))}
      </ul>
    </nav>
  );
}
