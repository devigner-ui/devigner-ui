# Component details page redesign

## Context

`/components/[slug]` still wears the old look: grain overlay, regular-weight titles,
opacity-based text, a frosted ruler-tick sidebar and a logo + toggle + breadcrumb row.
The home page and `/components` were rebuilt in the SaaS pass
(`2026-09-25-landing-saas-redesign-design.md`). This spec brings the details page into
that family. **Home and `/components` do not change.**

Every decision below was made with the user in the visual companion. The approved
mockup is `.superpowers/brainstorm/1051-1790358813/content/detail-final.html`; the
rounds before it are `detail-directions.html` and `detail-hybrid.html` in the same
folder.

## Decisions

| Topic | Decision |
|---|---|
| Direction | The details page takes the home look: Geist 600 titles, the Mazius accent word, hairlines, square stages with the stage light, the cobalt `--glow`, ink and brand pills, the `devigner.` wordmark. |
| Layout | Full-height app shell stays (no page scroll). Stage fills the viewport; Docs open as a right-hand inspector; Source Code stays a bottom drawer. |
| Top bar | "T3": a floating glass pill, top centre, holding the wordmark and the crumb. No Get started, no other controls. |
| Stage | "S1": full-bleed square stage, stage light from the top, cobalt glow from below. |
| Component navigation | The ruler-tick sidebar is removed. A **Components** item in the dock morphs into search plus the grouped list. |
| Dock | Still the real `MenuDock`, floating at the bottom centre. Items: Previous, Components, Docs, Reset, Theme, Settings (only when the preview has props), Code, Next. |
| Theme item | Uses the home navbar's sun/moon spin icon (`ThemeIcon`). The circle reveal still starts from the dock button. |
| Prev / next | Arrow items at both ends of the dock with a hover label naming the target. Left / Right arrow keys do the same when nothing is focused. `[` `]` are not used. |
| Docs copy | Rewritten in the home voice. Tabs: Install, Usage, Props, Notes. |
| Accent word in the name | In the h1 only: the last word of a multi-word name ("Magnetic *Button*", "Date Range *Picker*"). Single-word names ("Timeline") get none. |
| Grain overlay | Removed from this page. The class stays in `globals.css` (checkout success still uses it). |
| "Keep in mind" footer | Moves into the Notes tab. |
| Icons | Only `@devigner-ui/icons`. No text arrows, ticks or emoji. |

## Layout (lg and up)

The page is `h-dvh`, `overflow-hidden`, on `--background`. Two columns: the **stage
column** (flexible) and, when Docs is open, the **inspector** (400px). The stage column
is a vertical stack: the stage (flex-1), then the Code drawer (0 or 320px).

### Stage

- Square corners, no inset, no border, edge to edge within its column. Uses the
  existing `.frame-surface` utility (stage light over `--background-200`), plus a soft
  `--glow` radial rising from the bottom edge (same recipe as the home keyboard cell).
- The live preview is centred as today, keyed by `previewKey` so Reset remounts it.
- The `tryIt` hint from the registry sits top right, in the landing's small mono style
  with a brand dot. It is hidden below `sm` and when the entry has no `tryIt`.
- When Docs opens, the column narrows on `SPRING_LAYOUT`; the pill and the dock are
  centred in the column, so they glide with it.

### Top pill

- `nav aria-label="Breadcrumb"`, absolutely positioned top centre of the stage column,
  14px from the top.
- Glass pill, 48px tall: `--background` at 72% with `backdrop-blur`, hairline border, a
  soft shadow and a 1px inner top highlight (the home navbar's scrolled state).
- Contents: `Wordmark` (from `components/landing/navbar.tsx`, links to `/`), a 1px
  divider, then `Components` (link to `/components`), `IconChevronRight`, and the
  component name in `--foreground`, `aria-current="page"`.
- Below `sm`: the `Components` crumb and chevron drop; the name stays.

### Dock

The existing `MenuDock` with `className="border-none! shadow-none!"` as today, in this
item order:

| id | Icon | Label shown | Behaviour |
|---|---|---|---|
| `prev` | `IconChevronLeft` | no | Goes to the previous component. `label` is "Previous: {name}". |
| `components` | `IconCategory` | yes, "Components" | `content`: the Components panel. |
| `docs` | `IconBook2` in `DockGlyph` | yes, "Docs" | Toggles the inspector. |
| `reset` | `IconRestart` (spins) | no | As today. |
| `theme` | `ThemeIcon` | no | `toggleTheme` from the button's rect, as today. |
| `settings` | `IconSettings` | no | `content`: the props panel. Only when the preview has one. |
| `source` | `IconCode` in `DockGlyph` | yes, "Code" | Toggles the Code drawer. |
| `next` | `IconChevronRight` | no | Goes to the next component. `label` is "Next: {name}". |

Below `lg`, `showLabel` is off for every item so the dock is icons only (eight 36px
items fit a 360px screen).

`ThemeIcon` reads `group-data-[dark=true]`, so the dock icon wraps it in
`<span className="group" data-dark={theme === "dark"}>`. `ThemeIcon` becomes a named
export of `components/theme-provider.tsx`; `ThemeToggle` keeps using it.

**Prev / next hover label.** A small ink tooltip (fg background, bg text, 30px tall,
9px radius, caret) above the arrow: "Next" in a muted tone, then the target's name.
The icon node carries an absolutely positioned span covering the row's tap target (the
`DockGlyph` technique) with `onPointerEnter` / `onPointerLeave`; the tooltip renders in
the page, positioned from that span's rect, fading in on `EASE_OUT`. It is decorative
(`aria-hidden`); screen readers get the item's `label`. It does not show on touch.

