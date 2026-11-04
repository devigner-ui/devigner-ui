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
import { EASE_OUT, SPRING_SWAP, TWEEN_GLASS } from "../lib/easing";
import {
  GLOW,
  GlassSurface,
  H,
  ShaderSurface,
  type GlassBackdrop,
  PANEL_CURVE,
  PILL_CSS,
  PILL_CURVE,
  R,
  useJelly,
  useRectShape,
  zoomIn,
} from "../lib/glass";

export type { GlassBackdrop } from "../lib/glass";

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

/** Height of one menu row, the panel's inset around the rows, and the
 *  corner radius the pill opens up to. */
const ROW = 44;
const INSET = 8;
const PANEL_R = 40;

export interface GlassMenuItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface GlassMenuProps extends Omit<DivProps, "onSelect"> {
  items: GlassMenuItem[];
  /** Fires with the picked item's id, then the panel melts back. */
  onSelect?: (id: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Text on the closed pill, and the menu's accessible name. */
  label?: string;
  /** 0 is ultra clear glass, 1 fully tinted, like the iOS 27 setting. */
  transparency?: number;
  /** Draws the glass with the WebGL shader, bending this image, instead of
   *  the lens that bends the page. */
  backdrop?: GlassBackdrop;
  /** How far the shader glass blurs the backdrop, in px. */
  blur?: number;
  disabled?: boolean;
}

/** A Liquid Glass pill that swells into a squircle panel of menu rows. The
 *  pill's text zooms out of the way and the rows zoom in behind it. */
export function GlassMenu({
  items,
  onSelect,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label = "Menu",
  transparency = 0.05,
  backdrop,
  blur = 4,
  disabled = false,
  className,
  style,
  onKeyDown,
  ...rest
}: GlassMenuProps) {
  const [openState, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onValueChange: onOpenChange,
  });
  const open = openState && !disabled;
  const reduced = useReducedMotionPreference();
  const menuId = React.useId();
  const root = React.useRef<HTMLDivElement>(null);
  const jelly = useJelly(disabled || reduced);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const text = React.useRef<HTMLSpanElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const rows = React.useRef<(HTMLButtonElement | null)[]>([]);
  /** Where focus goes once the next open or close has rendered. */
  const focusNext = React.useRef<"first" | "trigger" | null>(null);
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  // A guess until the first measurement. The server can't measure, so the
  // glass stays hidden until then instead of drawing the guess.
  const [size, setSize] = React.useState({
    pill: 112,
    w: 180,
    h: 200,
    measured: false,
  });

  // The pill fits its text and the panel fits its rows, re-measured when
  // fonts land or the content changes.
  React.useLayoutEffect(() => {
    const t = text.current;
    const l = list.current;
    if (!t || !l) return;
    const measure = () => {
      const pill = Math.max(H, Math.ceil(t.offsetWidth) + 56);
      setSize({
        pill,
        w: Math.max(pill, Math.ceil(l.offsetWidth)),
        h: Math.max(H, Math.ceil(l.offsetHeight)),
        measured: true,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(t);
    ro.observe(l);
    return () => ro.disconnect();
  }, []);

  const w = useMotionValue(open ? size.w : size.pill);
  const h = useMotionValue(open ? size.h : H);
  const r = useMotionValue(open ? PANEL_R : R);
  // The panel swells out from the pill's center, as far each way, so the
  // pill's text and the rows stay put while the glass grows around them.
  const left = useTransform(w, (v) => (size.pill - v) / 2);
  const top = useTransform(h, (v) => (H - v) / 2);
  const rowsLeft = useTransform(w, (v) => (v - size.w) / 2);
  const rowsTop = useTransform(h, (v) => (v - size.h) / 2);
  // The corners firm up from pill to squircle as the radius opens.
  const curve = useTransform(r, [R, PANEL_R], [PILL_CURVE, PANEL_CURVE]);
  const shape = useRectShape(w, h, r, curve);
  const clip = useTransform(shape.d, (v) => `path("${v}")`);

  // Only opening and closing spring. A new measurement (the first one on
  // mount, fonts landing, a new label) snaps into place before the frame is
  // painted; springing it, the pill would visibly shrink from the size
  // guessed before measuring.
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
      go(w, size.w, TWEEN_GLASS);
      go(h, size.h, { ...TWEEN_GLASS, delay: 0.03 });
      go(r, PANEL_R, TWEEN_GLASS);
    } else {
      go(h, H, TWEEN_GLASS);
      go(w, size.pill, { ...TWEEN_GLASS, delay: 0.04 });
      go(r, R, TWEEN_GLASS);
    }
  }, [open, size, reduced, w, h, r, jelly]);

  // Otherwise re-enabling reopens a panel the user never asked for.
  React.useEffect(() => {
    if (disabled && openState) setOpen(false);
  }, [disabled]);

  React.useEffect(() => {
    const next = focusNext.current;
    focusNext.current = null;
    if (next === "first" && open)
      rows.current.find((el) => el && !el.disabled)?.focus();
    if (next === "trigger" && !open) trigger.current?.focus();
    setHovered(false);
  }, [open]);

  // A press anywhere outside closes the panel, like any menu.
  React.useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const close = () => {
    focusNext.current = "trigger";
    setOpen(false);
  };

  // Arrow keys walk the rows, wrapping at the ends; Escape and Tab close.
  const onMenuKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
      return;
    }
    const live = rows.current.filter(
      (el): el is HTMLButtonElement => !!el && !el.disabled,
    );
    const at = live.indexOf(document.activeElement as HTMLButtonElement);
    const move: Record<string, number> = {
      ArrowDown: at + 1,
      ArrowUp: at - 1,
      Home: 0,
      End: live.length - 1,
    };
    if (!(e.key in move) || !live.length) return;
    e.preventDefault();
    live[(move[e.key] + live.length) % live.length]?.focus();
  };

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
      ref={root}
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
        onMenuKey(e);
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

        {/* The rows, clipped to the glass so they surface inside it as it
            grows. */}
        <motion.div
          className="absolute inset-0"
          style={{ clipPath: clip, WebkitClipPath: clip }}
        >
          <motion.div
            ref={list}
            id={menuId}
            role="menu"
            aria-label={label}
            inert={!open}
            className="absolute flex w-max flex-col"
            style={{
              left: rowsLeft,
              top: rowsTop,
              minWidth: size.pill,
              padding: INSET,
            }}
          >
            {items.map((item, i) => (
              <motion.button
                key={item.id}
                ref={(el) => {
                  rows.current[i] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={item.disabled}
                onClick={() => {
                  onSelect?.(item.id);
                  close();
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-3.5 rounded-[22px] pr-6 pl-4 font-medium text-foreground outline-none transition-[background-color] duration-1000 ease-out hover:bg-foreground/15 focus-visible:bg-foreground/18 disabled:cursor-not-allowed disabled:opacity-50",
                  PILL_CSS,
                )}
                style={{ height: ROW }}
                initial={false}
                animate={zoomIn(open, reduced)}
                transition={{
                  ...SPRING_SWAP,
                  delay: open ? 0.06 + i * 0.035 : 0,
                }}
              >
                {item.icon && (
                  <span aria-hidden className="grid size-6 place-items-center">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.span
        ref={text}
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 font-semibold text-foreground",
          disabled && "opacity-50",
        )}
        initial={false}
        animate={zoomIn(!open, reduced)}
        transition={{ ...SPRING_SWAP, delay: open ? 0 : 0.08 }}
      >
        {label}
      </motion.span>

      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        tabIndex={open ? -1 : undefined}
        disabled={disabled}
        onClick={() => {
          focusNext.current = "first";
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
}
