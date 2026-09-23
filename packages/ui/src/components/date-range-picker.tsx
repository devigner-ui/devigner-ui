"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";
import { IconChevronLeft, IconChevronRight } from "@devigner-ui/icons";
import { SPRING_LAYOUT, SPRING_PRESS, SPRING_SWAP } from "../lib/easing";
import { useControllableState } from "../lib/hooks/use-controllable-state";
import { useHoverCapable } from "../lib/hooks/use-hover-capable";
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
  type MonthGridDay,
} from "../lib/date-range";

const WEEKDAYS = [
  ["M", "Monday"],
  ["T", "Tuesday"],
  ["W", "Wednesday"],
  ["T", "Thursday"],
  ["F", "Friday"],
  ["S", "Saturday"],
  ["S", "Sunday"],
] as const;

// Matches the fill's rendered height (h-10 row minus inset-y-0.5), set via
// style so motion can scale-correct the corners during layout animation.
const FILL_RADIUS = 18;

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const formatShortDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const formatFullDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", day: "numeric" });

const formatNights = (nights: number) => `${nights} ${nights === 1 ? "night" : "nights"}`;

/** First non-disabled day of the month containing `monthAnchor`, or null if
 *  every day in that month is disabled. Used both for the roving-tabindex
 *  fallback and for PageUp/PageDown landing on a disabled same-day-of-month. */
