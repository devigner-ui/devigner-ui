# Devigner UI — Marketing Site Redesign

Scope: `apps/docs` — the landing page, the components gallery, and the new blocks
gallery. `packages/ui` is touched only for the easing-module rename.

Direction: **refine the incumbent visual world, redesign the landing structure.**
The OKLCH token system, warm-paper/navy/vermilion palette, grain overlay,
double-bezel and editorial voice are preserved as design authority. The section
inventory, the typeface, and the copy are not.

Hard target: **Lighthouse 100 / 100 / 100 / 100.** This is a constraint on every
phase, not a final polish step. Where it conflicts with motion, performance wins.

---

## 0. Product model (resolved)

Two distribution surfaces, each organised by category, each category holding more
than one distinct design of the same kind.

| Surface | Holds | Example categories |
|---|---|---|
| **Components** | Primitives | Buttons, Inputs, Badges, Cards |
| **Blocks** | Composed sections | Sidebars, Heroes, Navbars, Pricing |

A `Sidebars` category contains genuinely different sidebars — different layouts,
motion, structure. Each is its own component, its own slug, its own file,
installed on its own via `npx devignerui add <slug>`. At launch each category
holds two (§2.1).

**Why it wins.** shadcn/ui and Radix ship *one* sidebar primitive and leave you
to design it. Devigner ships *finished* sidebars — more than one — and lets you
pick the one that fits. The pitch is choose, not build. At launch that means a
considered pair per category, not a catalog: see §2.1 for what the copy may and
may not claim.

The existing hero copy already said "Browse Blocks". That vocabulary was correct;
the product had simply not split yet.

---

## 1. Open decisions

| # | Decision | Assumed default | What flips if wrong |
|---|---|---|---|
| D1 | Display typeface | Geist + Instrument Serif (§3.1) | Every heading on the site |
| D2 | ~~`reicon` API~~ | **Resolved** — `reicon-react@1.2.0` (§5.5) | — |
| D3 | Sibling slug convention | `sidebar-aurora`, `sidebar-rail` | CLI ergonomics, URLs, SEO |
| D4 | Which designs are Pro | Some designs per category free, rest Pro | Pricing copy, gallery lock UI. Gate already built. |
| D5 | ~~Launch scale~~ | **Resolved — 2 designs per category at launch** (§2.1) | — |
| D6 | Gallery palette | Drop `.shadcn-scope`; previews wear the brand | `app/components/page.tsx` |
| D7 | Primary conversion | Free `npx` install first, Pro second | CTA hierarchy throughout |

---

## 2. Product truth

**What it is.** A React component library distributed as copy-paste source via a
CLI. Code lands as plain `.tsx` in the consumer's repo. Tailwind v4 semantic
tokens, CVA variants, TypeScript. Split into Components and Blocks, organised by
category, more than one design per category (two at launch — §2.1).

**Current state.** Five items — `badge`, `button`, `card`, `input`,
`hero-section` — under three type-of-thing categories (`primitives`,
`marketing`, `forms`). `hero-section` belongs in Blocks; the rest in Components.
One design per kind, so no category demonstrates the model yet.

**The paywall already works.** `app/api/registry/pro/[slug]/route.ts` is a
complete license-gated route: `force-dynamic`, `x-devigner-license` header,
`validateLicense()` against Creem, `no-store` throughout. The free route
(`app/api/registry/[slug]/route.ts`) excludes pro slugs from
`generateStaticParams` and returns 402 with no code. `hero-section/meta.mjs:5`
sets `access: "pro"`, and `registry.test.ts` asserts the tiering holds. D4 is a
curation decision about which designs sit behind the gate — not a build.

**Claims that must not ship until true:**

- "Multi-style … Stop relying on one-size-fits-all libraries" (hero sub-headline)
  — describes a different product than the one being built.
- "5 Components" (`stats-band.tsx:12`) — argues components-total, the weakest axis.
- Pro benefits (`pricing.tsx:34-43`) — the gate works, but the four listed
  benefits still need checking against what a licence delivers today.

## 2.1 Launch scale and what it does to the positioning

