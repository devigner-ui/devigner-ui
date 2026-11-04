"use client";

import * as React from "react";
import { animate, motion, useMotionTemplate, useMotionValue } from "motion/react";
import { cn } from "cn";
import { TWEEN_FLICK, TWEEN_FLICK_FADE, TWEEN_FLICK_REVEAL } from "../lib/easing";
import { useControllableState } from "../lib/hooks/use-controllable-state";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";

export interface FlickCardsSliderAction {
  label: React.ReactNode;
  /** Renders a link; without it the action is a button. */
  href?: string;
  onClick?: () => void;
}

export interface FlickCardsSliderItem {
  /** Photo URL, cropped to fill the 2:3 card. */
  image: string;
  /** Describes the photo. Leave empty when the title says it all. */
  alt?: string;
  /** Large label centered on the card. */
  title?: React.ReactNode;
  /** Button along the bottom, shown on the front card only. */
  action?: FlickCardsSliderAction;
}

export interface FlickCardsSliderClassNames {
  /** Every card: the photo frame. */
  card?: string;
  /** The centered title. */
  title?: string;
  /** The action button. */
  action?: string;
}

export interface FlickCardsSliderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  items: FlickCardsSliderItem[];
  /** Controlled front card. Pass with onIndexChange. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  classNames?: FlickCardsSliderClassNames;
  /** Sizes the deck: its width is the front card's, w-72 by default. */
  className?: string;
}

/** A card's place by its distance from the front: x and y in percent of its
 *  own size, rotation in degrees, scale, opacity, and how far the dim layer
 *  darkens it. Read off the Osmo original frame by frame. Further than two
 *  away a card tucks out of sight behind the fan. */
const PLACES = [
  { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, dim: 0 },
  { x: 25, y: 1, rotate: 10, scale: 0.9, opacity: 1, dim: 0.275 },
  { x: 45, y: 5, rotate: 15, scale: 0.8, opacity: 1, dim: 0.525 },
  { x: 55, y: 5, rotate: 20, scale: 0.6, opacity: 0, dim: 0.525 },
];
const KEYS = ["x", "y", "rotate", "scale", "opacity"] as const;
type Pose = Record<(typeof KEYS)[number], number>;

/** A full flick is this many card widths of drag (about 800px on the
 *  original's 412px card). Let go past a tenth of it and the deck turns. */
const SPAN = 2;
const THRESHOLD = 0.1;
/** Past half a span the drag only gains a fifth of the pointer's travel. */
const RESISTANCE = 0.2;
/** Movement before a press counts as a drag rather than a click, px. */
const SLOP = 4;

const wrap = (i: number, n: number) => ((i % n) + n) % n;

/** Signed distance from the front card, wrapped so the deck loops. */
function offsetOf(i: number, front: number, n: number) {
  const d = i - front;
  return d > n / 2 ? d - n : d < -n / 2 ? d + n : d;
}

function poseAt(offset: number): Pose {
  const place = PLACES[Math.min(Math.abs(offset), 3)]!;
  const side = offset < 0 ? -1 : 1;
  return { ...place, x: place.x * side, rotate: place.rotate * side };
}

interface CardHandle {
  /** Jumps to a pose, stopping any tween: the drag follows the pointer. */
  set: (pose: Pose) => void;
  /** Deals the card to a pose with the flick's overshoot, or jumps there. */
  settle: (pose: Pose, instant: boolean) => void;
}

interface CardProps {
  item: FlickCardsSliderItem;
  offset: number;
  position: string;
  reduced: boolean;
  classNames?: FlickCardsSliderClassNames;
}

const Card = React.forwardRef<CardHandle, CardProps>(function Card(
  { item, offset, position, reduced, classNames },
  ref,
) {
  const start = poseAt(offset);
  const values = {
    x: useMotionValue(start.x),
    y: useMotionValue(start.y),
    rotate: useMotionValue(start.rotate),
    scale: useMotionValue(start.scale),
    opacity: useMotionValue(start.opacity),
  };
  // translate before rotate and scale, in percent of the card: GSAP's order.
  const transform = useMotionTemplate`translate(${values.x}%, ${values.y}%) rotate(${values.rotate}deg) scale(${values.scale})`;

  React.useImperativeHandle(ref, () => ({
    set: (pose) => KEYS.forEach((k) => values[k].jump(pose[k])),
    settle: (pose, instant) =>
      KEYS.forEach((k) =>
        instant ? values[k].jump(pose[k]) : animate(values[k], pose[k], TWEEN_FLICK),
      ),
  }));

  const depth = Math.min(Math.abs(offset), 3);
  const front = depth === 0;
  const fade = reduced ? { duration: 0 } : front ? TWEEN_FLICK_REVEAL : TWEEN_FLICK_FADE;
  const action = item.action;
  const actionProps = {
    initial: false,
    animate: { opacity: front ? 1 : 0 },
    transition: fade,
    tabIndex: front ? undefined : -1,
    onClick: action?.onClick,
    className: cn(
      "absolute inset-x-[8.5cqw] bottom-[8.5cqw] grid h-[13.6cqw] cursor-pointer place-items-center rounded-[1.2cqw] pt-[0.7cqw] bg-background text-[4.1cqw] font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
      !front && "pointer-events-none",
      classNames?.action,
    ),
  } as const;

  return (
    <motion.div
      role="group"
      aria-roledescription="slide"
      aria-label={position}
      aria-hidden={!front || undefined}
      data-front={front || undefined}
      className={cn(
        "absolute inset-0 overflow-hidden rounded-[3.9cqw] bg-muted",
        classNames?.card,
      )}
      style={{ transform, opacity: values.opacity, zIndex: 5 - depth }}
    >
      <img
        src={item.image}
        alt={item.alt ?? ""}
        draggable={false}
        decoding="async"
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />
      {item.title != null && (
        <p
          className={cn(
            // Caps sit a little below the middle, as on the original.
            "absolute inset-0 grid place-items-center pt-[3.7cqw] text-center text-[16.6cqw] leading-none font-normal tracking-[-0.035em] text-white",
            classNames?.title,
          )}
        >
          {item.title}
        </p>
      )}
      {action &&
        (action.href ? (
          <motion.a href={action.href} {...actionProps}>
            {action.label}
          </motion.a>
        ) : (
          <motion.button type="button" {...actionProps}>
            {action.label}
          </motion.button>
        ))}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-background"
        initial={false}
        animate={{ opacity: PLACES[depth]!.dim }}
        transition={reduced ? { duration: 0 } : TWEEN_FLICK_FADE}
      />
    </motion.div>
  );
});

