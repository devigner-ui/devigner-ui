// @vitest-environment jsdom

import * as React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DynamicIsland, IslandTimer, type DynamicIslandView } from "./dynamic-island";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const views: DynamicIslandView[] = [
  { id: "timer", label: "Focus session, 24 minutes left", content: <span>24:59</span> },
  { id: "call", label: "Incoming call from Mira Kahn", content: <button>Accept</button>, width: 320, height: 84 },
];

describe("DynamicIsland", () => {
  it("rests as an empty pill with nothing announced", () => {
    render(<DynamicIsland views={views} />);
    const region = screen.getByRole("region", { name: "Live activity" });
    expect(region.textContent).toBe("");
  });

  it("shows the chosen view and announces its label", () => {
    render(<DynamicIsland views={views} view="timer" />);
    expect(screen.getByText("24:59")).toBeTruthy();
    expect(screen.getByText("Focus session, 24 minutes left").getAttribute("aria-live")).toBe("polite");
  });

  it("hops through the resting pill between two views", () => {
    vi.useFakeTimers();
    const { rerender } = render(<DynamicIsland views={views} view="timer" />);
    rerender(<DynamicIsland views={views} view="call" />);
    // Resting: the old view is on its way out and nothing new is announced.
    expect(screen.getByText("", { selector: "[aria-live]" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
    expect(screen.getByText("Incoming call from Mira Kahn")).toBeTruthy();
  });

  it("switches straight across with hop off", () => {
    const { rerender } = render(<DynamicIsland views={views} view="timer" hop={false} />);
    rerender(<DynamicIsland views={views} view="call" hop={false} />);
    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
  });

  it("treats an unknown view as the resting pill", () => {
    render(<DynamicIsland views={views} view="missing" />);
    expect(screen.queryByText("24:59")).toBeNull();
  });
});

describe("IslandTimer", () => {
  it("counts down and pauses", () => {
    vi.useFakeTimers();
    render(<IslandTimer seconds={60} />);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("button", { name: "Pause timer" })).toBeTruthy();
    act(() => screen.getByRole("button", { name: "Pause timer" }).click());
    expect(screen.getByRole("button", { name: "Resume timer" })).toBeTruthy();
  });
});
