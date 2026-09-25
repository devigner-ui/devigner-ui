"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { IconAdd } from "@devigner-ui/icons";
import { cn } from "cn";
import { EASE_IN_OUT, EASE_OUT, SPRING_SWAP } from "devignerui/motion";

/** The accordion. Answers stay in the DOM while closed (height 0, inert), so
 *  the server HTML still carries every answer. */
export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  const reduce = useReducedMotion();
  const id = useId();
  // One answer open at a time; opening another closes the last.
  const [open, setOpen] = useState<number | null>(0);
  const toggle = (i: number) => setOpen((prev) => (prev === i ? null : i));

  // Reserve the height of the list with its longest answer open, so opening,
  // switching or closing never moves anything below. Each item minus its
  // answer region is its closed height, true even mid-animation.
  const list = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number>();
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const measure = () => {
      const rows = [...el.children] as HTMLElement[];
      const regions = rows.map((row) => row.querySelector<HTMLElement>("[role=region]")!);
      const closed = rows.reduce((sum, row, i) => sum + row.offsetHeight - regions[i].offsetHeight, 0);
      const gaps = parseFloat(getComputedStyle(el).rowGap) * (rows.length - 1);
      setMinHeight(closed + gaps + Math.max(...regions.map((r) => r.scrollHeight)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={list} style={{ minHeight }} className="mt-12 flex flex-col gap-2.5">
      {items.map((faq, i) => {
        const on = open === i;
        return (
          <div
            key={faq.question}
            className={cn(
              "rounded-[18px] border px-5 transition-colors duration-200 ease-out sm:px-6",
              on ? "border-border-hover bg-background-200" : "border-border bg-background-100",
            )}
          >
            <h3>
              <button
                type="button"
                aria-expanded={on}
                aria-controls={`${id}-${i}`}
                onClick={() => toggle(i)}
                className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-6 py-4 text-left text-[16px] font-medium tracking-[-0.01em] text-foreground outline-none focus-visible:underline"
              >
                {faq.question}
                <motion.span
                  aria-hidden
                  initial={false}
                  animate={{ rotate: on ? 45 : 0 }}
                  transition={reduce ? { duration: 0 } : SPRING_SWAP}
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border transition-colors duration-200 ease-out",
                    on
                      ? "border-foreground bg-foreground text-background"
                      : "border-border-hover text-text-secondary",
                  )}
                >
                  <IconAdd className="size-4" />
                </motion.span>
              </button>
            </h3>
            <motion.div
              id={`${id}-${i}`}
              role="region"
              inert={!on}
              initial={false}
              animate={on ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      // Opening and closing share one height curve, so while one
                      // answer closes and another opens their heights always sum
                      // to no more than the taller one and the list never grows.
                      height: { duration: 0.4, ease: EASE_IN_OUT },
                      opacity: on
                        ? { duration: 0.3, delay: 0.1, ease: EASE_OUT }
                        : { duration: 0.15, ease: EASE_OUT },
                    }
              }
              className="overflow-hidden"
            >
              <p className="max-w-2xl pr-10 pb-6 text-[15px]/7 text-text-secondary">
                {/* CSS variable names as code, so "--" never splits across lines. */}
                {faq.answer.split(/(--[\w-]+)/).map((part, j) =>
                  j % 2 ? (
                    <code key={j} className="font-mono text-[13.5px] whitespace-nowrap text-foreground">
                      {part}
                    </code>
                  ) : (
                    part
                  ),
                )}
              </p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
