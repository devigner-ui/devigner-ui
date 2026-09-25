// @vitest-environment jsdom

import * as React from "react";
import { cleanup, render } from "@testing-library/react";
import { MotionConfig } from "motion/react";
import { afterEach, describe, expect, it } from "vitest";
import { Timeline } from "./timeline";

const steps = [
  { id: "draft", title: "Draft" },
  { id: "review", title: "Review" },
];

afterEach(cleanup);

// The rail's first point sits at the active dot's x: shifted off the rail
// normally, straight down it once reduced motion kicks in.
const railStart = (container: HTMLElement) =>
  container.querySelector("path")?.getAttribute("d")?.match(/^M([\d.]+)/)?.[1];

describe("reduced motion config", () => {
  it("lets an ancestor MotionConfig switch a component to its reduced branch", () => {
    const normal = render(
      <MotionConfig reducedMotion="never">
        <Timeline steps={steps} activeId="draft" />
      </MotionConfig>,
    );
    const moving = railStart(normal.container);
    cleanup();

    const reduced = render(
      <MotionConfig reducedMotion="always">
        <Timeline steps={steps} activeId="draft" />
      </MotionConfig>,
    );
    const still = railStart(reduced.container);

    expect(moving).toBeDefined();
    expect(still).toBeDefined();
    expect(Number(moving)).toBeGreaterThan(Number(still));
  });
});
