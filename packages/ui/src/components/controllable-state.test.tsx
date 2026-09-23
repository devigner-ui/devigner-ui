// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChartCard } from "./chart-card";
import { DeleteButton } from "./delete-button";
import { Timeline } from "./timeline";

const chartData = [
  { id: "jan", label: "January", value: 120 },
  { id: "feb", label: "February", value: 240 },
  { id: "mar", label: "March", value: 180 },
];

const timelineSteps = [
  { id: "draft", title: "Draft" },
  { id: "review", title: "Review" },
  { id: "publish", title: "Publish" },
];

afterEach(cleanup);

describe("controllable component state", () => {
  it("keeps ChartCard selection controlled through rapid prop updates", () => {
    const onActiveChange = vi.fn();
    const { rerender } = render(
      <ChartCard data={chartData} activeId="jan" onActiveChange={onActiveChange} />,
    );

    const january = screen.getByRole("button", { name: "January: 120" });
    fireEvent.click(screen.getByRole("button", { name: "February: 240" }));

    expect(onActiveChange).toHaveBeenCalledWith("feb");
    expect(january.getAttribute("aria-pressed")).toBe("true");

    rerender(
      <ChartCard data={chartData} activeId="feb" onActiveChange={onActiveChange} />,
    );
    rerender(
      <ChartCard data={chartData} activeId="mar" onActiveChange={onActiveChange} />,
    );

    expect(january.getAttribute("aria-pressed")).toBe("false");
    expect(
      screen.getByRole("button", { name: "March: 180" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("requests Timeline changes without overwriting a controlled active ID", () => {
    const onActiveChange = vi.fn();
    const { rerender } = render(
      <Timeline
        steps={timelineSteps}
        activeId="draft"
        onActiveChange={onActiveChange}
      />,
    );

    const items = screen.getAllByRole("listitem");
    fireEvent.pointerEnter(items[1]);

    expect(onActiveChange).toHaveBeenCalledWith("review");
    expect(items[0].getAttribute("aria-current")).toBe("step");

    rerender(
      <Timeline
        steps={timelineSteps}
        activeId="review"
        onActiveChange={onActiveChange}
      />,
    );

    expect(screen.getAllByRole("listitem")[1].getAttribute("aria-current")).toBe("step");
  });

  it("renders only actionable ChartCard actions and honors disabled actions", () => {
    const inertSelect = vi.fn();
    const enabledSelect = vi.fn();

    render(
      <ChartCard
        data={chartData}
        actions={[
          { id: "inert", label: "Inert", icon: <span />, onSelect: undefined },
          {
            id: "disabled",
            label: "Disabled",
            icon: <span />,
            onSelect: inertSelect,
            disabled: true,
            badge: 3,
          },
          {
            id: "enabled",
            label: "Enabled",
            icon: <span />,
            onSelect: enabledSelect,
          },
        ]}
      />,
    );

    expect(screen.queryByRole("button", { name: "Inert" })).toBeNull();
    const disabled = screen.getByRole("button", { name: "Disabled" });
    expect(disabled.hasAttribute("disabled")).toBe(true);
    fireEvent.click(disabled);
    expect(inertSelect).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Enabled" }));
    expect(enabledSelect).toHaveBeenCalledTimes(1);
  });

  it("does not mutate controlled DeleteButton status", () => {
    const onStatusChange = vi.fn();
    const { rerender } = render(
      <DeleteButton status="idle" onStatusChange={onStatusChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onStatusChange).toHaveBeenCalledWith("armed");
    expect(screen.queryByRole("button", { name: "Confirm delete" })).toBeNull();

    rerender(<DeleteButton status="armed" onStatusChange={onStatusChange} />);
    expect(screen.getByRole("button", { name: "Confirm delete" })).toBeTruthy();
  });

  it("moves DeleteButton through async success", async () => {
    let resolveConfirmation!: () => void;
    const onStatusChange = vi.fn();
    const confirmation = new Promise<void>((resolve) => {
      resolveConfirmation = resolve;
    });

    render(
      <DeleteButton
        onConfirm={() => confirmation}
        onStatusChange={onStatusChange}
      />,
    );

    const tile = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(tile);
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect(onStatusChange).toHaveBeenLastCalledWith("pending");
    expect(tile.getAttribute("aria-busy")).toBe("true");

    resolveConfirmation();
    await waitFor(() => {
      expect(tile.getAttribute("aria-label")).toBe("Deleted");
    });
    expect(onStatusChange).toHaveBeenLastCalledWith("done");
  });

  it("returns DeleteButton to idle when async confirmation fails", async () => {
    const failure = new Error("Delete failed");
    const onError = vi.fn();

    render(
      <DeleteButton onConfirm={() => Promise.reject(failure)} onError={onError} />,
    );

    const tile = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(tile);
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => {
      expect(tile.getAttribute("aria-label")).toBe("Delete");
    });
    expect(onError).toHaveBeenCalledWith(failure);
  });
});
