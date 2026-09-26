"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "cn";
import { useControllableState } from "../lib/hooks/use-controllable-state";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";

/** Dot diameter, px - a hair under the badge it sits against, which is what
 *  makes the two read as one row rather than a marker beside a label. */
const DOT = 28;
/** Badge height, and with it the dot's centre from the top of a row. The dot
 *  lines up with "Step n", not with the title. */
const BADGE = 22;
const CY = BADGE / 2;
/** How far the active row slides off the rail. Roughly two dots' worth - less
 *  and the detour reads as a wobble. */
const SHIFT = 44;
/** Text inset from the dot's left edge. Generous on purpose: the rail is the
 *  fixed thing on the page, and the gap is what gives it room to bend. */
const RAIL = 76;
/** Rail x of a dot at rest, in the connector's own units. */
const CX = DOT / 2;
/** Clear space between the rail and each dot, px. Real space, not a stroke in
 *  the page colour, so it holds on any background. */
const GAP = 3;
/** Where a run starts below one dot and stops above the next, from the dot's
 *  centre: the dot's own radius plus the gap. */
const END = DOT / 2 + GAP;

/** The jog, as a share of one run between two dots: how much of it the line
 *  spends stepping off the rail, and the straight run it always leaves between
 *  the jog and the dot it is stepping aside for. Shares rather than pixels, so
 *  a row whose text wraps keeps the same shape instead of needing measuring. */
const JOG = 36;
const PAD = 18;

/** Overdamped on purpose: the rail is a 1.5px line, so it shows every
 *  overshoot, and a connector that bounces back reads as a loose cable. */
const SPRING_RAIL = { stiffness: 320, damping: 34, mass: 0.7 } as const;
const TRANSITION_RAIL = { type: "spring", ...SPRING_RAIL } as const;

/** A row's horizontal offset, sprung. */
function useOffset(on: boolean, shift: number) {
  const target = useMotionValue(on ? shift : 0);
  React.useEffect(() => {
    target.set(on ? shift : 0);
  }, [on, shift, target]);
  return useSpring(target, SPRING_RAIL);
}

/** One gap of rail, from just below one dot to just above the next (`END`
 *  either side of the two centres). The box is stretched
 *  to whatever height the gap turns out to be - `non-scaling-stroke` is what
 *  buys that, keeping the line 1.5px however tall the rows grow, so nothing
 *  here has to measure them. The box is `top` plus a `calc()` height, not
 *  `top/bottom`: an <svg> is a replaced element, so with an auto height it
 *  would take the viewBox's intrinsic 100px rather than stretching.
 *
 *  The run is not one long bow. It is a straight rail with a single short jog
 *  in it, and the jog sits next to the dot it is stepping aside for - late when
 *  the line is arriving at the active dot, early when it is leaving. `jogTop`
 *  slides between those two ends with the sprung offsets, so the flip from one
 *  to the other when the active step changes is a travel, not a jump. */
