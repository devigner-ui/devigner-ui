"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { IconArrowRight } from "@devigner-ui/icons";
import { cn } from "cn";
import { EASE_DRAWER, SPRING_LAYOUT } from "devignerui/motion";
import { ThemeToggle } from "../theme-provider";
import { WORDMARK_SMALL } from "./wordmark-glyphs";

// Tracking in em units: letter-spacing lands after every letter, so each
// advance carries it.
const SMALL_TRACK = -45;
const SMALL_WIDTH = WORDMARK_SMALL.reduce((x, g) => x + g.w + SMALL_TRACK, 0);

/** "devigner." as outlines of the logo face, the period in cobalt. Sized by
 *  font-size (1em tall), so `text-[19px]` still scales it. */
export function Wordmark({ className }: { className?: string }) {
  let x = 0;
  return (
    <svg
      aria-hidden
      viewBox={`0 -830 ${SMALL_WIDTH} 1000`}
      style={{ width: `${SMALL_WIDTH / 1000}em` }}
      className={cn("h-[1em] overflow-visible fill-current align-[-0.17em] text-[21px] text-foreground", className)}
    >
      {WORDMARK_SMALL.map((g, i) => {
        const at = x;
        x += g.w + SMALL_TRACK;
        return (
          <path
            key={i}
            d={g.d}
            transform={`translate(${at} 0)`}
            className={i === WORDMARK_SMALL.length - 1 ? "fill-brand" : undefined}
          />
        );
      })}
    </svg>
  );
}

/** `autoHide` slides the bar away while scrolling down and brings it back on
 *  the first scroll up. It mirrors that onto `<html data-nav-hidden>`, so
 *  anything sticky underneath (the catalog's filter bar) can follow it. */
export function Navbar({ autoHide = false }: { autoHide?: boolean }) {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Where the current scroll direction began. Distance is measured from here
  // rather than per frame: smooth scrolling and trackpads move a pixel or two
  // a frame, which a per-frame threshold would never see.
  const anchor = useRef(0);

  // State flips only when a line is crossed, not on every scroll frame.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    if (y > 24 !== scrolled) setScrolled(y > 24);
    if (!autoHide) return;
    const prev = scrollY.getPrevious() ?? y;
    const down = y > prev;
    // Direction flipped: start measuring again from the turn.
    if (down !== anchor.current < prev) anchor.current = prev;
    const next =
      y < 120 ? false : y - anchor.current > 12 ? true : anchor.current - y > 12 ? false : hidden;
    if (next !== hidden) setHidden(next);
  });

  useEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute("data-nav-hidden", hidden);
    return () => root.removeAttribute("data-nav-hidden");
  }, [hidden]);

  const layoutTransition = reduce ? { duration: 0 } : SPRING_LAYOUT;

  return (
    <motion.header
      initial={false}
      animate={{ y: hidden ? "-120%" : 0 }}
      transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE_DRAWER }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className={cn("flex justify-center", scrolled ? "px-3 pt-3" : "px-0 pt-0")}>
        {/* At the top: edge to edge, no bar. Scrolled: a centred pill sized
            to its content. One element, so the change is a layout glide. */}
        <motion.nav
          layout
          aria-label="Primary"
          transition={layoutTransition}
          style={{ borderRadius: scrolled ? 9999 : 0 }}
          className={cn(
            "flex items-center justify-between",
            scrolled
              ? "h-14 w-auto gap-6 border border-border bg-background/65 pr-2 pl-5 shadow-subtle backdrop-blur-xl"
              : "h-18 w-full max-w-7xl gap-6 border border-transparent px-5",
          )}
        >
          <motion.div layout="position" transition={layoutTransition}>
            <Link href="/" aria-label="Devigner UI home" className="block rounded-lg">
              <Wordmark />
            </Link>
          </motion.div>

          <motion.div layout="position" transition={layoutTransition} className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/components"
              className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-foreground pr-3.5 pl-4.5 text-[14px] font-medium whitespace-nowrap text-background transition-transform duration-200 ease-out active:scale-[0.97]"
            >
              Components
              <IconArrowRight
                aria-hidden
                className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
              />
            </Link>
          </motion.div>
        </motion.nav>
      </div>
    </motion.header>
  );
}
