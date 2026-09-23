const DAY_MS = 24 * 60 * 60 * 1000;

/** Local midnight for a date, stripping the time-of-day component. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** -1 if a is before b, 1 if after, 0 if the same day. Compares by day, not time-of-day. */
export function compareDays(a: Date, b: Date): -1 | 0 | 1 {
  const diff = startOfDay(a).getTime() - startOfDay(b).getTime();
  return diff < 0 ? -1 : diff > 0 ? 1 : 0;
}

export function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Always lands on the 1st, matching how the grid keys a month. */
export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/** True when `date` falls on or between `start` and `end`, inclusive, by day. */
export function isWithinRange(date: Date, start: Date, end: Date): boolean {
  return compareDays(date, start) >= 0 && compareDays(date, end) <= 0;
}

/** Nights between two dates, i.e. the calendar-day difference. */
export function nightsBetween(start: Date, end: Date): number {
  return Math.round(
    (startOfDay(end).getTime() - startOfDay(start).getTime()) / DAY_MS,
  );
}

export interface MonthGridDay {
  date: Date;
  inMonth: boolean;
}

/** Weeks (Monday-first) covering `month`, padded with adjacent-month days so
 *  every week is a full 7 days. Row count follows the month (5 or 6) rather
 *  than padding to a fixed 6, since a picker only shows one month at a time. */
export function getMonthGrid(month: Date): MonthGridDay[][] {
  const first = startOfMonth(month);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  // getDay(): 0 = Sunday..6 = Saturday. Shift so Monday = 0.
  const leading = (first.getDay() + 6) % 7;
  const trailing = 6 - ((last.getDay() + 6) % 7);
  const start = addDays(first, -leading);
  const totalDays = leading + last.getDate() + trailing;

  const days: MonthGridDay[] = Array.from({ length: totalDays }, (_, i) => {
    const date = addDays(start, i);
    return { date, inMonth: date.getMonth() === first.getMonth() };
  });

  const weeks: MonthGridDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

/** Walks day by day from `anchor` toward `target`, stopping at the last day
 *  before `isDisabled` blocks one, so a hover preview or a commit never
 *  crosses a gap the caller marked unavailable. Returns `anchor` itself if
 *  the very next day is already disabled, and `target` unchanged when no
 *  `isDisabled` callback is given. */
export function clampRangeEnd(
  anchor: Date,
  target: Date,
  isDisabled?: (date: Date) => boolean,
): Date {
  if (!isDisabled) return startOfDay(target);
  const step = compareDays(target, anchor) >= 0 ? 1 : -1;
  let clamped = startOfDay(anchor);
  let cursor = addDays(anchor, step);
  while (
    step > 0 ? compareDays(cursor, target) <= 0 : compareDays(cursor, target) >= 0
  ) {
    if (isDisabled(cursor)) break;
    clamped = cursor;
    cursor = addDays(cursor, step);
  }
  return clamped;
}
