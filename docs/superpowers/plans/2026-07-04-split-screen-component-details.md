# Split-Screen Component-Details Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `apps/docs/app/components/[slug]/page.tsx` into a 50/50 split-screen (fixed live-preview stage right, scrolling docs left, fade-on-hover edge nav), keeping the multi-style switcher and dropping the navbar + TOC scroll-spy.

**Architecture:** Single client-component rewrite. The outer shell becomes `h-dvh overflow-hidden` on desktop with two panes; the left pane owns the only scroll. All existing data plumbing (registry, `previews` render map, `CopyButton`, `CodeBlock`, `ThemeToggle`, install/props content, loading + 404 states) is preserved and re-laid-out. Preview/code move from an inline card into the right stage + a slide-up code drawer.

**Tech Stack:** Next.js (app router, client component), React, `motion/react`, Tailwind v4, existing Devigner design tokens.

**Reference spec:** `docs/superpowers/specs/2026-07-04-split-screen-component-details-design.md`

**Verification note:** The docs app has no unit-test harness. Each task's check step is (a) `cd apps/docs && npx tsc --noEmit` clean, and (b) Playwright visual check via the running dev server. There is no `typecheck` npm script — call `tsc` directly. Do NOT scaffold a test framework.

---

## Preserved as-is (do not rewrite)

These blocks in the current file stay byte-for-byte; only their placement in JSX changes:

- Lines ~85–360: all preview subcomponents (`BtnDefault`…`HeroParallax`) and the `previews` render map.
- `UTIL_CODE`, `depsFor()` helper.
- `Reveal` component.
- The `!slug` loading state and the `!meta || !currentStyle` 404 state JSX (reused verbatim, minus the `<Navbar />` line — see Task 1).
- `navGroups`, `categoryLabel`, install-command / deps derivation.

Removed entirely: the `Navbar` component, `activeSection` state, the `toc` array, the IntersectionObserver scroll-spy `useEffect`, the right-hand "On this page" `<aside>`, the `view` state (replaced by `showCode`).

---

## Task 1: Split-screen shell + left docs column

Convert the layout to two panes. Right pane is a placeholder in this task (just the centered preview on the dot-grid, no toolbar yet). Left pane holds all docs sections. Drop the navbar, TOC, and scroll-spy.

**Files:**

- Modify: `apps/docs/app/components/[slug]/page.tsx`

- [ ] **Step 1: Remove dead code**

Delete the `Navbar` function (currently ~lines 45–83). In `ComponentPageInner`: delete `activeSection` state, the scroll-spy `useEffect` (the `IntersectionObserver` block), the `toc` const, and replace `const [view, setView] = useState<"preview" | "code">("preview")` with `const [showCode, setShowCode] = useState(false)`. Add:

```tsx
const [fullscreen, setFullscreen] = useState(false);
const [previewKey, setPreviewKey] = useState(0);
```

In the loading + 404 returns, remove the `<Navbar />` line (keep everything else).

- [ ] **Step 2: Replace the main return's outer structure**

Replace the entire final `return ( ... )` of `ComponentPageInner` (the `<div className="min-h-dvh bg-background">…</footer></div>`) with the split shell below. It references two helpers added in later tasks — for THIS task, inline the stage as a plain centered preview and stub the edge nav as an empty fragment so it compiles:

```tsx
return (
  <div className="relative bg-background lg:h-dvh lg:overflow-hidden">
    <div className="grain-overlay" />

    {/* Edge nav — implemented in Task 3; placeholder keeps layout stable */}
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
            {/* breadcrumb */}
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

          {/* Style switcher */}
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

          {/* Installation — keep existing block verbatim */}
          <section id="installation" className="mt-14">
            {/* PASTE the existing Installation <section> inner content here
                (the <h2>Installation</h2> through the manual-install steps),
                unchanged except: remove `scroll-mt-28` from the section. */}
          </section>

          {/* Props — keep existing table, restyled heading */}
          <section id="props" className="mt-14">
            {/* PASTE the existing Props <section> inner content here,
                unchanged except: remove `scroll-mt-28`. */}
          </section>

          {/* Notes — slot only; renders nothing until data exists */}
          {Array.isArray((meta as { notes?: string[] }).notes) &&
            (meta as { notes?: string[] }).notes!.length > 0 && (
              <section className="mt-14">
                <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">
                  Notes
                </h2>
                <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-text-secondary">
                  {(meta as { notes?: string[] }).notes!.map((n, i) => (
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
```

- [ ] **Step 3: Add temporary stubs so it compiles**

Above `export default function ComponentPage`, add minimal stubs (replaced in later tasks):

```tsx
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
```

Move the two `{/* PASTE … */}` blocks: copy the current Installation and Props `<section>` bodies into the marked slots, deleting the originals. Keep `CopyButton` / `CodeBlock` imports.

- [ ] **Step 4: Typecheck**

