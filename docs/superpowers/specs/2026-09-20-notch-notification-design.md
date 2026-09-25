# Notch - Gooey Top-Center Notification System - Design

**Date:** 2026-09-20
**Target package:** `devignerui`
**New files:** `packages/ui/src/components/notch.tsx`,
`packages/ui/src/lib/notch-store.ts`, `packages/ui/src/lib/notch-queue.ts`,
`scripts/notch-queue.check.mts`
**Touched:** `packages/ui/src/lib/easing.ts`, `packages/ui/src/index.ts`,
`apps/docs/lib/registry.ts`, `package.json`, `AGENTS.md`
**Reference technique:** Lucas Bebber's CSS/SVG "gooey" metaball filter

## Goal

A notification system whose surface descends from the top edge of the viewport
as a liquid droplet - the notification appears to be squeezed *through* the
edge, with a stretching neck that thins and snaps. Sonner-compatible API,
one notch at a time that morphs in place rather than stacking, expandable on
hover/click, with a full loading -> success/error lifecycle that happens
without the notch ever leaving.

## Scope decisions (locked)

- **Full system**, not just a surface. `toast()` / `<Toaster />`, queue,
  timers, promise lifecycle.
- **Real SVG goo filter**, two layers. Not a squash/stretch approximation.
- **Morph in place** on a second notification. Never stacks, never queues
  behind. A counter appears; expanding reveals the list.
- **Overlays whatever is beneath it.** This is a library component - consumers
  own their own page layout and any fixed-header collision is theirs.
- **Sonner-compatible API** (`toast`, `toast.success/error/loading/promise/
  dismiss`, `<Toaster />`) so existing call sites port by changing the import.
- **Structured content + `content` escape hatch**, mirroring how `MenuDock`
  treats its content levels.
- **Promise lifecycle in v1.** The in-place state morph is the showpiece.

---

## 1. The goo technique

Two filter nodes. Blur the group, then crush the alpha channel's contrast so
the blurred halos of two nearby shapes fuse into a single solid form.

```svg
<filter id="notch-goo" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
  <feColorMatrix in="blur" mode="matrix" result="goo"
    values="1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            0 0 0 18 -7" />
</filter>
```

The alpha row computes `newAlpha = 18·A − 7`, a hard cutoff at `A ≈ 0.39`.

### Three non-obvious requirements

**1. The bridge snap is not animated.** The only thing that animates is the
droplet's `y`. Two shapes fuse while their blur halos overlap above the 0.39
threshold and separate the instant they do not. The neck stretching, thinning
and snapping falls out of the filter math for free. Do not attempt to
choreograph it - a hand-animated neck is exactly what makes a fake goo read as
fake.

**2. Omit the `feBlend`.** Published versions of this filter end with
`<feBlend in="SourceGraphic" in2="goo"/>` to keep inner content crisp. That
node must **not** be used here. The filtered layer contains no content - text
lives on a separate unfiltered layer - so `feBlend` only re-composites the
sharp un-gooed silhouette on top of the liquid one and cancels the effect.

**3. The filter region must be declared.** `<filter>` defaults to a
`-10% / +10%` region around the bounding box. A stretched bridge exceeds this
and is **clipped mid-neck**. The `x="-50%" y="-50%" width="200%" height="200%"`
attributes above are mandatory, not decorative. This is the most common cause
of a goo effect that looks broken or abruptly cut.

### Why two layers is forced

The filter applies to every descendant of the filtered element. Text inside it
is blurred and then alpha-crushed into unreadable fringed mush. Therefore text
cannot live in the goo layer, and any real gooey notch is two stacked layers.

---

## 2. Layer architecture

```
<Toaster />   fixed inset-x-0 top-0 z-[100] pointer-events-none
│
├─ layer 1 - goo        filter:url(#notch-goo)  aria-hidden  pointer-events-none
│   ├─ anchor           wide lozenge parked at top:-24px
│   ├─ border blob      inset -1px, fill var(--border)
│   └─ fill blob        fill var(--background)
│
└─ layer 2 - content    no filter, pointer-events-auto
    icon · title · description · action
```

