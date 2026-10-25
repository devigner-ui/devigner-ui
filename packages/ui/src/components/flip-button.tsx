"use client";

import * as React from "react";
import { IconSpinner } from "@devigner-ui/icons";
import { cn } from "cn";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";
import { EASE_BACK_CSS } from "../lib/easing";

// A full-radius pill whose label flips up on hover, a copy rolling in from
// below, while the icon in its badge slides out one side as its copy enters
// from the other. A trailing icon is never bare: it sits in a `[data-badge]`
// disc the variant colors and the size scales. Sizes own the geometry, variants
// own color only.
//
// One custom property drives every moving part: `--flip` is 0 at rest and 1
// when flipped (hover, keyboard focus, or the `flipped` prop), and each part
// computes its transform from it. Tune with `--flip-duration` (450ms) and
// `--flip-stagger` (16.67ms, the icon's lag behind the label).

// Every variant carries the same transparent hairline. A borderless one left
// its border colour at currentColor, so switching to outline faded the new
// ring in from the label colour (a white flash) and the pill grew by 2px.
const BASE = cn(
  "inline-flex cursor-pointer items-center justify-center rounded-full border border-transparent font-medium whitespace-nowrap",
  "transition-[color,background-color,border-color,box-shadow,opacity,scale] duration-200 ease-out",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  "aria-disabled:pointer-events-none aria-disabled:opacity-50",
  "rtl:[--flip-x:-1]",
  "[&_[data-icon]>svg]:size-4",
);

const VARIANTS = {
  primary: cn(
    "bg-primary text-primary-foreground hover:bg-accent-hover",
    "**:data-badge:bg-primary-foreground **:data-badge:text-primary",
  ),
  secondary: cn(
    "bg-secondary text-secondary-foreground hover:bg-surface-hover",
    "**:data-badge:bg-foreground **:data-badge:text-background",
  ),
  // Hairline ring and a primary disc. Hover is a primary tint, not a grey
  // fill, and the disc deepens so the accent brightens instead of the
  // surface going flat.
  outline: cn(
    "border-border-hover bg-transparent text-foreground",
    "hover:border-primary/30 hover:bg-primary/6",
    "**:data-badge:bg-primary **:data-badge:text-primary-foreground",
    "hover:**:data-badge:bg-accent-hover",
  ),
  // A faint fill with a lit top edge, so it reads as a raised surface over
  // busy grounds (images, gradients). Hover brightens glass, ring and edge;
  // the leading icon picks up the primary accent.
  glass: cn(
    "border-foreground/15 bg-foreground/4 text-foreground backdrop-blur-md",
    "shadow-[inset_0_1px_0_--alpha(var(--color-foreground)/8%)]",
    "hover:border-foreground/35 hover:bg-foreground/8 hover:shadow-[inset_0_1px_0_--alpha(var(--color-foreground)/14%)]",
    "**:data-icon:text-foreground/70 **:data-icon:transition-colors hover:**:data-icon:text-primary",
    "**:data-badge:bg-foreground **:data-badge:text-background",
  ),
  // The ground's opposite: dark on a light page, light on a dark one.
  inverse: cn(
    "bg-foreground text-background hover:bg-foreground/85",
    "**:data-badge:bg-background **:data-badge:text-foreground",
  ),
  ghost: cn(
    "bg-transparent text-foreground hover:bg-surface-hover",
    "**:data-badge:bg-primary **:data-badge:text-primary-foreground",
  ),
} as const;

// `has-[[data-badge]]` tightens the trailing padding so the disc sits inset
// against the edge.
const SIZES = {
  sm: "h-10 gap-2 px-4 text-sm has-[[data-badge]]:pr-1.5 [&_[data-badge]]:size-7 [&_[data-badge]_svg]:size-3.5",
  md: "h-12 gap-2.5 px-5 text-sm has-[[data-badge]]:pr-2 [&_[data-badge]]:size-8 [&_[data-badge]_svg]:size-4",
  lg: "h-16 gap-3 px-8 text-base has-[[data-badge]]:pr-3 [&_[data-badge]]:size-10 [&_[data-badge]_svg]:size-4.5",
  xl: "h-16 gap-4 px-8 text-lg has-[[data-badge]]:pr-2 [&_[data-badge]]:size-12 [&_[data-badge]_svg]:size-5",
  icon: "size-10",
  "icon-lg": "size-12",
} as const;

