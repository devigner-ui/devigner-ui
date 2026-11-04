"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "cn";
import { EASE_ROLL, SPRING_PILL, TWEEN_LETTER } from "../lib/easing";
import { useControllableState } from "../lib/hooks/use-controllable-state";
import { useReducedMotionPreference } from "../lib/hooks/use-reduced-motion";

export interface MenuNotchLink {
  label: string;
  /** Renders a link; without it the item is a button. */
  href?: string;
  onSelect?: () => void;
}

export interface MenuNotchSection {
  /** Small heading above the links, such as "Legal". */
  label: string;
  links: MenuNotchLink[];
  /** "lg" for the main links (22.5px, a divider below), "sm" for the rest (16.5px). */
  size?: "lg" | "sm";
}

export interface MenuNotchSocial {
  /** Accessible name, such as "Instagram". */
  label: string;
  href: string;
  icon: React.ReactNode;
}

export type MenuNotchTheme = "light" | "dark";

export interface MenuNotchClassNames {
  /** The pill holding the toggle and theme button. */
  bar?: string;
  /** The panel the bar sits in, which grows open. */
  panel?: string;
  /** Every link and social icon. */
  link?: string;
}

export interface MenuNotchProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children" | "defaultValue"> {
  sections: MenuNotchSection[];
  socials?: MenuNotchSocial[];
  /** Heading above the social icons. */
  socialsLabel?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Theme the sun/moon button shows. Pass with onThemeChange. */
  theme?: MenuNotchTheme;
  /** Shows the sun/moon button; called with the theme to switch to. */
  onThemeChange?: (theme: MenuNotchTheme) => void;
  /** Toggle label while closed. */
  menuLabel?: string;
  /** Toggle label while open. */
  closeLabel?: string;
  classNames?: MenuNotchClassNames;
  /** Sizes the menu: the bar and panel width, w-103.5 (414px) by default. */
  className?: string;
}

/** Each letter of the toggle label starts this long after the one before. */
const LETTER_STAGGER = 0.05;
/** Blur a letter sharpens out of, px. */
const LETTER_BLUR = 3;
/** A link rolling to its hover copy: slow off the mark, then a long glide in. */
const ROLL = { duration: 0.6, ease: EASE_ROLL } as const;

/** A label whose letters blur into focus one after another when it changes.
 *  The label it replaces leaves at once, as on the original. */
