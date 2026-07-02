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
import { ThemeToggle } from "../../../components/theme-provider";
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

function Navbar() {
  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-4">
      <nav className="nav-pill flex h-12 w-full max-w-3xl items-center justify-between rounded-full px-4 bg-background/80 border border-border shadow-elevated">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground tracking-tight"
        >
          <span className="flex size-6 items-center justify-center rounded-lg bg-foreground text-[11px] font-bold text-background">
            D
          </span>
          <span className="text-sm">Devigner</span>
        </Link>
        <div className="flex items-center gap-0.5">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors duration-200"
          >
            Home
          </Link>
          <Link
            href="/components"
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors duration-200"
          >
            Components
          </Link>
          <Link
            href="/docs"
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors duration-200"
          >
            Docs
          </Link>
          <div className="mx-1.5 h-4 w-px bg-border" />
          <ThemeToggle />
        </div>
      </nav>
    </div>
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
  const [view, setView] = useState<"preview" | "code">("preview");
  const [installTab, setInstallTab] = useState<"cli" | "manual">("cli");
  const [activeSection, setActiveSection] = useState("preview");

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Scroll-spy for the "On this page" rail
  useEffect(() => {
    const ids = ["preview", "installation", "props"];
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) setActiveSection(e.target.id);
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [slug, view]);

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
        <Navbar />
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
  const toc = [
    { id: "preview", label: "Preview" },
    { id: "installation", label: "Installation" },
    { id: "props", label: "Props" },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <div className="grain-overlay" />
      <Navbar />

      <div className="mx-auto max-w-352 px-5 pt-28 pb-20 sm:pt-32">
        <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_180px]">
          {/* ─── Left: component nav ─── */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              {Object.entries(navGroups).map(([category, items]) => (
                <div key={category}>
                  <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                    {categoryLabel(category)}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((item) => {
                      const active = item.slug === slug;
                      return (
                        <li key={item.slug}>
                          <Link
                            href={`/components/${item.slug}`}
                            className={`block rounded-lg px-2 py-1.5 text-[13px] transition-colors duration-150 ${
                              active
                                ? "bg-surface-hover font-medium text-foreground"
                                : "text-text-secondary hover:text-foreground"
                            }`}
                          >
                            {item.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          {/* ─── Center: content ─── */}
          <main className="min-w-0">
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
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
                {meta.description}
              </p>
            </Reveal>

            {/* Design-style switcher */}
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

            {/* Preview / Code */}
            <div id="preview" className="mt-6 scroll-mt-28">
              <div className="overflow-hidden rounded-2xl border border-border bg-background-200">
                <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
                  <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
                    {(["preview", "code"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setView(tab)}
                        className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-all duration-200 ${
                          view === tab
                            ? "bg-surface text-foreground shadow-subtle"
                            : "text-text-muted hover:text-foreground"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  {view === "code" ? (
                    <div className="flex items-center gap-2">
                      <span className="hidden font-mono text-[11px] text-text-muted sm:inline">
                        {slug}-demo.tsx
                      </span>
                      <CopyButton
                        code={usage}
                        componentName={`${slug}-${currentStyle.slug}-demo`}
                      />
                    </div>
                  ) : (
                    <span className="font-mono text-[11px] text-text-muted">
                      @devignerui/{slug}-{currentStyle.slug}
                    </span>
                  )}
                </div>

                {view === "preview" ? (
                  <div
                    className="flex min-h-80 items-center justify-center p-6 sm:min-h-105 sm:p-12"
                    style={{
                      backgroundImage:
                        "radial-gradient(var(--border) 1px, transparent 1px)",
                      backgroundSize: "22px 22px",
                    }}
                  >
                    {preview ?? (
                      <p className="text-[13px] text-text-muted">
                        Preview coming soon for this style.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="code-scroll max-h-130 overflow-y-auto bg-(--code-bg)">
                    <CodeBlock code={usage} lang="tsx" />
                  </div>
                )}
              </div>
            </div>

            {/* Installation */}
            <section id="installation" className="mt-14 scroll-mt-28">
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

            {/* Props */}
            <section id="props" className="mt-14 scroll-mt-28">
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
          </main>

          {/* ─── Right: on this page ─── */}
          <aside className="hidden xl:block">
            <div className="sticky top-28">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                On this page
              </p>
              <ul className="space-y-1 border-l border-border">
                {toc.map((item) => {
                  const active = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`-ml-px block border-l-2 pl-3 text-[13px] transition-colors duration-150 ${
                          active
                            ? "border-accent font-medium text-foreground"
                            : "border-transparent text-text-muted hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
              D
            </span>
            <span className="text-[13px] text-text-muted">
              &copy; 2026 Devigner UI
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://twitter.com/devignerui"
              className="text-[13px] text-text-muted hover:text-foreground transition-colors duration-200"
            >
              Twitter
            </a>
            <a
              href="https://github.com/devignerui/devignerui"
              className="text-[13px] text-text-muted hover:text-foreground transition-colors duration-200"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