// Stretched pills keep the label centred, so the badge pins to the trailing
// edge instead of riding along beside the text.
const FULL_WIDTH =
  "relative w-full [&_[data-badge]]:absolute [&_[data-badge]]:top-1/2 [&_[data-badge]]:end-2 [&_[data-badge]]:-translate-y-1/2";

// What sets `--flip` to 1: the pointer and keyboard focus, or only the
// `flipped` prop once it is passed, so a state label is not shown early on hover.
const TRIGGER_HOVER = "hover:[--flip:1] focus-visible:[--flip:1]";
const TRIGGER_STATE = "data-flipped:[--flip:1]";

const F = "var(--flip, 0)";
const DIR = "var(--flip-dir, 1)";
const X = "var(--flip-x, 1)";
const STAGGER = "var(--flip-stagger, 16.67ms)";

// One curve and duration for label and icon. The icon trails the label by one
// 60Hz frame when it slides and by two when it turns, in and out alike. The
// curve is inline so it needs no theme variable in the installing project.
const roll = (transform: string, delay = "0ms"): React.CSSProperties => ({
  transform,
  transition: `transform var(--flip-duration, 450ms) ${EASE_BACK_CSS} ${delay}`,
});

export type FlipButtonVariant = keyof typeof VARIANTS;
export type FlipButtonSize = keyof typeof SIZES;
export type FlipButtonIconMotion = "slide" | "rotate" | "none";
export type FlipButtonDirection = "up" | "down";

export interface FlipButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The label. Text or richer content (a count, an icon) flips alike. */
  children?: React.ReactNode;
  /** The label that rolls in. Defaults to a copy of `children`. */
  flipLabel?: React.ReactNode;
  /** Holds the flip from state instead of hover: true shows `flipLabel`
   *  ("Copied", "Saved"). Once passed, hover and focus no longer flip. */
  flipped?: boolean;
  /** Which way the label rolls. Defaults to "up". */
  flipDirection?: FlipButtonDirection;
  /** Color scheme. Defaults to "primary". */
  variant?: FlipButtonVariant;
  /** Height, padding, text and badge size. Defaults to "md" (48px). */
  size?: FlipButtonSize;
  /** Stretches to the container; the label stays centred and the badge pins
   *  to the trailing edge. */
  fullWidth?: boolean;
  /** Renders its only child (a link, Next's Link) with the button's look and
   *  behavior instead of a button. */
  asChild?: boolean;
  /** Shows a spinner in the badge (or in place of the leading icon when there
   *  is no badge) and disables the button. */
  loading?: boolean;
  /** Leading icon, static. */
  iconLeft?: React.ReactNode;
  /** Trailing icon, set in a colored disc that rolls on hover. */
  iconRight?: React.ReactNode;
  /** How the disc's icon moves on hover: slides out as its copy enters
   *  (arrows, chevrons), turns 90deg (a plus), or stays put for a glyph that
   *  animates itself. Defaults to "slide". */
  iconMotion?: FlipButtonIconMotion;
  disabled?: boolean;
  className?: string;
}

/** The label and its copy stacked in one grid cell, so the button is as wide
 *  as the longer of the two, the copy parked one row away. The clip is
 *  vertical only, so a tight flex row cannot squeeze the text. */
function FlipLabel({
  children,
  copy,
  flipped,
}: {
  children: React.ReactNode;
  copy: React.ReactNode;
  flipped?: boolean;
}) {
  return (
    <span className="grid overflow-y-clip leading-[1.2] *:[grid-area:1/1] *:justify-self-center">
      <span
        aria-hidden={flipped || undefined}
        style={roll(`translateY(calc(${F} * ${DIR} * (-100% - 0.3em)))`)}
      >
        {children}
      </span>
      <span
        aria-hidden={!flipped || undefined}
        style={roll(`translateY(calc((1 - ${F}) * ${DIR} * (100% + 0.3em)))`)}
      >
        {copy}
      </span>
    </span>
  );
}

