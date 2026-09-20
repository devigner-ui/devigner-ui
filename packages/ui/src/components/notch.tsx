"use client";

import * as React from "react";
import { motion, type MotionValue } from "motion/react";

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
