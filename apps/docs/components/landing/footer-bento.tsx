"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import {
  IconArrowRight,
  IconBell,
  IconBolt,
  IconCalendar,
  IconCamera,
  IconChartSquare,
  IconChatRound,
  IconCheckCircle,
  IconChevronRight,
  IconClockCircle,
  IconCloudUpload,
  IconCopy,
  IconFolder,
  IconHeart,
  IconHome,
  IconLockKeyhole,
  IconMagnifer,
  IconMoon,
  IconPalette,
  IconPen,
  IconRocket,
  IconSettings,
  IconStar,
  IconSun2,
  IconTrashBinMinimalistic,
  IconUser,
} from "@devigner-ui/icons";
import { cn } from "cn";
import { useHoverCapable } from "devignerui/hooks";
import { EASE_OUT, SPRING_LAYOUT, SPRING_MOUSE, SPRING_SWAP } from "devignerui/motion";
import { CopyCommand } from "./copy-command";
import { Wordmark } from "./navbar";
import { DISCORD_URL, LogoDiscord, LogoX } from "../brand-logos";
import { LogoMark } from "../logo-mark";

export type FooterComponent = {
  slug: string;
  name: string;
  isNew: boolean;
  /** Its preview shot's URL, versioned by the image's content. */
  shot: string;
};

const ICONS_URL = "https://icons.devigner.cc";
const X_URL = "https://x.com/devignerui";


/** The showcase's set: a label, the component, and its export name. */
const SET = [
  ["Magnifer", IconMagnifer, "IconMagnifer"],
  ["Bell", IconBell, "IconBell"],
  ["Heart", IconHeart, "IconHeart"],
  ["Star", IconStar, "IconStar"],
  ["Settings", IconSettings, "IconSettings"],
  ["Moon", IconMoon, "IconMoon"],
  ["Sun", IconSun2, "IconSun2"],
  ["Cloud Upload", IconCloudUpload, "IconCloudUpload"],
  ["Calendar", IconCalendar, "IconCalendar"],
  ["Trash Bin", IconTrashBinMinimalistic, "IconTrashBinMinimalistic"],
  ["Chart", IconChartSquare, "IconChartSquare"],
  ["Clock", IconClockCircle, "IconClockCircle"],
  ["Lock", IconLockKeyhole, "IconLockKeyhole"],
  ["Copy", IconCopy, "IconCopy"],
  ["Check Circle", IconCheckCircle, "IconCheckCircle"],
  ["Bolt", IconBolt, "IconBolt"],
  ["Palette", IconPalette, "IconPalette"],
  ["Pen", IconPen, "IconPen"],
  ["Folder", IconFolder, "IconFolder"],
  ["Home", IconHome, "IconHome"],
  ["User", IconUser, "IconUser"],
  ["Chat", IconChatRound, "IconChatRound"],
  ["Camera", IconCamera, "IconCamera"],
  ["Rocket", IconRocket, "IconRocket"],
] as const;

/** Every drawing the set ships, in the package's own names. */
const STYLES = ["Outline", "TwoTone", "Bold", "Bulk"] as const;
type Style = (typeof STYLES)[number];

