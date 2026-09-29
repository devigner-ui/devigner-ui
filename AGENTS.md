## Punctuation (HARD RULE)

Never write an em dash (U+2014) anywhere: not in code, comments, JSX or MDX text, CSS
comments, docs, commit messages, PR descriptions, or chat replies. No exceptions.
Use a comma, a period, parentheses, or a plain hyphen `-` instead.
Verify before committing: `git grep -n -P "\x{2014}"` must return nothing.

## Communication Style

Do not narrate what you are about to do before doing it. Do not announce each step,
file edit, or command before executing it. Do not use phrases like "Now I'll...",
"Let me...", "I'll now...", or "Next, I will...".

Just do the work silently and efficiently.

When fully done, write a single 4-5 sentence paragraph summarizing:

- What was built or changed
- Any key decisions made
- Any issues encountered and how they were resolved
- Current state of the project

Never break this into bullet points or step-by-step logs until explicitly asked. One clean paragraph only.

## Motion & Easing (STRICT)

All animation easing/physics MUST come from the shared motion tokens - never write inline
cubic-beziers, ad-hoc spring configs, or default easings (`ease-in`, `ease-out`, `easeOut`
string forms are too weak).

- **JS/TSX (motion/react):** import from `devignerui/motion`
  (source: `packages/ui/src/lib/easing.ts`) and pick by purpose:
  - `SPRING_PRESS` - press/hover feedback on buttons and tappable surfaces
  - `SPRING_SWAP` - label/icon slots trading places inside a control
  - `SPRING_PANEL` - overlay panel entrances (modals, sheets, drawers)
  - `SPRING_LAYOUT` - shared-layout glides (pills, indicators, panels morphing)
  - `SPRING_MOUSE` - cursor-follow physics (magnetic, tilt, dock)
  - `SPRING_GOO` - liquid/viscous entrances (the notch droplet)
  - `SPRING_RETRACT` - over-damped exits that must not bounce
  - `EASE_OUT` / `EASE_IN_OUT` / `EASE_DRAWER` - tween easings; `EASE_OUT_CSS` for inline styles
  - `EASE_OVERSHOOT` - a tween that lands past the target and settles (the theme toggle)
- **CSS/Tailwind:** use the theme utilities `ease-out`, `ease-in-out`, `ease-drawer`,
  `ease-overshoot`
  (defined as `--ease-*` in both `globals.css` files). Never `ease-[cubic-bezier(...)]`.
- New curves/springs require adding a token to `easing.ts` (and `--ease-*` CSS vars if
  used from CSS) first - keep both in sync. No one-off values in components.

## Versioning (HARD RULE)

Never pick, bump, or write a new version number on your own. This covers every
`package.json` `version` field, release commits and tags, changelogs, and publish commands.

Before setting any new version, stop and ask the user, offering exactly 3 options derived
from the actual changes since the last release (check `git log` and the diff first):

- **Patch** (`x.y.Z`) - bug fixes, internal tweaks, no API changes
- **Minor** (`x.Y.0`) - new components, props, or features that stay backward compatible
- **Major** (`X.0.0`) - breaking changes (removed or renamed exports/props, changed defaults)

Show the concrete resulting version for each option (e.g. `1.2.1` / `1.3.0` / `2.0.0`),
mark the one you recommend with a one-line reason tied to the changes, then wait. Only
continue the release work after the user selects a version, and use exactly that version.

## Changelog (HARD RULE)

Release notes are posted to Discord by `scripts/changelog-publish.mts`. Full format and
layout: `docs/changelog.md`. Every entry follows these rules, no exceptions.

**Source of truth**

- Base the entry on the actual diff since the last entry in `changelog/` (or the last
  release tag if there is none): `git log`, `git diff --stat`, the registry. Never on commit
  messages alone; they say "up".
- Every claim must be true in the code. Features come from the component's props in
  `scripts/registry/descriptors.mts` and its guide in `scripts/registry/guides.mts`, and
  anything behavioral is checked in the component source. Never invent or inflate.
- If what counts as the release is unclear (range, what to include), ask first.

**File**

- One file per release: `changelog/YYYY-MM-DD.md`, `-2` for a second one that day. The
  date in the name is the date shown in the post.
- Line 1: `# Title`. Short, about the headline change ("File Upload is here"), never a list
  of everything; the header counts the rest.
- Optional `Version: x.y.z` on line 2, only with a version the user picked (see
  Versioning). Never write one on your own.
- Then an optional one or two sentence intro, then the change lines. No prose after the
  first change line.

**Change lines**

