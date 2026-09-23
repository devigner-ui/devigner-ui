"use client";

import { motion, useReducedMotion } from "motion/react";
import { IconCheck } from "@devigner-ui/icons";
import { cn } from "cn";
import { EASE_OUT } from "@devignerui/ui/motion";

// ponytail: plans are shown but not sold until the first Pro component
// ships. The Creem checkout route (/api/checkout) is untouched; wiring a
// plan back up is a POST of { plan, billing } from its button.
const PLANS: {
  key: "monthly" | "lifetime";
  name: string;
  price: string;
  per: string;
  blurb: string;
  features: string[];
}[] = [
  {
    key: "monthly",
    name: "Pro Monthly",
    price: "14.99",
    per: "/ month",
    blurb: "Every Pro component while you're subscribed. Cancel whenever.",
    features: [
      "Every Pro component",
      "New Pro components as they ship",
      "Full TypeScript source",
      "Priority support",
    ],
  },
  {
    key: "lifetime",
    name: "Pro Lifetime",
    price: "149.99",
    per: "once",
    blurb: "Pay once, keep it. Costs about ten months of the subscription.",
    features: [
      "Everything in Pro Monthly",
      "Every future Pro component",
      "Lifetime updates",
      "No renewal, ever",
    ],
  },
];

export function Pricing() {
  const reduce = useReducedMotion();

  return (
    <section id="pricing" className="scroll-mt-16 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="max-w-2xl"
        >
          <p className="font-mono text-[12px] text-brand">Pricing</p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,5.4vw,4.25rem)] leading-[0.98] font-extrabold tracking-[-0.04em] text-foreground">
            Free today.
            <br />
            <span className="text-text-muted">Pro when it ships.</span>
          </h2>
          <p className="mt-6 max-w-lg text-[17px]/7 text-text-secondary">
            Everything on this site is free and will stay free. Pro components
            are still being built. When they ship, these are the two ways to
            get them.
          </p>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: EASE_OUT, delay: 0.1 }}
          className="mt-14 grid grid-cols-1 gap-3 rounded-[32px] border border-border bg-background-100 p-3 md:grid-cols-[minmax(0,4fr)_minmax(0,5fr)_minmax(0,5fr)]"
        >
          {/* What you get today, for nothing */}
          <div className="flex flex-col rounded-[22px] bg-background p-7 sm:p-9">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[22px] font-bold tracking-[-0.02em] text-foreground">
                Free
              </h3>
              <span className="rounded-md bg-success px-2 py-0.5 text-[12px] font-semibold text-success-foreground">
                Available now
              </span>
            </div>
            <div className="mt-8 font-display text-[clamp(3.25rem,6vw,4.5rem)] leading-none font-extrabold tracking-[-0.045em] text-foreground">
              $0
            </div>
            <p className="mt-4 text-[15px]/6 text-text-secondary">
              All six components, MIT licensed. No account, no seats.
            </p>
            <ul className="mt-8 space-y-3">
              {["All six components", "Full TypeScript source", "Both themes", "CLI install"].map((f) => (
                <li key={f} className="flex items-center gap-3 text-[15px] text-foreground">
                  <IconCheck className="size-4 shrink-0 text-success" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {PLANS.map((plan) => {
            const hero = plan.key === "lifetime";
            return (
              <div
                key={plan.key}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-[22px] p-7 sm:p-9",
                  hero
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground",
                )}
              >
                {hero && (
                  <div
                    aria-hidden
                    className="brand-glow pointer-events-none absolute -top-40 -right-40 size-120"
                  />
                )}
                <div className="relative flex items-center justify-between gap-3">
                  <h3 className="font-display text-[22px] font-bold tracking-[-0.02em]">
                    {plan.name}
                  </h3>
                  <span
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap",
                      hero ? "border-background/25" : "border-border",
                    )}
                  >
                    Coming soon
                  </span>
                </div>

                <div className="relative mt-8 flex items-baseline gap-2">
                  <span className="font-display text-[clamp(3.25rem,6vw,4.5rem)] leading-none font-extrabold tracking-[-0.045em] tabular-nums">
                    ${plan.price}
                  </span>
                  <span className={cn("text-[15px]", hero ? "text-background/60" : "text-text-muted")}>
                    {plan.per}
                  </span>
                </div>
                <p className={cn("relative mt-4 max-w-sm text-[15px]/6", hero ? "text-background/70" : "text-text-secondary")}>
                  {plan.blurb}
                </p>

                <ul className="relative mt-8 mb-10 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-[15px]">
                      <IconCheck className={cn("size-4 shrink-0", hero ? "text-brand" : "text-text-muted")} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled
                  className={cn(
                    "relative mt-auto inline-flex h-12 cursor-not-allowed items-center justify-center rounded-full text-[15px] font-medium",
                    hero
                      ? "bg-background/10 text-background/70"
                      : "border border-border text-text-muted",
                  )}
                >
                  Not on sale yet
                </button>
              </div>
            );
          })}
        </motion.div>

        <p className="mt-6 text-center text-[14px] text-text-muted">
          Prices in USD. Checkout opens through Creem when Pro launches.
        </p>
      </div>
    </section>
  );
}
