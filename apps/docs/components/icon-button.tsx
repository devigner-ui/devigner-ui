"use client";

import { motion, AnimatePresence, type HTMLMotionProps } from "motion/react";
import { SPRING_PRESS, SPRING_SWAP } from "@devignerui/ui/lib/animations";

const sizes = {
  sm: { dim: "size-6", radius: "rounded-md" },
  md: { dim: "size-9", radius: "rounded-2xl" },
  round: { dim: "size-8", radius: "rounded-full" },
} as const;

/**
 * Icon button with fluid motion: springy press feedback, an active state
 * whose background scales in, and an optional `label` the button smoothly
 * expands to reveal while active (animated width, constant padding — no
 * layout-animation jank). Pass `iconKey` when the icon glyph can change
 * (e.g. theme, copied) so the swap rotates through.
 */
export function IconButton({
  active = false,
  size = "md",
  iconKey,
  label,
  className = "",
  children,
  ...props
}: Omit<HTMLMotionProps<"button">, "children"> & {
  active?: boolean;
  size?: keyof typeof sizes;
  iconKey?: string;
  label?: React.ReactNode;
  children?: React.ReactNode;
}) {
  // With a label the button keeps constant padding and square-ish collapsed
  // width (15px icon + 2×10.5px = 36px = size-9); only the label's width
  // animates, so nothing ever jumps.
  const hasLabel = label != null;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      transition={SPRING_PRESS}
      className={`relative flex shrink-0 cursor-pointer items-center justify-center transition-colors duration-300 ${sizes[size].radius} ${
        hasLabel ? "h-9 px-[10.5px]" : sizes[size].dim
      } ${
        active
          ? "text-forground"
          : "text-text-muted hover:bg-foreground/10 hover:text-foreground"
      } ${className}`}
      {...props}
    >
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={SPRING_SWAP}
            className="absolute inset-0 rounded-[inherit] bg-surface"
          />
        )}
      </AnimatePresence>
      {iconKey ? (
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={iconKey}
            initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.4, rotate: 90, opacity: 0 }}
            transition={SPRING_SWAP}
            className="relative z-10 inline-flex"
          >
            {children}
          </motion.span>
        </AnimatePresence>
      ) : (
        <span className="relative z-10 inline-flex">{children}</span>
      )}
      {hasLabel && (
        <motion.span
          initial={false}
          animate={{
            width: active ? "auto" : 0,
            opacity: active ? 1 : 0,
            marginLeft: active ? 6 : 0,
          }}
          transition={SPRING_SWAP}
          className="relative z-10 overflow-hidden whitespace-nowrap text-sm font-medium"
        >
          {label}
        </motion.span>
      )}
    </motion.button>
  );
}
