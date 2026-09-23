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