/** Lights the card's border where the pointer is. CSS vars, no re-render. */
function lightUp(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

/** A card that rises in with the others as the footer scrolls into view. */
function Card({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={
        reduce
          ? false
          : { opacity: 0, y: 18, scale: 0.985, filter: "blur(6px)" }
      }
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay: index * 0.09 }}
      onPointerMove={lightUp}
      className={cn("footer-card", className)}
    >
      {/* A thin light along the top edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[12%] top-0 h-px bg-linear-to-r from-transparent via-foreground/15 to-transparent"
      />
      {children}
    </motion.div>
  );
}

/** Mono label above each group. */
function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-text-muted uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

function Pulse() {
  return (
    <span
      aria-hidden
      className="relative size-1.75 shrink-0 rounded-full bg-brand"
    >
      <span className="footer-ping absolute inset-0 rounded-full bg-brand" />
    </span>
  );
}

const HEADLINE: { word: string; accent?: boolean; after?: string }[] = [
  { word: "Components" },
  { word: "that" },
  { word: "move" },
  { word: "like", accent: true },
  { word: "they", accent: true },
  { word: "mean", accent: true },
  { word: "it", accent: true, after: "," },
  { word: "and" },
  { word: "live" },
  { word: "in" },
  { word: "your" },
  { word: "repo." },
];

/** The headline, blurring in word by word. */
function Headline() {
  const reduce = useReducedMotion();
  return (
    <h2 className="mt-8 max-w-120 text-[clamp(1.875rem,2.9vw,2.5rem)] leading-[1.06] font-semibold tracking-[-0.048em] text-balance text-foreground">
      {HEADLINE.map((w, i) => (
        <span key={i}>
          <motion.span
            initial={
              reduce ? false : { opacity: 0, y: "0.45em", filter: "blur(4px)" }
            }
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{
              duration: 0.7,
              ease: EASE_OUT,
              delay: 0.25 + i * 0.045,
            }}
            className="inline-block"
          >
            <span className={cn(w.accent && "accent-word")}>{w.word}</span>
            {w.after}
          </motion.span>{" "}
        </span>
      ))}
    </h2>
  );
}

function FollowOnX() {
  return (
    <a
      href={X_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground pr-4.5 pl-4 text-[13.5px] font-semibold text-background shadow-[inset_0_1px_0_oklch(100%_0_0/0.5)] transition-transform duration-200 ease-out active:scale-[0.97]"
    >
      <LogoX className="size-3.5" />
      Follow on X
    </a>
  );
}

/** The newest component, its real preview tilting with the pointer. Stacked:
 *  the stage grows to fill whatever height the brand card sets, so the two
 *  cards in the row always end level with no dead band in either. */
function Spotlight({
  entry,
  version,
}: {
  entry: FooterComponent & { description: string };
  version: string;
}) {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const rx = useSpring(useMotionValue(0), SPRING_MOUSE);
  const ry = useSpring(useMotionValue(0), SPRING_MOUSE);
  const live = canHover && !reduce;
  return (
    <Link
      href={`/components/${entry.slug}`}
      onPointerMove={(e) => {
        if (!live) return;
        const r = e.currentTarget.getBoundingClientRect();
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 14);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 12);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      className="group flex h-full flex-col p-2.5"
    >
      {/* The stage: a pressed-in panel with a dot field, the shot on it. */}
      <div className="stage-surface relative grid min-h-56 flex-1 place-items-center overflow-hidden rounded-[18px] px-8 py-6 perspective-[600px]">
        <span aria-hidden className="frame-dots frame-vignette pointer-events-none absolute inset-0" />
        <span className="absolute top-3.5 left-4 z-10">
          <Eyebrow>
            <span className="inline-flex items-center gap-2 text-brand">
              <Pulse />
              {entry.isNew ? "Just shipped" : "Latest"}
            </span>
            &middot; v{version}
          </Eyebrow>
        </span>
        <motion.img
          src={entry.shot}
          alt=""
          loading="lazy"
          style={{ rotateX: rx, rotateY: ry }}
          className="relative mt-4 max-h-60 w-full max-w-90 object-contain drop-shadow-[0_18px_24px_oklch(0%_0_0/0.35)] transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex items-end justify-between gap-5 px-4.5 pt-5 pb-3">
        <div className="min-w-0">
          <h3 className="text-[22px]/tight font-semibold tracking-[-0.03em] text-foreground">{entry.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-[14px]/[1.55] text-pretty text-text-secondary">{entry.description}</p>
        </div>
        {/* On hover the chip fills with brand and its arrow slides out while a
            fresh one slides in behind it. */}
        <span className="inline-flex h-10 shrink-0 items-center gap-2.5 rounded-full bg-linear-to-b from-background-200 to-background-100 pr-1.5 pl-4.5 text-[13.5px] font-medium whitespace-nowrap text-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_6%,transparent)] ring-1 ring-border transition-[box-shadow,translate] duration-300 ease-overshoot group-hover:-translate-y-px group-hover:ring-border-hover group-active:scale-[0.97]">
          Try it live
          <span className="relative grid size-7 place-items-center overflow-hidden rounded-full bg-surface-hover transition-colors duration-300 ease-out group-hover:bg-brand group-hover:text-brand-foreground">
            <IconArrowRight aria-hidden className="size-3.5 transition-transform duration-400 ease-out group-hover:translate-x-5" />
            <IconArrowRight
              aria-hidden
              className="absolute size-3.5 -translate-x-5 transition-transform duration-400 ease-out group-hover:translate-x-0"
            />
          </span>
        </span>
      </div>
    </Link>
  );
}

const STYLE_LABEL: Record<Style, string> = { Outline: "Outline", TwoTone: "Two tone", Bold: "Bold", Bulk: "Bulk" };

/** The 24-unit drawing grid every icon sits on: unit lines, the 2-unit
 *  safe margin, and the keyline circle and square the shapes are fitted to. */
function ConstructionGrid() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="absolute inset-0 size-full text-foreground" fill="none">
      {Array.from({ length: 23 }, (_, i) => (
        <g key={i} stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.04}>
          <line x1={i + 1} y1={0} x2={i + 1} y2={24} />
          <line x1={0} y1={i + 1} x2={24} y2={i + 1} />
        </g>
      ))}
      <g stroke="var(--brand)" strokeOpacity={0.35} strokeWidth={0.05} strokeDasharray="0.3 0.3">
        <rect x={2} y={2} width={20} height={20} />
        <circle cx={12} cy={12} r={10} />
        <rect x={3} y={3} width={18} height={18} rx={1} />
        <line x1={12} y1={0} x2={12} y2={24} />
        <line x1={0} y1={12} x2={24} y2={12} />
      </g>
    </svg>
  );
}

