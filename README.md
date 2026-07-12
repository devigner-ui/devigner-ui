# Devigner UI

Copy-paste React components + blocks, built with Tailwind CSS v4. **This file is the single source of truth** — code that disagrees with it is wrong; fix the code, or amend this doc in the same PR.

**v1.2.0 · 2026-07-13**

```bash
npx devignerui init
npx devignerui add button
```

| Package            | Role                                    |
| ------------------ | --------------------------------------- |
| `@devignerui/ui`   | component library (npm, secondary path) |
| `@devignerui/cli`  | installer                               |
| `@devignerui/docs` | docs site — also _is_ the registry      |

`pnpm install` · `pnpm dev` · `pnpm build` · MIT.

---

## 1. Overview

- **Model:** copy-paste-first via CLI, not `npm install` of a component package. One canonical implementation per component (multi-Style model removed 2026-07-05). Users own the installed code; Devigner owns the catalog/docs/CLI.
- **Goals:** growing catalog of production-quality animated components; zero→styled in <60s via CLI; monetize via Pro tiers + docs site without gating browsing; installed code stays dependency-light (no runtime coupling to `@devignerui/ui`).
- **Audience:** Tailwind v4 + React 19 devs wanting more than raw shadcn/ui, especially motion-heavy marketing blocks; secondarily shadcn/ui users.
- **Scope:** registry/catalog, CLI, docs site, Creem monetization, `@devignerui/ui` npm mirror. Out of scope (§16): non-React frameworks, hosted token editor, no-code builder, theme marketplace.
- **Principles:** one data model many consumers (`registry.ts` is truth, never hand-authored twice) · semantic tokens never literals · copy-paste self-contained (React + `cn()` + listed deps only) · `strict: true` everywhere, no exceptions · docs site _is_ the registry · boring over clever (`forwardRef`+CVA+Tailwind; new patterns need a precedent recorded here, §3).
- **Non-goals:** not a design-token platform/theming SaaS; no Vue/Svelte codegen; no visual editor; `@devignerui/ui` is a secondary, thin mirror — never a divergent implementation.

## 2. Architecture

pnpm+Turborepo, 4 packages. Truth flows one way: `apps/docs/lib/registry.ts` → docs pages + `/api/registry*` → CLI (HTTP only, `DEVIGNER_REGISTRY_URL`, never a workspace import — identical behavior in-repo or installed globally) → user's project. `@devignerui/ui` is a curated npm mirror consumed directly instead of via CLI.

**Folders:**

```
apps/docs/               @devignerui/docs — Next 15 App Router
  app/api/registry*        GET index / GET one — read lib/registry.ts
  app/components/           page.tsx (grid), layout.tsx (shadcn-scope, §8), [slug]/page.tsx
  app/globals.css           CANONICAL tokens (§8)
  components/               docs-only UI (code-block, copy-button, theme-provider) — not distributed
  content/docs/             Fumadocs MDX guides (§17.6)
  lib/registry.ts           CANONICAL data source (§4, §6)
  lib/creem.ts              Payments/licensing
packages/ui/              @devignerui/ui — npm mirror
  src/components/*.tsx      one per registry slug, forwardRef
  src/styles/globals.css    own token set, not a value-mirror of docs's (§8)
packages/cli/             @devignerui/cli — thin HTTP client + commands/{init,add,list}
packages/shared/          types.ts, constants.ts — dependency floor
```

New top-level package → `packages/*` (publishable) or `apps/*` (deployable); never nest a package inside another's `src/`.

**Module boundaries** (enforced by review until ~50 components, then `dependency-cruiser` in CI):
| Package | imports | never imports |
|---|---|---|
| `shared` | nothing internal | any internal package |
| `ui` | `shared` | `cli`, `apps/docs` |
| `cli` | `shared` (types only; HTTP to docs otherwise) | `ui`, `apps/docs` |
| `apps/docs` | `ui`, `shared` | `cli` |

**Dependency rules:** `apps/docs` uses `workspace:*`; CLI has zero workspace runtime deps besides `shared` types (keep its tree minimal — `commander` only); only `cli` touches Node-only APIs (`ui` stays isomorphic); new deps need (a) a problem Tailwind/React can't solve in <20 lines, (b) placement in the most specific package — root only for shared dev tooling.

