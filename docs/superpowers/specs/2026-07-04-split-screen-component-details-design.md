# Split-Screen Component-Details Page — Design

**Date:** 2026-07-04
**Target file:** `apps/docs/app/components/[slug]/page.tsx`
**Reference:** https://ui.unlumen.com/components/apple-switch

## Goal

Restructure the component-details page from the current 3-column docs layout
(left nav / center content / right TOC, inline preview card) into a **50/50
split-screen** modeled on unlumen: a fixed live-preview stage on the right half,
independently-scrolling docs on the left, and a fade-on-hover component nav
pinned to the far-left edge.

## Scope decisions (locked)

- **1A — Full 50/50 split.** Fixed preview stage right, scrolling docs left.
- **2A — Keep the multi-style switcher.** Style chips live in the docs column;
  the right stage renders the active style.
- **3B — Fade-on-hover edge nav.** Component list overlays the far-left edge,
  faded/non-interactive at rest, revealed on hover.
- **Navbar dropped** on this page. Theme toggle moves into the stage toolbar.

## Layout

### Desktop (≥ lg)

Page shell is `h-dvh overflow-hidden` — the shell never scrolls. Two panes:

- **Left pane (`w-1/2`, `overflow-y-auto`)** — docs. Content centered in a
  `max-w-2xl` column with responsive padding (`px-6 md:px-12 py-10 md:py-16`).
  Only element on the page that scrolls.
- **Right pane (`fixed right-0 top-0 h-dvh w-1/2`)** — live-preview stage.
  Renders the active style. Retains the existing dot-grid background.

### Mobile / tablet (< lg)

Single column, normal document flow (shell becomes `min-h-dvh`, not fixed):

1. Preview card (inline, **not** fixed) — the stage rendered as a bordered card.
2. Docs content below (breadcrumb, title, switcher, installation, props, notes).

Edge nav is hidden < lg; navigation falls back to `/components` breadcrumb link.

## Right stage

- Component centered, generous negative space, dot-grid background
  (`radial-gradient(var(--border) 1px, transparent 1px)`, `22px` grid).
- **Floating pill toolbar, bottom-center** — 4 actions:
  - `⟳ reset` — re-mounts the preview (via a `key` bump) to replay entry motion.
  - `☾ theme` — theme toggle (reuses existing `ThemeToggle` behavior).
  - `⤢ fullscreen` — expands the stage to a full-viewport overlay.
  - `</> code` — toggles the code drawer.
- **Code drawer** — slides up over the stage (`AnimatePresence`), shows the
  active style's demo source (`CodeBlock`) + `CopyButton`. Replaces the current
  inline preview/code tabs; code now lives in the stage, not the docs column.

## Left docs column — sections (top → bottom)

1. **Breadcrumb** — `Components / {name}`, thin, muted.
2. **Header** — `h1` title, description, status chips (category · new/stable).
   Minimal type: light weight, tight tracking (match current tokens).
3. **Style switcher chips** — `default · gradient · …`. Active chip drives the
   right stage (desktop) / inline preview (mobile). Keep the existing Pro badge.
4. **Installation** — keep the existing CLI / manual tabbed block unchanged
   (CLI command; manual = deps → util file → source, with copy buttons).
5. **Props** — existing props data, table styled as unlumen's API reference:
   one row per prop (name · type · default · description).
6. **Notes** — optional bullet list. Renders only when a component supplies
   `notes`. Wire the slot now; leave data empty (no notes authored yet).

The right-side "On this page" TOC and scroll-spy are **removed** (the split
layout makes them redundant — the docs column is short).

## Edge nav (fade-on-hover)

- Fixed to the left edge, overlays the docs column (`pointer-events-none` at
  rest, no layout width).
- Component list grouped by category (reuse existing `navGroups` build).
- At rest: low opacity + slight blur. On hover of a left hot-zone (or the nav
  itself): `opacity-100`, `blur-0`, `pointer-events-auto`, via a group-hover /
  hover state. Active item marked with the accent bar + emphasized label.
- Hidden < lg.

## State (client component, unchanged shape where possible)

- `activeStyle` — index into `meta.styles`. Drives stage + code drawer.
- `showCode` — code drawer open/closed (replaces the `view` preview/code toggle).
- `installTab` — CLI / manual (unchanged).
- `fullscreen` — stage overlay open/closed (new).
- `previewKey` — bumped by reset to re-mount the preview (new).
- **Removed:** `activeSection` + the IntersectionObserver scroll-spy.

## Components touched

- `apps/docs/app/components/[slug]/page.tsx` — rewritten layout; preview render
  map, install block, props table, loading/404 states preserved.
- Reused as-is: `CopyButton`, `CodeBlock`, `ThemeToggle`, `components` registry,
  `COMPONENT_CATEGORIES`, the `previews` render map, `Reveal`.

## Non-goals

- No change to the component registry, data model, or other routes
  (`/components`, `/docs`, landing).
- No new dependencies.
- Notes content authoring (slot only).
- Exact-pixel unlumen replication of type/color — use existing Devigner tokens.

## Testing / verification

- Manual: run the docs app, load a component page, verify at ≥ lg (split,
  fixed stage scrolls independently), and < lg (stacked). Exercise switcher →
  stage updates; toolbar reset / theme / fullscreen / code drawer; edge-nav
  hover reveal + active item; loading + 404 states.
- `tsc` clean.
