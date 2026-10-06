// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { StardustSlider } from "./stardust-slider";

// jsdom has no layout observers; the slider only needs them to exist.
const Observer = class {
  observe() {}
  disconnect() {}
};
beforeAll(() => {
  vi.stubGlobal("ResizeObserver", Observer);
  vi.stubGlobal("IntersectionObserver", Observer);
});
afterAll(() => vi.unstubAllGlobals());
afterEach(cleanup);

const slider = () => screen.getByRole("slider");
const now = () => slider().getAttribute("aria-valuenow");
const key = (k: string) => fireEvent.keyDown(slider(), { key: k });

describe("StardustSlider", () => {
  it("writes the value as a percent by default", () => {
    render(<StardustSlider label="Strike" defaultValue={28} />);
    expect(slider().getAttribute("aria-valuetext")).toBe("28%");
    expect(screen.getByRole("slider", { name: "Strike" })).toBeTruthy();
  });

  it("formats with Intl in the locale, groups included", () => {
    render(
      <StardustSlider
        aria-label="Budget"
        max={5000}
        defaultValue={1250}
        locale="de-DE"
        formatOptions={{ style: "currency", currency: "EUR" }}
      />,
    );
    expect(slider().getAttribute("aria-valuetext")).toBe(
      new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(1250),
    );
  });

  it("commits a typed value, clamped and rounded to step", () => {
    const onValueCommit = vi.fn();
    render(
      <StardustSlider label="Strike" defaultValue={28} step={5} onValueCommit={onValueCommit} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Type a value/ }));
    const field = screen.getByRole("textbox", { name: "Type a value" });
    fireEvent.change(field, { target: { value: "63" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(now()).toBe("65");
    expect(onValueCommit).toHaveBeenCalledWith(65);

    fireEvent.click(screen.getByRole("button", { name: /Type a value/ }));
    const again = screen.getByRole("textbox", { name: "Type a value" });
    fireEvent.change(again, { target: { value: "500" } });
    fireEvent.blur(again);
    expect(now()).toBe("100");

    fireEvent.click(screen.getByRole("button", { name: /Type a value/ }));
    const cancel = screen.getByRole("textbox", { name: "Type a value" });
    fireEvent.change(cancel, { target: { value: "10" } });
    fireEvent.keyDown(cancel, { key: "Escape" });
    expect(now()).toBe("100");
  });

  it("steps ten at a time with Shift, on the track and in the field", () => {
    const onValueCommit = vi.fn();
    render(<StardustSlider label="Strike" defaultValue={28} onValueCommit={onValueCommit} />);
    fireEvent.keyDown(slider(), { key: "ArrowUp", shiftKey: true });
    expect(now()).toBe("38");

    fireEvent.click(screen.getByRole("button", { name: /Type a value/ }));
    const field = screen.getByRole("textbox", { name: "Type a value" }) as HTMLInputElement;
    fireEvent.keyDown(field, { key: "ArrowUp" });
    fireEvent.keyDown(field, { key: "ArrowUp", shiftKey: true });
    expect(field.value).toBe("49");
    expect(now()).toBe("49");
    fireEvent.keyDown(field, { key: "ArrowDown" });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(now()).toBe("48");
    expect(onValueCommit).toHaveBeenLastCalledWith(48);

    // Escape puts back the value the field opened with, arrows included.
    fireEvent.click(screen.getByRole("button", { name: /Type a value/ }));
    const again = screen.getByRole("textbox", { name: "Type a value" });
    fireEvent.keyDown(again, { key: "ArrowUp", shiftKey: true });
    fireEvent.keyDown(again, { key: "Escape" });
    expect(now()).toBe("48");
  });

  it("swaps the horizontal arrows right-to-left", () => {
    render(<StardustSlider aria-label="Mix" dir="rtl" defaultValue={50} />);
    key("ArrowLeft");
    expect(now()).toBe("51");
    key("ArrowRight");
    key("ArrowRight");
    expect(now()).toBe("49");
  });

  it("steps by value on a log scale and stays in range", () => {
    render(
      <StardustSlider aria-label="Budget" scale="log" min={100} max={1000} step={100} defaultValue={100} />,
    );
    key("ArrowUp");
    expect(now()).toBe("200");
    key("End");
    key("ArrowUp");
    expect(now()).toBe("1000");
  });

  it("goes bare and vertical without the header", () => {
    render(
      <StardustSlider aria-label="Volume" variant="bare" orientation="vertical" defaultValue={10} />,
    );
    expect(slider().getAttribute("aria-orientation")).toBe("vertical");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
