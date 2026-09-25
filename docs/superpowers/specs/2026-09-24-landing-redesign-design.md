# Landing and catalog redesign

## Context

Devigner UI is a copy-paste registry of animated React components for React 19 and
Tailwind CSS v4. `npx devignerui add <slug>` writes one plain `.tsx` file into the
user's `components/ui`, and the docs site doubles as the registry. Six components ship
today (Magnetic Button, Date Range Picker, Menu Dock, Delete Button, Chart Card,
Timeline), all free and MIT licensed. Pro plans are posted but not on sale.

The library will grow by roughly one component a day. The current home page and
`/components` were judged generic: every home section repeats the same two-line
headline with a grey second line, the section order is the stock SaaS sequence, and the
`/components` cards sit on a graph-paper grid that reads as AI-generated. Several pieces
(the home hero rows, the rack layout map, the feature chips) are hand-written per
component and cannot keep up with a daily cadence.

This spec rebuilds `/` and `/components`, the shared nav and footer, and the site-wide
SEO plumbing, so that every page is driven by registry data and needs no edits when a
component is added.

## Goals and success criteria

- **Conversion:** a visitor installs a free component. Every section leads to copying an
  install command or opening a component page. Pro is a quiet secondary mention.
- **Scales without edits:** adding a component means one descriptor entry and one demo
  file. The home page, `/components`, the sitemap and the OG images pick it up.
- **Premium, not templated:** no grid backgrounds, no repeated section formula, no
  invented proof. Copy passes a humanizer review.
- **SEO:** keyword-appropriate titles and descriptions, server-rendered content,
  structured data, a sitemap, and per-component metadata and OG images.
- **Quality floor:** both themes, reduced motion, keyboard access, AA contrast, motion
  from the shared tokens only, no em dashes anywhere.

## Decisions made during brainstorming

| Topic | Decision |
|---|---|
| Conversion goal | Install a free component. Pro stays secondary. |
| Visual latitude | Full freedom, site-wide. In practice the graphite and cobalt tokens stay (they match the chosen direction); typography changes. |
| Pricing on home | Compact, then reworked into the "Now / Later" panels (option B). |
| Proof | Only X (`@devignerui`) is real. No GitHub link (repo not public), no star counts, no testimonials, no invented numbers. |
| Direction | C, "Inline": the page talks in sentences, and parts of the sentences are live controls. Graphite ground, Bricolage Grotesque display, one cobalt accent. |
| Scalability | Nothing is designed around specific components. Everything reads from the registry. |
| Daily cadence | Not used as a hook or promise anywhere. A neutral 14-day "new" tag and a Newest sort are allowed. |
| Title hook | "Animated React components with manners." with the "Paste one in and it's finished." idea folded into the line under it. |
| Hero mechanism | "The sentence is the installer": a component picker inside a sentence, a live stage, and the matching command. |
| Hero default | A featured component set in code (`FEATURED = "menu-dock"` in `lib/catalog.ts`), not the newest. |
| Install section | The terminal plus overlapping file tree direction from the old page, polished. Follows the hero picker. |
| `/components` | The old card-grid direction, polished and rule-based. The index plus sticky stage idea was rejected. |
| Footer | The old footer direction (brand, links, giant cropped wordmark), polished. The "Mind your manners." statement footer was rejected. |
| Re-drawn terminal chrome | Kept at the user's request, even though the anti-slop guidance discourages it. |
| Reduced motion in `packages/ui` | Swap to `useReducedMotionConfig` so the stage's Reduced motion switch is truthful. |
| Missing tokens after install | The installation guide gets a copy-paste token block generated from `globals.css`. |
| SEO scope | Two pages plus site plumbing: sitemap, robots, favicon, OG images, and per-component metadata for `/components/[slug]` without changing its design. |

## Scope

In scope: `app/page.tsx`, `app/components/page.tsx`, the shared navbar and footer,
`app/layout.tsx`, `app/globals.css`, the registry descriptors and generator, a demos
folder, the catalog data module, the reduced-motion swap in six `packages/ui`
components, the installation guide's token block, SEO files (`sitemap.ts`, `robots.ts`,
icons, OG images, a `[slug]` server layout), and a three-line `use(params)` fix in
`app/components/[slug]/page.tsx`.

Out of scope: the visual design of `/components/[slug]` and `/docs`, the CLI, Pro
content and checkout, and the Timeline keyboard gap (see Follow-ups).

## Visual system

**Tokens.** The three-layer token architecture in `apps/docs/app/globals.css` stays, with
its graphite and cobalt palette. Changes:

- `--font-display` becomes Bricolage Grotesque, loaded with `next/font/google`
  (variable, `opsz` and `wght` axes, `display: swap`), exposed as a CSS variable in the
  root layout. The Fontshare `<link>` tags for Cabinet Grotesk are removed.
