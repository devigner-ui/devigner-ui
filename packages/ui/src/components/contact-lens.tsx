"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "cn";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";
import { useControllableState } from "../lib/hooks/use-controllable-state";
import { SPRING_PRESS, SPRING_SWAP } from "../lib/easing";

const BLUR = "blur(4px)";

export interface ContactLensItem {
  /** Pill text shown while the part is lit, e.g. "Email". */
  label: string;
  icon: React.ReactNode;
  /** What `active` is matched against. Falls back to `label`. */
  id?: string;
  /** The part of `value` this item lights. Defaults to the whole value. */
  text?: string;
  /** What a click copies. Defaults to `text`. */
  copy?: string;
  /** Turns the icon into a link (mailto:, a URL) instead of a copy button. */
  href?: string;
  /** Where the pill sits. Defaults to below for the whole line, above for a part. */
  pill?: "above" | "below";
}

export interface ContactLensClassNames {
  /** Every piece of the line. */
  text?: string;
  /** Added to the pieces while they are lit. */
  lit?: string;
  pill?: string;
  icon?: string;
}

export interface ContactLensProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect" | "onCopy" | "onError"
> {
  /** The full line, e.g. "hello@devigner.cc". */
  value: string;
  items: ContactLensItem[];
  /** Controlled id (or label) of the lit item. null lights nothing. */
  active?: string | null;
  defaultActive?: string | null;
  /** Fires as hover and focus light or clear an item. */
  onActiveChange?: (active: string | null) => void;
  /** Fires on every click, link or copy. */
  onSelect?: (item: ContactLensItem) => void;
  /** Fires after a copy lands on the clipboard. */
  onCopy?: (text: string, item: ContactLensItem) => void;
  onError?: (error: unknown) => void;
  /** Pill text after a click copies. */
  copiedLabel?: string;
  /** ms the copied pill holds. */
  resetAfter?: number;
  classNames?: ContactLensClassNames;
}

type Range = { start: number; end: number; below: boolean };

const keyOf = (item: ContactLensItem) => item.id ?? item.label;

function rangeOf(value: string, item: ContactLensItem): Range {
  const text = item.text ?? value;
  const start = Math.max(0, value.indexOf(text));
  const end = start + text.length;
  const whole = start === 0 && end === value.length;
  return {
    start,
    end,
    below: (item.pill ?? (whole ? "below" : "above")) === "below",
  };
}