### The anchor

A wide, short lozenge (≈120 × 40, fully rounded) positioned at `top: -24px` -
above the viewport edge, so it is never itself visible. It exists solely to be
the second shape the droplet bridges to. Without it there is nothing to fuse
with and the droplet simply fades in.

### The border is a blob, not a border

A CSS `border` on a gooed element is blurred into the fill and disappears.
Instead the goo layer renders **two** blobs: a border-coloured one inset by
`-1px`, behind a background-coloured one. Both are gooed, so the bridge gets an
outline that stretches and thins with the liquid. This is most of why the
result reads as a physical droplet rather than a spreading stain.

Paint order matters: border blob first, fill blob second.

### Layer 2 alignment

The content layer is a sibling of the goo layer, not a child - `filter` creates
a containing block, so a `position: fixed` descendant of a filtered element
positions against the filtered element rather than the viewport. Both layers
are children of the fixed wrapper.

---

## 3. Keeping the blob under the text

The blob has no content, so nothing sizes it, yet it must match a pill sized by
its own text through an entrance, a status morph and a user expand.

**Decision: one motion value for position, ResizeObserver for size.**

- **Position.** Blob `y` and content `y` read from a *single* `useSpring`
  motion value, consumed by both elements. They cannot drift, because there is
  only one number.
- **Size.** A `ResizeObserver` on the content element writes width/height into
  the blob. Both sides then animate toward that target with `SPRING_LAYOUT`.
  The spring absorbs the one-frame measurement lag: both elements are springing
  toward the same target rather than snapping to raw measurements, so a frame
  of staleness is invisible.
- **First frame.** The blob may exist for one frame at a stale size before the
  first `ResizeObserver` callback. This lands inside the entrance animation,
  where the blob is a flat lozenge merged into the anchor and nothing is
  settled yet, so it is not observable.

### Rejected alternative: the hidden twin

Rendering the same children into the goo layer under `[&_*]:invisible` would
size the blob identically with zero measurement and zero lag, since
`visibility: hidden` elements still contribute to layout. It is more elegant
for the structured path.

It was rejected because it breaks on the `content` ReactNode escape hatch:
duplicating an arbitrary subtree runs its effects twice, duplicates its form
state, and collides its refs. One mechanism that always works is preferable to
two mechanisms where the elegant one has a trapdoor.

---

## 4. Motion specification

New tokens in `packages/ui/src/lib/easing.ts`, following the existing
commented-token convention in that file:

```ts
/** The droplet's descent. Heavy on purpose - `mass` is what reads as liquid.
 *  SPRING_PANEL (mass 0.5) is too eager here and lands as a card, not a drop. */
export const SPRING_GOO = {
  type: "spring", stiffness: 260, damping: 26, mass: 1.1,
} as const;

/** Retracting into the anchor. Over-damped: a bounce on the way out reads as
 *  indecision, and the exit is not worth watching. */
export const SPRING_RETRACT = {
  type: "spring", stiffness: 300, damping: 34,
} as const;
```

| Moment | Values | Rationale |
|---|---|---|
| Descend | `SPRING_GOO` | mass is the liquid |
| Travel | `y: -8 → 16` | Short deliberately. The bridge carries the effect; extra distance only adds latency |
| Viscosity | `σ: 8`, alpha `18 / -7` | Higher σ = longer, lazier neck. Exposed as `viscosity` prop, 0-10, mapping to σ 4-14 |
| Status morph | `SPRING_LAYOUT` + 0.2s colour crossfade | Existing token; same morph `MenuDock` uses pill→panel |
| Icon swap | `SPRING_SWAP` | Direct reuse of `MenuDock`'s `Glyph` component pattern - spinner→check is exactly that |
| Expand | `SPRING_LAYOUT`, animated `borderRadius` | Runs only once the entrance has settled, so goo and morph never overlap |
| Retract | `SPRING_RETRACT` | Rises back into the anchor and re-merges - reads as being swallowed |
| Reduced motion | No filter mounted at all; opacity + 2px translate, 0.15s | A full-width SVG filter re-rasterizing every frame is precisely what that setting exists to prevent |