- Display type is set at 700 to 800 with tight tracking (`-0.04em` to `-0.06em`),
  always roman. Body stays Geist, code stays Geist Mono.
- New palette token `--stage-light`: the color of the soft light at the top of every
  stage. Light theme `oklch(100% 0 0 / 0.7)`, dark theme `oklch(95.5% 0.003 260 / 0.055)`.
- Theme scoping (see Data and architecture) so a subtree can render in the other theme.
- Removed utilities, used only by the pages being rewritten: `.instrument-grid`,
  `.brand-glow`, `.top-light`. Kept because other routes use them: `.grain-overlay`
  (detail and checkout pages), `.nav-pill` and `.mesh-gradient` (checkout success).

**Mark.** The wordmark is "devigner." in Bricolage 800 with the period in `--brand`.
The small brand tile is a rounded square in `--foreground` with a "d." in
`--background`, the period in `--brand`. The favicon is the same drawing as a static SVG
with the dark theme values baked in (graphite square, bone "d", cobalt period).

**Themes.** Light and dark, following the existing pre-paint script and `ThemeToggle`.
Nothing on these pages uses `dark:` variants; colors come from tokens.

## Shared chrome

### Navbar (`components/landing/navbar.tsx`, rewritten)

- **At the top of the page:** edge-aligned, no background bar, no border. Wordmark on
  the left. On the right: Components (`/components`), Docs (`/docs`), Pro (`/#pricing`),
  the theme toggle, and a "Get started" pill button (`/docs/installation`). The active
  route is marked with the existing `layoutId` pill.
- **After scrolling past 24px:** the nav glides into a centered, content-sized floating
  pill with a blurred `--background` fill and a hairline border, using a `layout`
  animation on `SPRING_LAYOUT`.
- **Below `md`:** wordmark plus a menu button. The existing full-screen menu is kept and
  restyled; it no longer calls Lenis.
- GitHub is removed. The Lenis `lenisRef` import is removed.

### Footer (`components/landing/closing.tsx`, rewritten in place; exports `SiteFooter` only)

Same shape as today's footer, polished:

- **Top row, left:** the brand tile plus wordmark, the tagline, and the `npx devignerui
  init` copy chip.
- **Top row, right:** two short link groups. "Library": Components, Docs, Pro.
  "Elsewhere": X (@devignerui) linking to `https://x.com/devignerui`, Installation guide,
  Theming guide.
- **Giant wordmark:** "devigner." in Bricolage 800, `aria-hidden`, sized with container
  query units so the whole word including the period fits the container width, cropped
  by the bottom bar. It looks pressed into the page: fill `--background-200`-ish tone
  with a dark lip above and a faint light catch below (text shadows from tokens). The
  period is `--brand`.
- **Bow:** moving a fine pointer across the wordmark makes the letter under the pointer
  dip and tilt slightly (`y` up to 10px, `rotate` up to -5deg, neighbours at half
  strength) on `SPRING_PRESS`, then spring back. Disabled under reduced motion and on
  coarse pointers.
- **Bottom bar:** "© {year} Devigner UI · MIT license" on the left (year computed at
  build), "Built with React, Tailwind CSS and Motion" and a "↑ Top" link on the right.

## The Stage (shared, `components/stage.tsx`)

One component renders any demo, used by the hero and the manners bench.

- **Surface:** rounded 26px, `--background-200` fill with a radial `--stage-light`
  ellipse from the top center, `shadow-inlay` edges. No grid.
- **Top left:** category label (from `COMPONENT_CATEGORIES`), lower-case mono.
- **Top right:** a "Dark" toggle, a "Reduced motion" toggle (both `aria-pressed`), and a
  reset button that remounts the demo.
- **Theme toggle:** wraps the demo in a `.light` or `.dark` scope. It starts matching the
  page theme.
- **Reduced motion toggle:** wraps the demo in `<MotionConfig reducedMotion="always">`
  when on, `"user"` when off.
- **Bottom caption:** name, the registry description, and "Try it:" plus the optional
  `tryIt` hint.
- **Content:** `demos[slug]` via `next/dynamic` with `ssr: false` and a sized skeleton,
  aligned by the entry's `stageAlign` (`center` default, `end` for components whose
  panels open upward).
- **Swap:** changing slug cross-fades the demo, `SPRING_PANEL` in and `SPRING_RETRACT`
  out, under `AnimatePresence mode="wait"`.

## Home page (`/`)

Order: Hero, Every component so far, What we mean by manners, Two commands, Before you
install, What it costs, footer. The page is a server component; interactive sections are
client islands. A `SelectionProvider` (client) holds the currently selected slug so the
hero picker drives the manners bench and the install terminal. Its default is `FEATURED`.

### Hero

