"use client";

import { useState } from "react";
import { Rating, type RatingSize } from "devignerui";

export const RATING_SIZES = ["sm", "md", "lg"] as const;

/** What the docs Settings panel drives; the gallery demo uses the defaults. */
export const RATING_DEFAULTS = {
  size: "lg" as RatingSize,
  half: true,
  clearable: false,
  readOnly: false,
  disabled: false,
};
export type RatingConfig = typeof RATING_DEFAULTS;

const WORDS = ["No rating", "Poor", "Fair", "Good", "Great", "Excellent"];

export default function RatingDemo(props: Partial<RatingConfig>) {
  const { size, half, clearable, readOnly, disabled } = { ...RATING_DEFAULTS, ...props };
  const [value, setValue] = useState(3.5);
  return (
    <div className="flex flex-col items-center gap-3">
      <Rating
        aria-label="Rate this component"
        value={value}
        onValueChange={setValue}
        step={half ? 0.5 : 1}
        size={size}
        clearable={clearable}
        readOnly={readOnly}
        disabled={disabled}
      />
      <div className="flex items-baseline gap-1.5 tabular-nums">
        <span className="text-[28px] font-semibold tracking-[-0.04em]">{half ? value : Math.round(value)}</span>
        <span className="text-[14px] font-medium text-text-muted">/ 5</span>
      </div>
      <p className="text-[13px] text-text-secondary">{WORDS[Math.ceil(half ? value : Math.round(value))]}</p>
    </div>
  );
}