/** Devigner Icons as a compact specimen sheet. The picked icon is drawn on
 *  its construction grid; beside it, the same icon in each of the four
 *  drawings is the style switch, over the set in that style and the line of
 *  code for it. Left alone in view, it pages through the set
 *  and the styles on its own; any press hands it over. */
function IconsShowcase() {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { amount: 0.4 });
  const [style, setStyle] = useState<Style>("Outline");
  const [focus, setFocus] = useState(3);
  const [auto, setAuto] = useState(true);
  const [copied, setCopied] = useState(false);
  const [name, Big, exportName] = SET[focus];
  const snippet = `<${exportName}${style === "Outline" ? "" : ` variant="${style}"`} />`;

  useEffect(() => {
    if (!auto || reduce || !inView) return;
    const id = setTimeout(() => {
      setFocus((f) => (f + 1) % SET.length);
      setStyle((s) => STYLES[(STYLES.indexOf(s) + 1) % STYLES.length]);
    }, 2600);
    return () => clearTimeout(id);
  }, [auto, reduce, inView, focus]);

  const take = <T,>(set: (v: T) => void) => (v: T) => {
    setAuto(false);
    set(v);
  };
  const pickIcon = take(setFocus);
  const pickStyle = take(setStyle);

  const copy = () =>
    navigator.clipboard.writeText(`import { ${exportName} } from "@devigner-ui/icons";\n\n${snippet}`).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {},
    );

  // Opacity and scale only: no blur filters, so a style change across the
  // whole strip stays cheap.
  const swap = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.7 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.7 } };

  return (
    <div ref={box} className="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
      <div>
        <Eyebrow className="text-brand">More from Devigner</Eyebrow>
        <h3 className="mt-2.5 text-[clamp(1.75rem,2.6vw,2.25rem)] leading-[1.05] font-semibold tracking-[-0.045em] text-foreground">
          Devigner <span className="accent-word">Icons</span>
        </h3>
        <p className="mt-2.5 max-w-88 text-[14.5px]/[1.6] text-text-secondary">
          The set behind every Devigner UI component, drawn on one 24-unit grid in four styles.
        </p>
        <dl className="mt-5 flex gap-6 font-mono text-[11.5px] text-text-muted">
          {[
            ["2,100+", "icons"],
            ["4", "styles"],
            ["24", "unit grid"],
          ].map(([n, label]) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <dt className="order-last">{label}</dt>
              <dd className="font-sans text-[17px] font-semibold tracking-[-0.03em] text-foreground tabular-nums">{n}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <a
            href={ICONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex h-10 items-center gap-2.5 overflow-hidden rounded-full bg-linear-to-b from-brand-hover to-brand pr-1.5 pl-4.5 text-[13.5px] font-semibold text-brand-foreground shadow-[inset_0_1px_0_oklch(100%_0_0/0.35),inset_0_-1px_0_oklch(0%_0_0/0.12)] ring-1 ring-brand/40 transition-[translate] duration-300 ease-overshoot hover:-translate-y-px active:scale-[0.97]"
          >
            Explore icons
            <span className="relative grid size-7 place-items-center overflow-hidden rounded-full bg-brand-foreground/12">
              <IconArrowRight
                aria-hidden
                strokeWidth={2}
                className="size-3.5 -rotate-45 transition-transform duration-400 ease-out group-hover:translate-x-4 group-hover:-translate-y-4"
              />
              <IconArrowRight
                aria-hidden
                strokeWidth={2}
                className="absolute size-3.5 -translate-x-4 translate-y-4 -rotate-45 transition-transform duration-400 ease-out group-hover:translate-0"
              />
            </span>
          </a>
          <CopyCommand command="npm i @devigner-ui/icons" highlight="@devigner-ui/icons" />
        </div>
      </div>

      {/* The specimen sheet: the glyph on its grid beside the style switch,
          the set and the line of code, both columns the same height. */}
      <div className="grid overflow-hidden rounded-[20px] bg-background/70 ring-1 ring-border sm:grid-cols-[12rem_minmax(0,1fr)]">
        <div className="relative flex flex-col border-b border-border p-4 sm:border-r sm:border-b-0">
          <div className="flex items-baseline justify-between gap-3 font-mono text-[10.5px] text-text-muted">
            <span>24 &times; 24</span>
            <span className="text-brand">{STYLE_LABEL[style]}</span>
          </div>
          <div className="relative m-auto aspect-square w-full max-w-38 py-2">
            <ConstructionGrid />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`${focus}-${style}`}
                {...swap}
                transition={SPRING_SWAP}
                className="absolute inset-0 grid place-items-center text-foreground"
              >
                <Big variant={style} className="size-full" />
              </motion.span>
            </AnimatePresence>
          </div>
          <p aria-live="polite" className="truncate text-[14px] font-semibold tracking-[-0.02em] text-foreground">
            {name}
          </p>
        </div>

        <div className="flex min-w-0 flex-col">
          {/* The same icon in all four drawings is the style switch. */}
          <div role="radiogroup" aria-label="Icon style" className="grid grid-cols-4 border-b border-border">
            {STYLES.map((s) => {
              const on = s === style;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pickStyle(s)}
                  className={cn(
                    "relative flex h-11 cursor-pointer items-center justify-center gap-2 border-border px-2 text-[12px] font-medium whitespace-nowrap outline-none transition-colors duration-200 ease-out not-last:border-r focus-visible:bg-surface-hover",
                    on ? "text-foreground" : "text-text-muted hover:bg-surface-hover/50 hover:text-foreground",
                  )}
                >
                  {on && (
                    <motion.span
                      aria-hidden
                      layoutId="icons-style-mark"
                      transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                      className="absolute inset-0 bg-brand/8 shadow-[inset_0_-2px_0_var(--brand)]"
                    />
                  )}
                  <Big variant={s} className={cn("relative size-4.5 shrink-0", on && "text-brand")} />
                  <span className="relative max-sm:sr-only lg:max-xl:sr-only">{STYLE_LABEL[s]}</span>
                </button>
              );
            })}
          </div>

          {/* The set, in the picked style. */}
          <div className="grid flex-1 grid-cols-8 content-center gap-1 p-2">
            {SET.map(([label, Tile], i) => {
              const on = i === focus;
              return (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  aria-pressed={on}
                  onClick={() => pickIcon(i)}
                  className={cn(
                    "grid h-10 cursor-pointer place-items-center rounded-lg outline-none transition-[color,background-color] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-brand",
                    on ? "bg-brand/12 text-brand" : "text-text-tertiary hover:bg-surface-hover hover:text-foreground",
                  )}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={style}
                      {...swap}
                      transition={reduce ? { duration: 0 } : { ...SPRING_SWAP, delay: (i % 8) * 0.015 }}
                      className="grid place-items-center"
                    >
                      <Tile variant={style} className="size-4.5" />
                    </motion.span>
                  </AnimatePresence>
                </button>
              );
            })}
          </div>

          {/* The line of code for what is on the sheet. */}
          <div className="flex min-w-0 items-center gap-3 border-t border-border py-1.5 pr-1.5 pl-4 font-mono text-[12px]">
            <code className="min-w-0 flex-1 truncate text-text-secondary">
              <span className="text-brand">&lt;{exportName}</span>
              {style !== "Outline" && (
                <>
                  {" "}
                  variant=<span className="text-foreground">&quot;{style}&quot;</span>
                </>
              )}
              <span className="text-brand"> /&gt;</span>
            </code>
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? "Copied" : `Copy ${snippet} with its import`}
              className={cn(
                "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 font-sans text-[12px] font-medium transition-colors duration-200 ease-out",
                copied ? "border-success/30 bg-success/10 text-success" : "border-border text-text-secondary hover:bg-surface-hover hover:text-foreground",
              )}
            >
              {copied ? <IconCheckCircle aria-hidden className="size-3.5" /> : <IconCopy aria-hidden className="size-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* The footer bento. The brand card and the spotlight share a row (the
   bottom bar carries the site links), and the icons card is a specimen
   sheet. */
