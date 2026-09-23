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
