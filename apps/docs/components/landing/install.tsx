"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { IconFolder } from "@devigner-ui/icons";
import { cn } from "cn";
import { EASE_OUT, SPRING_PANEL } from "@devignerui/ui/motion";

const COMMAND = "npx devignerui add date-range-picker";

// Verbatim from packages/cli/src/commands/add.ts, with the dependency line as
// the registry lists it for this component. Keep in step with both.
const OUTPUT: { text: string; tone?: "ok" | "dim" | "bright" }[] = [
  { text: "Adding components...", tone: "dim" },
  { text: "" },
  { text: "📦 date-range-picker", tone: "bright" },
  { text: "  ✓ components/ui/date-range-picker.tsx", tone: "ok" },
  { text: "" },
  { text: "  Install dependencies:", tone: "dim" },
  { text: "  npm i cn motion react @devigner-ui/icons @devignerui/ui" },
  { text: "" },
  { text: "Done!", tone: "bright" },
];

const TYPE_MS = 34;
const LINE_MS = 140;

const TREE: { name: string; depth: number; dir?: boolean; fresh?: boolean }[] = [
  { name: "your-app", depth: 0, dir: true },
  { name: "app", depth: 1, dir: true },
  { name: "components", depth: 1, dir: true },
  { name: "ui", depth: 2, dir: true },
  { name: "button.tsx", depth: 3 },
  { name: "date-range-picker.tsx", depth: 3, fresh: true },
  { name: "lib", depth: 1, dir: true },
  { name: "utils.ts", depth: 2 },
];

export function Install() {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(panelRef, { once: true, amount: 0.5 });

  // Two counters drive the whole transcript: characters typed, lines printed.
  const [typed, setTyped] = useState(0);
  const [lines, setLines] = useState(0);

  useEffect(() => {
    if (reduce) {
      setTyped(COMMAND.length);
      setLines(OUTPUT.length);
      return;
    }
    if (!inView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= COMMAND.length; i++) {
      timers.push(setTimeout(() => setTyped(i), 300 + i * TYPE_MS));
    }
    const typedAt = 300 + COMMAND.length * TYPE_MS + 380;
    OUTPUT.forEach((_, i) => {
      timers.push(setTimeout(() => setLines(i + 1), typedAt + i * LINE_MS));
    });
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  const done = lines === OUTPUT.length;

  return (
    <section className="relative border-y border-border bg-background-100 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
          className="lg:pt-10"
        >
          <h2 className="font-display text-[clamp(2.5rem,5.4vw,4.25rem)] leading-[0.98] font-extrabold tracking-[-0.04em] text-foreground">
            One command.
            <br />
            <span className="text-text-muted">Plain files.</span>
          </h2>
          <p className="mt-6 max-w-md text-[17px]/7 text-text-secondary">
            The CLI copies the component into components/ui as a normal .tsx
            file and tells you which packages it needs. After that, edit it
            like anything else you wrote.
          </p>
          <dl className="mt-10 grid max-w-md grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8">
            {[
              ["React 19", "typed, exported props"],
              ["Tailwind v4", "semantic tokens only"],
              ["Both themes", "no extra config"],
              ["Reduced motion", "respected in each one"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[15px] font-medium text-foreground">{k}</dt>
                <dd className="mt-1 text-[14px] text-text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <div ref={panelRef} className="relative min-w-0 sm:pb-44">
          {/* Terminal - dark in both themes, the way a terminal is */}
          <div className="overflow-hidden rounded-[22px] bg-terminal shadow-elevated ring-1 ring-border">
            <div className="flex items-center gap-2 border-b border-terminal-foreground/10 px-4 py-3">
              <span className="size-2.5 rounded-full bg-terminal-foreground/20" />
              <span className="size-2.5 rounded-full bg-terminal-foreground/20" />
              <span className="size-2.5 rounded-full bg-terminal-foreground/20" />
              <span className="ml-2 font-mono text-[11px] text-terminal-muted">~/your-app</span>
            </div>
            <div
              className="h-86 overflow-hidden px-5 py-4 font-mono text-[13px]/6 text-terminal-foreground"
              aria-live="off"
            >
              <p className="sr-only">
                {COMMAND}. {OUTPUT.map((l) => l.text).join(" ")}
              </p>
              <div aria-hidden>
                <div className="whitespace-pre-wrap break-all">
                  <span className="mr-2 text-brand-tertiary select-none">$</span>
                  {COMMAND.slice(0, typed)}
                  {typed < COMMAND.length && (
                    <span className="caret-blink ml-px inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-terminal-foreground" />
                  )}
                </div>
                {OUTPUT.slice(0, lines).map((l, i) => (
                  <div
                    key={i}
                    className={cn(
                      "min-h-6 whitespace-pre-wrap",
                      l.tone === "ok" && "text-success",
                      l.tone === "dim" && "text-terminal-muted",
                      l.tone === "bright" && "text-terminal-foreground",
                      !l.tone && "text-terminal-foreground/80",
                    )}
                  >
                    {l.text}
                  </div>
                ))}
                {done && (
                  <div>
                    <span className="mr-2 text-brand-tertiary select-none">$</span>
                    <span className="caret-blink inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-terminal-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* The result, landing in the tree - overlaps the terminal for depth */}
          <div className="relative mt-4 rounded-[20px] border border-border bg-background p-4 shadow-elevated sm:absolute sm:right-4 sm:bottom-0 sm:mt-0 sm:w-76 lg:-right-8">
            <ul className="font-mono text-[12.5px]/7">
              {TREE.map((n) => (
                <li
                  key={n.name}
                  style={{ paddingLeft: n.depth * 14 }}
                  className={cn(
                    "flex items-center gap-2",
                    n.dir ? "text-text-muted" : "text-text-secondary",
                  )}
                >
                  {n.dir && <IconFolder className="size-3.5 shrink-0" />}
                  {n.fresh ? (
                    <AnimatePresence initial={false}>
                      {done ? (
                        <motion.span
                          initial={reduce ? false : { opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={SPRING_PANEL}
                          className="flex items-center gap-2 text-foreground"
                        >
                          {n.name}
                          <span className="rounded-md bg-brand px-1.5 font-sans text-[10px]/4.5 font-semibold text-brand-foreground">
                            new
                          </span>
                        </motion.span>
                      ) : (
                        <span className="h-3 w-40 rounded-sm bg-surface-hover" />
                      )}
                    </AnimatePresence>
                  ) : (
                    n.name
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
