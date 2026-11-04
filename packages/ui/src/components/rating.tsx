"use client";

import * as React from "react";
import { animate, motion, useMotionValue } from "motion/react";
import { cn } from "cn";
import { SPRING_LAYOUT, SPRING_MOUSE, SPRING_PRESS } from "../lib/easing";
import { useControllableState } from "../lib/hooks/use-controllable-state";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";

export type RatingSize = "sm" | "md" | "lg";

/** Star edge and the gap between stars, px. */
const SIZES: Record<RatingSize, { star: number; gap: number }> = {
  sm: { star: 20, gap: 3 },
  md: { star: 28, gap: 4 },
  lg: { star: 36, gap: 6 },
};

const Star = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path
      d="M12 2.8l2.75 5.6 6.15.9-4.45 4.33 1.05 6.12L12 16.87l-5.5 2.88 1.05-6.12L3.1 9.3l6.15-.9z"
      strokeLinejoin="round"
    />
  </svg>
);

export interface RatingClassNames {
  /** The unfilled shapes. */
  empty?: string;
  /** The filled shapes. */
  fill?: string;
}

export interface RatingProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** How many stars. */
  count?: number;
  /** 1 for whole stars, 0.5 to allow halves. */
  step?: 1 | 0.5;
  size?: RatingSize;
  /** Picking the current value again clears it to 0. */
  clearable?: boolean;
  /** Shows the value without taking input, such as a product's average. */
  readOnly?: boolean;
  disabled?: boolean;
  /** Replaces the star; it is drawn in currentColor. */
  icon?: React.ReactNode;
  /** Form field name; the value submits with the form. */
  name?: string;
  /** Read out with the value, such as "3.5 out of 5". */
  valueText?: (value: number, count: number) => string;
  classNames?: RatingClassNames;
}

export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(function Rating(
  {
    value: valueProp,
    defaultValue = 0,
    onValueChange,
    count = 5,
    step = 1,
    size = "md",
    clearable = false,
    readOnly = false,
    disabled = false,
    icon,
    name,
    valueText = (v, n) => `${v} out of ${n}`,
    classNames,
    className,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onValueChange,
  });
  const reduced = useReducedMotionPreference();
  const { star, gap } = SIZES[size];
  const unit = star + gap;
  const interactive = !readOnly && !disabled;
  const snap = (v: number) => Math.min(count, Math.max(0, Math.round(v / step) * step));
  const shown = snap(value);

  /** Fill width for a value: whole stars and their gaps, then part of the
   *  next star. */
  const widthFor = (v: number) => Math.floor(v) * unit + (v % 1) * star;
  const width = useMotionValue(widthFor(shown));
  const [preview, setPreview] = React.useState<number | null>(null);
  const [popped, setPopped] = React.useState<{ i: number; n: number } | null>(null);

  const target = preview ?? shown;
  React.useEffect(() => {
    const to = widthFor(target);
    if (reduced) width.jump(to);
    else animate(width, to, preview !== null ? SPRING_MOUSE : SPRING_LAYOUT);
  }, [target, preview !== null, reduced, unit, star]);

  const fromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left;
    const i = Math.min(count - 1, Math.max(0, Math.floor(x / unit)));
    const within = x - i * unit;
    return step === 0.5 && within < star / 2 ? i + 0.5 : i + 1;
  };

  const commit = (v: number) => {
    const next = clearable && v === shown ? 0 : snap(v);
    setValue(next);
    if (next > 0) setPopped((p) => ({ i: Math.ceil(next) - 1, n: (p?.n ?? 0) + 1 }));
  };

  const shape = icon ?? <Star />;
  const row = (cls?: string) => (
    <div className={cn("flex", cls)} style={{ gap }}>
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={popped?.i === i ? `p${popped.n}` : i}
          className="grid shrink-0 place-items-center [&_svg]:size-full"
          style={{ width: star, height: star }}
          initial={!reduced && popped?.i === i ? { scale: 1.25 } : false}
          animate={{ scale: 1 }}
          transition={SPRING_PRESS}
        >
          {shape}
        </motion.span>
      ))}
    </div>
  );

  return (
    <div
      {...rest}
      ref={ref}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-valuemin={0}
      aria-valuemax={count}
      aria-valuenow={shown}
      aria-valuetext={valueText(shown, count)}
      aria-readonly={readOnly || undefined}
      aria-disabled={disabled || undefined}
      onPointerMove={(e) => {
        rest.onPointerMove?.(e);
        if (interactive && e.pointerType === "mouse") setPreview(fromPointer(e));
      }}
      onPointerLeave={(e) => {
        rest.onPointerLeave?.(e);
        setPreview(null);
      }}
      onPointerDown={(e) => {
        rest.onPointerDown?.(e);
        if (!interactive) return;
        // Touch and pen drag across the stars, then commit on release.
        if (e.pointerType !== "mouse") {
          e.currentTarget.setPointerCapture(e.pointerId);
          setPreview(fromPointer(e));
        }
      }}
      onPointerUp={(e) => {
        rest.onPointerUp?.(e);
        if (!interactive) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        commit(fromPointer(e));
        if (e.pointerType !== "mouse") setPreview(null);
      }}
      onLostPointerCapture={() => {
        if (preview !== null) setPreview(null);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (!interactive) return;
        const by: Record<string, number> = {
          ArrowRight: step,
          ArrowUp: step,
          ArrowLeft: -step,
          ArrowDown: -step,
        };
        let next: number | null = null;
        if (e.key in by) next = shown + by[e.key];
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = count;
        else if (/^[0-9]$/.test(e.key) && +e.key <= count) next = +e.key;
        if (next === null) return;
        e.preventDefault();
        setValue(snap(next));
      }}
      className={cn(
        "relative inline-flex rounded-lg outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        interactive ? "cursor-pointer touch-none" : "cursor-default",
        disabled && "opacity-50",
        className,
      )}
    >
      {row(cn("text-foreground/12", classNames?.empty))}
      <motion.div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden" style={{ width }}>
        {row(cn("w-max text-warning", classNames?.fill))}
      </motion.div>
      {name && <input type="hidden" name={name} value={shown} disabled={disabled} />}
    </div>
  );
});

Rating.displayName = "Rating";
