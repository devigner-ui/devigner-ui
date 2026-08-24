# Lighthouse — captured at Phase 2 exit

Lighthouse 13.4.1, desktop preset, headless Chrome, against `next start`
(production build) on `localhost:3000`. Commit `3486ac0`.

## Scores

| Route | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/` | **100** | **100** | **100** | **100** |
| `/components` | **100** | 87 | **100** | **100** |

The landing page hits the target. `/components` is the un-redesigned gallery and
is Phase 3's job.

## How it moved

The first capture, before any fixes, was **96 / 96 / 96 / 100** on `/`.

| Fix | Effect |
|---|---|
| RSC restructure, GSAP removed from three sections, carousel deleted (Tasks 1–6) | Performance 96 → 100 |
| `--text-muted` / `--text-tertiary` raised to WCAG AA in both themes | Accessibility 96 → 100 |
| `app/icon.svg` added, clearing the `/favicon.ico` 404 | Best Practices 96 → 100 |

Bundle over the same span: `/` First Load JS **227 kB → 219 kB**, route payload
**19.9 kB → 11.1 kB**.

## Contrast values, computed not guessed

`--text-muted` was `oklch(46% …)` in dark — **2.81:1**, an AA failure wherever it
appeared. Raising it alone would have made it brighter than `--text-tertiary`,
inverting the hierarchy, so both moved together.

| Token | Theme | Was | Now | Ratio now |
|---|---|---|---|---|
| `--text-tertiary` | light | `54%` | `50%` | 5.34:1 |
| `--text-muted` | light | `64%` | `54%` | 4.51:1 |
| `--text-tertiary` | dark | `56%` | `63%` | ~5.6:1 |
| `--text-muted` | dark | `46%` | `58%` | 4.70:1 |

Ratios were derived by converting OKLCH → sRGB → WCAG relative luminance; the
method reproduced Lighthouse's reported 2.81 exactly, so the new figures are
trustworthy.

## Outstanding for Phase 3 — `/components` accessibility, currently 87

| Audit | What fails |
|---|---|
| `button-name` | Icon-only buttons in the checkbox and switch previews have no accessible name |
| `color-contrast` | `text-text-muted` inside `.shadcn-scope`, which overrides the palette with its own neutrals and so does not inherit the token fix |
| `heading-order` | An `<h4>` appears with no `<h3>` above it |
| `landmark-one-main` | The page has no `<main>` landmark |

The `color-contrast` entry matters for planning: `.shadcn-scope` pins literal
shadcn neutrals, so the AA fix does not reach it. Spec §5.6 already calls for
dropping that scope on the gallery, which resolves this as a side effect.

## Outstanding for Phase 5

`/` is at 100, but two things flattered by local testing will need re-checking on
real hosting:

- **bf-cache** failed on three counts — `cache-control: no-store` on the document
  and on a script request, plus WebSocket usage. Likely `next start` artifacts;
  confirm against the deployed site.
- **`unminified-javascript` / `valid-source-maps`** flagged ~337 KiB. Source maps
  are emitted in the build; verify what the production deploy actually serves.

Also unresolved: a `/components?_rsc=…` prefetch 404 in the console, from
`Link` prefetching the gallery route. It did not cost a point, but it is real.

## Reproducing

```bash
pnpm build
pnpm --filter @devignerui/docs start
CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" \
  npx lighthouse http://localhost:3000 --preset=desktop \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu" --view
```

If a previous server still holds port 3000 it will serve a stale `.next` and
return 500. Free the port first:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force }
```
