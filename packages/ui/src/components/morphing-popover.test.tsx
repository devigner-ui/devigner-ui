// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MorphingPopover } from "./morphing-popover";

afterEach(cleanup);

// jsdom has no matchMedia; the glass asks it about reduced transparency.
beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
});

const setup = (onOpenChange = vi.fn()) => {
  render(
    <>
      <MorphingPopover label="Add note" onOpenChange={onOpenChange}>
        {(close) => (
          <form>
            <textarea aria-label="Note" />
            <button type="button" onClick={close}>Cancel</button>
          </form>
        )}
      </MorphingPopover>
      <button>Outside</button>
    </>,
  );
  return onOpenChange;
};
const trigger = () => screen.getByRole("button", { name: "Add note" });

describe("MorphingPopover", () => {
  it("opens into a named dialog and focuses its first field", () => {
    setup();
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger());
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("dialog", { name: "Add note" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Note" }));
  });

  it("closes from inside through the render prop and returns focus", () => {
    const changed = setup();
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(changed).toHaveBeenLastCalledWith(false);
    expect(document.activeElement).toBe(trigger());
  });

  it("closes on Escape and on a press outside", () => {
    const changed = setup();
    fireEvent.click(trigger());
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Note" }), { key: "Escape" });
    expect(changed).toHaveBeenLastCalledWith(false);
    fireEvent.click(trigger());
    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(changed).toHaveBeenLastCalledWith(false);
  });
});