**Two designs per category at launch.** Roughly five categories, so about ten
finished items.

This is the number the earlier draft warned about: a category with two designs
cannot be sold as *choice*. Two is not a catalog, and any copy implying breadth
would be writing a cheque the product cannot cash on day one. Competitors ship
tens per category; arguing volume is arguing their case.

**What survives.** The differentiator is the *plural*, not the count. shadcn/ui
gives you one sidebar and a design job. Devigner gives you two finished sidebars
and a decision. That is a real difference at n=2, and it is honest.

**What the copy must therefore do:**

- Frame it as **curation, not catalog** — "two considered takes", never "many",
  "dozens", "every style you need", or any count that flatters.
- Argue **finish per design**, which is provable on the page: both are complete,
  both ship states, both are production code.
- Make the **pair itself the proof**. Two designs side by side is a direct
  comparison a visitor reads in one glance; six is a wall they scan past. The
  hero concept in §4.1 gets *stronger* at two, not weaker.
- Never print a total. No "N components" band — see the `stats-band.tsx` cut.

**What this forbids.** Do not describe the library as offering variety, range,
selection, or breadth until the catalog earns those words. Revisit when a
category passes roughly six designs.

---

## 3. Phase 1 — Foundations

### 3.1 Typeface — drop Clash Display

Clash Display never rendered: `app/layout.tsx:51` loads it from Fontshare while
`app/globals.css:71` sets `--font-display: var(--font-sans)` → Geist. So the site
has been running on Geist alone the whole time, and the CDN stylesheet is a
render-blocking request buying nothing. It goes either way.

**Recommendation: keep Geist for body and mono, add Instrument Serif for display.**

Reasoning, in order of weight:

1. **Differentiation.** Every shadcn-adjacent site in this category runs Inter or
   Geist for everything. A high-contrast editorial serif at display sizes is
   instant separation, and it is the one typographic move competitors will not
   copy because it reads as "design studio", not "dev tool template".
2. **It already fits.** The palette is warm paper, navy ink, vermilion, with a
   grain overlay. That is a print-editorial system. It has been asking for a
   serif; Clash Display was the wrong answer to the right instinct.
3. **Performance.** OFL-licensed, self-hosted via `next/font/local`, one weight
   plus italic. Subset to Latin it is a few KB, preloaded, with
   `adjustFontFallback` eliminating CLS. No third-party origin, no
   `preconnect`, no render-blocking stylesheet.
4. **Cost.** Free for commercial use. No licence to track.

Applied narrowly — the hero headline and the closing/footer letterforms
(`closing.tsx:51`, `closing.tsx:184`), where display type earns its keep. Section
headings stay Geist at tighter tracking. Two families, clear division of labour.

Alternates, if the recommendation is wrong for you:

| Option | Trade-off |
|---|---|
| **PP Editorial New** (Pangram Pangram) | Same role, more refined. Paid licence. |
| **PP Neue Montreal** | If you want to stay sans. Common in agency work now. |
| **Geist only** | Zero payload, zero risk. Contrast comes from weight, size and tracking alone. Perfect Lighthouse, least distinctive. |

Either way `--font-display` is wired to something real, the Fontshare
`<link>` and both `preconnect`s are deleted from `app/layout.tsx`.

### 3.2 One easing module

`apps/docs/lib/ease.ts` has **zero importers** — dead code.
`packages/ui/src/lib/animations.ts` has six: `button.tsx:13`,
`hero-section.tsx:4`, `stateful-button.tsx:16`, `icon-button.tsx:4`,
`navbar.tsx:12`, `app/components/[slug]/page.tsx:19`.

So: rename `packages/ui/src/lib/animations.ts` → `easing.ts`, update the six
imports and the `@devignerui/ui/lib/animations` subpath export, and delete
`apps/docs/lib/ease.ts`. Result is one easing module named `easing.ts`, which is
the stated intent, without breaking the build.

Seven exports are dead and go with the rename: `fadeIn`, `slideUp`, `slideDown`,
`scaleIn`, `staggerContainer`, `defaultTransition`, `springTransition` — referenced
only in built `dist` output. `AGENTS.md` is updated to the new path.

