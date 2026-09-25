# Notch Notification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a top-center notification system for `devignerui` whose surface descends from the viewport edge as a liquid droplet, with a Sonner-compatible API.

**Architecture:** Two stacked layers inside one fixed wrapper. A filtered SVG-goo layer holds only solid blobs (an off-screen anchor plus the droplet), so an `feGaussianBlur` + `feColorMatrix` alpha crush fuses them into a stretching neck that snaps on its own. An unfiltered content layer carries the text and buttons. Pure queue logic lives React-free in `lib/notch-queue.ts` so it can be tested under plain Node; the React binding, timers and `toast()` API live in `lib/notch-store.ts`.

**Tech Stack:** React 19, `motion` v13 (`motion/react`), Tailwind v4, TypeScript 6, `@devigner-ui/icons`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-20-notch-notification-design.md`

## Global Constraints

Copied verbatim from the repo's `AGENTS.md` and the spec. Every task's requirements implicitly include these.

- **Never write an em dash (U+2014) anywhere** - not in code, comments, JSX text, CSS comments, docs or commit messages. Use a comma, a period, parentheses, or a plain hyphen `-`. Verify before every commit: `git grep -n -P "\x{2014}"` must return nothing.
- **All easing and physics must come from the shared motion tokens** in `packages/ui/src/lib/easing.ts`. Never write inline cubic-beziers, ad-hoc spring configs, or the weak string defaults (`ease-in`, `ease-out`, `easeOut`). A new curve requires adding a token to `easing.ts` first, plus the matching `--ease-*` CSS var if it is used from CSS.
- **In CSS/Tailwind** use the theme utilities `ease-out`, `ease-in-out`, `ease-drawer`. Never `ease-[cubic-bezier(...)]`.
- **No new dependencies.** Everything here is built from React, `motion`, and what the package already has.
- **Comment density matches the surrounding package.** `menu-dock.tsx` and `menu-path.ts` explain *why* a constant has its value, not what the line does. Match that. A magic number with no rationale comment is a review rejection.
- **No test framework.** The repo uses `node:assert/strict` self-check scripts under Node's own type stripping, run from the root `test` script. See `scripts/menu-path.check.mts`.
- **Package is `devignerui`**, source under `packages/ui/src/`. Internal imports are relative (`../lib/easing`); the docs app imports `devignerui/motion`.

---

### Task 1: Pure queue logic

The whole notification state machine as pure functions over an immutable list, with no React and no imports, so it runs under plain Node. This mirrors `packages/ui/src/lib/menu-path.ts`, which is kept apart from `menu-dock.tsx` for exactly this reason.

**Files:**
- Create: `packages/ui/src/lib/notch-queue.ts`
- Create: `scripts/notch-queue.check.mts`
- Modify: `package.json:9` (the `test` script)

**Interfaces:**
- Consumes: nothing. This is the base of the stack.
- Produces:
  ```ts
  export type NotchStatus = "default" | "success" | "error" | "warning" | "loading";
  export interface NotchRecord {
    id: string;
    status: NotchStatus;
    title?: unknown;
    description?: unknown;
    icon?: unknown;
    content?: unknown;
    action?: { label: string; onClick: () => void };
    cancel?: { label: string; onClick?: () => void };
    duration: number;
    createdAt: number;
  }
  export function addNotch(list: NotchRecord[], record: NotchRecord): NotchRecord[];
  export function updateNotch(list: NotchRecord[], id: string, patch: Partial<NotchRecord>): NotchRecord[];
  export function dismissNotch(list: NotchRecord[], id?: string): NotchRecord[];
  export function remainingMs(record: NotchRecord, elapsed: number): number;
  ```

- [ ] **Step 1: Write the failing check script**

Create `scripts/notch-queue.check.mts`:

```ts
// Self-check for the notch queue. No framework: `npm test`, or
// `node scripts/notch-queue.check.mts` - Node strips the types itself.
import assert from "node:assert/strict";
import {
  addNotch,
  updateNotch,
  dismissNotch,
  remainingMs,
  type NotchRecord,
} from "../packages/ui/src/lib/notch-queue.ts";

const rec = (id: string, over: Partial<NotchRecord> = {}): NotchRecord => ({
  id,
  status: "default",
  duration: 4000,
  createdAt: 0,
  ...over,
});

// Newest first: a new notch is unshifted, so the rendered one (index 0) is
// always the most recent. Pushing would render the oldest and silently queue
// the thing that just happened.
const one = addNotch([], rec("a"));
const two = addNotch(one, rec("b"));
assert.deepEqual(
  two.map((n) => n.id),
  ["b", "a"],
);

// Immutable: the input list is never touched, so useSyncExternalStore sees a
// new reference and React actually re-renders.
assert.equal(one.length, 1);
assert.notEqual(one, two);

// Re-adding a live id updates in place and keeps its position. This is what
// makes toast.promise a morph rather than an exit plus an entrance.
const readd = addNotch(two, rec("a", { status: "success", title: "Done" }));
assert.deepEqual(
  readd.map((n) => n.id),
  ["b", "a"],
);
assert.equal(readd[1].status, "success");
assert.equal(readd[1].title, "Done");

// createdAt is reset on re-add, so the refreshed notch gets a full duration
// rather than inheriting a timer that is already half spent.
const reAddLate = addNotch(
  [rec("a", { createdAt: 0 })],
  rec("a", { createdAt: 5000 }),
);
assert.equal(reAddLate[0].createdAt, 5000);

// updateNotch patches without reordering - a loading notch that resolves must
// not jump to the front past notifications that arrived while it ran.
const patched = updateNotch(two, "a", { status: "error" });
assert.deepEqual(
  patched.map((n) => n.id),
  ["b", "a"],
);
assert.equal(patched[1].status, "error");
// An unknown id is a no-op, not a throw: a promise can resolve after its
// notch was dismissed by hand, and that is ordinary, not exceptional.
assert.deepEqual(updateNotch(two, "zzz", { status: "error" }), two);

// dismissNotch with an id removes one; without one, removes all.
assert.deepEqual(
  dismissNotch(two, "b").map((n) => n.id),
  ["a"],
);
assert.deepEqual(dismissNotch(two), []);
assert.deepEqual(dismissNotch(two, "zzz"), two);

