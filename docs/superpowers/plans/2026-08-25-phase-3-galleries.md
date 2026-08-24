# Phase 3 — Galleries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the flat 700-line gallery into two category-led surfaces — Components and Blocks — showing only what exists, in the brand palette, at 100 accessibility.

**Architecture:** Category-nested routes replace the flat `[slug]` route. Previews move out of the page into one file per component. The `.shadcn-scope` neutral override is dropped so the galleries wear the brand, which also resolves a contrast failure the token fix cannot reach.

**Tech Stack:** Next.js 15 App Router (RSC), React 19, Tailwind v4, `reicon-react`, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-24-marketing-site-redesign-design.md`

## Global Constraints

- Lighthouse target **100 / 100 / 100 / 100**. `/components` currently scores 100 / **87** / 100 / 100.
- **Never print a count or imply breadth.** Banned in copy: "many", "dozens", "hundreds", "every style", or any total. Spec §2.1.
- No factual claim written or altered without sign-off.
- Palette, grain, double-bezel and OKLCH tokens preserved.
- Commits authored by REMI alone — no `Co-Authored-By`, no `Generated with Claude Code`, no 🤖 footer.
- ~50 pre-existing uncommitted paths belong to the user. Stage only files you modified, by explicit path. Never `git add -A`, never `git stash`. **Check `git diff --cached --name-only` before every commit.**
- Verify file and line references against HEAD, not the working tree.

---

## Spec correction — resolved before Task 1

Spec §5.1 specifies both `/components/[category]` and `/components/[slug]`. **This is not buildable.** Next.js resolves one dynamic segment per position; two sibling dynamic routes at the same depth collide.

**Ruling: nest detail pages under their category.**

| Route | Purpose |
|---|---|
| `/components` | Component category index |
| `/components/[category]` | Every design in one component category |
| `/components/[category]/[slug]` | Component detail |
| `/blocks` | Block category index |
| `/blocks/[category]` | Every design in one block category |
| `/blocks/[category]/[slug]` | Block detail |

The spec's stated reason for keeping detail flat was avoiding redirects. That reason is void: the site is unlaunched, so no external URL depends on `/components/[slug]`. Nesting also gives a real breadcrumb hierarchy, which Phase 4's `BreadcrumbList` JSON-LD wants anyway.

`/api/registry/[slug]` is **unchanged** — the CLI contract is flat and stays flat. Only page routes nest.

Cost if wrong: page URLs change once, before anyone has linked to them.

---

### Task 1: Category-led routes

**Files:**
- Modify: `apps/docs/app/components/page.tsx`
- Create: `apps/docs/app/components/[category]/page.tsx`
- Move: `apps/docs/app/components/[slug]/page.tsx` → `apps/docs/app/components/[category]/[slug]/page.tsx`
- Move: `apps/docs/app/components/[slug]/layout.tsx` → delete (see Task 4)
- Create: `apps/docs/app/blocks/page.tsx`, `apps/docs/app/blocks/[category]/page.tsx`, `apps/docs/app/blocks/[category]/[slug]/page.tsx`
- Test: `apps/docs/lib/gallery-routes.test.ts`

**Interfaces:**
- Consumes: `getCategories(kind)` and `components` from `apps/docs/lib/registry.ts`.
- Produces: `generateStaticParams` on every dynamic route, so all gallery pages prerender.

- [ ] **Step 1: Write the failing test**

Create `apps/docs/lib/gallery-routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { components, getCategories } from "./registry";

