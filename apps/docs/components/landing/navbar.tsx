"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { IconArrowRight, IconClose, IconHamburgerMenu } from "@devigner-ui/icons";
import { cn } from "cn";
import {
  SPRING_LAYOUT,
  SPRING_PANEL,
  SPRING_PRESS,
  SPRING_RETRACT,
} from "@devignerui/ui/motion";
import { ThemeToggle } from "../theme-provider";
import { lenisRef } from "./smooth-scroll";

const LINKS = [
  { label: "Components", href: "/components" },
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/#pricing" },
  {
    label: "GitHub",
    href: "https://github.com/devignerui/devignerui",
    external: true,
  },
];

/** The mark: a cobalt tile with the display-face "d". Shared by nav + footer. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display text-[19px] font-bold tracking-[-0.03em] text-foreground",
        className,
      )}
    >
      <span className="grid size-7 place-items-center rounded-[9px] bg-brand pb-0.5 text-[17px] leading-none text-brand-foreground">
        d
      </span>
      devigner
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // State flips only when the 24px line is crossed, not on every scroll frame.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    if (y > 24 !== scrolled) setScrolled(y > 24);
  });

  useEffect(() => {
    if (!open) return;
    lenisRef.current?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      lenisRef.current?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) =>
    href !== "/" && !href.startsWith("/#") && pathname.startsWith(href);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300 ease-out",
        scrolled || open
          ? "border-border bg-background/80 backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5"
      >
        <Link
          href="/"
          onClick={() => setOpen(false)}
          aria-label="Devigner home"
          className="rounded-lg"
        >
          <BrandMark />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <li key={l.label} className="relative">
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                    className="absolute inset-0 rounded-full bg-surface-hover"
                  />
                )}
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  {...(l.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className={cn(
                    "relative block rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors duration-200",
                    active
                      ? "text-foreground"
                      : "text-text-secondary hover:text-foreground",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/docs/installation"
            className="group hidden h-9 items-center gap-1.5 rounded-full bg-foreground pr-3 pl-4 text-[14px] font-medium text-background transition-transform duration-200 ease-out active:scale-[0.97] md:inline-flex"
          >
            Get started
            <IconArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
          </Link>
          <motion.button
            type="button"
            whileTap={reduce ? undefined : { scale: 0.92 }}
            transition={SPRING_PRESS}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-9 place-items-center rounded-full border border-border text-foreground md:hidden"
          >
            {open ? (
              <IconClose className="size-4.5" />
            ) : (
              <IconHamburgerMenu className="size-4.5" />
            )}
          </motion.button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={reduce ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0, transition: SPRING_PANEL }}
            exit={
              reduce
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0, y: -8, transition: SPRING_RETRACT }
            }
            className="h-[calc(100dvh-4rem)] border-t border-border bg-background px-5 pt-4 pb-10 md:hidden"
          >
            <ul className="flex flex-col">
              {LINKS.map((l) => (
                <li key={l.label} className="border-b border-border">
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    {...(l.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="block py-5 font-display text-3xl font-bold tracking-[-0.03em] text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/docs/installation"
              onClick={() => setOpen(false)}
              className="mt-8 flex h-13 items-center justify-center gap-2 rounded-full bg-foreground text-[15px] font-medium text-background active:scale-[0.98]"
            >
              Get started
              <IconArrowRight className="size-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