### 3.3 Registry gains a kind, categories become kind-based

`ComponentData.category` already exists and `generate-registry.mjs` already reads
it from each `meta.mjs`. What changes:

- Add `kind: "component" | "block"` to `meta.mjs` and `ComponentData`.
  `hero-section` becomes a block; the other four are components.
- Recategorise by kind-of-thing: `button` → `buttons`, `input` → `inputs`,
  `card` → `cards`, `badge` → `badges`, `hero-section` → `heroes`.
- Add a category manifest — display name, description, order, blurb — so
  categories are navigable entities with their own SEO copy, not a bare string.
  One new file under `registry/`, read by `generate-registry.mjs`.
- Registry directories stay flat at `registry/<slug>/`. Slugs are globally
  unique; nesting would break `/api/registry/[slug]` and the CLI for no gain.
- `/api/registry` index groups by kind then category. `lib/registry.test.ts`
  covers the new shape.

CLI unaffected: `add <slug>` keeps working.

---

## 4. Phase 2 — Landing redesign

Six sections including footer, down from nine.

### 4.1 Hero — the category rail

The current hero pairs a generic headline ("React UI Components for Modern
Developers") with an ambient carousel (`hero-carousel.tsx`). Both go.

Replacement: **one category, its real designs side by side**, with a control to
switch category. At launch that is a pair — the same problem solved two different
ways, directly comparable in one glance. The visitor grasps "I pick one" before
reading. A pair reads as curation and stays legible; the layout must also hold
when a category later carries six.

Built for the Lighthouse constraint, which shapes the design rather than
limiting it:

- The designs render **server-side as static markup**. They are Tailwind
  components; nothing about showing them requires JavaScript.
- The category switcher is either a CSS-only control (radio inputs plus `:has()`)
  or a client island of a few hundred bytes. No animation library in the critical
  path.
- Result: a hero that demonstrates the entire product with effectively zero JS
  and no TBT cost.

The install line sits here with the real slug, absorbing the standalone
`CliTerminal` section — one command does not deserve a viewport. One primary CTA;
today both buttons point at `/components`.

Preserves: `AsteriskCircle`, mesh gradient, accent glows. The GSAP clip-mask word
reveal and scrub exit are re-expressed per §7.

### 4.2 The catalog

Components and Blocks as two clearly separated groups, each category with its
real count and live previews. Where breadth is argued, and it scales as designs
land. Replaces `ComponentRange`.

### 4.3 Why this and not shadcn

`features.tsx`'s three panels — "Own the output", "Tailwind-native",
"Framework-idiomatic" — are true but table stakes, and shadcn owns the ownership
argument. Demoted from a display-headed section to a compact three-up band.

### 4.4 Pricing

Reframed per D4 around what a licence unlocks per category. Requires
`pricing.tsx:34-43` rewritten against what Pro actually delivers. **Factual claim
change — explicit sign-off before any copy is written.** Keeps the two-tier
structure, `tabular-nums` treatment and Creem wiring.

### 4.5 Closing + footer

`closing.tsx` survives largely intact. The giant per-letter footer treatment
(`closing.tsx:184`) is the strongest visual moment on the site and the best home
for the new display face.

### Cut

- **`manifesto.tsx`** — a viewport of display type asserting a position it does
  not prove. §4.1 proves it instead.
- **`stats-band.tsx`** — argues components-total. Stays cut: at two designs per
  category there is no total worth printing, and §2.1 forbids count claims.

### Rhythm

All nine current sections share one heading template: two words, `<br>`, two
words, uppercase, `clamp(2rem,4.5vw,3.5rem)`. Nothing can feel like an arrival
when everything is announced identically. §4.1 and §4.5 get the display voice;
the middle sections carry smaller, quieter headings.

---

## 5. Phase 3 — Galleries

### 5.1 Two surfaces, category-led

| Route | Purpose | Status |
|---|---|---|
| `/components` | Component category index | rebuild |
| `/components/[category]` | Every design in one component category | new |
| `/components/[category]/[slug]` | Component detail | moved |
| `/blocks` | Block category index | new |
| `/blocks/[category]` | Every design in one block category | new |
| `/blocks/[category]/[slug]` | Block detail | new |

**Corrected during Phase 3 planning.** An earlier draft of this table specified
both `/components/[category]` and `/components/[slug]`. That is not buildable —
the App Router resolves one dynamic segment per position, so two sibling dynamic
routes at the same depth collide. Detail pages therefore nest under their
category.

The original reason for keeping detail flat was avoiding redirects; that reason
is void because the site is unlaunched and nothing links to `/components/<slug>`
yet. Nesting also yields the breadcrumb hierarchy §6's `BreadcrumbList` JSON-LD
needs.

`/api/registry/[slug]` is unchanged. The CLI contract is flat and stays flat —
only page routes nest.

`/components/[category]` and `/blocks/[category]` are the pages that rank for
"react button components" and "react sidebar component", the searches this
product should own. All routes are statically generated via
`generateStaticParams`.

### 5.2 No "coming soon"

The ten `Soon` tiles are deleted outright, along with the `soon` prop on
`PreviewCard` and the `READY` set. The galleries show what exists. An empty
category does not render.

### 5.3 Previews move out of the page

`app/components/page.tsx` is ~700 lines with 15 previews declared inline. They
move to one file each under `components/gallery/previews/`. The page composes; it
does not define a `TablePreview`.

### 5.4 Real components replace mock previews

The sidebar, table, combobox, listbox and pagination previews are bespoke JSX,
not shipped components. Every tile renders the real registry component. Anything
without one is not a tile (per §5.2).

### 5.5 Icons from `reicon`

All component and block icons come from reicon (icons.remidevigner.pro). This
removes the emoji icon set in `SidebarPreview` (🔍 📥 🏠 📅 ⚡) — on the page
selling the library's craft, emoji as UI iconography is the loudest tell on the
site — and the hand-rolled inline `<svg>` paths scattered through the previews.

**Dependency correction.** `apps/docs/package.json` declares `reicon@^1.0.0`,
which is the *vanilla-JS* build ("Core vanilla JS icon components", keyword
`vanilla-js`). The React binding is a separate package: **`reicon-react@1.2.0`**,
`peerDependencies: { react: ">=16.8.0" }`. Both carry 2674 icons in Outline and
Filled weights.

Import per-icon through the `./icons/*` subpath rather than the barrel, so only
the icons actually used enter the bundle — this matters directly to the
Lighthouse budget in §7:

```ts
import { ArrowRight } from "reicon-react/icons/ArrowRight";
```

`reicon` (vanilla) is removed from `apps/docs` unless something needs it outside
React. Exact icon casing is confirmed against the installed package before use.

### 5.6 Brand the galleries

Per D6, drop `.shadcn-scope`. The override at `globals.css:224-283` forces
`oklch(1 0 0)` / `oklch(0.145 0 0)` neutrals — the pages selling the library show
it in someone else's palette. The scope block stays defined for detail pages,
which have their own rationale in `app/components/[slug]/layout.tsx`.

---

## 6. Phase 4 — SEO / GEO / AEO

Today: one site-wide `title` and `description` (`app/layout.tsx:7-11`). No OG
image, no canonical, no sitemap, no structured data. Both pages are
`"use client"` at the top level, so neither *can* export `metadata`.

Every component, block and category page becomes independently indexable and
independently citable.

**Per-page metadata.** `generateMetadata` on every route — title, description,
canonical, keywords derived from category and kind, full OpenGraph and Twitter
card sets.

**Per-page OG images.** `opengraph-image.tsx` per route segment using `next/og`
`ImageResponse`, generated at build time. Each shows the component's name,
category, and its real rendered preview against the brand palette — not a generic
template. Build-time generation keeps runtime cost at zero.

**Structured data.** JSON-LD per page: `SoftwareSourceCode` for components and
blocks, `BreadcrumbList` for the category hierarchy, `CollectionPage` for
category indexes, `FAQPage` where per-component questions exist.

**Answer-engine surface.** `llms.txt` at the root describing the library, its
categories and its install command. Per-component copy written to be
answer-shaped — what it is, when to use it, how to install it — in real headings,
so an engine can lift a correct answer without inference.

**Crawl surface.** Generated `sitemap.ts` covering every category and detail
route, and `robots.ts`.

**RSC restructure.** `"use client"` moves down to interactive leaves across both
galleries and the landing. This is the prerequisite for all of the above, and
independently the largest performance win available.

---

## 7. Phase 5 — Motion and the 100/100/100/100 target

**Motion lives in the components and blocks, not the marketing site.** The things
users install keep their Motion/`easing.ts` physics — that is the product, and
the gallery previews demonstrate it on interaction. The marketing site drops its
animation stack.

### 7.1 What comes off the marketing site

`gsap`, `@gsap/react`, `ScrollTrigger`, `CustomEase` and `lenis` leave the
landing's critical path entirely. Together they are the single largest
non-framework payload on a page whose job is to load instantly.

Lenis costs twice: bundle weight, and it replaces native scrolling with a
JS-driven loop that degrades INP and fights the platform. `html { scroll-behavior:
smooth }` is already set at `globals.css:530`.

### 7.2 What replaces it

**Native CSS scroll-driven animations** — `animation-timeline: view()` and
`scroll()`. Compositor-driven, zero JavaScript, no main-thread work, no
scroll-listener INP cost. Every reveal and parallax currently done with
ScrollTrigger is expressible this way.

Guarded with `@supports (animation-timeline: view())`. Where unsupported,
elements render in their final state — no fallback library, no layout shift, no
degraded experience. `prefers-reduced-motion` already neutralises animation at
`globals.css:565`.

The hero's clip-mask word reveal survives as a CSS entry animation; the scrub
exit becomes a view-timeline. Neither needs a library.

**Honest note.** This is the one place where the plan trades something real: GSAP
gives finer choreographic control than CSS timelines do, and a few current
effects will need re-thinking rather than porting. Given a hard 100 target and
"drop motion from the marketing site if it affects performance", the trade is the
right way round — but it is a trade, not a free win.

### 7.3 Reaching 100 on each axis

**Performance.** RSC by default (§6); static generation for every route;
`next/font/local` with preload and `adjustFontFallback`; `next/image` with
explicit dimensions and AVIF; `content-visibility: auto` plus
`contain-intrinsic-size` on below-fold sections; Shiki already runs at build.

**Accessibility.** Gallery tiles currently use `onClick` on a `div` and are not
keyboard reachable — they become links, which also helps crawlability. Skip link,
landmark structure, contrast audit on `--text-muted` against `--background-200`
in both themes, accessible names on every icon-only control.

**Best practices.** The inline theme script (`app/layout.tsx:13-22`) uses
`dangerouslySetInnerHTML` and needs a nonce or hash to survive a strict CSP.
No console errors, no deprecated APIs.

**SEO.** Delivered by §6.

### 7.4 Verification

Lighthouse runs against a production build on every phase boundary, not once at
the end. A regression on any axis blocks the phase. The bundled `detect.mjs`
currently reports one hit — gradient text at `globals.css:386` — and re-runs
alongside it.

---

## 8. Sequencing

| Phase | Depends on | Blocked by |
|---|---|---|
| 1 Foundations | — | D1 (font) |
| 2 Landing | Phase 1 | §4.4 needs pricing sign-off |
| 3 Galleries | Phase 1 (3.3) | D2 (reicon), D6 |
| 4 SEO | Phase 3 | — |
| 5 Motion + perf | Phases 2–4 | — |

Phases 2 and 3 are independent once Phase 1 lands.

---

## 9. Explicit non-goals

- No new visual world — palette, grain, bezel and token architecture preserved.
- No change to `/docs`, `/pricing`, `/checkout` or the Creem webhook.
- No motion tokens applied to marketing-site animation; per `AGENTS.md` the rule
  governs shipped components only.
- No factual claim written or altered without sign-off (§4.4, and the positioning
  claim generally).
- No `packages/cli` changes — `add <slug>` is unaffected.
- Authoring the additional per-category designs is product work, not
  marketing-site work. This plan makes the site show them; it does not build them.
