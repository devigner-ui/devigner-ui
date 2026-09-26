"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useHoverCapable } from "devignerui/hooks";
import { SPRING_PRESS } from "devignerui/motion";
import { WORDMARK_LARGE } from "./wordmark-glyphs";

// -0.06em tracking, in the glyphs' 1000-unit em.
const TRACK = -60;

/** The giant wordmark, pressed into the page, drawn from outlines so the
 *  logo face never loads as a webfont. A fine pointer makes the letter
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
        className="wordmark-pressed mb-[-0.07em] flex text-[27cqi]"
      >
        {WORDMARK_LARGE.map((glyph, i) => {
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
                  ? "block origin-bottom text-brand"
                  : "block origin-bottom"
              }
            >
              {/* 0.8em tall, like the old leading-[0.8] line box. */}
              <svg
                viewBox={`0 -730 ${glyph.w + TRACK} 800`}
                style={{ width: `${(glyph.w + TRACK) / 1000}em` }}
                className="block h-[0.8em] overflow-visible fill-current"
              >
                <path d={glyph.d} />
              </svg>
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
