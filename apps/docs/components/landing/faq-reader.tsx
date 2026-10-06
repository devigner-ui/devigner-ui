"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconArrowRight } from "@devigner-ui/icons";
import { cn } from "cn";
import { SPRING_LAYOUT, SPRING_SWAP } from "devignerui/motion";
import { DISCORD_URL } from "../brand-logos";

/** A reader: the questions are a quiet list on the left, and the answer to
 *  the one you choose is set large on the right, like a page you are
 *  reading, so an answer never has to unfold inside a row. */

const pad = (n: number) => String(n).padStart(2, "0");

export function FaqReader({ items }: { items: { question: string; answer: string }[] }) {
  const reduce = useReducedMotion();
  const [at, setAt] = useState(0);
  const faq = items[at];

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const next = (at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    setAt(next);
    e.currentTarget.querySelectorAll("button")[next]?.focus();
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-24">
      <div>
        <h2
          id="faq-title"
          className="text-[clamp(1.75rem,2.6vw,2.25rem)] leading-[1.08] font-semibold tracking-[-0.04em] text-balance text-foreground"
        >
          Questions, before you <span className="accent-word">install</span>
        </h2>
        <div role="tablist" aria-orientation="vertical" aria-label="Questions" onKeyDown={onKey} className="mt-10 flex flex-col">
          {items.map((f, i) => {
            const on = i === at;
            return (
              <button
                key={f.question}
                type="button"
                role="tab"
                aria-selected={on}
                tabIndex={on ? 0 : -1}
                onClick={() => setAt(i)}
                className={cn(
                  "relative flex cursor-pointer items-baseline gap-4 py-3 pl-5 text-left text-[15.5px]/6 transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  on ? "text-foreground" : "text-text-muted hover:text-foreground",
                )}
              >
                {on && (
                  <motion.span
                    aria-hidden
                    layoutId="faq-reader-bar"
                    transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand"
                  />
                )}
                <span className="font-mono text-[11.5px] text-text-muted tabular-nums">{pad(i + 1)}</span>
                {f.question}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" aria-live="polite" className="lg:sticky lg:top-32 lg:self-start lg:pt-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={at}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={SPRING_SWAP}
          >
            <p className="font-mono text-[12px] text-text-muted tabular-nums">
              {pad(at + 1)} / {pad(items.length)}
            </p>
            <p className="mt-3 text-[15px] text-text-tertiary">{faq.question}</p>
            <p className="mt-6 text-[clamp(1.4rem,2.3vw,2.05rem)] leading-[1.32] font-medium tracking-tight text-pretty text-foreground">
              {faq.answer}
            </p>
          </motion.div>
        </AnimatePresence>
        {/* The other answers stay in the server HTML, hidden, like the
            closed rows of an accordion. */}
        {items.map((f, i) => i !== at && <p key={f.question} hidden>{f.answer}</p>)}
        <p className="mt-14 text-[14.5px] text-text-muted">
          Still wondering?{" "}
          <a
            href="https://x.com/devignerui"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1 font-medium text-foreground"
          >
            Ask @devignerui on X
            <IconArrowRight aria-hidden className="size-3.5 text-brand transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </a>{" "}
          or{" "}
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 font-medium text-foreground">
            in the Discord
            <IconArrowRight aria-hidden className="size-3.5 text-brand transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </a>
        </p>
      </div>
    </div>
  );
}
