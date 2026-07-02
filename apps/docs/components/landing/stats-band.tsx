"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Real numbers — keep in sync with lib/registry.ts.
const STATS: { value?: number; text?: string; label: string }[] = [
  { value: 5, label: "Components" },
  { value: 15, label: "Complete styles" },
  { text: "MIT", label: "License" },
  { text: "Zero", label: "Config" },
];

export function StatsBand() {
  const sectionRef = useRef<HTMLElement>(null);

  /* Numbers tick up scrubbed to scroll; text cells just ride the reveal */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const st = {
          trigger: sectionRef.current,
          start: "top 95%",
          end: "top 55%",
          scrub: 1,
        };

        gsap.from(".stat-cell", {
          y: 24,
          opacity: 0,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: st,
        });

        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          gsap.from(el, {
            textContent: 0,
            snap: { textContent: 1 },
            ease: "none",
            scrollTrigger: st,
          });
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="section-editorial border-y border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`stat-cell px-5 py-12 text-center sm:py-14 ${
              i < 3 ? "lg:border-r lg:border-border" : ""
            } ${i % 2 === 0 ? "border-r border-border lg:border-r" : ""} ${
              i < 2 ? "border-b border-border lg:border-b-0" : ""
            }`}
          >
            <div className="text-3xl font-semibold tracking-[-0.04em] text-foreground tabular-nums sm:text-4xl">
              {stat.value !== undefined ? (
                <span data-count>{stat.value}</span>
              ) : (
                stat.text
              )}
            </div>
            <div className="mt-2 text-[13px] text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