export const FlickCardsSlider = React.forwardRef<HTMLDivElement, FlickCardsSliderProps>(
  function FlickCardsSlider(
    {
      items,
      index: indexProp,
      defaultIndex = 0,
      onIndexChange,
      classNames,
      className,
      onKeyDown,
      ...rest
    },
    ref,
  ) {
    const n = items.length;
    const [index, setIndex] = useControllableState({
      value: indexProp,
      defaultValue: defaultIndex,
      onValueChange: onIndexChange,
    });
    const front = n ? wrap(index, n) : 0;
    const reduced = useReducedMotionPreference();
    const cards = React.useRef<(CardHandle | null)[]>([]);
    const drag = React.useRef<{ id: number; x: number; moved: boolean; shift: number } | null>(
      null,
    );
    const swallowClick = React.useRef(false);
    const [dragging, setDragging] = React.useState(false);

    const settle = (to: number) =>
      cards.current.forEach((c, i) => c?.settle(poseAt(offsetOf(i, to, n)), reduced));

    // Deal the cards whenever the front changes: by flick, key or prop.
    const dealt = React.useRef(`${front}/${n}`);
    React.useEffect(() => {
      if (dealt.current === `${front}/${n}`) return;
      dealt.current = `${front}/${n}`;
      settle(front);
    }, [front, n]);

    const turn = (step: number) => setIndex(wrap(front + step, n));

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      swallowClick.current = false;
      if (e.button !== 0 || n < 2) return;
      drag.current = { id: e.pointerId, x: e.clientX, moved: false, shift: 0 };
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x;
      if (!d.moved) {
        if (Math.abs(dx) < SLOP) return;
        d.moved = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }
      const span = e.currentTarget.offsetWidth * SPAN;
      const half = span / 2;
      const x =
        Math.abs(dx) <= half ? dx : Math.sign(dx) * (half + (Math.abs(dx) - half) * RESISTANCE);
      const p = Math.min(1, Math.abs(x) / span);
      // Dragging right brings the card on the left to the front.
      const next = wrap(front + (x > 0 ? -1 : 1), n);
      d.shift = x / span > THRESHOLD ? -1 : x / span < -THRESHOLD ? 1 : 0;
      cards.current.forEach((c, i) => {
        const a = poseAt(offsetOf(i, front, n));
        const b = poseAt(offsetOf(i, next, n));
        c?.set({
          x: a.x + (b.x - a.x) * p,
          y: a.y + (b.y - a.y) * p,
          rotate: a.rotate + (b.rotate - a.rotate) * p,
          scale: a.scale + (b.scale - a.scale) * p,
          opacity: a.opacity + (b.opacity - a.opacity) * p,
        });
      });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      drag.current = null;
      if (!d.moved) return;
      setDragging(false);
      swallowClick.current = true;
      const shift = e.type === "pointercancel" ? 0 : d.shift;
      if (shift) turn(shift);
      else settle(front);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented || e.target !== e.currentTarget || n < 2) return;
      const step = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
      if (!step) return;
      e.preventDefault();
      turn(step);
    };

    const title = items[front]?.title;

    return (
      <div
        ref={ref}
        role="region"
        aria-roledescription="carousel"
        aria-label="Cards"
        tabIndex={0}
        {...rest}
        onKeyDown={handleKeyDown}
        data-dragging={dragging || undefined}
        className={cn(
          // The radius is the card's: 3.9% of the width, as a share of each
          // side. The focus outline is drawn on a layer above the cards, which
          // would cover the deck's own.
          "relative isolate aspect-2/3 w-72 cursor-grab touch-pan-y rounded-[3.9%/2.6%] outline-none select-none @container after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring data-dragging:cursor-grabbing",
          className,
        )}
      >
        <div
          className="absolute inset-0"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClickCapture={(e) => {
            if (!swallowClick.current) return;
            swallowClick.current = false;
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {items.map((item, i) => (
            <Card
              key={i}
              ref={(c) => {
                cards.current[i] = c;
              }}
              item={item}
              offset={offsetOf(i, front, n)}
              position={`${i + 1} of ${n}`}
              reduced={reduced}
              classNames={classNames}
            />
          ))}
        </div>
        <span aria-live="polite" className="sr-only">
          {n ? `${typeof title === "string" ? `${title}, ` : ""}${front + 1} of ${n}` : ""}
        </span>
      </div>
    );
  },
);

FlickCardsSlider.displayName = "FlickCardsSlider";
