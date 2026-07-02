"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const PANELS: { title: string; body: string; visual: React.ReactNode }[] = [
  {
    title: "Own the output",
    body: "The CLI writes plain .tsx files into your repo. Uninstall us afterwards and everything keeps working.",
    visual: (
      <div className="mt-7 rounded-xl border border-border bg-background p-4 font-mono text-[12px]/6">
        <div className="text-text-muted">components/ui/</div>
        <div className="pl-4 text-foreground">
          spotlight-card.tsx
          <span className="ml-2 rounded-full bg-success/10 px-1.5 py-px text-[10px] font-medium text-success">
            added
          </span>
        </div>
        <div className="pl-4 text-foreground">
          button-magnetic.tsx
          <span className="ml-2 rounded-full bg-success/10 px-1.5 py-px text-[10px] font-medium text-success">
            added
          </span>
        </div>
        <div className="mt-1 text-text-muted">lib/</div>
        <div className="pl-4 text-foreground">utils.ts</div>
      </div>
    ),
  },
  {
    title: "Tailwind-native",
    body: "Styled with Tailwind v4 semantic tokens. Retheme every style at once by editing CSS variables, not components.",
    visual: (
      <div className="mt-7 grid grid-cols-2 gap-2.5">
        {(
          [
            ["--color-accent", "bg-accent"],
            ["--color-surface", "bg-surface"],
            ["--color-border", "bg-border"],
            ["--color-foreground", "bg-foreground"],
          ] as const
        ).map(([name, cls]) => (
          <div
            key={name}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5"
          >
            <span
              className={`size-4 shrink-0 rounded-full border border-border ${cls}`}
            />
            <code className="truncate text-[11px] text-text-secondary">
              {name}
            </code>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Framework-idiomatic",
    body: "Written the way you would write it: TypeScript, CVA variants, motion only where it earns its place.",
    visual: (
      <div className="mt-7 rounded-xl border border-border bg-background p-4 font-mono text-[12px]/6">
        <div>
          <span className="text-text-muted">&lt;</span>
          <span className="text-accent">Button</span>
        </div>
        <div className="pl-4">
          <span className="text-warning">variant</span>
          <span className="text-text-muted">=</span>
          <span className="text-success">&quot;magnetic&quot;</span>
        </div>
        <div className="pl-4">
          <span className="text-warning">size</span>
          <span className="text-text-muted">=</span>
          <span className="text-success">&quot;lg&quot;</span>
        </div>
        <div>
          <span className="text-text-muted">/&gt;</span>
        </div>
      </div>
    ),
  },
];

/**
 * Desktop: section pins and the track pans horizontally, scrubbed to scroll.
 * Mobile / reduced motion: plain vertical stack (gentle scrub reveal on mobile).
 */
export function Features() {
  const wrapRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const track = trackRef.current!;
          gsap.to(track, {
            x: () => -(track.scrollWidth - window.innerWidth),
            ease: "none",
            scrollTrigger: {
              trigger: wrapRef.current,
              start: "top top",
              end: () => `+=${track.scrollWidth - window.innerWidth}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        },
      );

      mm.add(
        "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
        () => {
          gsap.utils.toArray<HTMLElement>(".feature-panel").forEach((panel) => {
            gsap.from(panel, {
              y: 40,
              opacity: 0,
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                start: "top 92%",
                end: "top 62%",
                scrub: 1,
              },
            });
          });
        },
      );
    },
    { scope: wrapRef },
  );

  return (
    <section ref={wrapRef} className="section-editorial overflow-hidden">
      <div
        ref={trackRef}
        className="flex flex-col gap-6 px-5 py-24 lg:h-[100dvh] lg:flex-row lg:items-center lg:gap-10 lg:px-[8vw] lg:py-0"
      >
        {/* Intro block rides the track */}
        <div className="w-full shrink-0 lg:w-[38vw] lg:pr-12">
          <h2 className="text-3xl font-semibold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl">
            Why copy-paste
            <br />
            wins.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-text-secondary">
            A component library you install is a dependency. A component you
            paste is a starting point.
          </p>
        </div>

        {PANELS.map((panel) => (
          <div
            key={panel.title}
            className="feature-panel glass-card w-full shrink-0 rounded-3xl p-7 transition-[border-color] duration-300 hover:border-border-hover sm:p-8 lg:w-[clamp(420px,34vw,560px)]"
          >
            <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
              {panel.title}
            </h3>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-text-secondary">
              {panel.body}
            </p>
            {panel.visual}
          </div>
        ))}
      </div>
    </section>
  );
}
