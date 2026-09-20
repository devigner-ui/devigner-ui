"use client";

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
import {
  EASE_OUT,
  SPRING_GOO,
  SPRING_LAYOUT,
  SPRING_PRESS,
  SPRING_RETRACT,
  SPRING_SWAP,
} from "../lib/easing";
import { useNotches, pauseTimers, resumeTimers, toast } from "../lib/notch-store";
import type { NotchRecord, NotchStatus } from "../lib/notch-queue";
import { IconCheck, IconAlertTriangle, IconClose, IconSpinner } from "@devigner-ui/icons";

/** The anchor is a lozenge parked above the viewport edge, wide and short. It
 *  is never itself visible - only its contribution to the bridge is. Without a
 *  second shape there is nothing to fuse with and the droplet just fades in. */
const ANCHOR_W = 120;
const ANCHOR_H = 40;
const ANCHOR_TOP = -24;

/** Travel. Deliberately short: the bridge carries the effect, and extra
 *  distance buys nothing but latency. At Y_FROM the droplet is still fully
 *  merged with the anchor, which is why nothing is legible until it moves. */
const Y_FROM = -8;
const Y_TO = 16;

/** Blur radius from the 0-10 viscosity prop. Higher sigma means the halos
 *  overlap for longer, so the neck stretches further before it snaps - which
 *  is what reads as a thicker liquid. Below about 4 the bridge never forms at
 *  all; above about 14 it never lets go within the travel distance. */
export const sigmaFor = (viscosity: number) =>
  4 + (Math.min(10, Math.max(0, viscosity)) / 10) * 10;

/** The filtered layer. Solid shapes only - the filter blurs and then
 *  alpha-crushes every descendant, so text put in here comes out as fringed
 *  mush. That constraint is the entire reason the notch is two layers.
 *
 *  Two blobs, not one: a border-coloured blob sits a pixel proud of a
 *  background-coloured one, so the outline is gooed too and stretches with the
 *  neck. A CSS border would simply be blurred into the fill and vanish. */
function NotchGoo({
  y,
  width,
  height,
  radius,
  filterId,
}: {
  y: MotionValue<number>;
  width: number;
  height: number;
  radius: number;
  filterId: string;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
      style={{ filter: `url(#${filterId})` }}
    >
      {/* Parked above the edge. Nothing about it is meant to be seen. */}
      <div
        className="absolute rounded-full bg-border"
        style={{
          width: ANCHOR_W,
          height: ANCHOR_H,
          top: ANCHOR_TOP,
        }}
      />
      <motion.div className="absolute" style={{ y }}>
        {/* Border blob first, so the fill paints over its middle and leaves
            exactly the 1px proud edge showing. */}
        <div
          className="absolute bg-border"
          style={{
            width: width + 2,
            height: height + 2,
            left: -(width + 2) / 2,
            // Explicit, not left to resolve from static position - an
            // ancestor or sibling change could otherwise shift this and
            // silently break the 1px proud edge the outline depends on.
            top: 0,
            borderRadius: radius + 1,
          }}
        />
        <div
          className="absolute bg-background"
          style={{
            width,
            height,
            left: -width / 2,
            top: 1,
            borderRadius: radius,
          }}
        />
      </motion.div>
    </div>
  );
}

/** The filter itself. Two nodes, and three things that are easy to get wrong:
 *
 *  1. The region must be declared. A <filter> defaults to -10%/+10% of the
 *     bounding box, and a stretched neck exceeds that and is clipped clean
 *     through. This is the single most common reason a goo demo looks broken.
 *  2. No feBlend. Published versions end with feBlend against SourceGraphic to
 *     keep inner content crisp; here there is no inner content, so that node
 *     only re-composites the sharp un-gooed silhouette on top of the liquid
 *     one and cancels the effect outright.
 *  3. The alpha row is the whole trick: newAlpha = 18*A - 7 puts a hard cutoff
 *     at A of about 0.39, so two blurred halos read as one solid shape while
 *     they overlap above it and as two the instant they do not. The neck
 *     stretching, thinning and snapping is emergent. Do not animate it. */
