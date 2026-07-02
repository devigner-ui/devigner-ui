"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@devignerui/ui/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Keep in sync with lib/registry.ts (names, slugs, style counts).
// ponytail: hardcoded snapshot instead of importing the registry — importing
// would ship every style's source string to the client for five numbers.
const ITEMS: {
  slug: string;
  name: string;
  styles: string[];
  span?: string;
  preview: React.ReactNode;
}[] = [
  {
    slug: "card",
    name: "Card",
    styles: ["Default", "Glass", "Spotlight"],
    span: "md:col-span-2",
    preview: (
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-background p-3.5 shadow-subtle">
          <div className="text-xs font-semibold text-foreground">Default</div>
          <div className="mt-1 text-[11px] text-text-muted">
            Clean elevation
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-border p-3.5">
          <div className="absolute -top-4 -left-4 size-16 rounded-full bg-accent/25 blur-xl" />
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm" />
          <div className="relative">
            <div className="text-xs font-semibold text-foreground">Glass</div>
            <div className="mt-1 text-[11px] text-text-muted">
              Frosted blur
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-background p-3.5">
          <div className="pointer-events-none absolute -top-6 right-0 size-20 rounded-full bg-accent/20 blur-2xl" />
          <div className="relative">
            <div className="text-xs font-semibold text-foreground">
              Spotlight
            </div>
            <div className="mt-1 text-[11px] text-text-muted">
              Cursor-lit
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    slug: "badge",
    name: "Badge",
    styles: ["Default", "Pill", "Dot"],
    preview: (
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
          Default
        </span>
        <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent/5 px-2.5 py-0.5 text-[11px] font-medium text-accent">
          Pill
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-foreground">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-success" />
          </span>
          Live
        </span>
      </div>
    ),
  },
  {
    slug: "input",
    name: "Input",
    styles: ["Default", "Floating", "Underline"],
    preview: (
      <div className="space-y-2.5">
        <input
          type="text"
          placeholder="Default input"
          tabIndex={-1}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-text-muted"
          readOnly
        />
        <input
          type="text"
          placeholder="Underline input"
          tabIndex={-1}
          className="w-full border-b-2 border-border bg-transparent px-0.5 pb-1.5 text-[13px] text-foreground placeholder:text-text-muted"
          readOnly
        />
      </div>
    ),
  },
  {
    slug: "hero-section",
    name: "Hero Section",
    styles: ["Default", "Gradient", "Parallax"],
    preview: (
      <div className="rounded-xl border border-border bg-background px-4 py-5 text-center">
        <div className="text-sm font-semibold tracking-tight text-foreground">
          Launch faster.
        </div>
        <div className="mt-1 text-[11px] text-text-muted">
          Three hero layouts, one prop API.
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          <span className="inline-flex h-6 items-center rounded-md bg-foreground px-2.5 text-[10px] font-medium text-background">
            Get started
          </span>
          <span className="inline-flex h-6 items-center rounded-md border border-border px-2.5 text-[10px] font-medium text-foreground">
            Docs
          </span>
        </div>
      </div>
    ),
  },
  {
    slug: "button",
    name: "Button",
    styles: ["Default", "Gradient", "Magnetic"],
    preview: (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-9 items-center rounded-lg bg-foreground px-4 text-xs font-medium text-background">
          Default
        </span>
        <span className="inline-flex h-9 items-center rounded-lg bg-linear-to-r from-accent via-accent-secondary to-accent-tertiary px-4 text-xs font-medium text-accent-foreground">
          Gradient
        </span>
        <span className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-xs font-medium text-foreground">
          Magnetic
        </span>
      </div>
    ),
  },
];

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
        <div ref={headerRef} className="max-w-2xl">
          <h2 className="text-3xl font-semibold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl">
            Not variants.
            <br />
            Design languages.
          </h2>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-text-secondary">
            Every component ships complete, swappable implementations. A Card
            can be glass or spotlight, an Input can float or underline; the
            API stays the same.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          {ITEMS.map((item) => (
            <Link
              key={item.slug}
              href={`/components/${item.slug}`}
              className={cn(
                "range-card group glass-card rounded-2xl p-6 transition-[border-color,box-shadow] duration-300 hover:border-border-hover hover:shadow-elevated",
                item.span,
              )}
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-[15px] font-semibold text-foreground">
                  {item.name}
                </span>
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-text-muted transition-colors duration-300 group-hover:text-text-secondary">
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
