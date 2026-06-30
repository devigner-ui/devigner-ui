# `/docs` shell restyle — design

## Problem

`apps/docs/app/docs/` renders Fumadocs' default neutral theme (`fumadocs-ui/css/neutral.css`),
visually disconnected from the rest of the site's OKLCH token system, Geist fonts, and
component styling used on `/` and `/components`. Search and the theme switch are both
disabled (`RootProvider theme.enabled: false`, `search.enabled: false`), and there's no
nav link back to `/` or `/components` from inside `/docs`.

## Goals

- Make `/docs` look like part of the same product as `/` and `/components`, by reusing
  existing design tokens — not building a parallel theme.
- Restore search and theme switching, wired to what already exists.
- Fix the dead-end navigation between `/docs`, `/components`, and `/`.

## Non-goals

- Writing new MDX content (only intro/installation/theming exist; stays that way).
- Replacing Fumadocs' `DocsLayout` shell with the marketing page's floating pill navbar.
  Keep Fumadocs' sidebar/TOC/top-bar structure (handles responsive/mobile nav for free);
  only restyle it.

## Design

### 1. Token bridge (`apps/docs/app/docs/docs.css`)

Drop the `fumadocs-ui/css/neutral.css` import. Fumadocs' components are styled through
`--color-fd-*` CSS variables (background/foreground/border/primary/secondary/accent/
muted/popover/card/ring — see `fumadocs-ui/css/preset.css`). Map each one to the existing
OKLCH variables already defined in `apps/docs/app/globals.css`:

```css
@theme inline {
  --color-fd-background: var(--background);
  --color-fd-foreground: var(--foreground);
  --color-fd-border: var(--border);
  --color-fd-primary: var(--accent);
  --color-fd-primary-foreground: var(--accent-foreground);
  --color-fd-muted: var(--surface);
  --color-fd-muted-foreground: var(--text-tertiary);
  --color-fd-secondary: var(--surface-hover);
  --color-fd-secondary-foreground: var(--text-primary);
  --color-fd-accent: var(--surface-hover);
  --color-fd-accent-foreground: var(--text-primary);
  --color-fd-card: var(--surface);
  --color-fd-card-foreground: var(--text-primary);
  --color-fd-popover: var(--surface);
  --color-fd-popover-foreground: var(--text-primary);
  --color-fd-ring: var(--accent);
}
```

Also mirror the `--radius-*` and `--font-sans`/`--font-mono` definitions from
`globals.css` into this file's `@theme` block — `docs.css` is its own isolated Tailwind
v4 compilation root (per the existing comment at the top of the file), so it doesn't
inherit `@theme` rules from `globals.css` automatically.

No second dark-mode system: both stylesheets key off the same `.dark` class that
`components/theme-provider.tsx`'s `ThemeProvider` already toggles on `<html>`, so this
keeps working without touching `RootProvider`'s `theme.enabled: false`.

### 2. Search (`apps/docs/app/docs/layout.tsx` + new route)

- Add `apps/docs/app/api/search/route.ts`:
  ```ts
  import { source } from "@/lib/source";
  import { createFromSource } from "fumadocs-core/search/server";

  export const { GET } = createFromSource(source);
  ```
  Standard Fumadocs static search (Orama, no external service).
- Flip `search={{ enabled: true }}` on `RootProvider` and `searchToggle={{ enabled: true }}`
  on `DocsLayout`. The dialog inherits the token bridge from step 1 automatically.

### 3. Theme toggle + nav links (`apps/docs/app/docs/layout.tsx`)

- Replace the disabled `themeSwitch` with the existing `ThemeToggle` from
  `components/theme-provider.tsx`, passed into `DocsLayout`'s `nav.children` slot.
- Add `links` entries (or additional `nav.children`) pointing at `/` and `/components`,
  so `/docs` is no longer a dead end.

### 4. Content area polish (`apps/docs/app/docs/[[...slug]]/page.tsx`, `docs.css`)

Keep Fumadocs' own `pre`/code MDX rendering — it's already server-rendered via Shiki at
build time with a copy button built in, which is the right tool for static MDX (the
client-side `components/code-block.tsx` exists for the *dynamic* snippets on
`/components` and isn't a fit here). Only adjust `DocsBody` prose width/spacing in
`docs.css` to match the rhythm used on `/` and `/components`.

## Files touched

- `apps/docs/app/docs/docs.css` — token bridge, radius/font mirroring, prose spacing
- `apps/docs/app/docs/layout.tsx` — enable search/theme nav, add cross-site nav links
- `apps/docs/app/api/search/route.ts` — new, Fumadocs static search endpoint

## Risks

- Tailwind v4's per-file compilation roots mean any token mirrored into `docs.css` must
  be kept in sync manually with `globals.css` if the base palette changes later. Small
  surface area (under a dozen variables), acceptable.