function Letters({ text, animate }: { text: string; animate: boolean }) {
  return (
    <span aria-hidden className="flex">
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          className="whitespace-pre"
          initial={animate ? { opacity: 0, filter: `blur(${LETTER_BLUR}px)` } : false}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ ...TWEEN_LETTER, delay: i * LETTER_STAGGER }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

/** Two lines that cross into an X: the top one turns 135°, the bottom 45°. */
function Burger({ open, reduced }: { open: boolean; reduced: boolean }) {
  const t = reduced ? { duration: 0 } : SPRING_PILL;
  const line = "absolute inset-x-[0.75px] top-1/2 -mt-[0.75px] h-[1.5px] rounded-full bg-current";
  return (
    <span aria-hidden className="relative ml-[1.5px] size-[21px] shrink-0">
      <motion.span
        className={line}
        initial={false}
        animate={{ y: open ? 0 : -3.3, rotate: open ? 135 : 0 }}
        transition={t}
      />
      <motion.span
        className={line}
        initial={false}
        animate={{ y: open ? 0 : 3.3, rotate: open ? 45 : 0 }}
        transition={t}
      />
    </span>
  );
}

// Sun to moon, the same morph as the docs' theme toggle: the clip's notch
// sweeps across the sun (CSS d:path, with a translate fallback where d isn't
// animatable) while the core swells into the moon and the rays pull in.
const RAYS =
  "M18.3 3.2c0 1.3-1 2.3-2.3 2.3s-2.3-1-2.3-2.3S14.7.9 16 .9s2.3 1 2.3 2.3zm-4.6 25.6c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3-1 2.3-2.3 2.3-2.3-1-2.3-2.3zm15.1-10.5c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zM3.2 13.7c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3S.9 17.3.9 16s1-2.3 2.3-2.3zm5.8-7C9 7.9 7.9 9 6.7 9S4.4 8 4.4 6.7s1-2.3 2.3-2.3S9 5.4 9 6.7zm16.3 21c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zm2.4-21c0 1.3-1 2.3-2.3 2.3S23 7.9 23 6.7s1-2.3 2.3-2.3 2.4 1 2.4 2.3zM6.7 23C8 23 9 24 9 25.3s-1 2.3-2.3 2.3-2.3-1-2.3-2.3 1-2.3 2.3-2.3z";

/** Core and rays: they swell or pull in after the notch has moved, and on the
 *  way back to light they wait for it. */
const GROW =
  "origin-center motion-safe:transition-transform motion-safe:duration-[calc(var(--dur)*0.65)] motion-safe:ease-overshoot motion-safe:delay-[calc(var(--dur)*0.35)] motion-safe:group-data-[dark=true]/theme:delay-0";

/** Keyed off the button's data-dark, so it follows the theme prop. */
function ThemeIcon() {
  const clip = `menu-notch-theme-${React.useId()}`;
  return (
    <svg aria-hidden viewBox="0 0 32 32" fill="currentColor" className="size-6 [--dur:500ms]">
      <defs>
        <clipPath id={clip}>
          <path
            d="M0-11h25a1 1 0 0017 13v30H0Z"
            className="motion-safe:transition-[d,translate] motion-safe:duration-[calc(var(--dur)*0.6)] motion-safe:ease-out motion-safe:group-data-[dark=true]/theme:ease-overshoot motion-safe:group-data-[dark=true]/theme:delay-[calc(var(--dur)*0.4)] group-data-[dark=true]/theme:[d:path('M0_0h15A1_1_0_0032_15v17H0Z')] group-data-[dark=true]/theme:not-supports-[d:path('M0_0')]:-translate-x-1.25 group-data-[dark=true]/theme:not-supports-[d:path('M0_0')]:translate-y-2.75"
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <circle cx={16} cy={16} r={8.4} className={`${GROW} group-data-[dark=true]/theme:scale-160`} />
        <path d={RAYS} className={`${GROW} group-data-[dark=true]/theme:scale-75`} />
      </g>
    </svg>
  );
}

/** Rolls its content up and out on hover or focus while a copy rolls in from
 *  below; leaving rolls it back. The mask is one line tall. */
function Roll({
  children,
  active,
  reduced,
}: {
  children: React.ReactNode;
  active: boolean;
  reduced: boolean;
}) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        className="relative block"
        initial={false}
        animate={{ y: active && !reduced ? "-100%" : "0%" }}
        transition={ROLL}
      >
        {children}
        <span aria-hidden className="absolute inset-x-0 top-full">
          {children}
        </span>
      </motion.span>
    </span>
  );
}

