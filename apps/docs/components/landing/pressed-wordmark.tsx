"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useHoverCapable } from "devignerui/hooks";
import { SPRING_PRESS } from "devignerui/motion";

/** The giant wordmark, pressed into the page. A fine pointer makes the letter
 *  under it bow (its neighbours at half strength), then spring back. */
export function PressedWordmark() {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const [hovered, setHovered] = useState<number | null>(null);
  const live = canHover && !reduce;

  return (
    <div aria-hidden className="@container mt-20 select-none">
      <div
        onPointerLeave={() => setHovered(null)}
        className="wordmark-pressed mb-[-0.07em] font-display text-[27cqi] leading-[0.8] font-extrabold tracking-[-0.06em] whitespace-nowrap"
      >
        {[..."devigner."].map((letter, i) => {
          const distance = hovered === null ? Infinity : Math.abs(i - hovered);
          const k = !live ? 0 : distance === 0 ? 1 : distance === 1 ? 0.5 : 0;
          return (
            <motion.span
              key={i}
              onPointerEnter={() => live && setHovered(i)}
              animate={{ y: 10 * k, rotate: -5 * k }}
              transition={SPRING_PRESS}
              className={
                i === 8
                  ? "inline-block origin-bottom text-brand"
                  : "inline-block origin-bottom"
              }
            >
              {letter}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
