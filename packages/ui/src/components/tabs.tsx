"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "cn";
import { SPRING_LAYOUT } from "../lib/easing";
import { useControllableState } from "../lib/hooks/use-controllable-state";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";

export interface TabsOption<T extends string = string> {
  value: T;
  /** Shown text. Defaults to value; null leaves the icon alone and makes
   *  value the accessible name. */
  label?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsClassNames {
  option?: string;
  /** The sliding pill behind the selected option. */
  indicator?: string;
}

export type TabsSize = "sm" | "md" | "lg";

type TabsOptions = readonly (string | TabsOption)[];

/** The value type of an options list: each string, and each object's value. */
export type TabsValue<O extends TabsOptions> =
  O[number] extends infer E
    ? E extends string
      ? E
      : E extends { value: infer V extends string }
        ? V
        : never
    : never;

// Generic over the whole options list rather than a value type, so a mix of
// strings and objects keeps every value, and value / defaultValue are checked
// against them without narrowing the list.
export interface TabsProps<O extends TabsOptions = TabsOptions> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  /** The choices: plain strings, or objects with a label, icon or disabled. */
  options: O;
  /** Controlled value. */
  value?: TabsValue<O>;
  /** Selected on first render when uncontrolled. Defaults to the first
   *  enabled option. */
  defaultValue?: TabsValue<O>;
  onValueChange?: (value: TabsValue<O>) => void;
  /** Accessible name of the group. */
  label?: string;
  size?: TabsSize;
  /** Spans the container and splits it evenly. */
  fill?: boolean;
  /** Form field name; the selected value submits with the form. */
  name?: string;
  disabled?: boolean;
  classNames?: TabsClassNames;
}

const SIZES = {
  sm: "h-6 gap-1 px-2.5 text-[11px] [&_svg]:size-3.5",
  md: "h-7 gap-1.5 px-3 text-[12px] [&_svg]:size-4",
  lg: "h-8 gap-2 px-4 text-[13px] [&_svg]:size-4",
} as const;

const toOption = (o: string | TabsOption): TabsOption =>
  typeof o === "string" ? { value: o } : o;

/** One choice from a few, shown as pills with one sliding behind the pick.
 *  Built on native radios, so arrow keys and forms work as they do anywhere. */
function TabsInner(
  {
    options,
    value: valueProp,
    defaultValue,
    onValueChange,
    label,
    size = "md",
    fill = false,
    name,
    disabled = false,
    classNames,
    className,
    ...props
  }: TabsProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const items = options.map(toOption);
  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue: defaultValue ?? items.find((o) => !o.disabled)?.value,
    onValueChange: onValueChange as (v: string | undefined) => void,
  });
  const reduced = useReducedMotionPreference();
  const autoName = React.useId();
  const list = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => list.current!);

  // The pill is placed from the selected option's offset inside the group,
  // never measured against the page, so a scrolling or animating ancestor
  // (a panel resizing, a sheet sliding in) can't send it gliding. It glides
  // on a new value and jumps on a resize.
  const [pill, setPill] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    glide: boolean;
  } | null>(null);
  const placed = React.useRef(false);
  React.useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const place = (glide: boolean) => {
      const on = el.querySelector<HTMLElement>("[data-checked]");
      setPill(
        on
          ? {
              x: on.offsetLeft,
              y: on.offsetTop,
              width: on.offsetWidth,
              height: on.offsetHeight,
              glide,
            }
          : null,
      );
    };
    place(placed.current);
    placed.current = true;
    const ro = new ResizeObserver(() => place(false));
    ro.observe(el);
    return () => ro.disconnect();
  }, [value]);

  return (
    <div
      ref={list}
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={cn(
        "relative rounded-full border border-border p-1",
        fill ? "flex w-full" : "inline-flex",
        className,
      )}
      {...props}
    >
      {pill && (
        <motion.span
          aria-hidden
          initial={false}
          animate={{
            x: pill.x,
            y: pill.y,
            width: pill.width,
            height: pill.height,
          }}
          transition={pill.glide && !reduced ? SPRING_LAYOUT : { duration: 0 }}
          className={cn(
            "absolute top-0 left-0 rounded-full bg-accent",
            classNames?.indicator,
          )}
        />
      )}
      {items.map((o) => {
        const checked = o.value === value;
        const off = disabled || o.disabled;
        const iconOnly = o.label === null;
        return (
          <label
            key={o.value}
            data-checked={checked || undefined}
            className={cn(
              "relative flex shrink-0 cursor-pointer items-center justify-center rounded-full font-mono whitespace-nowrap select-none",
              "transition-colors duration-150 ease-out",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-ring",
              SIZES[size],
              iconOnly && "aspect-square px-0",
              fill && "flex-1",
              checked
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80",
              off && "pointer-events-none opacity-50",
              classNames?.option,
            )}
          >
            <input
              type="radio"
              className="sr-only"
              name={name ?? autoName}
              value={o.value}
              checked={checked}
              disabled={off}
              aria-label={iconOnly ? o.value : undefined}
              onChange={() => setValue(o.value)}
            />
            {o.icon && (
              <span aria-hidden className="relative flex">
                {o.icon}
              </span>
            )}
            {!iconOnly && <span className="relative">{o.label ?? o.value}</span>}
          </label>
        );
      })}
    </div>
  );
}

export const Tabs = React.forwardRef(TabsInner) as (<
  const O extends TabsOptions,
>(
  props: TabsProps<O> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement) & { displayName?: string };
Tabs.displayName = "Tabs";
