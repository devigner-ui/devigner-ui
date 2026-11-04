// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MenuNotch, type MenuNotchSection } from "./menu-notch";

afterEach(cleanup);

const sections: MenuNotchSection[] = [
  { label: "Menu", size: "lg", links: [{ label: "About", href: "#about" }, { label: "Pricing", href: "#pricing" }] },
  { label: "Legal", links: [{ label: "Privacy Policy", href: "#privacy" }] },
];

describe("MenuNotch", () => {
  it("opens and closes from the toggle, and keeps the closed panel out of reach", () => {
    const changed = vi.fn();
    render(<MenuNotch sections={sections} onOpenChange={changed} />);
    const button = screen.getByRole("button", { name: "Menu" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("link", { name: "About" })).toBeNull();
    fireEvent.click(button);
    expect(changed).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("button", { name: "Close" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "About" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(changed).toHaveBeenLastCalledWith(false);
  });

  it("closes on Escape and on a press outside", () => {
    render(
      <div>
        <MenuNotch sections={sections} defaultOpen />
        <p>outside</p>
      </div>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Menu" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.pointerDown(screen.getByText("outside"));
    expect(screen.getByRole("button", { name: "Menu" })).toBeTruthy();
  });

  it("labels each group by its heading", () => {
    render(<MenuNotch sections={sections} defaultOpen />);
    expect(screen.getByRole("list", { name: "Legal" }).textContent).toContain("Privacy Policy");
  });

  it("shows the theme button only with onThemeChange, asking for the other theme", () => {
    const { rerender } = render(<MenuNotch sections={sections} />);
    expect(screen.queryByRole("button", { name: /theme/ })).toBeNull();
    const onTheme = vi.fn();
    rerender(<MenuNotch sections={sections} theme="dark" onThemeChange={onTheme} />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));
    expect(onTheme).toHaveBeenCalledWith("light");
  });
});