function GooFilter({ id, sigma }: { id: string; sigma: number }) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute size-0"
      focusable="false"
    >
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={sigma}
            result="blur"
          />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
          />
        </filter>
      </defs>
    </svg>
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

/** Measures the content so the blob underneath can match it.
 *
 *  The blob has no content of its own, so nothing sizes it, yet it has to
 *  track a pill sized by its own text through an entrance, a status morph and
 *  an expand. A ResizeObserver is the honest answer: the alternative, a hidden
 *  twin of the children rendered under [&_*]:invisible, sizes with zero lag
 *  but runs the children's effects twice and collides their refs, which breaks
 *  the moment anyone uses the `content` escape hatch.
 *
 *  The one-frame measurement lag it costs is invisible because both layers
 *  spring toward the same target rather than snapping to raw numbers. */
function useContentSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = React.useState({ width: MIN_W, height: MIN_H });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      setSize({
        width: Math.max(MIN_W, Math.round(box.width)),
        height: Math.max(MIN_H, Math.round(box.height)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export interface ToasterProps {
  /** 0-10. Higher is a longer, lazier neck before the bridge snaps. */
  viscosity?: number;
  /** Default auto-dismiss in ms. Per-notch `duration` overrides it. */
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
  viscosity = 5,
  expand = false,
  offset = 0,
  hotkey = ["altKey", "KeyT"],
  className,
}: ToasterProps) {
  const reduced = useReducedMotion() ?? false;
  const list = useNotches();
  const current = list[0];
  const content = React.useRef<HTMLDivElement>(null);
  const surface = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContentSize(content);

  /* One motion value, two consumers. The blob and the content both read this,
     so they physically cannot drift apart - there is only one number. Two
     independent animations with identical configs still desync, because they
     start on different frames. */
  const raw = useMotionValue(Y_FROM);
  const y = useSpring(raw, current?.status ? SPRING_GOO : SPRING_RETRACT);

  React.useEffect(() => {
    raw.set(current ? Y_TO : Y_FROM);
  }, [current, raw]);

  /* Content opacity as a pure function of the same shared value, not a second
     animation: 0 below y=8 (still merged with the anchor, nothing legible
     yet), 1 at y=16 (settled). Reusing it on the way out is what makes the
     exit sequence itself - descending back through y=8 already reads as
     invisible well before the droplet finishes re-merging with the anchor,
     with no separate delay or timer needed. */
  const contentOpacity = useTransform(y, [Y_FROM, 8, Y_TO], [0, 0, 1]);

  /* Reduced motion drops the filter entirely rather than tuning it down. A
     full-width SVG filter re-rasterizing every frame is precisely the class of
     thing that setting exists to prevent, and a slower goo is still goo. */
  const filterId = React.useId();
  const sigma = sigmaFor(viscosity);

  const [open, setOpen] = React.useState(false);

  /* Collapse whenever the rendered notch changes. An expanded panel that
     silently swaps its contents for a different notification is the kind of
     thing that gets the wrong button pressed. */
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

  /* Without this a notification expires while the user is in another tab and
     is never seen. Hover pausing alone does not cover it, the pointer is not
     on the page at all. */
  React.useEffect(() => {
    window.addEventListener("blur", pauseTimers);
    window.addEventListener("focus", resumeTimers);
    return () => {
      window.removeEventListener("blur", pauseTimers);
      window.removeEventListener("focus", resumeTimers);
    };
  }, []);

  /* A toast must never take focus by itself, it would yank the caret out of
     whatever is being typed. The hotkey is how a keyboard user reaches it
     deliberately, which is the pattern Sonner established. */
  React.useEffect(() => {
    // Modifier flags the hotkey does not name must be absent, not just the
    // ones it does name present. Checking only "every listed modifier is
    // held" also matches Ctrl+Alt+T or Alt+Shift+T against the default
    // ["altKey", "KeyT"], silently swallowing preventDefault() on
    // combinations the user may need for something else.
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

  /** Only string title/description can be announced through text. An element
   *  title reads through the visible layer instead, joining unknown children
   *  into a string is not a safe operation. */
  const announce =
    current && (current.status !== "error")
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
      {/* Mounted empty and permanently, with notifications written into it. A
          live region that mounts together with its content is not announced
          at all, screen readers only report changes to regions they were
          already watching. This is the single most common toast
          accessibility bug.

          Two regions, not one with a swapped role: changing role/aria-live on
          a live element is unreliable across screen readers, so each severity
          gets its own permanent region and only the matching one is ever
          written to. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announce}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
        {announceError}
      </div>

      {!reduced && <GooFilter id={filterId} sigma={sigma} />}

      <AnimatePresence>
        {current && (
          <motion.div
            key="notch"
            initial={false}
            // Gates AnimatePresence's unmount to the full retract, not to
            // when the content reads as gone. Content opacity already hits 0
            // at y=8 via the transform above; this keeps the blob itself
            // on screen for the rest of its rise back into the anchor. Only
            // needed on the animated path - reduced mode never renders the
            // blob, so there is nothing here for it to hold open.
            exit={reduced ? undefined : { opacity: 0 }}
            transition={reduced ? undefined : SPRING_RETRACT}
          >
            {!reduced && (
              <NotchGoo
                y={y}
                width={width}
                height={height}
                radius={RADIUS}
                filterId={filterId}
              />
            )}

            {/* Sibling of the goo layer, never a child. `filter` creates a
                containing block, so anything positioned inside the filtered
                element resolves against it rather than the viewport. */}
            <motion.div
              ref={surface}
              className="flex justify-center"
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
                  pauseTimers();
                  if (expand) setOpen(true);
                }}
                onPointerLeave={() => {
                  resumeTimers();
                  if (expand) setOpen(false);
                }}
                style={{
                  minWidth: MIN_W,
                  minHeight: MIN_H,
                  borderRadius: RADIUS,
                }}
                className={cn(
                  "pointer-events-auto flex items-center gap-3 px-4 py-3",
                  // Transparent background on purpose: the goo layer paints
                  // the surface. Giving this one a background would draw a
                  // hard-edged pill on top of the liquid one and flatten it.
                  reduced && "border border-border bg-background shadow-subtle",
                  className,
                )}
              >
                <div className="flex w-full flex-col">
                  {/* Row is a plain, non-interactive flex container. The
                      trigger button and the action/cancel buttons are its
                      siblings, never nested, since a <button> cannot contain
                      a <button> (see NotchBody). */}
                  <div className="flex items-center gap-3">
                    <NotchBody
                      record={current}
                      count={list.length}
                      reduced={reduced}
                      open={open}
                      onToggle={() => setOpen((v) => !v)}
                    />
                  </div>

                  <AnimatePresence initial={false}>
                    {open && list.length > 1 && (
                      <motion.ul
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={SPRING_LAYOUT}
                        className="mt-2 flex flex-col gap-1 border-t border-border pt-2"
                      >
                        {list.slice(1).map((n) => (
                          <li
                            key={n.id}
                            className="truncate text-[13px] text-text-secondary"
                          >
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

/** Colour and glyph per status. `default` carries no icon at all, a plain
 *  message with a decorative dot in front of it says less than one without. */
const STATUS: Record<
  NotchStatus,
  { icon: React.ReactNode | null; tone: string }
> = {
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
  /** Whether the pending-list panel below this row is open. Only the
   *  trigger button (never the row, never the action/cancel buttons) reports
   *  this via `aria-expanded`. */
  open: boolean;
  onToggle: () => void;
}) {
  // The escape hatch is terminal: nothing structured, not even the expand
  // trigger, renders alongside it. It gets its own non-button container
  // rather than being wrapped in the trigger button, since arbitrary
  // consumer content may itself contain interactive elements that a
  // surrounding <button> would collide with the same way the action/cancel
  // buttons did.
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
          never its children: a <button> cannot contain a <button>, the
          parser closes the outer one at the first nested one, so the DOM
          stops matching the JSX and the inner button's click target,
          keyboard reachability and screen-reader role all go wrong. Grows to
          fill the row so the whole text area stays clickable. */}
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        {glyph && (
          /* popLayout takes the outgoing glyph out of flow so the incoming one
             lands exactly where it sat, the same way MenuDock's Glyph does it.
             Keyed by status, so loading to success is a swap rather than a
             reconciliation that would leave the spinner class on the check. */
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
