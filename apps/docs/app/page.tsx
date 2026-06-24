"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { Button } from "@devignerui/ui";
import { ThemeToggle } from "../components/theme-provider";
import { cn } from "@devignerui/ui/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ─── Shared animated wrapper ─── */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Floating Pill Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4">
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className={`nav-pill flex h-12 w-full max-w-3xl items-center justify-between rounded-full backdrop-blur-xs px-4 transition-all duration-500 ${
          scrolled
            ? "bg-background/80 border border-border shadow-elevated"
            : "bg-background/60 border border-transparent"
        }`}
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground tracking-tight"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-foreground text-[11px] font-bold text-background">
            D
          </span>
          <span className="text-sm">Devigner</span>
        </Link>

        <div className="flex items-center gap-0.5">
          <Link
            href="/components"
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors duration-200"
          >
            Components
          </Link>
          <a
            href="#pricing"
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors duration-200"
          >
            Pricing
          </a>
          <a
            href="https://github.com/devignerui/devignerui"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors duration-200"
          >
            GitHub
          </a>
          <div className="mx-1.5 h-4 w-px bg-border" />
          <ThemeToggle />
          <Link
            href="/components"
            className="ml-1.5 inline-flex h-8 items-center justify-center rounded-full bg-foreground px-4 text-[13px] font-medium text-background hover:opacity-90 active:scale-[0.98] transition-all duration-200"
          >
            Get Started
          </Link>
        </div>
      </motion.nav>
    </div>
  );
}

