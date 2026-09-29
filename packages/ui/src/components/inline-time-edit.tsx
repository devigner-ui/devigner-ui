"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";
import { cn } from "cn";
import { IconCheck, IconPen } from "@devigner-ui/icons";
import {
  EASE_OUT,
  SPRING_PRESS,
  SPRING_LAYOUT,
  SPRING_SWAP,
} from "../lib/easing";
import { useControllableState } from "../lib/hooks/use-controllable-state";

const RADIUS = 10;
const SHADOW = "smooth-shadow-ring-sm";
/** Written out in full so Tailwind can see them. */
const RING_VISIBLE =
  "has-[button:focus-visible]:outline-2 has-[button:focus-visible]:outline-offset-2 has-[button:focus-visible]:outline-ring";
const RING_FOCUS =
  "has-[button:focus]:outline-2 has-[button:focus]:outline-offset-2 has-[button:focus]:outline-ring";

/** Corner radii per tile. Closed, the three tiles butt together into one pill,
 *  so only the outer corners round; open, each tile is its own pill. */
function corners(open: boolean, edge: "start" | "middle" | "end") {
  const start = open || edge === "start" ? RADIUS : 0;
  const end = open || edge === "end" ? RADIUS : 0;
  return {
    borderTopLeftRadius: start,
    borderBottomLeftRadius: start,
    borderTopRightRadius: end,
    borderBottomRightRadius: end,
  };
}

const digits = (raw: string) => raw.replace(/\D/g, "").slice(0, 2);

export interface InlineTimeEditClassNames {
  root?: string;
  tile?: string;
  input?: string;
  unit?: string;
  button?: string;
}

/** React's drag and animation handlers collide with Motion's own. */
type DivProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  | "defaultValue"
  | "onChange"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

export interface InlineTimeEditProps extends DivProps {
  /** Controlled duration, in minutes. */
  value?: number;
  /** Initial duration in minutes when uncontrolled. */
  defaultValue?: number;
  /** Fires with the new total in minutes when a changed edit is saved. */
  onValueChange?: (minutes: number) => void;
  /** Controlled edit state. */
  open?: boolean;
  /** Initial edit state when uncontrolled. */
  defaultOpen?: boolean;
  /** Fires when the edit opens, saves or is discarded. */
  onOpenChange?: (open: boolean) => void;
  /** Largest hour value accepted. */
  maxHours?: number;
  /** Closed, show the time as a clock (2:30) instead of with its units
   *  (2 Hr. 30 Min.). Editing always shows the units. */
  shortTime?: boolean;
  hourUnit?: string;
  minuteUnit?: string;
  /** Accessible names. */
  hoursLabel?: string;
  minutesLabel?: string;
  editLabel?: string;
  saveLabel?: string;
  disabled?: boolean;
  classNames?: InlineTimeEditClassNames;
}

