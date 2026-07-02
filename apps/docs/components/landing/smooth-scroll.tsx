"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Live Lenis instance, so components like the nav can lock scroll (menus). */
export const lenisRef: { current: Lenis | null } = { current: null };

/**
 * Replaces native scroll with Lenis, driven by GSAP's ticker so
 * ScrollTrigger and smooth scroll share one clock (no double-RAF drift).
 * Under prefers-reduced-motion Lenis never initializes — native scroll,
 * no smoothing, ScrollTriggers still fire at their end states.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: false, anchors: true });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return null;
}
