// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Rating } from "./rating";

afterEach(cleanup);

const slider = () => screen.getByRole("slider");
const key = (k: string) => fireEvent.keyDown(slider(), { key: k });
const now = () => slider().getAttribute("aria-valuenow");

describe("Rating", () => {
  it("steps by keyboard and clamps to the range", () => {
    render(<Rating aria-label="Rating" defaultValue={3} />);
    expect(slider().getAttribute("aria-valuetext")).toBe("3 out of 5");
    key("ArrowRight");
    key("ArrowRight");
    key("ArrowRight");
    expect(now()).toBe("5");
    key("Home");
    expect(now()).toBe("0");
    key("4");
    expect(now()).toBe("4");
    key("End");
    expect(now()).toBe("5");
  });

  it("moves in halves with step 0.5 and snaps odd values", () => {
    render(<Rating aria-label="Rating" step={0.5} defaultValue={3.3} />);
    expect(now()).toBe("3.5");
    key("ArrowLeft");
    expect(now()).toBe("3");
  });

  it("reports changes and ignores input when read-only", () => {
    const changed = vi.fn();
    const { rerender } = render(<Rating aria-label="Rating" onValueChange={changed} />);
    key("ArrowUp");
    expect(changed).toHaveBeenLastCalledWith(1);
    rerender(<Rating aria-label="Rating" value={2} readOnly onValueChange={changed} />);
    key("ArrowUp");
    expect(changed).toHaveBeenCalledTimes(1);
    expect(slider().getAttribute("aria-readonly")).toBe("true");
  });

  it("submits its value under name", () => {
    const { container } = render(<Rating aria-label="Rating" name="score" defaultValue={4} />);
    expect((container.querySelector('input[name="score"]') as HTMLInputElement).value).toBe("4");
  });
});
