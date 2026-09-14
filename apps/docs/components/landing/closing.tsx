"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Starburst } from "./starburst";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* Circular rotating badge with the burst at its core - the portfolio's seal */
function RotatingSeal() {
  return (
    <div className="relative size-32 sm:size-36">
      <svg
        viewBox="0 0 120 120"
        className="size-full animate-[spin_22s_linear_infinite] text-text-muted"
        aria-hidden
      >
        <defs>
          <path
            id="seal-path"
            fill="none"
            d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0"
          />
        </defs>
        <text
          className="fill-current font-mono uppercase"
          style={{ fontSize: "8.6px", letterSpacing: "0.24em" }}
        >
          <textPath href="#seal-path">
            Start building • Own your code •
          </textPath>
        </text>
      </svg>
      <Starburst className="absolute inset-0 m-auto size-7 text-accent" />
    </div>
  );
}

export function ClosingCTA() {
  return (
    <section className="section-editorial relative overflow-hidden py-32 sm:py-44">
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/6 blur-[150px]" />
      <div className="relative mx-auto max-w-5xl px-5 text-center">
        <div className="mb-10 flex justify-center">
          <RotatingSeal />
        </div>
        <h2 className="font-display text-[clamp(2.75rem,9vw,6.5rem)] font-semibold uppercase leading-[0.88] tracking-[-0.03em] text-foreground">
          Start building
          <br />
          <span className="text-accent">today.</span>
        </h2>
        <p className="mx-auto mt-8 max-w-md text-[15px] leading-relaxed text-text-secondary sm:text-base">
          Free for open source, premium components for production. Ship your
          next interface in minutes.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/components"
            className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-foreground pl-7 pr-3 text-sm font-medium text-background transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            Get started free
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-background/15 transition-transform duration-200 ease-drawer group-hover:translate-x-0.5">
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
          <a
            href="#pricing"
            className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background/50 px-7 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface"
          >
            View pricing
          </a>
        </div>
      </div>
    </section>
  );
}

const FOOTER_COLS: {
  title: string;
  links: { label: string; href: string }[];
}[] = [
  {
    title: "Product",
    links: [
      { label: "Components", href: "/components" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Docs", href: "/docs" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "GitHub", href: "https://github.com/devignerui/devignerui" },
      { label: "Changelog", href: "/docs" },
      { label: "License (MIT)", href: "/docs" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Twitter", href: "https://twitter.com/devignerui" },
      { label: "Portfolio", href: "https://remidevigner.pro" },
    ],
  },
];

const WORDMARK = "DEVIGNER";

export function SiteFooter() {
  const ref = useRef<HTMLElement>(null);

  /* The oversized wordmark rises letter-by-letter when scrolled into view */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".footer-letter", {
          yPercent: 130,
          duration: 0.8,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: { trigger: ".footer-word", start: "top 92%" },
        });
      });
    },
    { scope: ref },
  );

  return (
    <footer ref={ref} className="overflow-hidden border-t border-border">
      <div className="mx-auto max-w-7xl px-5 pt-16 sm:pt-20">
        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 pb-16 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-foreground text-[11px] font-bold text-background">
                D
              </span>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Devigner
              </span>
            </div>
            <p className="mt-4 max-w-[16rem] text-[13px] leading-relaxed text-text-muted">
              Copy-paste React components, ready to own.
            </p>
          </div>
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
                {col.title}
              </div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-text-secondary transition-colors duration-200 hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Oversized wordmark reveal */}
        <div className="footer-word flex justify-between" aria-hidden>
          {WORDMARK.split("").map((c, i) => (
            <span
              key={i}
              className="footer-letter inline-block font-display text-[clamp(2.5rem,15vw,12rem)] font-semibold leading-[0.82] tracking-[-0.04em] text-foreground"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border py-6 text-[12px] text-text-muted sm:flex-row">
          <span>© 2026 Devigner UI. MIT licensed.</span>
          <span className="flex items-center gap-1.5">
            <Starburst className="size-2.5 text-accent" />
            Built with GSAP + Lenis
          </span>
        </div>
      </div>
    </footer>
  );
}
