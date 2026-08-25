"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@devignerui/ui";
import { Starburst } from "./starburst";
import { AsteriskMark } from "@/components/ui/asterisk-mark";
import { Check } from "reicon-react/icons/Check";
import { Copy } from "reicon-react/icons/Copy";

const command = "npx devignerui add button";

export function Hero({ children }: { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);



  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — leave the command selectable */
    }
  };

  return (
    <section
      className="relative flex min-h-dvh items-center overflow-hidden"
    >
      <div className="absolute inset-0 mesh-gradient" />
      <div className="pointer-events-none absolute top-[12%] left-[6%] size-125 rounded-full bg-accent/6 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-[6%] right-[6%] size-100 rounded-full bg-accent/4 blur-[130px]" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pt-24 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* The library IS the hero — real designs from one category, compared */}
          <div className="hero-stage scroll-exit min-w-0 lg:order-2">
            {children}
          </div>

          {/* Copy + CTA */}
          <div className="min-w-0 lg:order-1">
            <div
              data-fade
              className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted"
            >
              <Starburst className="size-3 text-accent" />
              React · Tailwind v4 · Copy-paste
            </div>

            <h1
              className="group/asterisk mt-6 font-sans text-[clamp(2.1rem,8.5vw,5.25rem)] font-semibold leading-[0.98] tracking-[-0.02em] text-foreground"
            >
              <span className="block">
                <span className="inline-block overflow-hidden align-bottom">
                  <span data-word className="inline-flex items-center gap-6">
                    Pick the{" "}
                    <AsteriskMark
                      ringText="DEVIGNER UI · DEVIGNER UI · "
                      className="size-[0.72em] text-accent"
                    />
                  </span>
                </span>{" "}
                <span className="inline-block overflow-hidden align-bottom">
                  <span data-word className="inline-block text-accent">
                    design.
                  </span>
                </span>
              </span>
              <span className="block">
                <span className="inline-block overflow-hidden align-bottom">
                  <span data-word className="inline-block text-text-tertiary">
                    Own the
                  </span>
                </span>{" "}
                <span className="inline-block overflow-hidden align-bottom">
                  <span data-word className="inline-block">
                    code.
                  </span>
                </span>
              </span>
            </h1>

            <p
              data-fade
              className="mt-7 max-w-md text-base/relaxed text-text-secondary sm:text-lg"
            >
              Every category ships more than one finished design — states,
              variants and motion already handled. Install the one that fits and
              it becomes yours: plain .tsx, no runtime dependency.
            </p>

            <div data-fade className="mt-9 flex flex-col gap-4">
              {/* Primary CTA */}
              <div className="flex items-center gap-3">
                <Link
                  href="/components"
                  className="inline-flex h-12 items-center rounded-2xl bg-foreground px-6 font-sans text-[14px] font-medium text-background transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.97]"
                >
                  Browse components
                </Link>
              </div>

              {/* Install snippet */}
              <div className="flex h-13 max-w-lg items-center gap-3 overflow-x-auto rounded-2xl border border-border bg-background-200/70 pl-5 pr-2 font-mono text-[13px] whitespace-nowrap">
                <span className="select-none text-accent">$</span>
                <code className="text-text-secondary">
                  npx devignerui add{" "}
                  <span className="font-semibold text-accent">button</span>
                </code>
                <Button
                  onClick={copyCommand}
                  aria-label={copied ? "Copied" : "Copy install command"}
                  className="ml-auto h-9 shrink-0 gap-1.5 rounded-xl px-3.5 font-sans text-[12px]"
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
