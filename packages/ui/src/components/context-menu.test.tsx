// @vitest-environment jsdom

import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextMenu, type ContextMenuEntry } from "./context-menu";

afterEach(cleanup);

const setup = () => {
  const ran = vi.fn();
  const items: ContextMenuEntry[] = [
    { label: "Open", onSelect: () => ran("open") },
    { label: "Rename", disabled: true },
    { label: "Duplicate", onSelect: () => ran("duplicate") },
    {
      label: "Move to",
      items: [
        { label: "Inbox", onSelect: () => ran("inbox") },
        { label: "Archive", onSelect: () => ran("archive") },
      ],
    },
    "separator",
    { label: "Delete", destructive: true, onSelect: () => ran("delete") },
  ];
  render(
    <ContextMenu items={items}>
      <button>File card</button>
    </ContextMenu>,
  );
  return ran;
};

const card = () => screen.getByRole("button", { name: "File card" });
const focused = () => (document.activeElement as HTMLElement | null)?.textContent;
const key = (k: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(document.activeElement as Element, { key: k, ...init });

describe("ContextMenu", () => {
  it("opens on right-click and runs a row", () => {
    const ran = setup();
    fireEvent.contextMenu(card(), { clientX: 40, clientY: 40 });
    const menu = screen.getByRole("menu", { name: "Actions" });
    expect(menu).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    expect(ran).toHaveBeenCalledWith("duplicate");
  });

  it("opens from the keyboard on the first row, skipping disabled rows", () => {
    setup();
    card().focus();
    key("F10", { shiftKey: true });
    expect(focused()).toBe("Open");
    key("ArrowDown");
    expect(focused()).toBe("Duplicate");
    key("End");
    expect(focused()).toBe("Delete");
    key("ArrowDown");
    expect(focused()).toBe("Open");
  });

  it("walks into a submenu and back with the arrow keys", () => {
    const ran = setup();
    card().focus();
    key("ContextMenu");
    key("m");
    expect(focused()).toBe("Move to");
    key("ArrowRight");
    expect(screen.getByRole("menu", { name: "Move to" })).toBeTruthy();
    expect(focused()).toBe("Inbox");
    key("ArrowLeft");
    expect(focused()).toBe("Move to");
    key("ArrowRight");
    key("ArrowDown");
    key("Enter");
    fireEvent.click(document.activeElement as Element);
    expect(ran).toHaveBeenCalledWith("archive");
  });

  it("closes on Escape and gives focus back", () => {
    setup();
    card().focus();
    key("F10", { shiftKey: true });
    expect(focused()).toBe("Open");
    act(() => {
      key("Escape");
    });
    expect(document.activeElement).toBe(card());
  });

  it("leaves the browser menu alone when disabled", () => {
    render(
      <ContextMenu items={[{ label: "Open" }]} disabled>
        <span>Area</span>
      </ContextMenu>,
    );
    const ev = fireEvent.contextMenu(screen.getByText("Area"));
    expect(ev).toBe(true);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
