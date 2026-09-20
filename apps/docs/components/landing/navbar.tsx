"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "motion/react";
import { ThemeToggle } from "../theme-provider";
import { lenisRef } from "./smooth-scroll";
import { cn } from "cn";
import { SPRING_PRESS } from "@devignerui/ui/lib/easing";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
  const overlayRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  /* Scroll morph (condense) + page-progress hairline - both scroll-native */
  useGSAP(
    () => {
      const st = ScrollTrigger.create({
        start: 64,
        onEnter: () => setCondensed(true),
        onLeaveBack: () => setCondensed(false),
      });

      const progress = gsap.to(progressRef.current, {
        scaleX: 1,
        transformOrigin: "left center",
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.4 },
      });

      return () => {
        st.kill();
        progress.scrollTrigger?.kill();
      };
    },
    { scope: rootRef },
  );

  /* Magnetic CTA - same physics identity as the hero's magnetic button */
  useGSAP(
    () => {
      const el = ctaRef.current;
      if (!el || prefersReducedMotion()) return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
        return;

      const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        xTo(
          gsap.utils.clamp(-8, 8, (e.clientX - (r.left + r.width / 2)) * 0.4),
        );
        yTo(
          gsap.utils.clamp(-6, 6, (e.clientY - (r.top + r.height / 2)) * 0.4),
        );
      };
      const onLeave = () =>
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.5)" });

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: rootRef },
  );

  /* Mobile menu - full-screen glass overlay, staggered reveal, scroll-locked */
  useGSAP(
    () => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      const reduce = prefersReducedMotion();

      if (menuOpen) {
        lenisRef.current?.stop();
        gsap.set(overlay, { display: "flex" });
        if (reduce) {
          gsap.set(overlay, { autoAlpha: 1 });
          gsap.set(".mobile-link", { autoAlpha: 1, y: 0 });
        } else {
          gsap
            .timeline()
            .fromTo(
              overlay,
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.3, ease: "power2.out" },
            )
            .fromTo(
              ".mobile-link",
              { y: 24, autoAlpha: 0 },
              {
                y: 0,
                autoAlpha: 1,
                duration: 0.5,
                stagger: 0.06,
                ease: "power3.out",
              },
              0.08,
            );
        }
      } else {
        lenisRef.current?.start();
        gsap.to(overlay, {
          autoAlpha: 0,
          duration: reduce ? 0 : 0.25,
          ease: "power2.in",
          onComplete: () => gsap.set(overlay, { display: "none" }),
        });
      }
    },
    { dependencies: [menuOpen], scope: rootRef },
  );

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
      <span className="flex size-6 items-center justify-center rounded-lg bg-foreground text-[11px] font-bold text-background">
        D
      </span>
      <span className="text-sm">Devigner</span>
    </Link>
  );

  return (
    <header ref={rootRef}>
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
              className="group hidden h-9 items-center gap-2 rounded-full bg-foreground pl-4 pr-2 text-[13px] font-medium text-background will-change-transform md:inline-flex"
            >
              Get Started
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-background/15 transition-transform duration-200 ease-drawer group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <svg
                  className="size-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </Link>

            {/* Hamburger - morphs to X */}
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
              "pointer-events-none absolute inset-x-4 bottom-0 h-px origin-left scale-x-0 rounded-full bg-accent/60 transition-opacity duration-500",
              condensed ? "opacity-100" : "opacity-0",
            )}
            ref={progressRef}
          />
        </nav>
      </div>

      {/* Mobile overlay */}
      <div
        ref={overlayRef}
        id="mobile-menu"
        className="fixed inset-0 z-40 hidden flex-col bg-background/80 px-6 pb-10 pt-24 backdrop-blur-2xl md:hidden"
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
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}