### Entrance choreography

1. Droplet mounts at `y: -8`, fully overlapped with the anchor - one merged
   shape, nothing legible yet.
2. Content layer opacity is 0 until `y > 8`. Text riding the merged blob would
   be text floating in a puddle.
3. Droplet springs to `y: 16`. Somewhere around `y ≈ 10-14` the halos fall
   below threshold and the neck snaps. Emergent, not scheduled.
4. Content fades in over the settled droplet.

### Exit choreography

Reverse, with `SPRING_RETRACT`. Content fades first, then the droplet rises and
re-merges with the anchor before unmounting.

---

## 5. Store

Split in two, following the `menu-path.ts` / `menu-dock.tsx` precedent already
in this package: the pure logic lives apart from the component so it stays
pure, and runnable.

### `packages/ui/src/lib/notch-queue.ts` - React-free

Every state transition as a pure function over an immutable list. Imports
nothing, so `scripts/notch-queue.check.mts` can execute it under plain Node
with `node:assert/strict`, exactly as `menu-path.check.mts` does for the dock.

Content fields are typed `unknown` here, not `React.ReactNode`, for the same
reason `MenuNode.content` is: the queue only ever moves them around, never
inspects them, and typing them as React would drag React into the module.

```ts
export type NotchStatus =
  | "default" | "success" | "error" | "warning" | "loading";

export interface NotchRecord {
  id: string;
  status: NotchStatus;
  title?: unknown;
  description?: unknown;
  icon?: unknown;
  content?: unknown;              // escape hatch; wins over the structured slots
  action?: { label: string; onClick: () => void };
  cancel?: { label: string; onClick?: () => void };
  duration: number;               // Infinity pins it
  createdAt: number;
}

export function addNotch(list: NotchRecord[], record: NotchRecord): NotchRecord[];
export function updateNotch(
  list: NotchRecord[], id: string, patch: Partial<NotchRecord>,
): NotchRecord[];
export function dismissNotch(list: NotchRecord[], id?: string): NotchRecord[];
/** ms left before `id` expires, given elapsed run time. Infinity never expires. */
export function remainingMs(record: NotchRecord, elapsed: number): number;
```

### `packages/ui/src/lib/notch-store.ts` - React binding

A module-level array, `useSyncExternalStore`, the timer scheduling, and the
`toast()` API surface. No context and no provider: `useSyncExternalStore` is
React's own primitive for this and is what allows `toast()` to be imported and
called from anywhere, including outside a React tree. `<Toaster />` subscribes;
it does not own the state.

### Morph-in-place semantics

The store holds a list ordered **newest first** - a new notification is
unshifted, not pushed. The notch renders `list[0]`, which is therefore always
the most recent, and shows a counter when `list.length > 1`. Expanding renders
the list in that same newest-first order. A new notification while one is showing
**replaces the rendered content without retracting** - the surface morphs via
`SPRING_LAYOUT` and the goo entrance does not replay. Expanding the notch
renders the full list.

`toast.promise` mutates an existing record in place by id rather than
dismissing and creating, which is what keeps the loading→success change a morph
instead of an exit plus an entrance.

---

## 6. Public API

```tsx
import { toast, Toaster } from "devignerui";

toast.success("Deployed");
toast.error("Build failed", { description: "3 type errors" });
toast.loading("Deploying…");
toast.promise(deploy(), {
  loading: "Deploying…", success: "Live", error: "Failed",
});
toast({
  title: "Saved",
  description: "3 files · 1.2 MB",
  action: { label: "Undo", onClick: undo },
});
toast({ content: <Whatever /> });
toast.dismiss(id);          // omit id to dismiss all

<Toaster viscosity={5} duration={4000} expand />
```