// remainingMs counts down from duration, floors at zero, and never expires a
// pinned notch however long it has been up.
assert.equal(remainingMs(rec("a"), 0), 4000);
assert.equal(remainingMs(rec("a"), 1500), 2500);
assert.equal(remainingMs(rec("a"), 9999), 0);
assert.equal(remainingMs(rec("a", { duration: Infinity }), 9999), Infinity);

console.log("notch-queue: ok");
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node scripts/notch-queue.check.mts
```

Expected: FAIL, `ERR_MODULE_NOT_FOUND` for `notch-queue.ts`.

- [ ] **Step 3: Write the implementation**

Create `packages/ui/src/lib/notch-queue.ts`:

```ts
// The notch queue, kept apart from the component so it stays pure - and
// runnable. Every transition is a pure function over an immutable list, so the
// whole state machine is checkable without a DOM, a framework or React.
//
// The list is ordered newest first. The notch renders index 0, so the thing
// that just happened is always the thing on screen; older ones wait behind the
// counter. Push instead of unshift and a burst renders its oldest member.

export type NotchStatus =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "loading";

export interface NotchRecord {
  id: string;
  status: NotchStatus;
  /** Content slots are `unknown`, not React types, for the same reason
   *  MenuNode.content is: the queue only moves them around and never looks
   *  inside, so typing them as React would drag React into this module and
   *  cost it the ability to run under plain Node. */
  title?: unknown;
  description?: unknown;
  icon?: unknown;
  /** Escape hatch. Wins over the structured slots when both are given. */
  content?: unknown;
  action?: { label: string; onClick: () => void };
  cancel?: { label: string; onClick?: () => void };
  /** Infinity pins the notch until something dismisses it by hand. */
  duration: number;
  /** When the current duration started counting. Reset on re-add. */
  createdAt: number;
}

/** Adds a notch, or refreshes one already in the list.
 *
 *  Refreshing keeps the record's position rather than moving it to the front.
 *  A promise notch resolving is not new news arriving, it is old news
 *  finishing, and hoisting it would bury whatever landed while it ran. */
export function addNotch(
  list: NotchRecord[],
  record: NotchRecord,
): NotchRecord[] {
  const at = list.findIndex((n) => n.id === record.id);
  if (at === -1) return [record, ...list];
  const next = list.slice();
  next[at] = record;
  return next;
}

/** Patches one record in place. An unknown id is a no-op rather than a throw:
 *  a promise can settle after its notch was dismissed by hand, which is
 *  ordinary rather than exceptional. */
export function updateNotch(
  list: NotchRecord[],
  id: string,
  patch: Partial<NotchRecord>,
): NotchRecord[] {
  const at = list.findIndex((n) => n.id === id);
  if (at === -1) return list;
  const next = list.slice();
  next[at] = { ...next[at], ...patch };
  return next;
}

/** Removes one notch, or every notch when no id is given. */
export function dismissNotch(
  list: NotchRecord[],
  id?: string,
): NotchRecord[] {
  if (id === undefined) return [];
  return list.some((n) => n.id === id)
    ? list.filter((n) => n.id !== id)
    : list;
}

/** Milliseconds left before this record expires, given how long its timer has
 *  actually been running. Elapsed is passed in rather than read from a clock
 *  so this stays pure - the store owns the clock, and pausing is simply
 *  elapsed not advancing. */
export function remainingMs(record: NotchRecord, elapsed: number): number {
  if (record.duration === Infinity) return Infinity;
  return Math.max(0, record.duration - elapsed);
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
node scripts/notch-queue.check.mts
```

Expected: PASS, prints `notch-queue: ok`.

- [ ] **Step 5: Wire it into the root test script**

In `package.json`, change the `test` script so neither check can rot unnoticed:

```json
"test": "node scripts/menu-path.check.mts && node scripts/notch-queue.check.mts"
```

- [ ] **Step 6: Run the full suite**

```bash
pnpm test
```

Expected: PASS, both scripts print `ok`.

- [ ] **Step 7: Commit**

```bash
git grep -n -P "\x{2014}" -- packages/ui/src/lib/notch-queue.ts scripts/notch-queue.check.mts
git add packages/ui/src/lib/notch-queue.ts scripts/notch-queue.check.mts package.json
git commit -m "feat(ui): pure notch queue with self-check"
```

The `git grep` must print nothing before you commit.

---

### Task 2: Motion tokens, and a stale AGENTS.md path

Two new springs, plus a correction: `AGENTS.md` lines 31-32 still point at `packages/ui/src/lib/animations.ts`, but that file was renamed to `easing.ts` and all eight real importers already use the new path. Fixing it here keeps the constraint block of this plan true.

**Files:**
- Modify: `packages/ui/src/lib/easing.ts` (append after `SPRING_MOUSE`)
- Modify: `AGENTS.md:31-32`

**Interfaces:**
- Consumes: nothing.
- Produces: `SPRING_GOO`, `SPRING_RETRACT`, both `Transition`-compatible const objects importable from `../lib/easing`.

- [ ] **Step 1: Add the tokens**

Append to `packages/ui/src/lib/easing.ts`, directly after the `SPRING_MOUSE` block and before the `fadeIn` variants:

```ts
/** The droplet's descent through the viewport edge. Heavy on purpose: mass is
 *  what reads as liquid. SPRING_PANEL (mass 0.5) is the nearest existing
 *  token and it lands as a card being dealt, not as something with weight
 *  being squeezed through a membrane. */
export const SPRING_GOO = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 1.1,
} as const;

/** Retracting back into the anchor. Over-damped, so it never bounces: an exit
 *  that wobbles reads as indecision, and nobody is watching the way out. */
export const SPRING_RETRACT = {
  type: "spring",
  stiffness: 300,
  damping: 34,
} as const;
```

- [ ] **Step 2: Verify the package still type-checks**

```bash
pnpm --filter devignerui lint
```

Expected: PASS.

- [ ] **Step 3: Correct the stale path in AGENTS.md**

Replace lines 31-32 of `AGENTS.md`:

```markdown
- **JS/TSX (motion/react):** import from `devignerui/motion`
  (source: `packages/ui/src/lib/easing.ts`) and pick by purpose:
