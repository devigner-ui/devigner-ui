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
import { EASE_OUT, SPRING_MOUSE } from "devignerui/motion";
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

const COMMUNITY = [
  { label: "Request a component", href: "/requests?new" },
  { label: "Request board", href: "/requests" },
  // ponytail: no changelog page yet; releases are posted on Discord.
  { label: "Changelog", href: DISCORD_URL },
];

/** The wall's tiles, three rows of eight. */
const WALL = [
  IconMagnifer,
  IconBell,
  IconHeart,
  IconStar,
  IconSettings,
  IconMoon,
  IconSun2,
  IconCloudUpload,
  IconCalendar,
  IconTrashBinMinimalistic,
  IconChartSquare,
  IconClockCircle,
  IconLockKeyhole,
  IconCopy,
  IconCheckCircle,
  IconBolt,
  IconPalette,
  IconPen,
  IconFolder,
  IconHome,
  IconUser,
  IconChatRound,
  IconCamera,
  IconRocket,
];
const WALL_COLS = 8;
/** A random-looking but fixed number per index. Not Math.random: the server
 *  and the browser must pick the same value, or hydration mismatches. */
const scatter = (i: number) => {
  let h = Math.imul(i + 1, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return h >>> 0;
};
/** Every style the set ships, scattered across the wall. */
const VARIANTS = ["Outline", "TwoTone", "Bold", "Bulk"] as const;
const variantAt = (i: number) => VARIANTS[scatter(i) % VARIANTS.length];

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

function NewBadge() {
  return (
    <span className="footer-shine relative ml-2 inline-flex h-4 items-center overflow-hidden rounded-full bg-brand/12 px-1.5 font-mono text-[10px] leading-none tracking-[0.08em] text-brand">
      <span className="mt-0.5">NEW</span>
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

/** The newest component, its real preview tilting with the pointer. */
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
      className="group grid h-full items-center gap-6 py-6 pr-8 pl-6 sm:grid-cols-[auto_1fr]"
    >
      {/* The component straight on the card, no frame around it. The shot
          carries transparent room for its shadow (about 16px at this size),
          pulled back out on every side so it sits close to the card's edge.
          A soft brand halo behind it lifts it off the ground. */}
      <div className="relative -m-4 grid place-items-center perspective-[600px]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-6 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand)_14%,transparent),transparent)] opacity-70 transition-opacity duration-300 ease-out group-hover:opacity-100"
        />
        <motion.img
          src={entry.shot}
          alt=""
          loading="lazy"
          style={{ rotateX: rx, rotateY: ry }}
          className="relative h-64 w-auto max-w-full object-contain drop-shadow-[0_18px_24px_oklch(0%_0_0/0.45)]"
        />
      </div>
      <div className="min-w-0">
        <Eyebrow>
          <span className="inline-flex items-center gap-2 text-brand">
            <Pulse />
            {entry.isNew ? "Just shipped" : "Latest"}
          </span>
          · v{version}
        </Eyebrow>
        <h3 className="mt-3 text-[22px]/tight font-semibold tracking-[-0.03em] text-foreground">
          {entry.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[14px]/[1.55] text-pretty text-text-secondary">
          {entry.description}
        </p>
        {/* A quiet pill, the Explore icons button's sibling: on hover the
            chip fills with brand and its arrow slides out while a fresh one
            slides in behind it. */}
        <span className="mt-5 inline-flex h-10 items-center gap-2.5 rounded-full bg-linear-to-b from-background-200 to-background-100 pr-1.5 pl-4.5 text-[13.5px] font-medium text-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_6%,transparent)] ring-1 ring-border transition-[box-shadow,translate] duration-300 ease-overshoot group-hover:-translate-y-px group-hover:ring-border-hover group-active:scale-[0.97]">
          Try it live
          <span className="relative grid size-7 place-items-center overflow-hidden rounded-full bg-surface-hover transition-colors duration-300 ease-out group-hover:bg-brand group-hover:text-brand-foreground">
            <IconArrowRight
              aria-hidden
              className="size-3.5 transition-transform duration-400 ease-out group-hover:translate-x-5"
            />
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

/** Component links. Hovering one dims the rest and floats a peek of it. */
function ComponentLinks({ items }: { items: FooterComponent[] }) {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const [peek, setPeek] = useState<FooterComponent | null>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const live = canHover && !reduce;

  return (
    <>
      <ul className="group/list mt-4 gap-6 min-[440px]:columns-2">
        {items.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/components/${c.slug}`}
              onPointerEnter={() => live && setPeek(c)}
              onPointerLeave={() => setPeek(null)}
              onPointerMove={(e) => {
                px.set(e.clientX + 18);
                py.set(e.clientY - 190);
              }}
              className="group/link relative inline-flex h-8 items-center text-[14px] whitespace-nowrap text-text-secondary transition-[color,translate] duration-300 ease-overshoot group-hover/list:text-text-muted hover:translate-x-2.5 hover:text-foreground! focus-visible:text-foreground"
            >
              <span
                aria-hidden
                className="absolute top-1/2 -left-3 size-1.25 -translate-y-1/2 scale-0 rounded-full bg-brand transition-transform duration-300 ease-overshoot group-hover/link:scale-100"
              />
              {c.name}
              {c.isNew && <NewBadge />}
            </Link>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {peek && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            style={{ x: px, y: py }}
            className="pointer-events-none fixed top-0 left-0 z-50 w-55 origin-bottom-left rounded-2xl bg-background-200/85 p-2 shadow-elevated ring-1 ring-border-hover backdrop-blur-xl"
          >
            <div className="stage-surface grid h-30 place-items-center overflow-hidden rounded-[10px]">
              <img
                src={peek.shot}
                alt=""
                className="max-h-[86%] max-w-[86%] object-contain"
              />
            </div>
            <div className="flex items-center justify-between px-1 pt-2 pb-0.5 text-[12.5px] font-medium text-foreground">
              {peek.name}
              <span className="font-mono text-[10.5px] font-normal text-text-muted">
                Try it live
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Devigner Icons: a tilted wall whose tiles light up near the pointer, with
 *  a slow diagonal shimmer while nobody is on it. Padded and unmasked so a
 *  tile lifted toward the viewer never gets clipped. */
function IconWall() {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const grid = useRef<HTMLDivElement>(null);
  const inView = useInView(grid);
  const [hovering, setHovering] = useState(false);
  const live = canHover && !reduce;

  const setLit = (fn: (tile: HTMLElement, i: number) => string | null) =>
    Array.from(grid.current?.children ?? []).forEach((t, i) => {
      const v = fn(t as HTMLElement, i);
      if (v) (t as HTMLElement).dataset.lit = v;
      else delete (t as HTMLElement).dataset.lit;
    });

  useEffect(() => {
    if (reduce || hovering || !inView) return;
    let k = 0;
    const id = setInterval(() => {
      setLit((_, i) =>
        ((i % WALL_COLS) + Math.floor(i / WALL_COLS)) % 12 === k % 12
          ? "1"
          : null,
      );
      k++;
    }, 220);
    return () => clearInterval(id);
  }, [reduce, hovering, inView]);

  return (
    <div
      aria-hidden
      className="px-2 py-3 perspective-[900px]"
      onPointerEnter={() => live && setHovering(true)}
      onPointerLeave={(e) => {
        setHovering(false);
        setLit(() => null);
        e.currentTarget.style.removeProperty("--tx");
        e.currentTarget.style.removeProperty("--ty");
      }}
      onPointerMove={(e) => {
        if (!live) return;
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty(
          "--ty",
          `${((e.clientX - r.left) / r.width - 0.5) * -12}deg`,
        );
        e.currentTarget.style.setProperty(
          "--tx",
          `${((e.clientY - r.top) / r.height - 0.5) * 10}deg`,
        );
        setLit((t) => {
          const b = t.getBoundingClientRect();
          const d = Math.hypot(
            b.left + b.width / 2 - e.clientX,
            b.top + b.height / 2 - e.clientY,
          );
          return d < 46 ? "2" : d < 100 ? "1" : null;
        });
      }}
    >
      <div
        ref={grid}
        // Six across on a phone (the last row of eight hides), so tiles
        // stay a readable size.
        className="grid grid-cols-6 gap-2 transform-3d max-sm:[&>*:nth-child(n+19)]:hidden sm:grid-cols-8 transition-transform duration-700 ease-out transform-[rotateX(var(--tx,5deg))_rotateY(var(--ty,-7deg))]"
      >
        {WALL.map((Icon, i) => (
          <span
            key={i}
            className="grid aspect-square place-items-center rounded-xl bg-linear-to-b from-background-200 to-background-100 text-text-muted ring-1 ring-border ring-inset transition-[color,background-color,box-shadow,transform] duration-500 ease-overshoot data-[lit=1]:text-text-secondary data-[lit=1]:ring-brand/25 data-[lit=1]:transform-[translateZ(8px)] data-[lit=2]:bg-brand/12 data-[lit=2]:text-foreground data-[lit=2]:shadow-[0_8px_22px_-8px_var(--brand)] data-[lit=2]:ring-brand/50 data-[lit=2]:transform-[translateZ(18px)]"
          >
            <Icon variant={variantAt(i)} className="size-[38%]" />
          </span>
        ))}
      </div>
    </div>
  );
}

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
  const newest = components[0];
  return (
    <div className="grid gap-3.5 lg:grid-cols-[1.05fr_1fr]">
      <Card index={0} className="flex flex-col p-9 lg:row-span-2 lg:min-h-115">
        <span
          aria-hidden
          className="footer-aurora pointer-events-none absolute -top-50 -right-40 -z-10 size-140 rounded-full bg-[conic-gradient(from_200deg,transparent,color-mix(in_oklab,var(--brand)_22%,transparent),color-mix(in_oklab,var(--brand-secondary)_12%,transparent),transparent_60%)] blur-[60px]"
        />
        <span
          aria-hidden
          className="footer-dots pointer-events-none absolute inset-0 -z-10"
        />
        <Link
          href="/"
          aria-label="Devigner UI home"
          className="inline-flex items-center gap-2.5 self-start rounded-lg"
        >
          <LogoMark className="h-8 w-auto" />
          <Wordmark />
        </Link>
        <Headline />
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Release notes, on Discord"
          className="group mt-5.5 inline-flex h-7.5 items-center gap-2.5 self-start rounded-full whitespace-nowrap border border-border bg-foreground/2 pr-3 pl-2.5 font-mono text-[12px] text-text-muted transition-colors duration-300 ease-out hover:border-brand/35 hover:bg-brand/5 hover:text-text-secondary"
        >
          <Pulse />
          <b className="font-medium text-foreground">v{version}</b>
          <span aria-hidden className="h-3 w-px bg-border-hover" />
          {components.length} components
          <span
            aria-hidden
            className="h-3 w-px bg-border-hover max-[400px]:hidden"
          />
          <span className="max-[400px]:hidden">updated {updated}</span>
          <IconChevronRight
            aria-hidden
            className="-ml-1.5 size-3 -translate-x-1 opacity-0 transition-all duration-300 ease-out group-hover:ml-0 group-hover:translate-x-0 group-hover:opacity-100"
          />
        </a>
        <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-10">
          <CopyCommand command="npx devignerui init" highlight="init" />
          <FollowOnX />
        </div>
      </Card>

      <Card index={1} className="p-0">
        <Spotlight entry={newest} version={version} />
      </Card>

      <Card index={2} className="p-8">
        <div className="grid gap-8 sm:grid-cols-[2fr_1fr]">
          <nav aria-label="Components">
            <Eyebrow>
              Components
              <span className="rounded-full bg-surface px-1.75 py-px text-[10px] tracking-normal text-foreground size-6 inline-flex items-center justify-center">
                {components.length}
              </span>
            </Eyebrow>
            <ComponentLinks items={components} />
          </nav>
          <nav aria-label="Community">
            <Eyebrow>Community</Eyebrow>
            <ul className="mt-4">
              {COMMUNITY.map((l) => {
                const external = l.href.startsWith("http");
                return (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="inline-flex h-8 items-center text-[14px] whitespace-nowrap text-text-secondary transition-colors duration-200 ease-out hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-4.5 inline-flex h-10 items-center gap-2 rounded-full bg-[#5865f2] pr-4.5 pl-3.5 text-[13.5px] font-semibold text-white shadow-[inset_0_1px_0_oklch(100%_0_0/0.3),0_10px_24px_-8px_oklch(55%_0.2_275/0.55)] transition-[translate,box-shadow] duration-300 ease-overshoot hover:-translate-y-px active:scale-[0.97]"
            >
              <LogoDiscord className="size-4.25 transition-transform duration-500 ease-overshoot group-hover:scale-110 group-hover:-rotate-10" />
              Join Discord
            </a>
          </nav>
        </div>
      </Card>

      <Card index={3} className="footer-card-brand lg:col-span-2">
        <div className="group grid items-center gap-10 p-9 lg:grid-cols-[0.9fr_1.3fr]">
          <div>
            <Eyebrow className="text-brand">More from Devigner</Eyebrow>
            <h3 className="mt-3 text-[32px] font-semibold tracking-[-0.045em] text-foreground">
              Devigner <span className="accent-word">Icons</span>
            </h3>
            <p className="mt-2 max-w-95 text-[15px]/[1.55] text-text-secondary">
              The icon set behind every Devigner UI component, in the same hand.
            </p>
            {/* A light sweeps across on hover, and the arrow in its chip
                flies out top-right while a fresh one lands from bottom-left. */}
            <a
              href={ICONS_URL}
              target="_blank"
              className="relative mt-5.5 inline-flex h-11 items-center gap-3 overflow-hidden rounded-full bg-linear-to-b from-brand-hover to-brand pr-1.5 pl-5 text-[13.5px] font-semibold text-brand-foreground shadow-[inset_0_1px_0_oklch(100%_0_0/0.35),inset_0_-1px_0_oklch(0%_0_0/0.12),0_12px_28px_-10px_var(--brand)] ring-1 ring-brand/40 transition-[translate,box-shadow] duration-300 ease-overshoot group-hover:-translate-y-px group-hover:shadow-[inset_0_1px_0_oklch(100%_0_0/0.35),inset_0_-1px_0_oklch(0%_0_0/0.12),0_16px_34px_-10px_var(--brand)] group-active:scale-[0.97]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[320%]"
              />
              Explore icons
              <span className="relative grid size-8 place-items-center overflow-hidden rounded-full bg-brand-foreground/12 transition-colors duration-300 ease-out group-hover:bg-brand-foreground/20">
                <IconArrowRight
                  aria-hidden
                  className="size-3.5 -rotate-45 transition-transform duration-400 ease-out group-hover:translate-x-4 group-hover:-translate-y-4"
                  strokeWidth={2}
                />
                <IconArrowRight
                  aria-hidden
                  strokeWidth={2}
                  className="absolute size-3.5 -translate-x-4 translate-y-4 -rotate-45 transition-transform duration-400 ease-out group-hover:translate-0"
                />
              </span>
            </a>
          </div>
          <IconWall />
        </div>
      </Card>
    </div>
  );
}
