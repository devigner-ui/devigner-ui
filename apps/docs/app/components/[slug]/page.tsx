"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
} from "motion/react";
import { CopyButton } from "../../../components/copy-button";
import { CodeBlock } from "../../../components/code-block";
import { components } from "@/lib/registry";
import { COMPONENT_CATEGORIES } from "@devignerui/shared";

const categoryLabel = (key: string) =>
  COMPONENT_CATEGORIES[key as keyof typeof COMPONENT_CATEGORIES] ?? key;

const EASE = [0.16, 1, 0.3, 1] as const;

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Live previews (one per style slug) ─── */

function BtnDefault() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors duration-200 hover:bg-foreground/90 active:scale-[0.98]">
        Button
      </button>
      <button className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface active:scale-[0.98]">
        Outline
      </button>
      <button className="inline-flex h-10 items-center justify-center rounded-lg bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-hover active:scale-[0.98]">
        Secondary
      </button>
    </div>
  );
}

function BtnGradient() {
  return (
    <button className="group relative inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-size-[200%_auto] bg-left px-6 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:bg-right hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.98]">
      Get started
    </button>
  );
}

function BtnMagnetic() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });
  return (
    <motion.button
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.15);
        y.set((e.clientY - r.top - r.height / 2) * 0.15);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex h-11 items-center justify-center rounded-lg bg-foreground px-6 text-sm font-medium text-background"
    >
      Hover me
    </motion.button>
  );
}

function CardDefault() {
  return (
    <div className="w-full max-w-70 rounded-2xl border border-border bg-background shadow-card">
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="text-lg font-semibold tracking-tight text-foreground">
          Project Atlas
        </div>
        <p className="text-[13px] leading-relaxed text-text-muted">
          Deployed to production two hours ago. All checks passing.
        </p>
      </div>
    </div>
  );
}

function CardGlass() {
  return (
    <div className="relative flex w-full max-w-70 items-center justify-center overflow-hidden rounded-2xl p-6">
      <div className="absolute inset-0 bg-linear-to-br from-blue-500/50 via-purple-500/40 to-pink-500/50" />
      <div className="relative rounded-2xl border border-white/20 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-lg">
        <div className="text-[15px] font-semibold text-white">
          Frosted Glass
        </div>
        <p className="mt-1 text-xs text-white/80">
          Backdrop blur over a live gradient.
        </p>
      </div>
    </div>
  );
}

function CardSpotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className="relative w-full max-w-70 overflow-hidden rounded-2xl border border-border bg-background p-6"
    >
      <div
        className="pointer-events-none absolute -inset-px transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, rgba(0,112,243,0.18), transparent 40%)`,
        }}
      />
      <div className="relative z-10">
        <div className="text-[15px] font-semibold text-foreground">
          Spotlight Card
        </div>
        <p className="mt-1 text-xs text-text-muted">
          Move your cursor across the card.
        </p>
      </div>
    </div>
  );
}

function InpDefault() {
  return (
    <input
      placeholder="you@example.com"
      className="flex h-10 w-full max-w-65 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    />
  );
}

function InpFloating() {
  const [focused, setFocused] = useState(false);
  const [val, setVal] = useState("");
  return (
    <div className="relative w-full max-w-65">
      <input
        value={val}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => setVal(e.target.value)}
        className="peer h-12 w-full rounded-md border border-border bg-background px-3 pt-4 pb-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <label
        className={`pointer-events-none absolute left-3 transition-all duration-200 ${
          focused || val
            ? "top-1 text-[11px] text-accent"
            : "top-3.5 text-sm text-text-muted"
        }`}
      >
        Email address
      </label>
    </div>
  );
}

function InpUnderline() {
  return (
    <input
      placeholder="Search…"
      className="w-full max-w-65 border-b-2 border-border bg-transparent px-0 py-3 text-sm text-foreground transition-colors duration-200 placeholder:text-text-muted focus:border-accent focus:outline-none"
    />
  );
}

function BadgeDefault() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">
        Default
      </span>
      <span className="inline-flex items-center rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-foreground">
        Secondary
      </span>
      <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
        Outline
      </span>
    </div>
  );
}

function BadgePill() {
  return (
    <span className="inline-flex items-center rounded-full border border-accent/20 bg-linear-to-r from-blue-500/10 to-purple-500/10 px-3 py-1 text-xs font-medium text-accent">
      New feature
    </span>
  );
}