### `<Toaster />` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `viscosity` | `number` | `5` | 0-10, maps to blur σ 4-14. Higher = longer, lazier neck |
| `duration` | `number` | `4000` | Default auto-dismiss, ms. `Infinity` pins |
| `expand` | `boolean` | `false` | Whether the notch expands on hover. Click-to-expand is always on |
| `offset` | `number` | `0` | Extra px from the top edge, for consumers with fixed headers |
| `hotkey` | `string[]` | `["altKey","KeyT"]` | Moves focus into the notch |
| `className` | `string` | - | Classes for the content surface |

### Deliberate deltas from Sonner - document these

- **No `position`.** A notch has one origin. Accepting `position="bottom-right"`
  would be a lie about what the component is.
- **No `richColors`.** Status colour is intrinsic here, not opt-in.
- **No `visibleToasts`.** Replaced by morph-in-place plus the counter.
- **`expand` means hover-to-expand**, not Sonner's expand-the-stack. There is
  no stack.

---

## 7. Accessibility

Non-negotiable; none of this is simplified away.

- **Live region is mounted empty and permanently** by `<Toaster />`, with
  notifications written *into* it. A live region that mounts together with its
  content is not announced by screen readers. This is the single most common
  toast accessibility bug.
- `role="status"` / `aria-live="polite"` for `default`, `success`, `loading`,
  `warning`. `role="alert"` / `aria-live="assertive"` for `error` **only** -
  assertive interrupts, and interrupting for a success message is hostile.
- The entire goo layer is `aria-hidden="true"` and `pointer-events-none`. It is
  decoration and must not be reachable or announced.
- **Never steals focus.** Focus moves into the notch only via the `hotkey`.
- **Timers pause on hover and on window blur.** Without the blur case a
  notification expires while the user is in another tab and is never seen.
- Expandable notch: `aria-expanded` on the trigger, `Escape` collapses, focus
  stays where it was.
- Action buttons are real `<button>`s in the content layer with visible
  `focus-visible` rings, matching the `focus-visible:ring-2
  focus-visible:ring-accent/60` pattern used in `MenuDock`.

---

## 8. Known costs

Accepted, and to be documented in the component's docs entry.

- **Opaque fills only.** The merge *is* alpha compositing. A translucent notch
  cannot bridge, and `backdrop-filter` does not survive `filter` on the same
  subtree. Glassmorphism and this effect are mutually exclusive.
- **`filter` creates a stacking context and a containing block.** Hence the
  fixed wrapper outside the filtered element (§2).
- **Safari rasterizes SVG filters on the CPU** at larger sizes. Keeping the
  filter region around 400×200 keeps this acceptable, but it is the thing to
  watch if the notch is ever made wider.
- **Real per-frame blur cost** during entrance and exit - roughly 500ms per
  notification, not continuous.

---

## 9. Out of scope for v1

Each is a clean later addition; none changes the architecture above.

- Swipe / drag-to-dismiss
- Custom positions
- Theming beyond the existing CSS custom properties in `globals.css`
- Toast history or a notification centre
- Multiple simultaneous notches

---

## 10. Testing

No test framework is used. The repo's convention is a `node:assert/strict`
self-check under Node's own type stripping, run from the root `test` script -
see `scripts/menu-path.check.mts`. The notch follows it.

- **`scripts/notch-queue.check.mts`** - add, update, dismiss one, dismiss all,
  newest-first ordering, counter arithmetic, `remainingMs` including the
  `Infinity` case. Pure functions, no DOM, no framework.
- **Root `test` script** - extended to run both check scripts, so neither can
  rot unnoticed.
- **Visual** - the bridge snap is not unit-testable. Verify against the docs
  preview with `scripts/shot.mjs` at `viscosity` 0, 5 and 10, in both themes,
  and by hand in Safari.

## 11. Docs registry entry

Add a `notch` entry to `apps/docs/lib/registry.ts` following the convention
stated in that file's header comment: a curated standalone copy-paste source
distinct from the internal package source (different import paths, inlined
tokens, no workspace dependencies), installing as `components/ui/notch.tsx`.

The copy-paste version must inline `SPRING_GOO` and `SPRING_RETRACT` rather
than importing from `../lib/easing`, and must carry the `<filter>` markup
inline so a single file is genuinely self-contained.
