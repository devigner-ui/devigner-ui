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
import {
  useNotches,
  pauseTimers,
  resumeTimers,
  setDefaultDuration,
  toast,
} from "../lib/notch-store";
import type { NotchRecord, NotchStatus } from "../lib/notch-queue";
import {
  notchOuterWidth,
  notchOutline,
  notchPath,
} from "../lib/notch-path";
import { IconCheck, IconAlertTriangle, IconClose, IconSpinner } from "@devigner-ui/icons";

/** Resting position: the notch's top edge flush with the viewport's, so its
 *  inverted top corners meet the edge exactly. The notch is welded to that
 *  edge rather than floating below it - it grows down out of the edge and
 *  withdraws back behind it, and never exists as a detached shape. */
const Y_TO = 0;

/** Clearance above the notch's own height when hidden, so nothing peeks. */
const HIDE_GAP = 8;

/** The last stretch of emergence, over which the content fades in. Held off
 *  the start so text is never legible while the notch is still mostly behind
 *  the edge. Fixed rather than derived from the height: the fade should feel
 *  the same on a one-line notch and an expanded one. */
const REVEAL = 24;

/** The surface: one path, filled and stroked.
 *
 *  Replaces an SVG metaball filter that produced the flare as a blur artifact.
 *  The path gives the concave radius as a number anyone can set, a real 1px
 *  stroke for the border instead of a second shape peeking out from behind the
 *  first, no per-frame re-rasterize, and no constraint that the fill be
 *  opaque. The geometry itself lives in ../lib/notch-path so it can be checked
 *  without a browser.
 *
 *  `overflow-visible` matters: the stroke straddles the path, so half of it
 *  falls outside the viewBox and an svg clipping to its own bounds would shave
 *  the outline down to nothing along the sides. */
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
      viewBox={`0 0 ${outer} ${height}`}
      /* x centres the surface on the notch at whatever width the content
         measured; doing it here rather than with a flex parent keeps the
         transform on one element, so it composites with y instead of
         fighting it. */
      style={{ y, x: -outer / 2 }}
    >
      <path d={notchPath(spec)} fill="var(--background)" />
      {/* Stroked separately, and deliberately from the OPEN outline: the
          closed path includes the viewport edge, and stroking that lays a
          hairline straight across the top of the notch. */}
      <path
        d={notchOutline(spec)}
        fill="none"
        stroke="var(--border)"
        strokeWidth={1}
      />
    </motion.svg>
  );
}

/** The two bottom corners.
 *
 *  Sized against the notch's height on purpose, not set to half of it. Half
 *  makes a stadium, and a stadium has no corners left for the inverted ones at
 *  the top to read against - the shape stops being a notch and becomes a pill
 *  with dents. Roughly a fifth of the height keeps the silhouette squarely
 *  rectangular, which is what makes the top corners legible as inversions. */
const RADIUS = 11;
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
      // Border box, not entry.contentRect: the measured element carries
      // px-4 py-3 with box-sizing: border-box (Tailwind preflight), so the
      // content box is 32px narrower and 24px shorter than the pill the
      // user actually sees, and the blob underneath would be under-sized by
      // exactly that much. borderBoxSize is missing in older Safari, hence
      // the offsetWidth/offsetHeight fallback.
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
  /** Radius of the two inverted top corners, in px, which is also how far the
   *  surface overhangs the content on each side. An exact radius, not a tuning
   *  hint: 0 gives square corners welded flat to the edge.
   *
   *  Small by default, and that is the point. The arc is subtractive - it eats
   *  into the notch's height - so a value that looks modest as a number takes
   *  a third of a one-line notch and turns the top corners into ears. Keep it
   *  well under a quarter of the height. Clamped against that height anyway,
   *  so an over-large value comes back smaller than asked. */
  flare?: number;
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
  flare = 8,
  duration,
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
  /* Where the notch sits when hidden: its whole measured height above the
     edge, plus clearance. Derived rather than constant because an expanded
     notch is taller than a one-line one, and a fixed offset that tucks the
     small one away leaves the tall one's bottom rows on screen. */
  const hiddenY = -(height + HIDE_GAP);

  const raw = useMotionValue(hiddenY);
  const y = useSpring(raw, current?.status ? SPRING_GOO : SPRING_RETRACT);

  React.useEffect(() => {
    raw.set(current ? Y_TO : hiddenY);
  }, [current, hiddenY, raw]);

  /* Content opacity as a pure function of the same shared value, not a second
     animation: 0 while the notch is still more than REVEAL behind the edge,
     reaching 1 exactly as it settles. Reusing it on the way out is what makes
     the exit sequence itself - withdrawing back past -REVEAL already reads as
     invisible well before the notch is fully tucked away, with no separate
     delay or timer needed. Clamped, so a spring overshoot past Y_TO cannot
     drive opacity above 1. */
  const contentOpacity = useTransform(y, [Y_TO - REVEAL, Y_TO], [0, 1], {
    clamp: true,
  });

  /* Reduced motion renders the surface as a plain bordered box rather than
     the flared path: the flare exists to sell the notch emerging from the
     edge, and with the motion gone there is nothing for it to sell. */

  /* Applies the prop default to the store. A per-notch `duration` passed to
     toast() still wins, since create()/settle() only fall back to this when
     the caller did not supply one. Skipped entirely when the prop is
     omitted, leaving the store's own built-in default in place. */
  React.useEffect(() => {
    if (duration !== undefined) setDefaultDuration(duration);
  }, [duration]);

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
     on the page at all.

     "blur" and "hover" are separate, named pause reasons (see notch-store),
     so a pointer leaving while the window is still blurred cannot cancel the
     blur pause out from under it.

     Cleanup releases both reasons unconditionally on unmount, not just the
     listeners. A Toaster that unmounts (route change) while the window is
     blurred, or while hovered so onPointerLeave never fires, would otherwise
     leave that reason held in module scope for the rest of the session, and
     no future toast would ever auto-dismiss. Releasing a reason this
     instance never held is a harmless no-op. */
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

      <AnimatePresence>
        {current && (
          <motion.div
            key="notch"
            initial={false}
            // Gates AnimatePresence's unmount to the full retract, not to
            // when the content reads as gone. Content opacity already hits 0
            // partway through via the transform above; this keeps the surface
            // itself on screen for the rest of its withdrawal behind the edge.
            // Only needed on the animated path - reduced mode renders no
            // separate surface, so there is nothing here for it to hold open.
            exit={reduced ? undefined : { opacity: 0 }}
            transition={reduced ? undefined : SPRING_RETRACT}
          >
            {!reduced && (
              <NotchSurface
                y={y}
                width={width}
                height={height}
                radius={RADIUS}
                flare={flare}
              />
            )}

            {/* Sibling of the surface, never a child: the surface is an svg
                sized to its own geometry, and the content has to be free to
                size itself. */}
            <motion.div
              ref={surface}
              /* `relative` is load-bearing, not cosmetic. The surface beside
                 this one is absolutely positioned, so it paints in the
                 positioned phase; an untransformed static sibling paints in
                 the earlier in-flow phase and ends up UNDER it. That only
                 bites at rest, because motion drops `transform` to `none` once
                 y settles on 0 - so the notch would lose its text the instant
                 it stopped moving, while the status glyph survived on its own
                 `relative` wrapper. Positioning this layer keeps it above the
                 blobs at every y, transform or not. */
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
                  // Only releases the "hover" reason. If the window is also
                  // blurred, that reason is untouched and timers stay
                  // paused, which is what stops a hover-then-leave from
                  // silently cancelling the blur pause.
                  resumeTimers("hover");
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