- **Layout (lg and up):** two columns. Left: h1, subhead, the picker sentence, the
  command row. Right: the Stage at a minimum height of 520px.
- **Mobile order:** h1, subhead, sentence, command, stage (min-height 420px).
- **h1:** "Animated React components with manners." The word "manners" is a run of
  per-letter spans inside a `white-space: nowrap` wrapper. After the entrance it bows
  once (letters dip and tilt in sequence on `SPRING_PRESS`, 40ms stagger), and again on
  hover. Still under reduced motion.
- **Sentence:** "Add the [Component ⌄] to your app." The bracket is the
  `ComponentPicker` trigger, styled as an inline token in the sentence (tinted fill,
  cobalt underline). "Add the" reads correctly for any component name.
- **Command row:** the `CopyCommand` chip with `npx devignerui add {slug}` and a
  "Browse the library →" link to `/components`. The slug swaps on `SPRING_SWAP` when the
  selection changes.
- **Entrance:** one orchestrated sequence on first load. Headline lines rise and fade
  (`EASE_OUT`, 0.9s, 0.08s stagger), then the sentence and command, then the stage
  settles on `SPRING_PANEL`, then the bow.

### ComponentPicker (`components/landing/component-picker.tsx`)

A WAI-ARIA combobox: a trigger button opens a popover with a search input and a listbox
of every component, newest first, each row showing the name, category and "new" tag.
Arrow keys move, Enter selects, Escape closes and returns focus to the trigger, typing
filters. Popover enters on `SPRING_PANEL` and exits on `SPRING_RETRACT`. A polite live
region announces "Showing {name}". Reused by the manners bench's "Showing" switcher.

### Every component so far (`components/landing/library-wall.tsx`)

- **h2:** "Every component so far".
- **Filters:** "All" plus each non-empty category with its count. Choosing a category
  dims the names outside it instead of removing them, so the paragraph keeps its shape.
- **The wall:** every component name, newest first, set as one paragraph in display
  type, separated by thin slashes. Semantically a `<ul>` of links to
  `/components/{slug}`, displayed inline. A "new" superscript marks components whose
  `addedAt` is within 14 days.
- **Caption line:** hover or focus on a name shows "{name} · {description}". Default
  text: "Each name opens its live demo and docs."
- **Overflow:** past 60 names, show the newest 60 and end with "and {n} more", linking
  to `/components`.

### What we mean by manners (`components/landing/manners.tsx`)

- **h2:** "What we mean by manners".
- **Sentence as tabs:** "Every component [keeps still when asked], [looks right in both
  themes], [answers to the keyboard] and [leaves the code with you]." Each bracket is a
  button with `aria-pressed` and `aria-controls` pointing at the bench. Inactive phrases
  have a dotted underline; the active one is ink with a solid cobalt underline that
  glides between phrases (`layoutId`, `SPRING_LAYOUT`).
- **Bench:** one wide panel below (min-height 440px) with a "Showing {name} ⌄" switcher
  at the top (the ComponentPicker). It defaults to the hero's selection. The proof
  changes with the tab and cross-fades on `SPRING_PANEL` / `SPRING_RETRACT`:
  1. **Keeps still when asked:** the live component with a large "Reduced motion"
     switch.
  2. **Looks right in both themes:** the panel splits into two halves, left `.light`,
     right `.dark`, each running the same component.
  3. **Answers to the keyboard:** the live component with a row of keycaps under it
     (Tab, arrows, Enter, Space, Esc). A key lights up while it is pressed with focus
     inside the bench.
  4. **Leaves the code with you:** the component's source, fetched on demand from
     `/api/registry/{slug}`, shown from the top in Geist Mono with class-name strings
     tinted cobalt, with a "components/ui/{slug}.tsx · {lines} lines" header and a
     scrollable body.
- **Captions:** see the copy deck.

### Two commands, then it's your code (`components/landing/install.tsx`, rewritten)

- **h2:** "Two commands, then it's your code".
- **Sentence:** "Run [npx devignerui init] once in your project. After that,
  [npx devignerui add {slug}] writes [{slug}.tsx] into components/ui, and from then on
  it's a normal file in your repo." The commands are copy chips; the filename is a plain
  chip with a file icon.
- **Composition below:** the terminal on the left (about 76% width) and the file tree
  card overlapping its right edge, lower down.
- **Terminal:** always dark (`--terminal` tokens). Title bar: three neutral dots, a tab
  reading "your-app" with a dimmed "zsh", and a "Run it again" button. Body in Geist
  Mono 14px, reproducing `packages/cli/src/commands/add.ts` output exactly:

  ```
  ~/your-app $ npx devignerui add {slug}
  Adding components...

  📦 {slug}
    ✓ components/ui/{slug}.tsx

    Install dependencies:
    npm i {dependencies joined by spaces}

  Done!
  ~/your-app $ █
  ```

  The ✓ line gets a soft green highlight. The npm line has an inline "Copy" button.
