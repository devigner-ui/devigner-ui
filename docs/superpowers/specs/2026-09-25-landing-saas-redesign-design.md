# Landing and catalog redesign, SaaS pass

## Context

The first redesign (`2026-09-24-landing-redesign-design.md`, implemented in the working
tree) rebuilt `/` and `/components` on registry data in an editorial, sentence-driven
direction. On review the user wants a premium SaaS landing page instead: product shown
up front, clear sections, no editorial layout.

This spec replaces the visual design and the section structure of both pages. It keeps
the plumbing from the first spec unchanged: registry fields (`addedAt`, `tryIt`,
`stageAlign`, `ComponentSlug`), `demos/`, `lib/catalog.ts` and `lib/catalog-query.ts`,
the selection context, theme scoping, the `packages/ui` reduced-motion change, the token
block in the installation guide, and all SEO files (sitemap, robots, icons, OG images,
JSON-LD, the `[slug]` layout). Where the two specs disagree about what the pages look
like or say, this one wins.

Every decision below was made with the user in the visual companion
(`.superpowers/brainstorm/1962-1790281315/content/home-full.html` and
`components-full.html` are the approved mockups).

## Decisions

| Topic | Decision |
|---|---|
| Direction | Premium SaaS landing. Hero is headline, then a product window (A+B hybrid: a small design tool). |
| Hero title | Kept as is: "Beautifully Crafted React Components, Built for Developers." |
| Hero window | Option A: top bar, component list on the left, draggable canvas of live frames, floating toolbar. No right-hand inspector. |
| Controls in the window | Theme (Light/Dark) is the only control besides picking a component. Motion, keyboard and file info are not shown there. |
| Titles | Geist 600, tight tracking. |
| Accent word | Mazius Display Extra Italic Bold, in `--brand`, on one word per title and only on some titles. |
| Logo font | Bricolage Grotesque stays, for the wordmark, brand tile, favicon and the giant footer wordmark only. |
| Corners | Every surface that holds a live component is square, like a frame in a design file. Chrome (window, buttons, terminal, pricing and FAQ panels) stays rounded. Components keep their own radius. |
| Icons | Only `@devigner-ui/icons`. No text arrows, ticks, plus signs or emoji anywhere in UI. |
| Exception: CLI transcript | The on-page terminal keeps the CLI's own glyphs (`📦`, `✓`) because it reproduces real output. |
| Brand logos | From Simple Icons (CC0), as inline SVG components. Used for the works-with strip and the X mark. |
| Kept from the current build | Works-with idea, the install section's structure (sentence with commands, terminal, file tree, connector), last call, footer with the giant wordmark. |
| Removed | The name wall, the manners bench, the sentence picker, the handoff section, the separate Now/Later pricing panels. |
| `/components` cards | Option A: one hairline grid (cells split by 1px lines), square stages, hover borrows the hero's selection frame. |
| Proof | Unchanged: X is the only real channel. No stars, logos of customers, testimonials or invented numbers. |

## Visual system

**Tokens.** The palette and roles in `apps/docs/app/globals.css` stay. Changes:

- `--font-accent`: Mazius Display, loaded with `next/font/local` from
  `apps/docs/assets/fonts/MaziusDisplay-ExtraItalicBold.woff2` (weight 700, style
  italic, `display: swap`). The OFL license text is committed next to it as
  `MaziusDisplay-OFL.txt`. Source: github.com/collletttivo/mazius-display.
- `--font-display` stays Bricolage and is used only by `Wordmark`, `BrandTile`, the
  giant footer wordmark and the OG images.
- A utility class `.accent-word`: `font-family: var(--font-accent); font-style: italic;
  font-weight: 700; font-size: 1.1em; line-height: 0; letter-spacing: -0.01em;
  color: var(--brand); padding-right: 0.04em`. `line-height: 0` keeps the swash from
  pushing the line box.
- Section title scale: h1 `clamp(2.5rem, 5vw, 4rem)`, h2 `clamp(2rem, 3.6vw, 2.875rem)`,
  both Geist 600, `leading-[1.04]`, `tracking-[-0.05em]`.
