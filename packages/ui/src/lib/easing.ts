import type { Variants, Transition } from "motion/react";

// Shared motion tokens. Easing curves mirror the CSS custom properties in
// globals.css; springs are the canonical physics used across components.
// Strong custom variants: defaults like `ease-in`/`ease-out` feel weak.

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;
/** Lands a quarter past the target and settles back, a pop with no spring. */
export const EASE_OVERSHOOT = [0, 0, 0, 1.25] as const;

/** Slow off the mark, then a long glide in: a roll with no bounce (the Pill
 *  Menu links, 600ms). */
export const EASE_ROLL = [0.625, 0.05, 0, 1] as const;
/** CSS string form of EASE_ROLL for inline style transitions. */
export const EASE_ROLL_CSS = "cubic-bezier(0.625, 0.05, 0, 1)";

/** Quick out, runs about 10% past the target and settles back (easeOutBack):
 *  a label and its icon rolling over on hover, 450ms (the Flip Button). */
export const EASE_BACK = [0.175, 0.885, 0.32, 1.275] as const;
/** CSS string form of EASE_BACK for inline style transitions. */
export const EASE_BACK_CSS = "cubic-bezier(0.175, 0.885, 0.32, 1.275)";

/** CSS string form of EASE_OUT for inline style transitions. */
export const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

/** A soft ease into a new tint: a link warming to its hover color while it
 *  rolls, a label's letters sharpening, a surface changing theme (the Pill
 *  Menu). Measured off the original, where it is the plain ease-out curve;
 *  `ease-tint` in CSS. */
export const EASE_TINT = [0, 0, 0.58, 1] as const;
/** CSS string form of EASE_TINT for inline style transitions. */
export const EASE_TINT_CSS = "cubic-bezier(0, 0, 0.58, 1)";

/** Press feedback on buttons and other tappable surfaces. */
export const SPRING_PRESS = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6,
} as const;

/** Content swaps, label/icon slots trading places inside a control. */
export const SPRING_SWAP = {
  type: "spring",
  stiffness: 460,
  damping: 30,
  mass: 0.55,
} as const;

/** Overlay panel entrances (modals and sheets summoned by pointer). */
export const SPRING_PANEL = {
  type: "spring",
  stiffness: 420,
  damping: 40,
  mass: 0.5,
} as const;

/** Shared-layout glides, pills, indicators and panels morphing between positions. */
export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 360,
  damping: 32,
  mass: 0.6,
} as const;

/** Cursor-follow physics for decorative mouse tracking (magnetic, tilt, dock). */
export const SPRING_MOUSE = {
  stiffness: 200,
  damping: 15,
  mass: 0.3,
} as const;

/** Liquid/viscous entrances. Heavy on purpose: mass is what reads as liquid.
 *  SPRING_PANEL (mass 0.5) is the nearest existing token and it lands as a
 *  card being dealt, not as something with weight being squeezed through a
 *  membrane. */
export const SPRING_GOO = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 1.1,
} as const;

/** Retracting back into the anchor. Over-damped, so it never bounces: an exit
 *  that wobbles reads as indecision, and nobody is watching the way out. */
export const SPRING_RETRACT = {
  type: "spring",
  stiffness: 300,
  damping: 34,
} as const;

/** An indicator travelling a long way across a row (the current-item mark
 *  sliding between notches). Softer than SPRING_LAYOUT so a far jump reads as
 *  a journey rather than a teleport; critically damped, so it lands without
 *  bouncing. */
export const SPRING_TRAVEL = {
  type: "spring",
  stiffness: 120,
  damping: 22,
  mass: 1,
} as const;

/** A panel unfolding from a bar and the bar's icon turning into a cross
 *  (the Menu Notch). Slightly over-damped, so
 *  it lands without a bounce: half way in 100ms, settled by 400ms. Fitted
 *  frame by frame to the original. */
export const SPRING_PILL = {
  type: "spring",
  stiffness: 320,
  damping: 38,
  mass: 0.8,
} as const;

/** A panel thrown across a canvas: it keeps the speed it was released at and
 *  glides to a stop (the docs Settings panel). Motion's inertia: pass the
 *  release `velocity` (px/s), and a `modifyTarget` that clamps to the canvas
 *  so a hard throw eases into the edge rather than bouncing past it. A
 *  1000px/s flick travels about 350px. */
export const INERTIA_THROW = {
  type: "inertia",
  power: 0.35,
  timeConstant: 320,
  restDelta: 0.5,
} as const;

/** Canvas particle physics, in frame units: each 60fps frame a dot gains
 *  `stiffness` of the distance to its home as velocity, then keeps `damping`
 *  of that velocity (raised to the frame count, so a dropped frame loses the
 *  same energy as the two it replaced). Not a Motion transition: it is read
 *  by hand-written requestAnimationFrame loops (the Image Generation swarm). */