**Patterns:** CVA variant-prop (`Button`, `Badge`) · compound family (`Card`+sub-parts, no cross-imports) · variant-dispatcher block (`HeroSection`) · one file per component · registry-as-code (typed TS, JSON is a build output, never hand-authored) · thin HTTP client (CLI has no catalog logic) · route-scoped token override (`components/layout.tsx`, §8 — a value-set swap via a wrapping class, no second Tailwind root).

**Rendering:** RSC by default; `"use client"` on the smallest leaf (today `ComponentPage`/`ComponentsPage` are whole-page client components — split further as the catalog grows). Registry API routes are `force-static` + `generateStaticParams()`. `@devignerui/ui` is server-renderable unless a component needs state/motion.

**State:** no global state lib (component-local `useState` suffices); page UI state lives in the page; theme persists in `localStorage` + a pre-paint inline script + `.dark` class, read/written by `ThemeProvider`/`ThemeToggle`; registry content isn't "state" (static, no React Query/SWR). Reach for Context before a state library; a state library only once ≥2 unrelated features need cross-cutting client state.

## 3. Component System

**Vocabulary (binding):** **Component** = one slug/category/props-contract/implementation (`button`). **Variant** = a CVA prop value, doesn't change installed files (`variant="outline"`). **Block** = a Component with `type: "block"` (`hero-section`), otherwise normal rules. ("Style" — parallel installable treatments — removed 2026-07-05.) A variant is never installed independently.

**Anatomy:** one `.tsx` + shared `lib/utils.ts`. `forwardRef` mandatory on every leaf (exception: a pure variant-dispatcher like `HeroSection` — though new block dispatchers should still forward a ref; a gap in `HeroSection` today, §17). `className` merged last via `cn()`. `displayName` always set. Props interface always exported as `<Component>Props`.

**Categories** (`packages/shared/src/constants.ts`, `COMPONENT_CATEGORIES`): `primitives`, `forms`, `feedback`, `navigation`, `overlays`, `marketing`, `animation`, `layout`. Exactly one per Component; new category → add to the constant, never invent ad hoc; registry `category` stores the _key_ (not the label — was real drift, §17.4).

**Subcategories:** none yet — add optional `subcategory?: string` only past ~25 components in one category.

**Variants:** exactly one implementation per Component; visual variation is CVA `variant`/`size` only, never parallel files.