export const MenuNotch = React.forwardRef<HTMLElement, MenuNotchProps>(function MenuNotch(
  {
    sections,
    socials,
    socialsLabel = "Social media",
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    theme = "light",
    onThemeChange,
    menuLabel = "Menu",
    closeLabel = "Close",
    classNames,
    className,
    "aria-label": ariaLabel = "Main",
    ...rest
  },
  ref,
) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onValueChange: onOpenChange,
  });
  const reduced = useReducedMotionPreference();
  const rootRef = React.useRef<HTMLElement | null>(null);
  const contentId = React.useId();
  const [hovered, setHovered] = React.useState<string | null>(null);
  // Letters only blur in after a toggle, never on the first paint.
  const [toggled, setToggled] = React.useState(false);

  const toggle = () => {
    setToggled(true);
    setOpen(!open);
  };

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, setOpen]);

  const roll = (id: string) => ({
    onPointerEnter: () => setHovered(id),
    onPointerLeave: () => setHovered((h) => (h === id ? null : h)),
    onFocus: () => setHovered(id),
    onBlur: () => setHovered((h) => (h === id ? null : h)),
  });
  // Color warms to the hover tint slower than the roll; theme switches fade
  // every surface over half a second, the pill on a quicker start.
  const fade = "transition-colors duration-500 ease-tint";
  const linkClass = cn(
    "block cursor-pointer text-left outline-none transition-colors duration-400 ease-tint hover:text-primary focus-visible:text-primary",
    classNames?.link,
  );

  const label = open ? closeLabel : menuLabel;

  return (
    <nav
      ref={(el) => {
        rootRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      aria-label={ariaLabel}
      {...rest}
      className={cn("relative h-19.5 w-103.5", className)}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-50 rounded-[30px] bg-background p-2.25",
          fade,
          classNames?.panel,
        )}
      >
        <div
          className={cn(
            "flex h-15 items-center justify-between rounded-[21px] bg-foreground pr-2.25 pl-6 text-background transition-colors duration-500 ease-out",
            classNames?.bar,
          )}
        >
          <button
            type="button"
            aria-expanded={open}
            aria-controls={contentId}
            aria-label={label}
            onClick={toggle}
            className="-ml-6 flex cursor-pointer items-center gap-[6.75px] self-stretch rounded-[21px] pr-3 pl-6 text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Burger open={open} reduced={reduced} />
            <Letters key={label} text={label} animate={toggled && !reduced} />
          </button>
          {onThemeChange && (
            <button
              type="button"
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              data-dark={theme === "dark"}
              onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
              className="group/theme grid size-10.5 cursor-pointer place-items-center rounded-full border border-background/25 outline-none transition-colors duration-500 ease-out focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ThemeIcon />
            </button>
          )}
        </div>

        <motion.div
          id={contentId}
          inert={!open}
          aria-hidden={!open || undefined}
          className="overflow-hidden"
          initial={false}
          animate={{ height: open ? "auto" : 0 }}
          transition={reduced ? { duration: 0 } : SPRING_PILL}
        >
          <div className="px-5.25 pt-[34.6px] pb-[35.4px]">
            {sections.map((section, s) => {
              const lg = section.size === "lg";
              const headingId = `${contentId}-s${s}`;
              return (
                <div key={s}>
                  <p
                    id={headingId}
                    className={cn("text-[15px]/[22.5px] text-muted-foreground", fade)}
                  >
                    {section.label}
                  </p>
                  <ul
                    aria-labelledby={headingId}
                    className={cn(
                      "mt-2 flex flex-col font-medium",
                      lg ? "gap-[7.5px] text-[22.5px]/[33.75px]" : "gap-[9.3px] text-[16.5px]/[24.75px]",
                    )}
                  >
                    {section.links.map((link, i) => {
                      const id = `${s}-${i}`;
                      const content = (
                        <Roll active={hovered === id} reduced={reduced}>
                          {link.label}
                        </Roll>
                      );
                      return (
                        <li key={i} className="flex">
                          {link.href ? (
                            <a href={link.href} onClick={link.onSelect} className={linkClass} {...roll(id)}>
                              {content}
                            </a>
                          ) : (
                            <button type="button" onClick={link.onSelect} className={linkClass} {...roll(id)}>
                              {content}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {lg ? (
                    <div aria-hidden className={cn("mt-[25px] mb-[25.4px] h-px bg-foreground/8", fade)} />
                  ) : (
                    s < sections.length - 1 || socials?.length ? <div className="h-[25.5px]" /> : null
                  )}
                </div>
              );
            })}
            {socials && socials.length > 0 && (
              <div>
                <p className={cn("text-[15px]/[22.5px] text-muted-foreground", fade)}>{socialsLabel}</p>
                <ul className="mt-[9.6px] flex gap-3">
                  {socials.map((social, i) => {
                    const id = `social-${i}`;
                    return (
                      <li key={i} className="flex">
                        <a
                          href={social.href}
                          aria-label={social.label}
                          className={cn(linkClass, "[&_svg]:size-5")}
                          {...roll(id)}
                        >
                          <Roll active={hovered === id} reduced={reduced}>
                            <span className="grid size-5 place-items-center">{social.icon}</span>
                          </Roll>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </nav>
  );
});

MenuNotch.displayName = "MenuNotch";