export const SPRING_SWARM = {
  stiffness: 0.05,
  damping: 0.84,
} as const;

/** A canvas lens drifting on its own, in frame units: it cruises at `speed`
 *  of the frame's short side per 60fps frame and turns `steer` of the way
 *  toward its heading each frame, so a new goal bends the path instead of
 *  snapping it (the Image Generation halftone while generating). */
export const SPRING_WANDER = {
  speed: 0.006,
  steer: 0.035,
} as const;

/** Dust drifting inside a fill, in frame units: a mote moves up to `speed`
 *  px per 60fps frame and its glow pulses by `twinkle` radians per frame
 *  (the Stardust Slider). Constant drift, no target, so no spring. */
export const DRIFT_DUST = {
  speed: 0.12,
  twinkle: 0.035,
} as const;

/** Tracking the pointer with a shape (a range band chasing the hovered day).
 *  A tween, not a spring: it follows many targets a second, and momentum
 *  would overshoot each one. Short enough that it never trails the cursor. */
export const TWEEN_FOLLOW = {
  duration: 0.18,
  ease: EASE_OUT,
} as const;

/** The Dynamic Island opening into a view: a slight 1.5% overshoot, settled
 *  in about 0.8s. Also both legs of a view-to-view hop through the rest
 *  pill. Fitted frame by frame to the reference island. */
export const SPRING_ISLAND_OPEN = {
  type: "spring",
  bounce: 0.2,
  duration: 0.8,
} as const;

/** A view that pops open harder, about 5% past its size (the timer, the
 *  ring). */
export const SPRING_ISLAND_POP = {
  type: "spring",
  bounce: 0.3,
  duration: 0.8,
} as const;

/** The island snapping back to its resting pill: about 16% past it and back,
 *  like a drop of liquid pulling in. */
export const SPRING_ISLAND_REST = {
  type: "spring",
  bounce: 0.5,
  duration: 0.8,
} as const;

/** A small part inside the island switching state: the silent pill growing
 *  behind the bell, the bell sliding into it. About 7% past and back in
 *  0.4s. */
export const SPRING_ISLAND_SWITCH = {
  type: "spring",
  bounce: 0.3,
  duration: 0.4,
} as const;

/** A hover highlight stepping between rows (the Command Palette): critically
 *  damped and over in 80ms, so it keeps up with a pointer sweeping a list
 *  and never trails it. */
export const SPRING_HOVER = {
  type: "spring",
  duration: 0.08,
  bounce: 0,
} as const;

/** The hover highlight fading in on a fresh pointer entry, and out again,
 *  quicker, when it leaves. */
export const TWEEN_HOVER_FADE = {
  duration: 0.08,
  ease: EASE_OUT,
} as const;
export const TWEEN_HOVER_OUT = {
  duration: 0.06,
  ease: EASE_OUT,
} as const;

/** The incoming slot of a swap on hover (a label or icon taking over).
 *  EASE_OUT is at full speed on its first frame; a spring starts from rest,
 *  so a pointer sweeping across a row leaves its tiles blank. */
export const TWEEN_SWAP_ENTER = {
  duration: 0.3,
  ease: EASE_OUT,
} as const;

/** One letter of a label coming into focus: it sharpens out of a blur as it
 *  fades in, each letter a beat after the last (the Menu Notch's Menu/Close).
 *  Fitted to the original letter by letter. */
export const TWEEN_LETTER = {
  duration: 0.475,
  ease: EASE_TINT,
} as const;

/** The outgoing slot of a swap (a label or icon making way). Quicker than
 *  TWEEN_SWAP_ENTER bringing the other in, so the overlap stays short. */
export const TWEEN_SWAP_LEAVE = {
  duration: 0.12,
  ease: EASE_OUT,
} as const;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const defaultTransition: Transition = {
  duration: 0.3,
  ease: EASE_OUT,
};

export const springTransition: Transition = SPRING_LAYOUT;

/* ─── GSAP tween vars ─── */
// GSAP takes plain tween vars, not motion transitions, so these stay separate
// from the springs above. Every one carries overwrite: "auto", without it an
// in-flight follow tween reclaims x/y mid-release and the element snaps back.

/** Pointer-follow pull. Short, so the release always wins the handoff. */
export const GSAP_MAGNET = {
  duration: 0.4,
  ease: "power2.out",
  overwrite: "auto",
} as const;

/** Release back to rest, overshoots once, the way a magnet lets go. */
export const GSAP_MAGNET_RELEASE = {
  duration: 0.7,
  ease: "elastic.out(1, 0.4)",
  overwrite: "auto",
} as const;

