"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";
import { IconChevronLeft, IconChevronRight } from "@devigner-ui/icons";
import { SPRING_LAYOUT, SPRING_PRESS } from "../lib/easing";
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

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const formatShortDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const formatFullDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", day: "numeric" });

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
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick" | "defaultValue"> {
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

  const [pendingStart, setPendingStart] = React.useState<Date | null>(null);
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);
  const canHover = useHoverCapable();
  const reduced = useReducedMotion();
  // Per-instance: a shared layoutId would make two pickers on one page swap
  // range highlights.
  const rangeId = React.useId();
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
      case "Enter":
      case " ":
        event.preventDefault();
        handleDayClick(date);
        break;
    }
  };

  const liveMessage = value
    ? `${startLabel} ${formatFullDate(value.start)}, ${endLabel.toLowerCase()} ${formatFullDate(value.end)}, ${nightsBetween(value.start, value.end)} nights`
    : "";

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
          start:
            compareDays(pendingStart, previewEnd ?? pendingStart) <= 0
              ? pendingStart
              : (previewEnd ?? pendingStart),
          end:
            compareDays(pendingStart, previewEnd ?? pendingStart) <= 0
              ? (previewEnd ?? pendingStart)
              : pendingStart,
        }
      : null;

  const weeks = React.useMemo(() => getMonthGrid(month), [month]);

  const tabbableDate = React.useMemo(() => {
    const focusedInVisibleMonth =
      focusedDate.getMonth() === month.getMonth() &&
      focusedDate.getFullYear() === month.getFullYear();
    if (focusedInVisibleMonth && !isDisabled(focusedDate)) return focusedDate;
    return firstEnabledDayInMonth(month, isDisabled);
  }, [focusedDate, month, isDisabled]);

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
                isStart={!!displayRange && cell.inMonth && isSameDay(cell.date, displayRange.start)}
                isEnd={!!displayRange && cell.inMonth && isSameDay(cell.date, displayRange.end)}
                inRange={
                  !!displayRange &&
                  cell.inMonth &&
                  isWithinRange(cell.date, displayRange.start, displayRange.end)
                }
                isFocused={!!tabbableDate && isSameDay(cell.date, tabbableDate)}
                rangeId={rangeId}
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
        ))}
      </div>

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
  rangeId,
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
  rangeId: string;
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
  const dayOfWeek = (cell.date.getDay() + 6) % 7; // Monday = 0

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
      </button>
      {isToday && !endpoint && (
        <span className="absolute bottom-0.5 size-1 rounded-full bg-text-tertiary" />
      )}
    </div>
  );
}
