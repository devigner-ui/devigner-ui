"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ThemeToggle } from "../components/theme-provider";

function MagneticButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ref.current.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0, 0)";
  };

  return (
    <button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </button>
  );
}

function CodeBlock() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-[16px] border border-border bg-background shadow-card">
      <div className="flex items-center justify-between border-b border-border px-[16px] py-[12px]">
        <div className="flex items-center gap-[8px]">
          <div className="h-[12px] w-[12px] rounded-full bg-[#ff5f57]" />
          <div className="h-[12px] w-[12px] rounded-full bg-[#febc2e]" />
          <div className="h-[12px] w-[12px] rounded-full bg-[#28c840]" />
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(
              `npx devignerui add button --style magnetic`
            );
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-[12px] text-text-muted hover:text-foreground transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="p-[20px] font-mono text-[13px] leading-[22px]">
        <div className="flex">
          <span className="mr-[16px] select-none text-text-muted">01</span>
          <span className="text-[#c678dd]">import</span>
          <span className="text-foreground">{" { "}</span>
          <span className="text-[#e5c07b]">Button</span>
          <span className="text-foreground">{" } "}</span>
          <span className="text-[#c678dd]">from</span>
          <span className="text-[#98c379]"> &quot;@devignerui/ui&quot;</span>
        </div>
        <div className="flex">
          <span className="mr-[16px] select-none text-text-muted">02</span>
          <span />
        </div>
        <div className="flex">
          <span className="mr-[16px] select-none text-text-muted">03</span>
          <span className="text-[#c678dd]">export function</span>
          <span className="text-[#61afef]"> Hero</span>
          <span className="text-foreground">() {"{"}</span>
        </div>
        <div className="flex">
          <span className="mr-[16px] select-none text-text-muted">04</span>
          <span className="text-foreground">{"  return ("}</span>
        </div>
        <div className="flex">
          <span className="mr-[16px] select-none text-text-muted">05</span>
          <span className="text-foreground">
            {"    "}
            &lt;<span className="text-[#e06c75]">section</span>{" "}
            <span className="text-[#d19a66]">className</span>=
            <span className="text-[#98c379]">&quot;py-24&quot;</span>&gt;
          </span>
        </div>
        <div className="flex">
          <span className="mr-[16px] select-none text-text-muted">06</span>
          <span className="text-foreground">
            {"      "}
            &lt;<span className="text-[#e06c75]">h1</span>&gt;
            Build something great.
          </span>
        </div>
        <div className="flex">
          <span className="mr-[16px] select-none text-text-muted">07</span>
          <span className="text-foreground">
            {"      "}
            &lt;/<span className="text-[#e06c75]">h1</span>&gt;
          </span>
        </div>
        <div className="flex">
          <span className="mr-[16px] select-none text-text-muted">08</span>
          <span className="text-foreground">
            {"      "}
            &lt;<span className="text-[#e06c75]">Button</span>{" "}
            <span className="text-[#d19a66]">size</span>=
            <span className="text-[#98c379]">&quot;lg&quot;</span>&gt;
          </span>
        </div>
        <div className="flex">
          <span className="mr-[16px] select-none text-text-muted">09</span>
          <span className="text-foreground">{"        "}Get Started</span>
        </div>
        <div className="flex">
          <span className="mr-[16px] select-none text-text-muted">10</span>
          <span className="text-foreground">
            {"      "}
            &lt;/<span className="text-[#e06c75]">Button</span>&gt;
          </span>
        </div>
        <div className="flex">
          <span className="mr-[16px] select-none text-text-muted">11</span>
          <span className="text-foreground">
            {"    "}
            &lt;/<span className="text-[#e06c75]">section</span>&gt;
          </span>
        </div>
        <div className="flex">
          <span className="mr-[16px] select-none text-text-muted">12</span>
          <span className="text-foreground">{"  );"}</span>
        </div>
        <div className="flex">
          <span className="mr-[16px] select-none text-text-muted">13</span>
          <span className="text-foreground">{"}"}</span>
        </div>
      </div>
    </div>
  );
}

