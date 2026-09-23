"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import {
  DateRangePicker,
  MagneticButton,
  type DateRange,
} from "@devignerui/ui";
import { IconArrowRight, IconCalendar } from "@devigner-ui/icons";
import {
  EASE_OUT,
  SPRING_PANEL,
  SPRING_RETRACT,
} from "@devignerui/ui/motion";
import { CopyCommand } from "./copy-command";
import { DeletePreview, DockPreview } from "./live-previews";

/* ─── Motion ─── */

const fade: Variants = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT } },
};

// The rule draws first, then the sentence wipes in along it. The clip is
// dropped once it lands, or it would crop the dock's menu and the calendar.
const rule: Variants = {
  hidden: { scaleX: 0 },
  shown: { scaleX: 1, transition: { duration: 1.1, ease: EASE_OUT } },
};
const wipe: Variants = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  shown: {
    clipPath: "inset(0 0% 0 0)",
    transition: { duration: 1.1, ease: EASE_OUT, delay: 0.15 },
    transitionEnd: { clipPath: "none" },
  },
};
const settle: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  shown: { opacity: 1, scale: 1, transition: { ...SPRING_PANEL, delay: 0.5 } },
};

/* ─── The date chip: the last line's real Date Range Picker ─── */

const fmt = (d: Date, withMonth: boolean) =>
  d.toLocaleDateString(
    "en-US",
    withMonth ? { month: "short", day: "numeric" } : { day: "numeric" },
  );

const rangeLabel = (r: DateRange | null) => {
  if (!r) return "Pick dates";
  const sameMonth = r.start.getMonth() === r.end.getMonth();
  return `${fmt(r.start, true)} → ${fmt(r.end, !sameMonth)}`;
};

function DateChip() {
  const reduce = useReducedMotion();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | null>(null);
  const [today] = useState(() => new Date());
  const wrap = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLButtonElement>(null);
  // Phones get a bottom sheet portalled to <body>: the hero's animated
  // ancestors carry transforms, which would pin a `fixed` sheet to them.
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!wrap.current?.contains(t) && !panel.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      chip.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const picker = (
    <DateRangePicker value={range} onValueChange={setRange} minDate={today} />
  );

  return (
    <span ref={wrap} className="relative inline-flex">
      <button
        ref={chip}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="inline-flex h-12 items-center gap-2.5 rounded-full bg-background px-5 text-[16px] font-medium text-foreground shadow-elevated"
      >
        <IconCalendar className="size-5 text-brand" />
        <span className="tabular-nums">{rangeLabel(range)}</span>
      </button>
      {sheet ? (
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="scrim"
                aria-hidden
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.3, ease: EASE_OUT } }}
                exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_OUT } }}
                className="fixed inset-0 z-60 bg-foreground/25 backdrop-blur-[2px]"
              />
            )}
            {open && (
              <motion.div
                key="sheet"
                ref={panel}
                id={id}
                role="dialog"
                aria-label="Pick a date range"
                initial={reduce ? false : { opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0, transition: SPRING_PANEL }}
                exit={
                  reduce
                    ? { opacity: 0, transition: { duration: 0 } }
                    : { opacity: 0, y: 40, transition: SPRING_RETRACT }
                }
                className="fixed inset-x-3 bottom-3 z-61 flex justify-center"
              >
                {picker}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )
      ) : (
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panel}
              id={id}
              role="dialog"
              aria-label="Pick a date range"
              initial={reduce ? false : { opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING_PANEL }}
              exit={
                reduce
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { opacity: 0, y: -6, scale: 0.98, transition: SPRING_RETRACT }
              }
              className="absolute top-full left-0 z-10 mt-4 origin-top-left"
            >
              {picker}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </span>
  );
}

/* ─── The index ─── */

// Each row says what a component does, shows it doing it, and links to it.
// Later rows stack higher so the dock's menu (which opens upward) and the
// calendar (which opens downward) always land on top of their neighbours.
const ROWS: {
  text: string;
  slug: string;
  name: string;
  z: string;
  Live: () => React.ReactNode;
}[] = [
  {
    text: "Buttons that lean in.",
    slug: "magnetic-button",
    name: "Magnetic Button",
    z: "z-10",
    Live: () => (
      <MagneticButton className="bg-brand px-6 py-3 text-[15px] text-brand-foreground">
        Try me
      </MagneticButton>
    ),
  },
  {
    text: "Deletes that ask first.",
    slug: "delete-button",
    name: "Delete Button",
    z: "z-20",
    Live: DeletePreview,
  },
  {
    text: "Docks that open up.",
    slug: "menu-dock",
    name: "Menu Dock",
    z: "z-30",
    Live: DockPreview,
  },
  {
    text: "Dates you can preview.",
    slug: "date-range-picker",
    name: "Date Range Picker",
    z: "z-40",
    Live: DateChip,
  },
];

