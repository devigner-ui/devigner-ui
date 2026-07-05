"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Starburst } from "./starburst";
import { cn } from "@devignerui/ui/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function Check({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4 shrink-0", className)}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type PlanKey = "monthly" | "lifetime";

const MONTHLY_FEATURES = [
  "Every component",
  "New components as they ship",
  "Full TypeScript source",
  "Priority support",
];

const LIFETIME_FEATURES = [
  "Everything in Monthly",
  "Lifetime updates, forever",
  "All future components",
  "No subscription, no renewal",
];

export function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const [loading, setLoading] = useState<PlanKey | null>(null);

  const handleCheckout = async (plan: PlanKey) => {
    setLoading(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          billing: plan === "lifetime" ? "onetime" : "monthly",
        }),
      });
      const data = await res.json();
      if (data.checkout_url) window.location.href = data.checkout_url;
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(null);
    }
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".price-reveal", {
          y: 36,
          opacity: 0,
          filter: "blur(6px)",
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          clearProps: "filter",
          scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="section-editorial py-24 sm:py-32"
    >
      <div className="mx-auto max-w-5xl px-5">
        {/* Header */}
        <div className="price-reveal max-w-2xl">
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold uppercase leading-[0.98] tracking-[-0.02em] text-foreground">
            Simple,
            <br />
            <span className="text-accent">transparent.</span>
          </h2>
          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-text-secondary">
            One library, two ways to own it. Every plan includes the full set of
            components, MIT-licensed. No seats, no usage limits.
          </p>
        </div>

        {/* Unified two-half panel */}
        <div className="price-reveal double-bezel mt-14">
          <div className="double-bezel-inner grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
            {/* Monthly */}
            <div className="flex flex-col p-8 sm:p-10">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
                Monthly
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-2xl font-medium text-text-muted">
                  $
                </span>
                <span className="font-display text-[clamp(3rem,6vw,4rem)] font-semibold leading-none tracking-[-0.03em] text-foreground tabular-nums">
                  14.99
                </span>
                <span className="ml-1 text-sm text-text-muted">/mo</span>
              </div>
              <p className="mt-4 text-[14px] leading-relaxed text-text-secondary">
                Billed monthly, cancel whenever. Access stays live while
                you&apos;re subscribed.
              </p>

              <button
                type="button"
                onClick={() => handleCheckout("monthly")}
                disabled={loading === "monthly"}
                className="mt-8 inline-flex h-12 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-sm font-medium text-foreground transition-[background-color,border-color] duration-200 hover:border-border-hover hover:bg-surface active:scale-[0.98] disabled:opacity-60"
              >
                {loading === "monthly" ? "Processing…" : "Start monthly"}
              </button>

              <div className="my-7 h-px bg-border" />

              <ul className="space-y-3">
                {MONTHLY_FEATURES.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-[14px] text-text-secondary"
                  >
                    <Check className="text-text-muted" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Lifetime — highlighted */}
            <div className="relative flex flex-col overflow-hidden p-8 sm:p-10">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,color-mix(in_oklab,var(--accent)_9%,transparent),transparent_60%)]" />
              <Starburst className="pointer-events-none absolute -right-8 -top-8 size-40 text-accent/[0.07]" />

              <div className="relative flex items-center justify-between">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                  One-time
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                  <span className="size-1.5 rounded-full bg-accent" />
                  Best value
                </span>
              </div>

              <div className="relative mt-6 flex items-baseline gap-1">
                <span className="font-display text-2xl font-medium text-accent/70">
                  $
                </span>
                <span className="font-display text-[clamp(3rem,6vw,4rem)] font-semibold leading-none tracking-[-0.03em] text-foreground tabular-nums">
                  149.99
                </span>
                <span className="ml-1 text-sm text-text-muted">once</span>
              </div>
              <p className="relative mt-4 text-[14px] leading-relaxed text-text-secondary">
                Pay once, own it forever. Pays for itself in about ten months
                versus the subscription.
              </p>

              <button
                type="button"
                onClick={() => handleCheckout("lifetime")}
                disabled={loading === "lifetime"}
                className="group relative mt-8 inline-flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-full bg-accent pl-6 pr-3 text-sm font-semibold text-accent-foreground transition-[background-color,transform] duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
              >
                {loading === "lifetime" ? "Processing…" : "Get lifetime access"}
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-black/15 transition-transform duration-200 ease-drawer group-hover:translate-x-0.5">
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
              </button>

              <div className="relative my-7 h-px bg-border" />

              <ul className="relative space-y-3">
                {LIFETIME_FEATURES.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-[14px] text-text-secondary"
                  >
                    <Check className="text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="price-reveal mt-8 text-center font-mono text-[12px] text-text-muted">
          Prices in USD. Secure checkout via Creem.
        </p>
      </div>
    </section>
  );
}