- `- LABEL slug: text` with LABEL one of `NEW`, `UPDATED`, `FIXED`, `REMOVED`. The slug must
  exist in `scripts/registry/descriptors.mts`. Leave the slug out (`- NEW: text`) for
  changes that aren't about one component; those go to "Around the site".
- `text` is one sentence: what it is or what changed, plain and concrete. Markdown links
  are fine, for example to `/request`.
- Every NEW component gets 5 to 10 indented features, each `  - **Name:** detail`: a bold
  name of two or three words, then one short line. Most striking first: the first 5 become
  the card's Highlights, the rest show as chips by name only. Use inline code for props
  (`resumable`, `maxSize`).
- An UPDATED component gets features only when one sentence can't carry the change.
- At most 4 components per post (Discord's 40-part limit). More than that: ask the user
  how to split the release.
- Label order and wording follow the house style: no em dashes, no emoji or text
  symbols in the text (the script adds the icons), no hype words ("amazing",
  "powerful", "seamless").

**Posting: test first, real post only after approval**

Always in this order. Never skip a step, never go back to an earlier one without saying so.

1. **Preview.** Run `pnpm changelog:publish changelog/<file>.md`. Nothing is sent. Fix every
   error it prints and rerun until it is clean.
2. **Test post.** Run `pnpm changelog:test changelog/<file>.md` yourself. It posts to the
   private test channel (`DISCORD_CHANGELOG_TEST_WEBHOOK_URL`) with no role ping and no
   crosspost. Report what it printed, including any warning (missing emojis, avatar),
   and ask the user to check the post in Discord and approve it.
3. **Wait for approval.** Stop here. Only an explicit approval from the user counts
   ("approved", "looks good, post it"). Anything else, including silence, a question or a
   requested change, is not approval: make the change, rerun the preview and the test
   post, and ask again. Every change to the entry needs a fresh test post and a fresh
   approval.
4. **Give the real command.** Once approved, do not run it. Give the user this command to
   run themselves, with the real file name, and remind them to deploy first so every link
   and image is live:

   ```sh
   pnpm changelog:publish changelog/<file>.md --discord
   ```

   It posts to the real changelog channel (`DISCORD_UPDATES_WEBHOOK_URL`), pings the
   Changelog role and crossposts to following servers. It can't be taken back cleanly,
   which is why the user runs it, never the agent.

## OG images (HARD RULE)

Every component page's share image (`apps/docs/app/components/[slug]/opengraph-image.tsx`)
shows a preview of the component, taken from `apps/docs/assets/og/<slug>.png`.

- **Regenerate** whenever a component is added or its look changes: build the docs, run
  them (`pnpm dev`, or `next start` after a build), then `pnpm og:shots [baseUrl]`. A new
  component with no PNG gets an image with no preview, so this is part of shipping it.
- **The component alone, never its box.** The shot is the demo cropped tight on a
  transparent background: no stage frame, no dot field, no card, no NEW badge.
  `scripts/og-shots.mjs` does this; don't go back to screenshotting the stage.
- **Printed on the background, fitted whole.** The OG image draws the shot with `Shot`
  from `apps/docs/lib/og.tsx` straight on the ground (no `Stage` box) and fits it into
  the free area right of the text with `objectFit: "contain"`: never cropped, and scaled
  up when the component is smaller than the area.
- **Check before committing.** Build, open `/components/<slug>/opengraph-image` for the
  new or changed components, and look at each one. Commit only the PNGs of components
  that were added or changed; revert the rest, since the script rewrites every PNG.
- **Discord caches images by URL**, so the changelog script adds `?v=<run>` to every OG
  image link. Keep that, or a post shows whatever Discord fetched before the deploy.

## New components (HARD RULE)

Adding or finishing a component follows `docs/new-component.md` step by step: Part 1
until every box in "The component is final when" is checked and the user agrees, then
Part 2 to publish. Don't skip steps and don't start publishing early.

## IMPORTANT

- Always use skills from `.agents/skills/*`.
- ALWAYS ASK CLARIFYING QUESTIONS IF ANY INSTRUCTIONS ARE UNCLEAR. NEVER ASSUME ANYTHING.
- IF YOU THINK ORIGINAL INSTRUCTIONS ARE INCOMPLETE OR INCORRECT, **DO NOT** GUESS. **ALWAYS ASK FOR CLARIFICATION** BEFORE PROCEEDING.
- IF ORIGINAL INSTRUCTIONS ARE AMBIGUOUS OR OPEN TO MULTIPLE INTERPRETATIONS, **ALWAYS ASK FOR CLARIFICATION** BEFORE PROCEEDING.