- New role `--glow`: `oklch(from var(--brand) l c h / 0.16)` in dark and
  `/ 0.10` in light, used by the hero and header light.

**Icons used.** `IconArrowRight`, `IconArrowUp`, `IconArrowDown`, `IconArrowLeft`,
`IconCopy`, `IconCheck`, `IconSun`, `IconMoon`, `IconCursor`, `IconMaximize`,
`IconSearchNormal`, `IconFolder`, `IconDocumentCode`, `IconDocument`, `IconTerminal`,
`IconRestart`, `IconAdd`, `IconCheckCircle`. All from `@devigner-ui/icons`.

**Brand logos.** `components/brand-logos.tsx` exports `LogoX`, `LogoReact`,
`LogoNextjs`, `LogoTailwind`, `LogoTypeScript`, `LogoVite`, `LogoShadcn`, each an
inline `<svg>` with the Simple Icons path, `fill="currentColor"`, `aria-hidden`. No new
dependency.

**Themes.** Everything is token-driven and works in light and dark. Mockups were
reviewed in dark; light uses the same layout with the light palette.

## Shared chrome

### Navbar (`components/landing/navbar.tsx`)

Three columns: wordmark left; Components, Docs, Pricing centered, with the active route
in a soft pill; theme toggle (icon button, `IconSun` / `IconMoon`) and a "Get started"
ink pill (`/docs/installation`) right. The scroll behavior from the first spec stays
(edge-aligned at the top, a centered floating pill after 24px, on `SPRING_LAYOUT`).
Mobile keeps the full-screen menu.

### Footer (`components/landing/closing.tsx`)

Unchanged from the current build (brand block, two link groups, giant pressed
wordmark with the letter bow, bottom bar). Two edits: the "↑ Top" link becomes "Top"
with `IconArrowUp`, and the X link gets `LogoX`.

## Home page (`/`)

Order: Hero, Works with, Every state, Install, Pricing, FAQ, Last call, footer.
`SelectionProvider` wraps the hero and the install section, so picking a component in
the hero window changes the install transcript. Default selection is `FEATURED`.

### Hero (`components/landing/hero.tsx`)

- **Background:** `--background` with two soft `--glow` ellipses, one at the top
  center, one behind the window's top edge. No grid, no noise.
- **Text block, centered:**
  - Release pill: a "New" tag in brand tint, the newest component's name, and
    `IconArrowRight`. Links to `/components/{slug}` of the newest entry
    (`getCatalog()[0]`).
  - h1: "Beautifully <accent>Crafted</accent> React Components," line break,
    "Built for Developers." Two lines on desktop, `text-balance` below.
  - Subhead (18px, muted): the copy deck line.
  - Actions: "Browse components" (brand pill with an inner top highlight and
    `IconArrowRight`) and the `CopyCommand` chip for `npx devignerui init`.
- **Entrance:** the existing CSS `rise` sequence for the text block, then the window
  settles on `SPRING_PANEL`.

### Hero window (`components/landing/hero-window.tsx`, new)

A real, working mini app. Rounded 18px, `--background` fill, hairline border plus a
second faint outer ring, a 1px light catch along the top edge (gradient from
transparent through white and cobalt), a brand glow above and a deep shadow below.

- **Tilt:** starts at `rotateX(9deg)` from the top edge and flattens to 0 as the window
  scrolls into view (`useScroll` on the window, `useTransform` from 0 to 0.5 of its
  progress). Flat under reduced motion.
- **Top bar (48px):** brand tile, then the breadcrumb "Components / {name}". On the right,
  a Light / Dark segmented control (`IconSun`, `IconMoon`, `aria-pressed`) and a
  "Docs" link with `IconArrowRight` to `/components/{slug}`. The theme control wraps the
  canvas in a `.light` or `.dark` scope and starts matching the page.
- **Component list (220px):** a search field ("Search components", `/` hint, filters as
  you type), then components grouped by category with counts, newest first inside each
  group. Each row: a small mono `#`, the name, and a "New" tag within 14 days. The
  selected row has a brand tint and ring. Rows are buttons; arrow keys move between
  them.
