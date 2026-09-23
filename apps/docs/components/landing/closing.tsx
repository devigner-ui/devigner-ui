"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { MagneticButton } from "@devignerui/ui";
import { EASE_OUT } from "@devignerui/ui/motion";
import { BrandMark } from "./navbar";

export function ClosingCTA() {
  const router = useRouter();
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-t border-border py-28 sm:py-40">
      <div aria-hidden className="instrument-grid pointer-events-none absolute inset-0 opacity-70" />
      <div
        aria-hidden
        className="brand-glow pointer-events-none absolute top-1/2 left-1/2 size-200 -translate-1/2"
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1, ease: EASE_OUT }}
        className="relative mx-auto flex max-w-4xl flex-col items-center px-5 text-center"
      >
        <h2 className="font-display text-[clamp(2.75rem,7.5vw,6rem)] leading-[0.92] font-extrabold tracking-tighter text-balance text-foreground">
          Take all six. They're free.
        </h2>
        <p className="mt-7 max-w-md text-[17px]/7 text-text-secondary">
          Each one has a live docs page with its props and install steps. Pick
          one and have it in your project in under a minute.
        </p>
        <div className="mt-12">
          <MagneticButton
            href="/components"
            onClick={(e) => {
              e.preventDefault();
              router.push("/components");
            }}
            className="bg-brand text-[15px] text-brand-foreground"
          >
            Browse components
          </MagneticButton>
        </div>
      </motion.div>
    </section>
  );
}

const LINKS = [
  { label: "Components", href: "/components" },
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/#pricing" },
  { label: "GitHub", href: "https://github.com/devignerui/devignerui" },
  { label: "Twitter", href: "https://twitter.com/devignerui" },
];

export function SiteFooter() {
  return (
    <footer className="overflow-hidden border-t border-border">
      <div className="mx-auto max-w-7xl px-5 pt-14">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <BrandMark />
            <p className="mt-3 max-w-xs text-[14px] text-text-muted">
              Animated React components for Tailwind CSS. Free and MIT licensed.
            </p>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  {...(l.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="text-[14px] text-text-secondary transition-colors duration-200 hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* The wordmark, cropped by the page edge on purpose */}
        <div
          aria-hidden
          className="mt-16 mb-[-0.2em] font-display text-[clamp(4rem,21vw,19rem)] leading-[0.8] font-extrabold tracking-[-0.06em] text-surface-hover select-none"
        >
          devigner
        </div>
      </div>
      <div className="relative border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 p-5 text-[13px] text-text-muted sm:flex-row sm:justify-between">
          <span>© 2026 Devigner UI. MIT licensed.</span>
          <span>Built with React, Tailwind and Motion.</span>
        </div>
      </div>
    </footer>
  );
}