- **File tree card:** light surface in light mode, raised graphite in dark. Header
  "your-app" and "after the add command". Rows with indent guides and file-type dots:
  `app/`, `components/`, `ui/`, `button.tsx`, `{slug}.tsx` (highlighted, "new" pill),
  `components.json`, `package.json`. Footer: "1 file added" and "nothing else changed".
- **Connector:** a dotted cobalt line with end dots from the end of the ✓ line to the
  new tree row. Positions are measured with refs and a `ResizeObserver`.
- **Sequence:** when the composition is half in view: type the command (about 32ms per
  character, a short pause before Enter), print lines on a 130ms stagger, and when the ✓
  line prints, draw the connector (path length, `EASE_OUT`, 0.6s) and slide the new row
  in (`SPRING_PANEL`). "Run it again" and a selection change replay it. Under reduced
  motion the final state renders immediately. The full transcript is always in the DOM
  for screen readers; the typing is visual only.
- **Below `sm`:** the tree sits under the terminal and the connector is hidden.

### Before you install (`components/landing/faq.tsx`)

- **h2:** "Before you install".
- Six questions as native `details`/`summary` (first open), rendered from one array
  that also feeds the FAQPage JSON-LD. Text in the copy deck.

### What it costs (`components/landing/pricing.tsx`, rewritten)

- Section keeps `id="pricing"` and `scroll-mt` so `/pricing` (which redirects to
  `/#pricing`) lands on it.
- **h2:** "What it costs".
- **Two unequal panels:**
  - **Now (wider):** inverted, `--foreground` fill with `--background` text. A small
    "Now" label, a huge "$0", a short line, and a "Browse components" button.
  - **Later:** `--background-100` surface with a hairline. A "Later" label, a "Not on
    sale yet" status pill (hollow dot), the title "Pro", and a Monthly / Lifetime
    segmented toggle (`aria-pressed`). A large price that rolls on `SPRING_SWAP` when
    toggled, a sub line, and a short list with check icons that changes with the plan.
    A footer with a "Follow @devignerui" button (X logo, links to X) and a small note.
- Plan facts come from the current `pricing.tsx` and are listed in the copy deck.

## `/components`

- **Header:** h1 "Components" in Bricolage 800 (about 128px on desktop) with the total
  count as a mono superscript, an intro line, and on the right the `npx devignerui init`
  chip with a small caption.
