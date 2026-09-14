// Single source of truth for the component docs (grid + [slug] page).
// Holds the curated, standalone copy-paste source per component - deliberately
// distinct from the internal packages/ui source (different import paths,
// tokens, forwardRef). One style per component; each installs as
// components/ui/<slug>.tsx.

export interface PropDef {
  name: string;
  type: string;
  default: string;
  description: string;
}

export interface ComponentData {
  slug: string;
  name: string;
  description: string;
  category: string;
  variants: string[];
  props: PropDef[];
  code: string;
  /** Example shown in the Code tab. */
  usage: string;
  notes?: string[];
}

/** Slug-keyed registry the docs read from. */
export const components: Record<string, ComponentData> = {
  "magnetic-button": {
    slug: "magnetic-button",
    name: "Magnetic Button",
    description:
      "A button that leans toward the cursor from inside an invisible field, with a label that tilts in 3D as it follows",
    category: "animation",
    variants: ["Default", "Outline", "As link", "Disabled"],
    props: [
      {
        name: "children",
        type: "ReactNode",
        default: "-",
        description: "Label or content of the pill.",
      },
      {
        name: "href",
        type: "string",
        default: "-",
        description: "Renders an <a> instead of a <button>.",
      },
      {
        name: "strength",
        type: "number",
        default: "3",
        description:
          "Pill travel toward the cursor, 0-10. At 10 the pill moves half the cursor's own offset from centre.",
      },
      {
        name: "labelStrength",
        type: "number",
        default: "6",
        description:
          "Label travel inside the pill, 0-10, on the same scale as strength. The parallax comes from the two differing.",
      },
      {
        name: "field",
        type: "number",
        default: "40",
        description:
          "Radius of the invisible magnetic field around the pill, in px. 0 disables it.",
      },
      {
        name: "tilt",
        type: "number",
        default: "15",
        description:
          "Peak tilt of the label, in degrees, reached once the cursor is at the pill's own edge. 0 keeps it flat.",
      },
      {
        name: "className",
        type: "string",
        default: "-",
        description: "Classes for the visible pill - the surface you style.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description: "Stops the magnetism and soft-disables links.",
      },
    ],
    notes: [
      "Needs gsap: npm i gsap. Nothing else - no plugins, no @gsap/react.",
      "The field is padding cancelled by an equal negative margin, so a button that pulls from 40px away still costs its neighbours no layout space. Fields of adjacent buttons can overlap; lower `field` when they sit close together.",
      "Magnetism is gated behind (hover: hover) and (pointer: fine) plus prefers-reduced-motion, so touch and reduced-motion visitors get a plain, still pill.",
      'Every tween carries overwrite: "auto" - without it the in-flight follow tween reclaims x/y mid-release and the pill visibly snaps back.',
    ],
    code: `"use client";

import * as React from "react";
import gsap from "gsap";
import { cn } from "cn";

// The pill is pulled toward the cursor while the cursor is anywhere inside an
// invisible field around it - the field is the button's own padding box, with
// a matching negative margin so the field costs no layout space. Listening on
// the field (not the pill) is what keeps the pull stable: the pill slides out
// from under the cursor, so a pill-mounted listener would fight its own
// hover state.

// Pointer-follow pull - short, so the release always wins the handoff.
const MAGNET = { duration: 0.4, ease: "power2.out", overwrite: "auto" } as const;
// Release back to rest - overshoots once, the way a magnet lets go.
const RELEASE = {
  duration: 0.7,
  ease: "elastic.out(1, 0.4)",
  overwrite: "auto",
} as const;

// strength and labelStrength are 0-10 dials, not raw ratios: 10 travels half
// the cursor's own offset, which is as far as either should ever go.
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

          gsap.to(pill, { x: x * pull, y: y * pull, ...MAGNET });

          // Normalised cursor position over the pill itself (-0.5 .. 0.5 on
          // each axis), taken from where the pill currently sits: its live
          // offset is the transform GSAP is already tracking, and the pill is
          // centred in the field, so the field's box minus the padding is the
          // pill's. Doubling means the tilt peaks at exactly \`tilt\` degrees as
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
            ...MAGNET,
          });
        };

        const onLeave = () => {
          gsap.to(pill, { x: 0, y: 0, ...RELEASE });
          gsap.to(label, {
            x: 0,
            y: 0,
            rotateX: 0,
            rotateY: 0,
            ...RELEASE,
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
                  ((rel || "") + " noopener noreferrer").trim().split(/\\s+/),
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
}`,
    usage: `import { MagneticButton } from "@/components/ui/magnetic-button";

export default function Example() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-20">
      <MagneticButton>Get started</MagneticButton>

      {/* Gradients live in your classes - the component ships flat colours. */}
      <MagneticButton className="bg-linear-to-b from-accent-secondary to-accent text-accent-foreground">
        Read the docs
      </MagneticButton>

      {/* A link, pulling harder and tilting less */}
      <MagneticButton href="/pricing" strength={10} tilt={6}>
        Pricing
      </MagneticButton>
    </div>
  );
}`,
  },
};

/* ─── CLI-facing registry (served by /api/registry → consumed by the CLI) ─── */

/** npm dependencies a component needs, derived from what its source imports. */
export function dependenciesFor(code: string): string[] {
  const deps = ["cn"];
  if (code.includes("class-variance-authority"))
    deps.push("class-variance-authority");
  if (code.includes("motion/react")) deps.push("motion");
  if (code.includes('from "gsap"')) deps.push("gsap");
  return deps;
}

const fileFor = (slug: string) => `components/ui/${slug}.tsx`;

/** Index served at GET /api/registry. */
export function getRegistryIndex() {
  return {
    version: "0.2.0",
    components: Object.values(components).map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      category: c.category,
      variantCount: c.variants.length,
      dependencies: dependenciesFor(c.code),
    })),
  };
}

/** Full component served at GET /api/registry/[slug]; null when unknown. */
export function getRegistryComponent(slug: string) {
  const c = components[slug];
  if (!c) return null;

  const file = fileFor(slug);
  return {
    slug: c.slug,
    name: c.name,
    description: c.description,
    category: c.category,
    variants: c.variants,
    props: c.props,
    file,
    dependencies: dependenciesFor(c.code),
    files: { [file]: c.code },
  };
}
