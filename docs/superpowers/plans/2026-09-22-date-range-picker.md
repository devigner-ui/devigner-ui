# DateRangePicker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a general-purpose `DateRangePicker` component in `devignerui`, a calendar-based date-range input with hover-preview selection, configurable presets, and keyboard/screen-reader accessibility.

**Architecture:** One pure logic module (`lib/date-range.ts`, no React, fully unit-testable) that the component consumes for all day-math (month grids, comparisons, disabled-range clamping). One component file (`components/date-range-picker.tsx`) that owns controllable `value`/`month` state, a two-click selection state machine, and rendering, following the package's existing `classNames`/`slotProps`/`renderX` conventions (see `timeline.tsx`, `chart-card.tsx`).

**Tech Stack:** React 19, `motion/react` (springs from `lib/easing.ts`), Tailwind v4 CSS tokens (`bg-surface`, `bg-accent`, `border-border`, etc.), `@devigner-ui/icons`, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-22-date-range-picker-design.md`

## Global Constraints

- Value type is native `Date`, normalized to local midnight internally. No new date library.
- Single accent color for the whole component (existing `--color-accent`/`--color-accent-foreground` tokens). No per-preset color theming.
- Presets are consumer-supplied data (`{ id, label, getRange(anchor) }`), not hardcoded.
- Month navigation (prev/next) is required, not optional.
- `minDate`/`maxDate`/`isDateDisabled` must gate selection, hover-preview, and keyboard focus.
- Animation tokens come only from `packages/ui/src/lib/easing.ts` (`SPRING_LAYOUT`, `SPRING_SWAP`, `SPRING_PRESS`), matching `AGENTS.md`'s motion rule. No inline cubic-beziers or ad-hoc springs.
- Every shared-layout `layoutId` must be per-instance (via `React.useId()`), matching `chart-card.tsx`'s existing rule, so two pickers on one page never swap animations.
- No em dashes anywhere (code, comments, commit messages) per `AGENTS.md`.

---

### Task 1: Pure date-range utilities

**Files:**
- Create: `packages/ui/src/lib/date-range.ts`
- Test: `packages/ui/src/lib/date-range.test.ts`

**Interfaces:**
- Produces: `startOfDay(date: Date): Date`, `startOfMonth(date: Date): Date`, `isSameDay(a: Date, b: Date): boolean`, `compareDays(a: Date, b: Date): -1 | 0 | 1`, `addDays(date: Date, days: number): Date`, `addMonths(date: Date, months: number): Date`, `isWithinRange(date: Date, start: Date, end: Date): boolean`, `nightsBetween(start: Date, end: Date): number`, `interface MonthGridDay { date: Date; inMonth: boolean }`, `getMonthGrid(month: Date): MonthGridDay[][]`, `clampRangeEnd(anchor: Date, target: Date, isDisabled?: (date: Date) => boolean): Date`.

- [ ] **Step 1: Write the failing tests**

```ts
// packages/ui/src/lib/date-range.test.ts
import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  clampRangeEnd,
  compareDays,
  getMonthGrid,
  isSameDay,
  isWithinRange,
  nightsBetween,
  startOfDay,
  startOfMonth,
} from "./date-range";