- **Toolbar:** a rounded bar containing a search field (placeholder "Search
  components", a `/` key hint; `/` focuses it unless focus is already in a text field),
  category filter pills with counts (only non-empty categories), and a Newest / A to Z
  segmented sort. A result line "{n} of {total} components" appears while filtering,
  also announced politely. Below `lg` the toolbar sticks under the nav.
- **Grid:** two columns from `lg`, one below. Every card follows one rule:
  - Outer card: `--background-100`, hairline border, 30px radius, 8px padding.
  - Stage: 380px tall (300px below `sm`), the stage surface described above, category
    label top left, "new" tag top right when applicable. The demo is wrapped in
    `FitToStage`, which measures the demo's natural size and scales it down to fit the
    stage (never up). The demo stays fully interactive. Cards reuse the stage surface
    but not the Stage toggles. A faint radial spotlight follows the pointer across the
    stage on hover (`SPRING_MOUSE`), disabled under reduced motion and on coarse
    pointers.
  - Plate: the name as an h2 linked to `/components/{slug}`, the registry description,
    and a round arrow button (`aria-label="{name} docs"`) that fills with `--brand` on
    card hover.
  - Install row: a compact `CopyCommand` with `npx devignerui add {slug}`.
  - Hover: border to `--border-hover` plus a soft elevated shadow. No scale.
- **Lazy running:** each card's demo mounts through `LazyMount` when an
  IntersectionObserver with `rootMargin: "100% 0px"` first sees the card, and unmounts
  when a second observer with `rootMargin: "300% 0px"` reports it gone. Until mounted,
  the stage shows the component name in large faint display type. All text and links
  are server-rendered.
- **Empty search:** "Nothing called "{query}" yet." with "Tell us you want one on X."
  (link "Ask @devignerui on X"), "Or try:" followed by up to four real names, and a
  "Clear search" button.
- **Below the grid:** a slim line "Pro components are on the way, as a separate paid
  set. Everything here stays free." with "See what Pro will cost" linking to
  `/#pricing`. Then the shared footer.

## Data and architecture

### Registry additions (`scripts/registry/descriptors.mts`, `generate.mts`)

New descriptor fields, all emitted into `apps/docs/lib/registry.ts`:

| Field | Type | Purpose |
|---|---|---|
| `addedAt` | `"YYYY-MM-DD"`, required | Newest sort, the 14-day "new" tag, sitemap `lastModified`. |
| `tryIt` | `string`, optional | The stage caption hint. |
| `stageAlign` | `"center" \| "end"`, optional | Vertical alignment of the demo on stages. `end` for components whose panels open upward. |

The generator also emits `export type ComponentSlug = "magnetic-button" | ...` from the
descriptor slugs. `getRegistryIndex` and `getRegistryComponent` keep their current shape,
so the CLI is unaffected. `pnpm registry:validate` checks that `addedAt` is a valid
ISO date.

Backfilled values (first commit of each source file):

| Slug | `addedAt` | `stageAlign` | `tryIt` |
|---|---|---|---|
| magnetic-button | 2026-09-14 | center | circle it slowly, then pull away |
| chart-card | 2026-09-21 | center | sweep across the bars |
| delete-button | 2026-09-21 | center | press it, then confirm |
| timeline | 2026-09-21 | center | move across the steps |
| menu-dock | 2026-09-21 | end | open Account, then use the arrow keys |
| date-range-picker | 2026-09-23 | center | pick a day, then move across the calendar |

New descriptions (these replace the current terse ones and appear on cards, stages,
search results and meta descriptions):

| Slug | Description |
|---|---|
| magnetic-button | Leans toward your cursor before you reach it, then lets go with a wobble. |
| chart-card | A stats card whose bars show their value as you move across them. |
| delete-button | Asks before it deletes, waits for your API call, then shows a tick. |
| timeline | The active step slides off the rail, and the line bends to follow it. |
| menu-dock | A dock that grows into its own menus, nested as deep as you need. |
| date-range-picker | A calendar that shows the range before you commit to it, with presets. |

### Demos (`apps/docs/demos/`)

- One file per component, `demos/{slug}.tsx`, default-exporting a self-contained demo
  (realistic sample data, its own state). The six demos move from today's
  `components/landing/live-previews.tsx`.
- Demos render at their natural size and never use `dark:` classes.
- `demos/index.ts` exports `demos: Record<ComponentSlug, ComponentType>`, each entry a
  `next/dynamic(() => import("./{slug}"), { ssr: false, loading })`. Because the record
  is typed against `ComponentSlug`, a component without a demo fails the build.
- `demos/index.ts` is imported only from client components (`next/dynamic` with
  `ssr: false` is not allowed in server components).

### Catalog data (`apps/docs/lib/catalog.ts`, server only)

`getCatalog()` reads the registry and returns a lightweight, serializable list, so
component source never reaches the browser. The module also exports
`FEATURED: ComponentSlug = "menu-dock"`, which server pages pass down as a prop.

```ts
interface CatalogEntry {
  slug: ComponentSlug;
  name: string;
  description: string;
  category: string;       // key
  categoryLabel: string;  // from COMPONENT_CATEGORIES
  addedAt: string;        // YYYY-MM-DD
  tryIt?: string;
  stageAlign: "center" | "end";
  dependencies: string[]; // as the CLI prints them
  lines: number;          // registry code, trailing newline excluded
}
```

Sorting, filtering, searching, category counts and the "new" window live in a separate
pure module, `apps/docs/lib/catalog-query.ts`, imported by the client islands and by the
check script. Search matches name, description and category label, case-insensitive.
Newest sorts by `addedAt` descending, then name. "new" means `addedAt` within the last
14 days of the build date (pages are static, and every deploy rebuilds them).

### Selection context (`components/landing/selection.tsx`)

A small client context holding the selected slug and a setter, provided around the home
page's interactive sections, defaulting to `FEATURED`.

### Theme scoping (`globals.css`)

So a subtree can show the other theme:

- The light palette selector becomes `:root, .light`.
- The dark palette stays on `.dark`.
- The Layer 2 roles block selector becomes `:root, .dark, .light`, so roles re-resolve
  against the nearest palette instead of inheriting `:root`'s computed values.
- A scope element paints its own ground (`background: var(--background); color:
  var(--foreground)`).
- Known limit: Tailwind's `dark:` variant matches any `.dark` ancestor, so `dark:`
  classes inside a nested `.light` scope still apply. No component or demo uses them.

### `packages/ui` reduced-motion change

- `chart-card`, `date-range-picker`, `delete-button`, `menu-dock`, `timeline`: replace
  `useReducedMotion` with `useReducedMotionConfig` (same return semantics, but it also
  honours an ancestor `MotionConfig reducedMotion`).
- `magnetic-button`: read `useReducedMotionConfig()` and skip the magnetic behaviour
  when it is true, in addition to its existing media query.
- Regenerate the registry (`pnpm registry:generate`) so the copy-paste source matches.
- The README's new-component checklist gains this as a rule.

### Installation docs token block

- `globals.css` gets `/* tokens:start */` and `/* tokens:end */` markers around the
  palette, roles and `@theme inline` layers.
- A server component `components/token-block.tsx` reads that slice at build time and
  renders it with `CodeBlock`. It is registered in `mdx-components.tsx`.
- `content/docs/installation.mdx` gains a step "Add the theme tokens" with the copy in
  the copy deck and `<TokenBlock />`. One source, no drift.

### Files

Create:

- `apps/docs/demos/{magnetic-button,chart-card,delete-button,timeline,menu-dock,date-range-picker}.tsx`, `apps/docs/demos/index.ts`
- `apps/docs/lib/catalog.ts`, `apps/docs/lib/catalog-query.ts`
- `apps/docs/components/stage.tsx`
- `apps/docs/components/json-ld.tsx`, `apps/docs/components/token-block.tsx`
- `apps/docs/components/landing/{selection,component-picker,library-wall,manners,faq}.tsx`
- `apps/docs/components/catalog/catalog-grid.tsx` (toolbar, grid, cards, `FitToStage`, `LazyMount`)
- `apps/docs/app/sitemap.ts`, `apps/docs/app/robots.ts`, `apps/docs/app/icon.svg`, `apps/docs/app/apple-icon.tsx`
- `apps/docs/app/opengraph-image.tsx`, `apps/docs/app/components/opengraph-image.tsx`, `apps/docs/app/components/[slug]/opengraph-image.tsx`, `apps/docs/app/components/[slug]/layout.tsx`
- `apps/docs/assets/fonts/` with Bricolage Grotesque 700 and Geist Mono 400 as `.woff` (Fontsource static instances, OFL), for OG images
- `scripts/catalog.check.mts`

Modify:

- `apps/docs/app/page.tsx`, `apps/docs/app/components/page.tsx`, `apps/docs/app/layout.tsx`, `apps/docs/app/globals.css`
- `apps/docs/app/components/[slug]/page.tsx` (only the `use(params)` fix)
- `apps/docs/components/landing/{hero,navbar,pricing,install,copy-command,closing}.tsx` (`closing.tsx` keeps its name and now exports only `SiteFooter`)
- `apps/docs/content/docs/installation.mdx`, `apps/docs/mdx-components.tsx`
- `apps/docs/package.json` (remove `lenis` and `@gsap/react`; `gsap` stays for Magnetic Button)
- `scripts/registry/{descriptors,generate,validate}.mts`, `apps/docs/lib/registry.ts` (generated)
- `packages/ui/src/components/{chart-card,date-range-picker,delete-button,menu-dock,timeline,magnetic-button}.tsx` plus one test
- `package.json` (add the catalog check to `test`), `README.md` (document the demos convention, new descriptor fields, typography, the manners checklist, and the new known-drift items)

Delete (the user approved these deletions as part of this design):

- `apps/docs/components/landing/catalog.tsx` (replaced by `library-wall.tsx`)
- `apps/docs/components/landing/rack.tsx` (replaced by `catalog/catalog-grid.tsx`)
- `apps/docs/components/landing/live-previews.tsx` (moved to `demos/`)
- `apps/docs/components/landing/smooth-scroll.tsx` (Lenis removed)

## SEO

**Root layout:** `metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ??
"https://ui.devigner.cc")`, title `{ default: "Devigner UI", template: "%s · Devigner
UI" }`, a default description, Open Graph defaults (`siteName`, `type: "website"`,
`locale: "en_US"`), and Twitter `summary_large_image` with `site` and `creator` set to
`@devignerui`.

**Home:** absolute title, description, canonical `/`, Open Graph. JSON-LD: `WebSite`,
`Organization` (`sameAs` the X profile) and `FAQPage` from the FAQ array. One h1; each
section title is an h2.

**`/components`:** title and description (with the live count), canonical
`/components`. JSON-LD: `CollectionPage` with an `ItemList` of every component
(position, name, URL) and a `BreadcrumbList`.

**`/components/[slug]`:**

- A new server `layout.tsx` exports `generateStaticParams()` (every slug) and
  `generateMetadata()`: title `{name}: React Component for Tailwind CSS`, plus
  " · Devigner UI" when the total stays within 60 characters; description `{description}
  Free for React and Tailwind CSS, installed with one command.` (the description alone if
  that exceeds 155 characters); canonical URL; Open Graph. It also renders a
  `BreadcrumbList` JSON-LD.
- In `page.tsx`, replace the `useState` plus `useEffect` params pattern with
  `const { slug } = use(params)`, so the server HTML contains the component page instead
  of "Loading component…". No visual change.

**Files:**

- `app/sitemap.ts`: `/`, `/components`, every `/components/{slug}` (`lastModified` from
  `addedAt`), and every docs page from `source.getPages()`.
- `app/robots.ts`: allow `/`, disallow `/api/` and `/checkout/`, point at the sitemap.
- `app/icon.svg`: the "d." tile. `app/apple-icon.tsx`: the same at 180px via
  `ImageResponse`.
- OG images (1200 by 630, graphite ground, bone ink, cobalt accents, the fonts from
  `assets/fonts`):
  - home: the h1 plus "devigner." and "Free for React and Tailwind CSS";
  - `/components`: "Components", the count, and the intro line;
  - each component: its name, its description, and `npx devignerui add {slug}` in mono.

## Motion map

All values come from `devignerui/motion` (TSX) or the `ease-*` utilities (CSS). No
new tokens are expected. If one proves necessary it goes into `easing.ts` and both
`globals.css` files first.

| Moment | Token |
|---|---|
| Hero headline and sentence entrance | `EASE_OUT` tween, 0.9s, 0.08s stagger |
| Stage settle, stage demo swap in, picker open, bench proof in, tree row slide-in | `SPRING_PANEL` |
| Stage demo swap out, picker close, bench proof out | `SPRING_RETRACT` |
| "manners" bow, footer letter bow | `SPRING_PRESS` |
| Command slug swap, price roll, copy icon swap | `SPRING_SWAP` |
| Nav edge-to-pill morph, manners underline glide | `SPRING_LAYOUT` |
| Card spotlight follow | `SPRING_MOUSE` (`useSpring`) |
| Connector draw | `EASE_OUT`, 0.6s |
| Colour and border hovers | CSS `transition-colors` with `ease-out`, 200 to 300ms |

Only the install composition starts on scroll. There are no fade-ups on sections.
Under reduced motion every sequence lands in its final state, the bows and spotlight
are off, and swaps become opacity cross-fades.

## Accessibility

- The picker is a WAI-ARIA combobox with a listbox and `aria-activedescendant`. Changes
  are announced in a polite live region.
- Manners phrases, stage toggles and the pricing toggle are buttons with `aria-pressed`.
  The bench is a labelled region.
- The wall is a list of links. The FAQ uses `details`/`summary`.
- The terminal's full transcript is text in the DOM. Decorative layers (connector,
  spotlight, giant wordmark, keycaps) are `aria-hidden`.
