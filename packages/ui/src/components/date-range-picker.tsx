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