**Slots:** no `asChild`/Slot API today (`Button`'s unimplemented `asChild` was removed, zero callers, §17.5). Adopt `@radix-ui/react-slot` when a real composition need arises — don't preempt it.

**Lifecycle field:** removed with multi-Style. Optional `status?: "new"|"updated"|"stable"` if wanted later.

**Composition patterns:** atomic (one element) · compound (subcomponents composed in JSX, never cross-import) · slotted props (accepts components as props, e.g. `HeroSection`'s actions).

**Component lifecycle:** Planned → InDevelopment → New (2wk) → Stable ⇄ Updated → Deprecated → Removed (next major version). Never silently delete while a published CLI could still request it — deprecate first.

**Accessibility (non-negotiable, PR-reviewed, no automated gate yet):** real semantic elements, never `<div onClick>` in distributed source (docs-only previews exempt but should still be fixed); `focus-visible:ring-2 focus-visible:ring-ring` on every focusable element; WCAG AA contrast in both themes; `prefers-reduced-motion` respected globally + `useReducedMotion()` in Motion components (see the `Reveal` pattern); toggle state via `aria-checked`/`aria-pressed`, never color alone.

**Responsive:** mobile-first, Tailwind v4 default breakpoints only, no bespoke pixel values; docs pages use the established 3-tier nav pattern (full nav ≥`lg`, single column <`sm`, TOC rail hides <`lg`/`xl`) rather than a hamburger.

**Theme integration:** every component renders correctly with zero modification under `.dark`, as long as it only uses semantic tokens (never raw palette/hex — `Button`/`Badge` used to violate this, §17, now fixed). **Binding sub-rule:** `accent`/`accent-foreground` = subtle tint/hover only; `primary`/`primary-foreground` = selected/checked/active/CTA. Load-bearing wherever a route's `accent` is a low-contrast tint by design (§8's shadcn scope) — see §17.

## 4. Dynamic Data Model

`apps/docs/lib/registry.ts` is the only place Component content is authored — one `components: Record<string, ComponentData>` literal.

```ts
interface PropDef {
  name: string;
  type: string;
  default: string;
  description: string;
}
interface ComponentData {
  slug;
  name;
  description;
  category: string;
  variants: string[];
  props: PropDef[];
  code: string;
  usage: string;
  notes?: string[];
}
```

**Target v2 shape** (add fields incrementally, only when a concrete feature needs them — never speculatively): `tags?: string[]` (search/filter) · `frameworks?: Array<"react"|"vue"|"svelte">` (2nd framework) · `version?: string` + `changelog?: {...}[]` (CLI `update` command) · `documentation?: { accessibility?, doAndDont?, commonMistakes? }` (§7 fields go structured) · `events?: PropDef[]`. All additive/optional — zero migration on introduction (§6).

**Live previews:** hand-authored in `[slug]/page.tsx` (`BtnDefault`, etc.), keyed by `previews[slug]` — not generated from `code`/`usage`. `Button` (+ `Input` on the grid) are exceptions that render the real `packages/ui` component. Intentional duplication with `code`/`usage`; keep manually in sync and **on the same tokens** (§17), never `eval(code)`.

**Code snippets:** `code` = what the CLI writes to disk (library-only). `usage` = what's shown in the Code tab / pasted by a consumer (a runnable `Example()`). **Binding:** `code`'s token classes must exactly match the `packages/ui` source they describe — not just look similar (§17); candidate for `pnpm validate:registry`, §13.

## 5. TypeScript Standards

- `strict: true` everywhere, no exceptions, no per-flag opt-outs.
- Props: `interface <Component>Props extends React.<X>HTMLAttributes<HTMLElement>` (or `ComponentPropsWithoutRef`) — extend, don't redeclare. `interface` for object shapes, `type` for unions/intersections/function aliases. PascalCase, no `I` prefix.
- No generic `Polymorphic<T>` factories — reach for `@radix-ui/react-slot` if/when an `as`-prop is genuinely needed.
- Prefer `VariantProps<typeof xVariants>`, `Omit`/`Pick`/`Partial`/`Record` over hand-rolled equivalents; `Record<string,T>` for slug-keyed maps, not `Map`.
- Naming: PascalCase components/types · camelCase functions/hooks · `xVariants` suffix for CVA configs · UPPER_SNAKE_CASE constants · kebab-case slugs.
- Files: `kebab-case.tsx` matching the installed filename exactly; named exports except Next's mandated defaults.
- No `any` (use `unknown` + narrow); no non-null `!` outside a locally-guaranteed invariant (documented); explicit return types on non-trivial exports; Next 15's async `params` convention followed as scaffolded.

## 6. Data Layer

`apps/docs/lib/registry.ts` is the SSOT; `/api/registry*`, the CLI's fetched JSON, and the npm mirror are derived projections, never hand-edited to diverge.

- **Loading:** docs site imports in-process (no network hop); API routes are `force-static`, cached `s-maxage=3600`; CLI `fetch()`s with `DEVIGNER_REGISTRY_URL` override, errors printed with `✗`/`process.exit(1)`.
- **Validation:** none at runtime today (TS compile-time is sufficient since producer+schema are co-located) — add Zod at the CLI's HTTP boundary once CLI and docs version independently.
- **Serialization:** plain `NextResponse.json()`, no custom serializers/class instances.
- **Versioning:** registry `version` (schema/content) and `CLI_VERSION` (installer) are independent, never collapsed. Additive fields need no migration; a breaking change needs a new schema version + the old shape served for ≥1 CLI minor cycle + a changelog note — via `?v=`/`Accept` header, not a new URL path.
- **Static vs dynamic:** catalog = static/rebuilt-on-deploy; copy counters = planned, not yet built; license/subscription = dynamic Creem calls, never cached; theme = client-only `localStorage`.

## 7. Documentation Standards

- Docs page order is fixed: **Preview → Installation → Props** — never reorder per-component.
- Every prop has all 4 `PropDef` fields populated; `default` is `"—"` not blank; `type` is copied verbatim from the TS union, never paraphrased.
- `usage` is a complete, standalone, copy-pasteable `Example()`.
- Shiki syntax highlighting via `CodeBlock`; `numbered` for install steps, plain for the Preview tab's `usage`.
- Accessibility notes: not a structured field yet — add `documentation.accessibility: string[]` past ~20 components.
- Do's/Don'ts: not yet per-component — go in `documentation.doAndDont` when introduced.
- Migration notes: none shipped yet (no breaking change has happened) — future ones go in `changelog`/`documentation.commonMistakes`; never silently rewrite an installed API without one.

## 8. Styling System

**Token source:** `apps/docs/app/globals.css` is canonical — it's what a developer previews before installing. `packages/ui/src/styles/globals.css` shares token _names_ (including the shadcn aliases below) but **not values** — a separate, self-contained default palette for npm consumers. Previously misdocumented as "resolved"/converged; it isn't (§17); reconciling the two is unscoped future work.

**Color tokens** (OKLCH, `:root`/`.dark`, exposed via `@theme inline`):
| Token | Role |
|---|---|
| `background`/`-100`/`-200` | page / elevated / recessed surface |
| `foreground` | primary text/icon |
| `surface`/`-hover` | component fill + hover |
| `border`/`-hover` | default + emphasis border |
| `gray-100…1000` | raw scale — prefer semantic tokens over this |
| `text-primary/secondary/tertiary/muted` | 4-step text hierarchy |
| `accent`/`-hover`/`-foreground` | subtle tint/hover pairing — **not** for emphasis (see rule) |
| `accent-secondary`/`-tertiary` | decorative gradient hues only (`.mesh-gradient` etc.) |
| `success`/`warning`/`destructive` (+`-foreground` ×3) | status colors |
| `terminal`/`-foreground`/`-muted` | always-dark code/terminal chrome |
| `code-bg` | code block bg, independent of page chrome |
| `text-on-dark` | reads against a permanently-dark surface regardless of theme |
| `primary`/`-foreground` | **strong emphasis** — selected/checked/active/default Button/Badge |
| `card`/-`foreground`, `popover`/-`foreground`, `secondary`/-`foreground`, `muted`/-`foreground`, `input`, `ring` | shadcn-compatible aliases (§8); default to Devigner-equivalent values, diverge only inside `.shadcn-scope` |

**Rules:** components use only semantic names, never raw `gray-*`/hex/oklch literals except a documented decorative one-off. Applies foremost to distributed source (`packages/ui`, registry `code`) — docs-only preview JSX should follow it too, lower severity if not. **`accent` ≠ emphasis** — use `primary`/`primary-foreground` for selected/checked/active/CTA (§17; matters once a route's `accent` is a low-contrast tint by design).

**Typography:** Geist Sans/Mono (`--font-sans`/`-mono` via `geist` pkg); `--font-display` aliases `--font-sans` (no separate display face — headline weight comes from size+`font-semibold`+negative tracking).
| Role | Class | Size |
|---|---|---|
| Hero | `text-5xl/14 font-semibold tracking-[-2.88px]` | 48/56px |
| Section | `text-[32px]/12 font-semibold tracking-[-1.28px]` | 32/48px |
| Card | `text-2xl/8 font-semibold tracking-[-0.96px]` | 24/32px |
| Body | `text-base/6` | 16/24px |
| Body small | `text-sm/5.25` / `text-[13px]` | 14/13px |
| Label | `text-sm/5 font-medium` | 14/20px |
| Caption | `text-xs/4` / `text-[11px]` | 12/11px |

Use these exact patterns for new components in these roles — the negative-tracking display sizes are a brand signature.

**Spacing:** Tailwind v4 default scale only, no bespoke spacing tokens.

**Radius:** `radius-xs`2px · `sm`4px(controls) · `md`6px(inputs) · `lg`8px(buttons, default) · `xl`12px · `2xl`16px(cards) · `3xl`24px · `pill`9999px. A separate unwired `--radius: 0.625rem` (shadcn compat) coexists with, doesn't replace, this named scale.

**Shadows:** `shadow-card`/`-subtle`/`-elevated`, each OKLCH-based via a `-val` custom property with a dark override — never hardcode a shadow color in a component; treat the values as an implementation detail, don't hand-copy them.

**Borders:** `border-border` default, `border-border-hover` on hover/emphasis; decorative exceptions only as a documented identity choice.

**Motion:** `motion` (framer-motion v11+) beyond what CSS transitions express; plain `transition-colors` for simple state changes. Easing: `--ease-out` (`EASE_OUT` in `animations.ts`, keep in sync) for scroll-reveals, `--ease-in-out`/`--ease-drawer` for panels. Reduced motion required everywhere (§3).

**Theme architecture:** an inline pre-paint `<script>` in `layout.tsx` reads `localStorage('devignerui-theme')`/`prefers-color-scheme`, sets `.dark` on `<html>` — never move this into a React effect (reintroduces flash-of-wrong-theme).

**Route-scoped token overrides:** a second override axis alongside light/dark — a class (`.shadcn-scope`) redeclares a subset of the same custom properties, scoped to that class instead of `:root`; a wrapping layout (`components/layout.tsx`) applies it to a route subtree. Every component underneath (shared `packages/ui` included) picks it up automatically since they already reference the token by name — no per-component conditional logic. `.dark .shadcn-scope` supplies the dark override, mirroring `.dark`. **Current use:** `/components` + `/components/[slug]` are scoped to shadcn's literal neutral/grayscale defaults (`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, plus surface aliases `background-100/200`, `surface`, `surface-hover`, `border-hover`) — deliberately different from the rest of the site's warm/vermilion palette. Tokens with no shadcn equivalent (`success`/`warning`, `terminal*`, `code-bg`, `text-*` hierarchy, shadows, radius) are **not** overridden and keep global values even inside the scope. Add another scope the same way (new class, new layout) if another route family needs its own identity; never use this mechanism for light/dark.

## 9. Code Standards

- Naming: see §5. CSS vars kebab-case; npm packages `@devignerui/<name>`.
- Folders: `src/components/` one file per component · `src/lib/` framework-agnostic, no JSX · `src/hooks/` `use-*.ts` · route-specific pieces co-located, shared docs UI in `apps/docs/components/`.
- Import order (convention, not automated yet): external → workspace → relative → type-only last.
- Named exports only except Next's mandated defaults; package public surface re-exported explicitly from `src/index.ts` (no `export *`).
- Errors: CLI catches at the command boundary, `✗`/`⚠`/`✓` glyphs, exits only when the whole command can't proceed (a single failed component in a multi-add logs and continues); API routes return typed `{error}` + correct status, never throw uncaught; library components surface failures via props/throw, never console.log-and-continue.
- No logging library for CLI/`ui` (too small); `pino` justified for `apps/docs`'s server only once Creem traffic is real.
- DRY: shared-across-packages logic → `shared`; shared-within-`ui` logic → `src/lib/`; rule of three before extracting an abstraction (see `ponytail:` comments in the codebase for the judgment call).
- SOLID: applied concretely — one responsibility per file/route handler; new components/fields extend without modifying readers; `ComponentData` is uniformly substitutable; `IndexComponent`/`FullComponent` are segregated; CLI depends on the registry's HTTP shape, not its implementation.
- `lib/registry.ts` stays one file until ~1500 lines/~25 components, then splits into `registry/<slug>.ts` + `index.ts` preserving the same exported surface.

## 10. Performance

- No memoization until a profiler shows a real cost — none needed today.
- RSC by default, `"use client"` on the smallest leaf; `viewport={{ once: true }}` on scroll-reveals.
- `next/dynamic` for `CodeBlock`/Shiki once bundle analysis justifies it — the top lazy-load candidate.
- No bundle analyzer yet — add `@next/bundle-analyzer` behind `ANALYZE=true` before the next big marketing page.
- `packages/ui` ships ESM+CJS (`tsup`) with explicit named re-exports for tree-shaking; CLI-installed code has zero tree-shaking concern (only requested files are written).
- Next's automatic per-route code splitting is sufficient; no manual `React.lazy` beyond the `CodeBlock` candidate.
- No raster preview images (live-rendered React previews, a deliberate perf/maintenance win); use `next/image` if static previews are ever added.
- No CI-enforced budget yet — target **180KB gzipped First Load JS** for the two component routes once a bundle-analyzer baseline exists.

## 11. Testing

**No test suite exists today** — the single highest-priority process gap. Target state, introduce incrementally (not all at once):

- **Unit:** Vitest. Pure functions first (`dependenciesFor`, `cn()`, registry shape).
- **Integration:** the two registry API routes — index returns every component, `[slug]` 404s correctly / returns a full `files` map.
- **Component:** RTL + Vitest `jsdom`. Interactive components first; presentational CVA components need only a smoke test.
- **Accessibility:** `@axe-core/react` dev-only + `vitest-axe` on `Button`/`Input`/`Badge` first.
- **Visual regression:** not justified below ~20 components — Playwright/Chromatic then.
- **E2E:** Playwright on the **CLI** first (`init`→`add` against a temp dir, assert `tsc --noEmit` passes) — higher blast-radius than website E2E.
- **Snapshot testing:** avoid for rendered trees (low-signal); the one acceptable use is a registry-shape snapshot.

## 12. Scalability

- **Hundreds of components:** split `registry.ts` per-slug at ~25 · add `dependency-cruiser` at ~50 · add visual regression at ~20 (sooner than either). Registry-as-code itself doesn't need to change beyond that.
- **Multiple themes:** `.dark` and route-scoping (§8) are two independent, already-sufficient override axes — a third _theme_ follows the `:root`/`.dark` pattern; a third _route identity_ follows §8's pattern. No architectural change either way.
- **Multiple design languages:** removed as a direction 2026-07-05; §8's two-route exception is a bounded, per-_route_ token swap, not a re-introduction of per-_component_ parallel treatments.
- **Plugin architecture:** not needed until a real external registry consumer exists; extension point would be `ComponentData` itself, versioned (§6).
- **External packages:** `@devignerui/ui` is already a standalone npm package with correct peer deps — just keep it a thin mirror (§17).
- **API integration:** the public `/api/registry` contract is already a clean third-party integration point — never let the CLI or any integration depend on more than that contract.
- **AI-assisted development:** this document is the mechanism — read it, find the closest precedent, follow the token/naming conventions, add data only to `registry.ts`.
- **Future frameworks:** Vue/Svelte would add a `frameworks` field + per-framework `code`/`usage` inside `ComponentDataV2` — additive, no breaking change to React-only consumers.

## 13. Automation

- **Component generation:** manual today; add a `pnpm gen:component <slug>` checklist-scaffolder past ~15 components (not a full generator — components are bespoke by design).
- **Variant generation:** CVA already does this.
- **Docs generation:** already live from registry data — never add a static-doc-gen step that could drift.
- **Code snippet generation:** `dependenciesFor` already scans-and-derives `npm i` lines — extend this approach, don't add a parallel manifest.
- **Metadata generation:** if `status` returns, automate only the New/Updated→Stable downgrade, never the initial classification.
- **Validation:** no `pnpm validate:registry` script yet — add one (non-empty `code`/`usage`, unique slugs, `files` map coverage, registry/`packages/ui` token parity per §4) before the catalog doubles.
- **Lint/format:** ESLint + `eslint-plugin-better-tailwindcss` configured; no Prettier yet — add with near-default settings + CI before the contributor count grows.
- **CI/CD:** none exists — priority order: `turbo build` → `turbo lint` → `validate:registry` → `vitest run` → `prettier --check`, each addable independently.
- **Release automation:** `CLI_VERSION` and `package.json` versions aren't mechanically linked yet — adopt Changesets before the first public npm publish; until then bump both in the same commit.

## 14. Development Workflow

**New component checklist (binding):** write the `.tsx` source first against the token contract (no hardcoded colors, `forwardRef`, `displayName`, exported `<X>Props`) → add the `registry.ts` entry (slug/name/description/category/variants/props/code/usage) → write a standalone `usage` example → add the live preview + register in `previews[slug]` → verify both themes manually → `turbo build && turbo lint` → PR states slug/category/one-line design rationale.

- Versioning: see §6/§13 — never a third scheme.
- Release: merge to `main` → Vercel deploy → registry API reflects immediately → CLI users get it on next `add`/`list` (no CLI publish needed for catalog-only changes) — preserve this.

## 15. Project Conventions

- Directory structure: §2. File naming: §5.
- Branches: trunk-based on `main`, short-lived `<type>/<slug>` branches, no long-lived `develop`/`release`.
- Commits: Conventional Commits (`feat:`/`fix:`/`refactor:`/`docs:`/`chore:`/`test:`), scope prefix encouraged for multi-package changes.
- PRs: one logical change each; state which registry entries changed and whether additive or breaking; description is a tight paragraph, not a step narration (per `AGENTS.md`).
- Versioning policy: §6/§13 — two independent numbers, never collapsed.

## 16. Future Roadmap

| Capability                                           | Anticipated by | What's actually needed                                                           |
| ---------------------------------------------------- | -------------- | -------------------------------------------------------------------------------- |
| Hundreds of components                               | §12            | Split `registry.ts` at the stated threshold                                      |
| Themes beyond light/dark                             | §12            | More `.theme-name` blocks + a `ThemeToggle` option                               |
| Plugin/marketplace                                   | §12            | Versioned, externally-writable `ComponentData` extension                         |
| Vue/Svelte output                                    | §4, §12        | Per-framework `code`/`usage` in `ComponentDataV2`                                |
| Copy counters/analytics                              | §6             | One dynamic KV/SQL table behind a rate-limited route                             |
| Full monetization/license gating                     | §1, §6         | CLI validates license client-side against Creem; registry stays public/cacheable |
| CI/CD, testing, validation                           | §11, §13       | Tool decisions already made — just implement                                     |
| AI-agent catalog growth                              | §12            | This document is the artifact — keep it current                                  |
| Reconciling `packages/ui`/`apps/docs` token _values_ | §8, §17        | Unscoped — converge the two palettes or document them as intentionally separate  |

Every item above is additive to `ComponentData` and the 4-package boundary — a future need that would break this document's existing contracts is a signal to amend the document first, not route around it.

## 17. Known Drift & Mandated Fixes

Standing punch list. Close an item only once fixed **and re-verified** — a false "RESOLVED" (item 1's original claim) is worse than an open item.

1. **Two token files, values still divergent.** `packages/ui`'s and `apps/docs`'s `globals.css` were claimed converged "token-for-token" — false. Names now match (incl. the shadcn aliases in §8); OKLCH _values_ are still two independently-defined palettes (warm/vermilion vs. neutral gray/blue). Predates this doc's current pass; unscoped future work (§16) to converge or formally document as separate.
2. **Hardcoded colors — resolved.** `Card`/`Input` (`bg-white`, inline shadow) fixed earlier; `Button`'s default variant (`bg-gray-1000 text-white` — literal white never adapted, so text was invisible in dark mode) and `Badge`'s 4 variants (literal `text-white`) fixed to `bg-primary text-primary-foreground` and the matching `-foreground` tokens (`success-foreground`/`warning-foreground` added to support this).
3. **Legacy JSON registry + legacy shared types — resolved.** Removed; `shared`'s broken `exports` map (pointed at `.mjs` `tsup` never emits) fixed too.
4. **Category label/key mismatch — resolved.** `registry.ts` now stores the key, not a label string; both display sites resolve via `COMPONENT_CATEGORIES`.
5. **`Button`'s unused `asChild` — resolved.** Removed (zero callers); re-add only via the `Slot` pattern alongside a real consumer.
6. **`content/blocks`/`content/components` — resolved, scope changed.** Empty dirs deleted; real MDX guides now live at `content/docs/` → `/docs`. Catalog routes untouched. Fumadocs uses its own `@import "tailwindcss"` compilation root (`docs.css`, imported only by its layout) and `theme/search: false` to avoid fighting Devigner's theme system; `fumadocs-mdx@^14.1.0` pinned for `fumadocs-core@15.8.5` compat — re-verify all three peer ranges together before bumping.
7. **Non-theme-aware colors inside `globals.css` itself — resolved.** `.code-shiki`/`.code-scroll` used literal `rgba(255,255,255,...)` with no light-mode counterpart (likely invisible/wrong in light mode) — now reference `var(--text-muted)`/`var(--border-hover)`. §8's token rule covers _any_ color in `globals.css`, not just component classes.
8. **Ambiguous scope of the literals rule for docs-only preview code.** §8 now states it applies foremost to distributed source, docs-only code should follow but at lower severity. The one found instance (`bg-gray-200`) is fixed.
9. **`accent` used as a strong-emphasis color — resolved, rule now documented.** Several hand-rolled previews used `bg/text/border-accent` to signal selected/checked/active, which only worked because `accent` aliased Devigner's saturated brand color; broke once a route's `accent` became a shadcn low-contrast tint by design. Repointed to `primary`/`primary-foreground`; the underlying rule (`accent` = tint, `primary` = emphasis) is now stated in §3 and §8 so it isn't rediscovered per-component. Registry/`packages/ui` token parity is now binding (§4), not implicit.
