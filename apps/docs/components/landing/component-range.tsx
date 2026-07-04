"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@devignerui/ui/lib/utils";
import { COMPONENT_PREVIEWS } from "./component-previews";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Grid-only layout concern — not shared with the hero carousel.
const GRID_SPAN: Partial<Record<string, string>> = {
  card: "md:col-span-2",
};

export function ComponentRange() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  /* Scrub-tied stagger — cards surface as the scroll physically arrives */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(headerRef.current, {
          y: 36,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 90%",
            end: "top 55%",
            scrub: 1,
          },
        });

        gsap.from(".range-card", {
          y: 56,
          opacity: 0,
          filter: "blur(8px)",
          stagger: 0.15,
          ease: "none",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 90%",
            end: "top 35%",
            scrub: 1,
          },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="section-editorial py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <div ref={headerRef} className="max-w-3xl">
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold uppercase leading-[0.98] tracking-[-0.02em] text-foreground">
            Every piece,
            <br />
            <span className="text-accent">several ways.</span>
          </h2>
          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-text-secondary">
            Buttons, cards, inputs, whole sections. Each ships multiple
            complete styles behind one API, so you swap the look without
            touching the markup.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {COMPONENT_PREVIEWS.map((item) => (
            <Link
              key={item.slug}
              href={`/components/${item.slug}`}
              className={cn(
                "range-card group glass-card rounded-2xl p-6 transition-[border-color,box-shadow] duration-300 hover:border-border-hover hover:shadow-elevated",
                GRID_SPAN[item.slug],
              )}
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-[15px] font-semibold text-foreground">
                  {item.name}
                </span>
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
                  {item.styles.length} styles
                </span>
              </div>
              <div className="pointer-events-none min-h-20">{item.preview}</div>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/components"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-foreground transition-colors duration-200"
          >
            Browse the full library
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
    </section>
  );
}
