"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const COMMAND = "npx devignerui add card --style spotlight";

const OUTPUT: { ok?: boolean; text: string }[] = [
  { ok: true, text: "components/ui/spotlight-card.tsx" },
  { ok: true, text: "lib/utils.ts" },
  { ok: true, text: "installed clsx, tailwind-merge" },
  { text: "Done. The code is yours now, edit anything." },
];

/**
 * Section pins while the install flow plays out, scrubbed to scroll:
 * the command types forward as you scroll down and untypes scrolling up.
 * Reduced motion: no pin, no hiding — the finished terminal just renders.
 */
export function CliTerminal() {
  const sectionRef = useRef<HTMLElement>(null);
  const commandRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const promptCaretRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = new SplitText(commandRef.current, { type: "chars" });
        const lines = gsap.utils.toArray<HTMLElement>(".terminal-line");

        // Hidden only when motion is allowed, so static users see everything.
        gsap.set(split.chars, { display: "none" });
        gsap.set(lines, { autoAlpha: 0, y: 8 });
        gsap.set(promptCaretRef.current, { autoAlpha: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=130%",
            pin: true,
            scrub: 1,
          },
        });

        // Type the command — display toggles let the caret hug the last char.
        tl.to(split.chars, {
          display: "inline-block",
          duration: 0.01,
          stagger: 0.05,
        })
          .to({}, { duration: 0.3 }) // beat before the output responds
          .to(lines, {
            autoAlpha: 1,
            y: 0,
            duration: 0.25,
            stagger: 0.3,
            ease: "power2.out",
          })
          // Hand the caret to a fresh prompt line.
          .set(caretRef.current, { autoAlpha: 0 })
          .to(promptCaretRef.current, { autoAlpha: 1, duration: 0.1 })
          .to({}, { duration: 0.4 }); // hold before unpin

        return () => split.revert();
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      className="section-editorial flex min-h-[100dvh] items-center"
    >
      <div className="mx-auto w-full max-w-3xl px-5 py-24">
        <div className="max-w-xl">
          <h2 className="font-display text-[clamp(2rem,4.5vw,3.5rem)] font-semibold uppercase leading-[0.98] tracking-[-0.02em] text-foreground">
            Own it in
            <br />
            <span className="text-accent">one command.</span>
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed text-text-secondary">
            The CLI copies the style&apos;s source straight into your project.
            No package to update, nothing to eject from.
          </p>
        </div>

        <div className="double-bezel mt-10">
          <div className="double-bezel-inner overflow-hidden bg-terminal">
            {/* Chrome */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="size-2.5 rounded-full bg-destructive/80" />
              <div className="size-2.5 rounded-full bg-warning/80" />
              <div className="size-2.5 rounded-full bg-success/80" />
              <span className="ml-2 font-mono text-[11px] text-terminal-muted">
                ~/your-app
              </span>
            </div>

            {/* Body — fixed height so typing never resizes the panel */}
            <div className="h-56 px-5 py-4 font-mono text-[13px]/7 sm:h-60">
              <div className="text-terminal-foreground">
                <span className="mr-2 select-none text-success">$</span>
                <span ref={commandRef} className="whitespace-pre-wrap">
                  {COMMAND}
                </span>
                <span
                  ref={caretRef}
                  aria-hidden
                  className="caret-blink ml-0.5 inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-terminal-foreground"
                />
              </div>

              <div className="mt-2">
                {OUTPUT.map((line) => (
                  <div
                    key={line.text}
                    className="terminal-line text-terminal-muted"
                  >
                    {line.ok && <span className="mr-2 text-success">✓</span>}
                    <span
                      className={
                        line.ok ? undefined : "text-terminal-foreground"
                      }
                    >
                      {line.text}
                    </span>
                  </div>
                ))}
              </div>

              <div
                ref={promptCaretRef}
                className="mt-4 text-terminal-foreground"
              >
                <span className="mr-2 select-none text-success">$</span>
                <span
                  aria-hidden
                  className="caret-blink inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-terminal-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