describe("gallery route params", () => {
  it("every component resolves to a category that exists", () => {
    for (const c of Object.values(components)) {
      const kind = c.kind;
      const found = getCategories(kind).find((cat) => cat.slug === c.category);
      expect(found, `${c.slug} has no category`).toBeTruthy();
    }
  });
  it("category and slug together are unique per surface", () => {
    const seen = new Set<string>();
    for (const c of Object.values(components)) {
      const key = `${c.kind}/${c.category}/${c.slug}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});
```

- [ ] **Step 2: Run it**

```bash
cd apps/docs && pnpm test
```

Expected: PASS. It locks the invariant the nested routes depend on.

- [ ] **Step 3: Build the two category indexes**

`/components/page.tsx` and `/blocks/page.tsx` are server components listing `getCategories(kind)`. Each category links to `/{surface}/{category}`. No counts. An empty category never renders — `getCategories` already filters those out.

Both pages must render a `<main>` landmark; its absence is one of the four accessibility failures.

- [ ] **Step 4: Build the category pages**

`/{surface}/[category]/page.tsx` lists every design in that category, each linking to its detail page. `generateStaticParams` returns every category slug for that kind. Unknown category → `notFound()`.

- [ ] **Step 5: Move the detail route**

Move `app/components/[slug]/page.tsx` to `app/components/[category]/[slug]/page.tsx` and update its params type to `{ category: string; slug: string }`. `generateStaticParams` returns `{ category, slug }` pairs. Create the `/blocks` equivalent — it may re-export the same component if the two are identical.

- [ ] **Step 6: Build and verify every route prerenders**

```bash
cd "D:/Work D/Development Projects/new/devigner" && pnpm build 2>&1 | grep -A25 "Route (app)"
```

Expected: `/components`, `/blocks`, both `[category]` routes and both `[category]/[slug]` routes appear as `●` (SSG) with their real slugs listed. Anything showing `ƒ` (dynamic) means `generateStaticParams` is missing or wrong.

- [ ] **Step 7: Commit**

```bash
git diff --cached --name-only   # MUST be empty before staging
git add apps/docs/app/components apps/docs/app/blocks apps/docs/lib/gallery-routes.test.ts
git commit -m "feat(gallery): category-led routes for components and blocks

Detail pages nest under their category. Two sibling dynamic segments at the
same depth cannot coexist in the App Router, so the flat [slug] route could
not live alongside [category]. Nesting also gives a real breadcrumb hierarchy.

The CLI contract at /api/registry/[slug] is unchanged."
```

---

### Task 2: Previews move out, mocks and "Soon" go

`app/components/page.tsx` is ~700 lines declaring 15 previews inline, 7 of them marked `soon`, most of them bespoke JSX rather than the shipped components.

**Files:**
- Create: `apps/docs/components/gallery/previews/<slug>.tsx`, one per real registry component
- Create: `apps/docs/components/gallery/preview-map.tsx`
- Modify: `apps/docs/app/components/page.tsx` and the category pages

**Interfaces:**
- Consumes: `@devignerui/ui` exports — `Button`, `Input`, `Badge`, `Card`, `HeroSection`.
- Produces: `PREVIEWS: Record<string, React.ReactNode>` keyed by registry slug, consumed by every gallery surface.

- [ ] **Step 1: Extract one preview file per real component**

One file each for `button`, `input`, `badge`, `card`, `hero-section`. Each renders the **real** component from `@devignerui/ui`. No hand-rolled markup imitating a component.

- [ ] **Step 2: Delete every unbuilt tile**

Remove `TablePreview`, `SidebarPreview`, `CheckboxPreview`, `ComboboxPreview`, `RadioPreview`, `SwitchPreview`, `DescriptionListPreview`, `ListboxPreview`, `PaginationPreview`, `DropdownPreview`, `NavigationPreview`, `AvatarGroupPreview` — every preview with no registry component behind it — along with the `soon` prop on `PreviewCard` and the `READY` set.

The galleries show what exists. A category with nothing in it does not render.

- [ ] **Step 3: Reuse the map in the landing rail**

`components/landing/category-rail.tsx` declares its own `PREVIEWS`. Point it at the shared map so previews are defined once.

- [ ] **Step 4: Build and test**

```bash
pnpm build && cd apps/docs && pnpm test
```

- [ ] **Step 5: Commit**

```bash
git diff --cached --name-only   # MUST be empty before staging
git add apps/docs/components/gallery apps/docs/app/components apps/docs/components/landing/category-rail.tsx
git commit -m "refactor(gallery): extract previews, delete mock and unbuilt tiles

Previews were 15 inline declarations in a 700-line page, 7 marked Soon and
most of them bespoke JSX rather than the shipped components. Each real
component now has its own preview file rendering the actual component, and
the unbuilt tiles are gone rather than restyled."
```

---

### Task 3: Icons from `reicon-react`

**Files:**
- Modify: every file under `apps/docs/components/gallery/previews/` using an icon
- Modify: `apps/docs/app/components/**` and `apps/docs/app/blocks/**` inline SVGs

**Interfaces:**
- Consumes: `reicon-react/icons/<Name>` — per-icon subpaths, confirmed in Phase 1 (`icons.test.ts`).

- [ ] **Step 1: Confirm the icon names you need**

```bash
ls apps/docs/node_modules/reicon-react/icons | grep -iE "arrow|check|chevron|copy|search" | head -20
```

Use the exact filenames. Import per-icon, never the barrel:

```ts
import { ArrowRight } from "reicon-react/icons/ArrowRight";
```

- [ ] **Step 2: Replace every emoji and inline SVG in gallery code**

The emoji set (🔍 📥 🏠 📅 ⚡) dies with the deleted sidebar preview in Task 2; this step catches whatever remains, plus the hand-rolled `<svg>` paths for chevrons, checks and arrows.

- [ ] **Step 3: Verify the bundle did not balloon**

```bash
pnpm build 2>&1 | grep -A20 "Route (app)"
```

Per-icon imports are tree-shakeable; if `/components` First Load JS jumps materially, a barrel import crept in. Find it.

- [ ] **Step 4: Commit**

```bash
git diff --cached --name-only   # MUST be empty before staging
git add apps/docs/components/gallery apps/docs/app/components apps/docs/app/blocks
git commit -m "feat(gallery): icons from reicon-react

Replaces hand-rolled inline SVG paths with per-icon imports, which stay
tree-shakeable."
```

---

### Task 4: Drop `.shadcn-scope` and reach 100 accessibility

`/components` scores **87** on accessibility. Four audits fail, and one of them cannot be fixed by the Phase 2 token change.

**Files:**
- Modify: `apps/docs/app/components/page.tsx`, the category and detail pages
- Delete: `apps/docs/app/components/[slug]/layout.tsx` (superseded by Task 1's move)
- Modify: `apps/docs/app/globals.css` — only if the scope block becomes wholly unused

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: gallery surfaces rendering in the Devigner palette.

- [ ] **Step 1: Remove the scope wrapper**

Drop `.shadcn-scope` from the gallery surfaces. The override at `globals.css:224-283` pins literal shadcn neutrals — `oklch(1 0 0)` / `oklch(0.145 0 0)` — so the pages selling the library show it in someone else's palette, and Phase 2's contrast fix cannot reach them.

If nothing references `.shadcn-scope` afterwards, delete the two blocks from `globals.css` too. If the detail pages still want it, leave the CSS in place and say so in the report.

- [ ] **Step 2: Fix `button-name`**

Icon-only buttons in the previews have no accessible name. Every one gets an `aria-label` describing its action.

- [ ] **Step 3: Fix `landmark-one-main`**

Every gallery page wraps its content in exactly one `<main>`.

- [ ] **Step 4: Fix `heading-order`**

An `<h4>` appears with no `<h3>` above it. Make each page's heading levels descend without skipping.

- [ ] **Step 5: Re-measure**

```bash
pnpm build
pnpm --filter @devignerui/docs start
```

Then, in another shell — freeing the port first if a stale server holds it, since that serves a deleted `.next` and returns 500:

```bash
CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" \
npx lighthouse http://localhost:3000/components --preset=desktop --quiet \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu" \
  --output=json --output-path=lh-components.json
```

Expected: **100 / 100 / 100 / 100**. Check `/blocks` and one category page too. Anything below 100 gets itemised in the report, not rounded up.

- [ ] **Step 6: Commit**

```bash
git diff --cached --name-only   # MUST be empty before staging
git add apps/docs/app apps/docs/components/gallery
git commit -m "feat(gallery): brand palette and WCAG AA across both surfaces

Drops .shadcn-scope, which pinned literal shadcn neutrals so the pages selling
the library rendered it in someone else's palette — and which the token
contrast fix could not reach. Also names icon-only buttons, adds the missing
main landmark and repairs heading order."
```

---

### Task 5: Phase gate

- [ ] **Step 1: Full verification**

```bash
cd "D:/Work D/Development Projects/new/devigner"
pnpm build
pnpm --filter @devignerui/docs test
pnpm --filter @devignerui/docs typecheck
pnpm lint
```

Expected: all pass, 0 lint errors.

- [ ] **Step 2: Confirm no route regressed to dynamic**

Every gallery route must be `●` or `○` in the build output, never `ƒ`.

- [ ] **Step 3: Lighthouse on all gallery surfaces**

`/components`, `/blocks`, one `[category]` page, one detail page. Record every score in `docs/superpowers/plans/lighthouse-baseline.md`, replacing the Phase 2 table. **Do not round up or estimate.**

- [ ] **Step 4: Confirm the landing did not regress**

Task 2 Step 3 rewires the landing rail's previews. Re-run Lighthouse on `/` — it was 100/100/100/100 at Phase 2 exit and must stay there.

- [ ] **Step 5: Design detector**

```bash
cd apps/docs && node "C:/Users/ItsRe/.claude/skills/impeccable/scripts/detect.mjs" --json app components
```

Expected: no new antipatterns. The gradient-text hit at `globals.css:386` is pre-existing.

- [ ] **Step 6: State the exhibit honestly**

Every category still holds one design unless product work has landed. Say so plainly: the galleries render correctly but show a single card per category, and the landing's "two takes" headline remains undemonstrated.

---

## Self-review

**Spec coverage.** §5.1 → Task 1, with the routing conflict resolved above. §5.2 → Task 2 Step 2. §5.3 → Task 2 Step 1. §5.4 → Task 2 Steps 1–2. §5.5 → Task 3. §5.6 → Task 4 Step 1. §3.6's metadata work belongs to Phase 4 and is deliberately excluded. The four accessibility failures measured at Phase 2 exit → Task 4.

**Placeholders.** Icon names in Task 3 are discovered from the installed package rather than asserted, because the exact casing is not knowable from here.

**Type consistency.** `getCategories(kind)` returns categories carrying `components`; `kind` is `"component" | "block"` throughout, matching Phases 1 and 2. Route params are `{ category, slug }` in every nested detail route.

**Known risk.** Task 2 Step 3 rewires the landing rail. That is the one place Phase 3 can regress Phase 2's perfect landing score, which is why Task 5 Step 4 re-measures `/` explicitly.
