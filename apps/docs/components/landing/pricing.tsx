"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconCheck } from "@devigner-ui/icons";
import { cn } from "cn";
import { SPRING_LAYOUT, SPRING_SWAP } from "devignerui/motion";
import { LogoX } from "../brand-logos";

// ponytail: Pro is posted but not sold. The Creem checkout route
// (/api/checkout) is untouched; wiring a plan back up is a POST of
// { plan, billing } from a button here.
const PLANS = {
  monthly: {
    label: "Monthly",
    price: "$5.99",
    was: "$9.99",
    per: "a month",
    sub: "Cancel whenever. Lifetime is one payment of $179.99.",
    features: [
      "Everything in Free",
      "Every Pro component while you're subscribed",
      "New Pro components as they ship",
      "Priority support",
    ],
  },
  lifetime: {
    label: "Lifetime",
    price: "$179.99",
    was: "$299.99",
    per: "once",
    sub: "About two and a half years of Monthly, then it's paid for good.",
    features: [
      "Everything in Free",
      "Every Pro component, including future ones",
      "One payment, no renewal",
    ],
  },
} as const;

const FREE = [
  "Every component in the library",
  "Commercial use included",
  "Install with the CLI or copy the file",
  "Light and dark themes out of the box",
];

type Plan = keyof typeof PLANS;

// ponytail: one launch discount for both plans; per-plan if they ever differ.
const LAUNCH_OFF = "40% off";

/** A price set in the logo face: the dollar sign and cents sit smaller, so
 *  the whole number carries the weight. */
function Price({ value }: { value: string }) {
  const money = value.startsWith("$");
  const [whole, cents] = (money ? value.slice(1) : value).split(".");
  return (
    <span className="inline-flex items-start font-display leading-none font-bold tracking-[-0.045em] text-foreground tabular-nums">
      {money && (
        <span className="mt-1.5 mr-0.5 text-[26px] text-text-secondary">$</span>
      )}
      <span className="text-[60px]">{whole}</span>
      {cents && <span className="mt-1.5 text-[26px]">.{cents}</span>}
    </span>
  );
}

function Features({ items, pro }: { items: readonly string[]; pro?: boolean }) {
  return (
    <ul className="mt-7 space-y-3 border-t border-border pt-6">
      {items.map((f) => (
        <li
          key={f}
          className="flex items-start gap-3 text-[14.5px]/6 text-text-secondary"
        >
          <span
            aria-hidden
            className={cn(
              "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
              pro
                ? "bg-brand/20 text-brand"
                : "bg-surface-hover text-foreground",
            )}
          >
            <IconCheck className="size-3" />
          </span>
          {f}
        </li>
      ))}
    </ul>
  );
}

function Badge({
  live,
  children,
}: {
  live?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-[12px] font-medium text-text-secondary">
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          live ? "bg-success" : "border border-text-secondary",
        )}
      />
      {children}
    </span>
  );
}

