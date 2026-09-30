# Adding a component

The full path from an empty file to a released component, for AI agents and
people alike. Work through it in order. Part 1 ends with a component that is
**final**; only then move to Part 2, publishing. Every rule in `AGENTS.md`
(no em dashes, motion tokens, icons, versioning, changelog, OG images) applies
throughout, and this guide never overrides it.

If anything here is unclear or looks wrong for the component at hand, stop and
ask the user. Don't guess.

---

## Part 1: Finalize the component

### 1. Agree on what it is

Before writing code, confirm with the user:

- **Slug** (kebab-case, e.g. `goo-switch`) and **name** ("Goo Switch").
- **Category**: one key from `COMPONENT_CATEGORIES` in
  `packages/shared/src/constants.ts`. A new category is added there first,
  never invented in a descriptor.
- **Community request?** If it answers a Discord request, get the post link
  (see step 9).

### 2. Write the source

`packages/ui/src/components/<slug>.tsx`, one file.

- `forwardRef`, `displayName` set, props interface exported as `<Name>Props`,
  `className` merged last with `cn()`.
- Colors from theme tokens only. No hardcoded colors, and nothing that needs a
  `dark:` class to look right.
- Easing and springs from `packages/ui/src/lib/easing.ts` only (see "Motion &
  Easing" in `AGENTS.md`). A new curve is added there first.
- Icons are `@devigner-ui/icons` components, never text symbols.
- Reduced motion through `useReducedMotionPreference` from
  `lib/hooks/use-reduced-motion`, never Motion's `useReducedMotion` alone, so
  both the OS setting and `<MotionConfig reducedMotion="always">` keep it still.
- Real semantic elements (never `<div onClick>`), visible focus, full keyboard
  use, state exposed through ARIA (`aria-checked`, `aria-pressed`), never color
  alone.

Export it from `packages/ui/src/index.ts` together with its Props type.

### 3. Describe it in the registry

Add an entry to `scripts/registry/descriptors.mts`. This is the source of
truth: `apps/docs/lib/registry.ts` is generated from it and is never edited by
hand.

Required: `slug`, `name`, `description` (one plain sentence), `addedAt`
(today, `YYYY-MM-DD`), `since` (the release it ships in, `x.y.z`; ask the user, never
pick it), `category`, `variants`, `sourceFile`, `dependencies`,
`transformations`, `props`, `examples.standard`, `examples.custom`. Optional:
`tryIt` (the stage hint, "drag the thumb past the end"), `stageAlign` (`"end"`
for panels that open upward).

**Props feed the AI prompt** on the component page (the Prompt panel, key `P`),
which walks a user through every prop one question at a time. Write them so
that walk-through reads well:

- One row per public prop: `[name, type, default, description]`.
- Spell out choices in the type: `'"sm" | "md" | "lg"'` or `"boolean"`. The
  prompt lists the other options only for those. A named alias (`Size`) shows
  up as "any `Size`", which tells a beginner nothing.
- A real `default` wherever there is one (`"md"`, `"false"`, `"4"`). Use `"-"`
  only when there is truly none; the prompt shows it as "none".
- A description a beginner can follow, with units and ranges where they
  matter ("Track height: 24, 32 or 40px.").

### 4. Write its guide

Add an entry to `scripts/registry/guides.mts`. It fills the page's Guide tab,
`llms-full.txt`, and the AI prompt ("Good for" and "Pick something else when"
come from `whenToUse` and `whenNotToUse`). Every line must be true in the
source.

- `demo`: what the live demo shows, one or two sentences.
- `whenToUse`, `whenNotToUse`: concrete cases, not slogans.
- `keyboard`, `accessibility`, `theming`, `edgeCases`.
- `recipes`: complete, importable modules. They are type-checked.
- `troubleshooting`: real questions with answers; reuse the shared ones at the
  top of the file (`TOKENS_MISSING` and friends) where they fit.

### 5. Generate and validate

```sh
pnpm registry:generate
pnpm registry:ci        # in sync, props match the source, recipes compile
```

Fix every error before going on.

### 6. Add the demo and the playground

- `apps/docs/demos/<slug>.tsx`: the small demo on the catalog grid, importing
  from `devignerui`. Register it in `apps/docs/demos/index.ts` (the map is
  typed against the slugs, so a missing demo fails the build).
- The live preview on the details page: add a branch for the slug in
  `usePlayground` in `apps/docs/components/detail/playgrounds.tsx`. Give it a
  Settings panel when it has props worth tuning, a Usage snippet that follows
  the knobs, and add its defaults to `reset`.

### 7. Check it in the browser

Run `pnpm dev` and open `/components/<slug>`.

- The preview works with mouse, touch and keyboard.
- Both themes look right (dock theme button or `T`).
- Reduced motion: it keeps still with the OS setting on.
- Docs panel (`D`): Install, Usage, Props and Guide tabs are all correct.
- Code drawer (`C`): the source is the installed file.
- **Prompt panel (`P`)**: read the whole prompt. Every prop has a sensible
  Default pill and options, "Good for" and "Pick something else" are filled
  in, and the install commands list the right dependencies. Fix the
  descriptor or guide, not the prompt builder, when something reads wrong.
- The catalog (`/components`) shows it in the right category, tagged New.

### 8. Make its share image

See "OG images" in `AGENTS.md`. With the docs running:

```sh
pnpm og:shots
```

Open `/components/<slug>/opengraph-image` and look at it. Commit only the new
PNG in `apps/docs/assets/og/`; revert the others the script rewrote.

### 9. Credit the request (if any)

```sh
pnpm request:publish <slug> <discord post link>
```

Sets `requestId` and regenerates the registry. See
`docs/component-requests.md`.

### 10. Pass the gate

All from the repo root, all must pass:

```sh
pnpm registry:ci
pnpm test
pnpm lint
pnpm build
pnpm --dir packages/ui test
pnpm --dir packages/ui test:package
git grep -n -P "\x{2014}" -- ':!apps/docs/AGENTS.md' ':!.agents' ':!.claude'
```

The last line must print nothing.

### The component is final when

- [ ] Source follows step 2 and is exported from `packages/ui/src/index.ts`
- [ ] Descriptor complete, props written for the prompt (step 3)
- [ ] Guide complete and true (step 4)
- [ ] `pnpm registry:ci` passes
- [ ] Demo registered and playground wired
- [ ] Checked in both themes, with reduced motion, by keyboard
- [ ] Prompt panel reads correctly
- [ ] OG image generated and checked
- [ ] Request credited, if it came from one
- [ ] Every command in step 10 passes
- [ ] The user has seen it and agrees it is done

Show the user the page and this list. Continue to Part 2 only after they
confirm.

---

## Part 2: Publish

Full details, including first-time setup, are in `docs/PUBLISHING.md`. The
release steps for a new component:

### 11. Commit and merge

Commit on a branch, open a PR into `main`, and merge it. The PR states the
slug, the category and a one-line design rationale. Only commit or push when
the user asks.

### 12. Pick the version

Never choose it yourself. Follow "Versioning" in `AGENTS.md`: check
`git log` and the diff since the last release, then offer the user patch,
minor and major with the resulting numbers. A new component is normally a
**minor**. Wait for their choice.

### 13. Deploy the site

The site deploys from `main` on Vercel. Confirm the deploy finished and that
`/components/<slug>` and its OG image load on the live domain before anything
links to them.

### 14. Publish the npm package

The CLI carries its own copy of the registry, so `npx devignerui add <slug>`
only works after a new publish. With the version the user picked:

```sh
cd packages/ui
npm version <picked version> --no-git-tag-version
pnpm build
npm pack --dry-run      # only dist/, includes cli.js and registry.json
npm publish
```

Check it from an empty folder: `npx devignerui@latest add <slug>`. Commit the
version bump and tag it (`git tag v<version> && git push --tags`). Publishing
to npm can't be undone, so give the user these commands to run unless they
ask you to run them.

### 15. Announce it

Follow "Changelog" in `AGENTS.md` exactly: write `changelog/YYYY-MM-DD.md`
from the real diff (a `NEW` line with 5 to 10 features taken from the
descriptor and guide), preview it, send the test post, and wait for explicit
approval. Then give the user the real post command; never run it yourself.

### 16. Search

Re-submit the sitemap in Search Console (see `docs/PUBLISHING.md`, section 4).
