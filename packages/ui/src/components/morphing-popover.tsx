"use client";

import * as React from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
  type Transition,
} from "motion/react";
import { cn } from "cn";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";
import { useControllableState } from "../lib/hooks/use-controllable-state";
import { EASE_OUT, SPRING_SWAP, TWEEN_GLASS_SOFT } from "../lib/easing";
import {
  GLOW,
  GlassSurface,
  H,
  PANEL_CURVE,
  PILL_CSS,
  PILL_CURVE,
  R,
  ShaderSurface,
  type GlassBackdrop,
  useJelly,
  useRectShape,
  zoomIn,
} from "../lib/glass";

/** The panel's corner radius, and its padding around what it holds. */
const PANEL_R = 32;
const INSET = 16;
/** Room around the trigger's icon and label, px. */
const PILL_PAD = 44;

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** React's drag and animation handlers collide with Motion's own. */
type DivProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  | "children"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

export interface MorphingPopoverClassNames {
  /** The label and icon on the closed pill. */
  trigger?: string;
  /** The box around the panel's content. */
  panel?: string;
}

export interface MorphingPopoverProps extends DivProps {
  /** Text on the closed pill, and the panel's accessible name. */
  label: string;
  /** Shown before the label on the pill. */
  icon?: React.ReactNode;
  /** What the panel holds. A function receives `close`, for a Cancel or
   *  Save button inside. */
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 0 is ultra clear glass, 1 fully tinted. */
  transparency?: number;
  /** Draws the glass with the WebGL shader, bending this image, instead of
   *  the lens that bends the page. */
  backdrop?: GlassBackdrop;
  /** How far the shader glass blurs the backdrop, in px. */
  blur?: number;
  disabled?: boolean;
  classNames?: MorphingPopoverClassNames;
}

/** A Liquid Glass pill that swells into a panel holding anything: a form, a
 *  picker, a note. The label zooms out of the way and the content zooms in
 *  behind it. */
export const MorphingPopover = React.forwardRef<
  HTMLDivElement,
  MorphingPopoverProps