```

Then append two bullets to that same list, after the `SPRING_MOUSE` line:

```markdown
  - `SPRING_GOO` - liquid/viscous entrances (the notch droplet)
  - `SPRING_RETRACT` - over-damped exits that must not bounce
```

- [ ] **Step 4: Confirm nothing still references the old path**

```bash
git grep -n "lib/animations"
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git grep -n -P "\x{2014}" -- packages/ui/src/lib/easing.ts AGENTS.md
git add packages/ui/src/lib/easing.ts AGENTS.md
git commit -m "feat(ui): add SPRING_GOO and SPRING_RETRACT tokens"
```

---

### Task 3: React store and the toast API

The module-level array, `useSyncExternalStore`, the timers, and the public `toast()` surface. No provider and no context: this is what lets `toast()` be called from anywhere, including outside a React tree.

**Files:**
- Create: `packages/ui/src/lib/notch-store.ts`

**Interfaces:**
- Consumes: `addNotch`, `updateNotch`, `dismissNotch`, `NotchRecord`, `NotchStatus` from `./notch-queue` (Task 1).
- Produces:
  ```ts
  export interface NotchOptions {
    id?: string;
    description?: React.ReactNode;
    icon?: React.ReactNode;
    content?: React.ReactNode;
    action?: { label: string; onClick: () => void };
    cancel?: { label: string; onClick?: () => void };
    duration?: number;
  }
  export function useNotches(): NotchRecord[];
  export function pauseTimers(): void;
  export function resumeTimers(): void;
  export const toast: {
    (title: React.ReactNode, options?: NotchOptions): string;
    (options: NotchOptions & { title?: React.ReactNode }): string;
    success(title: React.ReactNode, options?: NotchOptions): string;
    error(title: React.ReactNode, options?: NotchOptions): string;
    warning(title: React.ReactNode, options?: NotchOptions): string;
    loading(title: React.ReactNode, options?: NotchOptions): string;
    promise<T>(p: Promise<T>, msgs: {
      loading: React.ReactNode;
      success: React.ReactNode | ((value: T) => React.ReactNode);
      error: React.ReactNode | ((err: unknown) => React.ReactNode);
    }, options?: NotchOptions): Promise<T>;
    dismiss(id?: string): void;
  };
  ```

- [ ] **Step 1: Write the store**

Create `packages/ui/src/lib/notch-store.ts`:

```ts
"use client";

import * as React from "react";
import {
  addNotch,
  dismissNotch,
  remainingMs,
  updateNotch,
  type NotchRecord,
  type NotchStatus,
} from "./notch-queue";

/** Default time on screen. Long enough to read two lines, short enough that a
 *  burst drains rather than queueing up behind the counter. */
const DEFAULT_DURATION = 4000;

/* Module-level state, deliberately. useSyncExternalStore over a plain array is
   React's own primitive for this, and keeping the array outside React is the
   whole reason toast() can be imported and fired from an event handler, a
   router loader, or anywhere else with no provider in scope. */
let list: NotchRecord[] = [];
const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) l();
};

const setList = (next: NotchRecord[]) => {
  if (next === list) return;
  list = next;
  emit();
};

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

const snapshot = () => list;
/* The server snapshot must be a stable reference, not a fresh []. Returning a
   new array each call makes React think the store changed on every render and
   it throws "The result of getServerSnapshot should be cached". */
const EMPTY: NotchRecord[] = [];
const serverSnapshot = () => EMPTY;

