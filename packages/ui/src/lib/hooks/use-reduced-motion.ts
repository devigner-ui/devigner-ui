"use client";

import { useContext, useSyncExternalStore } from "react";
import { MotionConfigContext } from "motion/react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Missing in jsdom and some embedded browsers; treated as "no preference". */
const media = () =>
  typeof window.matchMedia === "function" ? window.matchMedia(QUERY) : null;

const subscribe = (onChange: () => void) => {
  const mq = media();
  if (!mq) return () => {};
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/** True when the OS asks for reduced motion, or an ancestor
 *  `<MotionConfig reducedMotion="always">` does. Motion's own
 *  useReducedMotionConfig can't be used alone: the default context is
 *  "never", so without a wrapper it would ignore the OS setting.
 *
 *  The OS setting is read through useSyncExternalStore with a server snapshot
 *  of false, so hydration renders what the server rendered and only then
 *  switches. Motion's useReducedMotion reads it during the first client
 *  render, which mismatched server HTML whenever reduced motion was on. */
export function useReducedMotionPreference() {
  const system = useSyncExternalStore(
    subscribe,
    () => media()?.matches ?? false,
    () => false,
  );
  const { reducedMotion } = useContext(MotionConfigContext);
  return reducedMotion === "always" || system;
}