- **Canvas:** a native scroll container with hidden scrollbars, so trackpads and wheels
  pan it; mouse drag on empty canvas also pans. Background is a soft radial of
  `--background-200` into `--background`. Frames are laid out from the registry in
  rows of three (newest first), each 360 by 270px with 56px gaps, on a canvas at least
  twice the viewport in each direction.
  - **Frame:** a label above (name in `--text-tertiary`, category in mono muted), then a
    square stage (`--background-200` with the stage light, hairline inset). The demo is
    wrapped in `FitToStage` and mounted through `LazyMount`.
  - **Selected frame:** 1.5px brand outline, four square handles (8px, `--foreground`
    fill, brand border), and a size label under it in brand ("360 × 270", measured).
    Clicking a frame or a list row selects it and scrolls it into view
    (`scrollTo` with smooth behavior; instant under reduced motion).
- **Floating toolbar:** centered at the bottom of the canvas, a glass pill with a
  "Recenter" icon button (`IconMaximize`, recenters the selected frame), a divider, and
  the install command `npx devignerui add {slug}` with a Copy button (`IconCopy`, swaps
  to `IconCheck` on `SPRING_SWAP`).
- **Mobile (below `md`):** no dragging. The list becomes a horizontal row of chips above
  the canvas, the canvas shows only the selected frame at full width, and the toolbar
  holds only the command.
- **Accessibility:** the window is a labelled region ("Component preview"). The list is
  a listbox with `aria-activedescendant`; a polite live region says "Showing {name}".
  Frames are focusable buttons named "{name}, select". Decorative handles and the size
  label are `aria-hidden`.

### Works with (`components/landing/works-with.tsx`, new)

A slim band between hairlines: on the left, "Built for React 19 and Tailwind CSS v4.
It drops into the stack you already have."; on the right, the six logos with their
names (React, Next.js, Tailwind CSS, TypeScript, Vite, shadcn/ui) in
`--text-tertiary`. Below `md` the logos wrap into two rows.

### Every state (`components/landing/states.tsx`, new)

- h2: "Every state, already <accent>handled</accent>." Lede from the copy deck.
- One hairline grid (1px `--border` gaps on a bordered box), 12 columns, square cells.
  Row one: Keyboard (7 columns) and Themes (5). Row two: Reduced motion, States and
  Code (4 each). Each cell: a title (Geist 600, 18px) and one line of text at the top,
  the live visual below, bleeding to the cell edges where noted. Below `lg` the cells
  stack.
- Which component each cell shows is set in `lib/catalog.ts` as
  `BENTO = { keyboard: "menu-dock", themes: "date-range-picker", motion: "magnetic-button", states: "delete-button" }`.
  The code cell follows the hero selection.
- **Keyboard:** the live component and a row of keycaps under it: Tab, the four arrows
  (`IconArrowUp/Down/Left/Right`), Enter, Esc. A keycap lights (brand fill, pressed
  down 2px, soft brand glow) while its key is held with focus inside the cell. A faint
  brand glow sits at the bottom of the cell.
- **Themes:** the component rendered twice, in a `.light` and a `.dark` scope, stacked
  and clipped by a draggable divider (`clip-path: inset`), so one component shows both
  themes. The handle is a round `--foreground` knob with `IconArrowLeft` and
  `IconArrowRight`, a `role="slider"` that also moves with arrow keys.
- **Reduced motion:** the live component under `MotionConfig`, with a large switch
  labelled "Reduce motion" (`role="switch"`). Turning it on sets
  `reducedMotion="always"`.
- **States:** the live Delete Button next to a list of its four states (idle, confirm,
  waiting, done). The list highlights the current state as you use the button; with no
  input it steps through on its own every 1.6s. It stops under reduced motion.
- **Code:** a panel bleeding off the cell's right and bottom edges with a header
  "{slug}.tsx" and "{lines} lines", then the first 10 lines of the registry source in
  Geist Mono, with class-name strings in brand. Source is fetched on demand from
  `/api/registry/{slug}`.