describe("date-range utilities", () => {
  it("strips time-of-day in startOfDay", () => {
    const d = new Date(2026, 8, 4, 13, 45, 30);
    const result = startOfDay(d);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(isSameDay(result, d)).toBe(true);
  });

  it("returns the first of the month", () => {
    const result = startOfMonth(new Date(2026, 8, 17));
    expect(result.getDate()).toBe(1);
    expect(result.getMonth()).toBe(8);
  });

  it("compares days ignoring time-of-day", () => {
    const morning = new Date(2026, 8, 4, 8, 0);
    const evening = new Date(2026, 8, 4, 20, 0);
    const nextDay = new Date(2026, 8, 5);
    expect(compareDays(morning, evening)).toBe(0);
    expect(compareDays(morning, nextDay)).toBe(-1);
    expect(compareDays(nextDay, morning)).toBe(1);
  });

  it("adds days across a month boundary", () => {
    const result = addDays(new Date(2026, 8, 29), 3);
    expect(result.getMonth()).toBe(9);
    expect(result.getDate()).toBe(2);
  });

  it("adds months, clamping to the 1st", () => {
    const result = addMonths(new Date(2026, 8, 17), 1);
    expect(result.getMonth()).toBe(9);
    expect(result.getDate()).toBe(1);
  });

  it("treats isWithinRange as inclusive of both ends", () => {
    const start = new Date(2026, 8, 4);
    const end = new Date(2026, 8, 25);
    expect(isWithinRange(start, start, end)).toBe(true);
    expect(isWithinRange(end, start, end)).toBe(true);
    expect(isWithinRange(new Date(2026, 8, 10), start, end)).toBe(true);
    expect(isWithinRange(new Date(2026, 8, 3), start, end)).toBe(false);
  });

  it("counts nights as the calendar-day difference", () => {
    expect(nightsBetween(new Date(2026, 8, 4), new Date(2026, 8, 25))).toBe(21);
    expect(nightsBetween(new Date(2026, 8, 4), new Date(2026, 8, 4))).toBe(0);
  });

  it("builds a Monday-first month grid with no fixed row count", () => {
    // September 2026: 30 days, starts on a Tuesday.
    const weeks = getMonthGrid(new Date(2026, 8, 1));
    for (const week of weeks) expect(week).toHaveLength(7);
    const allDays = weeks.flat();
    expect(allDays[0]!.date.getDay()).toBe(1); // first cell is a Monday
    const inMonthDays = allDays.filter((d) => d.inMonth);
    expect(inMonthDays).toHaveLength(30);
    expect(inMonthDays[0]!.date.getDate()).toBe(1);
    expect(inMonthDays.at(-1)!.date.getDate()).toBe(30);
  });

  it("clamps range end at the day before the first disabled day", () => {
    const anchor = new Date(2026, 8, 4);
    const target = new Date(2026, 8, 10);
    const isDisabled = (d: Date) => d.getDate() === 7;
    expect(clampRangeEnd(anchor, target, isDisabled).getDate()).toBe(6);
  });

  it("clamps backward the same way when target precedes anchor", () => {
    const anchor = new Date(2026, 8, 10);
    const target = new Date(2026, 8, 4);
    const isDisabled = (d: Date) => d.getDate() === 7;
    expect(clampRangeEnd(anchor, target, isDisabled).getDate()).toBe(8);
  });

  it("returns the anchor when the very next day is disabled", () => {
    const anchor = new Date(2026, 8, 4);
    const target = new Date(2026, 8, 10);
    const isDisabled = (d: Date) => d.getDate() === 5;
    expect(clampRangeEnd(anchor, target, isDisabled).getDate()).toBe(4);
  });

  it("returns target unchanged when there is no isDisabled callback", () => {
    const anchor = new Date(2026, 8, 4);
    const target = new Date(2026, 8, 10);
    expect(clampRangeEnd(anchor, target).getDate()).toBe(10);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter devignerui test -- date-range.test.ts`
Expected: FAIL with "Cannot find module './date-range'" (or similar), since the module doesn't exist yet.

- [ ] **Step 3: Write the implementation**

```ts
// packages/ui/src/lib/date-range.ts

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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter devignerui test -- date-range.test.ts`
Expected: PASS, all 12 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/lib/date-range.ts packages/ui/src/lib/date-range.test.ts
git commit -m "feat(ui): add pure date-range utilities for DateRangePicker"
```

---

### Task 2: Component skeleton, static month grid, month navigation

**Files:**
- Create: `packages/ui/src/components/date-range-picker.tsx`
- Test: `packages/ui/src/components/date-range-picker.test.tsx`

**Interfaces:**
- Consumes: everything exported from `../lib/date-range` (Task 1); `useControllableState` from `../lib/hooks/use-controllable-state`; `IconChevronLeft`, `IconChevronRight` from `@devigner-ui/icons`.
- Produces: `export interface DateRange { start: Date; end: Date }`, `export interface DateRangePreset { id: string; label: string; getRange: (anchor: Date) => DateRange }`, `export interface DateRangePickerClassNames { root?, header?, badge?, label?, grid?, day?, presets?, presetButton?, clearButton? }`, `export interface DateRangePickerSlotProps { root?: React.HTMLAttributes<HTMLDivElement> }`, `export interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> { value?, defaultValue?, onValueChange?, month?, defaultMonth?, onMonthChange?, minDate?, maxDate?, isDateDisabled?, presets?, startLabel?, endLabel?, renderBadge?, onClear?, classNames?, slotProps? }`, `export function DateRangePicker(props: DateRangePickerProps)`.
- This task renders the header labels and a fully static (non-interactive, non-animated) month grid with working prev/next navigation. Selection interaction is added in Task 3; presets/badge/clear in Task 5.

- [ ] **Step 1: Write the failing test**

```tsx
// packages/ui/src/components/date-range-picker.test.tsx
// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DateRangePicker } from "./date-range-picker";

afterEach(cleanup);

describe("DateRangePicker", () => {
  it("renders the visible month and its in-month days", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 8, 1)} />);
    expect(screen.getByText("September 2026")).toBeTruthy();
    expect(
      screen.getByRole("gridcell", { name: "30" }),
    ).toBeTruthy();
  });

  it("navigates to the next and previous month", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 8, 1)} />);
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("October 2026")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByText("August 2026")).toBeTruthy();
  });

  it("disables Previous month at minDate's month", () => {
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        minDate={new Date(2026, 8, 1)}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Previous month" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("uses the default check-in/check-out labels", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 8, 1)} />);
    expect(screen.getByText("Check-in")).toBeTruthy();
    expect(screen.getByText("Check-out")).toBeTruthy();
  });

  it("accepts custom labels", () => {
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        startLabel="Start"
        endLabel="End"
      />,
    );
    expect(screen.getByText("Start")).toBeTruthy();
    expect(screen.getByText("End")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter devignerui test -- date-range-picker.test.tsx`
Expected: FAIL with "Cannot find module './date-range-picker'".

- [ ] **Step 3: Write the implementation**

```tsx
// packages/ui/src/components/date-range-picker.tsx
"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "cn";
import { IconChevronLeft, IconChevronRight } from "@devigner-ui/icons";
import { SPRING_PRESS } from "../lib/easing";
import { useControllableState } from "../lib/hooks/use-controllable-state";
import {
  addMonths,
  getMonthGrid,
  isSameDay,
  startOfDay,
  startOfMonth,
  type MonthGridDay,
} from "../lib/date-range";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const formatShortDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateRangePreset {
  id: string;
  label: string;
  getRange: (anchor: Date) => DateRange;
}

export interface DateRangePickerClassNames {
  root?: string;
  header?: string;
  badge?: string;
  label?: string;
  grid?: string;
  day?: string;
  presets?: string;
  presetButton?: string;
  clearButton?: string;
}

export interface DateRangePickerSlotProps {
  root?: React.HTMLAttributes<HTMLDivElement>;
}

export interface DateRangePickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (range: DateRange | null) => void;

  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;

  minDate?: Date;
  maxDate?: Date;
  isDateDisabled?: (date: Date) => boolean;

  presets?: DateRangePreset[];
  startLabel?: string;
  endLabel?: string;
  renderBadge?: (range: DateRange | null) => React.ReactNode;
  onClear?: () => void;

  classNames?: DateRangePickerClassNames;
  slotProps?: DateRangePickerSlotProps;
}

function NavButton({
  label,
  children,
  className,
  ...rest
}: { label: string } & React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      transition={SPRING_PRESS}
      className={cn(
        "relative inline-grid size-8 cursor-pointer place-items-center rounded-full bg-surface-hover text-text-secondary transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export function DateRangePicker({
  value: controlledValue,
  defaultValue = null,
  onValueChange,
  month: controlledMonth,
  defaultMonth,
  onMonthChange,
  minDate,
  maxDate,
  isDateDisabled,
  presets,
  startLabel = "Check-in",
  endLabel = "Check-out",
  renderBadge,
  onClear,
  classNames,
  slotProps,
  className,
  ...rest
}: DateRangePickerProps) {
  const [value, setValue] = useControllableState<DateRange | null>({
    value: controlledValue,
    defaultValue,
    onValueChange,
  });
  const [month, setMonth] = useControllableState<Date>({
    value: controlledMonth,
    defaultValue: startOfMonth(defaultMonth ?? value?.start ?? new Date()),
    onValueChange: onMonthChange,
  });

  const isDisabled = React.useCallback(
    (date: Date) => {
      if (minDate && date < startOfDay(minDate)) return true;
      if (maxDate && date > startOfDay(maxDate)) return true;
      return isDateDisabled?.(date) ?? false;
    },
    [minDate, maxDate, isDateDisabled],
  );

  const weeks = React.useMemo(() => getMonthGrid(month), [month]);
  const today = React.useMemo(() => startOfDay(new Date()), []);

  const atMinMonth =
    minDate !== undefined &&
    month.getFullYear() === startOfMonth(minDate).getFullYear() &&
    month.getMonth() === startOfMonth(minDate).getMonth();
  const atMaxMonth =
    maxDate !== undefined &&
    month.getFullYear() === startOfMonth(maxDate).getFullYear() &&
    month.getMonth() === startOfMonth(maxDate).getMonth();

  return (
    <div
      {...slotProps?.root}
      className={cn(
        "w-fit rounded-3xl border border-border bg-surface p-5",
        className,
        classNames?.root,
      )}
      {...rest}
    >
      <div className={cn("flex items-center justify-between gap-6 border-b border-border pb-4", classNames?.header)}>
        <div>
          <div className={cn("text-xs font-medium tracking-wide text-text-tertiary uppercase", classNames?.label)}>
            {startLabel}
          </div>
          <div className="text-lg font-semibold text-foreground">
            {value ? formatShortDate(value.start) : "Add date"}
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <div className={cn("text-xs font-medium tracking-wide text-text-tertiary uppercase", classNames?.label)}>
            {endLabel}
          </div>
          <div className="text-lg font-semibold text-foreground">
            {value ? formatShortDate(value.end) : "Add date"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 pb-2">
        <div className="text-sm font-semibold text-foreground">{formatMonthLabel(month)}</div>
        <div className="flex items-center gap-1">
          <NavButton
            label="Previous month"
            disabled={atMinMonth}
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <IconChevronLeft className="size-4" strokeWidth={2.5} />
          </NavButton>
          <NavButton
            label="Next month"
            disabled={atMaxMonth}
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <IconChevronRight className="size-4" strokeWidth={2.5} />
          </NavButton>
        </div>
      </div>

      <div role="grid" aria-label={formatMonthLabel(month)} className={cn("select-none", classNames?.grid)}>
        <div className="grid grid-cols-7 text-center text-xs font-medium text-text-tertiary">
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={i}>{label}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div role="row" key={wi} className="grid grid-cols-7">
            {week.map((cell) => (
              <DayCell
                key={cell.date.getTime()}
                cell={cell}
                disabled={!cell.inMonth || isDisabled(cell.date)}
                isToday={isSameDay(cell.date, today)}
                className={classNames?.day}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayCell({
  cell,
  disabled,
  isToday,
  className,
}: {
  cell: MonthGridDay;
  disabled: boolean;
  isToday: boolean;
  className?: string;
}) {
  if (!cell.inMonth) return <div aria-hidden="true" />;
  return (
    <div
      role="gridcell"
      aria-label={String(cell.date.getDate())}
      aria-disabled={disabled}
      className={cn(
        "relative grid h-10 place-items-center text-sm",
        disabled ? "text-text-tertiary/50" : "text-foreground",
        className,
      )}
    >
      {cell.date.getDate()}
      {isToday && (
        <span className="absolute bottom-1 size-1 rounded-full bg-text-tertiary" />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter devignerui test -- date-range-picker.test.tsx`
Expected: PASS, all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/date-range-picker.tsx packages/ui/src/components/date-range-picker.test.tsx
git commit -m "feat(ui): add DateRangePicker skeleton with static month grid"
```

---

### Task 3: Selection state machine (click, hover preview, animated range pill)

**Files:**
- Modify: `packages/ui/src/components/date-range-picker.tsx`
- Modify: `packages/ui/src/components/date-range-picker.test.tsx`

**Interfaces:**
- Consumes: `clampRangeEnd`, `compareDays`, `isWithinRange` from `../lib/date-range` (Task 1); `useHoverCapable` from `../lib/hooks/use-hover-capable`; `useReducedMotion` from `motion/react`; `SPRING_LAYOUT` from `../lib/easing`.
- Produces: internal `pendingStart`/`hoverDate` state and a `displayRange` computed value, used by `DayCell` (now interactive) and, in Task 5, by the badge/presets.

- [ ] **Step 1: Add the failing tests**

Append to `date-range-picker.test.tsx`, inside the existing `describe("DateRangePicker", ...)` block:

```tsx
  it("commits a range on two clicks, in chronological order", () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker defaultMonth={new Date(2026, 8, 1)} onValueChange={onValueChange} />,
    );
    fireEvent.click(screen.getByRole("gridcell", { name: "10" }));
    fireEvent.click(screen.getByRole("gridcell", { name: "4" }));
    const [range] = onValueChange.mock.calls.at(-1)!;
    expect(range.start.getDate()).toBe(4);
    expect(range.end.getDate()).toBe(10);
  });

  it("shows a hover preview between the pending start and the hovered day", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 8, 1)} />);
    fireEvent.click(screen.getByRole("gridcell", { name: "4" }));
    fireEvent.pointerEnter(screen.getByRole("gridcell", { name: "8" }));
    expect(screen.getByRole("gridcell", { name: "6" }).getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("clamps the range at the first disabled day", () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        isDateDisabled={(d) => d.getDate() === 7}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole("gridcell", { name: "4" }));
    fireEvent.click(screen.getByRole("gridcell", { name: "10" }));
    const [range] = onValueChange.mock.calls.at(-1)!;
    expect(range.end.getDate()).toBe(6);
  });

  it("starts a fresh range when clicking again after a full range is set", () => {
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        defaultValue={{ start: new Date(2026, 8, 4), end: new Date(2026, 8, 10) }}
      />,
    );
    fireEvent.click(screen.getByRole("gridcell", { name: "20" }));
    expect(screen.getByRole("gridcell", { name: "20" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByRole("gridcell", { name: "6" }).getAttribute("aria-selected")).toBe(
      "false",
    );
  });

  it("does not select disabled or out-of-month days", () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        minDate={new Date(2026, 8, 5)}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole("gridcell", { name: "4" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
```

Add the `vi` import to the top of the file: change `import { afterEach, describe, expect, it } from "vitest";` to `import { afterEach, describe, expect, it, vi } from "vitest";`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter devignerui test -- date-range-picker.test.tsx`
Expected: FAIL. Day cells are currently plain `<div>`s with no `role="gridcell"` interactivity, no `aria-selected`, and no click handling, so every new test fails.

- [ ] **Step 3: Implement the selection state machine**

Replace the imports at the top of `date-range-picker.tsx`:

```tsx
import { motion, useReducedMotion } from "motion/react";
```

Add to the `../lib/date-range` import list: `clampRangeEnd`, `compareDays`, `isWithinRange`.

Add after the existing imports:

```tsx
import { useHoverCapable } from "../lib/hooks/use-hover-capable";
import { SPRING_LAYOUT } from "../lib/easing";
```

Inside `DateRangePicker`, after the existing `isDisabled` callback, add the selection state:

```tsx
  const [pendingStart, setPendingStart] = React.useState<Date | null>(null);
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);
  const canHover = useHoverCapable();
  const reduced = useReducedMotion();
  // Per-instance: a shared layoutId would make two pickers on one page swap
  // range highlights.
  const rangeId = React.useId();

  const handleDayClick = (date: Date) => {
    if (isDisabled(date)) return;
    if (pendingStart === null) {
      if (value !== null) setValue(null);
      setPendingStart(date);
      return;
    }
    const chronological =
      compareDays(date, pendingStart) < 0
        ? { start: date, end: pendingStart }
        : { start: pendingStart, end: date };
    const end = clampRangeEnd(chronological.start, chronological.end, isDisabled);
    setValue({ start: chronological.start, end });
    setPendingStart(null);
    setHoverDate(null);
  };

  const previewEnd =
    pendingStart && hoverDate && canHover
      ? clampRangeEnd(pendingStart, hoverDate, isDisabled)
      : null;

  const displayRange: DateRange | null = value
    ? value
    : pendingStart
      ? {
          start: compareDays(pendingStart, previewEnd ?? pendingStart) <= 0
            ? pendingStart
            : (previewEnd ?? pendingStart),
          end: compareDays(pendingStart, previewEnd ?? pendingStart) <= 0
            ? (previewEnd ?? pendingStart)
            : pendingStart,
        }
      : null;
```

Replace the `weeks.map` block's `DayCell` usage with:

```tsx
              <DayCell
                key={cell.date.getTime()}
                cell={cell}
                disabled={!cell.inMonth || isDisabled(cell.date)}
                isToday={isSameDay(cell.date, today)}
                isStart={!!displayRange && cell.inMonth && isSameDay(cell.date, displayRange.start)}
                isEnd={!!displayRange && cell.inMonth && isSameDay(cell.date, displayRange.end)}
                inRange={
                  !!displayRange && cell.inMonth && isWithinRange(cell.date, displayRange.start, displayRange.end)
                }
                rangeId={rangeId}
                reduced={!!reduced}
                onSelect={() => handleDayClick(cell.date)}
                onHoverStart={() => canHover && setHoverDate(cell.date)}
                onHoverEnd={() => canHover && setHoverDate(null)}
                className={classNames?.day}
              />
```

Replace the `DayCell` function entirely:

```tsx
function DayCell({
  cell,
  disabled,
  isToday,
  isStart,
  isEnd,
  inRange,
  rangeId,
  reduced,
  onSelect,
  onHoverStart,
  onHoverEnd,
  className,
}: {
  cell: MonthGridDay;
  disabled: boolean;
  isToday: boolean;
  isStart: boolean;
  isEnd: boolean;
  inRange: boolean;
  rangeId: string;
  reduced: boolean;
  onSelect: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  className?: string;
}) {
  if (!cell.inMonth) return <div aria-hidden="true" />;

  const endpoint = isStart || isEnd;
  const dayOfWeek = (cell.date.getDay() + 6) % 7; // Monday = 0

  return (
    <div
      role="gridcell"
      aria-label={String(cell.date.getDate())}
      aria-disabled={disabled}
      aria-selected={endpoint}
      className="relative grid h-10 place-items-center"
      onPointerEnter={disabled ? undefined : onHoverStart}
      onPointerLeave={disabled ? undefined : onHoverEnd}
    >
      {inRange && !disabled && (
        <motion.div
          layoutId={endpoint ? undefined : `${rangeId}-fill-${cell.date.getTime()}`}
          transition={reduced ? { duration: 0 } : SPRING_LAYOUT}
          className={cn(
            "absolute inset-y-0.5 inset-x-0 bg-accent/15",
            isStart && "rounded-l-full",
            isEnd && "rounded-r-full",
            dayOfWeek === 0 && !isStart && "rounded-l-full",
            dayOfWeek === 6 && !isEnd && "rounded-r-full",
          )}
        />
      )}
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={onSelect}
        className={cn(
          "relative z-10 grid size-8 cursor-pointer place-items-center rounded-full text-sm transition-colors",
          disabled
            ? "cursor-not-allowed text-text-tertiary/50"
            : "text-foreground hover:bg-surface-hover",
          endpoint && "bg-accent text-accent-foreground hover:bg-accent",
          className,
        )}
      >
        {cell.date.getDate()}
      </button>
      {isToday && !endpoint && (
        <span className="absolute bottom-0.5 size-1 rounded-full bg-text-tertiary" />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter devignerui test -- date-range-picker.test.tsx`
Expected: PASS, all 10 tests green (5 from Task 2, 5 new).

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/date-range-picker.tsx packages/ui/src/components/date-range-picker.test.tsx
git commit -m "feat(ui): add DateRangePicker click/hover range selection"
```

---

### Task 4: Keyboard navigation and accessibility

**Files:**
- Modify: `packages/ui/src/components/date-range-picker.tsx`
- Modify: `packages/ui/src/components/date-range-picker.test.tsx`

**Interfaces:**
- Consumes: `addDays` from `../lib/date-range`.
- Produces: roving tabindex across day cells (arrow keys, Home/End, PageUp/PageDown, Enter/Space), a live region announcing the committed range.

- [ ] **Step 1: Add the failing tests**

Append to `date-range-picker.test.tsx`:

```tsx
  it("moves focus with arrow keys and selects with Enter", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 8, 1)} />);
    const day4 = screen.getByRole("gridcell", { name: "4" }).querySelector("button")!;
    day4.focus();
    fireEvent.keyDown(day4, { key: "ArrowRight" });
    const day5 = screen.getByRole("gridcell", { name: "5" }).querySelector("button")!;
    expect(document.activeElement).toBe(day5);
    fireEvent.keyDown(day5, { key: "Enter" });
    expect(screen.getByRole("gridcell", { name: "5" }).getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("announces the committed range in a live region", () => {
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        defaultValue={{ start: new Date(2026, 8, 4), end: new Date(2026, 8, 25) }}
      />,
    );
    expect(screen.getByText(/Check-in September 4, check-out September 25, 21 nights/)).toBeTruthy();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter devignerui test -- date-range-picker.test.tsx`
Expected: FAIL. Every day button currently has `tabIndex={-1}` with no keydown handling, and there is no live region yet.

- [ ] **Step 3: Implement keyboard navigation and the live region**

Add to the `../lib/date-range` import list in `date-range-picker.tsx`: `addDays`.

Inside `DateRangePicker`, after the `rangeId` declaration, add focus state and a ref map:

```tsx
  const [focusedDate, setFocusedDate] = React.useState<Date>(() => value?.start ?? today);
  const dayRefs = React.useRef(new Map<number, HTMLButtonElement>());

  React.useEffect(() => {
    dayRefs.current.get(startOfDay(focusedDate).getTime())?.focus();
  }, [focusedDate]);

  const moveFocus = (days: number) => {
    const next = addDays(focusedDate, days);
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) {
      setMonth(startOfMonth(next));
    }
    setFocusedDate(next);
  };

  const moveFocusMonths = (months: number) => {
    const next = addMonths(focusedDate, months);
    next.setDate(Math.min(focusedDate.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
    setMonth(startOfMonth(next));
    setFocusedDate(next);
  };

  const handleDayKeyDown = (date: Date, event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveFocus(1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveFocus(-1);
        break;
      case "ArrowDown":
        event.preventDefault();
        moveFocus(7);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveFocus(-7);
        break;
      case "Home":
        event.preventDefault();
        moveFocus(-((date.getDay() + 6) % 7));
        break;
      case "End":
        event.preventDefault();
        moveFocus(6 - ((date.getDay() + 6) % 7));
        break;
      case "PageUp":
        event.preventDefault();
        moveFocusMonths(-1);
        break;
      case "PageDown":
        event.preventDefault();
        moveFocusMonths(1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        handleDayClick(date);
        break;
    }
  };

  const liveMessage = value
    ? `Check-in ${formatFullDate(value.start)}, check-out ${formatFullDate(value.end)}, ${nightsBetween(value.start, value.end)} nights`
    : "";
```

Add a small helper near the other format helpers at the top of the file:

```tsx
const formatFullDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
```

Add `nightsBetween` to the `../lib/date-range` import list.

Update the `DayCell` usage inside the `weeks.map` block to pass focus wiring:

```tsx
                isFocused={isSameDay(cell.date, focusedDate)}
                onFocusable={(el) => {
                  if (el) dayRefs.current.set(cell.date.getTime(), el);
                  else dayRefs.current.delete(cell.date.getTime());
                }}
                onKeyDown={(event) => handleDayKeyDown(cell.date, event)}
```

Update the `DayCell` function's props and its `<button>` to use roving tabindex and forward the ref/keydown:

```tsx
function DayCell({
  cell,
  disabled,
  isToday,
  isStart,
  isEnd,
  inRange,
  isFocused,
  rangeId,
  reduced,
  onSelect,
  onHoverStart,
  onHoverEnd,
  onFocusable,
  onKeyDown,
  className,
}: {
  cell: MonthGridDay;
  disabled: boolean;
  isToday: boolean;
  isStart: boolean;
  isEnd: boolean;
  inRange: boolean;
  isFocused: boolean;
  rangeId: string;
  reduced: boolean;
  onSelect: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onFocusable: (el: HTMLButtonElement | null) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  className?: string;
}) {
  if (!cell.inMonth) return <div aria-hidden="true" />;

  const endpoint = isStart || isEnd;
  const dayOfWeek = (cell.date.getDay() + 6) % 7;

  return (
    <div
      role="gridcell"
      aria-label={String(cell.date.getDate())}
      aria-disabled={disabled}
      aria-selected={endpoint}
      className="relative grid h-10 place-items-center"
      onPointerEnter={disabled ? undefined : onHoverStart}
      onPointerLeave={disabled ? undefined : onHoverEnd}
    >
      {inRange && !disabled && (
        <motion.div
          layoutId={endpoint ? undefined : `${rangeId}-fill-${cell.date.getTime()}`}
          transition={reduced ? { duration: 0 } : SPRING_LAYOUT}
          className={cn(
            "absolute inset-y-0.5 inset-x-0 bg-accent/15",
            isStart && "rounded-l-full",
            isEnd && "rounded-r-full",
            dayOfWeek === 0 && !isStart && "rounded-l-full",
            dayOfWeek === 6 && !isEnd && "rounded-r-full",
          )}
        />
      )}
      <button
        ref={onFocusable}
        type="button"
        tabIndex={isFocused ? 0 : -1}
        disabled={disabled}
        onClick={onSelect}
        onKeyDown={onKeyDown}
        className={cn(
          "relative z-10 grid size-8 cursor-pointer place-items-center rounded-full text-sm transition-colors",
          disabled
            ? "cursor-not-allowed text-text-tertiary/50"
            : "text-foreground hover:bg-surface-hover",
          endpoint && "bg-accent text-accent-foreground hover:bg-accent",
          className,
        )}
      >
        {cell.date.getDate()}
      </button>
      {isToday && !endpoint && (
        <span className="absolute bottom-0.5 size-1 rounded-full bg-text-tertiary" />
      )}
    </div>
  );
}
```

Add the live region just before the closing `</div>` of the component's root:

```tsx
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter devignerui test -- date-range-picker.test.tsx`
Expected: PASS, all 12 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/date-range-picker.tsx packages/ui/src/components/date-range-picker.test.tsx
git commit -m "feat(ui): add DateRangePicker keyboard navigation and live region"
```

---

### Task 5: Presets, badge, and clear

**Files:**
- Modify: `packages/ui/src/components/date-range-picker.tsx`
- Modify: `packages/ui/src/components/date-range-picker.test.tsx`

**Interfaces:**
- Consumes: `SPRING_SWAP` from `../lib/easing` (already imports `SPRING_LAYOUT`, `SPRING_PRESS`).
- Produces: an optional presets row (rendered only when `presets` is passed), an optional badge (rendered only when `renderBadge` is passed), an optional Clear action (rendered only when `onClear` is passed).

- [ ] **Step 1: Add the failing tests**

Append to `date-range-picker.test.tsx`:

```tsx
  it("applies a preset's range and highlights the active preset", () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        defaultValue={{ start: new Date(2026, 8, 4), end: new Date(2026, 8, 6) }}
        onValueChange={onValueChange}
        presets={[
          {
            id: "week",
            label: "1 week",
            getRange: (anchor) => ({ start: anchor, end: addDaysForTest(anchor, 7) }),
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "1 week" }));
    const [range] = onValueChange.mock.calls.at(-1)!;
    expect(range.end.getDate()).toBe(11);
    expect(screen.getByRole("button", { name: "1 week" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("renders a badge via renderBadge and updates it with the range", () => {
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        defaultValue={{ start: new Date(2026, 8, 4), end: new Date(2026, 8, 25) }}
        renderBadge={(range) => (range ? `${range.start.getDate()}-${range.end.getDate()}` : "Add dates")}
      />,
    );
    expect(screen.getByText("4-25")).toBeTruthy();
  });

  it("clears the range via onClear", () => {
    const onValueChange = vi.fn();
    const onClear = vi.fn();
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        defaultValue={{ start: new Date(2026, 8, 4), end: new Date(2026, 8, 25) }}
        onValueChange={onValueChange}
        onClear={onClear}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(null);
  });
```

Add a tiny local helper at the top of the test file (outside the `describe` block), since the test data needs its own date arithmetic independent of the library under test:

```tsx
function addDaysForTest(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter devignerui test -- date-range-picker.test.tsx`
Expected: FAIL. There is no presets row, no badge, and no Clear button yet.

- [ ] **Step 3: Implement presets, badge, and clear**

Add `SPRING_SWAP` to the `../lib/easing` import list in `date-range-picker.tsx`.

Inside `DateRangePicker`, after the `liveMessage` declaration, add:

```tsx
  const [activePresetId, setActivePresetId] = React.useState<string | null>(null);

  const applyPreset = (preset: DateRangePreset) => {
    const anchor = value?.start ?? pendingStart ?? today;
    setValue(preset.getRange(anchor));
    setPendingStart(null);
    setHoverDate(null);
    setActivePresetId(preset.id);
  };

  const handleClear = () => {
    setValue(null);
    setPendingStart(null);
    setHoverDate(null);
    setActivePresetId(null);
    onClear?.();
  };
```

`handleDayClick` must clear `activePresetId` whenever the user picks manually, since a manual pick no longer matches any preset. Update its body: after `if (value !== null) setValue(null);` add `setActivePresetId(null);`, and after `setValue({ start: chronological.start, end });` add `setActivePresetId(null);`.

Add the badge to the header. Replace the header's opening `<div className={cn("flex items-center justify-between ...` block's outer wrapper so the badge sits alongside the check-in/check-out fields:

```tsx
      <div className={cn("flex items-center justify-between gap-3", classNames?.header)}>
        <div className="flex items-center gap-6 border-b border-border pb-4">
          <div>
            <div className={cn("text-xs font-medium tracking-wide text-text-tertiary uppercase", classNames?.label)}>
              {startLabel}
            </div>
            <div className="text-lg font-semibold text-foreground">
              {value ? formatShortDate(value.start) : "Add date"}
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className={cn("text-xs font-medium tracking-wide text-text-tertiary uppercase", classNames?.label)}>
              {endLabel}
            </div>
            <div className="text-lg font-semibold text-foreground">
              {value ? formatShortDate(value.end) : "Add date"}
            </div>
          </div>
        </div>
        {renderBadge && (
          <motion.div
            key={value ? `${value.start.getTime()}-${value.end.getTime()}` : "empty"}
            initial={reduced ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : SPRING_SWAP}
            className={cn(
              "rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-foreground",
              classNames?.badge,
            )}
          >
            {renderBadge(value)}
          </motion.div>
        )}
      </div>
```

(Remove the old standalone header `<div className={cn("flex items-center justify-between gap-6 border-b ...` block from Task 2, it's replaced by the block above.)

Add the presets/clear footer just before the closing `<div aria-live="polite" ...>` line:

```tsx
      {(presets?.length || onClear) && (
        <div className={cn("flex items-center justify-between gap-2 pt-4", classNames?.presets)}>
          <div className="flex flex-wrap gap-2">
            {presets?.map((preset) => {
              const active = activePresetId === preset.id;
              return (
                <motion.button
                  key={preset.id}
                  type="button"
                  aria-pressed={active}
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING_PRESS}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "relative rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-transparent bg-accent text-accent-foreground"
                      : "text-text-secondary hover:bg-surface-hover",
                    classNames?.presetButton,
                  )}
                >
                  {preset.label}
                </motion.button>
              );
            })}
          </div>
          {onClear && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "cursor-pointer text-xs font-medium text-text-tertiary transition-colors hover:text-foreground",
                classNames?.clearButton,
              )}
            >
              Clear
            </button>
          )}
        </div>
      )}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter devignerui test -- date-range-picker.test.tsx`
Expected: PASS, all 15 tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/date-range-picker.tsx packages/ui/src/components/date-range-picker.test.tsx
git commit -m "feat(ui): add DateRangePicker presets, badge, and clear"
```

---

### Task 6: Export from the package and verify the build

**Files:**
- Modify: `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: `DateRangePicker`, `DateRangePickerProps`, `DateRange`, `DateRangePreset`, `DateRangePickerClassNames`, `DateRangePickerSlotProps` from `./components/date-range-picker` (Task 5's final state).

- [ ] **Step 1: Add the export**

Append to `packages/ui/src/index.ts`:

```ts
export {
  DateRangePicker,
  type DateRangePickerProps,
  type DateRange,
  type DateRangePreset,
  type DateRangePickerClassNames,
  type DateRangePickerSlotProps,
} from "./components/date-range-picker";
```

- [ ] **Step 2: Run the full test suite**

Run: `pnpm --filter devignerui test`
Expected: PASS, every test file in the package green, including the new `date-range.test.ts` and `date-range-picker.test.tsx`.

- [ ] **Step 3: Run the linter**

Run: `pnpm --filter devignerui lint`
Expected: No errors. Fix any unused-import or unused-variable issues surfaced from the incremental edits in Tasks 3-5 before moving on.

- [ ] **Step 4: Build the package**

Run: `pnpm --filter devignerui build`
Expected: `tsup` succeeds with no type errors, and `dist/index.d.ts` includes the new `DateRangePicker` exports.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/index.ts
git commit -m "feat(ui): export DateRangePicker from the package"
```

---

## Self-Review Notes

- **Spec coverage:** value type (native `Date`, Task 1/2), controllable `value`/`month` (Task 2), presets as consumer data (Task 5), single accent color throughout (Tasks 2-5, no per-preset color), month navigation (Task 2), `minDate`/`maxDate`/`isDateDisabled` (Task 2 disabling, Task 3 clamping, Task 4 keyboard gating), selection state machine including hover preview and re-pick-after-full-range (Task 3), animation tokens `SPRING_LAYOUT`/`SPRING_SWAP`/`SPRING_PRESS` and reduced-motion accommodation (Tasks 3, 5), accessibility (`role="grid"`, roving tabindex, live region, Task 4), testing per the spec's list (Tasks 1, 3, 4, 5). Out-of-scope items (per-preset colors, multi-month, literal `TripDates` wrapper) are intentionally absent.
- **Type consistency:** `DateRange`, `DateRangePreset`, and the `classNames`/`slotProps` shapes are defined once in Task 2 and referenced identically in every later task; `isDisabled` (Task 2) is the single predicate threaded through Tasks 3 and 4.