function ComponentPreview() {
  return (
    <div className="grid grid-cols-2 gap-[12px]">
      {/* Button previews */}
      <div className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
          Default
        </div>
        <div className="flex items-center gap-[8px]">
          <span className="inline-flex h-[32px] items-center rounded-[8px] bg-foreground px-[14px] text-[13px] font-medium text-background">
            Button
          </span>
          <span className="inline-flex h-[32px] items-center rounded-[8px] border border-border bg-background px-[14px] text-[13px] font-medium text-foreground">
            Outline
          </span>
        </div>
      </div>

      {/* Gradient button */}
      <div className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
          Gradient
        </div>
        <div className="flex items-center gap-[8px]">
          <span
            className="inline-flex h-[32px] items-center rounded-[8px] px-[14px] text-[13px] font-medium text-white"
            style={{
              background: "linear-gradient(135deg, #0070f3, #7928ca, #ff0080)",
            }}
          >
            Button
          </span>
        </div>
      </div>

      {/* Badge previews */}
      <div className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
          Badges
        </div>
        <div className="flex flex-wrap items-center gap-[6px]">
          <span className="inline-flex items-center rounded-[9999px] bg-accent px-[8px] py-[2px] text-[11px] font-medium text-accent-foreground">
            Default
          </span>
          <span className="inline-flex items-center rounded-[9999px] bg-success/10 px-[8px] py-[2px] text-[11px] font-medium text-success">
            Success
          </span>
          <span className="inline-flex items-center gap-[4px] rounded-[9999px] border border-border bg-background px-[8px] py-[2px] text-[11px] font-medium text-foreground">
            <span className="relative flex h-[5px] w-[5px]">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>
      </div>

      {/* Card preview */}
      <div className="rounded-[12px] border border-border bg-surface p-[16px]">
        <div className="mb-[12px] text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
          Card
        </div>
        <div className="rounded-[10px] border border-border bg-background p-[12px] shadow-card">
          <div className="mb-[4px] text-[12px] font-semibold text-foreground">
            Card Title
          </div>
          <div className="text-[11px] text-text-secondary">
            With shadow elevation
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-[50px] max-w-7xl items-center justify-between px-[20px]">
          <Link
            href="/"
            className="flex items-center gap-[8px] text-[18px] font-semibold tracking-[-0.5px] text-foreground"
          >
            <div className="flex h-[24px] w-[24px] items-center justify-center rounded-[6px] bg-foreground text-[12px] font-bold text-background">
              D
            </div>
            Devigner
          </Link>
          <div className="flex items-center gap-[20px]">
            <Link
              href="/components"
              className="text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors"
            >
              Components
            </Link>
            <Link
              href="/pricing"
              className="text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <a
              href="https://github.com/devignerui/devignerui"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <ThemeToggle />
            <Link
              href="/components"
              className="inline-flex h-[32px] items-center justify-center rounded-[8px] bg-foreground px-[14px] text-[13px] font-medium text-background hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-[200px] -right-[200px] h-[500px] w-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute -bottom-[200px] -left-[200px] h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-[100px]" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative mx-auto max-w-7xl px-[20px] pt-[100px] pb-[80px]"
        >
          <div className="grid items-center gap-[60px] lg:grid-cols-2">
            {/* Left: Copy */}
            <div>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={mounted ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-[20px] inline-flex items-center gap-[6px] rounded-[9999px] border border-border bg-surface px-[10px] py-[3px] text-[11px] font-medium text-text-secondary">
                  <span className="relative flex h-[5px] w-[5px]">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-success" />
                  </span>
                  v0.1.0 — Now in Alpha
                </div>
              </motion.div>

              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : undefined}
                transition={{
                  duration: 0.6,
                  delay: 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="text-[56px] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground lg:text-[72px]"
              >
                Ship UI that
                <br />
                actually{" "}
                <span className="relative">
                  sells
                  <svg
                    className="absolute -bottom-[4px] left-0 h-[8px] w-full"
                    viewBox="0 0 100 8"
                    fill="none"
                  >
                    <path
                      d="M1 5.5C20 2.5 40 1 50 2.5C60 4 80 6.5 99 3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="text-accent"
                    />
                  </svg>
                </span>
              </motion.h1>

              <motion.p
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : undefined}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mt-[24px] max-w-[440px] text-[17px] leading-[1.65] text-text-secondary"
              >
                React components with multiple design styles per component. Not
                prop variants — complete style alternatives. Ship premium
                interfaces in minutes.
              </motion.p>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : undefined}
                transition={{
                  duration: 0.6,
                  delay: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mt-[32px] flex items-center gap-[12px]"
              >
                <MagneticButton className="inline-flex h-[44px] items-center justify-center rounded-[10px] bg-foreground px-[24px] text-[14px] font-medium text-background hover:opacity-90 transition-all duration-200">
                  Browse Components
                </MagneticButton>
                <Link
                  href="/pricing"
                  className="inline-flex h-[44px] items-center justify-center rounded-[10px] border border-border bg-background px-[24px] text-[14px] font-medium text-foreground hover:bg-surface transition-colors"
                >
                  View Pricing
                </Link>
              </motion.div>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={mounted ? { opacity: 1, y: 0 } : undefined}
                transition={{
                  duration: 0.6,
                  delay: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mt-[24px] flex items-center gap-[16px] text-[13px] text-text-muted"
              >
                <span className="flex items-center gap-[6px]">
                  <svg
                    className="h-[14px] w-[14px] text-success"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  MIT License
                </span>
                <span className="flex items-center gap-[6px]">
                  <svg
                    className="h-[14px] w-[14px] text-success"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  TypeScript
                </span>
                <span className="flex items-center gap-[6px]">
                  <svg
                    className="h-[14px] w-[14px] text-success"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Tailwind v4
                </span>
              </motion.div>
            </div>

            {/* Right: Visual */}
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 30 }}
              animate={mounted ? { opacity: 1, x: 0 } : undefined}
              transition={{
                duration: 0.7,
                delay: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative"
            >
              {/* Terminal */}
              <div className="overflow-hidden rounded-[16px] border border-border bg-background shadow-card">
                <div className="flex items-center gap-[8px] border-b border-border px-[14px] py-[10px]">
                  <div className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
                  <div className="h-[10px] w-[10px] rounded-full bg-[#febc2e]" />
                  <div className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
                  <span className="ml-[8px] text-[11px] text-text-muted">
                    terminal
                  </span>
                </div>
                <div className="p-[16px] font-mono text-[12px] leading-[20px]">
                  <div className="text-text-muted">
                    <span className="text-success">$</span> npx devignerui add
                    button --style magnetic
                  </div>
                  <div className="mt-[8px] text-text-muted">
                    <span className="text-success">✓</span>{" "}
                    components/ui/button-magnetic.tsx
                  </div>
                  <div className="text-text-muted">
                    <span className="text-success">✓</span>{" "}
                    components/ui/button-default.tsx
                  </div>
                  <div className="mt-[8px] text-text-muted">
                    Done! Added magnetic button style.
                  </div>
                </div>
              </div>

              {/* Floating component preview */}
              <div className="absolute -bottom-[40px] -left-[40px] rounded-[12px] border border-border bg-background p-[12px] shadow-card">
                <div className="flex items-center gap-[8px]">
                  <span className="inline-flex h-[28px] items-center rounded-[6px] bg-foreground px-[12px] text-[11px] font-medium text-background">
                    Button
                  </span>
                  <span className="inline-flex h-[28px] items-center rounded-[6px] border border-border bg-background px-[12px] text-[11px] font-medium text-foreground">
                    Outline
                  </span>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-[16px] -right-[16px] rounded-[9999px] border border-border bg-background px-[10px] py-[4px] text-[11px] font-medium shadow-card">
                <span className="flex items-center gap-[4px]">
                  <span className="relative flex h-[5px] w-[5px]">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-success" />
                  </span>
                  3 styles
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Logo strip */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-[20px] py-[20px]">
          <span className="text-[12px] font-medium uppercase tracking-[0.15em] text-text-muted">
            Built with
          </span>
          <div className="flex items-center gap-[32px]">
            <span className="text-[13px] font-medium text-text-secondary">
              React
            </span>
            <span className="text-[13px] font-medium text-text-secondary">
              Tailwind CSS
            </span>
            <span className="text-[13px] font-medium text-text-secondary">
              TypeScript
            </span>
            <span className="text-[13px] font-medium text-text-secondary">
              Motion
            </span>
          </div>
        </div>
      </section>

      {/* Component showcase */}
      <section className="mx-auto max-w-7xl px-[20px] py-[100px]">
        <div className="grid items-start gap-[60px] lg:grid-cols-2">
          {/* Left: Copy */}
          <div className="lg:sticky lg:top-[100px]">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-[12px] text-[11px] font-medium uppercase tracking-[0.15em] text-accent">
                Design Styles
              </div>
              <h2 className="text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
                Not variants.
                <br />
                Full styles.
              </h2>
              <p className="mt-[16px] max-w-[400px] text-[16px] leading-[1.6] text-text-secondary">
                Each component ships with multiple complete design
                implementations. Not different props — different design
                languages.
              </p>

              <div className="mt-[32px] space-y-[16px]">
                <div className="flex items-start gap-[12px]">
                  <div className="mt-[2px] flex h-[20px] w-[20px] items-center justify-center rounded-[4px] bg-accent/10 text-accent">
                    <svg
                      className="h-[12px] w-[12px]"
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
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-foreground">
                      Default Style
                    </div>
                    <div className="text-[13px] text-text-muted">
                      Clean, minimal, works everywhere
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-[12px]">
                  <div className="mt-[2px] flex h-[20px] w-[20px] items-center justify-center rounded-[4px] bg-accent/10 text-accent">
                    <svg
                      className="h-[12px] w-[12px]"
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
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-foreground">
                      Gradient Style
                    </div>
                    <div className="text-[13px] text-text-muted">
                      Animated backgrounds, glow effects
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-[12px]">
                  <div className="mt-[2px] flex h-[20px] w-[20px] items-center justify-center rounded-[4px] bg-accent/10 text-accent">
                    <svg
                      className="h-[12px] w-[12px]"
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
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-foreground">
                      Magnetic Style
                    </div>
                    <div className="text-[13px] text-text-muted">
                      Spring physics, cursor following
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/components"
                className="mt-[32px] inline-flex items-center gap-[6px] text-[14px] font-medium text-accent hover:underline"
              >
                View all components
                <svg
                  className="h-[14px] w-[14px]"
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
            </motion.div>
          </div>

          {/* Right: Preview */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <ComponentPreview />
          </motion.div>
        </div>
      </section>

      {/* Code section */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-[20px] py-[100px]">
          <div className="grid items-start gap-[60px] lg:grid-cols-2">
            {/* Left: Code */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <CodeBlock />
            </motion.div>

            {/* Right: Copy */}
            <div className="lg:sticky lg:top-[100px]">
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-[12px] text-[11px] font-medium uppercase tracking-[0.15em] text-accent">
                  Developer Experience
                </div>
                <h2 className="text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
                  One import.
                  <br />
                  Any style.
                </h2>
                <p className="mt-[16px] max-w-[400px] text-[16px] leading-[1.6] text-text-secondary">
                  Install exactly the style you want. No config files, no
                  setup steps. Works with your existing Tailwind setup.
                </p>

                <div className="mt-[32px] space-y-[12px]">
                  <div className="rounded-[8px] border border-border bg-background p-[12px]">
                    <code className="font-mono text-[12px] text-text-secondary">
                      <span className="text-text-muted">$</span> npx
                      devignerui add button
                    </code>
                  </div>
                  <div className="rounded-[8px] border border-border bg-background p-[12px]">
                    <code className="font-mono text-[12px] text-text-secondary">
                      <span className="text-text-muted">$</span> npx
                      devignerui add button --style gradient
                    </code>
                  </div>
                  <div className="rounded-[8px] border border-border bg-background p-[12px]">
                    <code className="font-mono text-[12px] text-text-secondary">
                      <span className="text-text-muted">$</span> npx
                      devignerui add card --style spotlight
                    </code>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
          {[
            { value: "15+", label: "Components" },
            { value: "45+", label: "Design Styles" },
            { value: "MIT", label: "License" },
            { value: "<5KB", label: "Avg Bundle" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`px-[20px] py-[40px] text-center ${
                i < 3 ? "border-r border-border" : ""
              } ${i < 2 ? "border-b lg:border-b-0 border-border" : ""} ${
                i === 2 ? "border-b lg:border-b-0 border-border" : ""
              }`}
            >
              <div className="text-[48px] font-semibold leading-none tracking-[-0.04em] text-foreground">
                {stat.value}
              </div>
              <div className="mt-[8px] text-[13px] text-text-muted">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-[20px] py-[120px] text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-[56px] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground">
            Start building today.
          </h2>
          <p className="mx-auto mt-[16px] max-w-[440px] text-[17px] leading-[1.65] text-text-secondary">
            Free for open source. Premium styles for production. Ship your
            next project in minutes.
          </p>
          <div className="mt-[32px] flex items-center justify-center gap-[12px]">
            <MagneticButton className="inline-flex h-[48px] items-center justify-center rounded-[10px] bg-foreground px-[28px] text-[15px] font-medium text-background hover:opacity-90 transition-all duration-200">
              Get Started Free
            </MagneticButton>
            <Link
              href="/pricing"
              className="inline-flex h-[48px] items-center justify-center rounded-[10px] border border-border bg-background px-[28px] text-[15px] font-medium text-foreground hover:bg-surface transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-[20px] py-[24px]">
          <div className="flex items-center gap-[8px]">
            <div className="flex h-[20px] w-[20px] items-center justify-center rounded-[4px] bg-foreground text-[10px] font-bold text-background">
              D
            </div>
            <span className="text-[13px] text-text-muted">
              &copy; 2026 Devigner UI
            </span>
          </div>
          <div className="flex items-center gap-[20px]">
            <a
              href="https://twitter.com/devignerui"
              className="text-[13px] text-text-muted hover:text-foreground transition-colors"
            >
              Twitter
            </a>
            <a
              href="https://github.com/devignerui/devignerui"
              className="text-[13px] text-text-muted hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