### Install (`components/landing/install.tsx`, polished in place)

Same structure and sequence as the current section (sentence with the commands,
terminal with the typed transcript, file tree, dotted connector, "Run it again",
selection-driven slug, reduced-motion final state, transcript in the DOM). Changes:

- h2: "Two <accent>commands</accent>, then it's your code"
- **Sentence chips:** 12px radius chips with a small tinted icon tile (`IconTerminal`
  for commands, `IconDocumentCode` for the file), the text, and a copy icon button in
  its own bordered square. The file chip shows "+{lines}" in `--success`.
- **Terminal:** header with three neutral dots, then one tab per command: "init"
  (complete: a green `IconCheck` in its number tile) and "add {slug}" (active: brand
  number tile "2"), then "Run it again" with `IconRestart`. Background gets a faint
  brand glow at the top left. Output colors: prompt path in `--brand-tertiary`,
  command in `--foreground` with the slug in brand, progress lines muted, the ✓ line as
  a green chip with an inner ring, the npm line in `--foreground` with an inline Copy
  button, "Done!" in `--success`, and a block caret that blinks (still under reduced
  motion).
- **File tree:** a glass card (`--background-200` at 92% with backdrop blur, inner top
  highlight, deep shadow) overlapping the terminal's right edge. Rows 34px with
  `IconFolder` and `IconDocument` icons (tsx files tinted brand, json files tinted
  `--warning`), indent guides, and the new file row glowing with a brand ring, a "new"
  pill and "+{lines}" in `--success`. Footer: "1 file added" and "nothing else
  changed".
- **Connector:** from the right end of the ✓ chip to the left edge of the new row,
  dotted brand line with end dots and a small `--brand-tertiary` dot at its midpoint,
  measured with refs and a `ResizeObserver`.

### Pricing (`components/landing/pricing.tsx`, rewritten)

- `id="pricing"` and `scroll-mt` stay.
- Centered h2 "Free today, and it stays <accent>free</accent>." and the lede.
- A Monthly / Lifetime pill toggle ("pay once" hint in brand on Lifetime,
  `aria-pressed`). It changes only the Pro card.
- Two equal cards, max width 920px, 26px radius:
  - **Free:** "Free" with an "Available now" badge (solid `--success` dot), "$0" and
    "forever", one line, a full-width ink "Browse components" button, then four items
    with check icons.
  - **Pro (featured):** brand-tinted border, a radial brand glow in the top right, a
    soft brand shadow. "Pro" with a "Not on sale yet" badge (hollow dot). The price rolls
    on `SPRING_SWAP` when the toggle changes. A full-width outline button "Get notified
    on X" with `LogoX`, then the plan's items with brand check icons.
- Plan facts are unchanged from the first spec.

### FAQ (`components/landing/faq.tsx`)

- Centered h2 "Before you install", then a centered column (max 780px) of rounded
  panels. Each is a native `details`/`summary`; the first is open. The summary row has
  the question and a round icon button with `IconAdd` that rotates 45 degrees when open;
  the open panel lifts to `--background-200` with a stronger border.
- Under the list: "Still wondering about something?" and "Ask @devignerui on X" with
  `IconArrowRight`.
- The six questions and answers stay as in the first spec and still feed the FAQPage
  JSON-LD.

### Last call (in `components/landing/closing.tsx`, exported as `LastCall`)

- Left: h2 "Start with one <accent>component</accent>." and the lede. Right: the
  `init` chip and the "Browse components" brand button.

## `/components`

- **Header:** a soft `--glow` in the top left. A pill with "{count} components" and
  "Newest: {name}". h1 "React <accent>Components</accent> for Tailwind CSS". The
  intro line. On the right, the `init` chip and its caption.
- **Toolbar:** a rounded glass bar: the search field (`IconSearchNormal`, placeholder,
  `/` key hint), category pills with counts (selected pill is ink), and a Newest / A to
  Z segmented sort. It sticks under the nav at every width. The "{n} of {total}
  components" live line appears while filtering.