- Every hover affordance has a focus equivalent. Focus rings use the global
  `:focus-visible` style and appear instantly.
- `/` focuses the catalog search only when focus is not in an editable field.
- Primary targets are at least 44px. No clickable label wraps to two lines.
- AA contrast in both themes, checked on muted text over `--background-100` and
  `--background-200`.

## Performance

- Bricolage self-hosted through `next/font`; the Fontshare request is gone.
- Lenis and the GSAP ticker are gone from the home page.
- Each demo is its own chunk, loaded on demand. On `/components` only cards near the
  viewport run.
- The largest element on the first screen is the server-rendered h1.
- The catalog list sent to the browser is metadata only.

## Verification

- `scripts/catalog.check.mts` (Node `assert`, like `scripts/menu-path.check.mts`) covers
  search, category counts, both sorts, the 14-day window and line counting. It runs from
  `pnpm test`.
- One new `packages/ui` test proves `MotionConfig reducedMotion="always"` changes a
  component's reduced-motion branch. Existing `packages/ui` tests still pass.
- `pnpm registry:ci`, `pnpm build` and `pnpm lint` are green.
- Screenshots of `/`, `/components` and one detail page at 375, 768 and 1440px in both
  themes with `scripts/shot.mjs`, checked by eye.
- `git grep -n -P "\x{2014}"` returns nothing.

