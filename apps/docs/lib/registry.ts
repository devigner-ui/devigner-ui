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
        name: "left",
        type: "boolean",
        default: "false",
        description:
          "Opens the prompt to the left of the trash instead of the right, mirroring the buttons, the notch and the lid swing with it. Ignored if right is also set.",
      },
      {
        name: "right",
        type: "boolean",
        default: "false",
        description:
          "The default side. Only worth passing to win over a left that is coming from a variable.",
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
  "chart-card": {
    slug: "chart-card",
    name: "Chart Card",
    description:
      "A stat card whose bar chart is the interactive part - click a bar and it opens, hatched, with the figure riding above it",
    category: "data",
    variants: ["Default", "No badge", "Custom actions", "Two-tone total"],
    props: [
      {
        name: "data",
        type: "{ label: string; value: number }[]",
        default: "-",
        description:
          "The bars, left to right. Bar heights are relative to the largest value.",
      },
      {
        name: "title",
        type: "ReactNode",
        default: '"Total sales"',
        description: "Card heading.",
      },
      {
        name: "caption",
        type: "string",
        default: '"for all time"',
        description: "Small line above the headline figure.",
      },
      {
        name: "total",
        type: "number",
        default: "sum of data",
        description:
          "Headline figure. Formatted with thousands separators; the first group stays bright, the rest reads muted.",
      },
      {
        name: "defaultActive",
        type: "number",
        default: "middle bar",
        description: "Bar open on first render. Clicking any bar opens it.",
      },
      {
        name: "notifications",
        type: "number",
        default: "0",
        description: "Count on the comments button. 0 hides the badge.",
      },
      {
        name: "actions",
        type: "ReactNode",
        default: "-",
        description: "Replaces the three built-in header buttons.",
      },
      {
        name: "className",
        type: "string",
        default: "-",
        description: "Classes for the card surface.",
      },
    ],
    notes: [
      "No chart library. Bars are divs sized by percentage height, so the whole card is a few hundred bytes of markup and resizes with its container.",
      "Bar heights run from 20% to 88% of the track - the floor keeps a near-zero value visible, the ceiling leaves headroom for the tooltip that sits above the tallest bar.",
      "The hatch on the open bar is a repeating-linear-gradient painted in currentColor, so the bar's own text colour is the single knob for how loud the stripes read.",
      "Every bar is a real button with aria-pressed and an accessible label, so the chart is keyboard-navigable and the values are readable without seeing it.",
      "Entrance animations are skipped under prefers-reduced-motion; the card renders at its final state.",
    ],
    code: `"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";

// Motion tokens - the same curves the rest of the kit uses.
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const SPRING_PRESS = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6,
} as const;

// A stat card whose bar chart is the interactive part: one bar is open at a
// time, hatched instead of solid, with the tooltip riding on top of it. The
// tooltip is positioned off the same percentage that sizes the bar, so the two
// can never drift apart.

/** Shortest bar as a share of the track, so a near-zero month is still a bar. */
const BAR_FLOOR = 20;
/** Tallest bar, leaving the rest of the track as headroom for the tooltip. */
const BAR_CEILING = 88;

export interface ChartCardPoint {
  label: string;
  value: number;
}

export interface ChartCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title?: React.ReactNode;
  /** Small line above the headline figure. */
  caption?: string;
  /** Headline figure. Defaults to the sum of the data. */
  total?: number;
  data: ChartCardPoint[];
  /** Bar open on first render. */
  defaultActive?: number;
  /** Replaces the three built-in header buttons. */
  actions?: React.ReactNode;
  /** Count on the comments button; 0 hides it. */
  notifications?: number;
}

const format = (n: number) => n.toLocaleString("en-US");

/** Headline figures read first group bright, remainder muted. */
function SplitNumber({ value, muted }: { value: number; muted: string }) {
  const text = format(value);
  const comma = text.indexOf(",");
  if (comma === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, comma + 1)}
      <span className={muted}>{text.slice(comma + 1)}</span>
    </>
  );
}

function IconButton({
  label,
  children,
  ...rest
}: { label: string } & React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.92 }}
      transition={SPRING_PRESS}
      className="relative inline-grid size-11 cursor-pointer place-items-center rounded-full bg-surface-hover text-text-secondary transition-colors hover:text-foreground"
      {...rest}
    >
      {children}
    </motion.button>
  );
}

const svg = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function ChartCard({
  title = "Total sales",
  caption = "for all time",
  total,
  data,
  defaultActive = Math.floor(data.length / 2),
  actions,
  notifications = 0,
  className,
  ...rest
}: ChartCardProps) {
  const [active, setActive] = React.useState(defaultActive);
  const reduced = useReducedMotion();
  // Per-instance: a shared layoutId would make two cards on one page swap
  // tooltips with each other.
  const tooltipId = React.useId();

  const { max, sum } = data.reduce(
    (a, d) => ({ max: Math.max(a.max, d.value), sum: a.sum + d.value }),
    { max: 1, sum: 0 },
  );
  const heightOf = (value: number) =>
    BAR_FLOOR + (value / max) * (BAR_CEILING - BAR_FLOOR);
  // The open index outlives the data it points at: clamped on read, so a
  // shorter \`data\` closes the last bar instead of closing every bar.
  const activeIndex = Math.min(active, data.length - 1);

  return (
    <div
      className={cn(
        "w-full max-w-lg rounded-4xl bg-background p-6 text-foreground",
        className,
      )}
      {...rest}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="inline-grid size-13 shrink-0 place-items-center rounded-full bg-surface2 text-text-secondary"
        >
          <svg {...svg}>
            <path d="M9 17V9" />
            <path d="M15 17v-4" />
          </svg>
        </span>
        <h3 className="min-w-0 flex-1 truncate text-2xl tracking-tight">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {actions ?? (
            <>
              <IconButton label="Adjust">
                <svg {...svg}>
                  <path d="M6 20v-6M6 10V4M12 20v-8M12 8V4M18 20v-4M18 12V4" />
                  <path d="M4 14h4M10 8h4M16 16h4" />
                </svg>
              </IconButton>
              <IconButton label="Comments">
                <svg {...svg}>
                  <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
                  <path d="M8 12h.01M12 12h.01M16 12h.01" />
                </svg>
                {notifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-3 leading-none ring-background">
                    {notifications}
                  </span>
                )}
              </IconButton>
              <IconButton label="Open report">
                <svg {...svg}>
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </IconButton>
            </>
          )}
        </div>
      </div>

      <p className="mt-7 text-sm text-text-muted">{caption}</p>
      <p className="mt-1 text-5xl tracking-tight tabular-nums">
        <SplitNumber value={total ?? sum} muted="text-text-tertiary" />
      </p>

      <div className="mt-8 flex h-52 items-end gap-2">
        {data.map((point, i) => {
          const height = heightOf(point.value);
          const isActive = i === activeIndex;
          return (
            <div key={i} className="relative flex h-full flex-1 justify-center">
              {isActive && (
                // The wrapper holds the position, the tooltip inside holds the
                // layoutId - so one tooltip travels bar to bar instead of two
                // crossfading. Centring moves to flexbox because layout
                // projection writes transform, which the old x: "-50%" fought.
                <div
                  className="pointer-events-none absolute inset-x-0 z-10 flex justify-center"
                  style={{ bottom: \`calc(\${height}% + 0.75rem)\` }}
                >
                  <motion.div
                    layoutId={reduced ? undefined : tooltipId}
                    initial={reduced ? false : { opacity: 0, scale: 0.9, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      ease: EASE_OUT,
                      layout: { duration: 0.2, ease: EASE_OUT },
                    }}
                    className="origin-bottom rounded-xl bg-brand/70 px-3.5 py-2 text-sm font-medium whitespace-nowrap text-accent-foreground tabular-nums"
                  >
                    <SplitNumber
                      value={point.value}
                      muted="text-accent-foreground/60"
                    />
                  </motion.div>
                </div>
              )}
              <motion.button
                type="button"
                aria-pressed={isActive}
                aria-label={\`\${point.label}: \${format(point.value)}\`}
                onClick={() => setActive(i)}
                initial={reduced ? false : { height: 0 }}
                animate={{ height: \`\${height}%\` }}
                whileTap={{ scaleX: reduced ? 0.98 : 0.96 }}
                transition={{
                  duration: 0.6,
                  ease: EASE_OUT,
                  delay: i * 0.05,
                  // Height is the data channel; a uniform scale would make the
                  // bar lie about its value mid-press. delay: 0 so the press
                  // never inherits the entrance stagger.
                  scaleX: { ...SPRING_PRESS, delay: 0 },
                }}
                style={
                  isActive
                    ? {
                        backgroundImage:
                          "repeating-linear-gradient(45deg, currentColor 0 4px, transparent 4px 10px)",
                      }
                    : undefined
                }
                className={cn(
                  "relative w-full cursor-pointer self-end rounded-2xl bg-surface-hover text-foreground/10 transition-colors border-t-3 border-border-hover",
                  !isActive && "hover:bg-border-hover",
                )}
              >
                <span
                  className={cn(
                    "absolute -top-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-foreground ring-3 ring-background transition-colors",
                    isActive && "bg-brand",
                  )}
                />
              </motion.button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        {data.map((point, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              "flex-1 text-center text-xs transition-colors",
              i === activeIndex ? "text-foreground" : "text-text-muted",
            )}
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}`,
    usage: `import { ChartCard } from "@/components/ui/chart-card";

const SALES = [
  { label: "Feb", value: 6420 },
  { label: "Mar", value: 9180 },
  { label: "Apr", value: 12340 },
  { label: "May", value: 8760 },
  { label: "Jun", value: 16520 },
  { label: "Jul", value: 13070 },
  { label: "Aug", value: 15960 },
];

export default function Example() {
  return (
    <ChartCard
      title="Total sales"
      caption="for all time"
      total={90744}
      data={SALES}
      defaultActive={4}
      notifications={3}
    />
  );
}`,
  },
  "delete-button": {
    slug: "delete-button",
    name: "Delete Button",
    description:
      "A trash tile that widens into its own confirm and cancel, then collapses back to a tick - a destructive action that asks without opening a dialog",
    category: "primitives",
    variants: [
      "Default",
      "Actions left",
      "Async delete",
      "Custom labels",
      "Disabled",
    ],
    props: [
      {
        name: "onConfirm",
        type: "() => void | Promise<unknown>",
        default: "-",
        description:
          "Fired once, when confirm is pressed. Return a promise and the tile waits on it - spinner while it runs, tick when it resolves, back to the trash if it rejects.",
      },
      {
        name: "onCancel",
        type: "() => void",
        default: "-",
        description:
          "Fired when the pill closes without deleting - the cancel button, Escape, or a second press on the trash.",
      },
      {
        name: "onError",
        type: "(error: unknown) => void",
        default: "-",
        description:
          "Fired when a promise returned by onConfirm rejects. Without it the rejection is re-thrown, so a failed delete never disappears silently.",
      },
      {
        name: "label",
        type: "string",
        default: '"Delete"',
        description:
          "Accessible label of the trash tile, open or closed. aria-expanded is what reports the prompt.",
      },
      {
        name: "confirmLabel",
        type: "string",
        default: '"Confirm delete"',
        description: "Accessible label of the tick button.",
      },
      {
        name: "cancelLabel",
        type: "string",
        default: '"Keep"',
        description: "Accessible label of the cross button.",
      },
      {
        name: "pendingLabel",
        type: "string",
        default: '"Deleting"',
        description:
          "Announced, and used as the tile's label, while a promise returned by onConfirm runs.",
      },
      {
        name: "doneLabel",
        type: "string",
        default: '"Deleted"',
        description:
          "Announced, and used as the tile's label, once the delete has landed.",
      },
      {
        name: "resetAfter",
        type: "number",
        default: "1400",
        description:
          "ms the tick holds before returning to the trash. 0 keeps the tick, for rows that disappear on delete.",
      },
      {
        name: "disabled",
        type: "boolean",
        default: "false",
        description:
          "Blocks every phase, dims the control, and closes an open prompt rather than leaving its buttons reachable by keyboard.",
      },
      {
        name: "className",
        type: "string",
        default: "-",
        description: "Classes for the outer pill.",
      },
    ],
    notes: [
      "No dialog and no portal. The confirm lives where the action was pressed, so the pointer never travels and nothing covers the row being deleted.",
      "The pill grows out of a tile that stays put, so a list of these never reflows when one opens. Pass left when the tile sits at the right edge of a row and the prompt would otherwise open off-screen.",
      "The lid is its own path inside the glyph, hinged where the two authored drawings agree - that is why it can swing off while the bin stays still.",
      "Cancel takes focus on open, not confirm: a destructive prompt that answers yes to Enter or Space is a speed bump, not a guard. Escape is still one key, and focus returns to the tile on every close.",
      "Confirm is guarded against a double-click - AnimatePresence popLayout pins an exiting child absolutely but leaves it mounted and clickable for the length of its spring.",
      "The outer radius is set inline rather than in a class: the layout animation scales the box, and Motion only unskews a corner it owns as a value.",
      "Under prefers-reduced-motion the layout spring, the lid swing and the tick's draw-in are all skipped; the phases still change, they just cut.",
    ],
    code: `"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "cn";
import { IconSpinner } from "@devigner-ui/icons";
import { SPRING_LAYOUT, SPRING_PRESS, SPRING_SWAP } from "../lib/easing";

/** Lid pivot, in the glyph's own 24px units. */
const LID_HINGE = "9.244px 7.147px";
const LID_OPEN = -20.57;
/** Offsets the swung lid, both in the glyph's own 24px units, so they scale
 *  with the icon rather than the viewport. Sideways drift off the hinge... */
const LID_RECENTER = -2;
/** ...and clearance over the bin's rim. */
const LID_LIFT = -1.25;

const BIN =
  "M18.834 8.5l-.46 6.9c-.177 2.654-.266 3.981-1.13 4.79-.866.81-2.196.81-4.857.81h-.773c-2.661 0-3.992 0-4.857-.81-.865-.809-.953-2.136-1.13-4.79l-.46-6.9";
const TICKS = "M9.5 11l.5 5M14.5 11l-.5 5";
const CHECK = "M5.5 12.6 9.7 17 18.5 7";
const CLOSE = "M7.7 7.7 16.3 16.3M16.3 7.7 7.7 16.3";

/** Seconds for one glyph to draw on or retract. Linear: a pen moves at a
 *  constant speed, and an ease-out swallows the tail of the stroke. */
const DRAW = 0.32;
const DRAW_EASE = "linear";
/** Overlap between the outgoing and incoming glyph of a swap. */
const HANDOFF = 0.14;
/** Grace period before the spinner fades in, so a fast delete never flashes it. */
const PENDING_DELAY = 0.12;

/** Inner radius = outer minus the shell's p-1, or the corners stop looking nested. */
const RADIUS = 24;
const INSET = 4;
const INNER_RADIUS = RADIUS - INSET;

type Phase = "idle" | "armed" | "pending" | "done";

const glyph = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function DrawnPath({
  show,
  d,
  reverse = false,
}: {
  show: boolean;
  d: string;
  reverse?: boolean;
}) {
  const reduced = useReducedMotion();
  const drawing = {
    duration: DRAW,
    ease: DRAW_EASE,
    delay: show ? HANDOFF : 0,
  };
  return (
    <motion.path
      d={d}
      initial={false}
      animate={{
        pathLength: show || reduced ? 1 : 0,
        pathOffset: reverse && !show && !reduced ? 1 : 0,
        opacity: show ? 1 : 0,
      }}
      transition={
        reduced
          ? { duration: 0.15 }
          : {
              pathLength: drawing,
              pathOffset: drawing,
              opacity: { duration: 0, delay: show ? HANDOFF : DRAW },
            }
      }
    />
  );
}

function TrashGlyph({
  show,
  open,
  mirror = false,
}: {
  show: boolean;
  open: boolean;
  mirror?: boolean;
}) {
  return (
    <svg
      {...glyph}
      // The lid pivots out of the 24-unit box; SVG roots clip by default.
      className={cn(
        "col-start-1 row-start-1 size-6 overflow-visible",
        // The glyph is symmetric, so a flip is the whole mirror: lid opens
        // toward the actions whichever side they sit on.
        mirror && "-scale-x-100",
      )}
      strokeWidth={1.5}
    >
      <DrawnPath show={show} reverse d={BIN} />
      <DrawnPath show={show} d={TICKS} />
      <motion.g
        style={{ transformOrigin: LID_HINGE }}
        animate={{
          rotate: open ? LID_OPEN : 0,
          x: open ? LID_RECENTER : 0,
          y: open ? LID_LIFT : 0,
        }}
        transition={SPRING_SWAP}
      >
        <DrawnPath show={show} d="M3.5 6h17" />
        <DrawnPath
          show={show}
          d="M6.5 6h.11a2 2 0 0 0 1.83-1.32l.034-.103.097-.291c.083-.249.125-.373.18-.479a1.5 1.5 0 0 1 1.094-.788C9.962 3 10.093 3 10.355 3h3.29c.262 0 .393 0 .51.019a1.5 1.5 0 0 1 1.094.788c.055.106.097.23.18.479l.097.291A2 2 0 0 0 17.5 6"
        />
      </motion.g>
    </svg>
  );
}

function CheckGlyph({
  show = true,
  className = "size-5",
}: {
  show?: boolean;
  className?: string;
}) {
  return (
    <svg {...glyph} className={className} strokeWidth={2.5}>
      <DrawnPath show={show} d={CHECK} />
    </svg>
  );
}

const MotionSpinner = motion.create(IconSpinner);

function SpinnerGlyph({ show }: { show: boolean }) {
  return (
    <MotionSpinner
      aria-hidden
      className="col-start-1 row-start-1 size-5.5"
      strokeWidth={2.5}
      style={{ transformOrigin: "50% 50%" }}
      initial={false}
      animate={{ rotate: show ? 360 : 0, opacity: show ? 1 : 0 }}
      transition={{
        rotate: show
          ? { duration: 0.9, ease: "linear", repeat: Infinity }
          : { duration: 0 },
        opacity: { duration: 0.15, delay: show ? PENDING_DELAY : 0 },
      }}
    />
  );
}

function CloseGlyph() {
  return (
    <svg {...glyph} className="size-5" strokeWidth={2.5}>
      <DrawnPath show d={CLOSE} />
    </svg>
  );
}

/** React's drag and animation handlers collide with Motion's own. */
type DivProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

export interface DeleteButtonProps extends DivProps {
  /** Return a promise and the tile waits on it: spinner, then tick, or back to
   *  the trash if it rejects. */
  onConfirm?: () => void | Promise<unknown>;
  /** Cancel, Escape, or a second press on the tile. */
  onCancel?: () => void;
  /** Handles a rejected \`onConfirm\`. Without it the rejection is re-thrown. */
  onError?: (error: unknown) => void;
  /** Tile's accessible name, open or closed. */
  label?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Announced, and the tile's label, while a returned promise runs. */
  pendingLabel?: string;
  /** Announced, and the tile's label, once the delete has landed. */
  doneLabel?: string;
  /** ms the tick holds before returning to the trash. 0 keeps the tick. */
  resetAfter?: number;
  /** Actions sit right of the trash by default; \`left\` flips them. Mutually
   *  exclusive, an explicit \`right\` wins. */
  left?: boolean;
  right?: boolean;
  disabled?: boolean;
}

function ActionButton({
  label,
  delay,
  className,
  children,
  ...rest
}: { label: string; delay: number } & React.ComponentProps<
  typeof motion.button
>) {
  const scale = useReducedMotion() ? 1 : 0.9;
  return (
    <motion.button
      type="button"
      aria-label={label}
      initial={{ opacity: 0, scale }}
      animate={{ opacity: 1, scale: 1, transition: { ...SPRING_SWAP, delay } }}
      exit={{ opacity: 0, scale }}
      whileTap={{ scale: 0.97, transition: SPRING_PRESS }}
      transition={SPRING_SWAP}
      className={cn(
        "inline-grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-background text-foreground shadow-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export function DeleteButton({
  onConfirm,
  onCancel,
  onError,
  label = "Delete",
  confirmLabel = "Confirm delete",
  cancelLabel = "Keep",
  pendingLabel = "Deleting",
  doneLabel = "Deleted",
  resetAfter = 1400,
  left = false,
  right = false,
  disabled = false,
  className,
  style,
  ...rest
}: DeleteButtonProps) {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const onLeft = left && !right;
  const reduced = useReducedMotion();
  const tile = React.useRef<HTMLButtonElement>(null);
  const pillId = React.useId();
  // \`pointer-events-none\` leaves the pill's buttons tabbable, so a disabled
  // control has to stop rendering the prompt entirely.
  const armed = phase === "armed" && !disabled;
  const busy = phase === "pending";
  const tileLabel = busy ? pendingLabel : phase === "done" ? doneLabel : label;

  // Closing unmounts whatever inside the pill had focus; take it back or it
  // lands on <body>.
  const close = () => {
    setPhase("idle");
    tile.current?.focus();
    onCancel?.();
  };

  // The cleanup stops a stale timer closing a pill that was just reopened.
  React.useEffect(() => {
    if (phase !== "done" || resetAfter <= 0) return;
    const id = setTimeout(() => setPhase("idle"), resetAfter);
    return () => clearTimeout(id);
  }, [phase, resetAfter]);

  // Otherwise re-enabling the control reopens a prompt the user never raised.
  React.useEffect(() => {
    if (disabled) setPhase("idle");
  }, [disabled]);

  return (
    <motion.div
      layout={!reduced}
      transition={SPRING_LAYOUT}
      className={cn(
        "relative inline-flex w-fit items-center bg-background p-1 text-foreground shadow-elevated",
        onLeft && "flex-row-reverse",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
      style={{ borderRadius: RADIUS, ...style }}
      {...rest}
      onKeyDown={(e) => {
        rest.onKeyDown?.(e);
        if (e.key !== "Escape" || !armed) return;
        e.stopPropagation();
        close();
      }}
    >
      <span aria-live="polite" className="sr-only">
        {busy ? pendingLabel : phase === "done" ? doneLabel : ""}
      </span>
      <motion.button
        ref={tile}
        type="button"
        layout={!reduced}
        transition={SPRING_LAYOUT}
        aria-label={tileLabel}
        aria-expanded={armed}
        aria-controls={pillId}
        aria-busy={busy}
        disabled={disabled}
        onClick={() => {
          if (busy || phase === "done") return;
          if (armed) return close();
          setPhase("armed");
        }}
        whileTap={{ scale: 0.94, transition: SPRING_PRESS }}
        style={{ borderRadius: INNER_RADIUS }}
        className={cn(
          "relative grid size-12 shrink-0 cursor-pointer place-items-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          phase === "done" ? "text-brand" : "text-foreground",
        )}
      >
        <TrashGlyph
          show={phase === "idle" || armed}
          open={armed && !reduced}
          mirror={onLeft}
        />
        <SpinnerGlyph show={busy} />
        <CheckGlyph
          show={phase === "done"}
          className="col-start-1 row-start-1 size-6"
        />
      </motion.button>

      <AnimatePresence mode="popLayout">
        {armed && (
          <motion.div
            key="actions"
            id={pillId}
            layout={!reduced}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRING_SWAP}
            style={{ borderRadius: INNER_RADIUS }}
            className={cn(
              "relative flex h-12 items-center gap-2.5 bg-surface px-3",
              onLeft && "flex-row-reverse",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute top-1/2 h-4 w-2 -translate-y-1/2 bg-surface",
                onLeft
                  ? "-right-1.5 [clip-path:polygon(0_0,100%_50%,0_100%)]"
                  : "-left-1.5 [clip-path:polygon(100%_0,0_50%,100%_100%)]",
              )}
            />
            <ActionButton
              label={confirmLabel}
              delay={0}
              onClick={() => {
                if (phase !== "armed") return;
                const result = onConfirm?.();
                if (!(result instanceof Promise)) return setPhase("done");
                setPhase("pending");
                result.then(
                  () => setPhase("done"),
                  (error: unknown) => {
                    setPhase("idle");
                    if (onError) onError(error);
                    else throw error;
                  },
                );
              }}
              className="text-brand"
            >
              <CheckGlyph />
            </ActionButton>
            <ActionButton
              label={cancelLabel}
              delay={reduced ? 0 : 0.07}
              autoFocus
              onClick={() => {
                if (phase !== "armed") return;
                close();
              }}
            >
              <CloseGlyph />
            </ActionButton>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}`,
    usage: `import { DeleteButton } from "@/components/ui/delete-button";

export default function Example() {
  return (
    <div className="flex items-center gap-6">
      <DeleteButton onConfirm={() => console.log("deleted")} />

      {/* Return a promise and the tile waits on it: spinner, then tick. Keep
          the tick - the row this deleted is gone by the time it resolves. */}
      <DeleteButton
        resetAfter={0}
        onConfirm={() => fetch("/api/rows/7", { method: "DELETE" })}
        onError={(error) => console.error(error)}
      />

      <DeleteButton
        label="Remove file"
        confirmLabel="Yes, remove it"
        cancelLabel="Keep the file"
        onConfirm={() => console.log("removed")}
      />

      {/* Opens leftward - for a tile parked at the right edge of a row. */}
      <DeleteButton left onConfirm={() => console.log("deleted")} />

      <DeleteButton disabled />
    </div>
  );
}`,
  },
  timeline: {
    slug: "timeline",
    name: "Timeline",
    description:
      "A vertical process rail whose line bends out to meet the step under the pointer, then settles back straight once you leave",
    category: "animation",
    variants: ["Default", "With a step held open", "Custom labels"],
    props: [
      {
        name: "steps",
        type: "TimelineStep[]",
        default: "-",
        description:
          'The rail, top to bottom. Each step takes a title, an optional description, and an optional label - the label falls back to "Step n".',
      },
      {
        name: "defaultActive",
        type: "number",
        default: "-1",
        description:
          "Step highlighted while the pointer is away, and the one the rail returns to on leave. -1 leaves the line straight.",
      },
      {
        name: "onActiveChange",
        type: "(index: number) => void",
        default: "-",
        description:
          "Fires on every change of the highlighted step, including the -1 the rail returns to.",
      },
      {
        name: "className",
        type: "string",
        default: "-",
        description: "Classes for the <ol>.",
      },
    ],
    notes: [
      "Hovering a step slides the whole row - dot and text together - off the rail, and the connectors above and below it bend to follow. The rail is the only thing that stays put, so the bend is what reads as movement.",
      'Each gap is one stretched <svg>. preserveAspectRatio="none" lets the box take whatever height the rows give it, and vector-effect="non-scaling-stroke" keeps the line 1.5px through that stretch - so nothing measures a row and no ResizeObserver runs. The box is sized top: 11px / height: 100%, not top/bottom: an <svg> is a replaced element, so an auto height takes the viewBox\'s intrinsic 100px instead of stretching, and the line stops short of the next dot.',
      "A run is not one long bow. It is a straight rail with a single short jog in it - 36% of the run - and the jog sits next to the dot it steps aside for: late when the line is arriving at the active dot, early when it is leaving, with the same 18% of straight run between jog and dot either way. A bow spread over the whole gap reads as a line that changed its mind; this reads as a rail with a detour in it.",
      "The jog's position slides between those two ends with the sprung offsets, so when the active step changes and a connector flips from leaving to arriving, the jog travels rather than jumping.",
      "Both control points share the jog's midpoint, which is what makes the line leave and rejoin the rail vertically - the straight runs meet it with no kink. The jog is a share of the run rather than a pixel height, so a step whose text wraps keeps the same shape and still needs no measuring.",
      "The active dot is blue-600 rather than the theme's accent. It is the component's own colour, so the rail reads the same when the app's brand is something else - change the one class if you want it on-brand.",
      "A connector spans from its own dot's centre to bottom: -12px, which is the next dot's centre because every dot sits the same distance below its row's top edge. The list carries no gap - the spacing is padding inside each row - or the line would have nothing to cross.",
      "The springs are overdamped. On a 1.5px line every overshoot shows, and a connector that bounces back reads as a loose cable rather than a rail.",
      "Under prefers-reduced-motion the shift drops to 0, so the rail never bends and the dot's colour alone carries the highlight.",
      "Focus bubbles in React, so a link or button dropped inside a step lights that step up the same way the pointer does.",
    ],
    code: `"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "cn";

/** Dot diameter, px - a hair under the badge it sits against, which is what
 *  makes the two read as one row rather than a marker beside a label. */
const DOT = 20;
/** Badge height, and with it the dot's centre from the top of a row. The dot
 *  lines up with "Step n", not with the title. */
const BADGE = 22;
const CY = BADGE / 2;
/** How far the active row slides off the rail. Roughly two dots' worth - less
 *  and the detour reads as a wobble. */
const SHIFT = 44;
/** Text inset from the dot's left edge. Generous on purpose: the rail is the
 *  fixed thing on the page, and the gap is what gives it room to bend. */
const RAIL = 76;
/** Rail x of a dot at rest, in the connector's own units. */
const CX = DOT / 2;

/** The jog, as a share of one run between two dots: how much of it the line
 *  spends stepping off the rail, and the straight run it always leaves between
 *  the jog and the dot it is stepping aside for. Shares rather than pixels, so
 *  a row whose text wraps keeps the same shape instead of needing measuring. */
const JOG = 36;
const PAD = 18;

/** Overdamped on purpose: the rail is a 1.5px line, so it shows every
 *  overshoot, and a connector that bounces back reads as a loose cable. */
const SPRING_RAIL = { stiffness: 320, damping: 34, mass: 0.7 } as const;
const TRANSITION_RAIL = { type: "spring", ...SPRING_RAIL } as const;

/** A row's horizontal offset, sprung. */
function useOffset(on: boolean, shift: number) {
  const target = useMotionValue(on ? shift : 0);
  React.useEffect(() => {
    target.set(on ? shift : 0);
  }, [on, shift, target]);
  return useSpring(target, SPRING_RAIL);
}

/** One gap of rail, dot centre above to dot centre below. The box is stretched
 *  to whatever height the gap turns out to be - \`non-scaling-stroke\` is what
 *  buys that, keeping the line 1.5px however tall the rows grow, so nothing
 *  here has to measure them. The box is \`top: CY; height: 100%\`, not
 *  \`top/bottom\`: an <svg> is a replaced element, so with an auto height it
 *  would take the viewBox's intrinsic 100px rather than stretching.
 *
 *  The run is not one long bow. It is a straight rail with a single short jog
 *  in it, and the jog sits next to the dot it is stepping aside for - late when
 *  the line is arriving at the active dot, early when it is leaving. \`jogTop\`
 *  slides between those two ends with the sprung offsets, so the flip from one
 *  to the other when the active step changes is a travel, not a jump. */
function Connector({
  from,
  to,
  shift,
}: {
  from: boolean;
  to: boolean;
  shift: number;
}) {
  const a = useOffset(from, shift);
  const b = useOffset(to, shift);
  const d = useTransform(
    [a, b] as MotionValue<number>[],
    ([x, y]: number[]) => {
      // -1 leaving the active dot, +1 arriving at it, 0 while the run is straight.
      const lean = shift ? (y - x) / shift : 0;
      const top = PAD + (0.5 + 0.5 * lean) * (100 - JOG - 2 * PAD);
      // Control points share the jog's midpoint, which is what makes it leave
      // and rejoin the rail vertically - the straight runs meet it with no kink.
      const mid = top + JOG / 2;
      return \`M\${CX + x} 0V\${top}C\${CX + x} \${mid} \${CX + y} \${mid} \${CX + y} \${top + JOG}V100\`;
    },
  );

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute overflow-visible"
      style={{ top: CY, left: 0, width: DOT + SHIFT, height: "100%" }}
      viewBox={\`0 0 \${DOT + SHIFT} 100\`}
      preserveAspectRatio="none"
      fill="none"
    >
      <motion.path
        d={d}
        className="stroke-border"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export interface TimelineStep {
  /** Defaults to \`Step n\`. */
  label?: string;
  title: string;
  description?: string;
}

/** React's drag and animation handlers collide with Motion's own. */
type ListProps = Omit<
  React.HTMLAttributes<HTMLOListElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

export interface TimelineProps extends ListProps {
  steps: TimelineStep[];
  /** Step highlighted while the pointer is away. -1 leaves the rail straight. */
  defaultActive?: number;
  /** Fires on every change of the highlighted step, -1 included. */
  onActiveChange?: (index: number) => void;
}

export function Timeline({
  steps,
  defaultActive = -1,
  onActiveChange,
  className,
  ...rest
}: TimelineProps) {
  const [active, setActive] = React.useState(defaultActive);
  // Under reduced motion nothing slides, so the rail never bends and only the
  // dot's colour carries the highlight. That is the whole accommodation.
  const shift = useReducedMotion() ? 0 : SHIFT;

  const highlight = (index: number) => {
    setActive((prev) => {
      if (prev !== index) onActiveChange?.(index);
      return index;
    });
  };

  return (
    <ol className={cn("relative", className)} {...rest}>
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const on = active === i;
        return (
          <li
            key={i}
            className="relative"
            onPointerEnter={() => highlight(i)}
            onPointerLeave={() => highlight(defaultActive)}
            // Focus bubbles in React, so anything focusable a caller puts
            // inside a step lights that step up too.
            onFocus={() => highlight(i)}
            onBlur={() => highlight(defaultActive)}
          >
            {!last && (
              <Connector from={on} to={active === i + 1} shift={shift} />
            )}
            <motion.div
              animate={{ x: on ? shift : 0 }}
              transition={TRANSITION_RAIL}
              className={cn("relative flex", !last && "pb-18")}
            >
              <span
                aria-hidden
                className={cn(
                  "block shrink-0 rounded-full transition-colors duration-300",
                  // Not the theme's accent: this blue is the component's, and
                  // it stays put when the app's brand is something else.
                  on ? "bg-blue-600" : "bg-border-hover",
                )}
                style={{
                  width: DOT,
                  height: DOT,
                  marginTop: CY - DOT / 2,
                  marginRight: RAIL - DOT,
                }}
              />
              <div className="min-w-0">
                <span
                  className="inline-flex items-center rounded-md border border-border px-2 font-mono text-[11px] leading-none text-text-muted"
                  style={{ height: BADGE }}
                >
                  {step.label ?? \`Step \${i + 1}\`}
                </span>
                <h3 className="mt-2.5 text-[20px]/7 font-semibold tracking-[-0.02em] text-foreground">
                  {step.title}
                </h3>
                {step.description && (
                  <p className="mt-1.5 text-[14px]/5 text-text-muted">
                    {step.description}
                  </p>
                )}
              </div>
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
}`,
    usage: `import { Timeline } from "@/components/ui/timeline";

export default function Example() {
  return (
    <Timeline
      defaultActive={-1}
      steps={[
        {
          title: "Project Kickoff",
          description: "Define goals and gather requirements.",
        },
        {
          title: "Planning",
          description: "Create the roadmap and strategy.",
        },
        {
          title: "Design & Build",
          description: "Design, develop, and iterate.",
        },
        {
          title: "Launch",
          description: "Test, deploy, and provide support.",
        },
      ]}
    />
  );
}`,
  },
  "menu-dock": {
    slug: "menu-dock",
    name: "Menu Dock",
    description:
      "An icon dock whose pill morphs into the menu you opened, one surface growing through every level, with the menu's own title carrying the way back",
    category: "animation",
    variants: ["Default", "Nested menu", "With an active item"],
    props: [
          {
                "name": "items",
                "type": "MenuDockItem[]",
                "default": "-",
                "description": "The dock, and every menu hanging off it. An item takes a label, an optional icon and activeIcon, and either items (making it a submenu), href, or onSelect."
          },
          {
                "name": "items[].content",
                "type": "ReactNode",
                "default": "-",
                "description": "Makes the surface morph into this instead of into a menu - a search field, a grid, anything. Content is terminal, nothing nests below it, and it wins over items if both are given. The Back row above it carries the item's label, same as a menu."
          },
          {
                "name": "active",
                "type": "string",
                "default": "-",
                "description": "id - or label, when no id is given - of the current item. That item renders its activeIcon instead of its icon."
          },
          {
                "name": "floating",
                "type": "boolean",
                "default": "false",
                "description": "Pins the dock to the bottom centre of the viewport. Off by default: the parent owns the position, the way the other components here behave."
          },
          {
                "name": "onNavigate",
                "type": "(path: number[]) => void",
                "default": "-",
                "description": "Fires on every level change with the new index path. [] is the dock, [4] the menu item 4 opened, [4, 1] one level deeper. Also fires for the automatic correction when items changes under an open level."
          },
          {
                "name": "path",
                "type": "number[]",
                "default": "-",
                "description": "Controlled navigation path. Omit it and the dock keeps its own; pass it with onNavigate to drive the dock from outside - closing it on a route change, deep linking to a level, restoring where someone left off. While it is passed the dock renders this and nothing else, so a level only changes when you change it."
          },
          {
                "name": "label",
                "type": "string",
                "default": "\"Menu\"",
                "description": "Accessible name for the dock. Once a menu is open its own title takes over as the name."
          },
          {
                "name": "...rest",
                "type": "HTMLAttributes<HTMLDivElement>",
                "default": "-",
                "description": "Anything else lands on the footprint wrapper - id, data-*, aria-describedby, event handlers. A passed style merges over the computed width and height rather than replacing them."
          },
          {
                "name": "className",
                "type": "string",
                "default": "-",
                "description": "Classes for the footprint wrapper - the box that holds the closed dock's place in the page. Positioning belongs here; the surface inside it is taken out of flow so it can grow upward."
          }
    ],
    notes: [
          "The pill and the panel are one element, not a dock plus a popover. The shell carries motion's layout prop, so width, height and border radius interpolate between the two states - which is the whole effect. A second surface fading in over the first would read as a swap.",
          "DOCK_RADIUS is derived - half the closed height - so the pill stays a pill if you change the button size, and PANEL_RADIUS sits deliberately close to it. The two states sharing a corner is what makes the morph read as one surface growing; pull them apart and the radius animation becomes the thing you notice.",
          "A level is addressed by a path of indices rather than a linked list of menus, so depth is free: [] is the dock, [4] the menu item 4 opened, [4, 1] one level deeper. Nothing in the component is written per level.",
          "An item can carry content instead of items, and the surface morphs into that rather than into a menu - a search field, a grid, whatever you pass. The dock never learns what any of it is, which is why one primitive covers every expandable item you add later.",
          "Content is terminal: nothing nests below it, and a path that tries to descend past one truncates exactly as a path past a leaf does. The path module types content as unknown rather than ReactNode, so it stays free of React and runnable on its own.",
          "On a content level the arrows are left alone. They move between rows in a menu, but inside a text field they move the caret, and stealing them breaks typing. Escape still pops the level.",
          "Focus lands on the first field inside the content rather than on the Back row - opening a search box and landing on the button above it means tabbing into your own panel.",
          "A content level resizes the surface as its content changes, which is why the search panel caps its results. Uncapped, the panel lurches a row taller on every keystroke.",
          "Clicking outside closes all the way to the dock, through one pointerdown listener that only exists while something is open. It matters most for content: a text field has no row to press to get back out. The opening click's own pointerdown has already fired by the time the listener attaches, so it never closes what it just opened.",
          "The panel grows upward out of the dock, never in both directions. Three layers do it: a wrapper fixed to the closed dock's own footprint, an anchor pinned to that wrapper's bottom edge, and the morphing surface inside. Left in normal flow the surface is centred by whatever contains it, so it would grow up and down at once.",
          "The footprint is computed from the item count - every dock button is TAP wide with GAP between it and the next - rather than measured, so it needs no ref and no ResizeObserver. Because the wrapper keeps that size whatever the surface does, opening a menu never moves the page around it.",
          "The centring transform lives on the anchor rather than on the surface. motion's layout projection writes to transform on the element it is animating, so a -translate-x-1/2 there is overwritten partway through the morph and the panel jumps sideways.",
          "The panel grows from the dock's own centre horizontally, never from the icon that opened it. Anchoring to the trigger would slide the surface sideways while it grew - drift, not growth - and it only defines the first transition anyway: below depth 1 the trigger is a row at the same x as every other row.",
          "The open menu's title doubles as the Back label, so one row says both where you are and what leaving it costs. The title is the parent item's own label, so there is nothing extra to pass.",
          "Rows carry the slide and the level container only fades. Putting both on one element doubles every row's travel. The slide is direction-aware off a dir of 1 or -1, so descending brings rows in from the right and Back brings them from the left - that is what gives the stack a direction rather than a generic fade.",
          "AnimatePresence runs in popLayout mode, which takes the outgoing level out of layout flow. The shell then measures only the incoming rows and morphs straight to their size, instead of briefly sizing itself to both levels at once.",
          "Rows arrive from the right, and getting them to read that way is about when they mount, not about their own animation. The surface grows upward and motion fakes that growth with a projection transform on the shell, which drags everything inside it: a row mounted during the growth rides that drag upward. Measured on the Account menu, a row visible from the start travels 22px vertically against 32px of slide - 1.5x, which reads as the level rising from the bottom no matter how hard the rows slide sideways.",
          "So the rows are held back by delayChildren until the projection is near identity. That leaves 6px of vertical against the same 32px of slide - 5.3x - and the sideways travel is the only motion left to see. Waiting longer keeps trimming the residue (0.28s measures 8.9x) but buys less than it costs in latency.",
          "The level container is layout=\"position\", which is motion's scale correction. Without it the level is scaled by whatever the shell's box is doing, and on closing that measures a 3.9x stretch - 40px rows rendering 156px tall, smeared across the page. The prop's cost is that it also animates the block between its old and new layout positions, about 160px vertically on a dock-to-menu change; delayChildren is what makes it safe, because the rows are still invisible while that travel happens. The two settings only work as a pair.",
          "The surface clips its overflow. Rows enter on x, so coming back up a level they start SLIDE to the left of where they land - measured at 23px outside the panel - and without a clip they are simply painted on the page beside it. The clip sits on the surface rather than on the level inside: rows sit within the p-2, so a focus ring has 9px of room and survives, where clipping the level would cut it.",
          "Every focus the component performs passes preventScroll. Focusing something a clip is hiding makes the browser scroll that hidden box to reveal it, and the panel then sits permanently offset with no way back - rows are mid-transition exactly when focus moves to them, so the guard is not optional once the surface clips.",
          "The dock row pads itself by DOCK_RISE and pulls the same amount back out with a negative margin. `overflow-x: auto` drags overflow-y to `auto` with it - CSS will not let one axis scroll while the other stays visible - so the rise the icons enter on counts as 10px of scrollable height and puts a vertical scrollbar across the dock for the whole entrance. The padding makes that 10px part of the scrollable box rather than overflow, and the negative margin keeps the pill from being 20px taller for it. Measured: scrollHeight 50 against clientHeight 40 before, 0 overflow after, pill unchanged at 58px.",
          "The dock's own icons rise a little and fade rather than sliding in from the side. The dock is a row of icons, not a list of rows: sliding it in horizontally reads as one more menu level arriving, where rising into place reads as the panel collapsing back into the pill it came from. It is the one level that enters on y rather than x.",
          "The icon swap only mounts its AnimatePresence when an item supplies both icon and activeIcon, so an ordinary row stays a plain span. An item opts into the filled/outline state by giving the second glyph.",
          "A content level is a dialog, not a menu. The `menu` role permits only menuitem, group and separator as children, so the moment the surface holds a text field that role is a lie and screen readers mis-report what is inside it. The role, the aria-orientation and the rows' own menuitem roles all switch off together on a content level.",
          "The menu is one tab stop, not one per row: the focused row is tabIndex 0 and every other is -1, with the arrows moving between them. Leaving them all at 0 means Tab walks every icon in the dock instead of stepping past it.",
          "Triggers carry aria-haspopup - \"dialog\" for a content row, \"menu\" for a submenu - but never aria-expanded. Expanding replaces the trigger with the level it opened, so the row never exists in an expanded state and the attribute could only ever read \"false\", which is worse than leaving it off.",
          "The Back row says \"Back to\" in a visually hidden span rather than through an aria-label. Spoken, the title alone is indistinguishable from the row that opened it; keeping the direction as a prefix means the accessible name still contains the visible one, which an aria-label would break.",
          "Closing by clicking outside hands focus back to the dock icon it came from, but only if the click left focus on <body>. Clicking something focusable should let that thing keep focus. It also waits a frame: the close runs off pointerdown, and the browser does its own focusing for that gesture afterwards, so claiming focus any earlier just gets overwritten.",
          "Rows are keyed by position rather than by label. Two items in one level can legitimately share a label, and a duplicate React key silently drops one of them - the level is already keyed by its path, so identity across levels is not at stake.",
          "The surface is clamped to the viewport rather than to its wrapper. The wrapper is the closed pill's footprint and a panel is meant to outgrow it, while max-width on the surface itself would resolve against an anchor that the surface sizes - constraining nothing. The dock row scrolls, and its buttons are shrink-0, so too many icons scroll instead of squashing or pushing the page sideways.",
          "Uncontrolled by default, controlled the moment a `path` is passed - and then strictly so. Every level change in the component goes through one function, which reports through onNavigate always and applies to internal state only when uncontrolled, so a controlled dock renders exactly the path it was handed and moves only when the caller moves it. That includes the corrections it would otherwise make for itself: it still reports the stale path, but applying it is the caller's.",
          "onNavigate fires for the automatic correction too, not just for clicks. When items changes under an open menu the path pops to the nearest level that still exists, and staying quiet would leave any mirror of the path pointing at a level that is no longer open.",
          "The outside-click listener reads the path and onNavigate from a ref. onNavigate is usually an inline arrow, so an effect depending on it directly would tear the listener down and rebind it on every render.",
          "Rows are a roving set marked with data-dock-row. The arrows that walk them follow the axis: left/right in the dock, up/down in a menu, with Home and End at either end and Escape popping one level. Focus moves to the first row on opening and back to the trigger row on Back - which is why the menu levels count one row further than the dock, the Back row sitting above them.",
          "Focus only moves when a navigation asked for it, through a ref rather than on every path change, so the first render never steals focus from the page.",
          "The row query is scoped to the live level through data-dock-level, not to the whole shell. popLayout keeps the outgoing level mounted while it fades, so an unscoped query returns both levels' rows - and focusing one of the outgoing set drops focus to the body the moment it unmounts, which silently takes Escape and the arrow keys with it.",
          "A submenu row is a button even when it carries an href: it navigates the dock, not the document.",
          "Under prefers-reduced-motion the shell morph drops to zero duration and every slide collapses to opacity, so the menu still reads as a stack without anything travelling.",
          "Row props are narrowed to aria attributes plus style and title rather than all of HTMLAttributes - that carries React's own onDrag, whose signature contradicts the gesture handler motion puts on the same prop.",
          "If items changes underneath an open menu, the path resolves to the nearest level that still exists and the state is corrected to match, so Back keeps counting real levels instead of rendering an empty panel."
    ],
    code: `"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "cn";
import { SPRING_LAYOUT, SPRING_PRESS, SPRING_SWAP } from "../lib/easing";

// The navigation stack, inlined: a dock level is addressed by a path of
// indices - [] is the dock, [4] the menu item 4 opened, [4, 1] the menu item
// 1 of that opened. Push to descend, pop to go back, and arbitrary depth
// needs no special case per level.
/** The shape the stack needs. The component's own item type extends this.
 *  \`content\` is deliberately \`unknown\`: the stack only asks whether an item
 *  has some, never what it is, so this module stays free of React. */
interface MenuNode {
  label: string;
  items?: MenuNode[];
  content?: unknown;
}

interface Level<T extends MenuNode> {
  /** Rows to render, the dock's own items at the root. Empty on a content
   *  level, which renders its content in place of rows. */
  items: T[];
  /** Label of the item that opened this level - the panel's title. Undefined
   *  at the root, which is the dock and has no title. */
  title?: string;
  /** Set when the path landed on an item carrying content. The component
   *  renders this instead of \`items\`. */
  content?: unknown;
  /** True when the path pointed past a leaf, so \`items\` is the deepest level
   *  that did resolve. A path only goes stale if \`items\` changes underneath an
   *  open menu; resolving to the nearest valid ancestor beats rendering blank. */
  truncated: boolean;
}

/** Walks \`path\` into \`items\`, stopping at the last level that exists.
 *
 *  Content is terminal: an item carrying it is a level in its own right, and
 *  nothing can sit below it. A path that tries to descend past one is as stale
 *  as a path past a leaf, and truncates the same way. */
function menuAt<T extends MenuNode>(
  items: T[],
  path: number[],
): Level<T> {
  let level = items;
  let title: string | undefined;

  for (let step = 0; step < path.length; step++) {
    const next = level[path[step]];

    if (next?.content !== undefined) {
      // Terminal, so only the last segment may land here.
      return step === path.length - 1
        ? { items: [], title: next.label, content: next.content, truncated: false }
        : { items: level, title, truncated: true };
    }

    if (!next?.items?.length) return { items: level, title, truncated: true };
    level = next.items as T[];
    title = next.label;
  }

  return { items: level, title, truncated: false };
}

/** Row to focus after going back: the trigger the menu came out of, so the
 *  pointer lands where it left. Menu levels carry a Back row at index 0 and
 *  the dock does not, hence the shift on all but the root. */
function backFocusIndex(path: number[]): number {
  const trigger = path[path.length - 1] ?? 0;
  return path.length > 1 ? trigger + 1 : trigger;
}
import { IconChevronRight } from "@devigner-ui/icons";

/** Dock button, px. The dock's height is this plus the shell's padding either
 *  side, and DOCK_RADIUS is half of that - which is what makes the closed
 *  state read as a pill rather than a rounded box. */
const TAP = 40;
const PAD = 8;
const DOCK_RADIUS = (TAP + PAD * 2) / 2;
/** The shell's own border and the gap between dock buttons. Both live here
 *  rather than only in the classes because the closed footprint is computed
 *  from them. */
const BORDER = 1;
const GAP = 4;
/** The closed dock's outer height. The wrapper is fixed to exactly this, so
 *  the dock reserves its own footprint and a panel grows up out of it rather
 *  than pushing the page around. */
const CLOSED_H = BORDER * 2 + PAD * 2 + TAP;
/** The closed dock's outer width, from the item count alone - every dock
 *  button is TAP wide with GAP between, so this needs no measuring. */
const closedWidth = (count: number) =>
  BORDER * 2 + PAD * 2 + count * TAP + Math.max(0, count - 1) * GAP;
/** Panel corners. Close to DOCK_RADIUS on purpose: the two states share a
 *  corner, so the morph reads as one surface growing rather than a box
 *  swapping in. Pull them apart and the radius becomes the effect. */
const PANEL_RADIUS = 26;

/** How far a row slides in from, px. Enough to read as coming from the side:
 *  the surface is still settling underneath, and a timid throw gets lost in
 *  it. Much more than this and the rows read as a carousel. */
const SLIDE = 32;
/** How far the dock's own icons rise into place, px. Much smaller than SLIDE:
 *  the dock is the resting state, and it should settle rather than arrive. */
const DOCK_RISE = 10;
/** Held back until the surface has all but finished growing.
 *
 *  The surface grows upward, and motion fakes that growth with a projection
 *  transform on the shell - which drags everything inside it. Rows mounted
 *  during the growth ride that drag upward, and the level reads as rising from
 *  the bottom however hard the rows themselves slide sideways. Measured on the
 *  Account menu, a row visible from the start travels 22px vertically against
 *  32px of slide: 1.5x, not enough to read as horizontal. Waiting until the
 *  projection is near identity leaves 6px against the same 32px - 5.3x, and
 *  the slide is the only motion left to see.
 *
 *  Later still keeps trimming that residue (0.28 measures 8.9x) but buys less
 *  than it costs in latency. The alternative to the whole delay is animating
 *  the shell's width and height directly instead of by projection, which drags
 *  nothing - but that needs the content measured, and this is two lines. */
const ENTER_DELAY = 0.24;
/** Gap between consecutive rows arriving. Six rows at 28ms is under a fifth of
 *  a second all told, so the level still lands as one gesture. */
const STAGGER = 0.028;
/** Rows leave faster than they arrive. The outgoing level is not worth
 *  waiting for, and a slow exit is what makes a menu feel sticky. */
const EXIT = 0.11;

export interface MenuDockItem extends MenuNode {
  /** Row glyph. Optional, so a text-only menu row costs nothing. */
  icon?: React.ReactNode;
  /** Swapped in while this item is the active one. Without it the icon never
   *  changes, so an item opts into the state by supplying the second glyph. */
  activeIcon?: React.ReactNode;
  label: string;
  /** Children turn this item into a submenu, and its label becomes that
   *  menu's title. An item with both \`items\` and \`onSelect\` opens the menu -
   *  a row cannot both descend and act. */
  items?: MenuDockItem[];
  /** Makes the surface morph into this instead of into a menu - a search
   *  field, a grid, anything. The dock never learns what it is. Content is
   *  terminal, nothing nests below it, and it wins over \`items\` if both are
   *  given. The Back row above it carries the item's label, same as a menu. */
  content?: React.ReactNode;
  href?: string;
  onSelect?: () => void;
  /** What \`active\` is matched against. Falls back to \`label\`, so two items in
   *  one level that share a label need ids to be told apart. */
  id?: string;
  /** Renders the row in the destructive colour - Sign out, Delete. */
  destructive?: boolean;
}

export interface MenuDockProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  /** The dock, and every menu hanging off it. */
  items: MenuDockItem[];
  /** \`id\` (or \`label\`) of the current item, which renders its \`activeIcon\`. */
  active?: string;
  /** Pins the dock to the bottom centre of the viewport. Off by default: the
   *  parent owns the position, the way the other components here behave. */
  floating?: boolean;
  /** Fires on every level change, with the new index path. [] is the dock.
   *  Also fires for the automatic correction when \`items\` changes under an
   *  open level, which is the one change the dock makes on its own. */
  onNavigate?: (path: number[]) => void;
  /** Controlled navigation path - \`[]\` is the dock, \`[4]\` the level item 4
   *  opened. Omit it and the dock keeps its own; pass it, with \`onNavigate\`,
   *  to drive the dock from outside: closing it on a route change, deep
   *  linking to a level, restoring where someone left off.
   *
   *  While it is passed the dock renders this and nothing else, so a level
   *  only changes when you change it. That includes the corrections the dock
   *  would otherwise make for itself - it still reports them through
   *  \`onNavigate\`, but applying them is yours. */
  path?: number[];
  /** Accessible name for the dock itself. */
  label?: string;
  /** Classes for the footprint wrapper - the box that holds the closed dock's
   *  place in the page. Positioning belongs here; the surface inside it is
   *  taken out of flow so it can grow upward. */
  className?: string;
}

/** The shell clips its overflow, and focusing something the clip is hiding
 *  makes the browser scroll that hidden box to reveal it - which shifts the
 *  whole panel and never scrolls back. Rows are mid-transition when focus
 *  moves to them, so every focus this component performs opts out. */
const NO_SCROLL = { preventScroll: true } as const;

const keyOf = (item: MenuDockItem) => item.id ?? item.label;

/** Shared chrome for the two inline glyphs, and for whatever icon comes in. */
const GLYPH = "grid size-5 shrink-0 place-items-center [&_svg]:size-5";

const stroke = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Outline/solid icon swap. Only mounts the machinery when an item actually
 *  supplies both glyphs, so the common row stays a plain span. */
function Glyph({
  item,
  on,
  reduced,
}: {
  item: MenuDockItem;
  on: boolean;
  reduced: boolean;
}) {
  if (!item.icon || !item.activeIcon) return <>{item.icon ?? null}</>;

  const away = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.55 };

  return (
    <span className="relative grid place-items-center">
      {/* popLayout takes the outgoing glyph out of flow, so the incoming one
          lands exactly where it sat without either being positioned by hand. */}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={on ? "on" : "off"}
          initial={away}
          animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={away}
          transition={reduced ? { duration: 0.12 } : SPRING_SWAP}
          className="grid place-items-center"
        >
          {on ? item.activeIcon : item.icon}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** One row - a link when it carries an href, a button otherwise. The
 *  \`data-dock-row\` hook is what the arrow keys walk. */
function Row({
  href,
  className,
  children,
  onActivate,
  onFocus,
  /** What opening this row produces, for \`aria-haspopup\`. A content row opens
   *  a panel, not a menu, and saying "menu" there misdescribes it. */
  haspopup = false,
  /** Passed explicitly rather than defaulted: a content level omits it, and a
   *  default would swallow that - \`role={undefined}\` takes the default. */
  role,
  tabIndex = 0,
  ...rest
}: {
  href?: string;
  className?: string;
  children: React.ReactNode;
  onActivate: () => void;
  onFocus?: () => void;
  haspopup?: "menu" | "dialog" | false;
  role?: "menuitem";
  tabIndex?: number;
  /* Narrowed to what a row actually passes rather than all of
     HTMLAttributes: that carries React's own onDrag, whose signature
     contradicts the gesture one motion puts on the same prop. */
} & React.AriaAttributes & { style?: React.CSSProperties; title?: string }) {
  const shared = {
    "data-dock-row": "",
    role,
    tabIndex,
    onClick: onActivate,
    onFocus,
    whileTap: { scale: 0.96 },
    transition: SPRING_PRESS,
    className: cn(
      "relative flex cursor-pointer items-center outline-none",
      "focus-visible:ring-2 focus-visible:ring-accent/60",
      className,
    ),
    /* No aria-expanded anywhere, deliberately. Expanding replaces the trigger
       with the level it opened, so the row never exists in an expanded state -
       the attribute could only ever read "false", which is worse than absent. */
    ...(haspopup ? { "aria-haspopup": haspopup } : {}),
    ...rest,
  } as const;

  // A row that opens something is never a link: it navigates the dock, not
  // the document.
  return href && !haspopup ? (
    <motion.a href={href} {...shared}>
      {children}
    </motion.a>
  ) : (
    <motion.button type="button" {...shared}>
      {children}
    </motion.button>
  );
}

export function MenuDock({
  items,
  active,
  floating = false,
  onNavigate,
  label = "Menu",
  className,
  style,
  path: controlledPath,
  ...rest
}: MenuDockProps) {
  const reduced = useReducedMotion() ?? false;
  /** The dock's own path, used only while \`path\` is not passed. */
  const [ownPath, setOwnPath] = React.useState<number[]>([]);
  const controlled = controlledPath !== undefined;
  const path = controlled ? controlledPath : ownPath;
  /** 1 descending, -1 coming back. Rows slide in from the side you came from,
   *  which gives the stack a direction instead of a generic fade. */
  const [dir, setDir] = React.useState(1);
  const shell = React.useRef<HTMLDivElement>(null);
  /** Row to focus once the next level has mounted. null leaves focus alone,
   *  which is what stops the first render from stealing it. \`soft\` means "only
   *  if the close dropped focus on the floor" - see the effect below. */
  const wants = React.useRef<{ index: number; soft: boolean } | null>(null);
  /** The one tab stop in the level. A menu is a single stop with the arrows
   *  moving inside it, not one stop per row - so every other row is -1. */
  const [focusIndex, setFocusIndex] = React.useState(0);

  const level = menuAt(items, path);
  const open = path.length > 0 && !level.truncated;
  /** What the level renders in place of rows. Cast once, here: the path module
   *  types it \`unknown\` so it can stay free of React. */
  const content = level.content as React.ReactNode | undefined;
  const isContent = content !== undefined;

  /** Always the current render's values, for listeners that must not
   *  resubscribe to read them. onNavigate is usually an inline arrow, so an
   *  effect depending on it directly would tear down and rebind every render. */
  const latest = React.useRef({ path, onNavigate, controlled });
  latest.current = { path, onNavigate, controlled };

  /** The one way a level changes. Controlled, it only reports; uncontrolled,
   *  it reports and applies. Everything that moves the dock goes through
   *  here, so there is a single place where that distinction lives. */
  const go = React.useCallback(
    (
      next: number[],
      direction: number,
      focus: { index: number; soft: boolean } | null,
    ) => {
      setDir(direction);
      if (!latest.current.controlled) setOwnPath(next);
      if (focus) wants.current = focus;
      latest.current.onNavigate?.(next);
    },
    [],
  );

  /** A path gone stale under an open menu resolves to its nearest valid
   *  ancestor; correcting the state keeps Back counting real levels. The
   *  consumer hears about it too - it is a real level change, and staying
   *  quiet would leave any mirror of the path pointing at a level that is no
   *  longer open. */
  React.useEffect(() => {
    if (!level.truncated) return;
    // No focus move: nobody asked to go anywhere, the level just stopped
    // existing. Controlled, this only reports - applying it is the caller's.
    go(latest.current.path.slice(0, -1), -1, null);
  }, [level.truncated, go]);

  const levelKey = path.join(".") || "dock";

  /** Rows of the live level only. The scoping matters: popLayout keeps the
   *  outgoing level mounted while it fades, so a query across the whole shell
   *  returns both levels' rows - and focusing one of the outgoing set drops
   *  focus to the body the moment it unmounts, which takes Escape and the
   *  arrow keys with it. */
  const rows = React.useCallback(
    (key: string) =>
      Array.from(
        shell.current?.querySelectorAll<HTMLElement>(
          \`[data-dock-level="\${key}"] [data-dock-row]\`,
        ) ?? [],
      ),
    [],
  );

  const back = React.useCallback(() => {
    if (!path.length) return;
    go(path.slice(0, -1), -1, { index: backFocusIndex(path), soft: false });
  }, [go, path]);

  // Focus follows the level, but only where a navigation asked for it.
  React.useEffect(() => {
    const target = wants.current;
    wants.current = null;
    // Every level starts its tab stop at the top, whether or not focus moves.
    setFocusIndex(target?.index ?? 0);
    if (!target) return;

    /* A soft request has to wait a frame. It comes from a pointerdown, and
       the browser does its own focusing for that gesture after the handler
       runs - claiming focus now just gets overwritten, landing on <body>
       anyway. A frame later the gesture has settled, so we can see whether
       anything actually took focus and only step in if nothing did. */
    if (target.soft) {
      const index = target.index;
      const frame = requestAnimationFrame(() => {
        const held = document.activeElement;
        if (held && held !== document.body) return;
        const all = rows(levelKey);
        all[Math.min(index, all.length - 1)]?.focus(NO_SCROLL);
      });
      return () => cancelAnimationFrame(frame);
    }

    // On a content level the field is the point of opening it - landing on the
    // Back row instead would mean tabbing into your own search box.
    const field = shell.current?.querySelector<HTMLElement>(
      \`[data-dock-level="\${levelKey}"] :is(input, textarea, select, [contenteditable="true"])\`,
    );
    if (field) {
      field.focus(NO_SCROLL);
      return;
    }

    const all = rows(levelKey);
    all[Math.min(target.index, all.length - 1)]?.focus(NO_SCROLL);
  }, [levelKey, rows]);

  /** Outside click closes all the way to the dock. It matters most for a
   *  content level: a text field has no row to press to get back out. The
   *  opening click's own pointerdown has already fired by the time this
   *  listener attaches, so it never closes what it just opened. */
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (shell.current?.contains(e.target as Node)) return;
      /* Soft: the row holding focus is about to unmount, and if the click
         landed on nothing focusable that leaves focus on <body> and the dock
         has to be tabbed into again from the top of the page. But clicking a
         focusable thing outside should let it keep focus, so this only
         reclaims focus if nothing else took it. */
      go([], -1, { index: latest.current.path[0] ?? 0, soft: true });
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, go]);

  function onKeyDown(e: React.KeyboardEvent) {
    // Escape still pops, but the arrows belong to whatever the content is -
    // in a text field they move the caret, and stealing them breaks typing.
    if (isContent) {
      if (e.key === "Escape") {
        e.preventDefault();
        back();
      }
      return;
    }

    const all = rows(levelKey);
    if (!all.length) return;
    const at = all.indexOf(document.activeElement as HTMLElement);
    // The dock is a row and its menus are columns, so the arrows that walk
    // them differ; the other axis is left to the browser.
    const next = open ? "ArrowDown" : "ArrowRight";
    const prev = open ? "ArrowUp" : "ArrowLeft";

    const move = (to: number) => {
      e.preventDefault();
      all[(to + all.length) % all.length]?.focus(NO_SCROLL);
    };

    if (e.key === next) move(at + 1);
    else if (e.key === prev) move(at - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(all.length - 1);
    else if (e.key === "Escape" && open) {
      e.preventDefault();
      back();
    }
  }

  // Rows carry the slide and the level only fades. Both on one element would
  // double every row's travel.
  const levelFade = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: reduced ? 0 : STAGGER,
        delayChildren: reduced ? 0 : ENTER_DELAY,
      },
    },
    exit: { opacity: 0, transition: { duration: EXIT } },
  };
  const row = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0, transition: { duration: EXIT } },
      }
    : open
      ? {
          initial: { opacity: 0, x: dir * SLIDE },
          animate: { opacity: 1, x: 0, transition: SPRING_SWAP },
          exit: { opacity: 0, x: dir * -SLIDE, transition: { duration: EXIT } },
        }
      : {
          // The dock is a row of icons, not a list of rows, so it does not
          // arrive the way a level does. Sliding it in from the side reads as
          // a sixth menu level; rising a little into place reads as the panel
          // collapsing back into the pill it came from.
          initial: { opacity: 0, y: DOCK_RISE },
          animate: { opacity: 1, y: 0, transition: SPRING_SWAP },
          exit: { opacity: 0, y: DOCK_RISE, transition: { duration: EXIT } },
        };

  return (
    /* Three layers, and each one earns its place. The wrapper holds the closed
       dock's footprint so opening a menu never moves the page. The anchor is
       pinned to the wrapper's bottom edge, which is what makes the panel grow
       upward only - left to itself the shell is centred by whatever contains
       it, and it grows both ways. The anchor also owns the centring transform,
       because a transform on the layout-animated shell gets overwritten by
       motion's own projection partway through the morph. */
    <div
      {...rest}
      className={cn(
        "relative",
        floating && "fixed bottom-6 left-1/2 z-50 -translate-x-1/2",
        className,
      )}
      /* max-width, because the footprint is a hard pixel width: closedWidth
         grows 44px an item, so nine of them is 410px and would force the page
         to scroll sideways on a phone. Capping here keeps the dock inside its
         parent; the row itself scrolls when it no longer fits. */
      style={{
        width: closedWidth(items.length),
        maxWidth: "100%",
        height: CLOSED_H,
        ...style,
      }}
    >
      {/* w-fit, so the anchor tracks the shell's width and its own -50% keeps
          the surface centred on the dock at every size. No max-width here: it
          would resolve against the wrapper, which is the closed pill, and a
          panel is meant to be wider than the pill it grew out of. */}
      <div className="absolute bottom-0 left-1/2 w-fit -translate-x-1/2">
        <motion.div
          ref={shell}
          layout
          /* motion corrects borderRadius through a layout animation, which is
             why the corner can animate on the very element being measured - a
             plain class swap would snap partway. */
          style={{ borderRadius: open ? PANEL_RADIUS : DOCK_RADIUS }}
          transition={reduced ? { duration: 0 } : SPRING_LAYOUT}
          onKeyDown={onKeyDown}
          /* A content level is not a menu. \`menu\` permits only menuitem,
             group and separator as children, so the moment the surface holds
             a text field the role is a lie and screen readers mis-report what
             is inside it. Dialog is what an arbitrary panel actually is. */
          role={isContent ? "dialog" : "menu"}
          aria-label={open && level.title ? level.title : label}
          aria-orientation={
            isContent ? undefined : open ? "vertical" : "horizontal"
          }
          /* Clamped to the viewport, not to the wrapper. The wrapper is the
             closed pill's footprint and a panel is meant to outgrow it, while
             \`max-w-full\` here would resolve against the anchor - which is
             sized by this element, so it would constrain nothing at all. The
             screen edge is the real limit.
             overflow-hidden because rows enter on x: coming back up a level
             they start SLIDE to the left of where they land, which is 23px
             outside the panel, and without clipping they are simply drawn on
             the page beside it. The clip belongs on this element rather than
             on the level inside: rows sit within the p-2, so their focus ring
             has room and survives, where clipping the level would cut it. */
          className="w-fit max-w-[calc(100vw-2rem)] overflow-hidden border border-border bg-background p-2 shadow-elevated"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {/* Keyed by the path, so descending and coming back are both one level
                swapping for another rather than a reconciliation of rows. */}
            <motion.div
              key={levelKey}
              data-dock-level={levelKey}
              variants={levelFade}
              initial="initial"
              animate="animate"
              exit="exit"
              /* Position-only. This is motion's scale correction: the shell is
                 mid-projection around this, and without it the level is scaled
                 by whatever the shell's box is doing - on close that measures a
                 3.9x stretch, 40px rows rendering 156px tall. The catch is that
                 it also animates the block between its old and new layout
                 positions, ~160px vertically on a dock-to-menu change, which is
                 what used to make the level read as rising from the bottom.
                 ENTER_DELAY is what makes it safe: the rows are still invisible
                 while that travel happens. */
              layout="position"
              className={cn(
                open
                  ? "flex min-w-60 flex-col gap-0.5"
                  : // The dock scrolls rather than overflowing once there are
                    // more icons than the parent is wide.
                    "flex max-w-full items-center gap-1 overflow-x-auto",
              )}
              /* Room for the rise, and then taken straight back out of the
                 layout. \`overflow-x: auto\` drags overflow-y to \`auto\` with it
                 - CSS will not let one axis scroll while the other stays
                 visible - so the DOCK_RISE the icons enter on counts as 10px
                 of scrollable height and puts a vertical scrollbar across the
                 dock for the whole entrance. Padding makes that 10px part of
                 the scrollable box instead of overflow; the negative margin
                 means the pill is not 20px taller for it. */
              style={
                open
                  ? undefined
                  : { paddingBlock: DOCK_RISE, marginBlock: -DOCK_RISE }
              }
            >
              {open && (
                <motion.div variants={row}>
                  <Row
                    onActivate={back}
                    onFocus={() => setFocusIndex(0)}
                    role={isContent ? undefined : "menuitem"}
                    tabIndex={isContent || focusIndex === 0 ? 0 : -1}
                    className={cn(
                      "h-10 w-full gap-3 rounded-2xl px-3 text-left text-[15px]",
                      "font-medium text-foreground transition-colors hover:bg-surface-hover",
                    )}
                  >
                    <span className={GLYPH} aria-hidden>
                      <svg {...stroke}>
                        <path d="M19 12H5M11 18l-6-6 6-6" />
                      </svg>
                    </span>
                    {/* The title doubles as the Back label: one row says both where
                        you are and what leaving it costs. Spoken, the title alone
                        is indistinguishable from the row that opened it, so the
                        direction is said out loud - and kept as a prefix rather
                        than an aria-label, so the accessible name still contains
                        the visible one. */}
                    <span className="sr-only">Back to </span>
                    <span className="truncate">{level.title}</span>
                  </Row>
                </motion.div>
              )}

              {/* A content level renders this in place of rows. It rides the
                  same row variant, so it arrives with the Back row above it
                  rather than appearing separately. */}
              {isContent && <motion.div variants={row}>{content}</motion.div>}

              {level.items.map((item, i) => {
                // Both kinds descend a level; content wins, matching menuAt.
                // A content row opens a panel, so it says so - calling that a
                // menu misdescribes what the row is about to produce.
                const expands =
                  item.content !== undefined
                    ? ("dialog" as const)
                    : item.items?.length
                      ? ("menu" as const)
                      : false;
                const on = active !== undefined && keyOf(item) === active;
                // Rows sit below the Back row once a level is open.
                const rowIndex = open ? i + 1 : i;

                return (
                  /* Keyed by position, not by label. Two items in one level
                     can legitimately share a label, and a duplicate React key
                     silently drops one of them - the level is already keyed by
                     its path, so identity across levels is not at stake. */
                  <motion.div key={rowIndex} variants={row}>
                    <Row
                      href={item.href}
                      role="menuitem"
                      haspopup={expands}
                      onActivate={() =>
                        expands
                          ? go([...path, i], 1, { index: 1, soft: false })
                          : item.onSelect?.()
                      }
                      onFocus={() => setFocusIndex(rowIndex)}
                      tabIndex={isContent || focusIndex === rowIndex ? 0 : -1}
                      aria-current={on ? "page" : undefined}
                      {...(open ? {} : { "aria-label": item.label })}
                      title={open ? undefined : item.label}
                      style={open ? undefined : { width: TAP, height: TAP }}
                      className={cn(
                        "transition-colors hover:bg-surface-hover",
                        open
                          ? "h-10 w-full gap-3 rounded-2xl px-3 text-left text-[15px]"
                          : // shrink-0 or the flex row squashes the icons to
                            // fit instead of letting the dock scroll.
                            "shrink-0 justify-center rounded-full",
                        open && item.destructive && "text-destructive",
                        open && !item.destructive && "text-foreground",
                        !open &&
                          (on
                            ? "text-foreground"
                            : "text-text-secondary hover:text-foreground"),
                      )}
                    >
                      <span className={GLYPH}>
                        <Glyph item={item} on={on} reduced={reduced} />
                      </span>
                      {open && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}
                      {open && expands && (
                        <IconChevronRight
                          className={cn(GLYPH, "text-text-muted size-4")}
                          strokeWidth={2.5}
                          aria-hidden
                        />
                      )}
                    </Row>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
`,
    usage: `import { MenuDock } from "@/components/ui/menu-dock";
import {
  IconHome2,
  IconMagnifer,
  IconHeart,
  IconArchive,
  IconUser,
  IconBrush,
  IconStars,
  IconInbox,
  IconLogout,
  IconHistory,
  IconBookmark,
} from "@devigner-ui/icons";

// Whatever an item's \`content\` renders, the dock morphs into. It is ordinary
// markup with its own state - nothing here is a MenuDock API.
function SearchPanel() {
  const [query, setQuery] = useState("");
  const hits = search(query).slice(0, 5);

  return (
    <div className="flex w-72 flex-col gap-1">
      <div className="flex h-10 items-center gap-3 rounded-2xl bg-surface px-3">
        <IconMagnifer className="size-5 shrink-0 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-text-muted"
        />
      </div>
      {hits.map((hit) => (
        <button
          key={hit.id}
          className="flex h-10 items-center gap-3 rounded-2xl px-3 text-left text-[15px] hover:bg-surface-hover"
        >
          {hit.label}
        </button>
      ))}
    </div>
  );
}

<MenuDock
  active="home"
  items={[
    { id: "home", label: "Home", icon: <IconHome2 />, activeIcon: <IconHome2 variant="Bold" />, href: "/" },
    // An item with \`content\` morphs the surface into it instead of into a
    // menu. SearchPanel is ordinary markup holding its own state.
    { id: "search", label: "Search", icon: <IconMagnifer />, content: <SearchPanel /> },
    { id: "saved", label: "Saved", icon: <IconHeart />, activeIcon: <IconHeart variant="Bold" /> },
    { id: "library", label: "Library", icon: <IconArchive />, items: [
      { label: "Recently viewed", icon: <IconHistory /> },
      { label: "Bookmarked", icon: <IconBookmark /> },
    ] },
    {
      id: "account",
      label: "Account",
      icon: <IconStars />,
      items: [
        { label: "Profile", icon: <IconUser />, items: [
          { label: "Personal", icon: <IconUser /> },
          { label: "Work", icon: <IconArchive /> },
        ] },
        { label: "Appearance", icon: <IconBrush /> },
        { label: "Invite a friend", icon: <IconInbox /> },
        { label: "Sign out", icon: <IconLogout />, destructive: true },
      ],
    },
  ]}
/>`,
  },
  "notch": {
    slug: "notch",
    name: "Notch",
    description:
      "A notification that grows down out of the top edge of the viewport and stays welded to it",
    category: "animation",
    variants: ["Success", "Error", "Promise", "With action", "Expanded"],
    props: [
      {
        name: "flare",
        type: "number",
        default: "18",
        description:
          "Radius in px of the two inverted top corners, which is also how far the surface overhangs the content on each side. Clamped against the notch's own height.",
      },
      {
        name: "duration",
        type: "number",
        default: "4000",
        description:
          "Default auto-dismiss in ms. Infinity pins the notch until it is dismissed by hand.",
      },
      {
        name: "expand",
        type: "boolean",
        default: "false",
        description:
          "Whether hovering expands the notch. Click-to-expand is always on.",
      },
      {
        name: "offset",
        type: "number",
        default: "0",
        description:
          "Extra px below the top edge, for consumers with a fixed header of their own.",
      },
      {
        name: "hotkey",
        type: "string[]",
        default: '["altKey","KeyT"]',
        description:
          "Moves focus into the notch. Notifications never take focus on their own.",
      },
      {
        name: "className",
        type: "string",
        default: "-",
        description: "Classes for the content surface, not the fixed wrapper.",
      },
    ],
    usage: `toast.success("Deployed");
toast.promise(deploy(), {
  loading: "Deploying...",
  success: "Live",
  error: "Failed",
});`,
    notes: [
      "Reduced motion renders a plain bordered box instead of the flared surface, with no separate entrance animation. The flare exists to sell the notch emerging from the edge, and with the motion gone there is nothing for it to sell.",
      "One notch at a time. A second notification morphs the surface in place and raises a counter rather than stacking.",
      "Deltas from Sonner: no position prop, it is always top center. No richColors. No visibleToasts, the stack is always collapsed behind the counter. expand means hover-to-expand the pending list, not Sonner's expand-the-stack.",
      "The border is a real 1px stroke, not a second shape peeking out from behind the fill, so it draws crisp at any flare value.",
      "Mounting two <Toaster /> instances at once renders two overlapping notches and announces every notification twice. Render exactly one.",
    ],
    code: `"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "cn";
import { IconCheck, IconAlertTriangle, IconClose, IconSpinner } from "@devigner-ui/icons";

// Motion tokens, inlined - a copy-paste install has neither the shared
// easing module nor the package it lives in.
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const SPRING_PRESS = { type: "spring", stiffness: 500, damping: 30, mass: 0.6 } as const;
const SPRING_SWAP = { type: "spring", stiffness: 460, damping: 30, mass: 0.55 } as const;
const SPRING_LAYOUT = { type: "spring", stiffness: 360, damping: 32, mass: 0.6 } as const;
/** The notch emerging through the viewport edge. Heavy on purpose: mass is
 *  what reads as liquid rather than a card being dealt. */
const SPRING_GOO = { type: "spring", stiffness: 260, damping: 26, mass: 1.1 } as const;
/** Retracting back into the anchor. Over-damped, so it never bounces - an
 *  exit that wobbles reads as indecision, and nobody watches the way out. */
const SPRING_RETRACT = { type: "spring", stiffness: 300, damping: 34 } as const;

// ─── Queue, inlined ───
// Pure functions over an immutable list, kept apart from the store below so
// the state machine stays checkable on its own, with no DOM or React in it.
// The list is ordered newest first: the notch renders index 0, so the thing
// that just happened is always what is on screen.

type NotchStatus = "default" | "success" | "error" | "warning" | "loading";

interface NotchRecord {
  id: string;
  status: NotchStatus;
  /** Content slots are \`unknown\`, not React types, so this stays free of
   *  React and the queue never looks inside them, only moves them around. */
  title?: unknown;
  description?: unknown;
  icon?: unknown;
  /** Escape hatch. Wins over the structured slots when both are given. */
  content?: unknown;
  action?: { label: string; onClick: () => void };
  cancel?: { label: string; onClick?: () => void };
  /** Infinity pins the notch until something dismisses it by hand. */
  duration: number;
  createdAt: number;
}

/** Adds a notch, or refreshes one already in the list. Refreshing keeps its
 *  position rather than moving it to the front - a promise resolving is old
 *  news finishing, not new news arriving. */
function addNotch(list: NotchRecord[], record: NotchRecord): NotchRecord[] {
  const at = list.findIndex((n) => n.id === record.id);
  if (at === -1) return [record, ...list];
  const next = list.slice();
  next[at] = record;
  return next;
}

/** Patches one record. An unknown id is a no-op, not a throw: a promise can
 *  settle after its notch was dismissed by hand, which is ordinary. */
function updateNotch(
  list: NotchRecord[],
  id: string,
  patch: Partial<NotchRecord>,
): NotchRecord[] {
  const at = list.findIndex((n) => n.id === id);
  if (at === -1) return list;
  const next = list.slice();
  next[at] = { ...next[at], ...patch };
  return next;
}

/** Removes one notch, or every notch when no id is given. */
function dismissNotch(list: NotchRecord[], id?: string): NotchRecord[] {
  if (id === undefined) return [];
  return list.some((n) => n.id === id) ? list.filter((n) => n.id !== id) : list;
}

/** Milliseconds left before a record expires, given how long its timer has
 *  actually run. Elapsed is passed in, not read from a clock, so this stays
 *  pure - the store owns the clock, and pausing is elapsed not advancing. */
function remainingMs(record: NotchRecord, elapsed: number): number {
  if (record.duration === Infinity) return Infinity;
  return Math.max(0, record.duration - elapsed);
}

// ─── Store, inlined ───
// Module-level state, deliberately: useSyncExternalStore over a plain array
// is React's own primitive for this, and keeping the array outside React is
// the whole reason toast() can be called from an event handler, a router
// loader, or anywhere else with no provider in scope.

/** Default time on screen. Long enough to read two lines, short enough that
 *  a burst drains rather than queueing up behind the counter. Mutable so
 *  \`<Toaster duration>\` can override it. */
let defaultDuration = 4000;

function setDefaultDuration(ms: number) {
  defaultDuration = ms;
}

let list: NotchRecord[] = [];
const listeners = new Set<() => void>();

const emit = () => {
  for (const l of listeners) l();
};

const setList = (next: NotchRecord[]) => {
  if (next === list) return;
  list = next;
  emit();
};

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

const snapshot = () => list;
/** The server snapshot must be a stable reference, not a fresh []. A new
 *  array every call makes React think the store changed on every render. */
const EMPTY: NotchRecord[] = [];
const serverSnapshot = () => EMPTY;

function useNotches(): NotchRecord[] {
  return React.useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/* One timer per notch, tracked by id. Pausing banks the elapsed time rather
   than guessing, so resuming schedules exactly what was left - a hover never
   silently grants a full extra duration. */
const timers = new Map<
  string,
  {
    /** Absent while paused: banked here with no live handle so
     *  resumeTimers can find and start it. */
    handle: ReturnType<typeof setTimeout> | undefined;
    startedAt: number;
    elapsed: number;
  }
>();

/* Reason-counted rather than a single boolean, so a pointer leaving while the
   window is still blurred cannot resume a background toast's timer out from
   under the blur pause. */
const pauseReasons = new Set<string>();
const isPaused = () => pauseReasons.size > 0;

function schedule(id: string) {
  const record = list.find((n) => n.id === id);
  if (!record) return;
  const banked = timers.get(id)?.elapsed ?? 0;
  const left = remainingMs(record, banked);
  if (left === Infinity) return;
  const existing = timers.get(id);
  if (existing?.handle) clearTimeout(existing.handle);
  if (isPaused()) {
    // No live handle while paused, so a notch created (or settled) mid-pause
    // still lands in \`timers\` and resumeTimers can discover and start it.
    timers.set(id, { handle: undefined, startedAt: Date.now(), elapsed: banked });
    return;
  }
  timers.set(id, {
    handle: setTimeout(() => remove(id), left),
    startedAt: Date.now(),
    elapsed: banked,
  });
}

function unschedule(id: string) {
  const t = timers.get(id);
  if (!t) return;
  clearTimeout(t.handle);
  timers.delete(id);
}

/** Banks elapsed time on every live timer and stops the clock. Called on
 *  pointer enter and on window blur - without the blur case a notification
 *  expires while the user is in another tab and is never seen. */
function pauseTimers(reason: string) {
  const wasPaused = isPaused();
  pauseReasons.add(reason);
  if (wasPaused) return;
  for (const [id, t] of timers) {
    if (!t.handle) continue;
    clearTimeout(t.handle);
    timers.set(id, {
      ...t,
      handle: undefined,
      elapsed: t.elapsed + (Date.now() - t.startedAt),
    });
  }
}

function resumeTimers(reason: string) {
  pauseReasons.delete(reason);
  if (isPaused()) return;
  for (const id of timers.keys()) schedule(id);
}

function remove(id: string) {
  unschedule(id);
  setList(dismissNotch(list, id));
}

let counter = 0;
const nextId = () => \`notch-\${++counter}\`;

interface NotchOptions {
  id?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** Renders instead of the structured slots. */
  content?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  cancel?: { label: string; onClick?: () => void };
  /** Infinity pins the notch until it is dismissed by hand. */
  duration?: number;
}

function create(
  status: NotchStatus,
  title: React.ReactNode,
  options: NotchOptions = {},
): string {
  const id = options.id ?? nextId();
  const record: NotchRecord = {
    id,
    status,
    title,
    description: options.description,
    icon: options.icon,
    content: options.content,
    action: options.action,
    cancel: options.cancel,
    duration: options.duration ?? defaultDuration,
    createdAt: Date.now(),
  };
  setList(addNotch(list, record));
  unschedule(id);
  schedule(id);
  return id;
}

/** Patches a live notch and restarts its clock. Used by promise settlement,
 *  which must morph the surface rather than replace it - a dismiss plus a
 *  create would withdraw the notch behind the edge and replay its whole
 *  entrance again for what is really one notification changing its mind. */
function settle(
  id: string,
  status: NotchStatus,
  title: React.ReactNode,
  duration: number,
) {
  if (!list.some((n) => n.id === id)) return;
  setList(
    updateNotch(list, id, { status, title, duration, createdAt: Date.now() }),
  );
  unschedule(id);
  schedule(id);
}

const resolveMessage = <T,>(
  msg: React.ReactNode | ((value: T) => React.ReactNode),
  value: T,
): React.ReactNode =>
  typeof msg === "function" ? (msg as (v: T) => React.ReactNode)(value) : msg;

function base(
  titleOrOptions: React.ReactNode | (NotchOptions & { title?: React.ReactNode }),
  options?: NotchOptions,
): string {
  // Object-form call: toast({ title, description, action }).
  if (
    titleOrOptions !== null &&
    typeof titleOrOptions === "object" &&
    !React.isValidElement(titleOrOptions) &&
    !Array.isArray(titleOrOptions)
  ) {
    const { title, ...rest } = titleOrOptions as NotchOptions & {
      title?: React.ReactNode;
    };
    return create("default", title, rest);
  }
  return create("default", titleOrOptions as React.ReactNode, options);
}

const toast = Object.assign(base, {
  success: (t: React.ReactNode, o?: NotchOptions) => create("success", t, o),
  error: (t: React.ReactNode, o?: NotchOptions) => create("error", t, o),
  warning: (t: React.ReactNode, o?: NotchOptions) => create("warning", t, o),
  /** Defaults to pinned: a spinner that vanishes on a timer leaves the user
   *  believing the work was abandoned. */
  loading: (t: React.ReactNode, o?: NotchOptions) =>
    create("loading", t, { duration: Infinity, ...o }),

  promise: <T,>(
    p: Promise<T>,
    msgs: {
      loading: React.ReactNode;
      success: React.ReactNode | ((value: T) => React.ReactNode);
      error: React.ReactNode | ((err: unknown) => React.ReactNode);
    },
    options: NotchOptions = {},
  ): Promise<T> => {
    const duration = options.duration ?? defaultDuration;
    const id = create("loading", msgs.loading, { ...options, duration: Infinity });
    // The derived promise is discarded rather than returned - callers get
    // \`p\` back unchanged, below - but a success/error formatter that itself
    // throws would otherwise reject it with nothing attached, an unhandled
    // rejection in SSR or Node. The catch only needs to exist.
    p.then(
      (value) => settle(id, "success", resolveMessage(msgs.success, value), duration),
      (err) => settle(id, "error", resolveMessage(msgs.error, err), duration),
    ).catch(() => {});
    return p;
  },

  dismiss: (id?: string) => {
    if (id === undefined) {
      for (const key of [...timers.keys()]) unschedule(key);
      setList(dismissNotch(list));
      return;
    }
    remove(id);
  },
});

export { toast };
export type { NotchOptions, NotchStatus, NotchRecord };

// ─── Notch path, inlined ───
// The outline as an exact path, kept apart from the component so the
// geometry is pure. The shape is a rounded box welded to the top edge of the
// viewport, with its two TOP corners inverted so the surface flares outward
// into the edge instead of curving away from it - CSS has no concave corner,
// which is why this is a path rather than a div with a border-radius.

interface NotchPathSpec {
  /** The notch body's width, not counting the flare either side. */
  width: number;
  height: number;
  /** The two BOTTOM corners, which curve the ordinary way. */
  radius: number;
  /** The two TOP corners, which curve the other way. Doubles as how far the
   *  surface overhangs the body on each side. */
  flare: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Both radii, reconciled against the box they have to fit inside. */
function notchRadii(spec: NotchPathSpec) {
  const { width, height } = spec;
  const radius = clamp(spec.radius, 0, Math.min(width, height) / 2);
  const flare = clamp(spec.flare, 0, height - radius);
  return { radius, flare };
}

/** Total width the surface occupies, body plus both flares. */
function notchOuterWidth(spec: NotchPathSpec): number {
  return spec.width + notchRadii(spec).flare * 2;
}

/** Everything but the top edge: in at the right flare, down and around the
 *  bottom, back up and out at the left flare. Shared so the fill and the
 *  stroke can never disagree about the shape. */
function notchSides(spec: NotchPathSpec): string {
  const { height } = spec;
  const { radius: r, flare: f } = notchRadii(spec);
  const w = notchOuterWidth(spec);
  const left = f;
  const right = w - f;

  return [
    \`A \${f} \${f} 0 0 1 \${right} \${f}\`,
    \`L \${right} \${height - r}\`,
    \`A \${r} \${r} 0 0 1 \${right - r} \${height}\`,
    \`L \${left + r} \${height}\`,
    \`A \${r} \${r} 0 0 1 \${left} \${height - r}\`,
    \`L \${left} \${f}\`,
    \`A \${f} \${f} 0 0 1 0 0\`,
  ].join(" ");
}

/** The filled outline, traversed clockwise from the top-left. The top
 *  boundary is a straight line because it IS the viewport edge. */
function notchPath(spec: NotchPathSpec): string {
  return \`M 0 0 L \${notchOuterWidth(spec)} 0 \${notchSides(spec)} Z\`;
}

/** The same outline with the top edge left out, and left open - stroking the
 *  closed path instead would draw a hairline straight across the viewport
 *  edge, which is not an edge of anything. */
function notchOutline(spec: NotchPathSpec): string {
  return \`M \${notchOuterWidth(spec)} 0 \${notchSides(spec)}\`;
}

// ─── Component ───

/** Resting position: the notch's top edge flush with the viewport's, so its
 *  inverted top corners meet the edge exactly. It grows down out of the edge
 *  and withdraws back behind it, never a detached shape. */
const Y_TO = 0;
/** Clearance above the notch's own height when hidden, so nothing peeks. */
const HIDE_GAP = 8;
/** Last stretch of emergence over which content fades in, fixed rather than
 *  derived from height so a one-line and an expanded notch fade the same. */
const REVEAL = 24;

/** The surface: one svg, filled and stroked from the same geometry so they
 *  cannot drift apart. \`overflow-visible\` matters - the stroke straddles the
 *  path, so half of it falls outside the viewBox and a clipping svg would
 *  shave the outline down to nothing along the sides. */
function NotchSurface({
  y,
  width,
  height,
  radius,
  flare,
}: {
  y: MotionValue<number>;
  width: number;
  height: number;
  radius: number;
  flare: number;
}) {
  const spec = { width, height, radius, flare };
  const outer = notchOuterWidth(spec);

  return (
    <motion.svg
      aria-hidden
      focusable="false"
      className="pointer-events-none absolute left-1/2 top-0 overflow-visible"
      width={outer}
      height={height}
      viewBox={\`0 0 \${outer} \${height}\`}
      style={{ y, x: -outer / 2 }}
    >
      <path d={notchPath(spec)} fill="var(--background)" />
      {/* Stroked from the OPEN outline on purpose - the closed path includes
          the viewport edge, and stroking that lays a hairline across the top
          of the notch. */}
      <path d={notchOutline(spec)} fill="none" stroke="var(--border)" strokeWidth={1} />
    </motion.svg>
  );
}

/** Corner radius of the resting pill. Half the minimum height, so a
 *  single-line notch reads as a pill and a grown one keeps the same corner
 *  rather than swapping shape as it expands. */
const RADIUS = 22;
/** Width floor. Below this a one- or two-word title ("Saved") reads as a
 *  stray badge rather than a notification - the pill needs enough width to
 *  look intentional even when the content itself is short. */
const MIN_W = 180;
const MIN_H = 44;

/** Measures the content so the blob underneath can match it. The blob has no
 *  content of its own, so nothing sizes it, yet it has to track a pill sized
 *  by its own text through an entrance, a status morph and an expand. A
 *  ResizeObserver is the honest answer here. */
function useContentSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = React.useState({ width: MIN_W, height: MIN_H });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      // Border box, not entry.contentRect: the measured element carries
      // px-4 py-3 with box-sizing: border-box (Tailwind preflight), so the
      // content box is 32px narrower and 24px shorter than the pill actually
      // shown. offsetWidth/offsetHeight covers browsers without
      // borderBoxSize.
      const borderBox = entry.borderBoxSize?.[0];
      const w = borderBox ? borderBox.inlineSize : el.offsetWidth;
      const h = borderBox ? borderBox.blockSize : el.offsetHeight;
      setSize({
        width: Math.max(MIN_W, Math.round(w)),
        height: Math.max(MIN_H, Math.round(h)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export interface ToasterProps {
  /** Radius in px of the two inverted top corners, which is also how far
   *  the surface overhangs the content on each side. Clamped against the
   *  notch's own height. */
  flare?: number;
  /** Default auto-dismiss in ms. Per-notch \`duration\` overrides it. */
  duration?: number;
  /** Whether hovering expands the notch. Click-to-expand is always on. */
  expand?: boolean;
  /** Extra px below the top edge, for consumers with a fixed header of their
   *  own. The component does not know about anyone else's layout. */
  offset?: number;
  /** Moves focus into the notch. Toasts must never take focus by themselves. */
  hotkey?: string[];
  /** Classes for the content surface, not the fixed wrapper. */
  className?: string;
}

export function Toaster({
  flare = 18,
  duration,
  expand = false,
  offset = 0,
  hotkey = ["altKey", "KeyT"],
  className,
}: ToasterProps) {
  const reduced = useReducedMotion() ?? false;
  const notches = useNotches();
  const current = notches[0];
  const content = React.useRef<HTMLDivElement>(null);
  const surface = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContentSize(content);

  /* One motion value, two consumers. The blob and the content both read this,
     so they physically cannot drift apart - there is only one number. */
  /* Hidden position: the notch's whole measured height above the edge, plus
     clearance. Derived rather than constant, since a fixed offset that
     tucks a one-line notch away leaves an expanded one's bottom rows on
     screen. */
  const hiddenY = -(height + HIDE_GAP);

  const raw = useMotionValue(hiddenY);
  const y = useSpring(raw, current?.status ? SPRING_GOO : SPRING_RETRACT);

  React.useEffect(() => {
    raw.set(current ? Y_TO : hiddenY);
  }, [current, hiddenY, raw]);

  /* Content opacity as a pure function of the same shared value: 0 while
     still more than REVEAL behind the edge, 1 once settled. Reusing it on
     the way out is what makes the exit sequence itself. Clamped so a spring
     overshoot past Y_TO cannot push opacity above 1. */
  const contentOpacity = useTransform(y, [Y_TO - REVEAL, Y_TO], [0, 1], {
    clamp: true,
  });

  /* Per-notch duration passed to toast() still wins, since create()/settle()
     only fall back to this when the caller did not supply one. */
  React.useEffect(() => {
    if (duration !== undefined) setDefaultDuration(duration);
  }, [duration]);

  const [open, setOpen] = React.useState(false);

  /* Collapse whenever the rendered notch changes. An expanded panel that
     silently swaps its contents for a different notification is how the
     wrong button gets pressed. */
  React.useEffect(() => {
    setOpen(false);
  }, [current?.id]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* Without this a notification expires while the user is in another tab
     and is never seen. Hover pausing alone does not cover it.

     "blur" and "hover" are separate pause reasons, so a pointer leaving
     while the window is still blurred cannot cancel the blur pause.
     Cleanup releases both reasons on unmount - otherwise a Toaster that
     unmounts (route change) while blurred, or while hovered so
     onPointerLeave never fires, leaves that reason held in module scope for
     the rest of the session and no future toast ever auto-dismisses. */
  React.useEffect(() => {
    const onBlur = () => pauseTimers("blur");
    const onFocus = () => resumeTimers("blur");
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      resumeTimers("blur");
      resumeTimers("hover");
    };
  }, []);

  /* A toast must never take focus by itself, it would yank the caret out of
     whatever is being typed. The hotkey is how a keyboard user reaches it
     deliberately. */
  React.useEffect(() => {
    const MODIFIERS = ["altKey", "ctrlKey", "shiftKey", "metaKey"] as const;
    const onKey = (e: KeyboardEvent) => {
      const matchesHotkey = hotkey.every((k) =>
        k.endsWith("Key") && (MODIFIERS as readonly string[]).includes(k)
          ? e[k as "altKey"]
          : e.code === k,
      );
      const noExtraModifiers = MODIFIERS.every(
        (m) => hotkey.includes(m) === e[m],
      );
      if (!matchesHotkey || !noExtraModifiers) return;
      e.preventDefault();
      surface.current?.querySelector("button")?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey]);

  /** Only string title/description can be announced through text. */
  const announce =
    current && current.status !== "error"
      ? [current.title, current.description]
          .filter((v): v is string => typeof v === "string")
          .join(". ")
      : "";
  const announceError =
    current && current.status === "error"
      ? [current.title, current.description]
          .filter((v): v is string => typeof v === "string")
          .join(". ")
      : "";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-100"
      style={{ paddingTop: offset }}
    >
      {/* Mounted empty and permanently, with notifications written into it.
          A live region that mounts together with its content is not
          announced at all. Two regions, not one with a swapped role:
          changing role/aria-live on a live element is unreliable across
          screen readers. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announce}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
        {announceError}
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            key="notch"
            initial={false}
            // Gates AnimatePresence's unmount to the full retract, not to
            // when the content reads as gone. Content opacity already hits
            // 0 well before the notch is tucked away; this keeps the surface
            // on screen for the rest of the withdrawal.
            exit={reduced ? undefined : { opacity: 0 }}
            transition={reduced ? undefined : SPRING_RETRACT}
          >
            {!reduced && (
              <NotchSurface y={y} width={width} height={height} radius={RADIUS} flare={flare} />
            )}

            {/* Sibling of the surface, never a child - the surface is an svg
                sized to its own geometry, and the content has to be free to
                size itself. */}
            <motion.div
              ref={surface}
              // \`relative\` is load-bearing, not cosmetic. The surface beside
              // this one is absolutely positioned, so an untransformed
              // static sibling paints under it. That only bites at rest,
              // because motion drops \`transform\` to \`none\` once y settles on
              // 0 - so the notch would lose its text the instant it stopped
              // moving. Positioning this layer keeps it above the blobs at
              // every y, transform or not.
              className="relative flex justify-center"
              style={reduced ? undefined : { y, opacity: contentOpacity }}
              initial={reduced ? { opacity: 0, y: -2 } : false}
              animate={reduced ? { opacity: 1, y: 0 } : undefined}
              exit={reduced ? { opacity: 0, y: -2 } : undefined}
              transition={reduced ? { duration: 0.15, ease: EASE_OUT } : undefined}
            >
              <motion.div
                ref={content}
                layout
                transition={SPRING_LAYOUT}
                onPointerEnter={() => {
                  pauseTimers("hover");
                  if (expand) setOpen(true);
                }}
                onPointerLeave={() => {
                  // Only releases "hover" - if the window is also blurred,
                  // that reason is untouched and timers stay paused.
                  resumeTimers("hover");
                  if (expand) setOpen(false);
                }}
                style={{ minWidth: MIN_W, minHeight: MIN_H, borderRadius: RADIUS }}
                className={cn(
                  "pointer-events-auto flex items-center gap-3 px-4 py-3",
                  // Transparent background on purpose: the goo layer paints
                  // the surface. Giving this one a background would draw a
                  // hard-edged pill on top of the liquid one.
                  reduced && "border border-border bg-background shadow-subtle",
                  className,
                )}
              >
                <div className="flex w-full flex-col">
                  <div className="flex items-center gap-3">
                    <NotchBody
                      record={current}
                      count={notches.length}
                      reduced={reduced}
                      open={open}
                      onToggle={() => setOpen((v) => !v)}
                    />
                  </div>

                  <AnimatePresence initial={false}>
                    {open && notches.length > 1 && (
                      <motion.ul
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={SPRING_LAYOUT}
                        className="mt-2 flex flex-col gap-1 border-t border-border pt-2"
                      >
                        {notches.slice(1).map((n) => (
                          <li key={n.id} className="truncate text-[13px] text-text-secondary">
                            {n.title as React.ReactNode}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Colour and glyph per status. \`default\` carries no icon at all, a plain
 *  message with a decorative dot in front of it says less than one without. */
const STATUS: Record<NotchStatus, { icon: React.ReactNode | null; tone: string }> = {
  default: { icon: null, tone: "text-foreground" },
  success: { icon: <IconCheck />, tone: "text-success" },
  error: { icon: <IconClose />, tone: "text-destructive" },
  warning: { icon: <IconAlertTriangle />, tone: "text-warning" },
  loading: { icon: <IconSpinner className="animate-spin" />, tone: "text-text-secondary" },
};

function NotchBody({
  record,
  count,
  reduced,
  open,
  onToggle,
}: {
  record: NotchRecord;
  count: number;
  reduced: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  // The escape hatch is terminal: nothing structured, not even the expand
  // trigger, renders alongside it.
  if (record.content !== undefined) {
    return (
      <div className="flex min-w-0 flex-1 items-center">
        {record.content as React.ReactNode}
      </div>
    );
  }

  const { icon, tone } = STATUS[record.status];
  const glyph = (record.icon as React.ReactNode) ?? icon;

  return (
    <>
      {/* The trigger wraps only non-interactive content, the glyph and the
          text block. The action and cancel buttons below are its siblings,
          never its children: a <button> cannot contain a <button>. */}
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        {glyph && (
          <span className="relative grid size-5 shrink-0 place-items-center [&_svg]:size-5">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={record.status}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.55 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.55 }}
                transition={reduced ? { duration: 0.12, ease: EASE_OUT } : SPRING_SWAP}
                className={cn("grid place-items-center", tone)}
              >
                {glyph}
              </motion.span>
            </AnimatePresence>
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-medium text-foreground">
            {record.title as React.ReactNode}
          </span>
          {record.description !== undefined && (
            <span className="truncate text-[13px] text-text-secondary">
              {record.description as React.ReactNode}
            </span>
          )}
        </div>
      </button>

      {record.cancel && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={SPRING_PRESS}
          onClick={() => {
            record.cancel?.onClick?.();
            toast.dismiss(record.id);
          }}
          className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium text-text-secondary outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          {record.cancel.label}
        </motion.button>
      )}

      {record.action && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          transition={SPRING_PRESS}
          onClick={() => {
            record.action?.onClick();
            toast.dismiss(record.id);
          }}
          className="shrink-0 rounded-full bg-foreground px-3 py-1.5 text-[13px] font-medium text-background outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          {record.action.label}
        </motion.button>
      )}

      {count > 1 && (
        <span className="shrink-0 text-[13px] tabular-nums text-text-muted">
          +{count - 1}
        </span>
      )}
    </>
  );
}
`,
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
  if (code.includes('from "@devigner-ui/icons"')) deps.push("@devigner-ui/icons");
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