function BadgeDot() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      Live
    </span>
  );
}

function HeroDefault() {
  return (
    <div className="text-center">
      <div className="text-2xl/tight font-semibold tracking-tight text-foreground">
        Build faster.
      </div>
      <p className="mx-auto mt-2 max-w-65 text-[13px] leading-relaxed text-text-secondary">
        A clean hero with animated text reveal and a clear primary action.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button className="h-9 rounded-lg bg-foreground px-4 text-[13px] font-medium text-background active:scale-[0.98]">
          Get started
        </button>
        <button className="h-9 rounded-lg border border-border px-4 text-[13px] font-medium text-foreground active:scale-[0.98]">
          Learn more
        </button>
      </div>
    </div>
  );
}

function HeroGradient() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl p-7 text-center">
      <div className="absolute inset-0 bg-linear-to-br from-accent/20 via-purple-600/20 to-pink-600/20" />
      <div className="relative">
        <div className="text-2xl font-semibold tracking-tight text-foreground">
          Launch in minutes.
        </div>
        <p className="mx-auto mt-2 max-w-65 text-[13px] leading-relaxed text-text-secondary">
          A hero with an animated gradient backdrop.
        </p>
        <button className="mt-4 h-9 rounded-lg bg-foreground px-4 text-[13px] font-medium text-background active:scale-[0.98]">
          Get started
        </button>
      </div>
    </div>
  );
}

function HeroParallax() {
  return (
    <div className="text-center">
      <div className="text-2xl font-semibold tracking-tight text-foreground">
        Scroll to reveal.
      </div>
      <p className="mx-auto mt-2 max-w-65 text-[13px] leading-relaxed text-text-secondary">
        Parallax depth ties motion to scroll. The full effect runs on the live
        page.
      </p>
      <button className="mt-4 h-9 rounded-lg bg-foreground px-4 text-[13px] font-medium text-background active:scale-[0.98]">
        Explore
      </button>
    </div>
  );
}

const previews: Record<string, Record<string, React.ReactNode>> = {
  button: {
    default: <BtnDefault />,
    gradient: <BtnGradient />,
    magnetic: <BtnMagnetic />,
  },
  card: {
    default: <CardDefault />,
    glass: <CardGlass />,
    spotlight: <CardSpotlight />,
  },
  input: {
    default: <InpDefault />,
    floating: <InpFloating />,
    underline: <InpUnderline />,
  },
  badge: { default: <BadgeDefault />, pill: <BadgePill />, dot: <BadgeDot /> },
  "hero-section": {
    default: <HeroDefault />,
    gradient: <HeroGradient />,
    parallax: <HeroParallax />,
  },
};

