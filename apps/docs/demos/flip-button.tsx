"use client";

import { FlipButton } from "devignerui";
import { IconArrowRight } from "@devigner-ui/icons";

export default function FlipButtonDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <FlipButton iconRight={<IconArrowRight />}>Get started</FlipButton>
      <FlipButton variant="outline" iconRight={<IconArrowRight />}>
        Book a call
      </FlipButton>
      <FlipButton variant="inverse" iconRight={<IconArrowRight />}>
        Explore all
      </FlipButton>
    </div>
  );
}
