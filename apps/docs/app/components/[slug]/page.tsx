"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Button } from "@devignerui/ui";
import { CopyButton } from "../../../components/copy-button";
import { CodeBlock } from "../../../components/code-block";
import { IconButton } from "../../../components/icon-button";
import { useTheme } from "../../../components/theme-provider";
import { components } from "@/lib/registry";
import { COMPONENT_CATEGORIES } from "@devignerui/shared";
import {
  EASE_OUT,
  SPRING_PRESS,
  SPRING_PANEL,
  SPRING_LAYOUT,
  SPRING_SWAP,
} from "@devignerui/ui/lib/animations";

const categoryLabel = (key: string) =>
  COMPONENT_CATEGORIES[key as keyof typeof COMPONENT_CATEGORIES] ?? key;

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
      transition={{ duration: 0.7, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Live previews (one per component) ─── */

function BtnDefault() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button>Button</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
    </div>
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

function InpDefault() {
  return (
    <input
      placeholder="you@example.com"
      className="flex h-10 w-full max-w-65 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

function BadgeDefault() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
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

const previews: Record<string, React.ReactNode> = {
  button: <BtnDefault />,
  card: <CardDefault />,
  input: <InpDefault />,
  badge: <BadgeDefault />,
  "hero-section": <HeroDefault />,
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

const dotGrid: React.CSSProperties = {
  backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
};

/* ─── Icons (15px stroke icons, lucide paths) ─── */

const icon = {
  reset: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
  code: <path d="m18 16 4-4-4-4M6 8l-4 4 4 4m8.5-12-5 16" />,
  fullscreen: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  minimize: <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />,
  copy: (
    <>
      <rect width="14" height="14" x="8" y="8" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  download: (
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  sidebar: (
    <>
      <rect width="18" height="18" x="3" y="3" rx="5" />
      <path d="M9.5 3v18" />
    </>
  ),
} as const;

function Icon({ d, size = 15 }: { d: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d}
    </svg>
  );
}

/* ─── Stage: pill toolbar, code drawer panel, fullscreen ─── */

type StageProps = {
  preview: React.ReactNode;
  previewKey: number;
  code: string;
  fileName: string;
  showCode: boolean;
  setShowCode: (v: boolean) => void;
  onReset: () => void;
  onFullscreen: () => void;
  isFullscreen?: boolean;
};

function PillToolbar({
  showCode,
  setShowCode,
  onReset,
  onFullscreen,
  isFullscreen,
}: Pick<
  StageProps,
  "showCode" | "setShowCode" | "onReset" | "onFullscreen" | "isFullscreen"
>) {
  const { theme, toggleTheme } = useTheme();
  const [resetSpins, setResetSpins] = useState(0);
  const reduce = useReducedMotion();
  return (
    <div className="flex items-center gap-1 rounded-3xl bg-background p-1.5">
      <IconButton
        label="Collapse"
        active={isFullscreen}
        onClick={onFullscreen}
        iconKey={isFullscreen ? "min" : "max"}
        aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen preview"}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        <Icon d={isFullscreen ? icon.minimize : icon.fullscreen} />
      </IconButton>
      <IconButton
        onClick={() => {
          setResetSpins((n) => n + 1);
          onReset();
        }}
        aria-label="Reset preview"
        title="Reset"
      >
        <motion.span
          key={resetSpins}
          className="inline-flex"
          initial={{ rotate: 0 }}
          animate={{ rotate: reduce ? 0 : -360 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <Icon d={icon.reset} />
        </motion.span>
      </IconButton>
      <IconButton
        onClick={toggleTheme}
        iconKey={theme}
        aria-label="Toggle theme"
        title="Theme"
      >
        <Icon d={theme === "dark" ? icon.sun : icon.moon} />
      </IconButton>
      <IconButton
        active={showCode}
        label="Example Usage"
        onClick={() => setShowCode(!showCode)}
        aria-label="Toggle code"
        aria-pressed={showCode}
        title="View code"
      >
        <Icon d={icon.code} />
      </IconButton>
    </div>
  );
}

function IconCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      size="sm"
      iconKey={copied ? "check" : "copy"}
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      aria-label="Copy code"
    >
      <Icon d={copied ? icon.check : icon.copy} size={13} />
    </IconButton>
  );
}

function DrawerHeader({ code, fileName }: { code: string; fileName: string }) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 px-4">
      <span className="flex-1 truncate font-mono text-xs font-medium text-text-muted">
        {fileName}
      </span>
      <IconCopy code={code} />
      <IconButton size="sm" onClick={download} aria-label="Download file">
        <Icon d={icon.download} size={13} />
      </IconButton>
    </div>
  );
}

/** Desktop right panel: floating stage card + code drawer that expands below it.
 * In fullscreen the same element goes `fixed inset-0` and Motion's layout
 * animation morphs it there — no separate overlay. */
function StagePanel(props: StageProps) {
  return (
    <motion.div
      layout
      transition={SPRING_LAYOUT}
      className={
        props.isFullscreen
          ? "fixed inset-0 z-100 flex flex-col gap-2 bg-background p-3"
          : "flex h-full flex-col gap-2 p-3 pl-0"
      }
    >
      <motion.div
        layout
        transition={SPRING_LAYOUT}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-surface"
        // style={dotGrid}
      >
        <div key={props.previewKey}>
          {props.preview ?? (
            <p className="text-[13px] text-text-muted">
              Preview coming soon for this component.
            </p>
          )}
        </div>
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
          <PillToolbar {...props} />
        </div>
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          height: props.showCode ? "46%" : 0,
          opacity: props.showCode ? 1 : 0,
        }}
        transition={SPRING_PANEL}
        className="shrink-0 overflow-hidden rounded-2xl bg-surface"
        aria-hidden={!props.showCode}
      >
        <div className="flex h-full flex-col">
          <DrawerHeader code={props.code} fileName={props.fileName} />
          <div className="code-scroll min-h-0 flex-1 overflow-y-auto">
            <CodeBlock code={props.code} lang="tsx" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Mobile inline stage: same card + toolbar + drawer, fixed height.
 * Fullscreen expands this same card to the viewport via layout animation. */
function PreviewCard(props: StageProps) {
  return (
    <motion.div
      layout
      transition={SPRING_LAYOUT}
      className={
        props.isFullscreen
          ? "fixed inset-0 z-100 flex flex-col gap-2 bg-background p-3"
          : "flex flex-col gap-2"
      }
    >
      <motion.div
        layout
        transition={SPRING_LAYOUT}
        className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-background p-6 ${
          props.isFullscreen ? "min-h-0 flex-1" : "min-h-80"
        }`}
        style={dotGrid}
      >
        <div key={props.previewKey}>
          {props.preview ?? (
            <p className="text-[13px] text-text-muted">
              Preview coming soon for this component.
            </p>
          )}
        </div>
        <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
          <PillToolbar {...props} />
        </div>
      </motion.div>
      <motion.div
        initial={false}
        animate={{ height: props.showCode ? 320 : 0 }}
        transition={SPRING_PANEL}
        className="shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-(--code-bg)"
        aria-hidden={!props.showCode}
      >
        <div className="flex h-full flex-col">
          <DrawerHeader code={props.code} fileName={props.fileName} />
          <div className="code-scroll min-h-0 flex-1 overflow-y-auto">
            <CodeBlock code={props.code} lang="tsx" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Docs column pieces ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-5 text-3xl tracking-tight text-foreground md:text-4xl">
      {children}
    </h2>
  );
}

function TreeRow({
  name,
  file,
  accent,
}: {
  name: string;
  file?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 p-2 ${accent ? "text-primary" : "text-foreground"}`}
    >
      <span className="inline-flex shrink-0 text-text-muted">
        {file ? (
          <Icon
            size={15}
            d={
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4" />
            }
          />
        ) : (
          <Icon
            size={15}
            d={
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            }
          />
        )}
      </span>
      <span className="text-sm">{name}</span>
    </div>
  );
}

/* ─── Sidebar (overlay panel with ruler-tick nav, after the reference) ─── */

function SidebarItem({
  item,
  isActive,
  anyHovered,
  isHovered,
  onEnter,
  onLeave,
}: {
  item: { slug: string; name: string };
  isActive: boolean;
  anyHovered: boolean;
  isHovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="relative">
      {/* accent active bar, springs between items */}
      {isActive && (
        <motion.span
          layoutId="doc-sidebar-active-bar"
          className="pointer-events-none absolute top-1/2 z-40 h-[1.8px] -translate-y-1/2 rounded-full bg-primary"
          animate={{ width: 30 }}
          transition={SPRING_LAYOUT}
        />
      )}
      {/* animated dash: idle 18 → hover 26 → active 0 */}
      <motion.span
        className="pointer-events-none absolute left-0 top-1/2 h-px -translate-y-1/2 bg-foreground/50"
        animate={{ width: isActive ? 0 : isHovered ? 26 : 18 }}
        transition={SPRING_PRESS}
      />
      {/* static ruler ticks */}
      <span className="pointer-events-none absolute left-0 top-0 h-px w-4 bg-foreground/30" />
      <span className="pointer-events-none absolute left-0 top-1/4 h-px w-[13px] bg-foreground/30" />
      <span className="pointer-events-none absolute left-0 top-3/4 h-px w-[13px] bg-foreground/30" />
      <motion.div
        animate={{
          opacity: isActive ? 1 : anyHovered ? (isHovered ? 1 : 0.3) : 0.55,
          x: isActive ? 8 : isHovered ? 6 : 0,
        }}
        transition={SPRING_PRESS}
        style={{ transformOrigin: "left center" }}
      >
        <Link
          href={`/components/${item.slug}`}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          aria-current={isActive ? "page" : undefined}
          className={`relative flex select-none items-center py-0.5 pl-8 pr-3 ${
            isActive ? "text-primary" : "text-foreground"
          }`}
        >
          <span className="truncate text-base">{item.name}</span>
        </Link>
      </motion.div>
    </div>
  );
}

/** Frosted left panel: stacked backdrop-blur layers fading out to the right. */
function SidebarBlur() {
  const layers = [
    { blur: 32, to: 35 },
    { blur: 16, to: 55 },
    { blur: 8, to: 75 },
    { blur: 4, to: 100 },
  ];
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {layers.map(({ blur, to }) => (
        <div
          key={blur}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            maskImage: `linear-gradient(to right, black ${Math.max(0, to - 35)}%, transparent ${to}%)`,
            WebkitMaskImage: `linear-gradient(to right, black ${Math.max(0, to - 35)}%, transparent ${to}%)`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-linear-to-r from-background/85 via-background/40 to-transparent" />
    </div>
  );
}

function DocSidebar({
  open,
  setOpen,
  activeSlug,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  activeSlug: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // "s" toggles; left screen edge held for 500ms opens.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable
      )
        return;
      if (e.key === "s") setOpen(!open);
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onMove = (e: MouseEvent) => {
      if (!open && e.clientX <= 16) {
        timer ??= setTimeout(() => setOpen(true), 500);
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (timer) clearTimeout(timer);
    };
  }, [open, setOpen]);

  // Close on scroll or pointerdown outside (the toggle button opts out).
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("[data-sidebar-toggle]")) return;
      if (panelRef.current && !panelRef.current.contains(t)) close();
    };
    window.addEventListener("scroll", close, { passive: true, capture: true });
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, setOpen]);

  const groups = Object.values(components).reduce<
    Record<string, { slug: string; name: string }[]>
  >((acc, c) => {
    (acc[c.category] ??= []).push({ slug: c.slug, name: c.name });
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          exit={{ x: "-100%" }}
          transition={SPRING_PANEL}
          className="fixed left-0 top-0 z-90 h-full w-72"
        >
          <SidebarBlur />
          <nav
            aria-label="Components"
            className="no-scrollbar relative z-10 flex h-full flex-col gap-1 overflow-y-auto px-3 pb-32 pt-24"
          >
            {Object.entries(groups).map(([cat, items]) => (
              <div key={cat} className="mb-2 flex flex-col">
                <span className="flex items-baseline gap-2 py-4 text-base font-medium text-foreground/35">
                  {categoryLabel(cat)}
                  <span className="text-xs font-normal tabular-nums text-foreground/25">
                    {items.length}
                  </span>
                </span>
                {items.map((it) => (
                  <SidebarItem
                    key={it.slug}
                    item={it}
                    isActive={it.slug === activeSlug}
                    anyHovered={hovered !== null}
                    isHovered={hovered === it.slug}
                    onEnter={() => setHovered(it.slug)}
                    onLeave={() => setHovered(null)}
                  />
                ))}
              </div>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SidebarToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <IconButton
      size="round"
      onClick={onToggle}
      data-sidebar-toggle="true"
      aria-label="Toggle sidebar"
      aria-expanded={open}
      title="Toggle sidebar (s)"
    >
      <Icon d={icon.sidebar} size={17} />
    </IconButton>
  );
}

/* ─── Page ─── */

export default function ComponentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <ComponentPageInner params={params} />;
}

function ComponentPageInner({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("");
  const [showCode, setShowCode] = useState(false);
  const [installTab, setInstallTab] = useState<"cli" | "manual">("cli");
  const [fullscreen, setFullscreen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Escape exits the expanded (fullscreen) preview.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setFullscreen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const meta = components[slug];

  // slug is empty until params resolve; only then can we tell "loading" from "unknown".
  if (!slug) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="grain-overlay" />
        <div className="flex items-center gap-2.5 text-text-muted">
          <span className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm">Loading component…</p>
        </div>
      </div>
    );
  }

  if (!meta) {
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

  const preview = previews[slug];
  const props = meta.props;
  const usage = meta.usage;
  const deps = depsFor(meta.code);
  const installCmd = `npx devignerui add ${slug}`;
  const fileName = `${slug}.tsx`;

  const stageProps: StageProps = {
    preview,
    previewKey,
    code: meta.code,
    fileName,
    showCode,
    setShowCode,
    onReset: () => setPreviewKey((k) => k + 1),
    onFullscreen: () => setFullscreen((v) => !v),
    isFullscreen: fullscreen,
  };

  const breadcrumb = (
    <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm">
      <Link
        href="/components"
        className="text-foreground/50 transition-colors duration-200 hover:text-foreground"
      >
        Components
      </Link>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground/30"
        role="presentation"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
      <span className="font-medium text-foreground">{meta.name}</span>
    </nav>
  );

  return (
    <div className="relative bg-background lg:h-dvh lg:overflow-hidden">
      <div className="grain-overlay" />

      {/* Fixed top bar: sidebar toggle + breadcrumb, desktop only */}
      <div className="absolute left-4 top-4 z-50 hidden items-center gap-2 lg:flex">
        <SidebarToggle open={sidebarOpen} onToggle={toggleSidebar} />
        {breadcrumb}
      </div>

      {/* Sidebar: fixed overlay panel, all breakpoints */}
      <DocSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        activeSlug={slug}
      />

      <div className="flex flex-col lg:h-dvh lg:flex-row gap-2">
        {/* Left: docs (only scroller on desktop) */}
        <div className="relative min-w-0 flex-1 lg:h-dvh">
          {/* Top fade under the fixed bar, desktop only */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 hidden h-16 bg-linear-to-b from-background via-background/70 to-transparent lg:block" />

          {/* Nudges the docs right while the sidebar overlay is open (desktop only) */}
          <div
            className={`transition-[padding-left] duration-500 ease-out lg:h-full lg:overflow-y-auto ${
              sidebarOpen ? "lg:pl-40" : "lg:pl-0"
            }`}
          >
            <div className="mx-auto flex w-full flex-col px-6 py-8 md:px-12 md:py-14 lg:pt-16">
              {/* Mobile-only breadcrumb + inline preview (desktop uses the fixed stage) */}
              <div className="mb-6 flex items-center gap-2 lg:hidden">
                <SidebarToggle open={sidebarOpen} onToggle={toggleSidebar} />
                {breadcrumb}
              </div>
              <div className="mb-10 lg:hidden">
                <PreviewCard {...stageProps} />
              </div>

              <Reveal className="flex flex-col gap-1.5">
                <h1 className="text-3xl tracking-tighter text-foreground sm:text-4xl md:text-5xl">
                  {meta.name}
                </h1>
                <p className="mt-1 text-base/relaxed text-foreground/50 md:text-lg">
                  {meta.description}
                </p>
                <p className="text-sm text-foreground/35">
                  {categoryLabel(meta.category)}
                </p>
              </Reveal>

              <section id="installation" className="mt-6">
                <SectionTitle>Installation</SectionTitle>

                <div className="w-full overflow-hidden rounded-xl border border-border/60">
                  <div className="flex h-10 items-center border-b border-border/50 px-3">
                    <div className="flex items-center gap-0.5" role="tablist">
                      {(["cli", "manual"] as const).map((tab) => (
                        <button
                          key={tab}
                          role="tab"
                          data-state={
                            installTab === tab ? "active" : "inactive"
                          }
                          onClick={() => setInstallTab(tab)}
                          className={`relative h-7 rounded-md px-3 text-sm transition-colors ${
                            installTab === tab
                              ? "text-foreground"
                              : "text-text-muted hover:text-foreground"
                          }`}
                        >
                          {installTab === tab && (
                            <motion.span
                              layoutId="install-tab"
                              transition={SPRING_LAYOUT}
                              className="absolute inset-0 rounded-md bg-surface-hover"
                            />
                          )}
                          <span className="relative z-10 uppercase">{tab}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence mode="popLayout" initial={false}>
                    {installTab === "cli" ? (
                      <motion.div
                        key="cli"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={SPRING_SWAP}
                        className="p-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 rounded-lg bg-(--code-bg) px-4 py-3 font-mono text-[13px] text-text-secondary">
                          <span className="truncate">
                            <span className="text-text-muted">$</span>{" "}
                            {installCmd}
                          </span>
                          <IconCopy code={installCmd} />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="manual"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={SPRING_SWAP}
                        className="space-y-8 p-4"
                      >
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
                              <CopyButton
                                code={UTIL_CODE}
                                componentName="util-cn"
                              />
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
                            components/ui/{fileName}
                          </div>
                          <div className="relative mt-2 overflow-hidden rounded-xl border border-border bg-background-200">
                            <div className="absolute right-2 top-2 z-10">
                              <CopyButton
                                code={meta.code}
                                componentName={`src-${slug}`}
                              />
                            </div>
                            <CodeBlock
                              code={meta.code}
                              lang="tsx"
                              numbered
                              expandable
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              <section id="file-structure">
                <SectionTitle>File Structure</SectionTitle>
                <div className="overflow-hidden rounded-xl border border-border/60 p-2">
                  <TreeRow name="your-project" />
                  <div className="relative ml-6 before:absolute before:-left-2 before:inset-y-0 before:w-px before:bg-border">
                    <TreeRow name="components/ui" />
                    <div className="relative ml-6 before:absolute before:-left-2 before:inset-y-0 before:w-px before:bg-border">
                      <TreeRow name={fileName} file accent />
                    </div>
                    <TreeRow name="lib" />
                    <div className="relative ml-6 before:absolute before:-left-2 before:inset-y-0 before:w-px before:bg-border">
                      <TreeRow name="utils.ts" file />
                    </div>
                  </div>
                </div>
              </section>

              <section id="usage">
                <SectionTitle>Usage</SectionTitle>
                <figure className="relative overflow-hidden rounded-xl border border-border/60">
                  <div className="absolute right-2 top-2 z-10">
                    <CopyButton code={usage} componentName={`usage-${slug}`} />
                  </div>
                  <div className="p-1.5">
                    <div className="overflow-hidden rounded-lg">
                      <CodeBlock code={usage} lang="tsx" />
                    </div>
                  </div>
                </figure>
              </section>

              <section id="api-reference">
                <SectionTitle>API Reference</SectionTitle>
                <div className="overflow-hidden rounded-xl border border-border/60">
                  {props.map((p, i) => (
                    <div
                      key={p.name}
                      className={`flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:gap-4 ${
                        i > 0 ? "border-t border-border/60" : ""
                      }`}
                    >
                      <div className="w-44 shrink-0">
                        <code className="whitespace-nowrap rounded-lg bg-surface px-2 py-1 text-sm text-foreground">
                          {p.name}
                        </code>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <code className="whitespace-nowrap rounded-md bg-surface/60 px-2 py-0.5 font-mono text-sm text-foreground/60">
                            {p.type}
                          </code>
                          <div className="flex-1" />
                          {p.default && p.default !== "-" ? (
                            <code className="max-w-48 shrink-0 overflow-x-auto whitespace-nowrap rounded-md bg-surface/60 px-2 py-0.5 font-mono text-sm text-foreground">
                              {p.default}
                            </code>
                          ) : (
                            <span className="shrink-0 text-sm text-foreground/30">
                              —
                            </span>
                          )}
                        </div>
                        <p className="text-sm/relaxed text-foreground/40">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {Array.isArray(meta.notes) && meta.notes.length > 0 && (
                <section id="notes">
                  <SectionTitle>Notes</SectionTitle>
                  <ul className="flex list-disc flex-col gap-1 pl-5 text-lg/relaxed font-light tracking-wide text-foreground/80">
                    {meta.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="mt-16 border-t border-border pb-24 pt-8">
                <p className="mb-3 text-3xl tracking-tight text-foreground">
                  Keep in mind
                </p>
                <p className="max-w-prose text-lg/relaxed text-foreground/80">
                  Every component here is meant to be copied into your project
                  and owned by you — edit the source freely. If a component
                  breaks in your setup,{" "}
                  <Link
                    href="/components"
                    className="underline decoration-foreground/20 underline-offset-4 transition-colors hover:text-foreground/60 hover:decoration-foreground/40"
                  >
                    browse the registry
                  </Link>{" "}
                  for an updated version.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: floating live-preview stage + code drawer (desktop only) */}
        <div className="hidden lg:block lg:h-dvh lg:w-1/2">
          <StagePanel {...stageProps} />
        </div>
      </div>
    </div>
  );
}
