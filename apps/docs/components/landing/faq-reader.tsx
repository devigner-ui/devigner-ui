"use client";

import { Fragment, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconLink,
} from "@devigner-ui/icons";
import { cn } from "cn";
import { SPRING_LAYOUT, SPRING_PANEL, SPRING_SWAP } from "devignerui/motion";
import { DISCORD_URL, LogoDiscord, LogoX } from "../brand-logos";

/* The FAQ reader: questions left, the answer set large on the right. Every
   answer has its own link (#faq-3) that
   opens it, prev and next step through with the arrow keys, commands in the
   answers are set as code, and on phones the answer opens under its question
   instead of far below the list. */

type Faq = { question: string; answer: string };

const pad = (n: number) => String(n).padStart(2, "0");

/** Commands and paths in an answer, set as code. */
function Prose({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(npx devignerui (?:init|add)|components\/ui|"use client")/)
        .map((part, i) =>
          i % 2 ? (
            <code
              key={i}
              className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[0.78em] font-normal tracking-normal text-foreground ring-1 ring-border"
            >
              {part}
            </code>
          ) : (
            <Fragment key={i}>{part}</Fragment>
          ),
        )}
    </>
  );
}

function useIsWide() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

export function FaqReader({ items }: { items: Faq[] }) {
  const reduce = useReducedMotion();
  const wide = useIsWide();
  const [at, setAt] = useState(0);
  const [copied, setCopied] = useState(false);

  // A #faq-n link opens that answer.
  useEffect(() => {
    const read = () => {
      const m = /^#faq-(\d+)$/.exec(window.location.hash);
      const n = m ? Number(m[1]) - 1 : -1;
      if (n >= 0 && n < items.length) setAt(n);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [items.length]);

  const go = (next: number) => {
    const n = (next + items.length) % items.length;
    setAt(n);
    history.replaceState(null, "", `#faq-${n + 1}`);
  };

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const next =
      (at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    go(next);
    e.currentTarget
      .querySelectorAll<HTMLButtonElement>("button[role=tab]")
      [next]?.focus();
  };

  const copyLink = () =>
    navigator.clipboard
      .writeText(`${location.origin}${location.pathname}#faq-${at + 1}`)
      .then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        },
        () => {},
      );

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="scroll-mt-24 border-t border-border px-5 py-28 sm:py-36"
    >
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-20">
        <div>
          <h2
            id="faq-title"
            className="text-[clamp(1.75rem,2.6vw,2.25rem)] leading-[1.08] font-semibold tracking-[-0.04em] text-balance text-foreground"
          >
            Questions, before you <span className="accent-word">install</span>
          </h2>
          <p className="mt-3 text-[14px] text-text-muted">
            {items.length} answers. Up and down arrows move through them.
          </p>
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Questions"
            onKeyDown={onKey}
            className="mt-9 flex flex-col"
          >
            {items.map((f, i) => {
              const on = i === at;
              return (
                <div
                  key={f.question}
                  className="border-b border-border first:border-t lg:border-0 lg:first:border-t-0"
                >
                  <button
                    type="button"
                    role="tab"
                    id={`faq-tab-${i}`}
                    aria-selected={on}
                    aria-controls="faq-panel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => go(i)}
                    className={cn(
                      "group relative flex w-full cursor-pointer items-baseline gap-4 py-3.5 pl-5 text-left text-[15.5px]/6 outline-none transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-brand",
                      on
                        ? "text-foreground"
                        : "text-text-muted hover:text-foreground",
                    )}
                  >
                    {on && (
                      <motion.span
                        aria-hidden
                        layoutId="d-faq-bar"
                        transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                        className="absolute inset-y-2.5 left-0 w-0.5 rounded-full bg-brand"
                      />
                    )}
                    <span
                      className={cn(
                        "font-mono text-[11.5px] tabular-nums transition-colors duration-200 ease-out",
                        on ? "text-brand" : "text-text-muted",
                      )}
                    >
                      {pad(i + 1)}
                    </span>
                    <span className="transition-transform duration-300 ease-overshoot group-hover:translate-x-0.5">
                      {f.question}
                    </span>
                  </button>
                  {/* Phones: the answer opens right under its question. */}
                  {!wide && (
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.div
                          initial={
                            reduce ? { opacity: 0 } : { height: 0, opacity: 0 }
                          }
                          animate={{ height: "auto", opacity: 1 }}
                          exit={
                            reduce ? { opacity: 0 } : { height: 0, opacity: 0 }
                          }
                          transition={SPRING_PANEL}
                          className="overflow-hidden"
                        >
                          <p className="pb-5 pl-5 text-[16px]/7 text-text-secondary">
                            <Prose text={f.answer} />
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {wide && (
          <div
            id="faq-panel"
            role="tabpanel"
            aria-labelledby={`faq-tab-${at}`}
            className="self-start"
          >
            <div className="relative overflow-hidden rounded-[26px] border border-border bg-linear-to-b from-background-100 to-background p-9">
              <span
                aria-hidden
                className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-foreground/15 to-transparent"
              />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5" aria-hidden>
                  {items.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 rounded-full transition-all duration-300 ease-out",
                        i === at ? "w-6 bg-brand" : "w-1.5 bg-border-hover",
                      )}
                    />
                  ))}
                </div>
                <span className="font-mono text-[12px] text-text-muted tabular-nums">
                  {pad(at + 1)} / {pad(items.length)}
                </span>
              </div>
              {/* Every answer sits in the same cell, so the card is always as
                  tall as the longest one and never jumps; only the shown one
                  is visible, focusable and read out. */}
              <div className="relative mt-8 grid">
                {items.map((f, i) => {
                  const on = i === at;
                  return (
                    <motion.div
                      key={f.question}
                      aria-hidden={!on}
                      inert={!on}
                      initial={false}
                      animate={
                        on
                          ? { opacity: 1, y: 0, filter: "blur(0px)" }
                          : reduce
                            ? { opacity: 0 }
                            : {
                                opacity: 0,
                                y: i < at ? -10 : 10,
                                filter: "blur(6px)",
                              }
                      }
                      transition={SPRING_SWAP}
                      className={cn(
                        "col-start-1 row-start-1",
                        !on && "pointer-events-none",
                      )}
                    >
                      <p className="text-[15px] text-text-tertiary">
                        {f.question}
                      </p>
                      <p className="mt-5 text-[clamp(1.3rem,2.1vw,1.85rem)] leading-[1.38] font-medium tracking-tight text-pretty text-foreground">
                        <Prose text={f.answer} />
                      </p>
                    </motion.div>
                  );
                })}
              </div>
              <div className="relative mt-8 flex items-center gap-2 border-t border-border pt-6">
                <button
                  type="button"
                  aria-label="Previous question"
                  onClick={() => go(at - 1)}
                  className="grid size-9 cursor-pointer place-items-center rounded-full border border-border text-text-secondary transition-[color,border-color,scale] duration-200 ease-out hover:border-border-hover hover:text-foreground active:scale-[0.94]"
                >
                  <IconArrowLeft aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(at + 1)}
                  className="group inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border pr-3 pl-4 text-[13px] font-medium text-text-secondary transition-[color,border-color,scale] duration-200 ease-out hover:border-border-hover hover:text-foreground active:scale-[0.97]"
                >
                  <span className="max-w-60 truncate">
                    Next: {items[(at + 1) % items.length].question}
                  </span>
                  <IconArrowRight
                    aria-hidden
                    className="size-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Every answer stays in the server HTML for search and no-JS. */}
        {!wide &&
          items.map(
            (f, i) =>
              i !== at && (
                <p key={f.question} hidden>
                  {f.answer}
                </p>
              ),
          )}

        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
          {[
            {
              href: "https://x.com/devignerui",
              Logo: LogoX,
              title: "Ask on X",
              text: "@devignerui answers in public.",
            },
            {
              href: DISCORD_URL,
              Logo: LogoDiscord,
              title: "Ask in the Discord",
              text: "Release notes, requests and help.",
            },
          ].map(({ href, Logo, title, text }) => (
            <a
              key={title}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-border p-5 transition-colors duration-200 ease-out hover:border-border-hover hover:bg-surface-hover/40"
            >
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-hover text-foreground"
              >
                <Logo className="size-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-medium text-foreground">
                  {title}
                </span>
                <span className="block text-[13.5px] text-text-muted">
                  {text}
                </span>
              </span>
              <IconArrowRight
                aria-hidden
                className="ml-auto size-4 shrink-0 text-text-muted transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-brand"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
