"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "cn";
import { EASE_OUT, SPRING_GOO, SPRING_LAYOUT, SPRING_RETRACT } from "../lib/easing";
import { useNotches, pauseTimers, resumeTimers } from "../lib/notch-store";
import type { NotchRecord } from "../lib/notch-queue";

/** The anchor is a lozenge parked above the viewport edge, wide and short. It
 *  is never itself visible - only its contribution to the bridge is. Without a
 *  second shape there is nothing to fuse with and the droplet just fades in. */
const ANCHOR_W = 120;
const ANCHOR_H = 40;
const ANCHOR_TOP = -24;

/** Travel. Deliberately short: the bridge carries the effect, and extra
 *  distance buys nothing but latency. At Y_FROM the droplet is still fully
 *  merged with the anchor, which is why nothing is legible until it moves. */
const Y_FROM = -8;
const Y_TO = 16;

/** Blur radius from the 0-10 viscosity prop. Higher sigma means the halos
 *  overlap for longer, so the neck stretches further before it snaps - which
 *  is what reads as a thicker liquid. Below about 4 the bridge never forms at
 *  all; above about 14 it never lets go within the travel distance. */
export const sigmaFor = (viscosity: number) =>
  4 + (Math.min(10, Math.max(0, viscosity)) / 10) * 10;

/** The filtered layer. Solid shapes only - the filter blurs and then
 *  alpha-crushes every descendant, so text put in here comes out as fringed
 *  mush. That constraint is the entire reason the notch is two layers.
 *
 *  Two blobs, not one: a border-coloured blob sits a pixel proud of a
 *  background-coloured one, so the outline is gooed too and stretches with the
 *  neck. A CSS border would simply be blurred into the fill and vanish. */
function NotchGoo({
  y,
  width,
  height,
  radius,
  filterId,
}: {
  y: MotionValue<number>;
  width: number;
  height: number;
  radius: number;
  filterId: string;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
      style={{ filter: `url(#${filterId})` }}
    >
      {/* Parked above the edge. Nothing about it is meant to be seen. */}
      <div
        className="absolute rounded-full bg-border"
        style={{
          width: ANCHOR_W,
          height: ANCHOR_H,
          top: ANCHOR_TOP,
        }}
      />
      <motion.div className="absolute" style={{ y }}>
        {/* Border blob first, so the fill paints over its middle and leaves
            exactly the 1px proud edge showing. */}
        <div
          className="absolute bg-border"
          style={{
            width: width + 2,
            height: height + 2,
            left: -(width + 2) / 2,
            // Explicit, not left to resolve from static position - an
            // ancestor or sibling change could otherwise shift this and
            // silently break the 1px proud edge the outline depends on.
            top: 0,
            borderRadius: radius + 1,
          }}
        />
        <div
          className="absolute bg-background"
          style={{
            width,
            height,
            left: -width / 2,
            top: 1,
            borderRadius: radius,
          }}
        />
      </motion.div>
    </div>
  );
}

/** The filter itself. Two nodes, and three things that are easy to get wrong:
 *
 *  1. The region must be declared. A <filter> defaults to -10%/+10% of the
 *     bounding box, and a stretched neck exceeds that and is clipped clean
 *     through. This is the single most common reason a goo demo looks broken.
 *  2. No feBlend. Published versions end with feBlend against SourceGraphic to
 *     keep inner content crisp; here there is no inner content, so that node
 *     only re-composites the sharp un-gooed silhouette on top of the liquid
 *     one and cancels the effect outright.
 *  3. The alpha row is the whole trick: newAlpha = 18*A - 7 puts a hard cutoff
 *     at A of about 0.39, so two blurred halos read as one solid shape while
 *     they overlap above it and as two the instant they do not. The neck
 *     stretching, thinning and snapping is emergent. Do not animate it. */
function GooFilter({ id, sigma }: { id: string; sigma: number }) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute size-0"
      focusable="false"
    >
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={sigma}
            result="blur"
          />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
          />
        </filter>
      </defs>
    </svg>
  );
}

/** Corner radius of the resting pill. Half the minimum height, so a
 *  single-line notch reads as a pill and a grown one keeps the same corner
 *  rather than swapping shape as it expands. */
const RADIUS = 22;
/** Width floor. Below this a one- or two-word title ("Saved") reads as a
 *  stray badge rather than a notification - the pill needs enough width to
 *  look intentional even when the content itself is short. */
const MIN_W = 180;
const MIN_H = 44;

/** Measures the content so the blob underneath can match it.
 *
 *  The blob has no content of its own, so nothing sizes it, yet it has to
 *  track a pill sized by its own text through an entrance, a status morph and
 *  an expand. A ResizeObserver is the honest answer: the alternative, a hidden
 *  twin of the children rendered under [&_*]:invisible, sizes with zero lag
 *  but runs the children's effects twice and collides their refs, which breaks
 *  the moment anyone uses the `content` escape hatch.
 *
 *  The one-frame measurement lag it costs is invisible because both layers
 *  spring toward the same target rather than snapping to raw numbers. */
function useContentSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = React.useState({ width: MIN_W, height: MIN_H });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize({
        width: Math.max(MIN_W, Math.round(box.width)),
        height: Math.max(MIN_H, Math.round(box.height)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export interface ToasterProps {
  /** 0-10. Higher is a longer, lazier neck before the bridge snaps. */
  viscosity?: number;
  /** Default auto-dismiss in ms. Per-notch `duration` overrides it. */
  duration?: number;
  /** Whether hovering expands the notch. Click-to-expand is always on. */
  expand?: boolean;
  /** Extra px below the top edge, for consumers with a fixed header of their
   *  own. The component does not know about anyone else's layout. */
  offset?: number;
  /** Moves focus into the notch. Toasts must never take focus by themselves. */
  hotkey?: string[];
  /** Classes for the content surface, not the fixed wrapper. */
  className?: string;
}

export function Toaster({
  viscosity = 5,
  expand = false,
  offset = 0,
  className,
}: ToasterProps) {
  const reduced = useReducedMotion() ?? false;
  const list = useNotches();
  const current = list[0];
  const content = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContentSize(content);

  /* One motion value, two consumers. The blob and the content both read this,
     so they physically cannot drift apart - there is only one number. Two
     independent animations with identical configs still desync, because they
     start on different frames. */
  const raw = useMotionValue(Y_FROM);
  const y = useSpring(raw, current?.status ? SPRING_GOO : SPRING_RETRACT);

  React.useEffect(() => {
    raw.set(current ? Y_TO : Y_FROM);
  }, [current, raw]);

  /* Content opacity as a pure function of the same shared value, not a second
     animation: 0 below y=8 (still merged with the anchor, nothing legible
     yet), 1 at y=16 (settled). Reusing it on the way out is what makes the
     exit sequence itself - descending back through y=8 already reads as
     invisible well before the droplet finishes re-merging with the anchor,
     with no separate delay or timer needed. */
  const contentOpacity = useTransform(y, [Y_FROM, 8, Y_TO], [0, 0, 1]);

  /* Reduced motion drops the filter entirely rather than tuning it down. A
     full-width SVG filter re-rasterizing every frame is precisely the class of
     thing that setting exists to prevent, and a slower goo is still goo. */
  const filterId = React.useId();
  const sigma = sigmaFor(viscosity);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-100"
      style={{ paddingTop: offset }}
    >
      {!reduced && <GooFilter id={filterId} sigma={sigma} />}

      <AnimatePresence>
        {current && (
          <motion.div
            key="notch"
            initial={false}
            // Gates AnimatePresence's unmount to the full retract, not to
            // when the content reads as gone. Content opacity already hits 0
            // at y=8 via the transform above; this keeps the blob itself
            // on screen for the rest of its rise back into the anchor. Only
            // needed on the animated path - reduced mode never renders the
            // blob, so there is nothing here for it to hold open.
            exit={reduced ? undefined : { opacity: 0 }}
            transition={reduced ? undefined : SPRING_RETRACT}
          >
            {!reduced && (
              <NotchGoo
                y={y}
                width={width}
                height={height}
                radius={RADIUS}
                filterId={filterId}
              />
            )}

            {/* Sibling of the goo layer, never a child. `filter` creates a
                containing block, so anything positioned inside the filtered
                element resolves against it rather than the viewport. */}
            <motion.div
              className="flex justify-center"
              style={reduced ? undefined : { y, opacity: contentOpacity }}
              initial={reduced ? { opacity: 0, y: -2 } : false}
              animate={reduced ? { opacity: 1, y: 0 } : undefined}
              exit={reduced ? { opacity: 0, y: -2 } : undefined}
              transition={reduced ? { duration: 0.15, ease: EASE_OUT } : undefined}
            >
              <motion.div
                ref={content}
                layout
                transition={SPRING_LAYOUT}
                onPointerEnter={pauseTimers}
                onPointerLeave={resumeTimers}
                style={{
                  minWidth: MIN_W,
                  minHeight: MIN_H,
                  borderRadius: RADIUS,
                }}
                className={cn(
                  "pointer-events-auto flex items-center gap-3 px-4 py-3",
                  // Transparent background on purpose: the goo layer paints
                  // the surface. Giving this one a background would draw a
                  // hard-edged pill on top of the liquid one and flatten it.
                  reduced && "border border-border bg-background shadow-subtle",
                  className,
                )}
              >
                <NotchBody record={current} count={list.length} />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Task 6 replaces this wholesale. It exists only so this file has a running
   deliverable to look at. */
function NotchBody({
  record,
  count,
}: {
  record: NotchRecord;
  count: number;
}) {
  return (
    <>
      <span className="text-[15px] font-medium text-foreground">
        {record.title as React.ReactNode}
      </span>
      {count > 1 && (
        <span className="text-[13px] text-text-muted">+{count - 1}</span>
      )}
    </>
  );
}