function Connector({
  from,
  to,
  shift,
}: {
  from: boolean;
  to: boolean;
  shift: number;
}) {
  const a = useOffset(from, shift);
  const b = useOffset(to, shift);
  const d = useTransform(
    [a, b] as MotionValue<number>[],
    ([x, y]: number[]) => {
      // -1 leaving the active dot, +1 arriving at it, 0 while the run is straight.
      const lean = shift ? (y - x) / shift : 0;
      const top = PAD + (0.5 + 0.5 * lean) * (100 - JOG - 2 * PAD);
      // Control points share the jog's midpoint, which is what makes it leave
      // and rejoin the rail vertically - the straight runs meet it with no kink.
      const mid = top + JOG / 2;
      return `M${CX + x} 0V${top}C${CX + x} ${mid} ${CX + y} ${mid} ${CX + y} ${top + JOG}V100`;
    },
  );

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute overflow-visible"
      style={{
        top: CY + END,
        left: 0,
        width: DOT + SHIFT,
        height: `calc(100% - ${2 * END}px)`,
      }}
      viewBox={`0 0 ${DOT + SHIFT} 100`}
      preserveAspectRatio="none"
      fill="none"
    >
      <motion.path
        d={d}
        className="stroke-border"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export interface TimelineStep {
  /** Stable selection ID. Defaults to the step index for legacy data. */
  id?: React.Key;
  /** Defaults to `Step n`. */
  label?: string;
  title: string;
  description?: string;
}

export type TimelineActiveId = React.Key | null;

/** React's drag and animation handlers collide with Motion's own. */
type ListProps = Omit<
  React.HTMLAttributes<HTMLOListElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

export interface TimelineClassNames {
  root?: string;
  item?: string;
  content?: string;
}

export interface TimelineSlotProps {
  root?: React.HTMLAttributes<HTMLOListElement>;
}

export interface TimelineStepRenderProps {
  step: TimelineStep;
  index: number;
  active: boolean;
}

export interface TimelineProps extends ListProps {
  steps: TimelineStep[];
  /** Controlled ID of the highlighted step. `null` leaves the rail straight. */
  activeId?: TimelineActiveId;
  /** Initial highlighted step ID when uncontrolled. */
  defaultActiveId?: TimelineActiveId;
  /** Fires on every highlighted step change, including `null` or `-1`. */
  onActiveChange?: (id: TimelineActiveId) => void;
  /** @deprecated Use `defaultActiveId`. Indexes without an `id` still work. */
  defaultActive?: number;
  /** Custom content inside the preset timeline item. */
  renderStep?: (props: TimelineStepRenderProps) => React.ReactNode;
  classNames?: TimelineClassNames;
  slotProps?: TimelineSlotProps;
}

export function Timeline({
  steps,
  activeId,
  defaultActiveId,
  defaultActive,
  onActiveChange,
  renderStep,
  classNames,
  slotProps,
  className,
  ...rest
}: TimelineProps) {
  const legacyDefaultActiveId =
    defaultActive === undefined
      ? -1
      : (steps[defaultActive]?.id ?? defaultActive);
  const restingActiveId =
    defaultActiveId !== undefined ? defaultActiveId : legacyDefaultActiveId;
  const [active, setActive] = useControllableState({
    value: activeId,
    defaultValue: restingActiveId,
    onValueChange: onActiveChange,
  });
  // Under reduced motion nothing slides, so the rail never bends and only the
  // dot's colour carries the highlight. That is the whole accommodation.
  const shift = useReducedMotionPreference() ? 0 : SHIFT;

  const highlight = (id: TimelineActiveId) => setActive(id);

  return (
    <ol {...slotProps?.root} className={cn("relative", className, classNames?.root)} {...rest}>
      {steps.map((step, i) => {
        const stepId = step.id ?? i;
        const nextStepId = steps[i + 1]?.id ?? i + 1;
        const last = i === steps.length - 1;
        const on = active === stepId;
        return (
          <li
            key={stepId}
            aria-current={on ? "step" : undefined}
            className={cn("relative", classNames?.item)}
            onPointerEnter={() => highlight(stepId)}
            onPointerLeave={() => highlight(restingActiveId)}
            // Focus bubbles in React, so anything focusable a caller puts
            // inside a step lights that step up too.
            onFocus={() => highlight(stepId)}
            onBlur={() => highlight(restingActiveId)}
          >
            {!last && (
              <Connector from={on} to={active === nextStepId} shift={shift} />
            )}
            <motion.div
              animate={{ x: on ? shift : 0 }}
              transition={TRANSITION_RAIL}
              className={cn("relative flex", !last && "pb-18")}
            >
              <span
                aria-hidden
                className={cn(
                  // Filled inside a transparent 3px ring: the dot keeps its 28px
                  // footprint while the rail stops short of it.
                  "block shrink-0 rounded-full bg-clip-content p-0.75 transition-colors duration-300",
                  on ? "bg-primary" : "bg-border",
                )}
                style={{
                  width: DOT,
                  height: DOT,
                  marginTop: CY - DOT / 2,
                  marginRight: RAIL - DOT,
                }}
              />
              <div className={cn("min-w-0", classNames?.content)}>
                {renderStep?.({ step, index: i, active: on })}
                <span
                  className="inline-flex items-center rounded-full border border-border px-2 font-mono text-[11px] leading-none text-muted-foreground"
                  style={{ height: BADGE }}
                >
                  {step.label ?? `Step ${i + 1}`}
                </span>
                <h3 className="mt-2.5 text-[20px]/7 font-semibold tracking-[-0.02em] text-foreground">
                  {step.title}
                </h3>
                {step.description && (
                  <p className="mt-1.5 text-[14px]/5 text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
}

export namespace Timeline {
  export function Item({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
    return <li {...props} className={cn("relative", className)} />;
  }
}