- **Grid:** one hairline grid, two columns from `lg`, one below. Each cell:
  - Stage: square, 340px tall (280px below `sm`), the stage light surface, category in
    mono at the top left, a "New" tag at the top right. The demo is live, through
    `FitToStage` and `LazyMount` as today.
  - Info: the name as an h2 (Geist 600, 22px) linked to `/components/{slug}`, the
    description, a round arrow button (`IconArrowRight`, `aria-label="{name} docs"`),
    and the install row (`npx devignerui add {slug}` with a copy icon button).
  - Hover and focus-within: the stage gets the hero's selection frame (inset 1.5px
    brand outline, four corner handles, the measured size label at the bottom center),
    and the arrow button fills with brand. No scale, no lift.
- **Empty search** and the **Pro line** keep the first spec's copy, restyled to match.
  The Pro line's link uses `IconArrowRight`.
- The spotlight that followed the pointer is removed; the selection frame replaces it.

## Data and architecture changes

Additions to what the first spec built:

- `lib/catalog.ts`: `BENTO` constant (above). `FEATURED` stays. `BENCH` is removed.
- `components/landing/canvas-frame.tsx`: `Frame` (label, square stage, selection
  handles and size label), plus `FitToStage` and `LazyMount` moved here from
  `catalog/catalog-grid.tsx` so the hero, the bento and the catalog share them.
- `components/stage.tsx`: reduced to `StageDemo` (the cross-fading demo mount), used by
  frames. The toggles, caption and surface move out.

## Files

Create:

- `apps/docs/assets/fonts/MaziusDisplay-ExtraItalicBold.woff2`, `MaziusDisplay-OFL.txt`
- `apps/docs/components/brand-logos.tsx`
- `apps/docs/components/landing/{hero-window,canvas-frame,works-with,states}.tsx`

Modify:

- `apps/docs/app/layout.tsx` (load Mazius, expose `--font-accent`)
- `apps/docs/app/globals.css` (`--font-accent`, `--glow`, `.accent-word`)
- `apps/docs/app/page.tsx` (new section order), `apps/docs/app/components/page.tsx`
- `apps/docs/components/landing/{hero,navbar,install,pricing,faq,closing,copy-command}.tsx`
- `apps/docs/components/catalog/catalog-grid.tsx`, `apps/docs/components/stage.tsx`
- `apps/docs/lib/catalog.ts`
- `README.md` (typography, the corner rule, the icon rule, the CLI transcript exception)