Run: `cd apps/docs && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Visual check (both breakpoints)**

Start dev (`npm --prefix apps/docs run dev`), open `/components/button`.

- Resize to 1440×900: two panes, left docs scrolls, right shows the preview centered on the dot-grid, no navbar.
- Resize to 390 wide: single column, inline preview card on top, docs below.
  Switcher chips change the rendered preview in both.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/app/components/\[slug\]/page.tsx
git commit -m "feat: split-screen shell + left docs column for component page"
```

---

## Task 2: Right stage — toolbar, code drawer, reset, fullscreen

Replace the `Stage`, `PreviewCard`, and `FullscreenStage` stubs with real implementations sharing one `StageToolbar`.

**Files:**

- Modify: `apps/docs/app/components/[slug]/page.tsx`

- [ ] **Step 1: Add the toolbar + drawer implementations**

Replace the four stubs from Task 1 Step 3 (`Stage`, `PreviewCard`, `FullscreenStage`, keep `dotGrid` + `StageProps`) with:

```tsx
import { AnimatePresence } from "motion/react"; // add to existing motion import

function StageToolbar({
  showCode,
  setShowCode,
  onReset,
  onFullscreen,
}: Pick<StageProps, "showCode" | "setShowCode" | "onReset" | "onFullscreen">) {
  const btn =
    "flex size-8 items-center justify-center rounded-full text-text-muted transition-colors hover:text-foreground";
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-background/80 p-1 shadow-elevated backdrop-blur-md">
      <button
        className={btn}
        onClick={onReset}
        aria-label="Reset preview"
        title="Reset"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
      <ThemeToggle />
      <button
        className={btn}
        onClick={onFullscreen}
        aria-label="Fullscreen preview"
        title="Fullscreen"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" />
        </svg>
      </button>
      <button
        className={`${btn} ${showCode ? "text-accent hover:text-accent" : ""}`}
        onClick={() => setShowCode(!showCode)}
        aria-label="Toggle code"
        aria-pressed={showCode}
        title="View code"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
        </svg>
      </button>
    </div>
  );
}

function CodeDrawer({
  usage,
  slug,
  styleSlug,
  onClose,
}: Pick<StageProps, "usage" | "slug" | "styleSlug"> & { onClose: () => void }) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="absolute inset-x-0 bottom-0 z-20 max-h-[70%] overflow-hidden rounded-t-2xl border-t border-border bg-background-200"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-mono text-[11px] text-text-muted">
          {slug}-{styleSlug}-demo.tsx
        </span>
        <div className="flex items-center gap-1">
          <CopyButton
            code={usage}
            componentName={`${slug}-${styleSlug}-demo`}
          />
          <button
            className="flex size-7 items-center justify-center rounded-md text-text-muted hover:text-foreground"
            onClick={onClose}
            aria-label="Close code"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="code-scroll max-h-[calc(70vh-40px)] overflow-y-auto bg-(--code-bg)">
        <CodeBlock code={usage} lang="tsx" />
      </div>
    </motion.div>
  );
}

function Stage(props: StageProps) {
  return (
    <div className="relative h-dvh overflow-hidden">
      <div
        className="flex h-full items-center justify-center p-12"
        style={dotGrid}
      >
        <div key={props.previewKey}>{props.preview}</div>
      </div>
      <div className="absolute inset-x-0 bottom-6 z-30 flex justify-center">
        <StageToolbar {...props} />
      </div>
      <AnimatePresence>
        {props.showCode && (
          <CodeDrawer
            usage={props.usage}
            slug={props.slug}
            styleSlug={props.styleSlug}
            onClose={() => props.setShowCode(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PreviewCard(props: StageProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      <div
        className="flex min-h-80 items-center justify-center p-6"
        style={dotGrid}
      >
        <div key={props.previewKey}>{props.preview}</div>
      </div>
      <div className="absolute inset-x-0 bottom-3 z-30 flex justify-center">
        <StageToolbar {...props} />
      </div>
      <AnimatePresence>
        {props.showCode && (
          <CodeDrawer
            usage={props.usage}
            slug={props.slug}
            styleSlug={props.styleSlug}
            onClose={() => props.setShowCode(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FullscreenStage({
  preview,
  previewKey,
  onClose,
}: {
  preview: React.ReactNode;
  previewKey: number;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background"
    >
      <div
        className="flex h-full items-center justify-center p-12"
        style={dotGrid}
      >
        <div key={previewKey}>{preview}</div>
      </div>
      <button
        onClick={onClose}
        className="absolute right-6 top-6 flex size-9 items-center justify-center rounded-full border border-border bg-background/80 text-text-muted shadow-elevated backdrop-blur-md hover:text-foreground"
        aria-label="Exit fullscreen"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}
```

Wrap the Task-1 `{fullscreen && <FullscreenStage … />}` in `<AnimatePresence>` so the exit animation plays:

```tsx
<AnimatePresence>
  {fullscreen && (
    <FullscreenStage
      preview={preview}
      previewKey={previewKey}
      onClose={() => setFullscreen(false)}
    />
  )}
</AnimatePresence>
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/docs && npx tsc --noEmit`
Expected: no errors. (If `ThemeToggle` renders a `<button>` that visually clashes in the pill, that is fine for now — sizing handled by its own styles.)