const STACK = [
  { name: "React 19", icon: "react" },
  { name: "Next.js", icon: "nextdotjs" },
  { name: "Tailwind CSS v4", icon: "tailwindcss" },
  { name: "TypeScript", icon: "typescript" },
];

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-x-clip pt-24 pb-20 sm:pt-28 lg:pb-24">
      <div aria-hidden className="top-light pointer-events-none absolute inset-x-0 top-0 h-168" />

      <motion.div
        initial={reduce ? false : "hidden"}
        animate="shown"
        variants={{ shown: { transition: { staggerChildren: 0.14 } } }}
        className="relative mx-auto max-w-7xl px-5"
      >
        {/* Masthead: the real h1, in plain words people search for */}
        <motion.div
          variants={fade}
          className="flex flex-col gap-3 pt-6 pb-8 sm:flex-row sm:items-end sm:justify-between"
        >
          <h1 className="max-w-md text-[15px]/6 font-medium text-foreground">
            Animated React components for Tailwind CSS.{" "}
            <span className="text-text-muted">
              Copy them into your project and they&apos;re yours.
            </span>
          </h1>
          <Link
            href="/#pricing"
            className="group inline-flex items-center gap-1.5 text-[14px] text-text-secondary transition-colors duration-200 hover:text-foreground"
          >
            <span className="font-medium text-success">Free</span>
            while the library grows
            <IconArrowRight className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        {/* Hovering one row quiets the others, so the eye stays on one idea */}
        <ul className="group/index">
          {ROWS.map(({ text, slug, name, z, Live }) => (
            <li
              key={slug}
              className={`relative ${z} transition-opacity duration-300 ease-out group-hover/index:opacity-35 hover:opacity-100! focus-within:opacity-100!`}
            >
              <motion.span
                aria-hidden
                variants={rule}
                className="absolute inset-x-0 top-0 h-px origin-left bg-border"
              />
              <div className="flex flex-col gap-3 py-5 sm:py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
                <motion.div
                  variants={wipe}
                  className="flex flex-wrap items-center gap-x-5 gap-y-4 sm:gap-x-7"
                >
                  <p className="font-display text-[clamp(2.1rem,5vw,4.25rem)] leading-[1.05] font-extrabold tracking-[-0.045em] text-foreground">
                    {text}
                  </p>
                  <motion.span
                    variants={settle}
                    className="inline-flex rounded-full bg-background-200 p-1.5 shadow-inlay"
                  >
                    <Live />
                  </motion.span>
                  <Link
                    href={`/components/${slug}`}
                    className="ml-auto inline-flex items-center gap-1.5 text-[14px] font-medium text-text-secondary lg:hidden"
                  >
                    {name}
                    <IconArrowRight className="size-4 text-brand" />
                  </Link>
                </motion.div>
                <motion.div variants={fade} className="hidden shrink-0 lg:block">
                  <Link
                    href={`/components/${slug}`}
                    className="group/link inline-flex items-center gap-2 text-[15px] font-medium text-text-secondary transition-colors duration-200 hover:text-foreground"
                  >
                    {name}
                    <IconArrowRight className="size-4 -translate-x-1 text-brand opacity-0 transition-[opacity,translate] duration-300 ease-out group-hover/link:translate-x-0 group-hover/link:opacity-100 lg:opacity-40" />
                  </Link>
                </motion.div>
              </div>
            </li>
          ))}
          <motion.li aria-hidden variants={rule} className="h-px origin-left bg-border" />
        </ul>

        <motion.div
          variants={fade}
          className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
        >
          <div>
            <p className="max-w-lg text-[17px]/7 text-pretty text-text-secondary">
              Six components where the hover, loading and done states are
              already worked out. The CLI drops each one into your repo as a
              plain .tsx file, so you can change anything.
            </p>
            <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Built for">
              {STACK.map((s) => (
                <li key={s.name} className="flex items-center gap-2 text-[13px] text-text-muted">
                  <span
                    aria-hidden
                    className="size-4 bg-current"
                    style={{
                      maskImage: `url(https://cdn.simpleicons.org/${s.icon})`,
                      maskSize: "contain",
                      maskRepeat: "no-repeat",
                    }}
                  />
                  {s.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CopyCommand
              command="npx devignerui add menu-dock"
              highlight="menu-dock"
              className="sm:w-80"
            />
            <Link
              href="/components"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-[15px] font-medium text-background transition-transform duration-200 ease-out active:scale-[0.97]"
            >
              See all six
              <IconArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