/** The disc's icon, clipped to its circle. */
function FlipIcon({
  icon,
  motion = "slide",
}: {
  icon: React.ReactNode;
  motion?: FlipButtonIconMotion;
}) {
  return (
    <span
      aria-hidden
      className="relative flex size-full items-center justify-center overflow-hidden rounded-[inherit]"
    >
      {motion === "none" ? (
        <span className="flex">{icon}</span>
      ) : motion === "rotate" ? (
        <span
          className="flex"
          style={roll(
            `rotate(calc(${F} * ${X} * 90deg))`,
            `calc(${STAGGER} * 2)`,
          )}
        >
          {icon}
        </span>
      ) : (
        // Each copy spans the disc, so 100% is one disc width. `--flip-x`
        // mirrors the slide in right-to-left layouts.
        [false, true].map((isCopy) => (
          <span
            key={String(isCopy)}
            className="absolute inset-0 flex items-center justify-center"
            style={roll(
              isCopy
                ? `translateX(calc((${F} - 1) * ${X} * 100%))`
                : `translateX(calc(${F} * ${X} * 100%))`,
              STAGGER,
            )}
          >
            {icon}
          </span>
        ))
      )}
    </span>
  );
}

function FlipContent({
  loading,
  iconLeft,
  iconRight,
  iconMotion,
  flipLabel,
  flipped,
  children,
}: Pick<
  FlipButtonProps,
  | "loading"
  | "iconLeft"
  | "iconRight"
  | "iconMotion"
  | "flipLabel"
  | "flipped"
  | "children"
>) {
  const reduced = useReducedMotionPreference();
  const copy = flipLabel ?? children;
  // With reduced motion a state flip still swaps the label, only without the roll.
  const label = reduced ? (
    flipped ? (
      copy
    ) : (
      children
    )
  ) : (
    <FlipLabel copy={copy} flipped={flipped}>
      {children}
    </FlipLabel>
  );
  // The spinner takes the badge when there is one, so the width holds.
  const spinner = (
    <IconSpinner
      aria-hidden
      className={cn(
        "shrink-0",
        !iconRight && "size-5",
        !reduced && "animate-spin",
      )}
    />
  );
  return (
    <>
      {loading && !iconRight
        ? spinner
        : iconLeft && (
            <span data-icon="" aria-hidden className="shrink-0">
              {iconLeft}
            </span>
          )}
      {label}
      {iconRight && (
        <span
          data-badge=""
          className="flex shrink-0 items-center justify-center rounded-full transition-colors duration-200 ease-out"
        >
          {loading ? (
            spinner
          ) : reduced ? (
            <span aria-hidden className="flex">
              {iconRight}
            </span>
          ) : (
            <FlipIcon icon={iconRight} motion={iconMotion} />
          )}
        </span>
      )}
    </>
  );
}

type ClonableProps = {
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
} & Record<string, unknown>;

export const FlipButton = React.forwardRef<HTMLButtonElement, FlipButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      asChild = false,
      loading = false,
      iconLeft,
      iconRight,
      iconMotion,
      flipLabel,
      flipped,
      flipDirection = "up",
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const classes = cn(
      BASE,
      flipped === undefined ? TRIGGER_HOVER : TRIGGER_STATE,
      flipDirection === "down" && "[--flip-dir:-1]",
      VARIANTS[variant],
      SIZES[size],
      fullWidth && FULL_WIDTH,
      className,
    );
    const flipAttr = flipped ? { "data-flipped": "" } : {};
    const content = (label: React.ReactNode) => (
      <FlipContent
        loading={loading}
        iconLeft={iconLeft}
        iconRight={iconRight}
        iconMotion={iconMotion}
        flipLabel={flipLabel}
        flipped={flipped}
      >
        {label}
      </FlipContent>
    );

    if (asChild) {
      // The first element child, past any whitespace text JSX leaves around it.
      const child = React.Children.toArray(children).find(React.isValidElement);
      if (!child) return null;
      const childProps = child.props as ClonableProps;
      return React.cloneElement(child as React.ReactElement<ClonableProps>, {
        ...(props as Record<string, unknown>),
        ...flipAttr,
        ...(isDisabled && {
          "aria-disabled": true,
          "data-disabled": "",
          tabIndex: -1,
        }),
        ...(loading && { "aria-busy": true }),
        className: cn(classes, childProps.className),
        ref,
        onClick: (e: React.MouseEvent) => {
          if (isDisabled) {
            e.preventDefault();
            return;
          }
          childProps.onClick?.(e);
        },
        children: content(childProps.children),
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={classes}
        {...flipAttr}
        {...props}
      >
        {content(children)}
      </button>
    );
  },
);

FlipButton.displayName = "FlipButton";