## Copy deck

Final wording. The copy was drafted with the humanizer skill and must not be
paraphrased during implementation. `{…}` marks values from data.

### Metadata

| Where | Text |
|---|---|
| Default description | Free animated React components for Tailwind CSS, installed as plain files you own. |
| Home title | Devigner UI: Animated React Components for Tailwind CSS |
| Home description | Free animated React components for Tailwind CSS. Keyboard support, reduced motion and dark mode are built in, and one command copies each into your repo. |
| `/components` title | React Components for Tailwind CSS |
| `/components` description | Every Devigner UI component, running live: {count} free, animated React components for Tailwind CSS. Try one, then install it with a single command. |

### Navbar

Components · Docs · Pro · Get started. Menu button labels: "Open menu" / "Close menu".

### Hero

- h1: Animated React components with manners.
- Subhead: Paste one in and it's finished. Keyboard focus, loading states, reduced motion
  and dark mode are already worked out, and the CLI copies the component into your repo
  as one file you can edit. Free for React and Tailwind CSS.
- Sentence: Add the {Component} to your app.
- Link: Browse the library →
- Picker search placeholder: Search components. Picker empty state: No component called
  "{query}" yet.
- Stage controls: Dark · Reduced motion · reset ("Reset the demo" as its label). Caption
  hint prefix: Try it:

