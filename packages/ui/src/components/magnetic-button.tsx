"use client";

import * as React from "react";
import gsap from "gsap";
import { cn } from "cn";
import { GSAP_MAGNET, GSAP_MAGNET_RELEASE } from "../lib/animations";

// The pill is pulled toward the cursor while the cursor is anywhere inside an
// invisible field around it - the field is the button's own padding box, with
// a matching negative margin so the field costs no layout space. Listening on
// the field (not the pill) is what keeps the pull stable: the pill slides out
// from under the cursor, so a pill-mounted listener would fight its own
// hover state.

/** strength and labelStrength are 0-10 dials, not raw ratios: 10 travels
 *  half the cursor's own offset, which is as far as either should ever go. */
const TRAVEL_SCALE = 20;

interface MagneticButtonBaseProps {
  children: React.ReactNode;
  /** Classes for the visible pill - this is the surface you style. */
  className?: string;
  /** Pill travel toward the cursor, 0-10. */
  strength?: number;
  /** Label travel inside the pill, 0-10. Differs from strength for parallax. */
  labelStrength?: number;
  /** Radius of the magnetic field around the pill, in px. 0 disables it. */
  field?: number;
  /** Peak tilt of the label, in degrees, reached at the pill's own edge. */
  tilt?: number;
  disabled?: boolean;
}

type AnchorProps = MagneticButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
    href: string;
  };

type ButtonProps = MagneticButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

export type MagneticButtonProps = AnchorProps | ButtonProps;

/** Flat view of the union, so the shared attributes destructure in one pass. */
type AnyProps = MagneticButtonBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLElement>, "className" | "type"> &
  Omit<React.ButtonHTMLAttributes<HTMLElement>, "className"> & {
    href?: string;
  };

export function MagneticButton(props: MagneticButtonProps) {
  const {
    children,
    className,
    strength = 3,
    labelStrength = 4,
    field = 40,
    tilt = 15,
    disabled = false,
    href,
    target,
    rel,
    tabIndex,
    type,
    ...rest
  } = props as AnyProps;

  const fieldRef = React.useRef<HTMLElement>(null);
  const pillRef = React.useRef<HTMLSpanElement>(null);
  const labelRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const root = fieldRef.current;
    const pill = pillRef.current;
    const label = labelRef.current;
    if (!root || !pill || !label || disabled) return;

    const pull = strength / TRAVEL_SCALE;
    const labelPull = labelStrength / TRAVEL_SCALE;

    // Magnetism is a pointer affordance: no fine pointer, no pull. matchMedia
    // also unwinds it if the user plugs in a mouse or flips reduced motion.
    const mm = gsap.matchMedia();
    mm.add(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        const onMove = (event: PointerEvent) => {
          const r = root.getBoundingClientRect();
          const x = gsap.utils.mapRange(
            r.left,
            r.right,
            -r.width / 2,
            r.width / 2,
            event.clientX,
          );
          const y = gsap.utils.mapRange(
            r.top,
            r.bottom,
            -r.height / 2,
            r.height / 2,
            event.clientY,
          );

          gsap.to(pill, { x: x * pull, y: y * pull, ...GSAP_MAGNET });

          // Normalised cursor position over the pill itself (-0.5 .. 0.5 on
          // each axis), taken from where the pill currently sits: its live
          // offset is the transform GSAP is already tracking, and the pill is
          // centred in the field, so the field's box minus the padding is the
          // pill's. Doubling means the tilt peaks at exactly `tilt` degrees as
          // the cursor reaches the pill's own edge.
          const nx =
            (x - (gsap.getProperty(pill, "x") as number)) /
            Math.max(1, r.width - 2 * field);
          const ny =
            (y - (gsap.getProperty(pill, "y") as number)) /
            Math.max(1, r.height - 2 * field);

          gsap.to(label, {
            x: x * labelPull,
            y: y * labelPull,
            rotateX: -ny * tilt * 2,
            rotateY: nx * tilt * 2,
            transformPerspective: 800,
            transformOrigin: "50% 50%",
            ...GSAP_MAGNET,
          });
        };

        const onLeave = () => {
          gsap.to(pill, { x: 0, y: 0, ...GSAP_MAGNET_RELEASE });
          gsap.to(label, {
            x: 0,
            y: 0,
            rotateX: 0,
            rotateY: 0,
            ...GSAP_MAGNET_RELEASE,
          });
        };

        root.addEventListener("pointermove", onMove, { passive: true });
        root.addEventListener("pointerleave", onLeave);
        return () => {
          root.removeEventListener("pointermove", onMove);
          root.removeEventListener("pointerleave", onLeave);
          gsap.set([pill, label], { clearProps: "transform" });
        };
      },
    );

    return () => {
      mm.revert();
      gsap.killTweensOf([pill, label]);
    };
  }, [disabled, strength, labelStrength, field, tilt]);

  const isLink = typeof href === "string";
  const Element = (isLink ? "a" : "button") as React.ElementType;

  const elementProps = isLink
    ? {
        href: disabled ? undefined : href,
        target,
        rel:
          target === "_blank"
            ? [
                ...new Set(
                  `${rel ?? ""} noopener noreferrer`.trim().split(/\s+/),
                ),
              ].join(" ")
            : rel,
        role: disabled ? "link" : undefined,
        "aria-disabled": disabled || undefined,
        tabIndex: disabled ? -1 : tabIndex,
      }
    : { type: type ?? "button", disabled, tabIndex };

  return (
    <Element
      ref={fieldRef}
      // The field is padding cancelled by margin: it grows the hit area
      // without moving anything around it.
      style={{ padding: field, margin: -field }}
      className={cn(
        "group inline-flex bg-transparent focus-visible:outline-none",
        disabled && "pointer-events-none opacity-60",
      )}
      {...elementProps}
      {...rest}
    >
      <span
        ref={pillRef}
        className={cn(
          "relative inline-flex cursor-pointer items-center justify-center rounded-full bg-surface px-8 py-4 text-sm font-medium whitespace-nowrap text-foreground will-change-transform group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
          className,
        )}
      >
        <span
          ref={labelRef}
          className="inline-flex items-center gap-2 will-change-transform"
        >
          {children}
        </span>
      </span>
    </Element>
  );
}