export function InlineTimeEdit({
  value,
  defaultValue = 150,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  maxHours = 99,
  shortTime = true,
  hourUnit = "Hr.",
  minuteUnit = "Min.",
  hoursLabel = "Hours",
  minutesLabel = "Minutes",
  editLabel = "Edit time",
  saveLabel = "Save time",
  disabled = false,
  classNames,
  className,
  style,
  ...rest
}: InlineTimeEditProps) {
  const [total, setTotal] = useControllableState({
    value,
    defaultValue,
    onValueChange,
  });
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onValueChange: onOpenChange,
  });
  const reduced = useReducedMotionPreference();
  // Only what the user has typed. Untouched fields read from the value, so a
  // controlled value that changes mid-edit shows through.
  const [draft, setDraft] = React.useState<{ h?: string; m?: string }>({});
  // Whether the control is being driven from the keyboard. :focus-visible
  // alone can't say: a button focused quietly after a click stays "not
  // visible" through later key presses, so a keyboard user would lose the
  // ring after a mouse save.
  const [keyboard, setKeyboard] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  const hoursRef = React.useRef<HTMLInputElement>(null);
  const minutesRef = React.useRef<HTMLInputElement>(null);
  const button = React.useRef<HTMLButtonElement>(null);

  const h = (open ? draft.h : undefined) ?? String(Math.floor(total / 60));
  const m = (open ? draft.m : undefined) ?? String(total % 60);
  // Closed, the time reads as a clock (2:05); open, the fields take bare
  // numbers with their units.
  const clock = shortTime && !open;
  const shownM = clock ? m.padStart(2, "0") : m;

  const start = (focus: HTMLElement | null) => {
    if (disabled) return;
    setDraft({});
    setOpen(true);
    focus?.focus();
  };

  /** `refocus` returns focus to the button; "quiet" does it without a focus
   *  ring, for a close that came from a pointer. */
  const close = (refocus: boolean | "quiet") => {
    setDraft({});
    setOpen(false);
    // focusVisible is newer than TypeScript's DOM lib.
    if (refocus)
      button.current?.focus({
        focusVisible: refocus !== "quiet",
      } as FocusOptions);
  };

  // Saving the same total never fires onValueChange: the controllable state
  // drops a value equal to the current one.
  const save = (refocus: true | "quiet" = true) => {
    const hours = Math.min(Number(h) || 0, maxHours);
    const minutes = Math.min(Number(m) || 0, 59);
    setTotal(hours * 60 + minutes);
    close(refocus);
  };

  // A new value from outside replaces the edit in progress.
  // Returns the same object when nothing is typed, so the mount run (and a
  // value change with no edit open) doesn't cost a render.
  React.useEffect(
    () => setDraft((d) => ((d.h ?? d.m) === undefined ? d : {})),
    [total],
  );

  // Otherwise re-enabling the control reopens an edit the user never raised.
  React.useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  // Every layout node also takes layoutDependency={open}: Motion otherwise
  // re-measures all of them on every render (each keystroke, each parent
  // update), and only opening and closing ever needs animating.
  const layout = !reduced;
  const focusRing = keyboard ? RING_FOCUS : RING_VISIBLE;
  const fade = { duration: reduced ? 0 : 0.2, ease: EASE_OUT };
  const tile = cn(
    "relative flex h-10 shrink-0 items-center bg-muted text-sm",
    classNames?.tile,
  );
  // Each tile carries its own shadow, shown only while the tiles stand apart.
  // Closed, butted shadows would draw seams through the pill, so the root
  // draws one shadow for the whole pill instead and the two crossfade.
  const tileShadow = (
    <motion.span
      aria-hidden
      initial={false}
      animate={{ opacity: open ? 1 : 0 }}
      transition={fade}
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        SHADOW,
      )}
    />
  );

  const field = (
    edge: "start" | "middle",
    ref: React.RefObject<HTMLInputElement | null>,
    text: string,
    key: "h" | "m",
    label: string,
    unit: string,
  ) => {
    const max = key === "h" ? maxHours : 59;
    const now = Math.min(Number(text) || 0, max);
    return (
      <motion.div
        layout={layout}
        layoutDependency={open}
        transition={SPRING_LAYOUT}
        style={corners(open, edge)}
        onPointerDown={(e) => {
          // A press anywhere on a tile lands in its field, opening the edit
          // first when it is closed.
          if (e.target === ref.current && open) return;
          e.preventDefault();
          if (open) ref.current?.focus();
          else start(ref.current);
        }}
        className={cn(
          tile,
          open
            ? "w-19 cursor-text justify-between px-3 has-[input:focus]:ring-1 has-[input:focus]:ring-ring/40"
            : cn(
                // Overlap a pixel: butted tiles at fractional widths leave a
                // hairline seam between their fills.
                "-mr-px cursor-pointer",
                clock
                  ? edge === "start"
                    ? "pr-0 pl-3"
                    : "px-0"
                  : edge === "start"
                    ? "pr-1 pl-3"
                    : "pr-0 pl-1",
              ),
        )}
      >
        {tileShadow}
        <motion.input
          ref={ref}
          layout={layout ? "position" : false}
          layoutDependency={open}
          transition={SPRING_LAYOUT}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label={label}
          readOnly={!open}
          tabIndex={open ? 0 : -1}
          value={text}
          onChange={(e) => {
            const next = digits(e.target.value);
            setDraft((d) => ({ ...d, [key]: next }));
          }}
          role="spinbutton"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={now}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              // Steps by 1, by 10 with Shift, clamped to the field's range.
              e.preventDefault();
              const step =
                (e.shiftKey ? 10 : 1) * (e.key === "ArrowUp" ? 1 : -1);
              const next = Math.min(Math.max(now + step, 0), max);
              setDraft((d) => ({ ...d, [key]: String(next) }));
              return;
            }
            if (e.key !== "Enter") return;
            // Save moves focus to the button; without this the same Enter
            // lands on it as a click and reopens the edit.
            e.preventDefault();
            save();
          }}
          // Sized to the digits: closed, the unit has to sit right against the
          // value, and a fixed-width input leaves a hole.
          // Outline inline: an app's unlayered :focus-visible rule outranks any
          // utility, and the tile draws the focus ring instead.
          style={{ width: `${Math.max(text.length, 1)}ch`, outline: "none" }}
          className={cn(
            "relative min-w-0 bg-transparent font-semibold text-foreground tabular-nums caret-foreground",
            !open && "pointer-events-none",
            classNames?.input,
          )}
        />
        <AnimatePresence initial={false} mode="popLayout">
          {!clock ? (
            <motion.span
              key="unit"
              layout={layout ? "position" : false}
              layoutDependency={open}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ layout: SPRING_LAYOUT, opacity: fade }}
              aria-hidden
              className={cn(
                "relative ml-1 font-medium whitespace-nowrap text-muted-foreground select-none",
                classNames?.unit,
              )}
            >
              {unit}
            </motion.span>
          ) : (
            edge === "start" && (
              <motion.span
                key="colon"
                layout={layout ? "position" : false}
                layoutDependency={open}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ layout: SPRING_LAYOUT, opacity: fade }}
                aria-hidden
                className="relative mr-0.75 ml-0.5 font-semibold text-foreground select-none"
              >
                :
              </motion.span>
            )
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const hidden = reduced
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.5, filter: "blur(4px)" };

  return (
    <motion.div
      ref={root}
      layout={layout}
      layoutDependency={open}
      transition={SPRING_LAYOUT}
      role="group"
      style={{ borderRadius: RADIUS, ...style }}
      className={cn(
        "relative inline-flex w-fit items-center",
        // Closed, the whole pill is the focus target; open, only the button.
        open ? "gap-1.5" : cn("gap-0", focusRing),
        disabled && "pointer-events-none opacity-60",
        className,
        classNames?.root,
      )}
      {...rest}
      onPointerDown={(e) => {
        rest.onPointerDown?.(e);
        setKeyboard(false);
        // The gaps between open tiles belong to the control; pressing one
        // must not blur the field and discard the edit.
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onBlur={(e) => {
        rest.onBlur?.(e);
        // Focus leaving the control (a click elsewhere, Tab past the button)
        // discards the edit, the same as Escape.
        if (open && !root.current?.contains(e.relatedTarget as Node | null)) {
          close(false);
        }
      }}
      onFocus={(e) => {
        rest.onFocus?.(e);
        // Tabbing in: the key press happened outside, before focus arrived.
        const target = e.target as Element;
        if (target === button.current && target.matches(":focus-visible")) {
          setKeyboard(true);
        }
      }}
      onKeyDown={(e) => {
        rest.onKeyDown?.(e);
        setKeyboard(true);
        if (e.key !== "Escape" || !open) return;
        e.stopPropagation();
        close(true);
      }}
    >
      <motion.span
        aria-hidden
        layout={layout}
        layoutDependency={open}
        transition={{ layout: SPRING_LAYOUT, opacity: fade }}
        initial={false}
        animate={{ opacity: open ? 0 : 1 }}
        style={{ borderRadius: RADIUS }}
        className={cn("pointer-events-none absolute inset-0", SHADOW)}
      />
      {field("start", hoursRef, h, "h", hoursLabel, hourUnit)}
      {field("middle", minutesRef, shownM, "m", minutesLabel, minuteUnit)}
      <motion.div
        layout={layout}
        layoutDependency={open}
        transition={SPRING_LAYOUT}
        style={corners(open, "end")}
        // Closed, the tile hugs the icon on the text side and keeps the pill's
        // outer padding on the other.
        className={cn(tile, open ? "w-10" : "w-9", open && focusRing)}
      >
        {tileShadow}
        <motion.button
          ref={button}
          type="button"
          disabled={disabled}
          aria-label={open ? saveLabel : editLabel}
          // Keeps focus in the field while the button is pressed: browsers
          // that never focus a clicked button would otherwise blur the
          // control and discard the edit before the save lands.
          onPointerDown={(e) => e.preventDefault()}
          // detail is 0 for a keyboard press. From the keyboard, focus stays
          // on the button with its ring; from a pointer, opening lands in the
          // hours field and saving returns focus without a ring.
          onClick={(e) => {
            const keyboard = e.detail === 0;
            if (open) save(keyboard ? true : "quiet");
            else start(keyboard ? button.current : hoursRef.current);
          }}
          whileTap={{ scale: 0.9, transition: SPRING_PRESS }}
          style={{ outline: "none" }}
          className={cn(
            "relative grid size-full cursor-pointer place-items-center rounded-[inherit]",
            // !open && "pr-1.5",
            classNames?.button,
          )}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={open ? "save" : "edit"}
              initial={hidden}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={hidden}
              transition={SPRING_SWAP}
              className="col-start-1 row-start-1 grid place-items-center"
            >
              {open ? (
                <IconCheck
                  aria-hidden
                  className="size-4.5 text-foreground"
                  strokeWidth={2.5}
                />
              ) : (
                <IconPen
                  aria-hidden
                  variant="Bold"
                  className="size-3.5 text-muted-foreground"
                />
              )}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
