"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";
import { EASE_OUT, SPRING_PRESS } from "../lib/easing";
import {
  IconChatRoundDots,
  IconArrowRightUp,
  IconSetting4,
  IconBarChart,
} from "@devigner-ui/icons";

// A stat card whose bar chart is the interactive part: one bar is open at a
// time, hatched instead of solid, with the tooltip riding on top of it. The
// tooltip is positioned off the same percentage that sizes the bar, so the two
// can never drift apart.

/** Shortest bar as a share of the track, so a near-zero month is still a bar. */
const BAR_FLOOR = 20;
/** Tallest bar, leaving the rest of the track as headroom for the tooltip. */
const BAR_CEILING = 88;

export interface ChartCardPoint {
  label: string;
  value: number;
}

export interface ChartCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title?: React.ReactNode;
  /** Small line above the headline figure. */
  caption?: string;
  /** Headline figure. Defaults to the sum of the data. */
  total?: number;
  data: ChartCardPoint[];
  /** Bar open on first render. */
  defaultActive?: number;
  /** Replaces the three built-in header buttons. */
  actions?: React.ReactNode;
  /** Count on the comments button; 0 hides it. */
  notifications?: number;
}

const format = (n: number) => n.toLocaleString("en-US");

/** Headline figures read first group bright, remainder muted. */
function SplitNumber({ value, muted }: { value: number; muted: string }) {
  const text = format(value);
  const comma = text.indexOf(",");
  if (comma === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, comma + 1)}
      <span className={muted}>{text.slice(comma + 1)}</span>
    </>
  );
}

function IconButton({
  label,
  children,
  ...rest
}: { label: string } & React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      transition={SPRING_PRESS}
      className="relative inline-grid size-11 cursor-pointer place-items-center rounded-full bg-surface-hover text-text-secondary transition-colors hover:text-foreground"
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export function ChartCard({
  title = "Total sales",
  caption = "for all time",
  total,
  data,
  defaultActive = Math.floor(data.length / 2),
  actions,
  notifications = 0,
  className,
  ...rest
}: ChartCardProps) {
  const [active, setActive] = React.useState(defaultActive);
  const reduced = useReducedMotion();
  // Per-instance: a shared layoutId would make two cards on one page swap
  // tooltips with each other.
  const tooltipId = React.useId();

  const { max, sum } = data.reduce(
    (a, d) => ({ max: Math.max(a.max, d.value), sum: a.sum + d.value }),
    { max: 1, sum: 0 },
  );
  const heightOf = (value: number) =>
    BAR_FLOOR + (value / max) * (BAR_CEILING - BAR_FLOOR);
  // The open index outlives the data it points at: clamped on read, so a
  // shorter `data` closes the last bar instead of closing every bar.
  const activeIndex = Math.min(active, data.length - 1);

  return (
    <div
      className={cn(
        "w-full max-w-lg rounded-4xl bg-background p-6 text-foreground",
        className,
      )}
      {...rest}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="inline-grid size-13 shrink-0 place-items-center rounded-full bg-surface2 text-text-secondary"
        >
          <IconBarChart className="size-6.5" variant="Bulk" />
        </span>
        <h3 className="min-w-0 flex-1 truncate text-2xl tracking-tight">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {actions ?? (
            <>
              <IconButton label="Adjust">
                <IconSetting4 className="size-5" />
              </IconButton>
              <IconButton label="Comments">
                <IconChatRoundDots className="size-5" />
                {notifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-3 leading-none ring-background">
                    {notifications}
                  </span>
                )}
              </IconButton>
              <IconButton label="Open report">
                <IconArrowRightUp className="size-5" />
              </IconButton>
            </>
          )}
        </div>
      </div>

      <p className="mt-7 text-sm text-text-muted">{caption}</p>
      <p className="mt-1 text-5xl tracking-tight tabular-nums">
        <SplitNumber value={total ?? sum} muted="text-text-tertiary" />
      </p>

      <div className="mt-8 flex h-52 items-end gap-2">
        {data.map((point, i) => {
          const height = heightOf(point.value);
          const isActive = i === activeIndex;
          return (
            <div key={i} className="relative flex h-full flex-1 justify-center">
              {isActive && (
                // The wrapper holds the position, the tooltip inside holds the
                // layoutId - so one tooltip travels bar to bar instead of two
                // crossfading. Centring moves to flexbox because layout
                // projection writes transform, which the old x: "-50%" fought.
                <div
                  className="pointer-events-none absolute inset-x-0 z-10 flex justify-center"
                  style={{ bottom: `calc(${height}% + 0.75rem)` }}
                >
                  <motion.div
                    layoutId={reduced ? undefined : tooltipId}
                    initial={reduced ? false : { opacity: 0, scale: 0.9, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      ease: EASE_OUT,
                      layout: { duration: 0.2, ease: EASE_OUT },
                    }}
                    className="origin-bottom rounded-xl bg-brand/70 px-3.5 py-2 text-sm font-medium whitespace-nowrap text-accent-foreground tabular-nums"
                  >
                    <SplitNumber
                      value={point.value}
                      muted="text-accent-foreground/60"
                    />
                  </motion.div>
                </div>
              )}
              <motion.button
                type="button"
                aria-pressed={isActive}
                aria-label={`${point.label}: ${format(point.value)}`}
                onClick={() => setActive(i)}
                initial={reduced ? false : { height: 0 }}
                animate={{ height: `${height}%` }}
                whileTap={{ scaleX: reduced ? 0.98 : 0.96 }}
                transition={{
                  duration: 0.6,
                  ease: EASE_OUT,
                  delay: i * 0.05,
                  // Height is the data channel; a uniform scale would make the
                  // bar lie about its value mid-press. delay: 0 so the press
                  // never inherits the entrance stagger.
                  scaleX: { ...SPRING_PRESS, delay: 0 },
                }}
                style={
                  isActive
                    ? {
                        backgroundImage:
                          "repeating-linear-gradient(45deg, currentColor 0 4px, transparent 4px 10px)",
                      }
                    : undefined
                }
                className={cn(
                  "relative w-full cursor-pointer self-end rounded-2xl bg-surface-hover text-foreground/10 transition-colors border-t-3 border-border-hover",
                  !isActive && "hover:bg-border-hover",
                )}
              >
                <span
                  className={cn(
                    "absolute -top-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-foreground ring-3 ring-background transition-colors",
                    isActive && "bg-brand",
                  )}
                />
              </motion.button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        {data.map((point, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              "flex-1 text-center text-xs transition-colors",
              i === activeIndex ? "text-foreground" : "text-text-muted",
            )}
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
