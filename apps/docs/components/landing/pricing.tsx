"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconArrowRight, IconCheck } from "@devigner-ui/icons";
import { cn } from "cn";
import { SPRING_LAYOUT, SPRING_SWAP } from "devignerui/motion";
import { LogoX } from "../brand-logos";

/* Pricing: a giant Free, with what free covers beside
   it as a checklist, and Pro becomes a ticket: three stubs split by
   perforations, the price rolling between monthly and lifetime, the launch
   discount stamped on. Pro is posted, not sold, so the ticket's action is a
   notification. */

const PRO = {
  monthly: { label: "Monthly", price: "$5.99", per: "a month", was: "$9.99", sub: "Cancel whenever." },
  lifetime: { label: "Lifetime", price: "$179.99", per: "once", was: "$299.99", sub: "About two and a half years of Monthly." },
} as const;
type Plan = keyof typeof PRO;

const FREE = [
  "Every component in the library",
  "Commercial use included",
  "Install with the CLI or copy the file",
  "No account, no seat limits",
];

/** A perforation between two stubs: dashes, with a notch bitten out of the
 *  card's top and bottom edge. Each notch is a page-colored, bordered circle
 *  centered on the card's outer edge and clipped to its inner half, so what
 *  shows is the bite with the card's border running round it, and nothing
 *  outside the card. The card must not clip it (overflow clips inside the
 *  border, which would hide the bite's ends). Stacked on phones, just dashes. */
function Perforation() {
  const notch = "absolute left-1/2 hidden h-[13px] w-6 -translate-x-1/2 overflow-hidden md:block";
  const circle = "absolute left-0 size-6 rounded-full border border-border bg-background";
  return (
    <div aria-hidden className="relative mx-7 h-px border-t border-dashed border-border md:mx-0 md:h-auto md:w-px md:border-t-0 md:border-l">
      <span className={cn(notch, "-top-px")}>
        <span className={cn(circle, "-top-3")} />
      </span>
      <span className={cn(notch, "-bottom-px")}>
        <span className={cn(circle, "-bottom-3")} />
      </span>
    </div>
  );
}

/** Whole dollars as an odometer: the columns are right-aligned, so a digit
 *  that stays the same holds still and only the ones that change roll, up
 *  when the price rises and down when it falls. Columns the shorter price
 *  doesn't use fold away. */
