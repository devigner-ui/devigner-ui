"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Starburst } from "./starburst";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Product thesis. Accent words carry the emphasis; the rest brighten on scroll.
const WORDS: { t: string; accent?: boolean }[] = [
  { t: "Every" },
  { t: "component" },
  { t: "arrives" },
  { t: "finished", accent: true },
  { t: "and" },
  { t: "ready." },
  { t: "Paste" },
  { t: "it" },
  { t: "in," },
  { t: "and" },
  { t: "the" },
  { t: "code" },
  { t: "is" },
  { t: "yours", accent: true },
  { t: "to" },
  { t: "keep." },
];

export function Manifesto() {
  const sectionRef = useRef<HTMLElement>(null);

  /* Words brighten from dim to full as the block scrolls through — scrubbed */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(".manifesto-word", {
          opacity: 1,
          ease: "none",
          stagger: 1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            end: "bottom bottom",
            scrub: true,
          },
        });
        gsap.to(".manifesto-burst", {
          rotation: 90,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".manifesto-word", { opacity: 1 });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="section-editorial flex min-h-[90vh] items-center py-28 sm:py-40"
    >
      <div className="mx-auto max-w-5xl px-5">
        <div className="mb-10 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
          <Starburst className="manifesto-burst size-3 text-accent" />
          The idea
        </div>
        <p className="font-display text-[clamp(2rem,5.5vw,4.25rem)] font-medium leading-[1.08] tracking-[-0.02em]">
          {WORDS.map((w, i) => (
            <span
              key={i}
              className={
                "manifesto-word inline-block opacity-15 " +
                (w.accent ? "text-accent" : "text-foreground")
              }
            >
              {w.t}
              {i < WORDS.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