/* ─── GSAP eases for Motion ─── */
// GSAP's own ease math, ported line for line from gsap-core, so a Motion
// tween traces exactly the curve of its GSAP twin. No overwrite needed:
// animating a motion value stops whatever tween it was already running.

/** GSAP's elastic.out(amplitude, period). */
function elasticOut(amplitude: number, period: number) {
  const p1 = amplitude >= 1 ? amplitude : 1;
  let p2 = period / (amplitude < 1 ? amplitude : 1);
  const p3 = (p2 / (2 * Math.PI)) * (Math.asin(1 / p1) || 0);
  p2 = (2 * Math.PI) / p2;
  return (p: number) =>
    p === 1 ? 1 : p1 * 2 ** (-10 * p) * Math.sin((p - p3) * p2) + 1;
}

/** GSAP's power2.out, which is a cubic. */
export const EASE_POWER2_OUT = (p: number) => 1 - (1 - p) ** 3;
/** GSAP's elastic.out(1, 0.4). */
export const EASE_ELASTIC_OUT = elasticOut(1, 0.4);

/** GSAP_MAGNET as a Motion tween. */
export const TWEEN_MAGNET = {
  duration: 0.4,
  ease: EASE_POWER2_OUT,
} as const;

/** GSAP_MAGNET_RELEASE as a Motion tween. */
export const TWEEN_MAGNET_RELEASE = {
  duration: 0.7,
  ease: EASE_ELASTIC_OUT,
} as const;

/** GSAP's elastic.out(1.2, 1): the period spans the whole tween, so it
 *  overshoots once by about 12% and eases back without a second wobble. */
export const EASE_ELASTIC_FLICK = elasticOut(1.2, 1);

/** Cards dealt into their new places after a flick (the Flick Cards Slider):
 *  past the mark at about 170ms, settled by 400ms. Measured frame by frame. */
export const TWEEN_FLICK = {
  duration: 0.6,
  ease: EASE_ELASTIC_FLICK,
} as const;

/** A card dimming as it leaves the front, and its button going with it. */
export const TWEEN_FLICK_FADE = {
  duration: 0.2,
  ease: EASE_POWER2_OUT,
} as const;

/** The front card's button arriving, slower than the cards so it lands last. */
export const TWEEN_FLICK_REVEAL = {
  duration: 0.7,
  ease: EASE_POWER2_OUT,
} as const;

/** A CSS linear() curve as points of [progress, time], straight lines between
 *  them, for Motion's JS animations. */
function linearEase(points: readonly (readonly [number, number])[]) {
  return (t: number) => {
    for (let i = 1; i < points.length; i++) {
      const [v1, t1] = points[i];
      if (t <= t1) {
        const [v0, t0] = points[i - 1];
        return t1 === t0 ? v1 : v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
      }
    }
    return 1;
  };
}

/** A sampled spring, its swing cut to 60%: past the mark by 14%, about 12%
 *  over at 22%, a dip to 98% and settled by 1s. */
const GLASS_POINTS = [
  [0, 0],
  [0.01, 0.009],
  [0.037, 0.018],
  [0.148, 0.038],
  [0.762, 0.11],
  [0.985, 0.142],
  [1.037, 0.157],
  [1.075, 0.173],
  [1.1, 0.189],
  [1.115, 0.205],
  [1.119, 0.225],
  [1.111, 0.248],
  [1.007, 0.357],
  [0.987, 0.39],
  [0.978, 0.424],
  [0.978, 0.47],
  [0.998, 0.577],
  [1.004, 0.64],
  [1, 1],
] as const;

/** The Liquid Glass menu swelling from its pill into the panel and melting
 *  back: a gently bouncy 1s spring, sampled. */
export const EASE_GLASS = linearEase(GLASS_POINTS);
/** CSS string form of EASE_GLASS for inline style transitions. */
export const EASE_GLASS_CSS = `linear(${GLASS_POINTS.map(([v, t]) => `${v} ${+(t * 100).toFixed(1)}%`).join(", ")})`;
export const TWEEN_GLASS = { duration: 1, ease: EASE_GLASS } as const;

/** EASE_GLASS with its swing halved again: about 6% over and a dip to 99%,
 *  the same start and the same 1s. */
const GLASS_SOFT_POINTS = GLASS_POINTS.map(
  ([v, t], i) =>
    [i > 5 && t < 1 ? +(1 + (v - 1) / 2).toFixed(4) : v, t] as const,
);
/** The Morphing Popover opening into its panel and closing back. */
export const EASE_GLASS_SOFT = linearEase(GLASS_SOFT_POINTS);
export const TWEEN_GLASS_SOFT = { duration: 1, ease: EASE_GLASS_SOFT } as const;
