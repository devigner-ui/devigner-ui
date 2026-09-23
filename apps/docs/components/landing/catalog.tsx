"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconArrowRight } from "@devigner-ui/icons";
import { cn } from "cn";
import {
  EASE_OUT,
  SPRING_LAYOUT,
  SPRING_PANEL,
  SPRING_RETRACT,
} from "@devignerui/ui/motion";
import { LIVE_COMPONENTS } from "./live-previews";

// The dock's menus grow upward, so it sits low on the stage to leave them room.
const STAGE_ALIGN: Partial<Record<string, string>> = {
  "menu-dock": "items-end pb-16",
};

export function Catalog() {
  const reduce = useReducedMotion();
  const [slug, setSlug] = useState(LIVE_COMPONENTS[0]!.slug);
  const active = LIVE_COMPONENTS.find((c) => c.slug === slug)!;

  return (
    <section id="components" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="max-w-2xl"
        >
          <h2 className="font-display text-[clamp(2.5rem,5.4vw,4.25rem)] leading-[0.98] font-extrabold tracking-[-0.04em] text-foreground">
            Try them first.
            <br />
            <span className="text-text-muted">Install the one you like.</span>
          </h2>
          <p className="mt-6 max-w-lg text-[17px]/7 text-text-secondary">
            These are the real components, running right here. Click around.
            What you see is exactly what the CLI gives you.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-10">
          {/* Index */}
          <ul
            aria-label="Components"
            className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-t lg:border-border lg:px-0"
          >
            {LIVE_COMPONENTS.map((c) => {
              const on = c.slug === slug;
              return (
                <li key={c.slug} className="shrink-0 lg:border-b lg:border-border">
                  <button
                    type="button"
                    onClick={() => setSlug(c.slug)}
                    aria-pressed={on}
                    aria-controls="catalog-stage"
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-full border px-4 py-2 text-left transition-colors duration-200 lg:rounded-none lg:border-0 lg:px-0 lg:py-5",
                      on
                        ? "border-foreground bg-foreground text-background lg:bg-transparent lg:text-foreground"
                        : "border-border text-text-tertiary hover:text-foreground",
                    )}
                  >
                    {on && (
                      <motion.span
                        layoutId="catalog-marker"
                        transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                        className="absolute top-1/2 -left-5 hidden h-8 w-1 -translate-y-1/2 rounded-full bg-brand lg:block"
                      />
                    )}
                    <span className="font-display text-[15px] font-bold tracking-[-0.02em] whitespace-nowrap lg:text-[28px] lg:tracking-[-0.035em]">
                      {c.name}
                    </span>
                    <IconArrowRight
                      className={cn(
                        "hidden size-5 transition-[opacity,transform] duration-300 ease-out lg:block",
                        "ml-auto",
                        on
                          ? "translate-x-0 text-brand opacity-100"
                          : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-60",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Stage */}
          <div
            id="catalog-stage"
            role="region"
            aria-label={`${active.name}, live preview`}
            className="relative flex min-h-136 flex-col overflow-hidden rounded-[28px] border border-border bg-background-100 lg:min-h-152"
          >
            <div aria-hidden className="instrument-grid absolute inset-0" />

            <div className="relative flex flex-wrap items-center gap-1.5 p-4">
              {active.features.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-border bg-background px-3 py-1 text-[12px] font-medium text-text-secondary"
                >
                  {f}
                </span>
              ))}
            </div>

            <div
              className={cn(
                "relative flex flex-1 justify-center px-4 py-6",
                STAGE_ALIGN[active.slug] ?? "items-center",
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.slug}
                  initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0, transition: SPRING_PANEL }}
                  exit={
                    reduce
                      ? { opacity: 0, transition: { duration: 0 } }
                      : { opacity: 0, scale: 0.98, transition: SPRING_RETRACT }
                  }
                  className="flex w-full justify-center"
                >
                  <active.Preview />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative flex flex-col gap-3 border-t border-border bg-background/70 px-5 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[15px]/6 text-foreground">{active.pitch}</p>
                <p className="mt-0.5 text-[13px] text-text-muted">
                  Try it: {active.tryIt}
                </p>
              </div>
              <Link
                href={`/components/${active.slug}`}
                className="group inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-foreground"
              >
                {active.name} docs
                <IconArrowRight className="size-4 text-brand transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
