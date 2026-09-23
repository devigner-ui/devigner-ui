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
});
