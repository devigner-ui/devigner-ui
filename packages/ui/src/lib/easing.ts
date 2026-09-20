import type { Variants, Transition } from "motion/react";

// Shared motion tokens. Easing curves mirror the CSS custom properties in
// globals.css; springs are the canonical physics used across components.
// Strong custom variants: defaults like `ease-in`/`ease-out` feel weak.

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

/** CSS string form of EASE_OUT for inline style transitions. */
export const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

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

/** The droplet's descent through the viewport edge. Heavy on purpose: mass is
 *  what reads as liquid. SPRING_PANEL (mass 0.5) is the nearest existing
 *  token and it lands as a card being dealt, not as something with weight
 *  being squeezed through a membrane. */
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

