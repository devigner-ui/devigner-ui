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

## IMPORTANT

- Always use skills from `.agents/skills/*`.
- ALWAYS ASK CLARIFYING QUESTIONS IF ANY INSTRUCTIONS ARE UNCLEAR. NEVER ASSUME ANYTHING.
- IF YOU THINK ORIGINAL INSTRUCTIONS ARE INCOMPLETE OR INCORRECT, **DO NOT** GUESS. **ALWAYS ASK FOR CLARIFICATION** BEFORE PROCEEDING.
- IF ORIGINAL INSTRUCTIONS ARE AMBIGUOUS OR OPEN TO MULTIPLE INTERPRETATIONS, **ALWAYS ASK FOR CLARIFICATION** BEFORE PROCEEDING.
