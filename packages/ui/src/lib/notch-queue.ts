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