/* ─── Hero ─── */
function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const previewY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const previewRotate = useTransform(scrollYProgress, [0, 1], [0, -2]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100dvh] flex items-center overflow-hidden"
    >
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] rounded-full bg-accent/[0.04] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-purple-500/[0.03] blur-[120px] pointer-events-none" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
          {/* Left: Massive editorial typography */}
          <div>
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1 text-[11px] font-medium text-text-secondary">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                v0.1.0 — Now in Alpha
              </span>
            </motion.div>

            <motion.h1
              initial={
                reduce ? false : { opacity: 0, y: 30, filter: "blur(8px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
              className="mt-8 text-[clamp(2.8rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground"
            >
              Ship UI
              <br />
              that <span className="text-gradient italic">sells.</span>
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
              className="mt-7 max-w-md text-base leading-relaxed text-text-secondary sm:text-lg"
            >
              React components with multiple design styles per component. Not
              prop variants — complete style alternatives. Ship premium
              interfaces in minutes.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18, ease: EASE }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/components"
                className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-foreground px-7 text-sm font-medium text-background hover:opacity-90 active:scale-[0.98] transition-all duration-200"
              >
                Browse Components
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/10 transition-transform duration-200 group-hover:translate-x-0.5">
                  <svg
                    className="h-3 w-3"
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
                className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background/50 px-7 text-sm font-medium text-foreground hover:bg-surface transition-colors duration-200"
              >
                View Pricing
              </a>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-8 flex items-center gap-5 text-[13px] text-text-muted"
            >
              {["MIT License", "TypeScript", "Tailwind v4"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <svg
                    className="h-3.5 w-3.5 text-success"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: Layered component stack with depth */}
          <motion.div
            initial={
              reduce ? false : { opacity: 0, x: 30, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="relative perspective-depth hidden lg:block"
          >
            <motion.div
              style={{ y: previewY, rotateX: previewRotate }}
              className="relative"
            >
              {/* Background card (furthest back) */}
              <div className="absolute -top-4 -right-4 w-[340px] h-[220px] rounded-2xl border border-border bg-surface/40 opacity-40" />

              {/* Middle card */}
              <div className="absolute -top-2 -right-2 w-[360px] h-[240px] rounded-2xl border border-border bg-surface/60 opacity-70" />

              {/* Front card: Terminal + live preview */}
              <div className="double-bezel relative ml-8">
                <div className="double-bezel-inner p-6">
                  {/* Terminal header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                    <span className="ml-2 text-[11px] font-mono text-text-muted">
                      terminal
                    </span>
                  </div>

                  {/* Command output */}
                  <div className="font-mono text-[12px] leading-6">
                    <div className="text-text-muted">
                      <span className="text-success">$</span> npx devignerui add
                      button --style magnetic
                    </div>
                    <div className="mt-1 text-text-muted">
                      <span className="text-success">✓</span>{" "}
                      components/ui/button-magnetic.tsx
                    </div>
                    <div className="text-text-muted">
                      <span className="text-success">✓</span>{" "}
                      components/ui/button-default.tsx
                    </div>
                    <div className="mt-1 text-text-muted">
                      Done! Added magnetic button style.
                    </div>
                  </div>

                  {/* Live preview */}
                  <div className="mt-5 pt-4 border-t border-border">
                    <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted mb-3">
                      Live Preview
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-9 items-center rounded-lg bg-foreground px-4 text-[13px] font-medium text-background">
                        Button
                      </span>
                      <span
                        className="inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-medium text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)",
                        }}
                      >
                        Gradient
                      </span>
                      <span className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-[13px] font-medium text-foreground">
                        Outline
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Mobile: simplified preview */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            className="lg:hidden"
          >
            <div className="double-bezel">
              <div className="double-bezel-inner p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="font-mono text-[12px] leading-6 text-text-muted">
                  <div>
                    <span className="text-success">$</span> npx devignerui add
                    button
                  </div>
                  <div className="mt-1">
                    <span className="text-success">✓</span> Done!
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                  <span className="inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-[12px] font-medium text-background">
                    Button
                  </span>
                  <span
                    className="inline-flex h-8 items-center rounded-lg px-3 text-[12px] font-medium text-white"
                    style={{
                      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    }}
                  >
                    Gradient
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Manifesto Statement ─── */
function Manifesto() {
  return (
    <section className="section-editorial py-28 sm:py-40">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal>
          <div className="max-w-4xl">
            <p className="text-[clamp(1.5rem,3.5vw,2.8rem)] font-semibold leading-[1.2] tracking-[-0.03em] text-foreground">
              Every component ships with{" "}
              <span className="text-gradient">
                multiple complete design implementations
              </span>
              . Not different props — different design languages.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── Component Showcase Strip ─── */
function ComponentShowcase() {
  const reduce = useReducedMotion();

  const components = [
    {
      name: "Button",
      tag: "6 styles",
      preview: (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-10 items-center rounded-xl bg-foreground px-5 text-[13px] font-medium text-background">
            Default
          </span>
          <span
            className="inline-flex h-10 items-center rounded-xl px-5 text-[13px] font-medium text-white"
            style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
          >
            Gradient
          </span>
          <span className="inline-flex h-10 items-center rounded-xl border border-border bg-background px-5 text-[13px] font-medium text-foreground">
            Outline
          </span>
          <span className="inline-flex h-10 items-center rounded-xl bg-accent/10 px-5 text-[13px] font-medium text-accent">
            Ghost
          </span>
        </div>
      ),
    },
    {
      name: "Card",
      tag: "4 styles",
      preview: (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-surface/60 p-4">
            <div className="text-[12px] font-semibold text-foreground">
              Card Title
            </div>
            <div className="mt-1 text-[11px] text-text-muted">
              With elevation
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/20 p-4">
            <div className="text-[12px] font-semibold text-foreground">
              Gradient
            </div>
            <div className="mt-1 text-[11px] text-text-muted">
              Tinted background
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Badge",
      tag: "7 styles",
      preview: (
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
            Default
          </span>
          <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success">
            Success
          </span>
          <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-0.5 text-[11px] font-medium text-warning">
            Warning
          </span>
          <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-foreground">
            Outline
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>
      ),
    },
    {
      name: "Input",
      tag: "3 styles",
      preview: (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Default input"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground placeholder:text-text-muted"
            readOnly
          />
          <input
            type="text"
            placeholder="Filled variant"
            className="h-9 w-full rounded-lg border-0 bg-muted/50 px-3 text-[13px] text-foreground placeholder:text-text-muted"
            readOnly
          />
        </div>
      ),
    },
    {
      name: "Hero Section",
      tag: "3 styles",
      preview: (
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <div className="h-3 w-24 rounded bg-foreground/10" />
          <div className="mt-2 h-5 w-40 rounded bg-foreground/20" />
          <div className="mt-1.5 h-2.5 w-32 rounded bg-foreground/10" />
          <div className="mt-3 flex gap-2">
            <div className="h-7 w-20 rounded-lg bg-foreground" />
            <div className="h-7 w-20 rounded-lg border border-border" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="section-editorial overflow-hidden">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <Reveal>
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
                Component Gallery
              </h2>
              <p className="mt-1 text-[14px] text-text-muted">
                15+ components, 45+ design styles. Every one production-ready.
              </p>
            </div>
            <Link
              href="/components"
              className="hidden sm:inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
            >
              View all
              <svg
                className="h-3.5 w-3.5"
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
        </Reveal>
      </div>

      {/* Horizontal scroll strip */}
      <div className="scroll-strip pl-5 pr-5 sm:pl-[max(1.25rem,calc((100vw-80rem)/2+1.25rem))]">
        {components.map((comp, i) => (
          <Reveal key={comp.name} delay={i * 0.06}>
            <div className="glass-card w-[300px] sm:w-[340px] rounded-2xl p-5 transition-all duration-300 hover:border-border-hover group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-foreground">
                  {comp.name}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-text-muted rounded-full bg-surface px-2 py-0.5">
                  {comp.tag}
                </span>
              </div>
              <div className="min-h-[80px]">{comp.preview}</div>
            </div>
          </Reveal>
        ))}
        {/* "See more" card */}
        <Reveal delay={0.3}>
          <Link
            href="/components"
            className="flex w-[200px] sm:w-[240px] items-center justify-center rounded-2xl border border-dashed border-border bg-transparent p-5 text-[13px] font-medium text-text-muted hover:border-accent/30 hover:text-accent transition-all duration-200"
          >
            Browse all components →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── Features Bento ─── */
function FeaturesBento() {
  const features = [
    {
      title: "CLI Install",
      desc: "One command. Production-ready components with full TypeScript support.",
      col: "md:col-span-2",
      visual: (
        <div className="mt-4 space-y-2">
          <div className="rounded-xl border border-border bg-background px-4 py-3 font-mono text-[12px] text-text-secondary">
            <span className="text-text-muted">$</span> npx devignerui add button
            --style gradient
          </div>
          <div className="rounded-xl border border-border bg-background px-4 py-3 font-mono text-[12px] text-text-secondary">
            <span className="text-text-muted">$</span> npx devignerui add card
            --style spotlight
          </div>
        </div>
      ),
    },
    {
      title: "Type-Safe",
      desc: "Full TypeScript. Autocomplete, type checking, zero runtime errors.",
      col: "md:col-span-1",
      visual: (
        <div className="mt-4 rounded-xl border border-border bg-background p-3 font-mono text-[11px] leading-5">
          <div>
            <span className="text-[#c678dd]">import</span> {"{ "}
            <span className="text-[#e5c07b]">Button</span>
            {" } "} <span className="text-[#c678dd]">from</span>{" "}
            <span className="text-[#98c379]">&quot;@devignerui/ui&quot;</span>
          </div>
          <div className="mt-1">
            <span className="text-[#c678dd]">import</span> {"{ "}
            <span className="text-[#e5c07b]">Card</span>
            {" } "} <span className="text-[#c678dd]">from</span>{" "}
            <span className="text-[#98c379]">&quot;@devignerui/ui&quot;</span>
          </div>
        </div>
      ),
    },
    {
      title: "Own Your Code",
      desc: "No vendor lock-in. Copy, paste, modify. It's your code.",
      col: "md:col-span-1",
      visual: (
        <div className="mt-4 grid grid-cols-2 gap-1.5">
          {["Button", "Card", "Input", "Badge"].map((n) => (
            <div
              key={n}
              className="rounded-lg border border-border bg-surface/60 p-2.5 text-center text-[11px] font-medium text-text-secondary hover:border-accent/30 hover:text-accent transition-all duration-200"
            >
              {n}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Design Styles",
      desc: "Each component has multiple complete design implementations — different design languages, one import.",
      col: "md:col-span-2",
      visual: (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex h-9 items-center rounded-lg bg-foreground px-4 text-[12px] font-medium text-background">
            Default
          </span>
          <span
            className="inline-flex h-9 items-center rounded-lg px-4 text-[12px] font-medium text-white"
            style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}
          >
            Gradient
          </span>
          <span className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-[12px] font-medium text-foreground">
            Outline
          </span>
          <span className="inline-flex h-9 items-center rounded-lg bg-accent/10 px-4 text-[12px] font-medium text-accent">
            Ghost
          </span>
          <span className="inline-flex h-9 items-center rounded-lg bg-gradient-to-r from-foreground to-gray-600 px-4 text-[12px] font-medium text-background">
            Subtle
          </span>
        </div>
      ),
    },
  ];

  return (
    <section className="section-editorial py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal>
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl font-semibold leading-[1.15] tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl">
              Built for engineers
              <br />
              who ship fast.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-text-secondary">
              Every decision — from the CLI to the component API — is optimized
              for speed without sacrificing quality.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <div
                className={`glass-card rounded-2xl p-6 transition-all duration-300 hover:border-border-hover ${f.col}`}
              >
                <div className="text-[15px] font-semibold text-foreground">
                  {f.title}
                </div>
                <div className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
                  {f.desc}
                </div>
                {f.visual}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Code Experience ─── */
function CodeExperience() {
  const [copied, setCopied] = useState(false);

  return (
    <section className="section-editorial bg-surface/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid items-start gap-16 lg:grid-cols-[1.1fr_1fr]">
          {/* Code block */}
          <Reveal>
            <div className="double-bezel">
              <div className="double-bezel-inner overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        'import { Button } from "@devignerui/ui"',
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="rounded px-2 py-1 text-[11px] text-text-muted hover:bg-surface hover:text-foreground transition-colors duration-200"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="p-5 font-mono text-[13px] leading-6">
                  {(
                    [
                      [
                        "01",
                        <>
                          <span className="text-[#c678dd]">import</span>
                          <span className="text-foreground">{" { "}</span>
                          <span className="text-[#e5c07b]">Button</span>
                          <span className="text-foreground">{" } "}</span>
                          <span className="text-[#c678dd]">from</span>
                          <span className="text-[#98c379]">
                            {" "}
                            &quot;@devignerui/ui&quot;
                          </span>
                        </>,
                      ],
                      ["02", null],
                      [
                        "03",
                        <>
                          <span className="text-[#c678dd]">
                            export function
                          </span>
                          <span className="text-[#61afef]"> Hero</span>
                          <span className="text-foreground">() {"{"}</span>
                        </>,
                      ],
                      [
                        "04",
                        <span className="text-foreground">{"  return ("}</span>,
                      ],
                      [
                        "05",
                        <span className="text-foreground">
                          {"    "}&lt;
                          <span className="text-[#e06c75]">section</span>{" "}
                          <span className="text-[#d19a66]">className</span>=
                          <span className="text-[#98c379]">"py-24"</span>&gt;
                        </span>,
                      ],
                      [
                        "06",
                        <span className="text-foreground">
                          {"      "}&lt;
                          <span className="text-[#e06c75]">h1</span>&gt;Build
                          something great.
                        </span>,
                      ],
                      [
                        "07",
                        <span className="text-foreground">
                          {"      "}&lt;/
                          <span className="text-[#e06c75]">h1</span>&gt;
                        </span>,
                      ],
                      [
                        "08",
                        <span className="text-foreground">
                          {"      "}&lt;
                          <span className="text-[#e06c75]">Button</span>{" "}
                          <span className="text-[#d19a66]">size</span>=
                          <span className="text-[#98c379]">"lg"</span>&gt;
                        </span>,
                      ],
                      [
                        "09",
                        <span className="text-foreground">
                          {"        "}Get Started
                        </span>,
                      ],
                      [
                        "10",
                        <span className="text-foreground">
                          {"      "}&lt;/
                          <span className="text-[#e06c75]">Button</span>&gt;
                        </span>,
                      ],
                      [
                        "11",
                        <span className="text-foreground">
                          {"    "}&lt;/
                          <span className="text-[#e06c75]">section</span>&gt;
                        </span>,
                      ],
                      ["12", <span className="text-foreground">{"  );"}</span>],
                      ["13", <span className="text-foreground">{"}"}</span>],
                    ] as [string, React.ReactNode][]
                  ).map(([num, content]) => (
                    <div key={num} className="flex">
                      <span className="mr-4 select-none text-text-muted">
                        {num}
                      </span>
                      <span>{content}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Copy */}
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-accent">
                Developer Experience
              </span>
              <h2 className="mt-3 text-3xl font-semibold leading-[1.15] tracking-[-0.03em] text-foreground sm:text-4xl">
                One import.
                <br />
                Any style.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-text-secondary">
                Install exactly the style you want. No config files, no setup
                steps. Works with your existing Tailwind setup.
              </p>
            </Reveal>

            <div className="mt-8 space-y-2.5">
              {[
                "npx devignerui add button",
                "npx devignerui add button --style gradient",
                "npx devignerui add card --style spotlight",
              ].map((cmd, i) => (
                <Reveal key={cmd} delay={0.05 + i * 0.05}>
                  <div className="rounded-xl border border-border bg-background/60 px-4 py-3 font-mono text-[12px] text-text-secondary transition-colors duration-200 hover:border-border-hover">
                    <span className="text-text-muted">$</span> {cmd}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ─── */
function Stats() {
  const stats = [
    { value: "15+", label: "Components" },
    { value: "45+", label: "Design Styles" },
    { value: "MIT", label: "License" },
    { value: "<5KB", label: "Avg Bundle" },
  ];

  return (
    <section className="section-editorial border-y border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.05}>
            <div
              className={`px-5 py-12 text-center sm:py-14 ${
                i < 3 ? "border-r border-border" : ""
              } ${i < 2 ? "border-b lg:border-b-0 border-border" : ""} ${
                i === 2 ? "border-b lg:border-b-0 border-border" : ""
              }`}
            >
              <div className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-2 text-[13px] text-text-muted">
                {stat.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ─── Social Proof (Editorial) ─── */
function SocialProof() {
  const testimonials = [
    {
      quote:
        "Finally, a component library that doesn't look like every other SaaS app. The magnetic buttons are incredible.",
      name: "Sarah Chen",
      role: "Frontend Lead, Vercel",
    },
    {
      quote:
        "We switched from Radix to DevignerUI and our design consistency improved overnight. The style alternatives are a game-changer.",
      name: "Marcus Rivera",
      role: "Design Engineer, Stripe",
    },
    {
      quote:
        "The DX is unmatched. One CLI command and you have production-ready components with full TypeScript support.",
      name: "Aisha Patel",
      role: "Senior Engineer, Linear",
    },
  ];

  return (
    <section className="section-editorial py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal>
          <div className="mb-14">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl lg:text-4xl">
              Trusted by design engineers
            </h2>
          </div>
        </Reveal>

        {/* Large editorial quotes */}
        <div className="grid gap-8 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={0.05 + i * 0.06}>
              <div className="group">
                <p className="text-[clamp(1rem,1.8vw,1.25rem)] leading-[1.5] tracking-[-0.01em] text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center text-[11px] font-semibold text-text-secondary">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-foreground">
                      {t.name}
                    </div>
                    <div className="text-[12px] text-text-muted">{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─── */
function AnimatedPrice({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className="relative inline-flex overflow-hidden leading-none">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "65%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-65%", opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 26,
            mass: 0.9,
          }}
          className={className}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const handleCheckout = async (plan: string) => {
    setLoading(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.toLowerCase(), billing }),
      });
      const data = await res.json();
      if (data.checkout_url) window.location.href = data.checkout_url;
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(null);
    }
  };

  interface Plan {
    name: string;
    tagline: string;
    monthly: number;
    yearly: number;
    cta: string;
    key: string;
    highlight?: boolean;
    icon: React.ReactNode;
    color: string;
    features: string[];
  }

  const plans: Plan[] = [
    {
      name: "Basic",
      tagline: "Getting started",
      monthly: 9,
      yearly: 79,
      cta: "Get Started",
      key: "basic",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      ),
      color: "text-text-muted",
      features: [
        "Current month billing only",
        "1 project",
        "Community support",
      ],
    },
    {
      name: "Pro",
      tagline: "The sweet spot for most teams",
      monthly: 19,
      yearly: 179,
      cta: "Get Pro",
      key: "pro",
      highlight: true,
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
      ),
      color: "text-accent",
      features: [
        "Current + 2 months billing",
        "5 projects",
        "Priority support",
        "TypeScript source",
      ],
    },
    {
      name: "Ultra",
      tagline: "No restrictions",
      monthly: 39,
      yearly: 349,
      cta: "Get Ultra",
      key: "ultra",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
      ),
      color: "text-success",
      features: [
        "Everything, ever billing",
        "Unlimited projects",
        "Priority support",
        "TypeScript source",
        "Early access",
      ],
    },
  ];

  const getPrice = (plan: Plan) =>
    billing === "monthly" ? plan.monthly : plan.yearly;

  const getSuffix = (plan: Plan) => (billing === "monthly" ? "/mo" : "/yr");

  const getSavings = (plan: Plan) => {
    const monthlyYearly = plan.monthly * 12;
    const savings = Math.round(
      ((monthlyYearly - plan.yearly) / monthlyYearly) * 100,
    );
    return savings;
  };

  return (
    <section id="pricing" className="section-editorial py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        {/* Header */}
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 mb-16 sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-text-muted mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Pricing
              </div>
              <h2
                className="font-bold text-foreground tracking-[-0.04em]"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  lineHeight: "1.1",
                }}
              >
                Simple, transparent
                <br />
                pricing.
              </h2>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1">
              <Button
                onClick={() => setBilling("monthly")}
                className={`rounded-full px-4 py-2 text-[0.8125rem] font-medium transition-all duration-300 ${
                  billing === "monthly"
                    ? "bg-foreground text-background"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Monthly
              </Button>
              <Button
                onClick={() => setBilling("yearly")}
                className={`rounded-full pl-4 pr-2 py-2 text-[0.8125rem] font-medium transition-all duration-300 space-x-2 ${
                  billing === "yearly"
                    ? "bg-foreground text-background"
                    : "text-text-muted hover:text-foreground"
                }`}
              >
                Yearly
                <span
                  className={cn(
                    "leading-none! rounded-full px-3 py-1.5 text-[0.625rem] font-semibold tracking-wide",
                    billing === "yearly"
                      ? "bg-emerald-700 text-white"
                      : "bg-success/10 text-success",
                  )}
                >
                  SAVE UPTO 27%
                </span>
              </Button>
            </div>
          </div>
        </Reveal>

        {/* Subscription Plans Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.05 + i * 0.07,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{
                y: -2,
                transition: { duration: 0.3, ease: "easeOut" },
              }}
              className={`group relative flex flex-col h-full rounded-2xl border transition-colors duration-500 ${
                plan.highlight
                  ? "border-accent/50 bg-surface shadow-[0_0_0_1px_rgba(59,130,246,0.1)]"
                  : "border-border bg-surface hover:border-border-hover"
              }`}
            >
              {plan.highlight && (
                <>
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-accent/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-white shadow-lg shadow-accent/25">
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                      >
                        <path d="M6 0l1.5 4.5L12 6l-4.5 1.5L6 12l-1.5-4.5L0 6l4.5-1.5z" />
                      </svg>
                      Recommended
                    </div>
                  </div>
                </>
              )}
              <div className="relative flex flex-col p-6 flex-1">
                {/* Plan Name */}
                <div
                  className={`flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] ${plan.color}`}
                >
                  {plan.icon}
                  {plan.name}
                </div>

                {/* Price */}
                <div className="mt-6 flex items-center gap-3">
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 200, damping: 26 }}
                    className="flex items-baseline gap-1"
                  >
                    <span className="text-text-muted text-[1.5rem] font-medium">
                      $
                    </span>
                    <AnimatedPrice
                      value={getPrice(plan)}
                      className="text-[clamp(2.25rem,4vw,3rem)] font-bold tracking-[-0.04em] leading-none text-foreground"
                    />
                    <motion.span
                      layout
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 26,
                      }}
                      className="text-[0.8125rem] text-text-muted ml-1"
                    >
                      {getSuffix(plan)}
                    </motion.span>
                  </motion.div>
                  <AnimatePresence>
                    {billing === "yearly" && (
                      <motion.span
                        initial={
                          reduce ? false : { opacity: 0, scale: 0.8, x: -6 }
                        }
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={
                          reduce
                            ? { opacity: 0 }
                            : { opacity: 0, scale: 0.8, x: -6 }
                        }
                        transition={{ duration: 0.4, ease: EASE }}
                        className="rounded-full bg-success/10 px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide text-success"
                      >
                        SAVE {getSavings(plan)}%
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Description */}
                <p className="mt-3 text-[0.8125rem] leading-relaxed text-text-secondary min-h-[2.5rem]">
                  {plan.tagline}
                </p>

                {/* CTA */}
                <Button
                  variant={plan.highlight ? "default" : "outline"}
                  className={`mt-5 w-full rounded-full transition-all duration-300 ${
                    plan.highlight
                      ? "bg-accent text-accent-foreground hover:bg-accent-hover"
                      : "border-border text-foreground hover:bg-surface-hover hover:border-border-hover"
                  }`}
                  onClick={() => handleCheckout(plan.key)}
                  disabled={loading === plan.key}
                >
                  {loading === plan.key ? "Loading..." : plan.cta}
                </Button>

                {/* Divider */}
                <div className="my-5 border-t border-border" />

                {/* Features */}
                <div className="space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5">
                      <svg
                        className={`w-4 h-4 flex-shrink-0 ${
                          plan.highlight ? "text-accent" : "text-text-muted"
                        }`}
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-[0.8125rem] text-text-secondary">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lifetime Access — nested-bezel hardware card */}
        <Reveal delay={0.2}>
          <motion.div
            transition={{ duration: 0.5, ease: EASE }}
            className="group mt-8 rounded-[2rem] bg-gradient-to-br from-success/40 via-border/70 to-success/20 p-px"
          >
            <div className="relative overflow-hidden rounded-[calc(2rem-1px)] bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              {/* Ambient texture */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-20%,rgba(34,197,94,0.10),transparent_55%)]" />
              <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-success/10 blur-[110px]" />
              <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-success/[0.06] blur-[110px]" />
              {/* Top hairline highlight */}
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-success/40 to-transparent" />

              <div className="relative grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12 lg:p-12">
                {/* Left — story */}
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                    </span>
                    <span className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-success">
                      Best Value
                    </span>
                  </div>

                  <div className="mt-6 flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-success/10 ring-1 ring-inset ring-success/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <svg
                        className="h-6 w-6 text-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-[clamp(1.375rem,2.5vw,1.75rem)] font-bold tracking-[-0.03em] text-foreground">
                        Lifetime Access
                      </h3>
                      <p className="mt-1 max-w-md text-[0.9375rem] leading-[1.6] text-text-secondary">
                        Pay once, own it forever. All current and future
                        components, templates, and updates, with no
                        subscription, no limits, and no renewal.
                      </p>
                    </div>
                  </div>

                  {/* Feature pills */}
                  <div className="mt-7 flex flex-wrap gap-2">
                    {[
                      "All components",
                      "All templates",
                      "Lifetime updates",
                      "Priority support",
                    ].map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 rounded-full border border-success/15 bg-success/[0.06] px-3 py-1.5 text-[0.75rem] font-medium text-text-secondary text-success"
                      >
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right — nested price island */}
                <div className="relative w-full overflow-hidden rounded-[1.5rem] border border-success/20 bg-[linear-gradient(180deg,rgba(34,197,94,0.07),transparent_70%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] lg:w-[20rem]">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.875rem] text-text-muted line-through decoration-text-muted/40">
                      $1200+
                    </span>
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-success">
                      Save 50%
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-[1.75rem] font-medium text-text-muted">
                      $
                    </span>
                    <span className="text-[clamp(3rem,7vw,3.75rem)] font-bold leading-none tracking-[-0.04em] text-foreground">
                      600
                    </span>
                    <span className="ml-1 text-[0.8125rem] text-text-muted">
                      one-time
                    </span>
                  </div>

                  <Button
                    className="group/cta relative mt-5 inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-success/40 px-6 text-[0.875rem] font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-success/60 active:scale-[0.98]"
                    onClick={() => handleCheckout("lifetime")}
                    disabled={loading === "lifetime"}
                  >
                    {loading === "lifetime"
                      ? "Loading..."
                      : "Get Lifetime Access"}
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-px">
                      <svg
                        className="h-3.5 w-3.5"
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
                  </Button>

                  <p className="mt-3 text-center text-[0.6875rem] text-text-muted">
                    One payment. Yours forever.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTASection() {
  return (
    <section className="section-editorial py-28 sm:py-40">
      <div className="mx-auto max-w-4xl px-5 text-center">
        <Reveal>
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/[0.04] blur-[120px] pointer-events-none" />
            <div className="relative">
              <h2 className="text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground">
                Start building
                <br />
                <span className="text-gradient">today.</span>
              </h2>
              <p className="mt-6 mx-auto max-w-md text-[15px] leading-relaxed text-text-secondary">
                Free for open source. Premium styles for production. Ship your
                next project in minutes.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/components"
                  className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-foreground px-8 text-sm font-medium text-background hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                >
                  Get Started Free
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/10 transition-transform duration-200 group-hover:translate-x-0.5">
                    <svg
                      className="h-3 w-3"
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
                  className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background/50 px-8 text-sm font-medium text-foreground hover:bg-surface transition-colors duration-200"
                >
                  View Pricing
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
            D
          </span>
          <span className="text-[13px] text-text-muted">
            &copy; 2026 Devigner UI
          </span>
        </div>
        <div className="flex items-center gap-5">
          <a
            href="https://twitter.com/devignerui"
            className="text-[13px] text-text-muted hover:text-foreground transition-colors duration-200"
          >
            Twitter
          </a>
          <a
            href="https://github.com/devignerui/devignerui"
            className="text-[13px] text-text-muted hover:text-foreground transition-colors duration-200"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ─── */
export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="grain-overlay" />
      <Navbar />
      <Hero />
      <Manifesto />
      <ComponentShowcase />
      <FeaturesBento />
      <CodeExperience />
      <Stats />
      <SocialProof />
      <Pricing />
      <CTASection />
      <Footer />
    </div>
  );
}