### Every component so far

- h2: Every component so far
- Filter: All, then category labels.
- Default caption: Each name opens its live demo and docs.
- Overflow: and {n} more

### What we mean by manners

- h2: What we mean by manners
- Sentence: Every component keeps still when asked, looks right in both themes, answers to
  the keyboard and leaves the code with you.
- Switcher: Showing {name}
- Keeps still when asked: Turn on reduced motion and try it again. The springs and slides
  stop, and everything still works.
- Looks right in both themes: One component, one file, two themes. The colors come from
  CSS variables, so there's no dark: class anywhere in the source.
- Answers to the keyboard: Click into the stage and put the mouse away. Each key you
  press lights up here.
- Leaves the code with you: This is the file the CLI writes. Every class name is in it,
  where you can change it.

### Two commands, then it's your code

- h2: Two commands, then it's your code
- Sentence: Run {npx devignerui init} once in your project. After that, {npx devignerui
  add slug} writes {slug.tsx} into components/ui, and from then on it's a normal file in
  your repo.
- Terminal tab: your-app, zsh. Button: Run it again. Inline button: Copy.
- Tree header: your-app · after the add command. Tree footer: 1 file added · nothing
  else changed.

### Before you install

1. **Is Devigner UI free?** Yes. Every component on the site is free and MIT licensed,
   including for commercial work. Pro will be a separate paid set, and nothing that's
   free now moves behind it.
2. **How do I add a component to my project?** Run npx devignerui init once per project,
   then npx devignerui add with the component's name. The CLI writes the file into
   components/ui and prints the npm packages it needs. The installation guide has the CSS
   variables to paste into your stylesheet.
3. **Does it work with shadcn/ui?** Yes. Both use a components/ui folder and many of the
   same CSS variable names, like --primary and --ring. Devigner components also read a
   few tokens of their own, such as --surface and --brand, and the installation guide
   lists them all.
4. **Do I need Framer Motion?** Most components use Motion, the library that used to be
   called Framer Motion, and a few use GSAP. Each component's page and the CLI list
   exactly which packages it needs.
5. **Will it work with the Next.js App Router?** Yes. Every component starts with "use
   client", so you can render it from a server component.
6. **How do dark mode and theming work?** Every color is a CSS variable. Put the dark
   class on your html element and the components switch, and override any variable in
   your own CSS to change the look.

### What it costs

- h2: What it costs
- Now: label "Now", "$0", "Every component on the site, MIT licensed. You don't need an
  account, and there are no seat limits.", button "Browse components".
- Later: label "Later", status "Not on sale yet", title "Pro", toggle "Monthly" /
  "Lifetime".
- Monthly: "$14.99" "a month". Sub: "Cancel whenever. Lifetime is one payment of
  $149.99." List: "Every Pro component while you're subscribed", "New Pro components as
  they ship", "Priority support".
- Lifetime: "$149.99" "once". Sub: "About ten months of Monthly, then it's paid for
  good." List: "Every Pro component, including future ones", "One payment, no renewal".
- Footer: button "Follow @devignerui", note "We'll post there the day Pro opens."

### `/components`

- h1: Components
- Intro: Free animated React components for Tailwind CSS. Every card below is running, so
  try it right here, then copy the command that installs it.
- Init caption: Once per project, then add any of these by name
- Search placeholder: Search components. Result line: {n} of {total} components.
- Sort: Newest · A to Z
- Empty: Nothing called "{query}" yet. / Tell us you want one on X. / Ask @devignerui on
  X / Or try: {names} / Clear search
- Pro line: Pro components are on the way, as a separate paid set. Everything here stays
  free. Link: See what Pro will cost

### Footer

- Tagline: Animated React components for Tailwind CSS. Free, MIT licensed, and yours to
  edit once they're in your repo.
- Groups: Library (Components, Docs, Pro) · Elsewhere (X (@devignerui), Installation
  guide, Theming guide)
- Bottom: © {year} Devigner UI · MIT license · Built with React, Tailwind CSS and Motion
  · ↑ Top ("Back to top" as its label)

### Installation guide addition

- Heading: Add the theme tokens
- Body: Components read Devigner's CSS variables for color, radius and shadow. Paste
  this block into your global stylesheet, below `@import "tailwindcss"`. It's the same
  palette the docs use, in light and dark.

## Follow-ups (not in this work)

- Timeline has no keyboard-focusable parts by default, so its step highlight only
  responds to the pointer. Record it in README §17 as known drift.
- `npx devignerui init` should write the theme tokens itself, which would make the docs
  token step optional.
- The component detail page could adopt `demos/` instead of its own preview switch.
- What Pro includes is not defined beyond the plan facts above. The Later panel should
  be revisited when it is.
