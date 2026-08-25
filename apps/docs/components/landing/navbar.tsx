"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ThemeToggle } from "../theme-provider";
import { cn } from "@devignerui/ui/lib/utils";
import { SPRING_PRESS } from "@devignerui/ui/lib/easing";
import { Logo } from "@/components/logo";
import { ArrowRight } from "reicon-react/icons/ArrowRight";

const LINKS = [
  { label: "Components", href: "/components" },
  { label: "Pricing", href: "/#pricing" },
  {
    label: "GitHub",
    href: "https://github.com/devignerui/devignerui",
    external: true,
  },
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Navbar() {
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const rootRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  /* Condense past the fold. An IntersectionObserver on a sentinel costs
     nothing per frame, unlike a scroll listener. */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const io = new IntersectionObserver(
      ([entry]) => setCondensed(!entry.isIntersecting),
      { rootMargin: "-64px 0px 0px 0px" },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);


  /* Magnetic CTA. JS only writes two custom properties; the transition that
     smooths them lives in CSS, so no animation library is needed. */
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || prefersReducedMotion()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const clamp = (min: number, max: number, v: number) =>
      Math.min(max, Math.max(min, v));

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty(
        "--mx",
        `${clamp(-8, 8, (e.clientX - (r.left + r.width / 2)) * 0.4)}px`,
      );
      el.style.setProperty(
        "--my",
        `${clamp(-6, 6, (e.clientY - (r.top + r.height / 2)) * 0.4)}px`,
      );
    };
    const onLeave = () => {
      el.style.setProperty("--mx", "0px");
      el.style.setProperty("--my", "0px");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);


  /* Mobile menu: the reveal is a CSS transition keyed off data-open, so JS
     only owns the scroll lock. */
  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen]);


  /* Escape closes the menu */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const Brand = (
    <Link
      href="/"
      onClick={() => setMenuOpen(false)}
      className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
    >
      <Logo className="h-6 w-auto" />
    </Link>
  );

  return (
    <header ref={rootRef}>
      {/* Sentinel: the observer watches this instead of listening to scroll. */}
      <div ref={sentinelRef} aria-hidden className="absolute top-0 h-px w-px" />
      {/* Floating morphing pill */}
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
        <nav
          aria-label="Primary"
          className={cn(
            "relative flex h-13 w-full items-center justify-between rounded-full border pl-4 pr-2 backdrop-blur-xl",
            "transition-[max-width,background-color,border-color,box-shadow] duration-500 ease-drawer",
            condensed
              ? "max-w-2xl border-border bg-background/70 shadow-elevated"
              : "max-w-4xl border-transparent bg-background/30",
          )}
        >
          {Brand}

          {/* Desktop links */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                {...(l.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="rounded-full px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors duration-200 hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />

            <Link
              ref={ctaRef}
              href="/components"
              className="magnetic group hidden h-9 items-center gap-2 rounded-full bg-foreground pl-4 pr-2 text-[13px] font-medium text-background will-change-transform md:inline-flex"
            >
              Get Started
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-background/15 transition-transform duration-200 ease-drawer group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <ArrowRight className="size-3" />
              </span>
            </Link>

            {/* Hamburger — morphs to X */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              transition={SPRING_PRESS}
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="relative inline-flex size-9 items-center justify-center rounded-full text-foreground transition-colors duration-200 hover:bg-surface md:hidden"
            >
              <span
                className={cn(
                  "absolute h-px w-4 bg-current transition-transform duration-300 ease-drawer",
                  menuOpen ? "rotate-45" : "-translate-y-1",
                )}
              />
              <span
                className={cn(
                  "absolute h-px w-4 bg-current transition-transform duration-300 ease-drawer",
                  menuOpen ? "-rotate-45" : "translate-y-1",
                )}
              />
            </motion.button>
          </div>

          {/* Page progress hairline (visible once condensed) */}
          <span
            aria-hidden
            className={cn(
              "scroll-progress pointer-events-none absolute inset-x-4 bottom-0 h-px rounded-full bg-accent/60 transition-opacity duration-500",
              condensed ? "opacity-100" : "opacity-0",
            )}
          />
        </nav>
      </div>

      {/* Mobile overlay */}
      <div
        data-open={menuOpen}
        id="mobile-menu"
        className="mobile-menu fixed inset-0 z-40 flex-col bg-background/80 px-6 pb-10 pt-24 backdrop-blur-2xl md:hidden"
      >
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              {...(l.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="mobile-link border-b border-border py-5 text-2xl font-semibold tracking-tight text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/components"
          onClick={() => setMenuOpen(false)}
          className="mobile-link mt-8 inline-flex h-13 items-center justify-center gap-2 rounded-full bg-foreground text-[15px] font-medium text-background active:scale-[0.98]"
        >
          Get Started
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </header>
  );
}