export const ContactLens = React.forwardRef<HTMLDivElement, ContactLensProps>(
  function ContactLens(
    {
      value,
      items,
      active: activeProp,
      defaultActive = null,
      onActiveChange,
      onSelect,
      onCopy,
      onError,
      copiedLabel = "Copied",
      resetAfter = 1200,
      className,
      classNames,
      ...rest
    },
    ref,
  ) {
    const reduced = useReducedMotionPreference();
    const [activeKey, setActiveKey] = useControllableState<string | null>({
      value: activeProp,
      defaultValue: defaultActive,
      onValueChange: onActiveChange,
    });
    const [copied, setCopied] = React.useState<number | null>(null);
    const found = items.findIndex((item) => keyOf(item) === activeKey);
    const active = found < 0 ? null : found;
    const ranges = items.map((item) => rangeOf(value, item));
    const range = active === null ? null : ranges[active];

    React.useEffect(() => {
      if (copied === null) return;
      const id = setTimeout(() => setCopied(null), resetAfter);
      return () => clearTimeout(id);
    }, [copied, resetAfter]);

    // Cut the line at every item's edges, so each piece lights as one unit.
    const cuts = [
      ...new Set([0, value.length, ...ranges.flatMap((r) => [r.start, r.end])]),
    ].sort((a, b) => a - b);
    const pieces = cuts.slice(0, -1).map((start, i) => ({
      start,
      text: value.slice(start, cuts[i + 1]),
    }));

    // The pill centres on the lit part, measured from the pieces it spans.
    const pieceRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
    const [pill, setPill] = React.useState({ x: 0, width: 0 });
    // Bumped when the line resizes (a late web font, a responsive text size),
    // so the pill re-measures instead of keeping stale offsets.
    const lineRef = React.useRef<HTMLDivElement>(null);
    const [resized, setResized] = React.useState(0);
    React.useEffect(() => {
      const el = lineRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() => setResized((n) => n + 1));
      ro.observe(el);
      return () => ro.disconnect();
    }, []);
    React.useLayoutEffect(() => {
      if (!range) return;
      const lit = pieces
        .map((p, i) => (p.start >= range.start && p.start < range.end ? i : -1))
        .filter((i) => i >= 0)
        .map((i) => pieceRefs.current[i])
        .filter((el): el is HTMLSpanElement => !!el);
      if (!lit.length) return;
      const left = lit[0].offsetLeft;
      const last = lit[lit.length - 1];
      setPill({ x: left, width: last.offsetLeft + last.offsetWidth - left });
    }, [active, value, resized]);

    const select = async (index: number) => {
      const item = items[index];
      onSelect?.(item);
      if (item.href) return;
      const text = item.copy ?? item.text ?? value;
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        onError?.(error);
        return;
      }
      setCopied(index);
      onCopy?.(text, item);
    };

    // A part rises clear of the line; the whole line rises less, toward its
    // pill below.
    const lift = (lit: boolean, below: boolean) =>
      reduced || !lit ? 0 : below ? "-0.3em" : "-0.45em";

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex flex-col items-center gap-[1.2em] text-4xl",
          className,
        )}
        {...rest}
      >
        <div ref={lineRef} className="relative whitespace-pre">
          {pieces.map((piece, i) => {
            const lit =
              !!range && piece.start >= range.start && piece.start < range.end;
            return (
              <motion.span
                key={piece.start}
                ref={(el) => {
                  pieceRefs.current[i] = el;
                }}
                className={cn(
                  "inline-block text-foreground",
                  classNames?.text,
                  lit && classNames?.lit,
                )}
                initial={false}
                animate={{
                  opacity: lit ? 1 : 0.35,
                  y: lift(lit, range?.below ?? false),
                }}
                transition={SPRING_SWAP}
              >
                {piece.text}
              </motion.span>
            );
          })}
          <AnimatePresence>
            {active !== null && range && (
              <motion.span
                key={active}
                aria-hidden
                className={cn(
                  "pointer-events-none absolute flex justify-center",
                  range.below
                    ? "top-full mt-[-0.1em]"
                    : "bottom-full mb-[0.35em]",
                )}
                style={{ left: pill.x, width: pill.width }}
                initial={
                  reduced
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.7, filter: BLUR }
                }
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.7, filter: BLUR }
                }
                transition={SPRING_SWAP}
              >
                <span
                  className={cn(
                    "rounded-full bg-foreground px-[0.6em] py-[0.2em] text-[0.36em] leading-none font-medium text-background",
                    classNames?.pill,
                  )}
                >
                  {copied === active ? copiedLabel : items[active].label}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div
          className="flex items-center gap-[0.55em]"
          onPointerLeave={() => setActiveKey(null)}
        >
          {items.map((item, i) => {
            const Tag = item.href ? motion.a : motion.button;
            const shown = item.copy ?? item.text ?? value;
            return (
              <Tag
                key={keyOf(item)}
                {...(item.href
                  ? { href: item.href, "aria-label": `${item.label}: ${shown}` }
                  : {
                      type: "button" as const,
                      "aria-label": `Copy ${item.label.toLowerCase()}: ${shown}`,
                    })}
                className={cn(
                  "grid size-[0.75em] cursor-pointer place-items-center rounded-full text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-[0.55em]",
                  classNames?.icon,
                )}
                initial={false}
                animate={{
                  opacity: active === i ? 1 : 0.35,
                  y: reduced || active !== i ? 0 : "-0.08em",
                }}
                whileTap={
                  reduced ? undefined : { scale: 0.9, transition: SPRING_PRESS }
                }
                transition={SPRING_SWAP}
                onPointerEnter={() => setActiveKey(keyOf(item))}
                onFocus={(e: React.FocusEvent<HTMLElement>) => {
                  if (e.currentTarget.matches(":focus-visible"))
                    setActiveKey(keyOf(item));
                }}
                onBlur={() => setActiveKey(null)}
                onClick={() => void select(i)}
              >
                {item.icon}
              </Tag>
            );
          })}
        </div>
        <span aria-live="polite" className="sr-only">
          {copied === null
            ? ""
            : `${items[copied].label} ${copiedLabel.toLowerCase()}`}
        </span>
      </div>
    );
  },
);
ContactLens.displayName = "ContactLens";
