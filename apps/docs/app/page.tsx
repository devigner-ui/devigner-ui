"use client";

import Link from "next/link";
import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Button } from "@devignerui/ui";
import { Navbar } from "../components/landing/navbar";
import { Hero } from "../components/landing/hero";
import { ComponentRange } from "../components/landing/component-range";
import { CliTerminal } from "../components/landing/cli-terminal";
import { Features } from "../components/landing/features";
import { StatsBand } from "../components/landing/stats-band";
import { SmoothScroll } from "../components/landing/smooth-scroll";
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
          className="size-4"
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
          className="size-4"
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
          className="size-4"
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
                <span className="size-1.5 rounded-full bg-success" />
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
              className="h-full"
            >
              {/* Inner shell owns the hover — CSS transform + shadow on the GPU,
                  separate element from Motion's entrance transform (no conflict) */}
              <div
                className={`group relative flex h-full flex-col rounded-2xl border transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-elevated ${
                  plan.highlight
                    ? "border-accent/50 bg-surface shadow-[0_0_0_1px_rgba(59,130,246,0.1)]"
                    : "border-border bg-surface hover:border-border-hover"
                }`}
              >
              {plan.highlight && (
                <>
                  <div className="absolute -inset-px rounded-2xl bg-linear-to-b from-accent/20 via-transparent to-transparent opacity-0 transition-opacity duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100" />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-widest text-white shadow-lg shadow-accent/25">
                      <svg
                        className="size-3"
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
                    <span className="text-text-muted text-2xl font-medium">
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
                <p className="mt-3 text-[0.8125rem] leading-relaxed text-text-secondary min-h-10">
                  {plan.tagline}
                </p>

                {/* CTA */}
                <Button
                  variant={plan.highlight ? "default" : "outline"}
                  className={`mt-5 w-full rounded-full transition-colors duration-200 ${
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
                        className={`size-4 shrink-0 ${
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
              </div>
            </motion.div>
          ))}
        </div>

        {/* Lifetime Access — nested-bezel hardware card */}
        <Reveal delay={0.2}>
          <motion.div
            transition={{ duration: 0.5, ease: EASE }}
            className="group mt-8 rounded-4xl bg-linear-to-br from-success/40 via-border/70 to-success/20 p-px"
          >
            <div className="relative overflow-hidden rounded-[calc(2rem-1px)] bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              {/* Ambient texture */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-20%,rgba(34,197,94,0.10),transparent_55%)]" />
              <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-success/10 blur-[110px]" />
              <div className="pointer-events-none absolute -bottom-24 -left-20 size-64 rounded-full bg-success/6 blur-[110px]" />
              {/* Top hairline highlight */}
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-success/40 to-transparent" />

              <div className="relative grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12 lg:p-12">
                {/* Left — story */}
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-success" />
                    </span>
                    <span className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-success">
                      Best Value
                    </span>
                  </div>

                  <div className="mt-6 flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-success/10 ring-1 ring-inset ring-success/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <svg
                        className="size-6 text-success"
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
                        className="inline-flex items-center gap-1.5 rounded-full border border-success/15 bg-success/6 px-3 py-1.5 text-xs font-medium text-success"
                      >
                        <svg
                          className="size-3"
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
                <div className="relative w-full overflow-hidden rounded-3xl border border-success/20 bg-[linear-gradient(180deg,rgba(34,197,94,0.07),transparent_70%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] lg:w-80">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted line-through decoration-text-muted/40">
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
                    className="group/cta relative mt-5 inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-success/40 px-6 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-success/60 active:scale-[0.98]"
                    onClick={() => handleCheckout("lifetime")}
                    disabled={loading === "lifetime"}
                  >
                    {loading === "lifetime"
                      ? "Loading..."
                      : "Get Lifetime Access"}
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-px">
                      <svg
                        className="size-3.5"
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
            <div className="absolute top-1/2 left-1/2 -translate-1/2 size-125 rounded-full bg-accent/4 blur-[120px] pointer-events-none" />
            <div className="relative">
              <h2 className="text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground">
                Start building
                <br />
                <span className="text-accent">today.</span>
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
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-background/10 transition-transform duration-200 group-hover:translate-x-0.5">
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
          <span className="flex size-5 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
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
  return (
    <div className="min-h-screen bg-background">
      <SmoothScroll />
      <div className="grain-overlay" />
      <Navbar />
      <Hero />
      <ComponentRange />
      <CliTerminal />
      <Features />
      <StatsBand />
      <Pricing />
      <CTASection />
      <Footer />
    </div>
  );
}
