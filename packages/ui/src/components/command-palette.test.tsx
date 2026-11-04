// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommandPalette, type CommandPaletteItem } from "./command-palette";

afterEach(cleanup);

const field = () => screen.getByRole("combobox");
const key = (k: string) => fireEvent.keyDown(field(), { key: k });
// The row's text without its aria-hidden parts (the action word, key caps).
const active = () => {
  const row = screen.getAllByRole("option").find((o) => o.getAttribute("aria-selected") === "true");
  const copy = row?.cloneNode(true) as HTMLElement | undefined;
  copy?.querySelectorAll("[aria-hidden]").forEach((n) => n.remove());
  return copy?.textContent;
};

const setup = () => {
  const ran = vi.fn();
  const items: CommandPaletteItem[] = [
    { label: "Browse components", group: "General", onSelect: () => ran("browse") },
    { label: "Archived", group: "General", disabled: true },
    { label: "Request a component", group: "General", onSelect: () => ran("request") },
    {
      label: "Change theme",
      group: "Settings",
      items: [
        { label: "Light", onSelect: () => ran("light") },
        { label: "Dark", keywords: ["night"], onSelect: () => ran("dark") },
      ],
    },
  ];
  render(<CommandPalette items={items} hints={false} />);
  return ran;
};

describe("CommandPalette", () => {
  it("moves past disabled rows and loops", () => {
    setup();
    expect(active()).toBe("Browse components");
    key("ArrowDown");
    expect(active()).toBe("Request a component");
    key("ArrowDown");
    key("ArrowDown");
    expect(active()).toBe("Browse components");
    key("ArrowUp");
    expect(active()).toBe("Change theme");
  });

  it("opens a page, runs a row in it and returns to the top", () => {
    const ran = setup();
    key("ArrowUp");
    key("Enter");
    expect(screen.getByRole("button", { name: "Back from Change theme" })).toBeTruthy();
    key("ArrowDown");
    key("Enter");
    expect(ran).toHaveBeenCalledWith("dark");
    // The crumb fades out, so check the top page is back instead.
    expect(active()).toBe("Browse components");
  });

  it("goes back with Backspace and puts the active row back on the page row", () => {
    setup();
    key("ArrowUp");
    key("Enter");
    key("Backspace");
    expect(active()).toBe("Change theme");
  });

  it("searches nested pages and keywords, best match first", () => {
    const ran = setup();
    fireEvent.change(field(), { target: { value: "night" } });
    expect(active()).toContain("Dark");
    key("Enter");
    expect(ran).toHaveBeenCalledWith("dark");
  });

  it("names an empty search", () => {
    setup();
    fireEvent.change(field(), { target: { value: "zzz" } });
    expect(screen.getByRole("status").textContent).toBe('No commands match "zzz"');
  });

  it("clears the query on Escape before letting it bubble", () => {
    setup();
    const outer = vi.fn();
    document.addEventListener("keydown", outer);
    fireEvent.change(field(), { target: { value: "dark" } });
    key("Escape");
    expect((field() as HTMLInputElement).value).toBe("");
    expect(outer).not.toHaveBeenCalled();
    key("Escape");
    expect(outer).toHaveBeenCalledTimes(1);
    document.removeEventListener("keydown", outer);
  });

  it("calls onEscape only with nothing left to undo", () => {
    const onEscape = vi.fn();
    render(<CommandPalette items={[{ label: "Dark" }]} onEscape={onEscape} />);
    fireEvent.change(field(), { target: { value: "da" } });
    key("Escape");
    expect(onEscape).not.toHaveBeenCalled();
    key("Escape");
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("matches descriptions and runs a group action", () => {
    const clear = vi.fn();
    render(
      <CommandPalette
        items={[{ label: "Dynamic Island", description: "Overlays", group: "Recent" }]}
        groupActions={{ Recent: { label: "Clear", onSelect: clear } }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(clear).toHaveBeenCalled();
    fireEvent.change(field(), { target: { value: "overl" } });
    expect(active()).toContain("Dynamic Island");
  });
});