Delete (all are this branch's uncommitted files, replaced by the above):

- `apps/docs/components/landing/library-wall.tsx`
- `apps/docs/components/landing/manners.tsx`
- `apps/docs/components/landing/component-picker.tsx`

## Motion map

All values come from `@devignerui/ui/motion` or the `ease-*` utilities.

| Moment | Token |
|---|---|
| Hero text entrance | existing CSS `rise` (`EASE_OUT`) |
| Window settle, frame demo swap in, FAQ panel open | `SPRING_PANEL` |
| Demo swap out | `SPRING_RETRACT` |
| Window tilt flattening | scroll-linked `useTransform`, no easing |
| Selection outline and handles moving between frames | `SPRING_LAYOUT` (`layoutId`) |
| Copy icon swap, price roll, keycap press | `SPRING_SWAP` / `SPRING_PRESS` |
| Nav edge-to-pill | `SPRING_LAYOUT` |
| Install connector draw | `EASE_OUT`, 0.6s |
| Colour and border hovers | `transition-colors ease-out`, 200 to 300ms |

Under reduced motion: no tilt, no auto-stepping, instant scrolls, the install sequence
lands in its final state, and swaps become opacity fades.

## Accessibility

Everything from the first spec still applies. Additions: the hero window's list and
frames (above), the themes divider as a slider, the reduced-motion switch as a switch,
keycaps `aria-hidden`, and every icon-only button labelled. Contrast is checked for
muted text on `--background-100` and `--background-200` in both themes, and for brand
text on both backgrounds (the Mazius words are large text).

## Copy deck

Final wording, after the humanizer pass. `{…}` is data. `<accent>` marks the Mazius word.

### Metadata

Unchanged from the first spec.

### Hero

- Pill: New · {newest name}
- h1: Beautifully <accent>Crafted</accent> React Components, Built for Developers.
- Subhead: Animated, accessible components you install as plain .tsx files. Free for
  React and Tailwind CSS.
- Buttons: Browse components · `npx devignerui init`
- Window: Components / {name} · Light · Dark · Docs · Search components · Recenter ·
  Copy · live region "Showing {name}"

### Works with

Built for React 19 and Tailwind CSS v4. It drops into the stack you already have.

### Every state

- h2: Every state, already <accent>handled</accent>.
- Lede: Focus, loading, confirmation, reduced motion and both themes are part of each
  component, so the part you paste in is the finished part.
- Works from the keyboard: Click into it and put the mouse away. Every key you press
  lights up here.
- Right in both themes: Drag across it. Colors come from CSS variables, with no dark:
  classes in the file.
- Still when you ask: Turn on reduced motion and the springs stop. Everything still
  works. Switch label: Reduce motion
- Loading and confirm: Delete Button asks first, waits for your request, then shows a
  tick. States: idle, confirm, waiting, done
- One file you own: A plain .tsx file in your repo. The CLI prints the few packages it
  needs, and every class name is there for you to change.

### Install

- h2: Two <accent>commands</accent>, then it's your code
- Sentence: Run {npx devignerui init} once in your project. After that, {npx devignerui
  add slug} writes {slug.tsx} into components/ui, and from then on it's a normal file in
  your repo.
- Terminal tabs: init · add {slug} · Run it again. Tree: your-app · after the add
  command · 1 file added · nothing else changed

### Pricing

- h2: Free today, and it stays <accent>free</accent>.
- Lede: Every component on the site is MIT licensed. Pro will be a separate paid set,
  and nothing free moves behind it.
- Toggle: Monthly · Lifetime (pay once)
- Free: Available now · $0 forever · Everything on the site, with no account and no
  seat limits. · Browse components · Every component in the library · MIT license,
  commercial use included · Install with the CLI or copy the file · Light and dark
  themes out of the box
- Pro: Not on sale yet · Monthly "$14.99 a month", sub "Cancel whenever. Lifetime is one
  payment of $149.99." · Lifetime "$149.99 once", sub "About ten months of Monthly, then
  it's paid for good." · Get notified on X · Monthly items: Everything in Free, Every
  Pro component while you're subscribed, New Pro components as they ship, Priority
  support · Lifetime items: Everything in Free, Every Pro component, including future
  ones, One payment, no renewal

### FAQ

- h2: Before you install. The six questions and answers from the first spec.
- Under: Still wondering about something? Ask @devignerui on X

### Last call

- h2: Start with one <accent>component</accent>.
- Lede: Pick any of them, run one command, and edit it like the rest of your code.

### `/components`

- Pill: {count} components · Newest: {name}
- h1: React <accent>Components</accent> for Tailwind CSS
- Intro, init caption, search, sort, result line, empty state and Pro line: as in the
  first spec.

### Footer

As in the first spec, with "Top" in place of "↑ Top".

## Verification

- `pnpm test` (catalog check), `pnpm registry:ci`, `pnpm lint`, `pnpm build` green.
- Screenshots of `/` and `/components` at 375, 768 and 1440px in both themes with
  `scripts/shot.mjs`, compared by eye against the approved mockups.
- Keyboard pass: the hero list and frames, the themes slider, the reduced-motion switch,
  the pricing toggle, the FAQ, the catalog toolbar and cards.
- `git grep -n -P "\x{2014}"` returns nothing, and no icon is a text glyph (search the
  changed files for `→`, `↑`, `✓`, `×` used as icons; the terminal transcript and the
  size label are the only allowed glyphs).

## Follow-ups

- OG images still set their titles in Bricolage; move them to Geist plus Mazius later.
- The `[slug]` detail page and the docs have not adopted the new title type.
- Registry dependencies list `@devignerui/ui` for the motion tokens, which the README
  says installed code should not need. Record it in README §17 as known drift.
