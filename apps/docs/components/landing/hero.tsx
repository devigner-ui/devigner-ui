"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { Button } from "@devignerui/ui";
import { Starburst } from "./starburst";
import { HeroCarousel } from "./hero-carousel";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

// Spring-like eases — registered once, referenced by name in tweens.
if (typeof window !== "undefined") {
  CustomEase.create("hero-out", "0.16,1,0.3,1");
  CustomEase.create("hero-spring", "0.34,1.56,0.64,1");
}

const command = "npx devignerui add button";

export function Hero() {
  const [copied, setCopied] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const copyColRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const burstRef = useRef<SVGSVGElement>(null);

  /* Entrance reveal + scroll-scrubbed exit */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const words =
          headlineRef.current?.querySelectorAll<HTMLElement>("[data-word]");

        gsap
          .timeline({ defaults: { ease: "hero-out" } })
          .from(stageRef.current, {
            y: 48,
            opacity: 0,
            scale: 0.97,
            filter: "blur(10px)",
            duration: 0.9,
            clearProps: "filter",
          })
          // Headline words rise out of a clip mask — editorial reveal.
          .from(
            words ?? [],
            {
              yPercent: 120,
              duration: 0.9,
              stagger: 0.08,
            },
            0.1,
          )
          .from(
            copyColRef.current!.querySelectorAll("[data-fade]"),
            {
              y: 24,
              opacity: 0,
              filter: "blur(6px)",
              duration: 0.7,
              stagger: 0.1,
              clearProps: "filter",
            },
            0.35,
          )
          // Brand glyph spins in once with the headline, then rests.
          .from(
            burstRef.current,
            { rotation: -160, scale: 0.4, opacity: 0, duration: 0.9 },
            0.5,
          );

        // Exit tracks physical scroll, not a clock.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
            defaults: { ease: "none" },
          })
          .to(stageRef.current, { y: -90, scale: 0.96, opacity: 0.35 }, 0)
          .to(copyColRef.current, { y: -50, opacity: 0.3 }, 0);
      });
    },
    { scope: sectionRef },
  );

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
      ref={sectionRef}
      className="relative flex min-h-[100dvh] items-center overflow-hidden"
    >
      <div className="absolute inset-0 mesh-gradient" />
      <div className="pointer-events-none absolute top-[12%] left-[6%] size-125 rounded-full bg-accent/6 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-[6%] right-[6%] size-100 rounded-full bg-accent/4 blur-[130px]" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pt-24 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* The library IS the hero — an ambient carousel of real components */}
          <div ref={stageRef} className="min-w-0 lg:order-2">
            <HeroCarousel />
          </div>

          {/* Copy + CTA */}
          <div ref={copyColRef} className="min-w-0 lg:order-1">
            <div
              data-fade
              className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted"
            >
              <Starburst className="size-3 text-accent" />
              Production-Ready Motion UI, Built to Flex
            </div>

            <h1
              ref={headlineRef}
              className="mt-6 font-sans text-[clamp(2.1rem,8.5vw,5.25rem)] font-semibold leading-[0.98] tracking-[-0.02em] text-foreground"
            >
              <span className="block">
                <span className="inline-block overflow-hidden align-bottom">
                  <span data-word className="inline-block">
                    React UI
                  </span>
                </span>{" "}
                <span className="inline-block overflow-hidden align-bottom">
                  <span data-word className="inline-block text-accent">
                    Components
                  </span>
                </span>
              </span>
              <span className="block">
                <span className="inline-block overflow-hidden align-bottom">
                  <span data-word className="inline-block text-text-tertiary">
                    for Modern
                  </span>
                </span>{" "}
                <span className="inline-block overflow-hidden align-bottom">
                  <span data-word className="inline-block">
                    Developers
                  </span>
                </span>{" "}
                <Starburst
                  ref={burstRef}
                  className="inline-block size-[0.7em] align-middle text-accent"
                />
              </span>
            </h1>

            <p
              data-fade
              className="mt-7 max-w-md text-base/relaxed text-text-secondary sm:text-lg"
            >
              Multi-style, copy-paste-first React components. Stop relying on
              one-size-fits-all libraries. Go from zero to styled in under 60
              seconds via the CLI.
            </p>

            <div data-fade className="mt-9 flex flex-col gap-4">
              {/* Primary CTA */}
              <div className="flex items-center gap-3">
                <Link
                  href="/components"
                  className="inline-flex h-12 items-center rounded-2xl bg-foreground px-6 font-sans text-[14px] font-medium text-background transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.97]"
                >
                  Start Building for Free
                </Link>
                <Link
                  href="/components"
                  className="group inline-flex h-12 items-center gap-1.5 rounded-2xl border border-border bg-background-200/70 px-6 text-[14px] font-medium text-text-secondary transition-colors duration-200 hover:text-foreground hover:border-border-hover"
                >
                  Browse Blocks
                  <svg
                    className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
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
                    <svg
                      className="size-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="size-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.8"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                      />
                    </svg>
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
