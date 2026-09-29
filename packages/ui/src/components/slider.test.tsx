// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Slider } from "./slider";

afterEach(cleanup);

const slider = () => screen.getByRole("slider");
const key = (k: string) => fireEvent.keyDown(slider(), { key: k });

describe("Slider", () => {
  it("steps, pages and jumps to the ends by keyboard", () => {
    render(<Slider aria-label="Heat" defaultValue={50} />);
    key("ArrowUp");
    expect(slider().getAttribute("aria-valuenow")).toBe("60");
    key("ArrowLeft");
    key("ArrowLeft");
    expect(slider().getAttribute("aria-valuenow")).toBe("40");
    key("PageUp");
    expect(slider().getAttribute("aria-valuenow")).toBe("50");
    key("End");
    key("ArrowUp");
    expect(slider().getAttribute("aria-valuenow")).toBe("100");
    key("Home");
    expect(slider().getAttribute("aria-valuenow")).toBe("0");
  });

  it("snaps fractional steps without float noise and clamps", () => {
    render(<Slider aria-label="Mix" min={0} max={1} step={0.1} defaultValue={0.2} />);
    key("ArrowUp");
    expect(slider().getAttribute("aria-valuenow")).toBe("0.3");
    render(<Slider aria-label="Out" value={140} />);
    expect(screen.getByRole("slider", { name: "Out" }).getAttribute("aria-valuenow")).toBe("100");
  });

  it("reports changes without moving when controlled", () => {
    const onValueChange = vi.fn();
    render(<Slider aria-label="Heat" value={20} onValueChange={onValueChange} />);
    key("ArrowUp");
    expect(onValueChange).toHaveBeenCalledWith(30);
    expect(slider().getAttribute("aria-valuenow")).toBe("20");
  });

  it("formats the value text and submits under name", () => {
    const { container } = render(
      <Slider aria-label="Temp" name="temp" defaultValue={72} format={(v) => `${v}°`} />,
    );
    expect(slider().getAttribute("aria-valuetext")).toBe("72°");
    const input = container.querySelector("input[name=temp]") as HTMLInputElement;
    expect(input.value).toBe("72");
  });

  it("reaches max when step doesn't divide the range", () => {
    render(<Slider aria-label="Heat" snap step={3} defaultValue={96} />);
    key("ArrowUp");
    expect(slider().getAttribute("aria-valuenow")).toBe("99");
    key("ArrowUp");
    expect(slider().getAttribute("aria-valuenow")).toBe("100");
    key("ArrowDown");
    expect(slider().getAttribute("aria-valuenow")).toBe("99");
    key("PageUp");
    expect(slider().getAttribute("aria-valuenow")).toBe("100");
  });

  it("puts a mark on each step", () => {
    const count = (props: React.ComponentProps<typeof Slider>) => {
      const { container, unmount } = render(
        <Slider aria-label="Heat" classNames={{ mark: "mark" }} {...props} />,
      );
      const n = container.querySelectorAll(".mark").length;
      unmount();
      return n;
    };
    expect(count({})).toBe(9); // 10, 20 ... 90
    expect(count({ step: 25 })).toBe(3);
    expect(count({ step: 30 })).toBe(3); // 30, 60, 90
    expect(count({ step: 1, max: 25 })).toBe(24);
    expect(count({ marks: false })).toBe(0);
  });

  it("drags with one pointer, snapped or free, and commits on release", () => {
    Element.prototype.setPointerCapture ??= () => {};
    Element.prototype.hasPointerCapture ??= () => false;
    const drag = (snap: boolean) => {
      const onValueCommit = vi.fn();
      render(<Slider aria-label="Heat" orientation="vertical" snap={snap} onValueCommit={onValueCommit} />);
      const root = slider().parentElement!.parentElement!;
      // 244px tall at md (44px): 200px of travel, ratio r sits at y = 222 - 200r.
      root.getBoundingClientRect = () => ({ top: 0, bottom: 244, height: 244, left: 0, width: 44 }) as DOMRect;
      const at = (r: number) => 222 - 200 * r;
      fireEvent.pointerDown(root, { button: 0, pointerId: 1, clientY: at(0.5) });
      expect(slider().getAttribute("aria-valuenow")).toBe("50");
      fireEvent.pointerMove(root, { pointerId: 1, clientY: at(0.734) });
      // A second finger neither takes over nor moves the value.
      fireEvent.pointerDown(root, { button: 0, pointerId: 2, clientY: at(0) });
      fireEvent.pointerMove(root, { pointerId: 2, clientY: at(0) });
      fireEvent.pointerUp(root, { pointerId: 2 });
      expect(onValueCommit).not.toHaveBeenCalled();
      fireEvent.pointerUp(root, { pointerId: 1 });
      const v = slider().getAttribute("aria-valuenow");
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      expect(onValueCommit).toHaveBeenCalledWith(Number(v));
      cleanup();
      return v;
    };
    expect(drag(true)).toBe("70");
    expect(drag(false)).toBe("73");
  });

  it("commits key presses only when the value changes", () => {
    const onValueCommit = vi.fn();
    render(<Slider aria-label="Heat" defaultValue={90} onValueCommit={onValueCommit} />);
    key("ArrowUp");
    key("ArrowUp");
    expect(onValueCommit).toHaveBeenCalledTimes(1);
    expect(onValueCommit).toHaveBeenCalledWith(100);
  });

  it("steps from the current value when free", () => {
    render(<Slider aria-label="Heat" snap={false} step={10} defaultValue={43} />);
    key("ArrowUp");
    expect(slider().getAttribute("aria-valuenow")).toBe("53");
  });

  it("swaps the arrows that follow the screen when inverted", () => {
    render(<Slider aria-label="V" inverted orientation="vertical" defaultValue={50} />);
    render(<Slider aria-label="H" inverted defaultValue={50} />);
    const v = screen.getByRole("slider", { name: "V" });
    const h = screen.getByRole("slider", { name: "H" });
    fireEvent.keyDown(v, { key: "ArrowUp" });
    fireEvent.keyDown(h, { key: "ArrowRight" });
    fireEvent.keyDown(h, { key: "ArrowUp" });
    expect(v.getAttribute("aria-valuenow")).toBe("40");
    expect(h.getAttribute("aria-valuenow")).toBe("50");
  });

  it("drops marks when too dense, keeps them apart from snap, and takes a px size", () => {
    const { container } = render(
      <Slider aria-label="Heat" step={2} size={50} classNames={{ mark: "mark" }} />,
    );
    expect(container.querySelectorAll(".mark").length).toBe(0);
    expect((container.firstChild as HTMLElement).style.height).toBe("50px");
    cleanup();
    const free = render(<Slider aria-label="Heat" snap={false} classNames={{ mark: "mark" }} />);
    expect(free.container.querySelectorAll(".mark").length).toBe(9);
  });

  it("ignores keys while disabled", () => {
    render(<Slider aria-label="Heat" defaultValue={10} disabled />);
    key("ArrowUp");
    expect(slider().getAttribute("aria-valuenow")).toBe("10");
    expect(slider().getAttribute("tabindex")).toBe("-1");
  });
});
