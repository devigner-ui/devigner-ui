"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import { cn } from "../lib/utils";
import { useHoverCapable } from "../lib/hooks/use-hover-capable";
import { EASE_OUT, SPRING_PRESS } from "../lib/easing";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer rounded-lg text-sm/5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-border bg-transparent hover:bg-surface hover:text-foreground",
        secondary: "bg-surface text-foreground hover:bg-surface-hover",
        ghost: "hover:bg-surface hover:text-foreground",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 rounded-lg px-3 py-1.5",
        md: "h-10 rounded-lg px-4 py-2",
        lg: "h-11 rounded-lg px-8 py-2.5",
        icon: "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof buttonVariants> {
  /** Scale applied on press. */
  pressScale?: number;
  /** Spawn a Material-style ripple from the press point. Off by default. */
  ripple?: boolean;
  children?: React.ReactNode;
}

type Ripple = { id: number; x: number; y: number; size: number };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      pressScale = 0.96,
      ripple = false,
      onPointerDown,
      children,
      ...props
    },
    ref,
  ) => {
    const reduce = useReducedMotion();
    const canHover = useHoverCapable();
    const [ripples, setRipples] = React.useState<Ripple[]>([]);
    const nextId = React.useRef(0);

    const handlePointerDown = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        if (ripple && !reduce) {
          const rect = event.currentTarget.getBoundingClientRect();
          const rippleSize = Math.max(rect.width, rect.height) * 2;
          setRipples((prev) => [
            ...prev,
            {
              id: nextId.current++,
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              size: rippleSize,
            },
          ]);
        }
        onPointerDown?.(event);
      },
      [ripple, reduce, onPointerDown],
    );

    return (
      <motion.button
        ref={ref}
        whileTap={reduce ? undefined : { scale: pressScale }}
        whileHover={reduce || !canHover ? undefined : { scale: 1.02 }}
        transition={SPRING_PRESS}
        onPointerDown={handlePointerDown}
        className={cn(
          buttonVariants({ variant, size }),
          ripple && "relative overflow-hidden",
          className,
        )}
        {...props}
      >
        {ripple && !reduce ? (
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <AnimatePresence>
              {ripples.map((r) => (
                <motion.span
                  key={r.id}
                  className="absolute rounded-full bg-current"
                  style={{
                    left: r.x,
                    top: r.y,
                    width: r.size,
                    height: r.size,
                    x: "-50%",
                    y: "-50%",
                  }}
                  initial={{ scale: 0, opacity: 0.3 }}
                  animate={{ scale: 1, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, ease: EASE_OUT }}
                  onAnimationComplete={() =>
                    setRipples((prev) => prev.filter((x) => x.id !== r.id))
                  }
                />
              ))}
            </AnimatePresence>
          </span>
        ) : null}
        {children}
      </motion.button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
