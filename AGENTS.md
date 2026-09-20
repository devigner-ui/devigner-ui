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

- **JS/TSX (motion/react):** import from `@devignerui/ui/lib/easing`
  (source: `packages/ui/src/lib/easing.ts`) and pick by purpose:
  - `SPRING_PRESS` - press/hover feedback on buttons and tappable surfaces
  - `SPRING_SWAP` - label/icon slots trading places inside a control
  - `SPRING_PANEL` - overlay panel entrances (modals, sheets, drawers)
  - `SPRING_LAYOUT` - shared-layout glides (pills, indicators, panels morphing)
  - `SPRING_MOUSE` - cursor-follow physics (magnetic, tilt, dock)
  - `SPRING_GOO` - liquid/viscous entrances (the notch droplet)
  - `SPRING_RETRACT` - over-damped exits that must not bounce
  - `EASE_OUT` / `EASE_IN_OUT` / `EASE_DRAWER` - tween easings; `EASE_OUT_CSS` for inline styles
- **CSS/Tailwind:** use the theme utilities `ease-out`, `ease-in-out`, `ease-drawer`
  (defined as `--ease-*` in both `globals.css` files). Never `ease-[cubic-bezier(...)]`.
- New curves/springs require adding a token to `animations.ts` (and `--ease-*` CSS vars if
  used from CSS) first - keep both in sync. No one-off values in components.

## IMPORTANT

- Always use skills from `.agents/skills/*`.
- ALWAYS ASK CLARIFYING QUESTIONS IF ANY INSTRUCTIONS ARE UNCLEAR. NEVER ASSUME ANYTHING.
- IF YOU THINK ORIGINAL INSTRUCTIONS ARE INCOMPLETE OR INCORRECT, **DO NOT** GUESS. **ALWAYS ASK FOR CLARIFICATION** BEFORE PROCEEDING.
- IF ORIGINAL INSTRUCTIONS ARE AMBIGUOUS OR OPEN TO MULTIPLE INTERPRETATIONS, **ALWAYS ASK FOR CLARIFICATION** BEFORE PROCEEDING.
