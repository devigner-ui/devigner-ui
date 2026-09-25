"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { IconArrowRight, IconArrowUp } from "@devigner-ui/icons";
import { useHoverCapable } from "devignerui/hooks";
import { SPRING_PRESS } from "devignerui/motion";
import { cn } from "cn";
import { CopyCommand } from "./copy-command";
import { LogoX } from "../brand-logos";
import { LogoMark } from "../logo-mark";
import { Wordmark } from "./navbar";
import { components } from "@/lib/registry";

// Every component by name: real internal links, one per page in the library.
const COMPONENT_LINKS = Object.values(components)
  .map((c) => ({ label: c.name, href: `/components/${c.slug}` }))
  .sort((x, y) => x.label.localeCompare(y.label));

const GROUPS = [
  { title: "Components", links: COMPONENT_LINKS },
  {
    title: "Library",
    links: [
      { label: "All components", href: "/components" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "More from Devigner",
    links: [{ label: "Devigner Icons", href: "https://icons.devigner.cc" }],
  },
];

// Evaluated at build for the static HTML; the browser agrees except across
// a New Year, which suppressHydrationWarning covers.
const YEAR = new Date().getFullYear();

/** The giant wordmark, pressed into the page. A fine pointer makes the letter
 *  under it bow (its neighbours at half strength), then spring back. */
function PressedWordmark() {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const [hovered, setHovered] = useState<number | null>(null);
  const live = canHover && !reduce;

  return (
    <div aria-hidden className="@container mt-20 select-none">
      <div
        onPointerLeave={() => setHovered(null)}
        className="wordmark-pressed mb-[-0.07em] font-display text-[27cqi] leading-[0.8] font-extrabold tracking-[-0.06em] whitespace-nowrap"
      >
        {[..."devigner."].map((letter, i) => {
          const distance = hovered === null ? Infinity : Math.abs(i - hovered);
          const k = !live ? 0 : distance === 0 ? 1 : distance === 1 ? 0.5 : 0;
          return (
            <motion.span
              key={i}
              onPointerEnter={() => live && setHovered(i)}
              animate={{ y: 10 * k, rotate: -5 * k }}
              transition={SPRING_PRESS}
              className={
                i === 8
                  ? "inline-block origin-bottom text-brand"
                  : "inline-block origin-bottom"
              }
            >
              {letter}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

/** The closing line before the footer: the hero's two actions again. */
export function LastCall() {
  return (
    <section
      aria-labelledby="last-call-title"
      className="border-t border-border py-24 sm:py-28"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2
            id="last-call-title"
            className="text-[clamp(2rem,3.6vw,2.875rem)] leading-[1.04] font-semibold tracking-tighter text-balance text-foreground"
          >
            Start with one <span className="accent-word">component</span>.
          </h2>
          <p className="mt-4 max-w-xl text-[17px]/7 text-pretty text-text-secondary">
            Pick any of them, run one command, and edit it like the rest of your
            code.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <CopyCommand command="npx devignerui init" highlight="init" />
          <Link
            href="/components"
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-[14.5px] font-medium text-brand-foreground shadow-[inset_0_1px_0_var(--stage-light)] ring-1 ring-brand-hover transition-transform duration-200 ease-out active:scale-[0.97]"
          >
            Browse components
            <IconArrowRight
              aria-hidden
              className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="overflow-hidden border-t border-border">
      <div className="mx-auto max-w-7xl px-5 pt-20">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 lg:col-span-5">
            <Link
              href="/"
              aria-label="Devigner UI home"
              className="inline-flex items-center gap-2.5 rounded-lg"
            >
              <LogoMark className="h-8 w-auto" />
              <Wordmark />
            </Link>
            <p className="mt-5 max-w-sm text-[15px]/6 text-pretty text-text-secondary">
              Animated React components for Tailwind CSS. Free, MIT licensed,
              and yours to edit once they&apos;re in your repo.
            </p>
            <CopyCommand
              command="npx devignerui init"
              highlight="init"
              className="mt-7 w-full sm:w-80"
            />
            <a
              href="https://x.com/devignerui"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-3 inline-flex h-11 w-full items-center gap-3 rounded-full border border-border bg-background-100 pr-4 pl-1.5 text-[13.5px] text-text-secondary transition-colors duration-200 ease-out hover:border-border-hover hover:text-foreground sm:w-fit sm:max-w-full"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-background">
                <LogoX className="size-3.5" />
              </span>
              <span className="min-w-0 truncate">
                Follow{" "}
                <span className="font-medium text-foreground">@devignerui</span>{" "}
                for new components
              </span>
              <IconArrowRight
                aria-hidden
                className="ml-auto size-3.5 shrink-0 -rotate-45 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-7">
            {GROUPS.map((group) => (
              // On phones the long components list takes the full row.
              <nav
                key={group.title}
                aria-label={group.title}
                className={
                  group.links === COMPONENT_LINKS
                    ? "max-sm:col-span-2"
                    : undefined
                }
              >
                <p className="text-[13px] font-medium text-foreground">
                  {group.title}
                </p>
                <ul className="mt-4 space-y-0.5">
                  {group.links.map((l) => {
                    const external = l.href.startsWith("http");
                    return (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          {...(external
                            ? { target: "_blank", rel: "noopener" }
                            : {})}
                          className="group inline-flex min-h-9 items-center gap-1.5 text-[14.5px] whitespace-nowrap text-text-secondary transition-colors duration-200 ease-out hover:text-foreground"
                        >
                          {l.label}
                          {/* Off-site links point up and out, and always show it. */}
                          <IconArrowRight
                            aria-hidden
                            className={cn(
                              "size-3.5 text-brand transition-[opacity,translate] duration-200 ease-out",
                              external
                                ? "-rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                            )}
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <PressedWordmark />
      </div>

      <div className="relative border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 text-[13px] text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <span suppressHydrationWarning>
            &copy; {YEAR} Devigner UI. Released under the MIT license.
          </span>
          <span className="flex items-center justify-between gap-5 sm:justify-end">
            Built by
            <a className="-ml-4 hover:underline" href="https://devigner.cc">
              devigner
            </a>
            <a
              href="#"
              aria-label="Back to top"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-text-secondary transition-colors duration-200 ease-out hover:border-border-hover hover:bg-surface-hover hover:text-foreground"
            >
              <IconArrowUp aria-hidden className="size-4" />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