export function Pricing() {
  const reduce = useReducedMotion();
  const [plan, setPlan] = useState<Plan>("monthly");
  const current = PLANS[plan];
  const roll = (dir: number) =>
    reduce ? { opacity: 0 } : { opacity: 0, y: `${dir * 40}%` };

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="scroll-mt-24 border-t border-border py-24 text-center sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-5">
        <h2
          id="pricing-title"
          className="text-[clamp(2rem,3.6vw,2.875rem)] leading-[1.04] font-semibold tracking-tighter text-balance text-foreground"
        >
          Free today, and it stays <span className="accent-word">free</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[17px]/7 text-pretty text-text-secondary">
          Every component on the site is yours to use, commercial work included.
          Pro will be a separate paid set, and nothing free moves behind it.
        </p>

        <div
          role="group"
          aria-label="Pro billing"
          className="mt-8 inline-flex rounded-full border border-border bg-background-100 p-1"
        >
          {(Object.keys(PLANS) as Plan[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={plan === key}
              onClick={() => setPlan(key)}
              className={cn(
                "relative cursor-pointer inline-flex h-9 items-center gap-1.5 rounded-full px-4.5 text-[13.5px] font-medium transition-colors duration-200 ease-out",
                plan === key
                  ? "text-background"
                  : "text-text-muted hover:text-foreground",
              )}
            >
              {plan === key && (
                <motion.span
                  aria-hidden
                  layoutId="pricing-plan"
                  transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                  className="absolute inset-0 rounded-full bg-foreground"
                />
              )}
              <span className="relative">{PLANS[key].label}</span>
              {key === "lifetime" && (
                <span
                  className={cn(
                    "relative text-[11px] text-brand",
                    plan === key && "text-blue-700",
                  )}
                >
                  pay once
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-11 grid max-w-230 grid-cols-1 gap-4 text-left md:grid-cols-2">
          <div className="relative flex flex-col rounded-[26px] border border-border bg-linear-to-b from-background-100 to-background p-7 sm:p-8">
            <span
              aria-hidden
              className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-foreground/15 to-transparent"
            />
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
                Free
              </h3>
              <Badge live>Available now</Badge>
            </div>
            {/* Same height as Pro's launch line, so the two prices line up. */}
            <p className="mt-6 flex h-6 items-center text-[12.5px] font-medium text-text-muted">
              No sign-up needed
            </p>
            <p className="mt-2 flex h-15 items-end gap-2">
              <Price value="FREE" />
              <span className="pb-1 text-[15px] text-text-muted">forever</span>
            </p>
            <p className="mt-3 min-h-12 text-[14.5px]/6 text-text-secondary">
              Everything on the site, with no account and no seat limits.
            </p>
            <Link
              href="/components"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground text-[14.5px] font-medium text-background transition-transform duration-200 ease-out active:scale-[0.98]"
            >
              Browse components
            </Link>
            <Features items={FREE} />
          </div>

          <div className="relative flex flex-col rounded-[26px] border border-brand/40 bg-[radial-gradient(90%_60%_at_100%_0%,var(--glow),transparent_60%)] bg-background-100 p-7 shadow-[0_30px_80px_-40px_var(--brand)] sm:p-8">
            <span
              aria-hidden
              className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-brand to-transparent"
            />
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
                Pro
              </h3>
              <Badge>Not on sale yet</Badge>
            </div>
            <div className="mt-6 flex h-6 items-center gap-2.5 overflow-hidden">
              <span className="rounded-full bg-brand px-2 py-0.5 text-[11.5px]/4 font-semibold text-brand-foreground">
                {LAUNCH_OFF}
              </span>
              <span className="text-[12.5px] font-medium text-text-muted">
                Launch price, was
              </span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.s
                  key={plan}
                  initial={roll(1)}
                  animate={{ opacity: 1, y: 0 }}
                  exit={roll(-1)}
                  transition={SPRING_SWAP}
                  className="font-display text-[14px] font-semibold text-text-muted tabular-nums"
                >
                  {current.was}
                </motion.s>
              </AnimatePresence>
            </div>
            <div className="mt-2 flex h-15 items-end overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={plan}
                  initial={roll(1)}
                  animate={{ opacity: 1, y: 0 }}
                  exit={roll(-1)}
                  transition={SPRING_SWAP}
                  className="flex items-end gap-2"
                >
                  <Price value={current.price} />
                  <span className="pb-1 text-[15px] text-text-muted">
                    {current.per}
                  </span>
                </motion.p>
              </AnimatePresence>
            </div>
            <p className="mt-3 min-h-12 text-[14.5px]/6 text-text-secondary">
              {current.sub}
            </p>
            <a
              href="https://x.com/devignerui"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand text-[14.5px] font-medium text-brand-foreground shadow-[0_10px_30px_-12px_var(--brand)] transition-[transform,filter] duration-200 ease-out hover:brightness-110 active:scale-[0.98]"
            >
              <LogoX className="size-3.5" />
              Get notified on X
            </a>
            <Features items={current.features} pro />
          </div>
        </div>
      </div>
    </section>
  );
}
