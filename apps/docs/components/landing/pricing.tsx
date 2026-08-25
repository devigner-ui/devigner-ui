"use client";

import { useState } from "react";
import { Starburst } from "./starburst";
import { Button } from "@devignerui/ui";
import { ArrowRight } from "reicon-react/icons/ArrowRight";
import { Check } from "reicon-react/icons/Check";

type PlanKey = "monthly" | "lifetime";

const MONTHLY_FEATURES = [
  "Every Pro component and block",
  "Early access to new designs",
  "Same CLI, same ownership",
  "Access stays live while subscribed",
];

const LIFETIME_FEATURES = [
  "Everything in Monthly",
  "Every future design, forever",
  "One payment, no renewal",
  "Keeps working if you stop paying",
];

export function Pricing() {
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


  return (
    <section
      id="pricing"
      className="section-editorial py-24 sm:py-32"
    >
      <div className="mx-auto max-w-5xl px-5">
        {/* Header */}
        <div className="reveal max-w-2xl">
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold uppercase leading-[0.98] tracking-[-0.02em] text-foreground">
            Simple,
            <br />
            <span className="text-accent">transparent.</span>
          </h2>
          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-text-secondary">
            The free tier installs from the same CLI, and the code is yours
            either way. Pro unlocks the designs behind the licence. No seats,
            no usage limits.
          </p>
        </div>

        {/* Unified two-half panel */}
        <div className="reveal double-bezel mt-14">
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

              <Button
                type="button"
                variant="outline"
                onClick={() => handleCheckout("monthly")}
                disabled={loading === "monthly"}
                className="mt-8 h-12 rounded-full bg-background transition-[background-color,border-color] duration-200 hover:border-border-hover disabled:opacity-60"
              >
                {loading === "monthly" ? "Processing…" : "Start monthly"}
              </Button>

              <div className="my-7 h-px bg-border" />

              <ul className="space-y-3">
                {MONTHLY_FEATURES.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-[14px] text-text-secondary"
                  >
                    <Check className="size-4 shrink-0 text-text-muted" />
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

              <Button
                type="button"
                onClick={() => handleCheckout("lifetime")}
                disabled={loading === "lifetime"}
                className="group relative mt-8 h-12 gap-2.5 rounded-full bg-accent-strong pl-6 pr-3 font-semibold text-accent-foreground transition-[background-color,transform] duration-200 hover:bg-accent-hover disabled:opacity-60"
              >
                {loading === "lifetime" ? "Processing…" : "Get lifetime access"}
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-black/15 transition-transform duration-200 ease-drawer group-hover:translate-x-0.5">
                  <ArrowRight className="size-3" />
                </span>
              </Button>

              <div className="relative my-7 h-px bg-border" />

              <ul className="relative space-y-3">
                {LIFETIME_FEATURES.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-[14px] text-text-secondary"
                  >
                    <Check className="size-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="reveal mt-8 text-center font-mono text-[12px] text-text-muted">
          Prices in USD. Secure checkout via Creem.
        </p>
      </div>
    </section>
  );
}
