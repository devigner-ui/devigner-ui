// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { FlickCardsSlider, type FlickCardsSliderItem } from "./flick-cards-slider";

afterEach(cleanup);

beforeAll(() => {
  // jsdom lays nothing out and has no pointer capture: give the deck a width
  // (a full flick is then 400px of drag) and stub the capture.
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, get: () => 200 });
  Element.prototype.setPointerCapture = () => {};
});

const items: FlickCardsSliderItem[] = ["A", "B", "C", "D", "E"].map((title) => ({
  image: `/${title}.jpg`,
  title,
  action: { label: `Buy ${title}` },
}));

const carousel = () => screen.getByRole("region");
const front = () => screen.getByRole("group").getAttribute("aria-label");
const deck = () => carousel().firstElementChild as HTMLElement;
const flick = (dx: number) => {
  fireEvent.pointerDown(deck(), { pointerId: 1, button: 0, clientX: 300 });
  fireEvent.pointerMove(deck(), { pointerId: 1, clientX: 300 + dx });
  fireEvent.pointerUp(deck(), { pointerId: 1, clientX: 300 + dx });
};

describe("FlickCardsSlider", () => {
  it("turns by arrow keys and loops around the deck", () => {
    const changed = vi.fn();
    render(<FlickCardsSlider items={items} onIndexChange={changed} />);
    expect(front()).toBe("1 of 5");
    fireEvent.keyDown(carousel(), { key: "ArrowLeft" });
    expect(front()).toBe("5 of 5");
    expect(changed).toHaveBeenLastCalledWith(4);
    fireEvent.keyDown(carousel(), { key: "ArrowRight" });
    fireEvent.keyDown(carousel(), { key: "ArrowRight" });
    expect(front()).toBe("2 of 5");
  });

  it("exposes only the front card and its action", () => {
    render(<FlickCardsSlider items={items} defaultIndex={2} />);
    expect(screen.getAllByRole("group")).toHaveLength(1);
    expect(screen.getByRole("button").textContent).toBe("Buy C");
  });

  it("flicks past a tenth of the span and springs back short of it", () => {
    render(<FlickCardsSlider items={items} />);
    flick(30);
    expect(front()).toBe("1 of 5");
    flick(50);
    expect(front()).toBe("5 of 5");
    flick(-50);
    flick(-50);
    expect(front()).toBe("2 of 5");
  });

  it("swallows the click that ends a drag", () => {
    const bought = vi.fn();
    render(<FlickCardsSlider items={[{ ...items[0]!, action: { label: "Buy", onClick: bought } }, items[1]!]} />);
    const button = screen.getByRole("button");
    fireEvent.pointerDown(button, { pointerId: 1, button: 0, clientX: 300 });
    fireEvent.pointerMove(button, { pointerId: 1, clientX: 320 });
    fireEvent.pointerUp(button, { pointerId: 1, clientX: 320 });
    fireEvent.click(button);
    expect(bought).not.toHaveBeenCalled();
    fireEvent.pointerDown(button, { pointerId: 2, button: 0, clientX: 300 });
    fireEvent.pointerUp(button, { pointerId: 2, clientX: 300 });
    fireEvent.click(button);
    expect(bought).toHaveBeenCalledTimes(1);
  });
});
