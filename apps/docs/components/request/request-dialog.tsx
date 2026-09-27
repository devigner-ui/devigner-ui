"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconClose } from "@devigner-ui/icons";
import { EASE_OUT, SPRING_PANEL } from "devignerui/motion";
import { cn } from "cn";

const smQuery = "(min-width: 640px)";
function useIsSm() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(smQuery);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(smQuery).matches,
    () => true,
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** A modal on desktop, a bottom sheet on phones. Centred modals keep a
 *  centred origin; the sheet rises from the edge it is attached to. Exits are
 *  shorter than entrances: nobody waits to watch a panel leave. */
export function RequestDialog({
  open,
  onClose,
  title,
  view = "main",
  bare = false,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Changing it swaps the panel: the old one scales out, the new one in,
   *  over the same backdrop. How the form hands over to its success note. */
  view?: string;
  /** No header row: for a panel that is its own message. */
  bare?: boolean;
  size?: "md" | "sm";
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const sm = useIsSm();
  const panel = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      // Keep Tab inside the dialog.
      const all = Array.from(
        panel.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (!all.length) return;
      const first = all[0];
      const last = all[all.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      back?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const hidden = reduce
    ? { opacity: 0 }
    : sm
      ? { opacity: 0, scale: 0.98 }
      : { y: "100%" };
  const shown = reduce
    ? { opacity: 1 }
    : sm
      ? { opacity: 1, scale: 1 }
      : { y: 0 };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            aria-hidden
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.2, ease: EASE_OUT },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.15, ease: EASE_OUT },
            }}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />
          {/* propagate: closing the dialog plays the panel's own exit too. */}
          <AnimatePresence mode="wait" initial={false} propagate>
            <motion.div
              key={view}
              // Focus moves in as each panel mounts: its marked element or
              // first field, not the close button. On mount rather than on
              // `view` change, since a swapped panel only mounts once the
              // old one has left.
              ref={(el) => {
                panel.current = el;
                if (el)
                  requestAnimationFrame(() =>
                    el
                      .querySelector<HTMLElement>("[data-autofocus], input, textarea")
                      ?.focus({ preventScroll: true }),
                  );
              }}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={hidden}
              animate={{
                ...shown,
                transition: reduce ? { duration: 0.15 } : SPRING_PANEL,
              }}
              exit={{
                ...hidden,
                transition: { duration: reduce ? 0.1 : 0.16, ease: EASE_OUT },
              }}
              className={cn(
                "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-background shadow-elevated sm:max-h-[min(88dvh,760px)] sm:rounded-3xl",
                size === "sm" ? "sm:max-w-sm" : "sm:max-w-xl",
              )}
            >
              {/* The sheet's grabber, so it reads as something that came up
                  from the edge. Decorative: close is the button. */}
              <span
                aria-hidden
                className="absolute top-2 left-1/2 z-10 h-1 w-9 -translate-x-1/2 rounded-full bg-border-hover sm:hidden"
              />
              {!bare && (
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border pt-4.5 pr-2 pb-2.5 pl-6 sm:py-3 sm:pr-3 sm:pl-7">
                  <h2 className="text-[19px] font-semibold tracking-tight text-foreground">
                    {title}
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="grid size-9 cursor-pointer place-items-center rounded-full text-text-muted transition-[color,background-color,scale] duration-150 ease-out hover:bg-surface hover:text-foreground active:scale-[0.94]"
                  >
                    <IconClose aria-hidden className="size-4.5" />
                  </button>
                </div>
              )}
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