>(function MorphingPopover(
  {
    label,
    icon,
    children,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    transparency = 0.05,
    backdrop,
    blur = 4,
    disabled = false,
    classNames,
    className,
    style,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const [openState, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onValueChange: onOpenChange,
  });
  const open = openState && !disabled;
  const reduced = useReducedMotionPreference();
  const panelId = React.useId();
  const root = React.useRef<HTMLDivElement | null>(null);
  const jelly = useJelly(disabled || reduced);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const face = React.useRef<HTMLSpanElement>(null);
  const panel = React.useRef<HTMLDivElement>(null);
  /** Where focus goes once the next open or close has rendered. */
  const focusNext = React.useRef<"panel" | "trigger" | null>(null);
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  // A guess until the first measurement. The server can't measure, so the
  // glass stays hidden until then instead of drawing the guess.
  const [size, setSize] = React.useState({
    pill: 132,
    w: 280,
    h: 180,
    measured: false,
  });

  // The pill fits its label and the panel fits its content, re-measured
  // when fonts land or the content changes.
  React.useLayoutEffect(() => {
    const f = face.current;
    const p = panel.current;
    if (!f || !p) return;
    const measure = () => {
      const pill = Math.max(H, Math.ceil(f.offsetWidth) + PILL_PAD);
      setSize({
        pill,
        w: Math.max(pill, Math.ceil(p.offsetWidth)),
        h: Math.max(H, Math.ceil(p.offsetHeight)),
        measured: true,
      });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(f);
    ro.observe(p);
    return () => ro.disconnect();
  }, []);

  const w = useMotionValue(open ? size.w : size.pill);
  const h = useMotionValue(open ? size.h : H);
  const r = useMotionValue(open ? PANEL_R : R);
  // The panel swells out from the pill's center, as far each way, so the
  // label and the content stay put while the glass grows around them.
  const left = useTransform(w, (v) => (size.pill - v) / 2);
  const top = useTransform(h, (v) => (H - v) / 2);
  const panelLeft = useTransform(w, (v) => (v - size.w) / 2);
  const panelTop = useTransform(h, (v) => (v - size.h) / 2);
  const curve = useTransform(r, [R, PANEL_R], [PILL_CURVE, PANEL_CURVE]);
  const shape = useRectShape(w, h, r, curve);
  const clip = useTransform(shape.d, (v) => `path("${v}")`);

  // Only opening and closing spring. A new measurement snaps into place
  // before the frame is painted, so the pill never visibly corrects the
  // size guessed before measuring.
  const wasOpen = React.useRef(open);
  React.useLayoutEffect(() => {
    const toggled = wasOpen.current !== open;
    wasOpen.current = open;
    const go = (mv: MotionValue<number>, target: number, t: Transition) => {
      if (reduced || !toggled) mv.jump(target);
      else animate(mv, target, t);
    };
    if (open) {
      if (toggled) jelly.kick();
      go(w, size.w, TWEEN_GLASS_SOFT);
      go(h, size.h, { ...TWEEN_GLASS_SOFT, delay: 0.03 });
      go(r, PANEL_R, TWEEN_GLASS_SOFT);
    } else {
      go(h, H, TWEEN_GLASS_SOFT);
      go(w, size.pill, { ...TWEEN_GLASS_SOFT, delay: 0.04 });
      go(r, R, TWEEN_GLASS_SOFT);
    }
  }, [open, size, reduced, w, h, r, jelly]);

  // Otherwise re-enabling reopens a panel the user never asked for.
  React.useEffect(() => {
    if (disabled && openState) setOpen(false);
  }, [disabled]);

  React.useEffect(() => {
    const next = focusNext.current;
    focusNext.current = null;
    if (next === "panel" && open) {
      const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel.current)?.focus({ preventScroll: true });
    }
    if (next === "trigger" && !open)
      trigger.current?.focus({ preventScroll: true });
    setHovered(false);
  }, [open]);

  // A press anywhere outside closes the panel, like any popover.
  React.useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const close = React.useCallback(() => {
    focusNext.current = "trigger";
    setOpen(false);
  }, [setOpen]);

  // Pressed, the glass lights up from inside. White is light, not a theme
  // color.
  const glow = (
    <motion.div
      className="absolute inset-0"
      style={{ background: GLOW }}
      initial={false}
      animate={{
        opacity: !hovered || open || disabled ? 0 : pressed ? 1 : 0.35,
      }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
    />
  );

  return (
    <motion.div
      {...rest}
      ref={(el) => {
        root.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      onPointerDown={(e) => {
        rest.onPointerDown?.(e);
        if (disabled || open) return;
        setPressed(true);
        jelly.press();
      }}
      onPointerUp={(e) => {
        rest.onPointerUp?.(e);
        setPressed(false);
        jelly.release();
      }}
      onPointerCancel={(e) => {
        rest.onPointerCancel?.(e);
        setPressed(false);
        jelly.release();
      }}
      onPointerLeave={(e) => {
        rest.onPointerLeave?.(e);
        setPressed(false);
        jelly.release();
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (open && e.key === "Escape") {
          e.stopPropagation();
          close();
        }
      }}
      // Tabbing out of the panel closes it; focus has already moved on.
      onBlur={(e) => {
        rest.onBlur?.(e);
        if (
          open &&
          !root.current?.contains(e.relatedTarget as Node | null) &&
          e.relatedTarget
        )
          setOpen(false);
      }}
      className={cn(
        "relative z-10 inline-block h-12 shrink-0 align-middle text-[15px] whitespace-nowrap select-none",
        className,
      )}
      style={{ ...style, width: size.pill, scale: jelly.scale }}
    >
      <motion.div
        className="absolute"
        style={{ left, top, width: w, height: h }}
      >
        {backdrop ? (
          <ShaderSurface
            backdrop={backdrop}
            transparency={transparency}
            blur={blur}
            radius={r}
            clip={clip}
            hidden={!size.measured}
          >
            {glow}
          </ShaderSurface>
        ) : (
          <GlassSurface
            shape={shape}
            transparency={transparency}
            hidden={!size.measured}
          >
            {glow}
          </GlassSurface>
        )}

        {/* The content, clipped to the glass so it surfaces inside it as
              it grows. */}
        <motion.div
          className="absolute inset-0"
          style={{ clipPath: clip, WebkitClipPath: clip }}
        >
          <motion.div
            ref={panel}
            id={panelId}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            inert={!open}
            className={cn(
              "absolute w-max text-left whitespace-normal text-foreground outline-none select-text",
              classNames?.panel,
            )}
            style={{
              left: panelLeft,
              top: panelTop,
              minWidth: size.pill,
              padding: INSET,
            }}
            initial={false}
            animate={zoomIn(open, reduced)}
            transition={{ ...SPRING_SWAP, delay: open ? 0.06 : 0 }}
          >
            {typeof children === "function" ? children(close) : children}
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.span
        ref={face}
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-1/2 flex -translate-1/2 items-center gap-2 font-semibold text-foreground [&_svg]:size-4.5",
          disabled && "opacity-50",
          classNames?.trigger,
        )}
        initial={false}
        animate={zoomIn(!open, reduced)}
        transition={{ ...SPRING_SWAP, delay: open ? 0 : 0.08 }}
      >
        {icon}
        {label}
      </motion.span>

      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={label}
        tabIndex={open ? -1 : undefined}
        disabled={disabled}
        onClick={() => {
          focusNext.current = "panel";
          setOpen(true);
        }}
        onPointerEnter={() => !disabled && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        className={cn(
          "absolute inset-0 cursor-pointer rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed",
          PILL_CSS,
          open && "pointer-events-none",
        )}
      />
    </motion.div>
  );
});

MorphingPopover.displayName = "MorphingPopover";