- [ ] **Step 3: Visual check**

Dev server, `/components/button` at 1440 wide:

- Toolbar pill sits bottom-center of the right stage.
- `</>` opens a code drawer sliding up over the stage; copy + close work; drawer closes on re-click.
- `⟳` replays the preview's entry motion (e.g. magnetic/spring components re-mount).
- `⤢` opens a full-viewport preview; the × closes it.
- Theme button toggles light/dark.
  At 390 wide: same toolbar works on the inline `PreviewCard`.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/app/components/\[slug\]/page.tsx
git commit -m "feat: stage toolbar, code drawer, reset, and fullscreen"
```

---

## Task 3: Fade-on-hover edge nav

Replace the `EdgeNav` stub with the real fade-on-hover overlay (desktop only).

**Files:**

- Modify: `apps/docs/app/components/[slug]/page.tsx`

- [ ] **Step 1: Implement EdgeNav**

Replace the `EdgeNav` stub with:

```tsx
function EdgeNav({
  navGroups,
  activeSlug,
}: {
  navGroups: Record<string, { slug: string; name: string }[]>;
  activeSlug: string;
}) {
  return (
    <div className="group pointer-events-none fixed left-0 top-0 z-40 hidden h-dvh lg:block">
      {/* hover hot-zone along the left edge */}
      <div className="pointer-events-auto absolute left-0 top-0 h-full w-4" />
      <nav
        className="pointer-events-none h-full w-64 overflow-y-auto px-5 py-16 opacity-0 blur-[3px] transition-all duration-300 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:blur-0"
        aria-label="Components"
      >
        <div className="space-y-6">
          {Object.entries(navGroups).map(([category, items]) => (
            <div key={category}>
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                {categoryLabel(category)}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = item.slug === activeSlug;
                  return (
                    <li key={item.slug}>
                      <Link
                        href={`/components/${item.slug}`}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors duration-150 ${
                          active
                            ? "font-medium text-foreground"
                            : "text-text-secondary hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`h-4 w-0.5 rounded-full ${active ? "bg-accent" : "bg-transparent"}`}
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/docs && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Visual check**

`/components/button` at 1440 wide:

- Nav is faint/blurred at the far-left edge at rest and does not block clicks on the docs beneath (except the 16px hot-zone).
- Moving the cursor to the left edge reveals it crisp + interactive; active component shows the accent bar.
- Clicking another component navigates.
  At < lg the nav is absent.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/app/components/\[slug\]/page.tsx
git commit -m "feat: fade-on-hover edge nav"
```

---

## Task 4: Final polish + full verification

**Files:**

- Modify: `apps/docs/app/components/[slug]/page.tsx` (only if checks surface issues)

- [ ] **Step 1: Confirm removed code is gone**

Grep the file — each must return nothing:

```bash
cd apps/docs && grep -nE "IntersectionObserver|activeSection|On this page|function Navbar|setView\(" app/components/\[slug\]/page.tsx
```

Expected: no matches.

- [ ] **Step 2: Lint + typecheck**

Run: `cd apps/docs && npx tsc --noEmit && npm run lint`
Expected: both clean. Fix any unused-import warnings (e.g. drop `useRef` if no longer used, keep it if a preview uses it).

- [ ] **Step 3: Full Playwright pass (desktop)**

At 1440×900 on `/components/card` (multi-style, has spring/spotlight previews):

- Split layout; left scrolls independently; right stage fixed.
- Switcher updates the stage; installation CLI/manual tabs work; props table renders.
- Toolbar: reset, theme, fullscreen, code drawer all functional.
- Edge nav hover reveal + active marker + navigation.

- [ ] **Step 4: Full Playwright pass (mobile) + edge states**

At 390×844: stacked single column, inline preview card on top with working toolbar, docs below, no edge nav.
Also load `/components/does-not-exist` → 404 state renders (no navbar). Reload with throttling → loading spinner state renders.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify split-screen component page across breakpoints"
```

---

## Self-review

- **Spec coverage:** shell 50/50 + fixed stage (Task 1/2) ✓; mobile stacked (Task 1) ✓; style switcher drives stage (Task 1) ✓; toolbar 4 actions + code drawer + reset + fullscreen (Task 2) ✓; installation kept (Task 1) ✓; props as API ref (Task 1) ✓; notes slot (Task 1) ✓; edge nav fade-on-hover (Task 3) ✓; navbar/TOC/scroll-spy removed (Task 1, verified Task 4) ✓; no new deps (`AnimatePresence` is already in `motion`) ✓.
- **Placeholder scan:** the two `{/* PASTE … */}` markers are explicit move-instructions with exact source blocks named, not vague TODOs. No "add error handling" style gaps.
- **Type consistency:** `StageProps` defined once (Task 1 Step 3); `Stage`/`PreviewCard` consume it; `CodeDrawer`/`StageToolbar` use `Pick<StageProps, …>`; `previewKey`/`showCode`/`setShowCode`/`onReset`/`onFullscreen` names match across tasks.