export function useNotches(): NotchRecord[] {
  return React.useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/* ─── Timers ─── */

/* One timer per notch, tracked by id. Pausing is not clearTimeout plus a
   guess: the elapsed time is banked so resuming schedules exactly what was
   left, which is what stops a hover from silently granting a full extra
   duration. */
const timers = new Map<
  string,
  { handle: ReturnType<typeof setTimeout>; startedAt: number; elapsed: number }
>();
let paused = false;

function schedule(id: string) {
  const record = list.find((n) => n.id === id);
  if (!record) return;
  const banked = timers.get(id)?.elapsed ?? 0;
  const left = remainingMs(record, banked);
  if (left === Infinity) return;
  const existing = timers.get(id);
  if (existing) clearTimeout(existing.handle);
  timers.set(id, {
    handle: setTimeout(() => remove(id), left),
    startedAt: Date.now(),
    elapsed: banked,
  });
}

function unschedule(id: string) {
  const t = timers.get(id);
  if (!t) return;
  clearTimeout(t.handle);
  timers.delete(id);
}

/** Banks elapsed time on every live timer and stops the clock. Called on
 *  pointer enter and on window blur - without the blur case a notification
 *  expires while the user is in another tab and is never seen at all. */
export function pauseTimers() {
  if (paused) return;
  paused = true;
  for (const [id, t] of timers) {
    clearTimeout(t.handle);
    timers.set(id, { ...t, elapsed: t.elapsed + (Date.now() - t.startedAt) });
  }
}

export function resumeTimers() {
  if (!paused) return;
  paused = false;
  for (const id of timers.keys()) schedule(id);
}

function remove(id: string) {
  unschedule(id);
  setList(dismissNotch(list, id));
}

/* ─── Public API ─── */

let counter = 0;
const nextId = () => `notch-${++counter}`;

export interface NotchOptions {
  id?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** Renders instead of the structured slots. */
  content?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  cancel?: { label: string; onClick?: () => void };
  /** Infinity pins the notch until it is dismissed by hand. */
  duration?: number;
}

function create(
  status: NotchStatus,
  title: React.ReactNode,
  options: NotchOptions = {},
): string {
  const id = options.id ?? nextId();
  const record: NotchRecord = {
    id,
    status,
    title,
    description: options.description,
    icon: options.icon,
    content: options.content,
    action: options.action,
    cancel: options.cancel,
    duration: options.duration ?? DEFAULT_DURATION,
    createdAt: Date.now(),
  };
  setList(addNotch(list, record));
  /* Re-adding a live id refreshes it, so its old timer is stale by definition
     and has to be thrown away rather than left to fire against the new one. */
  unschedule(id);
  if (!paused) schedule(id);
  return id;
}

/** Patches a live notch and restarts its clock. Used by promise settlement,
 *  which must morph the surface rather than replace it - a dismiss plus a
 *  create would retract the droplet and play the whole goo entrance again for
 *  what is really one notification changing its mind. */
function settle(
  id: string,
  status: NotchStatus,
  title: React.ReactNode,
  duration: number,
) {
  if (!list.some((n) => n.id === id)) return;
  setList(
    updateNotch(list, id, { status, title, duration, createdAt: Date.now() }),
  );
  unschedule(id);
  if (!paused) schedule(id);
}

const resolveMessage = <T,>(
  msg: React.ReactNode | ((value: T) => React.ReactNode),
  value: T,
): React.ReactNode =>
  typeof msg === "function"
    ? (msg as (v: T) => React.ReactNode)(value)
    : msg;

function base(
  titleOrOptions: React.ReactNode | (NotchOptions & { title?: React.ReactNode }),
  options?: NotchOptions,
): string {
  // Object-form call: toast({ title, description, action }).
  if (
    titleOrOptions !== null &&
    typeof titleOrOptions === "object" &&
    !React.isValidElement(titleOrOptions) &&
    !Array.isArray(titleOrOptions)
  ) {
    const { title, ...rest } = titleOrOptions as NotchOptions & {
      title?: React.ReactNode;
    };
    return create("default", title, rest);
  }
  return create("default", titleOrOptions as React.ReactNode, options);
}

export const toast = Object.assign(base, {
  success: (t: React.ReactNode, o?: NotchOptions) => create("success", t, o),
  error: (t: React.ReactNode, o?: NotchOptions) => create("error", t, o),
  warning: (t: React.ReactNode, o?: NotchOptions) => create("warning", t, o),
  /** Defaults to pinned: a spinner that vanishes on a timer leaves the user
   *  believing the work was abandoned. */
  loading: (t: React.ReactNode, o?: NotchOptions) =>
    create("loading", t, { duration: Infinity, ...o }),

  promise: <T,>(
    p: Promise<T>,
    msgs: {
      loading: React.ReactNode;
      success: React.ReactNode | ((value: T) => React.ReactNode);
      error: React.ReactNode | ((err: unknown) => React.ReactNode);
    },
    options: NotchOptions = {},
  ): Promise<T> => {
    const duration = options.duration ?? DEFAULT_DURATION;
    const id = create("loading", msgs.loading, {
      ...options,
      duration: Infinity,
    });
    p.then(
      (value) => settle(id, "success", resolveMessage(msgs.success, value), duration),
      (err) => settle(id, "error", resolveMessage(msgs.error, err), duration),
    );
    return p;
  },

  dismiss: (id?: string) => {
    if (id === undefined) {
      for (const key of [...timers.keys()]) unschedule(key);
      setList(dismissNotch(list));
      return;
    }
    remove(id);
  },
});
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter devignerui lint
```

Expected: PASS.

- [ ] **Step 3: Verify the queue check still passes**

The store must not have changed queue behaviour.

```bash
pnpm test
```

Expected: PASS, both scripts print `ok`.

- [ ] **Step 4: Commit**

```bash
git grep -n -P "\x{2014}" -- packages/ui/src/lib/notch-store.ts
git add packages/ui/src/lib/notch-store.ts
git commit -m "feat(ui): notch store, timers and toast API"
```

---

### Task 4: The goo layer

The filter and the blobs, with no content layer yet. The deliverable is a droplet that descends from the top edge with a visible liquid neck that stretches and snaps. Verify it by eye before any text is involved, because every later task sits on top of this and a broken filter is far harder to spot once there is text to look at instead.

**Files:**
- Create: `packages/ui/src/components/notch.tsx`

**Interfaces:**
- Consumes: `SPRING_GOO`, `SPRING_RETRACT` from `../lib/easing` (Task 2).
- Produces:
  ```ts
  // Internal to this file at this stage; Task 5 consumes them directly.
  const ANCHOR_W = 120, ANCHOR_H = 40, ANCHOR_TOP = -24;
  const Y_FROM = -8, Y_TO = 16;
  function sigmaFor(viscosity: number): number;
  function NotchGoo(props: {
    y: MotionValue<number>;
    width: number;
    height: number;
    radius: number;
    sigma: number;
    filterId: string;
  }): JSX.Element;
  ```

- [ ] **Step 1: Write the goo layer**

Create `packages/ui/src/components/notch.tsx`:

```tsx
"use client";

import * as React from "react";
import { motion, type MotionValue } from "motion/react";

/** The anchor is a lozenge parked above the viewport edge, wide and short. It
 *  is never itself visible - only its contribution to the bridge is. Without a
 *  second shape there is nothing to fuse with and the droplet just fades in. */
const ANCHOR_W = 120;
const ANCHOR_H = 40;
const ANCHOR_TOP = -24;

/** Travel. Deliberately short: the bridge carries the effect, and extra
 *  distance buys nothing but latency. At Y_FROM the droplet is still fully
 *  merged with the anchor, which is why nothing is legible until it moves. */
const Y_FROM = -8;
const Y_TO = 16;

/** Blur radius from the 0-10 viscosity prop. Higher sigma means the halos
 *  overlap for longer, so the neck stretches further before it snaps - which
 *  is what reads as a thicker liquid. Below about 4 the bridge never forms at
 *  all; above about 14 it never lets go within the travel distance. */
export const sigmaFor = (viscosity: number) =>
  4 + (Math.min(10, Math.max(0, viscosity)) / 10) * 10;

/** The filtered layer. Solid shapes only - the filter blurs and then
 *  alpha-crushes every descendant, so text put in here comes out as fringed
 *  mush. That constraint is the entire reason the notch is two layers.
 *
 *  Two blobs, not one: a border-coloured blob sits a pixel proud of a
 *  background-coloured one, so the outline is gooed too and stretches with the
 *  neck. A CSS border would simply be blurred into the fill and vanish. */
function NotchGoo({
  y,
  width,
  height,
  radius,
  sigma,
  filterId,
}: {
  y: MotionValue<number>;
  width: number;
  height: number;
  radius: number;
  sigma: number;
  filterId: string;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
      style={{ filter: `url(#${filterId})` }}
    >
      {/* Parked above the edge. Nothing about it is meant to be seen. */}
      <div
        className="absolute rounded-full bg-border"
        style={{
          width: ANCHOR_W,
          height: ANCHOR_H,
          top: ANCHOR_TOP,
        }}
      />
      <motion.div className="absolute" style={{ y }}>
        {/* Border blob first, so the fill paints over its middle and leaves
            exactly the 1px proud edge showing. */}
        <div
          className="absolute bg-border"
          style={{
            width: width + 2,
            height: height + 2,
            left: -(width + 2) / 2,
            borderRadius: radius + 1,
          }}
        />
        <div
          className="absolute bg-background"
          style={{
            width,
            height,
            left: -width / 2,
            top: 1,
            borderRadius: radius,
          }}
        />
      </motion.div>
    </div>
  );
}

/** The filter itself. Two nodes, and three things that are easy to get wrong:
 *
 *  1. The region must be declared. A <filter> defaults to -10%/+10% of the
 *     bounding box, and a stretched neck exceeds that and is clipped clean
 *     through. This is the single most common reason a goo demo looks broken.
 *  2. No feBlend. Published versions end with feBlend against SourceGraphic to
 *     keep inner content crisp; here there is no inner content, so that node
 *     only re-composites the sharp un-gooed silhouette on top of the liquid
 *     one and cancels the effect outright.
 *  3. The alpha row is the whole trick: newAlpha = 18*A - 7 puts a hard cutoff
 *     at A of about 0.39, so two blurred halos read as one solid shape while
 *     they overlap above it and as two the instant they do not. The neck
 *     stretching, thinning and snapping is emergent. Do not animate it. */
function GooFilter({ id, sigma }: { id: string; sigma: number }) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute size-0"
      focusable="false"
    >
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={sigma}
            result="blur"
          />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
          />
        </filter>
      </defs>
    </svg>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter devignerui lint
```

Expected: PASS. Unused-export warnings for `NotchGoo` and `GooFilter` are expected at this stage; Task 5 consumes them.

- [ ] **Step 3: Commit**

```bash
git grep -n -P "\x{2014}" -- packages/ui/src/components/notch.tsx
git add packages/ui/src/components/notch.tsx
git commit -m "feat(ui): goo filter and blob layer for the notch"
```

---

### Task 5: Content layer, entrance and exit

The `<Toaster />` component proper: the fixed wrapper, the shared spring both layers read, the `ResizeObserver` that sizes the blob from the content, and the entrance and exit choreography.

**Files:**
- Modify: `packages/ui/src/components/notch.tsx` (append)

**Interfaces:**
- Consumes: `NotchGoo`, `GooFilter`, `sigmaFor`, `Y_FROM`, `Y_TO` (Task 4); `useNotches`, `pauseTimers`, `resumeTimers`, `toast` (Task 3); `SPRING_GOO`, `SPRING_RETRACT`, `SPRING_LAYOUT` from `../lib/easing`.
- Produces:
  ```ts
  export interface ToasterProps {
    viscosity?: number;
    duration?: number;
    expand?: boolean;
    offset?: number;
    hotkey?: string[];
    className?: string;
  }
  export function Toaster(props: ToasterProps): JSX.Element;
  ```

- [ ] **Step 1: Add the imports**

At the top of `packages/ui/src/components/notch.tsx`, replace the `motion/react` import line and add the rest:

```tsx
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "motion/react";
import { cn } from "cn";
import { SPRING_GOO, SPRING_LAYOUT, SPRING_RETRACT } from "../lib/easing";
import { useNotches, pauseTimers, resumeTimers } from "../lib/notch-store";
import type { NotchRecord } from "../lib/notch-queue";
```

- [ ] **Step 2: Add the content-size hook**

Append to `packages/ui/src/components/notch.tsx`:

```tsx
/** Corner radius of the resting pill. Half the minimum height, so a
 *  single-line notch reads as a pill and a grown one keeps the same corner
 *  rather than swapping shape as it expands. */
const RADIUS = 22;
const MIN_W = 180;
const MIN_H = 44;

/** Measures the content so the blob underneath can match it.
 *
 *  The blob has no content of its own, so nothing sizes it, yet it has to
 *  track a pill sized by its own text through an entrance, a status morph and
 *  an expand. A ResizeObserver is the honest answer: the alternative, a hidden
 *  twin of the children rendered under [&_*]:invisible, sizes with zero lag
 *  but runs the children's effects twice and collides their refs, which breaks
 *  the moment anyone uses the `content` escape hatch.
 *
 *  The one-frame measurement lag it costs is invisible because both layers
 *  spring toward the same target rather than snapping to raw numbers. */
function useContentSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = React.useState({ width: MIN_W, height: MIN_H });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize({
        width: Math.max(MIN_W, Math.round(box.width)),
        height: Math.max(MIN_H, Math.round(box.height)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}
```

- [ ] **Step 3: Add the Toaster**

Append to `packages/ui/src/components/notch.tsx`:

```tsx
export interface ToasterProps {
  /** 0-10. Higher is a longer, lazier neck before the bridge snaps. */
  viscosity?: number;
  /** Default auto-dismiss in ms. Per-notch `duration` overrides it. */
  duration?: number;
  /** Whether hovering expands the notch. Click-to-expand is always on. */
  expand?: boolean;
  /** Extra px below the top edge, for consumers with a fixed header of their
   *  own. The component does not know about anyone else's layout. */
  offset?: number;
  /** Moves focus into the notch. Toasts must never take focus by themselves. */
  hotkey?: string[];
  /** Classes for the content surface, not the fixed wrapper. */
  className?: string;
}

export function Toaster({
  viscosity = 5,
  expand = false,
  offset = 0,
  className,
}: ToasterProps) {
  const reduced = useReducedMotion() ?? false;
  const list = useNotches();
  const current = list[0];
  const content = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContentSize(content);

  /* One motion value, two consumers. The blob and the content both read this,
     so they physically cannot drift apart - there is only one number. Two
     independent animations with identical configs still desync, because they
     start on different frames. */
  const raw = useMotionValue(Y_FROM);
  const y = useSpring(raw, current?.status ? SPRING_GOO : SPRING_RETRACT);

  React.useEffect(() => {
    raw.set(current ? Y_TO : Y_FROM);
  }, [current, raw]);

  /* Reduced motion drops the filter entirely rather than tuning it down. A
     full-width SVG filter re-rasterizing every frame is precisely the class of
     thing that setting exists to prevent, and a slower goo is still goo. */
  const filterId = React.useId();
  const sigma = sigmaFor(viscosity);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100]"
      style={{ paddingTop: offset }}
    >
      {!reduced && <GooFilter id={filterId} sigma={sigma} />}

      <AnimatePresence>
        {current && (
          <React.Fragment key="notch">
            {!reduced && (
              <NotchGoo
                y={y}
                width={width}
                height={height}
                radius={RADIUS}
                sigma={sigma}
                filterId={filterId}
              />
            )}

            {/* Sibling of the goo layer, never a child. `filter` creates a
                containing block, so anything positioned inside the filtered
                element resolves against it rather than the viewport. */}
            <motion.div
              className="flex justify-center"
              style={reduced ? undefined : { y }}
              initial={reduced ? { opacity: 0, y: -2 } : false}
              animate={reduced ? { opacity: 1, y: 0 } : undefined}
              exit={reduced ? { opacity: 0, y: -2 } : { opacity: 0 }}
              transition={reduced ? { duration: 0.15 } : SPRING_RETRACT}
            >
              <motion.div
                ref={content}
                layout
                transition={SPRING_LAYOUT}
                onPointerEnter={pauseTimers}
                onPointerLeave={resumeTimers}
                style={{
                  minWidth: MIN_W,
                  minHeight: MIN_H,
                  borderRadius: RADIUS,
                }}
                className={cn(
                  "pointer-events-auto flex items-center gap-3 px-4 py-3",
                  // Transparent background on purpose: the goo layer paints
                  // the surface. Giving this one a background would draw a
                  // hard-edged pill on top of the liquid one and flatten it.
                  reduced && "border border-border bg-background shadow-subtle",
                  className,
                )}
              >
                <NotchBody record={current} count={list.length} />
              </motion.div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Add a placeholder body so the file compiles**

Task 6 replaces this wholesale. It exists only so Task 5 has a running deliverable to look at.

```tsx
function NotchBody({
  record,
  count,
}: {
  record: NotchRecord;
  count: number;
}) {
  return (
    <>
      <span className="text-[15px] font-medium text-foreground">
        {record.title as React.ReactNode}
      </span>
      {count > 1 && (
        <span className="text-[13px] text-text-muted">+{count - 1}</span>
      )}
    </>
  );
}
```

- [ ] **Step 5: Type-check**

```bash
pnpm --filter devignerui lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git grep -n -P "\x{2014}" -- packages/ui/src/components/notch.tsx
git add packages/ui/src/components/notch.tsx
git commit -m "feat(ui): notch content layer with shared-spring entrance"
```

---

### Task 6: Status, icons and the promise morph

Replace the placeholder body with the real one: icon per status, title, description, action and cancel buttons, and the counter. The loading spinner to success check swap reuses the exact `AnimatePresence` + `SPRING_SWAP` pattern from `menu-dock.tsx`'s `Glyph`.

**Files:**
- Modify: `packages/ui/src/components/notch.tsx` (replace `NotchBody`)

**Interfaces:**
- Consumes: `NotchRecord`, `NotchStatus` (Task 1); `SPRING_SWAP`, `SPRING_PRESS` from `../lib/easing`.
- Produces: the final `NotchBody`. No new exports.

- [ ] **Step 1: Extend the easing import**

```tsx
import {
  SPRING_GOO,
  SPRING_LAYOUT,
  SPRING_PRESS,
  SPRING_RETRACT,
  SPRING_SWAP,
} from "../lib/easing";
```

- [ ] **Step 2: Add the status icons**

```tsx
import {
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconLoader2,
} from "@devigner-ui/icons";

/** Colour and glyph per status. `default` carries no icon at all - a plain
 *  message with a decorative dot in front of it says less than one without. */
const STATUS: Record<
  NotchStatus,
  { icon: React.ReactNode | null; tone: string }
> = {
  default: { icon: null, tone: "text-foreground" },
  success: { icon: <IconCheck />, tone: "text-success" },
  error: { icon: <IconX />, tone: "text-destructive" },
  warning: { icon: <IconAlertTriangle />, tone: "text-warning" },
  loading: { icon: <IconLoader2 className="animate-spin" />, tone: "text-text-secondary" },
};
```

- [ ] **Step 3: Replace NotchBody**

```tsx
function NotchBody({
  record,
  count,
  reduced,
}: {
  record: NotchRecord;
  count: number;
  reduced: boolean;
}) {
  // The escape hatch is terminal: nothing structured renders alongside it, so
  // a consumer who takes over the surface takes over all of it.
  if (record.content !== undefined) {
    return <>{record.content as React.ReactNode}</>;
  }

  const { icon, tone } = STATUS[record.status];
  const glyph = (record.icon as React.ReactNode) ?? icon;

  return (
    <>
      {glyph && (
        /* popLayout takes the outgoing glyph out of flow so the incoming one
           lands exactly where it sat, the same way MenuDock's Glyph does it.
           Keyed by status, so loading to success is a swap rather than a
           reconciliation that would leave the spinner class on the check. */
        <span className="relative grid size-5 shrink-0 place-items-center [&_svg]:size-5">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={record.status}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.55 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.55 }}
              transition={reduced ? { duration: 0.12 } : SPRING_SWAP}
              className={cn("grid place-items-center", tone)}
            >
              {glyph}
            </motion.span>
          </AnimatePresence>
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-medium text-foreground">
          {record.title as React.ReactNode}
        </span>
        {record.description !== undefined && (
          <span className="truncate text-[13px] text-text-secondary">
            {record.description as React.ReactNode}
          </span>
        )}
      </div>

      {record.cancel && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={SPRING_PRESS}
          onClick={() => {
            record.cancel?.onClick?.();
            toast.dismiss(record.id);
          }}
          className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium text-text-secondary outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          {record.cancel.label}
        </motion.button>
      )}

      {record.action && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={SPRING_PRESS}
          onClick={() => {
            record.action?.onClick();
            toast.dismiss(record.id);
          }}
          className="shrink-0 rounded-full bg-foreground px-3 py-1.5 text-[13px] font-medium text-background outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          {record.action.label}
        </motion.button>
      )}

      {count > 1 && (
        <span className="shrink-0 text-[13px] tabular-nums text-text-muted">
          +{count - 1}
        </span>
      )}
    </>
  );
}
```

- [ ] **Step 4: Pass `reduced` at the call site**

In `Toaster`, change the call to `<NotchBody record={current} count={list.length} reduced={reduced} />`, and add `import { toast } from "../lib/notch-store";` to the existing store import line.

- [ ] **Step 5: Confirm the icon names exist**

```bash
node -e "const i=require('@devigner-ui/icons');for(const n of ['IconCheck','IconX','IconAlertTriangle','IconLoader2'])console.log(n, typeof i[n])"
```

Expected: all four print `function`. If any prints `undefined`, list the real export names with `node -e "console.log(Object.keys(require('@devigner-ui/icons')).filter(k=>/check|x|alert|load|spin/i.test(k)).join('\n'))"` and substitute the nearest match, keeping the same four roles.

- [ ] **Step 6: Type-check**

```bash
pnpm --filter devignerui lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git grep -n -P "\x{2014}" -- packages/ui/src/components/notch.tsx
git add packages/ui/src/components/notch.tsx
git commit -m "feat(ui): notch status glyphs, actions and promise morph"
```

---

### Task 7: Expand interaction

Compact by default; hover (when `expand`) or click reveals the full list plus any description that was truncated. The morph is `SPRING_LAYOUT` on the already-`layout` content element, so the `ResizeObserver` feeds the new size to the blob and both spring together with no extra machinery.

**Files:**
- Modify: `packages/ui/src/components/notch.tsx`

**Interfaces:**
- Consumes: everything from Tasks 4-6.
- Produces: no new exports. `Toaster` gains internal `open` state.

- [ ] **Step 1: Add the state and handlers to Toaster**

```tsx
const [open, setOpen] = React.useState(false);

/* Collapse whenever the rendered notch changes. An expanded panel that
   silently swaps its contents for a different notification is the kind of
   thing that gets the wrong button pressed. */
React.useEffect(() => {
  setOpen(false);
}, [current?.id]);

React.useEffect(() => {
  if (!open) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}, [open]);
```

- [ ] **Step 2: Wire the trigger**

Replace the content element's props so it is an expandable region. Note `aria-expanded` goes on the button, never on the container.

```tsx
onPointerEnter={() => {
  pauseTimers();
  if (expand) setOpen(true);
}}
onPointerLeave={() => {
  resumeTimers();
  if (expand) setOpen(false);
}}
```

And wrap the body so the compact row is the trigger:

```tsx
<div className="flex w-full flex-col">
  <button
    type="button"
    aria-expanded={open}
    onClick={() => setOpen((v) => !v)}
    className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
  >
    <NotchBody record={current} count={list.length} reduced={reduced} />
  </button>

  <AnimatePresence initial={false}>
    {open && list.length > 1 && (
      <motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={SPRING_LAYOUT}
        className="mt-2 flex flex-col gap-1 border-t border-border pt-2"
      >
        {list.slice(1).map((n) => (
          <li
            key={n.id}
            className="truncate text-[13px] text-text-secondary"
          >
            {n.title as React.ReactNode}
          </li>
        ))}
      </motion.ul>
    )}
  </AnimatePresence>
</div>
```

- [ ] **Step 3: Type-check**

```bash
pnpm --filter devignerui lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git grep -n -P "\x{2014}" -- packages/ui/src/components/notch.tsx
git add packages/ui/src/components/notch.tsx
git commit -m "feat(ui): expandable notch revealing the pending list"
```

---

### Task 8: Accessibility

The live region, the focus hotkey, and pausing timers on window blur. None of this is optional and none of it is visible, which is exactly why it gets its own task and its own gate.

**Files:**
- Modify: `packages/ui/src/components/notch.tsx`

**Interfaces:**
- Consumes: `pauseTimers`, `resumeTimers` (Task 3).
- Produces: no new exports.

- [ ] **Step 1: Add the permanently-mounted live region**

Inside `Toaster`, as the first child of the fixed wrapper and outside the `AnimatePresence`:

```tsx
{/* Mounted empty and permanently, with notifications written into it. A live
    region that mounts together with its content is not announced at all -
    screen readers only report changes to regions they were already watching.
    This is the single most common toast accessibility bug.

    Two regions, not one with a swapped role: changing role/aria-live on a live
    element is unreliable across screen readers, so each severity gets its own
    permanent region and only the matching one is ever written to. */}
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {current && current.status !== "error"
    ? [current.title, current.description].filter(Boolean).join(". ")
    : ""}
</div>
<div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
  {current && current.status === "error"
    ? [current.title, current.description].filter(Boolean).join(". ")
    : ""}
</div>
```

Note that the join only produces useful output for string titles. Leave it: an element title announces through the visible layer, and stringifying React children for a live region is a trap.

- [ ] **Step 2: Pause on window blur**

```tsx
/* Without this a notification expires while the user is in another tab and is
   never seen. Hover pausing alone does not cover it - the pointer is not on
   the page at all. */
React.useEffect(() => {
  window.addEventListener("blur", pauseTimers);
  window.addEventListener("focus", resumeTimers);
  return () => {
    window.removeEventListener("blur", pauseTimers);
    window.removeEventListener("focus", resumeTimers);
  };
}, []);
```

- [ ] **Step 3: Add the focus hotkey**

Add `hotkey = ["altKey", "KeyT"]` to the destructured props, and:

```tsx
const surface = React.useRef<HTMLDivElement>(null);

/* A toast must never take focus by itself - it would yank the caret out of
   whatever is being typed. The hotkey is how a keyboard user reaches it
   deliberately, which is the pattern Sonner established. */
React.useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    const hit = hotkey.every((k) =>
      k.endsWith("Key") ? e[k as "altKey"] : e.code === k,
    );
    if (!hit) return;
    e.preventDefault();
    surface.current?.querySelector("button")?.focus();
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}, [hotkey]);
```

Put `ref={surface}` on the content element.

- [ ] **Step 4: Verify the goo layer is inert**

```bash
grep -n "aria-hidden" packages/ui/src/components/notch.tsx
```

Expected: the `NotchGoo` wrapper and the `GooFilter` svg both carry it. Both must also carry `pointer-events-none`.

- [ ] **Step 5: Type-check**

```bash
pnpm --filter devignerui lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git grep -n -P "\x{2014}" -- packages/ui/src/components/notch.tsx
git add packages/ui/src/components/notch.tsx
git commit -m "feat(ui): notch live regions, focus hotkey and blur pausing"
```

---

### Task 9: Exports, docs entry and visual verification

Wire the component into the package barrel and the docs registry, then actually look at it. The bridge snap cannot be unit-tested, so this task's gate is a set of screenshots.

**Files:**
- Modify: `packages/ui/src/index.ts`
- Modify: `apps/docs/lib/registry.ts`

**Interfaces:**
- Consumes: `Toaster`, `ToasterProps` (Task 5); `toast`, `NotchOptions` (Task 3); `NotchStatus`, `NotchRecord` (Task 1).
- Produces: the public package surface.

- [ ] **Step 1: Export from the barrel**

Append to `packages/ui/src/index.ts`, matching the existing grouping style:

```ts
export { Toaster, type ToasterProps } from "./components/notch";
export { toast, type NotchOptions } from "./lib/notch-store";
export type { NotchStatus, NotchRecord } from "./lib/notch-queue";
```

- [ ] **Step 2: Build the package**

```bash
pnpm --filter devignerui build
```

Expected: PASS, `dist/index.js`, `dist/index.cjs` and `dist/index.d.ts` written.

- [ ] **Step 3: Add the docs registry entry**

Add a `notch` key to `components` in `apps/docs/lib/registry.ts`. Follow that file's header comment: the `code` field is a curated standalone copy-paste source, distinct from the package source. It must inline `SPRING_GOO`, `SPRING_RETRACT`, `SPRING_LAYOUT`, `SPRING_SWAP` and `SPRING_PRESS` rather than importing from `../lib/easing`, carry the `<filter>` markup inline, and install as `components/ui/notch.tsx` as a single self-contained file.

Fields:

```ts
"notch": {
  slug: "notch",
  name: "Notch",
  description:
    "A notification that is squeezed through the top edge of the viewport as a liquid droplet, with a neck that stretches and snaps",
  category: "animation",
  variants: ["Success", "Error", "Promise", "With action", "Expanded"],
  props: [
    { name: "viscosity", type: "number", default: "5",
      description: "0-10. Higher is a longer, lazier neck before the bridge snaps." },
    { name: "duration", type: "number", default: "4000",
      description: "Default auto-dismiss in ms. Infinity pins the notch until it is dismissed by hand." },
    { name: "expand", type: "boolean", default: "false",
      description: "Whether hovering expands the notch. Click-to-expand is always on." },
    { name: "offset", type: "number", default: "0",
      description: "Extra px below the top edge, for consumers with a fixed header of their own." },
    { name: "hotkey", type: "string[]", default: '["altKey","KeyT"]',
      description: "Moves focus into the notch. Notifications never take focus on their own." },
    { name: "className", type: "string", default: "-",
      description: "Classes for the content surface, not the fixed wrapper." },
  ],
  usage: `toast.success("Deployed");\ntoast.promise(deploy(), {\n  loading: "Deploying...",\n  success: "Live",\n  error: "Failed",\n});`,
  notes: [
    "Opaque fills only. The liquid merge is alpha compositing, so a translucent notch cannot bridge, and backdrop-filter does not survive a filter on the same subtree. Glassmorphism and this effect are mutually exclusive.",
    "Reduced motion drops the filter entirely for a plain fade. A full-width SVG filter re-rasterizing every frame is what that setting exists to prevent.",
    "One notch at a time. A second notification morphs the surface in place and raises a counter rather than stacking.",
  ],
  code: "...",
}
```

- [ ] **Step 4: Verify the docs build**

```bash
pnpm --filter docs build
```

Expected: PASS.

- [ ] **Step 5: Screenshot the effect**

Start the dev server, then capture the droplet mid-descent at three viscosities and both themes. `--wait` is tuned so the shot lands during the bridge rather than after it has snapped.

```bash
pnpm dev &
node scripts/shot.mjs http://localhost:3000/components/notch /tmp/notch-v0.png --wait 250 --theme light
node scripts/shot.mjs http://localhost:3000/components/notch /tmp/notch-v5.png --wait 250 --theme light
node scripts/shot.mjs http://localhost:3000/components/notch /tmp/notch-v10.png --wait 250 --theme dark
```

Expected, and check each by opening the PNG: a visible neck connecting the droplet to the top edge, with an outline on the neck as well as the body. If the neck is squared off or cut straight across, the filter region is wrong - re-check that the `<filter>` carries `x="-50%" y="-50%" width="200%" height="200%"`. If there is no neck at all, the blobs are further apart than the blur can bridge; reduce the travel or raise `viscosity`.

- [ ] **Step 6: Run everything**

```bash
pnpm test && pnpm lint && pnpm build
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git grep -n -P "\x{2014}"
git add packages/ui/src/index.ts apps/docs/lib/registry.ts
git commit -m "feat(ui): export Notch and add its docs entry"
```

The repo-wide `git grep` must print nothing.

---

## Self-review notes

**Spec coverage.** §1 goo technique to Task 4. §2 layers to Tasks 4-5. §3 sync to Task 5. §4 motion to Tasks 2, 5, 6. §5 store to Tasks 1, 3. §6 API to Tasks 3, 9. §7 accessibility to Task 8. §8 costs documented in the Task 9 `notes`. §9 out of scope, no tasks by design. §10 testing to Task 1 and Task 9 step 5. §11 registry to Task 9.

**Known gap, deliberate.** The spec's `remainingMs` is exercised by the check script but the store's pause/resume path has no automated test, because the timer logic is entangled with real `setTimeout` and the repo has no fake-timer facility. It is covered by Task 9's manual pass instead. Extracting a pure scheduler would be the fix if this ever regresses.

**Type consistency.** `NotchRecord.duration` is non-optional `number` throughout, with `Infinity` as the pin. `NotchOptions.duration` is optional and is defaulted at `create`. Content slots are `unknown` in `notch-queue.ts` and `React.ReactNode` in `notch-store.ts`, cast at the render boundary in `notch.tsx` - intentional, so the queue stays React-free.
