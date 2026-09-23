// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DateRangePicker } from "./date-range-picker";

beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
});

afterEach(cleanup);

function addDaysForTest(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

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

  it("disables Previous month when minDate is after the visible month", () => {
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        minDate={new Date(2026, 10, 15)}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Previous month" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("disables Next month at maxDate's month", () => {
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        maxDate={new Date(2026, 8, 20)}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Next month" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Previous month" }).hasAttribute("disabled"),
    ).toBe(false);
  });

  it("reports month changes to a controlled parent", () => {
    const onMonthChange = vi.fn();
    render(<DateRangePicker month={new Date(2026, 8, 1)} onMonthChange={onMonthChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    const [next] = onMonthChange.mock.calls.at(-1)!;
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(9);
    expect(next.getDate()).toBe(1);
  });

  it("shows the pending start when a controlled parent only accepts complete ranges", () => {
    function CompleteRangesOnly() {
      const [value, setValue] = React.useState<{ start: Date; end: Date }>({
        start: new Date(2026, 8, 4),
        end: new Date(2026, 8, 10),
      });
      return (
        <DateRangePicker
          defaultMonth={new Date(2026, 8, 1)}
          value={value}
          onValueChange={(r) => r && setValue(r)}
        />
      );
    }
    render(<CompleteRangesOnly />);
    fireEvent.click(screen.getByRole("gridcell", { name: "20" }).querySelector("button")!);
    expect(screen.getByRole("gridcell", { name: "20" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByRole("gridcell", { name: "6" }).getAttribute("aria-selected")).toBe(
      "false",
    );
    expect(screen.getByText("Sep 20")).toBeTruthy();
    expect(screen.getAllByText("Add date").length).toBe(1);

    fireEvent.click(screen.getByRole("gridcell", { name: "22" }).querySelector("button")!);
    expect(screen.getByText("Sep 22")).toBeTruthy();
    expect(screen.getByRole("gridcell", { name: "21" }).getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("labels weekday column headers with full names", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 8, 1)} />);
    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((h) => h.getAttribute("aria-label"))).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
  });

  it("merges slotProps.root className with className", () => {
    const { container } = render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        className="prop-class"
        slotProps={{ root: { className: "slot-class" } }}
      />,
    );
    const root = container.firstElementChild!;
    expect(root.classList.contains("prop-class")).toBe(true);
    expect(root.classList.contains("slot-class")).toBe(true);
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

  it("commits a range on two clicks, in chronological order", () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker defaultMonth={new Date(2026, 8, 1)} onValueChange={onValueChange} />,
    );
    fireEvent.click(screen.getByRole("gridcell", { name: "10" }).querySelector("button")!);
    fireEvent.click(screen.getByRole("gridcell", { name: "4" }).querySelector("button")!);
    const [range] = onValueChange.mock.calls.at(-1)!;
    expect(range.start.getDate()).toBe(4);
    expect(range.end.getDate()).toBe(10);
  });

  it("shows a hover preview between the pending start and the hovered day", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 8, 1)} />);
    fireEvent.click(screen.getByRole("gridcell", { name: "4" }).querySelector("button")!);
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
    fireEvent.click(screen.getByRole("gridcell", { name: "4" }).querySelector("button")!);
    fireEvent.click(screen.getByRole("gridcell", { name: "10" }).querySelector("button")!);
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
    fireEvent.click(screen.getByRole("gridcell", { name: "20" }).querySelector("button")!);
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
    fireEvent.click(screen.getByRole("gridcell", { name: "4" }).querySelector("button")!);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("moves focus with arrow keys and selects the focused day", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 8, 1)} />);
    const day4 = screen.getByRole("gridcell", { name: "4" }).querySelector("button")!;
    day4.focus();
    fireEvent.keyDown(day4, { key: "ArrowRight" });
    const day5 = screen.getByRole("gridcell", { name: "5" }).querySelector("button")!;
    expect(document.activeElement).toBe(day5);
    // Enter/Space rely on native button activation, which jsdom does not
    // synthesize from keydown, so activate the focused button directly.
    fireEvent.click(document.activeElement!);
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
    expect(
      screen.getByText(/Check-in September 4, check-out September 25, 21 nights/),
    ).toBeTruthy();
  });

  it("does not move focus off the page when the picker first renders", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 8, 1)} />);
    expect(document.activeElement).toBe(document.body);
  });

  it("makes exactly one day button tabbable when today is outside the visible month", () => {
    render(<DateRangePicker defaultMonth={new Date(2020, 0, 1)} />);
    const buttons = screen.getAllByRole("gridcell").flatMap((cell) => {
      const button = cell.querySelector("button");
      return button ? [button] : [];
    });
    const tabbable = buttons.filter((button) => button.tabIndex === 0);
    expect(tabbable.length).toBe(1);
    expect(tabbable[0]?.textContent).toBe("1");
  });

  it("skips a disabled day when arrowing to it", () => {
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        isDateDisabled={(d) => d.getDate() === 5}
      />,
    );
    const day4 = screen.getByRole("gridcell", { name: "4" }).querySelector("button")!;
    day4.focus();
    fireEvent.keyDown(day4, { key: "ArrowRight" });
    const day6 = screen.getByRole("gridcell", { name: "6" }).querySelector("button")!;
    expect(document.activeElement).toBe(day6);
  });

  it("moves focus by one week with ArrowDown and ArrowUp", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 8, 1)} />);
    const day4 = screen.getByRole("gridcell", { name: "4" }).querySelector("button")!;
    day4.focus();
    fireEvent.keyDown(day4, { key: "ArrowDown" });
    const day11 = screen.getByRole("gridcell", { name: "11" }).querySelector("button")!;
    expect(document.activeElement).toBe(day11);

    fireEvent.keyDown(day11, { key: "ArrowUp" });
    expect(document.activeElement).toBe(day4);
  });

  it("moves focus to the week's Monday with Home and Sunday with End", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 8, 1)} />);
    // September 10, 2026 is a Thursday; its week runs Monday the 7th to Sunday the 13th.
    const day10 = screen.getByRole("gridcell", { name: "10" }).querySelector("button")!;
    day10.focus();
    fireEvent.keyDown(day10, { key: "Home" });
    const day7 = screen.getByRole("gridcell", { name: "7" }).querySelector("button")!;
    expect(document.activeElement).toBe(day7);

    day10.focus();
    fireEvent.keyDown(day10, { key: "End" });
    const day13 = screen.getByRole("gridcell", { name: "13" }).querySelector("button")!;
    expect(document.activeElement).toBe(day13);
  });

  it("crosses the month boundary with ArrowRight and ArrowLeft", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 8, 1)} />);
    const day30 = screen.getByRole("gridcell", { name: "30" }).querySelector("button")!;
    day30.focus();
    fireEvent.keyDown(day30, { key: "ArrowRight" });
    expect(screen.getByText("October 2026")).toBeTruthy();
    const oct1 = screen.getByRole("gridcell", { name: "1" }).querySelector("button")!;
    expect(document.activeElement).toBe(oct1);

    fireEvent.keyDown(oct1, { key: "ArrowLeft" });
    expect(screen.getByText("September 2026")).toBeTruthy();
    const sept30 = screen.getByRole("gridcell", { name: "30" }).querySelector("button")!;
    expect(document.activeElement).toBe(sept30);
  });

  it("moves to the next month with PageDown, keeping the day of month", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 8, 1)} />);
    const day15 = screen.getByRole("gridcell", { name: "15" }).querySelector("button")!;
    day15.focus();
    fireEvent.keyDown(day15, { key: "PageDown" });
    expect(screen.getByText("October 2026")).toBeTruthy();
    const newDay15 = screen.getByRole("gridcell", { name: "15" }).querySelector("button")!;
    expect(document.activeElement).toBe(newDay15);
  });

  it("clamps PageDown to the last day of a shorter month", () => {
    render(<DateRangePicker defaultMonth={new Date(2026, 0, 1)} />);
    const day31 = screen.getByRole("gridcell", { name: "31" }).querySelector("button")!;
    day31.focus();
    fireEvent.keyDown(day31, { key: "PageDown" });
    expect(screen.getByText("February 2026")).toBeTruthy();
    const day28 = screen.getByRole("gridcell", { name: "28" }).querySelector("button")!;
    expect(document.activeElement).toBe(day28);
  });

  it("falls back to the first enabled day when PageDown lands on a disabled day", () => {
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 0, 1)}
        isDateDisabled={(d) => d.getMonth() === 1 && d.getDate() === 15}
      />,
    );
    const day15 = screen.getByRole("gridcell", { name: "15" }).querySelector("button")!;
    day15.focus();
    fireEvent.keyDown(day15, { key: "PageDown" });
    expect(screen.getByText("February 2026")).toBeTruthy();
    const feb1 = screen.getByRole("gridcell", { name: "1" }).querySelector("button")!;
    expect(document.activeElement).toBe(feb1);
  });

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

  it("clamps a preset's range at the first disabled day", () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        defaultValue={{ start: new Date(2026, 8, 4), end: new Date(2026, 8, 6) }}
        isDateDisabled={(d) => d.getMonth() === 8 && d.getDate() === 9}
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
    expect(range.start.getDate()).toBe(4);
    expect(range.end.getDate()).toBe(8);
    expect(screen.getByRole("button", { name: "1 week" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("ignores a preset whose start is disabled", () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        minDate={new Date(2026, 8, 10)}
        onValueChange={onValueChange}
        presets={[
          {
            id: "early",
            label: "Early",
            getRange: () => ({ start: new Date(2026, 8, 2), end: new Date(2026, 8, 12) }),
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Early" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("moves the visible month to a preset's range", () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        onValueChange={onValueChange}
        presets={[
          {
            id: "october",
            label: "October",
            getRange: () => ({ start: new Date(2026, 9, 8, 15), end: new Date(2026, 9, 5) }),
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "October" }));
    expect(screen.getByText("October 2026")).toBeTruthy();
    const [range] = onValueChange.mock.calls.at(-1)!;
    expect(range.start).toEqual(new Date(2026, 9, 5));
    expect(range.end).toEqual(new Date(2026, 9, 8));
    expect(screen.getByRole("button", { name: "October" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("uses the singular for a one-night range", () => {
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        defaultValue={{ start: new Date(2026, 8, 4), end: new Date(2026, 8, 5) }}
      />,
    );
    expect(screen.getByText(/check-out September 5, 1 night$/)).toBeTruthy();
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

  it("does not highlight a preset when a controlled parent ignores the change", () => {
    const fixedValue = { start: new Date(2026, 8, 4), end: new Date(2026, 8, 6) };
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        value={fixedValue}
        onValueChange={() => {}}
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
    expect(screen.getByRole("button", { name: "1 week" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("clears the active preset highlight after a manual day pick", () => {
    render(
      <DateRangePicker
        defaultMonth={new Date(2026, 8, 1)}
        defaultValue={{ start: new Date(2026, 8, 4), end: new Date(2026, 8, 6) }}
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
    expect(screen.getByRole("button", { name: "1 week" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    fireEvent.click(screen.getByRole("gridcell", { name: "20" }).querySelector("button")!);
    expect(screen.getByRole("button", { name: "1 week" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });
});
