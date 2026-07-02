"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { cn } from "@devignerui/ui/lib/utils";
import { Starburst } from "./starburst";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

// Spring-like eases — registered once, referenced by name in tweens.
if (typeof window !== "undefined") {
  CustomEase.create("hero-out", "0.16,1,0.3,1");
  CustomEase.create("hero-spring", "0.34,1.56,0.64,1");
}

type StyleSlug = "default" | "gradient" | "magnetic";

// Mirrors the real registry styles for `button` (lib/registry.ts).
const STYLES: {
  slug: StyleSlug;
  name: string;
  label: string;
  btnClass: string;
  glowClass: string;
}[] = [
  {
    slug: "default",
    name: "Default",
    label: "Get started",
    btnClass: "bg-foreground text-background hover:bg-foreground/90",
    glowClass: "bg-foreground/10",
  },
  {
    slug: "gradient",
    name: "Gradient",
    label: "Get started",
    btnClass:
      "bg-linear-to-r from-accent via-accent-secondary to-accent-tertiary text-accent-foreground shadow-lg shadow-accent/30",
    glowClass: "bg-accent/40",
  },
  {
    slug: "magnetic",
    name: "Magnetic",
    label: "Hover me",
    btnClass: "bg-foreground text-background",
    glowClass: "bg-accent/30",
  },
];

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Hero() {
  const [active, setActive] = useState<StyleSlug>("default");
  const [copied, setCopied] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const copyColRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const burstRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const demoBtnRef = useRef<HTMLButtonElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const styleTokenRef = useRef<HTMLSpanElement>(null);
  const glowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const switchTl = useRef<gsap.core.Timeline | null>(null);
  const firstIndicatorRun = useRef(true);
  // setActive fires mid-timeline, so `active` lags clicks — guard on the
  // requested target instead or rapid switches get swallowed.
  const targetStyle = useRef<StyleSlug>("default");

  const activeStyle = STYLES.find((s) => s.slug === active)!;
  const command = `npx devignerui add button --style ${active}`;

  /* Entrance reveal + scroll-scrubbed exit */
  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const words =
          headlineRef.current?.querySelectorAll<HTMLElement>("[data-word]");

        gsap
          .timeline({ defaults: { ease: "hero-out" } })
          .from(stageRef.current, {
            y: 48,
            opacity: 0,
            scale: 0.97,
            filter: "blur(10px)",
            duration: 0.9,
            clearProps: "filter",
          })
          // Headline words rise out of a clip mask — editorial reveal.
          .from(
            words ?? [],
            {
              yPercent: 120,
              duration: 0.9,
              stagger: 0.08,
            },
            0.1,
          )
          .from(
            copyColRef.current!.querySelectorAll("[data-fade]"),
            {
              y: 24,
              opacity: 0,
              filter: "blur(6px)",
              duration: 0.7,
              stagger: 0.1,
              clearProps: "filter",
            },
            0.35,
          )
          // Brand glyph spins in once with the headline, then rests.
          .from(
            burstRef.current,
            { rotation: -160, scale: 0.4, opacity: 0, duration: 0.9 },
            0.5,
          );

        // Exit tracks physical scroll, not a clock.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
            defaults: { ease: "none" },
          })
          .to(stageRef.current, { y: -90, scale: 0.96, opacity: 0.35 }, 0)
          .to(copyColRef.current, { y: -50, opacity: 0.3 }, 0);
      });
    },
    { scope: sectionRef },
  );

  /* Segmented-control indicator — springs to the active tab */
  useGSAP(
    () => {
      const list = tablistRef.current;
      const indicator = indicatorRef.current;
      if (!list || !indicator) return;

      const place = (animate: boolean) => {
        const tab = list.querySelector<HTMLElement>(`[data-slug="${active}"]`);
        if (!tab) return;
        const vars = { x: tab.offsetLeft, width: tab.offsetWidth };
        if (!animate || prefersReducedMotion()) {
          gsap.set(indicator, vars);
        } else {
          gsap.to(indicator, {
            ...vars,
            duration: 0.5,
            ease: "hero-spring",
            overwrite: "auto",
          });
        }
      };

      place(!firstIndicatorRun.current);
      firstIndicatorRun.current = false;

      const onResize = () => place(false);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    },
    { scope: sectionRef, dependencies: [active] },
  );

  /* Magnetic style — the button physically follows the cursor */
  useEffect(() => {
    if (active !== "magnetic") return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const canvas = canvasRef.current;
    const btn = demoBtnRef.current;
    if (!canvas || !btn) return;

    const xTo = gsap.quickTo(btn, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.35, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const relX = e.clientX - (r.left + r.width / 2);
      const relY = e.clientY - (r.top + r.height / 2);
      xTo(gsap.utils.clamp(-44, 44, relX * 0.28));
      yTo(gsap.utils.clamp(-26, 26, relY * 0.28));
    };
    const onLeave = () => {
      // Momentum release — snaps home with spring physics, not a fixed tween.
      gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(btn, "x,y");
      gsap.set(btn, { x: 0, y: 0 });
    };
  }, [active]);

  /* Style switch — blur-masked transform with a spring settle */
  const switchStyle = contextSafe((next: StyleSlug) => {
    if (next === targetStyle.current) return;
    targetStyle.current = next;
    if (prefersReducedMotion()) {
      setActive(next);
      return;
    }
    const btn = demoBtnRef.current;
    if (!btn) {
      setActive(next);
      return;
    }

    switchTl.current?.kill();
    const glows = STYLES.map((s) => glowRefs.current[s.slug]).filter(Boolean);

    switchTl.current = gsap
      .timeline()
      .to(btn, {
        scale: 0.9,
        filter: "blur(6px)",
        opacity: 0.5,
        duration: 0.14,
        ease: "power2.out",
      })
      .add(() => setActive(next))
      .to(
        glows,
        {
          opacity: (i) => (STYLES[i].slug === next ? 1 : 0),
          duration: 0.6,
          ease: "hero-out",
        },
        "<",
      )
      .add(() => {
        if (styleTokenRef.current) {
          gsap.fromTo(
            styleTokenRef.current,
            { y: 6, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.3, ease: "hero-out" },
          );
        }
      })
      .to(btn, {
        scale: 1,
        filter: "blur(0px)",
        opacity: 1,
        duration: 0.45,
        ease: "hero-spring",
        clearProps: "filter",
      });
  });

  /* Press feedback on the demo button (gsap owns transform, so no CSS :active) */
  const pressDown = contextSafe(() => {
    if (prefersReducedMotion()) return;
    gsap.to(demoBtnRef.current, {
      scale: 0.96,
      duration: 0.12,
      ease: "power2.out",
    });
  });
  const pressUp = contextSafe(() => {
    if (prefersReducedMotion()) return;
    gsap.to(demoBtnRef.current, {
      scale: 1,
      duration: 0.35,
      ease: "hero-spring",
    });
  });

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — leave the command selectable */
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100dvh] items-center overflow-hidden"
    >
      <div className="absolute inset-0 mesh-gradient" />
      <div className="pointer-events-none absolute top-[12%] left-[6%] size-125 rounded-full bg-accent/6 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-[6%] right-[6%] size-100 rounded-full bg-accent/4 blur-[130px]" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pt-24 pb-16 sm:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* The demo IS the hero — live style switcher */}
          <div ref={stageRef} className="double-bezel lg:order-2">
            <div className="double-bezel-inner overflow-hidden">
              {/* Stage header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-semibold text-foreground">
                    Button
                  </span>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
                    3 styles
                  </span>
                </div>
                <Link
                  href="/components/button"
                  className="text-[12px] font-medium text-text-muted hover:text-foreground transition-colors duration-200"
                >
                  View docs
                </Link>
              </div>

              {/* Canvas */}
              <div
                ref={canvasRef}
                id="hero-style-canvas"
                role="tabpanel"
                aria-label={`${activeStyle.name} button preview`}
                className="relative flex h-60 items-center justify-center sm:h-72 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px]"
              >
                {STYLES.map((s) => (
                  <div
                    key={s.slug}
                    ref={(el) => {
                      glowRefs.current[s.slug] = el;
                    }}
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute size-44 rounded-full blur-3xl",
                      s.glowClass,
                      s.slug === "default" ? "opacity-100" : "opacity-0",
                    )}
                  />
                ))}
                <button
                  ref={demoBtnRef}
                  type="button"
                  onPointerDown={pressDown}
                  onPointerUp={pressUp}
                  onPointerCancel={pressUp}
                  className={cn(
                    "relative inline-flex h-12 cursor-pointer select-none items-center justify-center rounded-xl px-8 text-sm font-medium will-change-transform",
                    "transition-[background-color,box-shadow] duration-200",
                    activeStyle.btnClass,
                  )}
                >
                  {activeStyle.label}
                </button>
              </div>

              {/* Style switcher */}
              <div className="flex justify-center border-t border-border px-5 py-4">
                <div
                  ref={tablistRef}
                  role="tablist"
                  aria-label="Button style"
                  className="relative inline-flex items-center rounded-full border border-border bg-surface p-1"
                >
                  <span
                    ref={indicatorRef}
                    aria-hidden
                    className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-16 rounded-full border border-border bg-background shadow-subtle"
                  />
                  {STYLES.map((s) => (
                    <button
                      key={s.slug}
                      type="button"
                      role="tab"
                      data-slug={s.slug}
                      aria-selected={active === s.slug}
                      aria-controls="hero-style-canvas"
                      onClick={() => switchStyle(s.slug)}
                      className={cn(
                        "relative z-10 cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors duration-200",
                        active === s.slug
                          ? "text-foreground"
                          : "text-text-muted hover:text-text-secondary",
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Copy + CTA */}
          <div ref={copyColRef} className="lg:order-1">
            <div
              data-fade
              className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted"
            >
              <Starburst className="size-3 text-accent" />
              Copy-paste · React · Tailwind
            </div>

            <h1
              ref={headlineRef}
              className="mt-6 font-display text-[clamp(2.75rem,6.5vw,5.25rem)] font-semibold uppercase leading-[0.92] tracking-[-0.02em] text-foreground"
            >
              <span className="block overflow-hidden pb-[0.08em]">
                <span data-word className="inline-block text-text-tertiary">
                  One
                </span>{" "}
                <span data-word className="inline-block">
                  component
                </span>
              </span>
              <span className="flex items-center gap-3 overflow-hidden pb-[0.08em]">
                <span data-word className="inline-block text-text-tertiary">
                  Every
                </span>
                <span data-word className="inline-block text-accent">
                  style
                </span>
                <Starburst
                  ref={burstRef}
                  className="size-[0.7em] shrink-0 text-accent"
                />
              </span>
            </h1>

            <p
              data-fade
              className="mt-7 max-w-md text-base/relaxed text-text-secondary sm:text-lg"
            >
              Copy-paste React components that ship multiple visual styles each.
              Pick one, install it, own the code.
            </p>

            <div data-fade className="mt-9 flex flex-col gap-4">
              {/* Primary CTA: the install command, live-bound to the switcher */}
              <div className="flex h-13 max-w-lg items-center gap-3 overflow-x-auto rounded-2xl border border-border bg-background-200/70 pl-5 pr-2 font-mono text-[13px] whitespace-nowrap">
                <span className="select-none text-accent">$</span>
                <code className="text-text-secondary">
                  npx devignerui add button{" "}
                  <span className="text-text-muted">--style</span>{" "}
                  <span
                    ref={styleTokenRef}
                    className="inline-block font-semibold text-accent"
                  >
                    {active}
                  </span>
                </code>
                <button
                  type="button"
                  onClick={copyCommand}
                  aria-label={copied ? "Copied" : "Copy install command"}
                  className="ml-auto inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-foreground px-3.5 font-sans text-[12px] font-medium text-background transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
                >
                  {copied ? (
                    <svg
                      className="size-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="size-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.8"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                      />
                    </svg>
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <Link
                href="/components"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:text-foreground"
              >
                Browse all components
                <svg
                  className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
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
          </div>
        </div>
      </div>
    </section>
  );
}