function Odometer({ value, cols, dir }: { value: string; cols: number; dir: number }) {
  const reduce = useReducedMotion();
  const roll = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, y: `${d * 70}%` }),
    still: { opacity: 1, y: 0 },
    leave: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, y: `${d * -70}%` }),
  };
  return value
    .padStart(cols, " ")
    .split("")
    .map((c, i) => (
      <motion.span
        key={i}
        initial={false}
        animate={{ width: c === " " ? 0 : "auto" }}
        transition={reduce ? { duration: 0 } : SPRING_SWAP}
        className="relative inline-flex justify-end overflow-hidden"
      >
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          {c !== " " && (
            <motion.span
              key={c}
              custom={dir}
              variants={roll}
              initial="enter"
              animate="still"
              exit="leave"
              transition={reduce ? { duration: 0 } : { ...SPRING_SWAP, delay: (cols - 1 - i) * 0.04 }}
            >
              {c}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    ));
}

const dollars = (price: string) => price.slice(1).split(".")[0];

export function Pricing({ count }: { count: number }) {
  const reduce = useReducedMotion();
  const [plan, setPlan] = useState<Plan>("monthly");
  const pro = PRO[plan];
  const dir = plan === "lifetime" ? 1 : -1;

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-24 overflow-hidden border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-28 sm:py-36">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="font-mono text-[12.5px] text-text-muted">
              {count} components &middot; $0 &middot; forever
            </p>
            <h2
              id="pricing-title"
              className="mt-4 text-[clamp(6.5rem,19vw,17rem)] leading-[0.8] font-semibold tracking-[-0.08em] text-foreground"
            >
              {/* The period in the accent face too: Geist's square stop reads as a
                block at this size. */}
              <span className="accent-word">Free.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pb-4">
            <p className="max-w-md text-[18px]/8 text-pretty text-text-secondary">
              Every component on the site is yours, commercial work included. It stays that way.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {FREE.map((f) => (
                <li key={f} className="flex items-center gap-3 text-[15px] text-foreground">
                  <span aria-hidden className="grid size-5.5 shrink-0 place-items-center rounded-full bg-foreground text-background">
                    <IconCheck className="size-3" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/components"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-medium text-brand-foreground shadow-[inset_0_1px_0_var(--stage-light)] ring-1 ring-brand-hover transition-transform duration-200 ease-out active:scale-[0.97]"
              >
                Take one
                <IconArrowRight aria-hidden className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </Link>
              <Link href="/requests?new" className="text-[15px] font-medium text-text-secondary transition-colors duration-200 ease-out hover:text-foreground">
                Or request one
              </Link>
            </div>
          </div>
        </div>

        {/* The Pro ticket. */}
        <div className="relative mt-20 grid rounded-[26px] border border-border bg-linear-to-b from-background-100 to-background md:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1fr)_auto_minmax(0,0.8fr)]">
          <div className="p-7 sm:p-8">
            <div className="flex items-center gap-3">
              <h3 className="text-[22px] font-semibold tracking-[-0.03em] text-foreground">Pro</h3>
              <span className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-[12px] font-medium text-text-secondary">
                <span aria-hidden className="size-1.5 rounded-full border border-text-secondary" />
                Not on sale yet
              </span>
            </div>
            <p className="mt-3 max-w-xs text-[14.5px]/6 text-text-secondary">
              A separate paid set, with new Pro components as they ship. Nothing free moves behind it.
            </p>
          </div>

          <Perforation />

          <div className="relative p-7 sm:p-8">
            <div role="group" aria-label="Pro billing" className="inline-flex rounded-full border border-border bg-background p-1">
              {(Object.keys(PRO) as Plan[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={plan === k}
                  onClick={() => setPlan(k)}
                  className={cn(
                    "relative h-8 cursor-pointer rounded-full px-4 text-[13px] font-medium transition-colors duration-200 ease-out",
                    plan === k ? "text-background" : "text-text-muted hover:text-foreground",
                  )}
                >
                  {plan === k && (
                    <motion.span
                      aria-hidden
                      layoutId="d-ticket-plan"
                      transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                      className="absolute inset-0 rounded-full bg-foreground"
                    />
                  )}
                  <span className="relative">{PRO[k].label}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex h-15 items-end gap-2.5 overflow-hidden">
              <span className="sr-only">
                {pro.price} {pro.per}, was {pro.was}
              </span>
              <span aria-hidden className="inline-flex items-start leading-none font-semibold tracking-tighter text-foreground tabular-nums">
                <span className="mt-1.5 text-[24px] text-text-secondary">$</span>
                <span className="inline-flex text-[56px]">
                  <Odometer value={dollars(pro.price)} cols={3} dir={dir} />
                </span>
                <span className="mt-1.5 text-[24px]">.{pro.price.split(".")[1]}</span>
              </span>
              <span aria-hidden className="pb-1.5 text-[14px] text-text-muted">
                {pro.per}, was{" "}
                {/* Drawn strike: text-decoration doesn't reach the rolling
                    digits, which are inline blocks. */}
                <span className="relative inline-flex tabular-nums">
                  $<Odometer value={dollars(pro.was)} cols={3} dir={dir} />.{pro.was.split(".")[1]}
                  <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
                </span>
              </span>
            </div>
            <p className="mt-2 text-[13px] text-text-muted">{pro.sub}</p>
            {/* The launch discount, stamped on at a slant. */}
            <span className="absolute top-6 right-6 rotate-6 rounded-md border-2 border-brand px-2 py-0.5 font-mono text-[11px] font-semibold tracking-[0.06em] text-brand uppercase">
              40% off
            </span>
          </div>

          <Perforation />

          <div className="flex flex-col justify-center gap-3 p-7 sm:p-8">
            <a
              href="https://x.com/devignerui"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-[14.5px] font-medium text-background transition-transform duration-200 ease-out active:scale-[0.97]"
            >
              <LogoX className="size-3.5" />
              Get notified on X
            </a>
            <p className="text-center text-[12.5px] text-text-muted">Launch price for both plans.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
