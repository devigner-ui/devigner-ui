"use client";

import { useContext } from "react";
import { MotionConfigContext, useReducedMotion } from "motion/react";

/** True when the OS asks for reduced motion, or an ancestor
 *  `<MotionConfig reducedMotion="always">` does. Motion's own
 *  useReducedMotionConfig can't be used alone: the default context is
 *  "never", so without a wrapper it would ignore the OS setting. */
export function useReducedMotionPreference() {
  const system = useReducedMotion();
  const { reducedMotion } = useContext(MotionConfigContext);
  return reducedMotion === "always" || !!system;
}