const UTIL_CODE = `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;

/** npm install line for the manual install, derived from what the source imports. */
function depsFor(code: string) {
  const pkgs = ["clsx", "tailwind-merge"];
  if (code.includes("class-variance-authority"))
    pkgs.push("class-variance-authority");
  if (code.includes("motion/react")) pkgs.push("motion");
  return `npm i ${pkgs.join(" ")}`;
}

function EdgeNav(_: {
  navGroups: Record<string, { slug: string; name: string }[]>;
  activeSlug: string;
}) {
  return null;
}
function Stage(props: StageProps) {
  return (
    <div className="flex h-dvh items-center justify-center" style={dotGrid}>
      <div key={props.previewKey}>{props.preview}</div>
    </div>
  );
}
function PreviewCard(props: StageProps) {
  return (
    <div
      className="flex min-h-80 items-center justify-center rounded-2xl border border-border p-6"
      style={dotGrid}
    >
      <div key={props.previewKey}>{props.preview}</div>
    </div>
  );
}
function FullscreenStage(_: {
  preview: React.ReactNode;
  previewKey: number;
  onClose: () => void;
}) {
  return null;
}

const dotGrid: React.CSSProperties = {
  backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
};

type StageProps = {
  preview: React.ReactNode;
  previewKey: number;
  usage: string;
  slug: string;
  styleSlug: string;
  showCode: boolean;
  setShowCode: (v: boolean) => void;
  onReset: () => void;
  onFullscreen: () => void;
};

export default function ComponentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <ComponentPageInner params={params} />;
}

function ComponentPageInner({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("");
  const [activeStyle, setActiveStyle] = useState(0);
  const [showCode, setShowCode] = useState(false);
  const [installTab, setInstallTab] = useState<"cli" | "manual">("cli");
  const [fullscreen, setFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const meta = components[slug];
  const componentStyles = meta?.styles ?? [];
  const currentStyle = componentStyles[activeStyle];

  // Left-nav: components grouped by category
  const navGroups = Object.values(components).reduce<
    Record<string, { slug: string; name: string }[]>
  >((acc, c) => {
    (acc[c.category] ??= []).push({ slug: c.slug, name: c.name });
    return acc;
  }, {});

  // slug is empty until params resolve; only then can we tell "loading" from "unknown".
  if (!slug) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="grain-overlay" />
        <div className="flex items-center gap-2.5 text-text-muted">
          <span className="size-4 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="text-sm">Loading component…</p>
        </div>
      </div>
    );
  }

  if (!meta || !currentStyle) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="grain-overlay" />
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-5 pt-40 pb-20 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            404
          </p>
          <h1 className="mt-3 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-[-0.03em] text-foreground">
            Component not found
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-text-secondary">
            <span className="font-mono text-foreground">{slug}</span> isn’t in
            the registry yet. It may still be on the way.
          </p>
          <Link
            href="/components"
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors duration-200 hover:bg-foreground/90"
          >
            Browse components
          </Link>
        </div>
      </div>
    );
  }

  const preview = previews[slug]?.[currentStyle.slug];
  const props = meta.props;
  const usage = currentStyle.usage;
  const deps = depsFor(currentStyle.code);
  const installCmd = `npx devignerui add ${slug} --style ${currentStyle.slug}`;

  return (
    <div className="relative bg-background lg:h-dvh lg:overflow-hidden">
      <div className="grain-overlay" />

      <EdgeNav navGroups={navGroups} activeSlug={slug} />

      <div className="flex flex-col lg:h-dvh lg:flex-row">
        {/* Left: docs (only scroller on desktop) */}
        <div className="min-w-0 lg:h-dvh lg:w-1/2 lg:overflow-y-auto">
          <div className="mx-auto max-w-2xl px-6 py-10 md:px-12 md:py-16">
            {/* Mobile-only inline preview (desktop uses the fixed stage) */}
            <div className="mb-8 lg:hidden">
              <PreviewCard
                preview={preview}
                previewKey={previewKey}
                usage={usage}
                slug={slug}
                styleSlug={currentStyle.slug}
                showCode={showCode}
                setShowCode={setShowCode}
                onReset={() => setPreviewKey((k) => k + 1)}
                onFullscreen={() => setFullscreen(true)}
              />
            </div>

            <Reveal>
              <div className="flex items-center gap-2 text-[13px] text-text-muted">
                <Link
                  href="/components"
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  Components
                </Link>
                <span className="text-border">/</span>
                <span className="text-foreground">{meta.name}</span>
              </div>
              <h1 className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
                {meta.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium lowercase text-text-secondary">
                  {categoryLabel(meta.category)}
                </span>
                <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium lowercase text-text-secondary">
                  {currentStyle.status === "new" ? "new" : "stable"}
                </span>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">
                {meta.description}
              </p>
            </Reveal>

            {componentStyles.length > 1 && (
              <div className="mt-6 flex flex-wrap items-center gap-1.5">
                {componentStyles.map((style, i) => {
                  const active = i === activeStyle;
                  return (
                    <button
                      key={style.slug}
                      onClick={() => setActiveStyle(i)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                        active
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-border text-text-secondary hover:text-foreground"
                      }`}
                    >
                      {style.name}
                      {!style.free && (
                        <span className="rounded-full bg-accent/15 px-1.5 text-[9px] font-semibold text-accent">
                          Pro
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <section id="installation" className="mt-14">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">
                Installation
              </h2>

              <div className="mt-4 inline-flex items-center gap-0.5 rounded-lg border border-border bg-background-200 p-0.5">
                {(["cli", "manual"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setInstallTab(tab)}
                    className={`rounded-md px-3 py-1 text-xs font-medium uppercase tracking-wide transition-all duration-200 ${
                      installTab === tab
                        ? "bg-background text-foreground shadow-subtle"
                        : "text-text-muted hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {installTab === "cli" ? (
                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-border bg-background-200 px-4 py-3 font-mono text-[13px] text-text-secondary">
                  <span className="truncate">
                    <span className="text-text-muted">$</span> {installCmd}
                  </span>
                  <CopyButton
                    code={installCmd}
                    componentName={`install-${slug}-${currentStyle.slug}`}
                  />
                </div>
              ) : (
                <div className="mt-6 space-y-8">
                  {/* 1 · dependencies */}
                  <div className="relative border-l border-border pl-6">
                    <span className="absolute -left-0.75 top-1 h-4 w-1.5 rounded-full bg-text-muted/60" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Install dependencies
                    </h3>
                    <div className="relative mt-3 overflow-hidden rounded-xl border border-border bg-background-200">
                      <div className="absolute right-2 top-2 z-10">
                        <CopyButton
                          code={deps}
                          componentName={`deps-${slug}`}
                        />
                      </div>
                      <CodeBlock code={deps} lang="bash" numbered />
                    </div>
                  </div>

                  {/* 2 · util file */}
                  <div className="relative border-l border-border pl-6">
                    <span className="absolute -left-0.75 top-1 h-4 w-1.5 rounded-full bg-text-muted/60" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Add util file
                    </h3>
                    <div className="mt-3 inline-flex rounded-lg border border-border bg-background-200 px-3 py-1 font-mono text-xs text-text-secondary">
                      lib/utils.ts
                    </div>
                    <div className="relative mt-2 overflow-hidden rounded-xl border border-border bg-background-200">
                      <div className="absolute right-2 top-2 z-10">
                        <CopyButton code={UTIL_CODE} componentName="util-cn" />
                      </div>
                      <CodeBlock code={UTIL_CODE} lang="ts" numbered />
                    </div>
                  </div>

                  {/* 3 · source code */}
                  <div className="relative border-l border-border pl-6">
                    <span className="absolute -left-0.75 top-1 h-4 w-1.5 rounded-full bg-text-muted/60" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Copy the source code
                    </h3>
                    <div className="mt-3 inline-flex rounded-lg border border-border bg-background-200 px-3 py-1 font-mono text-xs text-text-secondary">
                      components/ui/{slug}-{currentStyle.slug}.tsx
                    </div>
                    <div className="relative mt-2 overflow-hidden rounded-xl border border-border bg-background-200">
                      <div className="absolute right-2 top-2 z-10">
                        <CopyButton
                          code={currentStyle.code}
                          componentName={`src-${slug}-${currentStyle.slug}`}
                        />
                      </div>
                      <CodeBlock
                        code={currentStyle.code}
                        lang="tsx"
                        numbered
                        expandable
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section id="props" className="mt-14">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">
                Props
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Props for the{" "}
                <span className="font-mono text-[13px] text-foreground">
                  {meta.name.replace(/\s+/g, "")}
                </span>{" "}
                component.
              </p>
              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-background-200">
                      <th className="px-4 py-2.5 font-medium text-text-muted">
                        Prop
                      </th>
                      <th className="px-4 py-2.5 font-medium text-text-muted">
                        Type
                      </th>
                      <th className="hidden px-4 py-2.5 font-medium text-text-muted sm:table-cell">
                        Default
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.map((p) => (
                      <tr
                        key={p.name}
                        className="border-b border-border align-top last:border-0"
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs font-medium text-foreground">
                            {p.name}
                          </div>
                          <div className="mt-1 text-xs/relaxed text-text-muted">
                            {p.description}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-accent">
                          {p.type}
                        </td>
                        <td className="hidden px-4 py-3 font-mono text-xs text-text-muted sm:table-cell">
                          {p.default}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {Array.isArray(meta.notes) && meta.notes.length > 0 && (
              <section className="mt-14">
                <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">
                  Notes
                </h2>
                <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-text-secondary">
                  {meta.notes.map((n, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-text-muted" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {/* Right: fixed live-preview stage (desktop only) */}
        <div className="hidden lg:block lg:w-1/2">
          <Stage
            preview={preview}
            previewKey={previewKey}
            usage={usage}
            slug={slug}
            styleSlug={currentStyle.slug}
            showCode={showCode}
            setShowCode={setShowCode}
            onReset={() => setPreviewKey((k) => k + 1)}
            onFullscreen={() => setFullscreen(true)}
          />
        </div>
      </div>

      {fullscreen && (
        <FullscreenStage
          preview={preview}
          previewKey={previewKey}
          onClose={() => setFullscreen(false)}
        />
      )}
    </div>
  );
}