function firstEnabledDayInMonth(
  monthAnchor: Date,
  isDisabled: (date: Date) => boolean,
): Date | null {
  const first = startOfMonth(monthAnchor);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  for (let i = 0; i < daysInMonth; i++) {
    const candidate = addDays(first, i);
    if (!isDisabled(candidate)) return candidate;
  }
  return null;
}

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
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue"> {
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
  reduced,
  children,
  className,
  ...rest
}: { label: string; reduced: boolean } & React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={reduced ? undefined : { scale: 0.92 }}
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

  const [pendingStart, setPendingStart] = React.useState<Date | null>(null);
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);
  const canHover = useHoverCapable();
  const reduced = useReducedMotion();
  // Per-instance: a shared layoutId would make two pickers on one page swap
  // range highlights.
  const rangeId = React.useId();
  const presetsId = React.useId();
  const today = React.useMemo(() => startOfDay(new Date()), []);

  const [focusedDate, setFocusedDate] = React.useState<Date>(() => value?.start ?? today);
  const dayRefs = React.useRef(new Map<number, HTMLButtonElement>());
  // ponytail: only keyboard navigation should steal DOM focus; mount and
  // mouse/programmatic focus just update state so roving tabindex stays in
  // sync without yanking focus around.
  const focusFromKeyboard = React.useRef(false);

  React.useEffect(() => {
    if (!focusFromKeyboard.current) return;
    focusFromKeyboard.current = false;
    dayRefs.current.get(startOfDay(focusedDate).getTime())?.focus();
  }, [focusedDate]);

  const moveFocus = (from: Date, days: number) => {
    const direction = days < 0 ? -1 : 1;
    let next = addDays(from, days);
    let attempts = 0;
    while (isDisabled(next) && attempts < 42) {
      next = addDays(next, direction);
      attempts++;
    }
    if (isDisabled(next)) return;
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) {
      setMonth(startOfMonth(next));
    }
    focusFromKeyboard.current = true;
    setFocusedDate(next);
  };

  const moveFocusMonths = (from: Date, months: number) => {
    const next = addMonths(from, months);
    const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(from.getDate(), daysInMonth));
    const target = isDisabled(next) ? firstEnabledDayInMonth(next, isDisabled) : next;
    if (!target) return;
    setMonth(startOfMonth(target));
    focusFromKeyboard.current = true;
    setFocusedDate(target);
  };

  const handleDayKeyDown = (date: Date, event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveFocus(date, 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveFocus(date, -1);
        break;
      case "ArrowDown":
        event.preventDefault();
        moveFocus(date, 7);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveFocus(date, -7);
        break;
      case "Home":
        event.preventDefault();
        moveFocus(date, -((date.getDay() + 6) % 7));
        break;
      case "End":
        event.preventDefault();
        moveFocus(date, 6 - ((date.getDay() + 6) % 7));
        break;
      case "PageUp":
        event.preventDefault();
        moveFocusMonths(date, -1);
        break;
      case "PageDown":
        event.preventDefault();
        moveFocusMonths(date, 1);
        break;
    }
  };

  const liveMessage = value
    ? `${startLabel} ${formatFullDate(value.start)}, ${endLabel.toLowerCase()} ${formatFullDate(value.end)}, ${formatNights(nightsBetween(value.start, value.end))}`
    : "";

  // Tracks which preset was last applied and the exact range it produced, so
  // the highlight only shows while `value` still matches that range. A
  // controlled parent that ignores onValueChange, or later sets `value` to
  // something else, must not leave a stale preset highlighted.
  const [activePreset, setActivePreset] = React.useState<{ id: string; range: DateRange } | null>(
    null,
  );

  const applyPreset = (preset: DateRangePreset) => {
    const anchor = value?.start ?? pendingStart ?? today;
    const raw = preset.getRange(anchor);
    let start = startOfDay(raw.start);
    let end = startOfDay(raw.end);
    if (compareDays(start, end) > 0) [start, end] = [end, start];
    if (isDisabled(start)) return;
    const range = { start, end: clampRangeEnd(start, end, isDisabled) };
    setValue(range);
    const rangeMonth = startOfMonth(start);
    if (rangeMonth.getTime() !== month.getTime()) setMonth(rangeMonth);
    setPendingStart(null);
    setHoverDate(null);
    setActivePreset({ id: preset.id, range });
  };

  const handleClear = () => {
    setValue(null);
    setPendingStart(null);
    setHoverDate(null);
    setActivePreset(null);
    onClear?.();
  };

  const handleDayClick = (date: Date) => {
    if (isDisabled(date)) return;
    if (pendingStart === null) {
      if (value !== null) setValue(null);
      setPendingStart(date);
      setActivePreset(null);
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
    setActivePreset(null);
  };

  const previewEnd =
    pendingStart && hoverDate && canHover
      ? clampRangeEnd(pendingStart, hoverDate, isDisabled)
      : null;

  // A pending start wins over `value` so a controlled parent that only
  // accepts complete ranges still sees the first click reflected.
  const previewOther = previewEnd ?? pendingStart;
  const displayRange: DateRange | null =
    pendingStart && previewOther
      ? compareDays(pendingStart, previewOther) <= 0
        ? { start: pendingStart, end: previewOther }
        : { start: previewOther, end: pendingStart }
      : value;
  const headerStart = pendingStart ?? value?.start ?? null;
  const headerEnd = pendingStart ? null : (value?.end ?? null);

  const weeks = React.useMemo(() => getMonthGrid(month), [month]);

  const tabbableDate = React.useMemo(() => {
    const focusedInVisibleMonth =
      focusedDate.getMonth() === month.getMonth() &&
      focusedDate.getFullYear() === month.getFullYear();
    if (focusedInVisibleMonth && !isDisabled(focusedDate)) return focusedDate;
    return firstEnabledDayInMonth(month, isDisabled);
  }, [focusedDate, month, isDisabled]);

  const monthTime = startOfMonth(month).getTime();
  const atMinMonth = minDate !== undefined && monthTime <= startOfMonth(minDate).getTime();
  const atMaxMonth = maxDate !== undefined && monthTime >= startOfMonth(maxDate).getTime();

  return (
    <div
      {...slotProps?.root}
      className={cn(
        "w-fit rounded-3xl border border-border bg-surface p-5",
        slotProps?.root?.className,
        className,
        classNames?.root,
      )}
      {...rest}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b border-border pb-4",
          classNames?.header,
        )}
      >
        <div className="flex items-center gap-6">
          <div>
            <div className={cn("text-xs font-medium tracking-wide text-text-tertiary uppercase", classNames?.label)}>
              {startLabel}
            </div>
            <div className="text-lg font-semibold text-foreground">
              {headerStart ? formatShortDate(headerStart) : "Add date"}
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className={cn("text-xs font-medium tracking-wide text-text-tertiary uppercase", classNames?.label)}>
              {endLabel}
            </div>
            <div className="text-lg font-semibold text-foreground">
              {headerEnd ? formatShortDate(headerEnd) : "Add date"}
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
              "rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent",
              classNames?.badge,
            )}
          >
            {renderBadge(value)}
          </motion.div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 pb-2">
        <motion.div
          key={monthTime}
          initial={reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : SPRING_SWAP}
          className="text-sm font-semibold text-foreground"
        >
          {formatMonthLabel(month)}
        </motion.div>
        <div className="flex items-center gap-1">
          <NavButton
            label="Previous month"
            reduced={!!reduced}
            disabled={atMinMonth}
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <IconChevronLeft className="size-4" strokeWidth={2.5} />
          </NavButton>
          <NavButton
            label="Next month"
            reduced={!!reduced}
            disabled={atMaxMonth}
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <IconChevronRight className="size-4" strokeWidth={2.5} />
          </NavButton>
        </div>
      </div>

      <div role="grid" aria-label={formatMonthLabel(month)} className={cn("select-none", classNames?.grid)}>
        <div role="row" className="grid grid-cols-7 text-center text-xs font-medium text-text-tertiary">
          {WEEKDAYS.map(([short, full]) => (
            <div key={full} role="columnheader" aria-label={full}>
              {short}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => {
          const inRangeCols = displayRange
            ? week.flatMap((cell, col) =>
                cell.inMonth && isWithinRange(cell.date, displayRange.start, displayRange.end)
                  ? [col]
                  : [],
              )
            : [];
          const first = inRangeCols[0];
          const last = inRangeCols.at(-1);
          const fill =
            displayRange && first !== undefined && last !== undefined
              ? {
                  first,
                  last,
                  roundLeft: first === 0 || isSameDay(week[first]!.date, displayRange.start),
                  roundRight: last === 6 || isSameDay(week[last]!.date, displayRange.end),
                }
              : null;
          return (
            <div role="row" key={wi} className="relative grid grid-cols-7">
              {fill && (
                <motion.div
                  aria-hidden="true"
                  layout
                  layoutId={`${rangeId}-row-${wi}`}
                  transition={reduced ? { duration: 0 } : SPRING_LAYOUT}
                  className="pointer-events-none absolute inset-y-0.5 bg-accent/15"
                  style={{
                    left: `${(fill.first / 7) * 100}%`,
                    width: `${((fill.last - fill.first + 1) / 7) * 100}%`,
                    borderTopLeftRadius: fill.roundLeft ? FILL_RADIUS : 0,
                    borderBottomLeftRadius: fill.roundLeft ? FILL_RADIUS : 0,
                    borderTopRightRadius: fill.roundRight ? FILL_RADIUS : 0,
                    borderBottomRightRadius: fill.roundRight ? FILL_RADIUS : 0,
                  }}
                />
              )}
              {week.map((cell) => (
                <DayCell
                  key={cell.date.getTime()}
                  cell={cell}
                  disabled={!cell.inMonth || isDisabled(cell.date)}
                  isToday={isSameDay(cell.date, today)}
                  isStart={!!displayRange && isSameDay(cell.date, displayRange.start)}
                  isEnd={!!displayRange && isSameDay(cell.date, displayRange.end)}
                  inRange={
                    !!displayRange &&
                    isWithinRange(cell.date, displayRange.start, displayRange.end)
                  }
                  isFocused={!!tabbableDate && isSameDay(cell.date, tabbableDate)}
                  reduced={!!reduced}
                  onSelect={() => handleDayClick(cell.date)}
                  onHoverStart={() => canHover && setHoverDate(cell.date)}
                  onHoverEnd={() => canHover && setHoverDate(null)}
                  onFocusDate={() => setFocusedDate(cell.date)}
                  onFocusable={(el) => {
                    if (el) dayRefs.current.set(cell.date.getTime(), el);
                    else dayRefs.current.delete(cell.date.getTime());
                  }}
                  onKeyDown={(event) => handleDayKeyDown(cell.date, event)}
                  className={classNames?.day}
                />
              ))}
            </div>
          );
        })}
      </div>

      {(presets?.length || onClear) && (
        <div className={cn("flex items-center justify-between gap-2 pt-4", classNames?.presets)}>
          <div className="flex flex-wrap gap-2">
            {presets?.map((preset) => {
              const active =
                !!value &&
                !!activePreset &&
                activePreset.id === preset.id &&
                isSameDay(value.start, activePreset.range.start) &&
                isSameDay(value.end, activePreset.range.end);
              return (
                <motion.button
                  key={preset.id}
                  type="button"
                  aria-pressed={active}
                  whileTap={reduced ? undefined : { scale: 0.96 }}
                  transition={SPRING_PRESS}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "relative rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-transparent text-accent-foreground"
                      : "text-text-secondary hover:bg-surface-hover",
                    classNames?.presetButton,
                  )}
                >
                  {active && (
                    <motion.span
                      aria-hidden="true"
                      layoutId={`${presetsId}-active`}
                      transition={reduced ? { duration: 0 } : SPRING_LAYOUT}
                      className="absolute inset-0 rounded-full bg-accent"
                    />
                  )}
                  <span className="relative">{preset.label}</span>
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

      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
    </div>
  );
}

function DayCell({
  cell,
  disabled,
  isToday,
  isStart,
  isEnd,
  inRange,
  isFocused,
  reduced,
  onSelect,
  onHoverStart,
  onHoverEnd,
  onFocusDate,
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
  reduced: boolean;
  onSelect: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onFocusDate: () => void;
  onFocusable: (el: HTMLButtonElement | null) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  className?: string;
}) {
  if (!cell.inMonth) return <div aria-hidden="true" />;

  const endpoint = isStart || isEnd;

  return (
    <div
      role="gridcell"
      aria-label={String(cell.date.getDate())}
      aria-disabled={disabled}
      aria-selected={inRange}
      className="relative grid h-10 place-items-center"
      onPointerEnter={disabled ? undefined : onHoverStart}
      onPointerLeave={disabled ? undefined : onHoverEnd}
    >
      <motion.button
        ref={onFocusable}
        type="button"
        whileTap={disabled || reduced ? undefined : { scale: 0.9 }}
        transition={SPRING_PRESS}
        tabIndex={isFocused ? 0 : -1}
        disabled={disabled}
        onClick={onSelect}
        onFocus={onFocusDate}
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
      </motion.button>
      {isToday && !endpoint && (
        <span className="absolute bottom-0.5 size-1 rounded-full bg-text-tertiary" />
      )}
    </div>
  );
}
