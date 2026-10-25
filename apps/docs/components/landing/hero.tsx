import Link from "next/link";
import type { CSSProperties } from "react";
import { IconArrowRight } from "@devigner-ui/icons";
import type { CatalogEntry } from "@/lib/catalog-query";
import { CopyCommand } from "./copy-command";
import { HeroWindow } from "./hero-window";
import { NewBadge } from "../new-badge";

/** The entrance: each line rises on the CSS `rise` keyframes (so the server
 *  HTML animates before hydration), staggered by its --i. */
const line = (i: number) => ({ "--i": i }) as CSSProperties;

/** The hero window shows only the newest few; the rest live on /components. */
export const HERO_COUNT = 6;

export function Hero({ entries }: { entries: CatalogEntry[] }) {
  const newest = entries[0];

  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-36 lg:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-160 bg-[radial-gradient(42%_60%_at_50%_0%,var(--glow),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-7xl px-5 text-center">
        <Link
          href={`/components/${newest.slug}`}
          className="rise group inline-flex h-8 items-center gap-2.5 rounded-full border border-border bg-background-100/60 pr-3 pl-1 text-[13px] text-text-secondary transition-colors duration-200 ease-out hover:border-border-hover hover:text-foreground"
          style={line(0)}
        >
          <NewBadge />
          {newest.name}
          <IconArrowRight
            aria-hidden
            className="size-3.5 text-text-muted transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          />
        </Link>

        <h1 className="mx-auto mt-7 max-w-6xl text-[clamp(2.5rem,5vw,4rem)] leading-[1.03] font-semibold tracking-[-0.055em] text-balance text-foreground">
          <span className="rise block" style={line(1)}>
            Beautifully <span className="accent-word">Crafted</span> Animated
            React
          </span>{" "}
          <span className="rise block" style={line(2)}>
            Components for Developers
          </span>
        </h1>

        <p
          className="rise mx-auto mt-6 max-w-2xl text-[17px]/7 text-pretty text-text-secondary sm:text-[18px]/7.5"
          style={line(3)}
        >
          Hand-tuned motion, accessible by default, and installed as a .tsx file
          you own.
        </p>

        <div
          className="rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={line(4)}
        >
          <Link
            href="/components"
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-[14.5px] font-medium text-brand-foreground shadow-[inset_0_1px_0_var(--stage-light)] ring-1 ring-brand-hover transition-transform duration-200 ease-out active:scale-[0.97]"
          >
            Browse components
            <IconArrowRight
              aria-hidden
              className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </Link>
          <CopyCommand command="npx devignerui init" highlight="init" />
        </div>
      </div>

      <div className="rise relative mt-16 px-5 sm:mt-20" style={line(5)}>
        <HeroWindow entries={entries.slice(0, HERO_COUNT)} />
      </div>
    </section>
  );
}