export function FooterBento({
  version,
  updated,
  components,
}: {
  version: string;
  /** The newest component's date, e.g. "Sep 29". */
  updated: string;
  /** Newest first. */
  components: (FooterComponent & { description: string })[];
}) {
  // ponytail: pinned by hand to the spotlighted component, as in the live footer.
  const newest = components.find((c) => c.slug === "expand-tabs") ?? components[0];
  return (
    <div className="grid gap-3.5 lg:grid-cols-[1.2fr_1fr]">
      <Card index={0} className="flex flex-col p-8 sm:p-9">
        <span aria-hidden className="footer-dots pointer-events-none absolute inset-0 -z-10" />
        {/* Logo and the release chip share the top row, so the headline
            gets the card's middle to itself. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" aria-label="Devigner UI home" className="inline-flex items-center gap-2.5 rounded-lg">
            <LogoMark className="h-8 w-auto" />
            <Wordmark />
          </Link>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Release notes, on Discord"
            className="group inline-flex h-7.5 items-center gap-2.5 rounded-full border border-border bg-foreground/2 pr-3 pl-2.5 font-mono text-[12px] whitespace-nowrap text-text-muted transition-colors duration-300 ease-out hover:border-brand/35 hover:bg-brand/5 hover:text-text-secondary"
          >
            <Pulse />
            <b className="font-medium text-foreground">v{version}</b>
            <span aria-hidden className="h-3 w-px bg-border-hover" />
            updated {updated}
          </a>
        </div>
        <Headline />
        <p className="mt-3 font-mono text-[12px] text-text-muted">{components.length} components, free and MIT licensed</p>

        <nav aria-label="Community" className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5">
          {[
            { label: "Request a component", href: "/requests?new" },
            { label: "Request board", href: "/requests" },
            { label: "Changelog", href: DISCORD_URL },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group inline-flex items-center gap-1 text-[13.5px] text-text-secondary transition-colors duration-200 ease-out hover:text-foreground"
            >
              {l.label}
              <IconChevronRight aria-hidden className="size-3 text-text-muted transition-transform duration-300 ease-overshoot group-hover:translate-x-0.5" />
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-7">
          <CopyCommand command="npx devignerui init" highlight="init" />
          <FollowOnX />
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join the Discord"
            className="grid size-11 place-items-center rounded-full bg-[#5865f2] text-white shadow-[inset_0_1px_0_oklch(100%_0_0/0.3)] transition-transform duration-300 ease-overshoot hover:-translate-y-px active:scale-[0.96]"
          >
            <LogoDiscord className="size-4.5" />
          </a>
        </div>
      </Card>

      <Card index={1} className="flex flex-col p-0">
        <Spotlight entry={newest} version={version} />
      </Card>

      <Card index={2} className="footer-card-brand lg:col-span-2">
        <IconsShowcase />
      </Card>
    </div>
  );
}
