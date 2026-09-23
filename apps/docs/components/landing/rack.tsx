"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { IconArrowRight } from "@devigner-ui/icons";
import { cn } from "cn";
import { EASE_OUT } from "@devignerui/ui/motion";
import { CopyCommand } from "./copy-command";
import { LIVE_COMPONENTS } from "./live-previews";

export interface RackEntry {
  slug: string;
  name: string;
  description: string;
  category: string;
}

// Two-row rhythm on a 12-column grid: wide/narrow, then narrow/wide, so the
// big pieces never stack in one column. Stage heights are what each live
// component needs to breathe, not a shared number.
const LAYOUT: Record<string, { span: string; stage: string }> = {
  "date-range-picker": { span: "lg:col-span-7", stage: "min-h-148 items-center" },
  "menu-dock": { span: "lg:col-span-5", stage: "min-h-148 items-end pb-14" },
  "delete-button": { span: "lg:col-span-5", stage: "min-h-104 items-center" },
  "chart-card": { span: "lg:col-span-7", stage: "min-h-104 items-center" },
  timeline: { span: "lg:col-span-7", stage: "min-h-112 items-center" },
  "magnetic-button": { span: "lg:col-span-5", stage: "min-h-112 items-center" },
};

export function Rack({ entries }: { entries: RackEntry[] }) {
  const reduce = useReducedMotion();
  const bySlug = new Map(entries.map((e) => [e.slug, e]));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {LIVE_COMPONENTS.map((live, i) => {
        const meta = bySlug.get(live.slug);
        if (!meta) return null;
        const layout = LAYOUT[live.slug]!;
        const href = `/components/${live.slug}`;
        return (
          <motion.article
            key={live.slug}
            aria-labelledby={`rack-${live.slug}`}
            initial={reduce ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: (i % 2) * 0.08 }}
            className={cn(
              "group flex min-w-0 flex-col rounded-[30px] border border-border bg-background p-2 transition-[border-color,box-shadow] duration-300 ease-out hover:border-border-hover hover:shadow-elevated",
              layout.span,
            )}
          >
            {/* Stage - the component itself, live */}
            <div
              className={cn(
                "relative flex flex-1 justify-center overflow-hidden rounded-[22px] bg-background-100 px-4 pt-16 pb-8",
                layout.stage,
              )}
            >
              <div aria-hidden className="instrument-grid absolute inset-0" />
              <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                <span className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-text-tertiary">
                  {meta.category}
                </span>
                {/* ponytail: every shipped component is free today; give
                    LiveComponent a tier field when the first Pro one lands. */}
                <span className="rounded-md bg-success px-2 py-0.5 text-[12px] font-semibold text-success-foreground">
                  Free
                </span>
              </div>
              <div className="relative flex w-full justify-center">
                <live.Preview />
              </div>
            </div>

            {/* Plate - what it is, and how to get it */}
            <div className="flex flex-col gap-5 px-4 pt-5 pb-3 sm:px-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2
                    id={`rack-${live.slug}`}
                    className="font-display text-[26px] leading-tight font-bold tracking-[-0.03em] text-foreground"
                  >
                    <Link href={href} className="rounded-md hover:text-brand">
                      {meta.name}
                    </Link>
                  </h2>
                  <p className="mt-1.5 max-w-md text-[15px]/6 text-text-secondary">
                    {meta.description}
                  </p>
                </div>
                <Link
                  href={href}
                  aria-label={`${meta.name} docs`}
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-foreground transition-colors duration-200 hover:border-brand hover:bg-brand hover:text-brand-foreground"
                >
                  <IconArrowRight className="size-4.5" />
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                <CopyCommand
                  command={`npx devignerui add ${live.slug}`}
                  highlight={live.slug}
                  className="w-full"
                />
                <ul aria-label="Features" className="flex flex-wrap gap-1.5">
                  {live.features.map((f) => (
                    <li
                      key={f}
                      className="rounded-full bg-surface px-2.5 py-1 text-[12px] text-text-secondary"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
