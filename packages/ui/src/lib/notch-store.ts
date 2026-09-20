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
 *  burst drains rather than queueing up behind the counter. Mutable via
 *  `setDefaultDuration` so `<Toaster duration>` can override it - a plain
 *  const would leave that prop permanently ignored. */
let defaultDuration = 4000;

/** Sets the default auto-dismiss duration used by every `toast()` call that
 *  does not pass its own `duration`. Called by the Toaster from its
 *  `duration` prop; a per-notch `duration` still wins over this. */
export function setDefaultDuration(ms: number) {
  defaultDuration = ms;
}

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
  {
    /** Absent while paused: a paused notch is banked here with no live
     *  handle so `resumeTimers` can find and start it. */
    handle: ReturnType<typeof setTimeout> | undefined;
    startedAt: number;
    elapsed: number;
  }
>();

/* Reason-counted rather than a single boolean. Two independent things pause
   the clock (window blur, pointer hover), and either one releasing must not
   resume timers the other still wants paused - a hover ending while the
   window is still blurred must not un-pause a background toast. */
const pauseReasons = new Set<string>();
const isPaused = () => pauseReasons.size > 0;

function schedule(id: string) {
  const record = list.find((n) => n.id === id);
  if (!record) return;
  const banked = timers.get(id)?.elapsed ?? 0;
  const left = remainingMs(record, banked);
  if (left === Infinity) return;
  const existing = timers.get(id);
  if (existing?.handle) clearTimeout(existing.handle);
  if (isPaused()) {
    // No live handle while paused. Without banking an entry here, a notch
    // created (or settled) mid-pause never appears in `timers` at all, and
    // resumeTimers, which only walks timers.keys(), never discovers it - so
    // it never auto-dismisses even once the pause lifts.
    timers.set(id, { handle: undefined, startedAt: Date.now(), elapsed: banked });
    return;
  }
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
 *  expires while the user is in another tab and is never seen at all.
 *
 *  `reason` identifies who is asking, so an unrelated `resumeTimers` call
 *  cannot cancel this pause out from under its caller. */
export function pauseTimers(reason: string) {
  const wasPaused = isPaused();
  pauseReasons.add(reason);
  if (wasPaused) return;
  for (const [id, t] of timers) {
    if (!t.handle) continue;
    clearTimeout(t.handle);
    timers.set(id, {
      ...t,
      handle: undefined,
      elapsed: t.elapsed + (Date.now() - t.startedAt),
    });
  }
}

export function resumeTimers(reason: string) {
  pauseReasons.delete(reason);
  if (isPaused()) return;
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
    duration: options.duration ?? defaultDuration,
    createdAt: Date.now(),
  };
  setList(addNotch(list, record));
  /* Re-adding a live id refreshes it, so its old timer is stale by definition
     and has to be thrown away rather than left to fire against the new one.
     schedule() always runs now, paused or not - it is schedule's own job to
     bank a handle-less entry when paused, not the caller's to skip it. */
  unschedule(id);
  schedule(id);
  return id;
}

/** Patches a live notch and restarts its clock. Used by promise settlement,
 *  which must morph the surface rather than replace it - a dismiss plus a
 *  create would withdraw the notch behind the edge and play its whole
 *  entrance again for what is really one notification changing its mind. */
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
  schedule(id);
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
    const duration = options.duration ?? defaultDuration;
    const id = create("loading", msgs.loading, {
      ...options,
      duration: Infinity,
    });
    /* The derived promise is intentionally discarded rather than returned -
       callers get back `p` unchanged, below. But discarding it silently also
       throws away any rejection it produces, and a `success`/`error`
       formatter that itself throws rejects it with nothing attached, which is
       an unhandled rejection in SSR or Node. The catch here only needs to
       exist, not do anything. */
    p.then(
      (value) => settle(id, "success", resolveMessage(msgs.success, value), duration),
      (err) => settle(id, "error", resolveMessage(msgs.error, err), duration),
    ).catch(() => {});
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