**Order.** Previous and next walk the same order as the Components panel (below),
flattened, and wrap around at both ends.

### Components panel

The `content` of the `components` dock item, 300px wide:

- A search field (`IconSearchNormal`, placeholder "Search components", an `esc` hint),
  focused when the panel opens. Filters with `searchEntries` as you type.
- Groups by category with the count in mono, using `groupByCategory` (moved from
  `hero-window.tsx` into `lib/catalog-query.ts`, so both use one copy): groups ordered
  by their newest member, newest first inside each group. This is the hero window's
  order.
- Rows: a mono `#`, the name, and a brand "New" tag when `isNew`. The current component
  has the brand tint and ring and `aria-current="page"`. Rows are links
  (`next/link`) to `/components/{slug}`.
- Up / Down move focus between rows, Enter follows the link, Esc closes the panel (the
  dock's own behaviour).
- No match: one muted line, "Nothing matches "{query}"".
- `/` anywhere outside a text field opens the panel. The dock is driven through its
  controlled `path` / `onNavigate` props for this, so `/` sets the path to the
  Components item's index.

### Docs inspector

- `aside aria-label="Documentation"`, 400px, `border-l border-border`, scrolls on its
  own (`overflow-y-auto`, with a visible scrollbar).
- Enters from the right (`x: 100%` to `0`) on `SPRING_PANEL`; the stage column narrows
  on `SPRING_LAYOUT` at the same time.
- **Header** (scrolls with the content):
  - Meta row in mono muted: the "New" tag when `isNew`, the category label, "added
    {Mon D}".
  - h1: Geist 600, 38px, `tracking-[-0.05em]`, the name with the accent word per the
    rule above (`.accent-word`).
  - Lede: the registry description, 14.5px, `--text-secondary`.
- **Tabs**: ARIA tabs (`role="tablist"`, arrow keys move between tabs), a hairline
  pill track with the active pill sliding on `SPRING_LAYOUT` (`layoutId`). Install,
  Usage, Props, Notes. The tab row scrolls with the header; it is not sticky.
- **Install tab**
  - h2 "Install it in *one* line" (20px, accent on "one").
  - `CopyCommand` (landing) for `npx devignerui add {slug}`, `highlight={slug}`, full
    width.
  - "Writes `components/ui/{slug}.tsx` and lists what it needs."
  - Mono label "First time here", then `CopyCommand` for `npx devignerui init`.
  - Mono label "Or by hand", then an ordered list: "Needs React 18+ and Tailwind CSS
    v4."; "Run `npm i {deps}`" (registry `dependencies` minus `react`), as a compact
    `CopyCommand`; "Paste the source from Code into `components/ui/{slug}.tsx`" where
    "Code" is a text button that opens the drawer.
- **Usage tab**
  - h2 "Usage". The code figure as today (copy button top right), fed by the live
    snippet (Magnetic Button and Delete Button follow their knobs).
  - When `customUsage` exists: h3 "Custom composition" and a second figure.
- **Props tab**
  - h2 "Every *prop*". One hairline table, a row per prop, stacked to fit 400px: name
    (mono, `--foreground`) and default (mono, right aligned, `-` when none) on the
    first line, type (mono muted) on the second, description (13.5px secondary) under
    it.
- **Notes tab**
  - The registry notes as a list, when there are any.
  - Then the old footer, rewritten: "It's your code now. Edit it however you like. If
    something breaks in your setup, the [registry](/components) has the latest
    version."
- **Below `lg`** the inspector is a full sheet over the stage (top under the pill, down
  to the bottom), with bottom padding so the dock never covers text. The stage stays
  mounted behind it.

### Code drawer

Unchanged behaviour (320px, `SPRING_PANEL`, stage shrinks above it, dock rides up with
the stage). Restyled:

- `border-t border-border`, the landing terminal's darker surface.
- Header, 48px, hairline under it: file name in mono `--foreground`, "{n} lines" in
  mono muted (`countLines`), then a labelled Copy button and a Download icon button
  (`IconCopy` swapping to `IconCheck` on `SPRING_SWAP`, `IconDownload`).
- Body: `CodeBlock` as today, in `.code-scroll`.

### Settings panel

The Magnetic Button and Delete Button props panels keep their controls (`Knob` with
`RangeSlider`, `Switch`, `SideTabs`) and their behaviour. Only token clean-up: no
opacity-based text colours (`text-foreground/70` becomes `--text-secondary`, and so
on), matching the rest of the page.

### 404 state

Same shell: the stage with the pill (crumb: Components, `IconChevronRight`, "Not found"). Centred on the
stage: mono muted "404", h2 "Component *not found*", a line "{slug} isn't in the
registry yet.", and the home's brand pill "Browse components" with `IconArrowRight`
linking to `/components`. No dock. Response status stays as today.

## Keyboard

One `keydown` listener on `window`:

| Key | Condition | Action |
|---|---|---|
| `/` | target is not a text field | Open the Components panel with search focused. |
| ArrowLeft / ArrowRight | `document.activeElement` is `body` (nothing focused), no modifier keys, no dock panel open, event not `defaultPrevented` | Previous / next component. |
| Escape | a dock panel is open | Handled by the dock. |
| Escape | no dock panel open, inspector open, focus not in a text field | Close the inspector. |

The focus rule keeps the arrows for whatever has focus: the live component (Menu Dock
and Date Range Picker use them), the Settings sliders, the search field, the inspector
tabs. Clicking empty stage space or loading the page leaves `body` focused, so the
arrows navigate. The page does not scroll, so there is nothing to conflict with there.

The `s` shortcut and the left-edge hover-to-open go away with the sidebar.

## Motion

All from `devignerui/motion`:

- `SPRING_LAYOUT`: stage column width, pill and dock re-centring, tab pill.
- `SPRING_PANEL`: inspector slide, Code drawer height.
- `SPRING_SWAP`: copy check, `DockGlyph` active background (as today).
- `EASE_OUT`: tooltip fade, reset spin (as today).
- Under reduced motion, layout and panel transitions are instant; the theme icon's own
  CSS already respects it.

## Accessibility

- Landmarks: breadcrumb `nav`, `main` wrapping the stage column, `aside` for the
  inspector.
- Dock items keep `aria-label` via `label`; prev / next labels name the target.
- Tabs follow the WAI-ARIA tabs pattern.
- The Components panel's search input has a visible placeholder and an `aria-label`;
  the current row is `aria-current="page"`.
- Focus is not trapped by the inspector on desktop; on phones the sheet covers the
  stage but the dock stays reachable to close it.

## Code structure

- `app/components/[slug]/page.tsx` becomes a **server component**. It reads
  `getCatalog()` and the one registry entry for the slug, and renders the client
  `ComponentPage` with `entries` (catalog metadata, no source) and `meta` (this
  component's `ComponentData`). The client no longer imports the whole registry, so
  every other component's source leaves the page's bundle.
- `components/detail/component-page.tsx` (client): the shell, state, keyboard listener,
  pill, stage, dock items, Components panel, Code drawer, tooltip, 404 state.
- `components/detail/inspector.tsx` (client): header, tabs, the four tab panels.
- `components/detail/playgrounds.tsx` (client): the Magnetic Button and Delete Button
  playgrounds, their knobs and usage builders, the Chart Card, Timeline, Date Range
  Picker and Menu Dock previews. Moved from `page.tsx` without behaviour changes.
- `lib/catalog-query.ts`: gains `groupByCategory` (moved from `hero-window.tsx`, which
  now imports it) and `neighbors(list, slug)` returning `{ prev, next }` with wrap
  around.
- `components/theme-provider.tsx`: export `ThemeIcon`.

## Removed

- `DocSidebar`, `SidebarBlur`, `SidebarItem`, `SidebarToggle`, `BrandMark`, the old
  breadcrumb row and its inline chevron SVG.
- `components/sidebar-toggle-icon.tsx` (only this page used it).
- The page's local `icon` SVG set and `Icon` component (replaced by
  `@devigner-ui/icons`).
- Dead code in the current page: `npmDeps` and `CUSTOM_COMPOSITION_USAGE` are defined
  but never used.
- The grain overlay on this page.

## Testing

- `scripts/catalog.check.mts` gains asserts for `groupByCategory` (group order, order
  inside groups) and `neighbors` (middle, first wraps to last, last wraps to first,
  single entry returns itself both ways). Runs under `pnpm test`.
- `pnpm lint` and `next build` pass (static params unchanged).
- Visual check with `scripts/shot.mjs` against the dev server, light and dark, at
  1440x900 and 390x844: default, Docs open, Components panel open, Code drawer open,
  and the 404 state.
- Manual keyboard pass: `/` opens and focuses search; arrows navigate only with nothing
  focused; arrows inside Menu Dock, Date Range Picker, the sliders and the tabs still
  drive those controls.
- `git grep -n -P "\x{2014}"` returns nothing.

## Out of scope

- Home, `/components`, the landing sections and the footer.
- New previews for components that don't have one.
- Changing `MenuDock` itself (no dividers are added; the tooltip lives in the page).
- A real 404 status for unknown slugs.
